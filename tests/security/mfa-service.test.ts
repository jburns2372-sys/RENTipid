import { randomBytes } from 'crypto';
process.env.MFA_ENCRYPTION_KEY_ID = 'test_v1';
process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString('hex');
import { MfaService } from '../../src/lib/security/auth/mfa-service';
import { PrismaClient } from '@prisma/client';

jest.mock('otplib', () => {
  const generateSecret = jest.fn(() => 'MOCKED_SECRET_12345678');
  const generateURI = jest.fn(() => `otpauth://totp/RENTipid:test@example.com?secret=MOCKED_SECRET_12345678&issuer=RENTipid`);
  const verifySync = jest.fn(({ token, secret }) => ({ valid: token === '123456' && secret === 'MOCKED_SECRET_12345678' }));
  return {
    generateSecret,
    generateURI,
    verifySync,
    authenticator: {
      generateSecret,
      keyuri: jest.fn(() => `otpauth://totp/RENTipid:test@example.com?secret=MOCKED_SECRET_12345678&issuer=RENTipid`),
      generate: jest.fn(() => '123456'),
      verify: jest.fn(({ token, secret }) => token === '123456' && secret === 'MOCKED_SECRET_12345678')
    }
  };
});

const prisma = new PrismaClient();

describe('MfaService', () => {
  let testUserId: string;
  const testUserEmail = 'mfa_test@example.com';

  beforeAll(async () => {
    // Create a test user for MFA tests
    const user = await prisma.user.create({
      data: {
        email: testUserEmail,
        full_name: 'MFA Test User',
        account_type: 'Individual',
        role: 'Renter',
        status: 'Verified',
        password_hash: 'dummy_hash'
      }
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.userMfa.deleteMany({ where: { user_id: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset MFA state for the user before each test
    await prisma.userMfa.deleteMany({ where: { user_id: testUserId } });
  });

  it('generates enrollment and persists seed encrypted only', async () => {
    const { secret, otpauthUrl } = await MfaService.generateEnrollment(testUserId, testUserEmail);
    
    expect(secret).toBeDefined();
    expect(otpauthUrl).toContain('RENTipid');
    
    const dbMfa = await prisma.userMfa.findUnique({ where: { user_id: testUserId } });
    expect(dbMfa).toBeDefined();
    expect(dbMfa?.status).toBe('ENROLLMENT_PENDING');
    
    // Ensure plaintext seed is not stored
    expect(dbMfa?.envelope_ciphertext).toBeDefined();
    expect(dbMfa?.envelope_ciphertext).not.toContain(secret);
    expect(dbMfa?.envelope_nonce).toBeDefined();
    expect(dbMfa?.envelope_auth_tag).toBeDefined();
    expect(JSON.stringify(dbMfa)).not.toContain(secret);
  });

  it('rejects activation with invalid challenge', async () => {
    await MfaService.generateEnrollment(testUserId, testUserEmail);
    
    await expect(MfaService.activateMfa(testUserId, '000000')).rejects.toThrow('Invalid TOTP token.');
    
    const dbMfa = await prisma.userMfa.findUnique({ where: { user_id: testUserId } });
    expect(dbMfa?.status).toBe('ENROLLMENT_PENDING'); // State remains pending
  });

  it('activates MFA with valid challenge', async () => {
    const { secret } = await MfaService.generateEnrollment(testUserId, testUserEmail);
    const token = '123456';
    
    const { recoveryCodes } = await MfaService.activateMfa(testUserId, token);
    
    expect(recoveryCodes.length).toBe(10);
    
    const dbMfa = await prisma.userMfa.findUnique({ where: { user_id: testUserId } });
    expect(dbMfa?.status).toBe('ENABLED');
    expect(dbMfa?.recovery_code_hashes.length).toBe(10);
    
    // Ensure recovery codes are stored as hashes, not plaintext
    const plaintextFound = dbMfa?.recovery_code_hashes.some(hash => recoveryCodes.includes(hash));
    expect(plaintextFound).toBe(false);
  });

  it('rejects replay of recovery code', async () => {
    const { secret } = await MfaService.generateEnrollment(testUserId, testUserEmail);
    const token = '123456';
    const { recoveryCodes } = await MfaService.activateMfa(testUserId, token);
    
    const codeToUse = recoveryCodes[0];
    
    // First use should succeed
    const firstUse = await MfaService.verifyRecoveryCode(testUserId, codeToUse);
    expect(firstUse).toBe(true);
    
    // Second use should fail
    const secondUse = await MfaService.verifyRecoveryCode(testUserId, codeToUse);
    expect(secondUse).toBe(false);
  });

  it('invalidates old codes on regeneration', async () => {
    const { secret } = await MfaService.generateEnrollment(testUserId, testUserEmail);
    const token = '123456';
    const { recoveryCodes: oldCodes } = await MfaService.activateMfa(testUserId, token);
    
    const { recoveryCodes: newCodes } = await MfaService.regenerateRecoveryCodes(testUserId);
    
    expect(newCodes.length).toBe(10);
    
    // Old code should fail
    const oldCodeResult = await MfaService.verifyRecoveryCode(testUserId, oldCodes[0]);
    expect(oldCodeResult).toBe(false);
    
    // New code should succeed
    const newCodeResult = await MfaService.verifyRecoveryCode(testUserId, newCodes[0]);
    expect(newCodeResult).toBe(true);
  });

  it('reset invalidates session-security state', async () => {
    const { secret } = await MfaService.generateEnrollment(testUserId, testUserEmail);
    const token = '123456';
    await MfaService.activateMfa(testUserId, token);
    
    await MfaService.resetMfa(testUserId);
    
    const dbMfa = await prisma.userMfa.findUnique({ where: { user_id: testUserId } });
    expect(dbMfa?.status).toBe('DISABLED');
    expect(dbMfa?.reset_at).toBeDefined();
    expect(dbMfa?.recovery_code_hashes.length).toBe(0);
    expect(dbMfa?.envelope_ciphertext).toBe('');
  });
});
