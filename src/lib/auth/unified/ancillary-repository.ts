import 'server-only';

import { prisma } from '@/lib/prisma';
import { revokeAllUserSessionsInTransaction } from '@/lib/auth/session-registry';
import { canonicalizeEmail } from './identifiers';
import {
  authTokenHashPrefix,
  type AuthAncillaryRepository,
  type AuthEmailCredential,
  type AuthTokenRecord,
} from './ancillary';

export class PrismaAuthAncillaryRepository implements AuthAncillaryRepository {
  async findEmailCredential(email: string): Promise<AuthEmailCredential | null> {
    const credential = await prisma.emailCredential.findUnique({
      where: { normalized_email: canonicalizeEmail(email) },
      select: {
        user_id: true,
        normalized_email: true,
        is_verified: true,
      },
    });
    if (!credential) return null;
    return {
      userId: credential.user_id,
      email: credential.normalized_email,
      isVerified: credential.is_verified,
    };
  }

  async recordRequest(input: {
    identityHash: string;
    ipHash: string;
    requestedAt: Date;
  }): Promise<void> {
    await prisma.passwordResetRequest.create({
      data: {
        identity_hash: input.identityHash,
        ip_hash: input.ipHash,
        requested_at: input.requestedAt,
      },
    });
  }

  async replaceOutstandingToken(input: AuthTokenRecord): Promise<void> {
    const tokenPrefix = authTokenHashPrefix(input.purpose);
    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          user_id: input.userId,
          token_hash: { startsWith: tokenPrefix },
          used_at: null,
        },
        data: { used_at: new Date() },
      });
      await tx.passwordResetToken.create({
        data: {
          user_id: input.userId,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt,
          used_at: input.usedAt,
        },
      });
    });
  }

  async invalidateToken(tokenHash: string, usedAt: Date): Promise<void> {
    await prisma.passwordResetToken.updateMany({
      where: { token_hash: tokenHash, used_at: null },
      data: { used_at: usedAt },
    });
  }

  async consumeEmailVerificationToken(
    tokenHash: string,
    now: Date,
  ): Promise<{ userId: string } | null> {
    return prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({
        where: { token_hash: tokenHash },
        select: { id: true, user_id: true, used_at: true, expires_at: true },
      });
      if (!token || token.used_at || token.expires_at <= now) return null;

      const credential = await tx.emailCredential.findUnique({
        where: { user_id: token.user_id },
        select: { user_id: true },
      });
      if (!credential) return null;

      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: token.id,
          token_hash: tokenHash,
          used_at: null,
          expires_at: { gt: now },
        },
        data: { used_at: now },
      });
      if (consumed.count !== 1) return null;

      await tx.emailCredential.update({
        where: { user_id: token.user_id },
        data: { is_verified: true, verified_at: now },
      });
      return { userId: token.user_id };
    });
  }

  async hasActivePasswordResetToken(tokenHash: string, now: Date): Promise<boolean> {
    const token = await prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      select: { used_at: true, expires_at: true },
    });
    return Boolean(token && !token.used_at && token.expires_at > now);
  }

  async consumePasswordResetToken(
    tokenHash: string,
    passwordHash: string,
    now: Date,
  ): Promise<{ userId: string; revokedSessionCount: number } | null> {
    return prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({
        where: { token_hash: tokenHash },
        select: { id: true, user_id: true, used_at: true, expires_at: true },
      });
      if (!token || token.used_at || token.expires_at <= now) return null;

      const credential = await tx.emailCredential.findUnique({
        where: { user_id: token.user_id },
        select: { user_id: true },
      });
      if (!credential) return null;

      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: token.id,
          token_hash: tokenHash,
          used_at: null,
          expires_at: { gt: now },
        },
        data: { used_at: now },
      });
      if (consumed.count !== 1) return null;

      await tx.user.update({
        where: { id: token.user_id },
        data: { password_hash: passwordHash },
      });
      await tx.emailCredential.update({
        where: { user_id: token.user_id },
        data: {
          password_hash: passwordHash,
          password_changed_at: now,
        },
      });
      await tx.passwordResetToken.updateMany({
        where: {
          user_id: token.user_id,
          token_hash: { startsWith: authTokenHashPrefix('password-reset') },
          used_at: null,
        },
        data: { used_at: now },
      });
      const revokedSessionCount = await revokeAllUserSessionsInTransaction(
        tx,
        token.user_id,
        now,
      );
      return { userId: token.user_id, revokedSessionCount };
    });
  }
}
