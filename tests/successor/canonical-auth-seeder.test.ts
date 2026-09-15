import { PrismaClient } from '@prisma/client';
import {
  upsertSeededEmailPasswordUser,
  assertSafeLocalSeedDatabase,
} from '../../src/lib/auth/seed/upsert-seeded-user';
import { canonicalizeEmail } from '../../src/lib/auth/unified/identifiers';
import bcrypt from 'bcryptjs';

describe('Canonical Auth Seeder Suite (G1 Gate)', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Guard & Rejection Tests
  describe('Environment & Safety Guard', () => {
    it('accepts loopback local test/dev database target', async () => {
      const result = await assertSafeLocalSeedDatabase(prisma);
      expect(result.databaseName).toBeDefined();
    });

    it('rejects execution when target database name indicates production', async () => {
      const mockPrisma = {
        $queryRaw: jest.fn().mockResolvedValue([
          { db_name: 'rentipid_production', server_addr: '127.0.0.1/32' }
        ])
      } as unknown as PrismaClient;

      await expect(assertSafeLocalSeedDatabase(mockPrisma))
        .rejects.toThrow(/\[SECURITY_FAIL_CLOSED\]/);
    });

    it('rejects execution when target host is non-loopback remote', async () => {
      const mockPrisma = {
        $queryRaw: jest.fn().mockResolvedValue([
          { db_name: 'rentipid_local_dev', server_addr: '192.168.1.50/32' }
        ])
      } as unknown as PrismaClient;

      await expect(assertSafeLocalSeedDatabase(mockPrisma))
        .rejects.toThrow(/non-loopback/);
    });

    it('rejects execution when preview database target is provided', async () => {
      const mockPrisma = {
        $queryRaw: jest.fn().mockResolvedValue([
          { db_name: 'rentipid_preview', server_addr: '127.0.0.1/32' }
        ])
      } as unknown as PrismaClient;

      await expect(assertSafeLocalSeedDatabase(mockPrisma))
        .rejects.toThrow(/\[SECURITY_FAIL_CLOSED\]/);
    });
  });

  // 2. Normalization & Idempotency Tests
  describe('Normalization & Lifecycle', () => {
    const testEmail = `test.normalize.${Date.now()}@example.com`;

    afterEach(async () => {
      const normalized = canonicalizeEmail(testEmail);
      await prisma.emailCredential.deleteMany({ where: { normalized_email: normalized } });
      await prisma.user.deleteMany({ where: { email: normalized } });
    });

    it('normalizes email with whitespace and uppercase before persisting', async () => {
      const unnormalized = `  TEST.Normalize.${Date.now()}@EXAMPLE.com  `;
      const normalized = canonicalizeEmail(unnormalized);

      const result = await upsertSeededEmailPasswordUser(prisma, {
        email: unnormalized,
        fullName: 'Test Normalized User',
        role: 'Renter',
        status: 'Verified',
        plainPassword: 'TestPassword123!',
      });

      expect(result.email).toBe(normalized);

      const user = await prisma.user.findUnique({ where: { email: normalized } });
      expect(user).not.toBeNull();
      expect(user?.email).toBe(normalized);

      const cred = await prisma.emailCredential.findUnique({ where: { normalized_email: normalized } });
      expect(cred).not.toBeNull();
      expect(cred!.user_id).toBe(user?.id);

      // Cleanup
      await prisma.emailCredential.deleteMany({ where: { normalized_email: normalized } });
      await prisma.user.deleteMany({ where: { email: normalized } });
    });

    it('idempotently updates user without creating duplicate records or breaking credentials', async () => {
      const email = `test.idempotent.${Date.now()}@example.com`;
      const normalized = canonicalizeEmail(email);

      // Run 1: Create
      const res1 = await upsertSeededEmailPasswordUser(prisma, {
        email,
        fullName: 'Original Name',
        role: 'Renter',
        status: 'Pending',
        plainPassword: 'PasswordOne1!',
      });

      // Run 2: Update same user to Verified
      const res2 = await upsertSeededEmailPasswordUser(prisma, {
        email,
        fullName: 'Updated Name',
        role: 'Renter',
        status: 'Verified',
        plainPassword: 'PasswordTwo2!',
      });

      expect(res1.userId).toBe(res2.userId);

      const userCount = await prisma.user.count({ where: { email: normalized } });
      expect(userCount).toBe(1);

      const credCount = await prisma.emailCredential.count({ where: { normalized_email: normalized } });
      expect(credCount).toBe(1);

      const updatedUser = await prisma.user.findUnique({ where: { email: normalized } });
      expect(updatedUser?.full_name).toBe('Updated Name');
      expect(updatedUser?.status).toBe('Verified');

      // Verify updated password hash validates PasswordTwo2!
      const cred = await prisma.emailCredential.findUnique({ where: { normalized_email: normalized } });
      expect(cred).not.toBeNull();
      const matchesNew = await bcrypt.compare('PasswordTwo2!', cred!.password_hash);
      const matchesOld = await bcrypt.compare('PasswordOne1!', cred!.password_hash);
      expect(matchesNew).toBe(true);
      expect(matchesOld).toBe(false);

      // Cleanup
      await prisma.emailCredential.deleteMany({ where: { normalized_email: normalized } });
      await prisma.user.deleteMany({ where: { email: normalized } });
    });
  });

  // 3. Credential Consistency & Security Tests
  describe('Credential Integrity & Attack Rejection', () => {
    it('repairs missing EmailCredential if User existed with legacy password_hash', async () => {
      const email = `test.repair.${Date.now()}@example.com`;
      const normalized = canonicalizeEmail(email);
      const legacyHash = await bcrypt.hash('LegacyPass123!', 10);

      // Create raw User without companion EmailCredential (simulating legacy database posture)
      const rawUser = await prisma.user.create({
        data: {
          email: normalized,
          full_name: 'Legacy User',
          account_type: 'Individual',
          role: 'Renter',
          status: 'Verified',
          password_hash: legacyHash,
        }
      });

      // Verify no EmailCredential exists yet
      const credBefore = await prisma.emailCredential.findUnique({ where: { normalized_email: normalized } });
      expect(credBefore).toBeNull();

      // Upsert must detect and repair the missing EmailCredential
      const repaired = await upsertSeededEmailPasswordUser(prisma, {
        email,
        fullName: 'Repaired User',
        role: 'Renter',
        status: 'Verified',
        plainPassword: 'NewSecurePassword!',
      });

      expect(repaired.userId).toBe(rawUser.id);

      const credAfter = await prisma.emailCredential.findUnique({ where: { normalized_email: normalized } });
      expect(credAfter).not.toBeNull();
      expect(credAfter!.user_id).toBe(rawUser.id);
      expect(credAfter!.is_verified).toBe(true);

      // Cleanup
      await prisma.emailCredential.deleteMany({ where: { normalized_email: normalized } });
      await prisma.user.deleteMany({ where: { email: normalized } });
    });

    it('rejects conflicting ownership when EmailCredential belongs to a different userId', async () => {
      const emailA = `test.conflict.a.${Date.now()}@example.com`;
      const emailB = `test.conflict.b.${Date.now()}@example.com`;
      const normA = canonicalizeEmail(emailA);
      const normB = canonicalizeEmail(emailB);

      // User A
      const userA = await prisma.user.create({
        data: {
          email: normA,
          full_name: 'User A',
          account_type: 'Individual',
          role: 'Renter',
          status: 'Verified',
        }
      });

      // User B
      const userB = await prisma.user.create({
        data: {
          email: normB,
          full_name: 'User B',
          account_type: 'Individual',
          role: 'Renter',
          status: 'Verified',
        }
      });

      // Corrupt credential pointing normA to userB.id
      await prisma.emailCredential.create({
        data: {
          user_id: userB.id,
          normalized_email: normA,
          password_hash: 'dummy',
          is_verified: true,
        }
      });

      // Upserting for userA must fail-closed with CREDENTIAL_OWNERSHIP_MISMATCH
      await expect(
        upsertSeededEmailPasswordUser(prisma, {
          email: emailA,
          fullName: 'User A Attack',
          role: 'Renter',
          status: 'Verified',
          plainPassword: 'Password123!',
        })
      ).rejects.toThrow(/\[CREDENTIAL_OWNERSHIP_MISMATCH\]/);

      // Cleanup
      await prisma.emailCredential.deleteMany({ where: { normalized_email: normA } });
      await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    });

    it('does not log plain-text passwords during operations', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const secretPassword = 'SUPER_SECRET_UNLOGGED_PASSWORD_999!';

      await upsertSeededEmailPasswordUser(prisma, {
        email: `test.secret.log.${Date.now()}@example.com`,
        fullName: 'Secret Log Test',
        role: 'Renter',
        status: 'Verified',
        plainPassword: secretPassword,
      });

      const allLogs = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
      expect(allLogs).not.toContain(secretPassword);

      consoleSpy.mockRestore();
    });
  });
});
