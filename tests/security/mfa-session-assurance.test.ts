import { createHash } from 'node:crypto';

jest.mock('@/lib/prisma', () => {
  const prisma = {
    mfaSessionAssurance: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (operation: (tx: typeof prisma) => Promise<unknown>) => operation(prisma));
  return { prisma };
});
jest.mock('@/lib/auth', () => ({ authOptions: { secret: 'test-secret' } }));
jest.mock('@/lib/auth/session-registry', () => ({
  getActiveSessionByHash: jest.fn(),
}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { cookies, headers } from 'next/headers';
import { getActiveSessionByHash } from '@/lib/auth/session-registry';
import {
  getCurrentSessionAal2,
  grantCurrentSessionAal2,
  requireCurrentSessionAal2,
  revokeCurrentSessionAal2,
} from '@/lib/security/auth/mfa-session-assurance';

const mockGetServerSession = getServerSession as jest.Mock;
const mockGetToken = getToken as jest.Mock;
const mockCookies = cookies as jest.Mock;
const mockHeaders = headers as jest.Mock;
const mockGetActiveSessionByHash = getActiveSessionByHash as jest.Mock;
const { prisma: mockPrisma } = require('@/lib/prisma'); // eslint-disable-line @typescript-eslint/no-require-imports
const mockFindUnique = mockPrisma.mfaSessionAssurance.findUnique as jest.Mock;
const mockCreate = mockPrisma.mfaSessionAssurance.create as jest.Mock;
const mockUpdate = mockPrisma.mfaSessionAssurance.update as jest.Mock;
const mockUpdateMany = mockPrisma.mfaSessionAssurance.updateMany as jest.Mock;

const rawSessionA = 'a'.repeat(43);
const rawSessionB = 'b'.repeat(43);
const futureExp = () => Math.floor(Date.now() / 1000) + 3600;
const futureDate = () => new Date(Date.now() + 30 * 60 * 1000);
const pastDate = () => new Date(Date.now() - 30 * 60 * 1000);
const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');

function activeRecord(userId = 'user-1', rawSessionId = rawSessionA) {
  return {
    id: 'assurance-record',
    session_key_hash: hash(rawSessionId),
    user_id: userId,
    assurance_level: 'AAL2',
    verified_at: new Date(),
    expires_at: futureDate(),
    revoked_at: null,
  };
}

function mockBoundSession(userId = 'user-1', rawSessionId = rawSessionA) {
  mockGetServerSession.mockResolvedValue({ user: { id: userId } });
  mockGetToken.mockResolvedValue({
    id: userId,
    mfaSessionId: rawSessionId,
    exp: futureExp(),
  });
}

describe('MFA session assurance service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.mockResolvedValue({ getAll: () => [] });
    mockHeaders.mockResolvedValue(new Headers());
    mockGetActiveSessionByHash.mockResolvedValue({ id: 'registered-session' });
    mockBoundSession();
    mockFindUnique.mockResolvedValue(activeRecord());
  });

  it('allows active unexpired current-session AAL2 without relying on the UX cookie', async () => {
    const assurance = await getCurrentSessionAal2();

    expect(Boolean(assurance)).toBe(true);
  });

  it('denies legacy JWTs without the server-generated session identifier', async () => {
    mockGetToken.mockResolvedValue({ id: 'user-1', exp: futureExp() });

    const assurance = await getCurrentSessionAal2();

    expect(Boolean(assurance)).toBe(false);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('denies a recent global MFA timestamp when current-session assurance is missing', async () => {
    mockFindUnique.mockResolvedValue(null);

    const assurance = await getCurrentSessionAal2();

    expect(Boolean(assurance)).toBe(false);
  });

  it('isolates two sessions for the same user', async () => {
    mockFindUnique.mockResolvedValueOnce(activeRecord('user-1', rawSessionA));
    mockBoundSession('user-1', rawSessionA);
    const sessionA = await getCurrentSessionAal2();

    mockFindUnique.mockResolvedValueOnce(null);
    mockBoundSession('user-1', rawSessionB);
    const sessionB = await getCurrentSessionAal2();

    expect(Boolean(sessionA)).toBe(true);
    expect(Boolean(sessionB)).toBe(false);
  });

  it('does not let a copied UX cookie authorize another session', async () => {
    mockCookies.mockResolvedValue({ getAll: () => [{ name: 'mfa_step_up', value: 'true' }] });
    mockBoundSession('user-1', rawSessionB);
    mockFindUnique.mockResolvedValue(null);

    const assurance = await getCurrentSessionAal2();

    expect(Boolean(assurance)).toBe(false);
  });

  it.each([
    ['expired assurance', { ...activeRecord(), expires_at: pastDate() }],
    ['revoked assurance', { ...activeRecord(), revoked_at: new Date() }],
    ['wrong user', activeRecord('other-user')],
    ['wrong assurance level', { ...activeRecord(), assurance_level: 'AAL1' }],
  ])('denies %s', async (_label, record) => {
    mockFindUnique.mockResolvedValue(record);

    const assurance = await getCurrentSessionAal2();

    expect(Boolean(assurance)).toBe(false);
  });

  it('denies missing records and database errors', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    await expect(requireCurrentSessionAal2()).rejects.toThrow('MFA_SESSION_AAL2_REQUIRED');

    mockFindUnique.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(requireCurrentSessionAal2()).rejects.toThrow('MFA_SESSION_AAL2_REQUIRED');
  });

  it('creates assurance for the current session without storing the raw identifier', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue(activeRecord());

    await expect(grantCurrentSessionAal2()).resolves.toBe(true);

    const createArg = mockCreate.mock.calls[0][0];
    expect(createArg.data.session_key_hash === rawSessionA).toBe(false);
    expect(createArg.data.session_key_hash === hash(rawSessionA)).toBe(true);
    expect(createArg.data.assurance_level).toBe('AAL2');
    expect(createArg.data.revoked_at).toBeNull();
  });

  it('updates existing same-user assurance and rejects wrong-user records', async () => {
    mockFindUnique.mockResolvedValueOnce(activeRecord('user-1'));
    mockUpdate.mockResolvedValue(activeRecord('user-1'));
    await expect(grantCurrentSessionAal2()).resolves.toBe(true);
    expect(mockUpdate).toHaveBeenCalled();

    mockFindUnique.mockResolvedValueOnce(activeRecord('other-user'));
    await expect(grantCurrentSessionAal2()).resolves.toBe(false);
  });

  it('revokes only the current session assurance and tolerates missing bindings', async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    await expect(revokeCurrentSessionAal2()).resolves.toBe(true);
    expect(mockUpdateMany).toHaveBeenCalledTimes(1);
    expect(mockUpdateMany.mock.calls[0][0].where.user_id === 'user-1').toBe(true);

    mockGetToken.mockResolvedValueOnce({ id: 'user-1', exp: futureExp() });
    await expect(revokeCurrentSessionAal2()).resolves.toBe(false);
  });
});
