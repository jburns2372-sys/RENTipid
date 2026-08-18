import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { getServerSession } from 'next-auth';

jest.mock("@prisma/client", () => {
  const mPrisma = {
    user: { findUnique: jest.fn() }, userMfa: { findUnique: jest.fn() }
  };
  return {
    PrismaClient: jest.fn(() => mPrisma),
    __mockPrisma: mPrisma
  };
});
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockPrisma: prismaMock } = require("@prisma/client");

jest.mock('@/lib/security/events/writers/administration-writer', () => ({ logAdministrationEvent: jest.fn() }));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));

// We must also mock next/navigation to catch redirect without failing the test runner if it throws something Next handles
jest.mock("next/navigation", () => ({ redirect: jest.fn(() => { throw new Error('NEXT_REDIRECT'); }) }));

describe('Admin Privacy RBAC Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow Compliance Admin to view privacy requests', async () => {
    const id = Date.now().toString();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id, iat: Date.now() / 1000 + 10000 } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prismaMock.user.findUnique.mockResolvedValueOnce({ id, role: 'Compliance Admin', status: 'Verified', updated_at: new Date() } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prismaMock.userMfa.findUnique.mockResolvedValueOnce({ status: 'ENABLED', last_verified_at: new Date() } as any);

    await expect(requireSecurityPermission(SECURITY_PERMISSIONS.PRIVACY_REQUEST_READ_ALL)).resolves.toEqual(expect.objectContaining({ role: 'Compliance Admin' }));
  });
  
  it('should deny unauthorized users access to privacy admin pages', async () => {
    const id = Date.now().toString();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id, iat: Date.now() / 1000 + 10000 } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prismaMock.user.findUnique.mockResolvedValueOnce({ id, role: 'Renter', status: 'Verified', updated_at: new Date() } as any);

    await expect(requireSecurityPermission(SECURITY_PERMISSIONS.PRIVACY_REQUEST_READ_ALL)).rejects.toThrow('NEXT_REDIRECT');
  });
});


