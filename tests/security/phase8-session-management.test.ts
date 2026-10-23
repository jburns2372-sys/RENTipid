jest.mock('@/lib/security/events/writers/authentication-writer', () => ({ logAuthenticationEvent: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userSession: {
      findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    mfaSessionAssurance: { updateMany: jest.fn() },
    $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback((jest.requireMock('@/lib/prisma') as { prisma: unknown }).prisma)),
  },
}));

import { hashSessionIdentifier, isTrustedSessionIdentifier } from '@/lib/security/auth/session-key';
import {
  getActiveSessionByHash, listActiveUserSessions, registerUserSession, revokeAllUserSessions,
  revokeCurrentUserSession, revokeOtherUserSessions, revokeUserSession,
} from '@/lib/auth/session-registry';
import { prisma } from '@/lib/prisma';

const db = prisma as unknown as {
  userSession: Record<string, jest.Mock>;
  user: Record<string, jest.Mock>;
  mfaSessionAssurance: Record<string, jest.Mock>;
};
const sessionId = 'a'.repeat(43);
const otherHash = 'b'.repeat(64);
const userId = 'user-1';

beforeEach(() => {
  jest.clearAllMocks();
  db.user.findUnique.mockResolvedValue({ status: 'Verified' });
});

describe('Phase 8 active session management', () => {
  test('P8_SESSION_REGISTRY creates a durable record with only the hashed binding', async () => {
    db.userSession.findUnique.mockResolvedValue(null);
    db.userSession.create.mockResolvedValue({ id: 'session-1', user_id: userId });
    await registerUserSession({ userId, mfaSessionId: sessionId });
    expect(db.userSession.create.mock.calls[0][0].data.session_key_hash).toBe(hashSessionIdentifier(sessionId));
    expect(JSON.stringify(db.userSession.create.mock.calls[0][0].data)).not.toContain(sessionId);
  });

  test('P8_UNIQUE_SESSION_PER_LOGIN is idempotent for a retried callback', async () => {
    const existing = { id: 'session-1' };
    db.userSession.findUnique.mockResolvedValue(existing);
    expect(await registerUserSession({ userId, mfaSessionId: sessionId })).toBe(existing);
    expect(db.userSession.create).not.toHaveBeenCalled();
  });

  test('P8_REFRESH_PRESERVES_SESSION does not create on an existing binding', async () => {
    db.userSession.findUnique.mockResolvedValue({ id: 'session-1' });
    await registerUserSession({ userId, mfaSessionId: sessionId });
    expect(db.userSession.create).not.toHaveBeenCalled();
  });

  test('P8_RAW_SESSION_SECRET_NOT_PERSISTED hashes the trusted identifier', () => {
    expect(hashSessionIdentifier(sessionId)).toHaveLength(64);
    expect(hashSessionIdentifier(sessionId)).not.toBe(sessionId);
  });

  test('P8_RAW_SESSION_SECRET_NOT_EXPOSED omits hashes from listed sessions', async () => {
    db.userSession.findMany.mockResolvedValue([{ id: 's1', session_key_hash: otherHash, created_at: new Date(), last_seen_at: new Date(), expires_at: new Date(Date.now() + 10000) }]);
    const listed = await listActiveUserSessions(userId, otherHash);
    expect(listed[0]).not.toHaveProperty('session_key_hash');
  });

  test('P8_CONCURRENT_LOGIN supports distinct trusted bindings', async () => {
    db.userSession.findUnique.mockResolvedValue(null);
    db.userSession.create.mockResolvedValueOnce({ id: 's1' }).mockResolvedValueOnce({ id: 's2' });
    await registerUserSession({ userId, mfaSessionId: sessionId });
    await registerUserSession({ userId, mfaSessionId: 'c'.repeat(43) });
    expect(db.userSession.create).toHaveBeenCalledTimes(2);
  });

  test('P8_CURRENT_SESSION_IDENTIFICATION marks only the current hash', async () => {
    db.userSession.findMany.mockResolvedValue([{ id: 's1', session_key_hash: otherHash, created_at: new Date(), last_seen_at: new Date(), expires_at: new Date(Date.now() + 10000) }]);
    expect((await listActiveUserSessions(userId, otherHash))[0].isCurrent).toBe(true);
  });

  test('P8_ACTIVE_SESSION_LIST returns only active, unrevoked records', async () => {
    db.userSession.findMany.mockResolvedValue([]);
    expect(await listActiveUserSessions(userId, otherHash)).toEqual([]);
    expect(db.userSession.findMany.mock.calls[0][0].where).toMatchObject({ user_id: userId, revoked_at: null });
  });

  test('P8_SESSION_OWNERSHIP_ENFORCED rejects another user session', async () => {
    db.userSession.findUnique.mockResolvedValue({ id: 's1', user_id: 'other-user', session_key_hash: otherHash });
    expect(await revokeUserSession(userId, 's1', 'c'.repeat(64))).toEqual({ found: false, revoked: false });
  });

  test('P8_REVOKE_OTHER_SESSION revokes the target and assurance', async () => {
    db.userSession.findUnique.mockResolvedValue({ id: 's1', user_id: userId, session_key_hash: otherHash });
    db.userSession.updateMany.mockResolvedValue({ count: 1 });
    expect((await revokeUserSession(userId, 's1', 'c'.repeat(64))).revoked).toBe(true);
    expect(db.mfaSessionAssurance.updateMany).toHaveBeenCalled();
  });

  test('P8_REVOKED_SESSION_DENIED rejects revoked records', async () => {
    db.userSession.findUnique.mockResolvedValue({ user_id: userId, revoked_at: new Date(), expires_at: new Date(Date.now() + 10000) });
    expect(await getActiveSessionByHash(userId, otherHash)).toBeNull();
  });

  test('P8_OTHER_SESSION_SURVIVES_REVOKE does not target the current binding', async () => {
    db.userSession.findUnique.mockResolvedValue({ id: 'current', user_id: userId, session_key_hash: otherHash });
    expect((await revokeUserSession(userId, 'current', otherHash)).current).toBe(true);
    expect(db.userSession.updateMany).not.toHaveBeenCalled();
  });

  test('P8_LOGOUT_OTHER_SESSIONS revokes all non-current records', async () => {
    db.userSession.findMany.mockResolvedValue([{ session_key_hash: otherHash }]);
    db.userSession.updateMany.mockResolvedValue({ count: 1 });
    expect(await revokeOtherUserSessions(userId, 'c'.repeat(64))).toBe(1);
  });

  test('P8_CURRENT_SESSION_SURVIVES_LOGOUT_OTHERS excludes the current hash', async () => {
    db.userSession.findMany.mockResolvedValue([]);
    expect(await revokeOtherUserSessions(userId, otherHash)).toBe(0);
    expect(db.userSession.updateMany).not.toHaveBeenCalled();
  });

  test('P8_CURRENT_LOGOUT_REVOCATION revokes the current durable session', async () => {
    db.userSession.updateMany.mockResolvedValue({ count: 1 });
    expect(await revokeCurrentUserSession({ userId, sessionKeyHash: otherHash })).toBe(1);
  });

  test('P8_MFA_ASSURANCE_REVOKED_WITH_SESSION updates linked assurance', async () => {
    db.userSession.updateMany.mockResolvedValue({ count: 1 });
    await revokeCurrentUserSession({ userId, sessionKeyHash: otherHash });
    expect(db.mfaSessionAssurance.updateMany).toHaveBeenCalled();
  });

  test('P8_AAL2_SESSION_ISOLATION scopes assurance revocation to one hash', async () => {
    db.userSession.updateMany.mockResolvedValue({ count: 1 });
    await revokeCurrentUserSession({ userId, sessionKeyHash: otherHash });
    expect(db.mfaSessionAssurance.updateMany.mock.calls[0][0].where.session_key_hash).toBe(otherHash);
  });

  test('P8_EXPIRED_SESSION_DENIED rejects expired records', async () => {
    db.userSession.findUnique.mockResolvedValue({ user_id: userId, revoked_at: null, expires_at: new Date(Date.now() - 1000) });
    expect(await getActiveSessionByHash(userId, otherHash)).toBeNull();
  });

  test('P8_DISABLED_ACCOUNT_SESSION_DENIED rejects inactive account status', async () => {
    db.user.findUnique.mockResolvedValue({ status: 'Suspended' });
    db.userSession.findUnique.mockResolvedValue({ user_id: userId, revoked_at: null, expires_at: new Date(Date.now() + 10000) });
    expect(await getActiveSessionByHash(userId, otherHash)).toBeNull();
  });

  test('P8_LEGACY_UNREGISTERED_SESSION_POLICY fails closed when no registry record exists', async () => {
    db.userSession.findUnique.mockResolvedValue(null);
    expect(await getActiveSessionByHash(userId, otherHash)).toBeNull();
  });

  test('P8_SESSION_SECRET_SAFETY accepts only server-sized identifiers', () => {
    expect(isTrustedSessionIdentifier(sessionId)).toBe(true);
    expect(isTrustedSessionIdentifier('client-value')).toBe(false);
  });
});
