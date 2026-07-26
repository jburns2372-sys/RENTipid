import { randomBytes } from 'crypto';
process.env.MFA_ENCRYPTION_KEY_ID = 'test_v1';
process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString('hex');
import { requireSecurityPermission } from '../../src/lib/security/authorization';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation(() => { throw new Error('NEXT_REDIRECT'); })
}));

const prisma = new PrismaClient();

describe('Session Step-Up Controls', () => {
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'stepup_test@example.com',
        full_name: 'Step Up Test User',
        account_type: 'Individual',
        role: 'Super Admin', // Admin role usually has SOC permissions
        status: 'Verified',
        password_hash: 'dummy'
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
    jest.clearAllMocks();
    await prisma.userMfa.deleteMany({ where: { user_id: testUserId } });
    await prisma.user.update({
      where: { id: testUserId },
      data: { status: 'Verified', role: 'Super Admin' }
    });
  });

  it('denies access if account is disabled/suspended', async () => {
    await prisma.user.update({
      where: { id: testUserId },
      data: { status: 'Suspended' }
    });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId, iat: Math.floor(Date.now() / 1000) }
    });

    await expect(requireSecurityPermission('security.response.execute')).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('denies access if MFA step-up is missing', async () => {
    await prisma.userMfa.create({
      data: {
        user_id: testUserId,
        status: 'ENABLED',
        envelope_version: '1.0',
        envelope_algorithm: 'aes-256-gcm',
        envelope_key_id: 'test',
        envelope_nonce: 'test',
        envelope_ciphertext: 'test',
        envelope_auth_tag: 'test'
      }
    });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId, iat: Math.floor(Date.now() / 1000) }
    });

    await expect(requireSecurityPermission('security.response.execute')).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/mfa-challenge');
  });

  it('denies access if step-up is expired', async () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    await prisma.userMfa.create({
      data: {
        user_id: testUserId,
        status: 'ENABLED',
        last_verified_at: fiveHoursAgo,
        envelope_version: '1.0',
        envelope_algorithm: 'aes-256-gcm',
        envelope_key_id: 'test',
        envelope_nonce: 'test',
        envelope_ciphertext: 'test',
        envelope_auth_tag: 'test'
      }
    });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId, iat: Math.floor(Date.now() / 1000) }
    });

    await expect(requireSecurityPermission('security.response.execute')).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/mfa-challenge');
  });

  it('accepts current step-up only when permission also exists', async () => {
    await prisma.userMfa.create({
      data: {
        user_id: testUserId,
        status: 'ENABLED',
        last_verified_at: new Date(),
        envelope_version: '1.0',
        envelope_algorithm: 'aes-256-gcm',
        envelope_key_id: 'test',
        envelope_nonce: 'test',
        envelope_ciphertext: 'test',
        envelope_auth_tag: 'test'
      }
    });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId, iat: Math.floor(Date.now() / 1000) }
    });

    const context = await requireSecurityPermission('security.response.execute');
    expect(context).toBeDefined();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('password reset invalidates session', async () => {
    // IAT is older than user.updated_at
    const pastIat = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    
    // Simulate password reset changing updated_at
    await prisma.user.update({
      where: { id: testUserId },
      data: { password_hash: 'new_hash' } // This automatically updates updated_at
    });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId, iat: pastIat }
    });

    await expect(requireSecurityPermission('security.response.execute')).rejects.toThrow('NEXT_REDIRECT');
    // Expect redirect to login due to session invalidation
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('MFA reset invalidates session', async () => {
    const pastIat = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    
    await prisma.userMfa.create({
      data: {
        user_id: testUserId,
        status: 'DISABLED',
        reset_at: new Date(),
        envelope_version: '1.0',
        envelope_algorithm: 'aes-256-gcm',
        envelope_key_id: 'test',
        envelope_nonce: 'test',
        envelope_ciphertext: 'test',
        envelope_auth_tag: 'test'
      }
    });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId, iat: pastIat }
    });

    await expect(requireSecurityPermission('security.response.execute')).rejects.toThrow('NEXT_REDIRECT');
    // Expect redirect to login due to MFA reset
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('permission changes are re-evaluated', async () => {
    await prisma.user.update({
      where: { id: testUserId },
      data: { role: 'Guest' } // Guest has no SOC permissions
    });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId, iat: Math.floor(Date.now() / 1000) }
    });

    await expect(requireSecurityPermission('security.response.execute')).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('client input cannot set MFA verification', async () => {
    await prisma.userMfa.create({
      data: {
        user_id: testUserId,
        status: 'ENABLED',
        // Deliberately no last_verified_at in DB
        envelope_version: '1.0',
        envelope_algorithm: 'aes-256-gcm',
        envelope_key_id: 'test',
        envelope_nonce: 'test',
        envelope_ciphertext: 'test',
        envelope_auth_tag: 'test'
      }
    });

    // Client passes mfa_verified = true in session, which should be ignored
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId, iat: Math.floor(Date.now() / 1000), mfa_verified: true }
    });

    await expect(requireSecurityPermission('security.response.execute')).rejects.toThrow('NEXT_REDIRECT');
    // Should still redirect to mfa-challenge because DB is authoritative
    expect(redirect).toHaveBeenCalledWith('/mfa-challenge');
  });
});
