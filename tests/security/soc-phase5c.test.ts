import { PrismaClient } from '@prisma/client';
import { MfaService } from '../../src/lib/security/auth/mfa-service';

jest.mock('otplib', () => ({
  generateSecret: () => 'MOCK_SECRET',
  generateURI: () => 'otpauth://totp/mock',
  authenticator: {
    generate: () => '123456'
  },
  verifySync: ({ token }: { token: string }) => ({ valid: token === '123456' })
}));

const prisma = new PrismaClient();

describe('PHASE5C - MFA Implementation Evidence', () => {
  let userId: string;
  let userEmail: string;
  let secret: string;
  let recoveryCodes: string[];

  beforeAll(async () => {
    const ts = Date.now();
    userEmail = `mfa-${ts}@example.com`;
    const u = await prisma.user.create({
      data: { email: userEmail, full_name: 'MFA User', account_type: 'Individual', role: 'Renter', status: 'Verified' }
    });
    userId = u.id;
  });

  afterAll(async () => {
    await prisma.userMfa.deleteMany({ where: { user_id: userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('authorized success: generates MFA enrollment', async () => {
    const res = await MfaService.generateEnrollment(userId, userEmail);
    expect(res.secret).toBeDefined();
    expect(res.otpauthUrl).toBeDefined();
    secret = res.secret;

    const mfa = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    expect(mfa?.status).toBe('ENROLLMENT_PENDING');
  });

  it('duplicate execution: fails to generate second enrollment', async () => {
    await expect(MfaService.generateEnrollment(userId, userEmail))
      .rejects.toThrow('MFA is already enrolled or pending.');
  });

  it('invalid input: fails activation with wrong token', async () => {
    await expect(MfaService.activateMfa(userId, '000000'))
      .rejects.toThrow('Invalid TOTP token.');
  });

  it('authorized success: activates MFA with valid token', async () => {
    const token = '123456';
    const res = await MfaService.activateMfa(userId, token);
    expect(res.recoveryCodes).toHaveLength(10);
    recoveryCodes = res.recoveryCodes;

    const mfa = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    expect(mfa?.status).toBe('ENABLED');
    expect(mfa?.recovery_codes_consumed).toBe(0);
  });

  it('unauthorized access: verifyMfa fails with invalid token', async () => {
    const isValid = await MfaService.verifyMfa(userId, '000000');
    expect(isValid).toBe(false);
  });

  it('authorized success: verifyMfa passes with valid token', async () => {
    const token = '123456';
    const isValid = await MfaService.verifyMfa(userId, token);
    expect(isValid).toBe(true);
  });

  it('safe failure without partial mutation: recovery code is consumed', async () => {
    const code = recoveryCodes[0];
    const isValid = await MfaService.verifyRecoveryCode(userId, code);
    expect(isValid).toBe(true);

    const mfa = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    expect(mfa?.recovery_codes_consumed).toBe(1);

    // Reuse should fail
    const isReuseValid = await MfaService.verifyRecoveryCode(userId, code);
    expect(isReuseValid).toBe(false);
    
    const mfaAfter = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    expect(mfaAfter?.recovery_codes_consumed).toBe(1); // No partial mutation
  });

  it('audit logging: verify audit logs were created', async () => {
    const logs = await prisma.authenticationSecurityLog.findMany({
      where: {
        event_code: {
          in: ['AUTH_MFA_ENROLLMENT_STARTED', 'AUTH_MFA_ACTIVATION_FAILED', 'AUTH_MFA_ACTIVATED', 'AUTH_MFA_VERIFICATION_FAILED', 'AUTH_MFA_VERIFIED', 'AUTH_MFA_RECOVERY_VERIFIED']
        },
        actor_user_id: userId
      }
    });
    // Just verify some logs were created by the service
    expect(logs.length).toBeGreaterThan(0);
  });

  it('transition: resetMfa disables MFA', async () => {
    await MfaService.resetMfa(userId);
    const mfa = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    expect(mfa?.status).toBe('DISABLED');
  });
});
