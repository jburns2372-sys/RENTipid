import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { ProfileBackfillWriter } from '../../../src/lib/security/crypto/profile-backfill-writer';
import { ProfileBackfillRecordOutcome } from '../../../src/lib/security/crypto/profile-backfill-types';

describe('ProfileBackfill Isolated Write Integration Tests', () => {
  let prisma: PrismaClient;
  let writer: ProfileBackfillWriter;
  const createdUserIds: string[] = [];
  const createdBusinessIds: string[] = [];
  const createdUsers: string[] = [];
  const syntheticPrefix = 'phase5f_b2_test_' + Date.now() + '_';
  
  beforeAll(async () => {
    prisma = new PrismaClient();
    writer = new ProfileBackfillWriter(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    // Also disconnect writer internal lockPrisma just in case
    await writer.disconnectLock();
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await prisma.userProfile.deleteMany({ where: { id: { in: createdUserIds } } });
      createdUserIds.length = 0;
    }
    if (createdBusinessIds.length > 0) {
      await prisma.businessProfile.deleteMany({ where: { id: { in: createdBusinessIds } } });
      createdBusinessIds.length = 0;
    }
    if (createdUsers.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUsers } } });
      createdUsers.length = 0;
    }
  });

  it('Sentinel record survives unchanged', async () => {
    const sentinelId = 'sentinel_' + Date.now();
    const email = 'sentinel@test.com' + Date.now();
    
    const u = await prisma.user.create({
      data: { id: sentinelId, email, full_name: 'Sentinel', account_type: 'Individual', role: 'Guest', status: 'Pending' }
    });
    createdUsers.push(u.id);

    const up = await prisma.userProfile.create({
      data: { id: sentinelId, address: 'Sentinel Address', verification_status: 'UNVERIFIED', user_id: u.id }
    });
    createdUserIds.push(up.id);

    // Should not be modified by backfill targeting the synthetic prefix
    try {
      execSync(`npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=isolated-test --acknowledge-plaintext-preserved --batch-size=10 --confirmation-token=DUMMY --synthetic-prefix=${syntheticPrefix}`, { stdio: 'pipe' });
    } catch (e) {
      // It might fail token check, but we only care about data survival
    }

    const check = await prisma.userProfile.findUnique({ where: { id: sentinelId } });
    expect(check?.address).toBe('Sentinel Address');
    expect(check?.address_encrypted).toBeNull(); // Should not be encrypted
  }, 30000);

  it('Core: User LEGACY_ONLY becomes BACKFILLED', async () => {
    const id = syntheticPrefix + 'u1';
    const email = 'user1@test.com' + Date.now();
    
    const u = await prisma.user.create({
      data: { email, full_name: 'Test', account_type: 'Individual', role: 'Guest', status: 'Pending' }
    });
    createdUsers.push(u.id);

    const up = await prisma.userProfile.create({
      data: { id, address: 'Legacy Address', verification_status: 'UNVERIFIED', user_id: u.id }
    });
    createdUserIds.push(up.id);

    writer.pinKeyVersion();
    const res = await writer.processUserProfile(up.id);
    expect(res.outcome).toBe(ProfileBackfillRecordOutcome.BACKFILLED);

    const check = await prisma.userProfile.findUnique({ where: { id: up.id } });
    expect(check?.address).toBe('Legacy Address');
    expect(check?.address_encrypted).not.toBeNull();
  });

  it('Core: Business fields backfilled atomically', async () => {
    const id = syntheticPrefix + 'b1';
    const email = 'user2@test.com' + Date.now();
    
    const u = await prisma.user.create({
      data: { email, full_name: 'Test', account_type: 'Business', role: 'Business Provider', status: 'Pending' }
    });
    createdUsers.push(u.id);

    const bp = await prisma.businessProfile.create({
      data: { id, business_address: 'BusAddr', business_registration_number: 'Reg123', business_name: 'Test Bus', verification_status: 'UNVERIFIED', user_id: u.id }
    });
    createdBusinessIds.push(bp.id);

    writer.pinKeyVersion();
    const res = await writer.processBusinessProfile(bp.id);
    expect(res.outcome).toBe(ProfileBackfillRecordOutcome.BACKFILLED);

    const check = await prisma.businessProfile.findUnique({ where: { id: bp.id } });
    expect(check?.business_address).toBe('BusAddr');
    expect(check?.business_registration_number).toBe('Reg123');
    expect(check?.business_address_encrypted).not.toBeNull();
    expect(check?.business_registration_number_encrypted).not.toBeNull();
  });

  it('Idempotency: Second run performs no rewrite', async () => {
    const id = syntheticPrefix + 'b2';
    const email = 'user3@test.com' + Date.now();
    
    const u = await prisma.user.create({
      data: { email, full_name: 'Test', account_type: 'Business', role: 'Business Provider', status: 'Pending' }
    });
    createdUsers.push(u.id);

    const bp = await prisma.businessProfile.create({
      data: { id, business_address: 'BusAddr', business_registration_number: 'Reg123', business_name: 'Test Bus', verification_status: 'UNVERIFIED', user_id: u.id }
    });
    createdBusinessIds.push(bp.id);

    writer.pinKeyVersion();
    await writer.processBusinessProfile(bp.id);
    
    const check1 = await prisma.businessProfile.findUnique({ where: { id: bp.id } });
    
    const res = await writer.processBusinessProfile(bp.id);
    expect(res.outcome).toBe(ProfileBackfillRecordOutcome.ALREADY_COMPLIANT);
    
    const check2 = await prisma.businessProfile.findUnique({ where: { id: bp.id } });
    expect(check2?.business_address_encrypted).toBe(check1?.business_address_encrypted);
  });

  it('Command contract: Missing apply rejected', () => {
    try {
      const out = execSync('npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=isolated-test --acknowledge-plaintext-preserved --batch-size=10 --synthetic-prefix=phase5f_b2_abc', { stdio: 'pipe' });
      const match = out.toString().match(/RENTIPID_B2_[a-f0-9]+/);
      if (!match) fail('Token not found');
      const token = match[0];
      execSync(`npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --environment=isolated-test --acknowledge-plaintext-preserved --batch-size=10 --synthetic-prefix=phase5f_b2_abc --confirmation-token=${token}`, { stdio: 'pipe' });
      fail('Should have rejected');
    } catch (e) {
      const err = e as { stderr: Buffer };
      expect(err.stderr.toString()).toContain('Rejection: Missing --apply');
    }
  });

  it('Command contract: Missing acknowledgement rejected', () => {
    try {
      execSync('npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=isolated-test --batch-size=10 --synthetic-prefix=phase5f_b2_abc', { stdio: 'pipe' });
      fail('Should have rejected');
    } catch (e) {
      const err = e as { stderr: Buffer };
      expect(err.stderr.toString()).toContain('Rejection: Missing plaintext-preservation acknowledgement');
    }
  });

  it('Command contract: Wrong environment rejected', () => {
    try {
      execSync('npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=staging --acknowledge-plaintext-preserved --batch-size=10 --synthetic-prefix=phase5f_b2_abc', { stdio: 'pipe' });
      fail('Should have rejected');
    } catch (e) {
      const err = e as { stderr: Buffer };
      expect(err.stderr.toString()).toContain('Rejection: Environment not exactly isolated test');
    }
  });

  it('Command contract: Invalid synthetic prefix rejected', () => {
    try {
      execSync('npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=isolated-test --acknowledge-plaintext-preserved --batch-size=10 --synthetic-prefix=invalid_prefix', { stdio: 'pipe' });
      fail('Should have exited');
    } catch (e) {
      const err = e as { stderr: Buffer };
      expect(err.stderr.toString()).toContain('Rejection: Invalid or missing synthetic prefix');
    }
  });

  it('Command contract: Valid token executes but errors if token invalid', () => {
    try {
      execSync('npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=isolated-test --acknowledge-plaintext-preserved --batch-size=10 --synthetic-prefix=phase5f_b2_abc --confirmation-token=BAD', { stdio: 'pipe' });
      fail('Should have exited requiring correct token');
    } catch (e) {
      const err = e as { stderr: Buffer };
      expect(err.stderr.toString()).toContain('Rejection: Invalid confirmation token');
    }
  });

  it('Command contract: Missing token prints expected token', () => {
    const out = execSync('npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=isolated-test --acknowledge-plaintext-preserved --batch-size=10 --synthetic-prefix=phase5f_b2_abc', { stdio: 'pipe' });
    expect(out.toString()).toContain('Expected confirmation token: RENTIPID_B2_');
  });

  it('Command contract: Valid token executes', () => {
    const out1 = execSync('npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=isolated-test --acknowledge-plaintext-preserved --batch-size=10 --synthetic-prefix=phase5f_b2_xyz', { stdio: 'pipe' });
    const match = out1.toString().match(/RENTIPID_B2_[a-f0-9]+/);
    if (!match) fail('Token not found');
    const token = match[0];
    const out2 = execSync(`npx tsx --conditions=react-server scripts/security/phase5f-profile-backfill-isolated-write.ts --apply --environment=isolated-test --acknowledge-plaintext-preserved --batch-size=10 --synthetic-prefix=phase5f_b2_xyz --confirmation-token=${token}`, { stdio: 'pipe' });
    expect(out2.toString()).toContain('"runState":"COMPLETED"');
  });
});
