import 'server-only';

import { prisma } from '@/lib/prisma';
import { logAuthenticationEvent } from '@/lib/security/events/writers/authentication-writer';
import { hashSessionIdentifier, isTrustedSessionIdentifier } from '@/lib/security/auth/session-key';

const INACTIVE_STATUSES = new Set(['Suspended', 'Blacklisted', 'Disabled']);
const LAST_SEEN_WRITE_INTERVAL_MS = 5 * 60 * 1000;

export type SessionBindingInput = {
  userId: string;
  sessionKeyHash: string;
  tokenExpiresAt?: Date | null;
};

function boundedExpiry(expiry: Date, tokenExpiresAt?: Date | null) {
  if (!tokenExpiresAt) return expiry;
  return tokenExpiresAt < expiry ? tokenExpiresAt : expiry;
}

export async function registerUserSession(options: {
  userId: string;
  mfaSessionId: string;
  tokenExpiresAt?: Date | null;
}) {
  if (!isTrustedSessionIdentifier(options.mfaSessionId)) throw new Error('Invalid trusted session binding');
  const sessionKeyHash = hashSessionIdentifier(options.mfaSessionId);
  const expiry = boundedExpiry(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), options.tokenExpiresAt);
  const existing = await prisma.userSession.findUnique({ where: { session_key_hash: sessionKeyHash } });
  if (existing) return existing;
  try {
    const created = await prisma.userSession.create({
      data: { user_id: options.userId, session_key_hash: sessionKeyHash, expires_at: expiry },
    });
    void logAuthenticationEvent({ event_code: 'SESSION_CREATED', outcome: 'SUCCESS', actor_user_id: options.userId });
    return created;
  } catch (error) {
    if ((error as { code?: string }).code !== 'P2002') throw error;
    return prisma.userSession.findUniqueOrThrow({ where: { session_key_hash: sessionKeyHash } });
  }
}

export async function getActiveSessionByHash(userId: string, sessionKeyHash: string) {
  const record = await prisma.userSession.findUnique({ where: { session_key_hash: sessionKeyHash } });
  if (!record || record.user_id !== userId || record.revoked_at || record.expires_at <= new Date()) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user || INACTIVE_STATUSES.has(user.status)) return null;
  if (record.last_seen_at.getTime() < Date.now() - LAST_SEEN_WRITE_INTERVAL_MS) {
    await prisma.userSession.update({ where: { id: record.id }, data: { last_seen_at: new Date() } });
  }
  return record;
}

export async function listActiveUserSessions(userId: string, currentSessionKeyHash: string) {
  const rows = await prisma.userSession.findMany({
    where: { user_id: userId, revoked_at: null, expires_at: { gt: new Date() } },
    orderBy: { last_seen_at: 'desc' },
    select: { id: true, session_key_hash: true, created_at: true, last_seen_at: true, expires_at: true },
  });
  return rows.map(({ session_key_hash: _hash, ...row }) => ({ ...row, isCurrent: _hash === currentSessionKeyHash }));
}

export async function revokeUserSession(userId: string, sessionId: string, currentSessionKeyHash: string) {
  const target = await prisma.userSession.findUnique({ where: { id: sessionId } });
  if (!target || target.user_id !== userId) return { found: false, revoked: false };
  if (target.session_key_hash === currentSessionKeyHash) return { found: true, revoked: false, current: true };
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.userSession.updateMany({ where: { id: sessionId, user_id: userId, revoked_at: null }, data: { revoked_at: new Date() } });
    await tx.mfaSessionAssurance.updateMany({ where: { session_key_hash: target.session_key_hash, user_id: userId, revoked_at: null }, data: { revoked_at: new Date() } });
    return updated.count;
  });
  if (result) void logAuthenticationEvent({ event_code: 'SESSION_REVOKED_BY_USER', outcome: 'SUCCESS', actor_user_id: userId });
  return { found: true, revoked: result > 0, current: false };
}

export async function revokeOtherUserSessions(userId: string, currentSessionKeyHash: string) {
  const targets = await prisma.userSession.findMany({ where: { user_id: userId, session_key_hash: { not: currentSessionKeyHash }, revoked_at: null }, select: { session_key_hash: true } });
  if (!targets.length) return 0;
  const hashes = targets.map((row) => row.session_key_hash);
  const count = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const result = await tx.userSession.updateMany({ where: { user_id: userId, session_key_hash: { in: hashes }, revoked_at: null }, data: { revoked_at: now } });
    await tx.mfaSessionAssurance.updateMany({ where: { user_id: userId, session_key_hash: { in: hashes }, revoked_at: null }, data: { revoked_at: now } });
    return result.count;
  });
  if (count) void logAuthenticationEvent({ event_code: 'OTHER_SESSIONS_REVOKED', outcome: 'SUCCESS', actor_user_id: userId, sanitized_metadata: { count } });
  return count;
}

export async function revokeAllUserSessions(userId: string) {
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const sessions = await tx.userSession.findMany({ where: { user_id: userId, revoked_at: null }, select: { session_key_hash: true } });
    const count = await tx.userSession.updateMany({ where: { user_id: userId, revoked_at: null }, data: { revoked_at: now } });
    await tx.mfaSessionAssurance.updateMany({ where: { user_id: userId, session_key_hash: { in: sessions.map((s) => s.session_key_hash) }, revoked_at: null }, data: { revoked_at: now } });
    return count.count;
  });
  if (result) void logAuthenticationEvent({ event_code: 'SESSION_REVOKED', outcome: 'SUCCESS', actor_user_id: userId, sanitized_metadata: { reason: 'security_reset' } });
  return result;
}

export async function revokeCurrentUserSession(binding: SessionBindingInput) {
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.userSession.updateMany({ where: { user_id: binding.userId, session_key_hash: binding.sessionKeyHash, revoked_at: null }, data: { revoked_at: now } });
    await tx.mfaSessionAssurance.updateMany({ where: { user_id: binding.userId, session_key_hash: binding.sessionKeyHash, revoked_at: null }, data: { revoked_at: now } });
    return updated.count;
  });
  if (result) void logAuthenticationEvent({ event_code: 'SESSION_REVOKED', outcome: 'SUCCESS', actor_user_id: binding.userId });
  return result;
}
