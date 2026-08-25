import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { assertSecurityPermissionForService } from '@/lib/security/authorization';
import { getCurrentSessionAal2 } from '@/lib/security/auth/mfa-session-assurance';

jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/security/events/writers/administration-writer', () => ({
  logAdministrationEvent: jest.fn(),
}));
jest.mock('@prisma/client', () => {
  const mPrisma = {
    user: { findUnique: jest.fn() },
  };
  return {
    PrismaClient: jest.fn(() => mPrisma),
    Prisma: {},
    __mockPrisma: mPrisma,
  };
});

jest.mock('@/lib/security/auth/mfa-session-assurance', () => ({
  getCurrentSessionAal2: jest.fn(),
  requireCurrentSessionAal2: jest.fn(),
  MfaSessionAssuranceRequiredError: class MfaSessionAssuranceRequiredError extends Error {},
}));

const { __mockPrisma: prismaMock } = require('@prisma/client'); // eslint-disable-line @typescript-eslint/no-require-imports

describe('privileged route guard session assurance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.test',
      full_name: 'Security User',
      role: 'Super Admin',
      status: 'Verified',
      updated_at: new Date(),
    });
  });

  it('denies privileged service access for AAL1 even when role and permission pass', async () => {
    (getCurrentSessionAal2 as jest.Mock).mockResolvedValue(null);

    await expect(
      assertSecurityPermissionForService('user-1', SECURITY_PERMISSIONS.RESPONSE_EXECUTE),
    ).resolves.toBe(false);
  });

  it('allows privileged service access when role, permission, and current-session AAL2 pass', async () => {
    (getCurrentSessionAal2 as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      assuranceLevel: 'AAL2',
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      assertSecurityPermissionForService('user-1', SECURITY_PERMISSIONS.RESPONSE_EXECUTE),
    ).resolves.toBe(true);
  });

  it('denies privileged service access when AAL2 belongs to another user', async () => {
    (getCurrentSessionAal2 as jest.Mock).mockResolvedValue({
      userId: 'other-user',
      assuranceLevel: 'AAL2',
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      assertSecurityPermissionForService('user-1', SECURITY_PERMISSIONS.RESPONSE_EXECUTE),
    ).resolves.toBe(false);
  });
});
