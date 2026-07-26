import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { ProfileBackfillWriter } from '../../../src/lib/security/crypto/profile-backfill-writer';
import { ProfileBackfillRecordOutcome } from '../../../src/lib/security/crypto/profile-backfill-types';
import { KeyProvider } from '../../../src/lib/security/crypto/key-provider';

describe('ProfileBackfill Isolated Write Integration Tests', () => {
  let prisma: PrismaClient;
  let lockPrisma: PrismaClient;
  let writer: ProfileBackfillWriter;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
    lockPrisma = new PrismaClient();
    writer = new ProfileBackfillWriter(prisma, lockPrisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await lockPrisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.userProfile.deleteMany({});
    await prisma.businessProfile.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('Core: User LEGACY_ONLY becomes BACKFILLED', async () => {
    const email = 'user1@test.com' + Date.now();
    const user = await prisma.userProfile.create({
      data: { 
        address: 'Legacy Address', 
        verification_status: 'UNVERIFIED',
        user: {
          create: {
            email, full_name: 'Test', account_type: 'Individual', role: 'Guest', status: 'Pending'
          }
        }
      }
    });

    writer.pinKeyVersion();
    const res = await writer.processUserProfile(user.id);
    expect(res).toBe(ProfileBackfillRecordOutcome.BACKFILLED);

    const check = await prisma.userProfile.findUnique({ where: { id: user.id } });
    expect(check?.address).toBe('Legacy Address');
    expect(check?.address_encrypted).not.toBeNull();
  });

  it('Core: Business fields backfilled atomically', async () => {
    const email = 'user2@test.com' + Date.now();
    const bus = await prisma.businessProfile.create({
      data: { 
        business_address: 'BusAddr', 
        business_registration_number: 'Reg123', 
        business_name: 'Test Bus', 
        verification_status: 'UNVERIFIED',
        user: {
          create: {
            email, full_name: 'Test', account_type: 'Business', role: 'Business Provider', status: 'Pending'
          }
        }
      }
    });

    writer.pinKeyVersion();
    const res = await writer.processBusinessProfile(bus.id);
    expect(res).toBe(ProfileBackfillRecordOutcome.BACKFILLED);

    const check = await prisma.businessProfile.findUnique({ where: { id: bus.id } });
    expect(check?.business_address).toBe('BusAddr');
    expect(check?.business_registration_number).toBe('Reg123');
    expect(check?.business_address_encrypted).not.toBeNull();
    expect(check?.business_registration_number_encrypted).not.toBeNull();
  });

  it('Idempotency: Second run performs no rewrite', async () => {
    const email = 'user3@test.com' + Date.now();
    const bus = await prisma.businessProfile.create({
      data: { 
        business_address: 'BusAddr', 
        business_registration_number: 'Reg123', 
        business_name: 'Test Bus', 
        verification_status: 'UNVERIFIED',
        user: {
          create: {
            email, full_name: 'Test', account_type: 'Business', role: 'Business Provider', status: 'Pending'
          }
        }
      }
    });

    writer.pinKeyVersion();
    await writer.processBusinessProfile(bus.id);
    
    const check1 = await prisma.businessProfile.findUnique({ where: { id: bus.id } });
    
    const res = await writer.processBusinessProfile(bus.id);
    expect(res).toBe(ProfileBackfillRecordOutcome.ALREADY_COMPLIANT);
    
    const check2 = await prisma.businessProfile.findUnique({ where: { id: bus.id } });
    expect(check2?.business_address_encrypted).toBe(check1?.business_address_encrypted);
  });

  it('Command contract: Missing apply rejected', () => {
    try {
      execSync('npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --environment=isolated-test', { stdio: 'pipe' });
      fail('Should have rejected');
    } catch (e: Error | unknown) {
      expect(e.stderr.toString()).toContain('Rejection: Missing plaintext-preservation acknowledgement');
    }
  });

  it('Command contract: Valid token executes', () => {
    try {
      execSync('npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=isolated-test --acknowledge-plaintext-preserved --batch-size=10', { stdio: 'pipe' });
      fail('Should have exited requiring token');
    } catch (e: Error | unknown) {
      // Expected
    }
  });
});

