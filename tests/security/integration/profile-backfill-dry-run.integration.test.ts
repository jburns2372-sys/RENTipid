import { PrismaClient } from '@prisma/client';
import { ProfileBackfillDryRun } from '../../../src/lib/security/crypto/profile-backfill-dry-run';
import { KeyProvider } from '../../../src/lib/security/crypto/key-provider';
import { FakeKeyProvider } from '../crypto/fake-key-provider';
import { ProfileFieldProtection, ProfileFieldContext } from '../../../src/lib/security/crypto/profile-field-protection';

const prisma = new PrismaClient();

describe('ProfileBackfillDryRun Integration', () => {
  beforeAll(async () => {
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl.includes('test') && !dbUrl.includes('sandbox')) {
      throw new Error('Integration tests require test database');
    }
    KeyProvider.__setTestProvider(new FakeKeyProvider());
  });

  afterAll(async () => {
    await prisma.$disconnect();
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    // Synthetic records cleanup
    await prisma.userProfile.deleteMany({ where: { address: { startsWith: 'TEST-B1' } } });
    await prisma.userProfile.deleteMany({ where: { address: null } });
    await prisma.businessProfile.deleteMany({ where: { business_name: { startsWith: 'TEST-B1' } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-b1' } } });
  });

  afterEach(async () => {
    // Synthetic records cleanup
    await prisma.userProfile.deleteMany({ where: { address: { startsWith: 'TEST-B1' } } });
    await prisma.userProfile.deleteMany({ where: { address: null } });
    await prisma.businessProfile.deleteMany({ where: { business_name: { startsWith: 'TEST-B1' } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-b1' } } });
  });

  it('handles empty database correctly', async () => {
    const runner = new ProfileBackfillDryRun(prisma);
    const report = await runner.scan();
    expect(report.counters.totalProfilesScanned).toBe(0);
  });

  async function createTestUser(emailSuffix: string, address: string | null = null, encrypted: string | null = null) {
    const user = await prisma.user.create({
      data: {
        email: `test-b1-${emailSuffix}@example.com`,
        password_hash: 'hash',
        role: 'Renter',
        full_name: 'Test User',
        account_type: 'Individual',
        status: 'Active',
      }
    });

    await prisma.userProfile.create({
      data: {
        user_id: user.id,
        address: address,
        address_encrypted: encrypted,
        verification_status: 'Unverified'
      }
    });
  }

  async function createTestBusiness(emailSuffix: string, bAddress: string | null, bAddressEnc: string | null, bRegNum: string | null, bRegNumEnc: string | null) {
    const user = await prisma.user.create({
      data: {
        email: `test-b1-biz-${emailSuffix}@example.com`,
        password_hash: 'hash',
        role: 'Lessor',
        full_name: 'Test Business',
        account_type: 'Business',
        status: 'Active',
      }
    });

    await prisma.businessProfile.create({
      data: {
        user_id: user.id,
        business_name: `TEST-B1 Biz ${emailSuffix}`,
        verification_status: 'Unverified',
        business_address: bAddress,
        business_address_encrypted: bAddressEnc,
        business_registration_number: bRegNum,
        business_registration_number_encrypted: bRegNumEnc
      }
    });
  }

  it('classifies UserProfile states correctly', async () => {
    // ABSENT
    await createTestUser('1', null, null);
    // LEGACY_ONLY
    await createTestUser('2', 'TEST-B1 Legacy', null);
    // ENCRYPTED_ONLY
    await createTestUser('3', null, ProfileFieldProtection.protect('TEST-B1 Enc', ProfileFieldContext.USER_ADDRESS));
    // DUAL_MATCH
    await createTestUser('4', 'TEST-B1 Match', ProfileFieldProtection.protect('TEST-B1 Match', ProfileFieldContext.USER_ADDRESS));
    // DUAL_MISMATCH
    await createTestUser('5', 'TEST-B1 Mismatch', ProfileFieldProtection.protect('TEST-B1 Diff', ProfileFieldContext.USER_ADDRESS));
    // INVALID_CIPHERTEXT
    await createTestUser('6', 'TEST-B1 InvCiph', 'bad-data');
    // INVALID_LEGACY
    await createTestUser('7', 'TEST-B1 ' + 'A'.repeat(2000), null); 

    const runner = new ProfileBackfillDryRun(prisma);
    const report = await runner.scan();

    const c = report.counters;
    expect(c.absent).toBeGreaterThanOrEqual(1);
    expect(c.legacyOnly).toBeGreaterThanOrEqual(1);
    expect(c.encryptedOnly).toBeGreaterThanOrEqual(1);
    expect(c.dualMatch).toBeGreaterThanOrEqual(1);
    expect(c.dualMismatch).toBeGreaterThanOrEqual(1);
    expect(c.invalidCiphertext).toBeGreaterThanOrEqual(1);
    expect(c.invalidLegacy).toBeGreaterThanOrEqual(1);
  });

  it('classifies BusinessProfile multiple fields correctly', async () => {
    // Both absent
    await createTestBusiness('1', null, null, null, null);
    // Both legacy
    await createTestBusiness('2', 'TEST-B1 Addr', null, 'TEST-B1 Reg', null);
    // Mixed: one legacy, one dual-match
    await createTestBusiness('3', 
      'TEST-B1 Mixed Addr', null,
      'TEST-B1 Mixed Reg', ProfileFieldProtection.protect('TEST-B1 Mixed Reg', ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER)
    );

    const runner = new ProfileBackfillDryRun(prisma);
    const report = await runner.scan();

    const c = report.counters;
    expect(c.absent).toBeGreaterThanOrEqual(2);
    expect(c.legacyOnly).toBeGreaterThanOrEqual(3);
    expect(c.dualMatch).toBeGreaterThanOrEqual(1);
  });

  it('handles multiple batches with stable pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await createTestUser(`batch-${i}`, `TEST-B1 Batch ${i}`, null);
    }
    const runner = new ProfileBackfillDryRun(prisma);
    const report = await runner.scan(2); // batch size 2

    expect(report.counters.legacyOnly).toBeGreaterThanOrEqual(5);
    expect(report.counters.batchesProcessed).toBeGreaterThanOrEqual(3);
  });

  it('repeated dry runs return same result and do not mutate', async () => {
    await createTestUser('repeat', 'TEST-B1 Repeat', null);
    const runner = new ProfileBackfillDryRun(prisma);
    
    const r1 = await runner.scan();
    const r2 = await runner.scan();

    expect(r1.counters.legacyOnly).toBe(r2.counters.legacyOnly);
    expect(r1.counters.totalProfilesScanned).toBe(r2.counters.totalProfilesScanned);

    // Verify it returns no protected values
    const serialized = JSON.stringify(r1);
    expect(serialized).not.toContain('TEST-B1');
  });
});
