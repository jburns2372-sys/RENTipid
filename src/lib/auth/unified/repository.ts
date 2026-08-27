import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  canonicalizeEmail,
  createReferenceHash,
} from './identifiers';
import type {
  AuthProviderIdentityRecord,
  CreateUnifiedUserInput,
  PhoneIdentityRecord,
  UnifiedAuthRepository,
  UnifiedUserRecord,
  VerificationChallengeRecord,
} from './services';

type UnifiedPrismaClient = typeof prisma & {
  emailCredential: {
    create(args: unknown): Promise<unknown>;
    delete(args: unknown): Promise<unknown>;
    findUnique(args: unknown): Promise<unknown>;
    upsert(args: unknown): Promise<unknown>;
  };
  authProviderIdentity: {
    findUnique(args: unknown): Promise<unknown>;
    findMany(args: unknown): Promise<unknown[]>;
    create(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    delete(args: unknown): Promise<unknown>;
  };
  phoneIdentity: {
    findUnique(args: unknown): Promise<unknown>;
    findMany(args: unknown): Promise<unknown[]>;
    create(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    delete(args: unknown): Promise<unknown>;
  };
  authConsentReceipt: {
    create(args: unknown): Promise<unknown>;
  };
  authIdentityEvent: {
    create(args: unknown): Promise<unknown>;
  };
  phoneVerificationChallenge: {
    create(args: unknown): Promise<unknown>;
    findUnique(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
};

const db = prisma as UnifiedPrismaClient;

type UserRow = UnifiedUserRecord;
type ProviderIdentityRow = AuthProviderIdentityRecord;
type PhoneIdentityRow = PhoneIdentityRecord;
type ChallengeRow = VerificationChallengeRecord;

function toUserRecord(row: unknown): UnifiedUserRecord | null {
  if (!row || typeof row !== 'object') return null;
  const user = row as Partial<UserRow>;
  if (!user.id || !user.email || !user.full_name || !user.account_type || !user.role || !user.status) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    account_type: user.account_type,
    role: user.role,
    status: user.status,
    password_hash: user.password_hash ?? null,
    mobile_number: user.mobile_number ?? null,
  };
}

function toProviderIdentityRecord(row: unknown): AuthProviderIdentityRecord | null {
  if (!row || typeof row !== 'object') return null;
  const identity = row as Partial<ProviderIdentityRow>;
  if (!identity.id || !identity.user_id || !identity.provider || !identity.provider_subject) return null;
  return {
    id: identity.id,
    user_id: identity.user_id,
    provider: identity.provider,
    provider_subject: identity.provider_subject,
    email: identity.email ?? null,
    email_verified: identity.email_verified ?? false,
    is_private_email: identity.is_private_email ?? false,
  };
}

function toPhoneIdentityRecord(row: unknown): PhoneIdentityRecord | null {
  if (!row || typeof row !== 'object') return null;
  const identity = row as Partial<PhoneIdentityRow>;
  if (!identity.id || !identity.user_id || !identity.phone_e164) return null;
  return {
    id: identity.id,
    user_id: identity.user_id,
    phone_e164: identity.phone_e164,
    verified_at: identity.verified_at ?? null,
  };
}

function toChallengeRecord(row: unknown): VerificationChallengeRecord | null {
  if (!row || typeof row !== 'object') return null;
  const challenge = row as Partial<ChallengeRow>;
  if (!challenge.id || !challenge.channel || !challenge.phone_e164 || !challenge.status || !challenge.expires_at) return null;
  return {
    id: challenge.id,
    channel: challenge.channel,
    phone_e164: challenge.phone_e164,
    provider_challenge_id: challenge.provider_challenge_id ?? null,
    status: challenge.status,
    attempt_count: challenge.attempt_count ?? 0,
    max_attempts: challenge.max_attempts ?? 5,
    send_count: challenge.send_count ?? 1,
    last_sent_at: challenge.last_sent_at,
    expires_at: challenge.expires_at,
    consumed_at: challenge.consumed_at ?? null,
    session_reference_hash: challenge.session_reference_hash ?? null,
    ip_reference_hash: challenge.ip_reference_hash ?? null,
  };
}

function userSelect() {
  return {
    id: true,
    email: true,
    full_name: true,
    account_type: true,
    role: true,
    status: true,
    password_hash: true,
    mobile_number: true,
  };
}

export class PrismaUnifiedAuthRepository implements UnifiedAuthRepository {
  async findUserById(userId: string): Promise<UnifiedUserRecord | null> {
    return toUserRecord(await prisma.user.findUnique({ where: { id: userId }, select: userSelect() }));
  }

  async findUserByEmail(email: string): Promise<UnifiedUserRecord | null> {
    const normalizedEmail = canonicalizeEmail(email);
    const credential = await db.emailCredential.findUnique({
      where: { normalized_email: normalizedEmail },
      include: { user: { select: userSelect() } },
    }) as { user?: unknown } | null;
    if (credential?.user) return toUserRecord(credential.user);

    return toUserRecord(await prisma.user.findUnique({ where: { email: normalizedEmail }, select: userSelect() }));
  }

  async createUser(input: CreateUnifiedUserInput): Promise<UnifiedUserRecord> {
    const normalizedEmail = canonicalizeEmail(input.email);
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          full_name: input.full_name,
          mobile_number: input.mobile_number ?? null,
          password_hash: input.password_hash ?? null,
          account_type: input.account_type,
          role: input.role,
          status: input.status,
        },
        select: userSelect(),
      });

      if (input.password_hash) {
        await (tx as unknown as UnifiedPrismaClient).emailCredential.create({
          data: {
            user_id: user.id,
            normalized_email: normalizedEmail,
            password_hash: input.password_hash,
            is_verified: false,
            password_changed_at: new Date(),
          },
        });
      }

      return user;
    });

    const record = toUserRecord(created);
    if (!record) throw new Error('AUTH_USER_CREATE_FAILED');
    return record;
  }

  async updateUserPassword(userId: string, passwordHash: string | null): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { password_hash: passwordHash } });
      if (passwordHash === null) {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user) {
          await (tx as unknown as UnifiedPrismaClient).emailCredential.delete({
            where: { normalized_email: canonicalizeEmail(user.email) },
          }).catch(() => undefined);
        }
      }
    });
  }

  async updateUserEmailAndPassword(userId: string, email: string, passwordHash: string): Promise<UnifiedUserRecord> {
    const normalizedEmail = canonicalizeEmail(email);
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { email: normalizedEmail, password_hash: passwordHash },
        select: userSelect(),
      });
      await (tx as unknown as UnifiedPrismaClient).emailCredential.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          normalized_email: normalizedEmail,
          password_hash: passwordHash,
          is_verified: false,
          password_changed_at: new Date(),
        },
        update: {
          normalized_email: normalizedEmail,
          password_hash: passwordHash,
          password_changed_at: new Date(),
        },
      });
      return user;
    });

    const record = toUserRecord(updated);
    if (!record) throw new Error('AUTH_USER_UPDATE_FAILED');
    return record;
  }

  async findProviderIdentity(provider: AuthProviderIdentityRecord['provider'], providerSubject: string): Promise<AuthProviderIdentityRecord | null> {
    return toProviderIdentityRecord(await db.authProviderIdentity.findUnique({
      where: { provider_provider_subject: { provider, provider_subject: providerSubject } },
    }));
  }

  async findProviderIdentitiesByUser(userId: string): Promise<AuthProviderIdentityRecord[]> {
    const rows = await db.authProviderIdentity.findMany({ where: { user_id: userId } });
    return rows.map(toProviderIdentityRecord).filter((row): row is AuthProviderIdentityRecord => Boolean(row));
  }

  async createProviderIdentity(input: Omit<AuthProviderIdentityRecord, 'id'> & { display_name?: string | null; avatar_url?: string | null }): Promise<AuthProviderIdentityRecord> {
    const row = await db.authProviderIdentity.create({
      data: {
        user_id: input.user_id,
        provider: input.provider,
        provider_subject: input.provider_subject,
        email: input.email ? canonicalizeEmail(input.email) : null,
        email_verified: input.email_verified ?? false,
        is_private_email: input.is_private_email ?? false,
        display_name: input.display_name ?? null,
        avatar_url: input.avatar_url ?? null,
        last_seen_at: new Date(),
      },
    });
    const record = toProviderIdentityRecord(row);
    if (!record) throw new Error('AUTH_PROVIDER_IDENTITY_CREATE_FAILED');
    return record;
  }

  async touchProviderIdentity(identityId: string): Promise<void> {
    await db.authProviderIdentity.update({ where: { id: identityId }, data: { last_seen_at: new Date() } });
  }

  async deleteProviderIdentity(identityId: string): Promise<void> {
    await db.authProviderIdentity.delete({ where: { id: identityId } });
  }

  async findPhoneIdentity(phoneE164: string): Promise<PhoneIdentityRecord | null> {
    return toPhoneIdentityRecord(await db.phoneIdentity.findUnique({ where: { phone_e164: phoneE164 } }));
  }

  async findPhoneIdentitiesByUser(userId: string): Promise<PhoneIdentityRecord[]> {
    const rows = await db.phoneIdentity.findMany({ where: { user_id: userId } });
    return rows.map(toPhoneIdentityRecord).filter((row): row is PhoneIdentityRecord => Boolean(row));
  }

  async createPhoneIdentity(input: Omit<PhoneIdentityRecord, 'id'>): Promise<PhoneIdentityRecord> {
    const row = await db.phoneIdentity.create({
      data: {
        user_id: input.user_id,
        phone_e164: input.phone_e164,
        verified_at: input.verified_at ?? new Date(),
        last_seen_at: new Date(),
      },
    });
    const record = toPhoneIdentityRecord(row);
    if (!record) throw new Error('AUTH_PHONE_IDENTITY_CREATE_FAILED');
    return record;
  }

  async touchPhoneIdentity(identityId: string): Promise<void> {
    await db.phoneIdentity.update({ where: { id: identityId }, data: { last_seen_at: new Date() } });
  }

  async deletePhoneIdentity(identityId: string): Promise<void> {
    await db.phoneIdentity.delete({ where: { id: identityId } });
  }

  async createConsentState(input: { user_id: string; terms_version: string; privacy_version: string; accepted_at: Date }): Promise<void> {
    await db.authConsentReceipt.create({ data: input });
  }

  async recordIdentityEvent(input: {
    user_id: string;
    identity_type: 'provider' | 'phone' | 'email_password';
    action: string;
    outcome: string;
    provider?: AuthProviderIdentityRecord['provider'] | null;
    provider_subject?: string | null;
    phone_e164?: string | null;
    reason?: string | null;
  }): Promise<void> {
    await db.authIdentityEvent.create({
      data: {
        user_id: input.user_id,
        identity_type: input.identity_type,
        action: input.action,
        outcome: input.outcome,
        provider: input.provider ?? null,
        provider_subject_reference_hash: input.provider_subject ? createReferenceHash(input.provider_subject, 'provider-subject') : null,
        phone_reference_hash: input.phone_e164 ? createReferenceHash(input.phone_e164, 'phone-identity-event') : null,
        reason: input.reason ?? null,
      },
    });
  }

  async createVerificationChallenge(input: Omit<VerificationChallengeRecord, 'status' | 'attempt_count'> & {
    status?: string;
    attempt_count?: number;
    send_count: number;
    last_sent_at: Date;
  }): Promise<VerificationChallengeRecord> {
    const row = await db.phoneVerificationChallenge.create({
      data: {
        id: input.id,
        channel: input.channel,
        phone_e164: input.phone_e164,
        provider_challenge_id: input.provider_challenge_id ?? null,
        status: input.status ?? 'PENDING',
        attempt_count: input.attempt_count ?? 0,
        max_attempts: input.max_attempts,
        send_count: input.send_count,
        last_sent_at: input.last_sent_at,
        expires_at: input.expires_at,
        consumed_at: input.consumed_at ?? null,
        session_reference_hash: input.session_reference_hash ?? null,
        ip_reference_hash: input.ip_reference_hash ?? null,
      },
    });
    const record = toChallengeRecord(row);
    if (!record) throw new Error('AUTH_CHALLENGE_CREATE_FAILED');
    return record;
  }

  async findVerificationChallenge(challengeId: string): Promise<VerificationChallengeRecord | null> {
    return toChallengeRecord(await db.phoneVerificationChallenge.findUnique({ where: { id: challengeId } }));
  }

  async incrementVerificationChallengeAttempt(challengeId: string, status?: string): Promise<void> {
    await db.phoneVerificationChallenge.update({
      where: { id: challengeId },
      data: {
        attempt_count: { increment: 1 },
        ...(status ? { status } : {}),
      },
    });
  }

  async consumeVerificationChallenge(challengeId: string): Promise<boolean> {
    const result = await db.phoneVerificationChallenge.updateMany({
      where: { id: challengeId, consumed_at: null, status: { not: 'CONSUMED' } },
      data: { consumed_at: new Date(), status: 'CONSUMED' },
    });
    return result.count === 1;
  }
}
