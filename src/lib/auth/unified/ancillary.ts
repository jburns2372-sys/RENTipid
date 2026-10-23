import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { PasswordSchema } from '@/lib/security/identity-input-security';
import { canonicalizeEmail, createReferenceHash } from './identifiers';
import type {
  AuthAuditSink,
  PasswordHasher,
  PhoneOtpRateLimiter,
} from './services';

export const GENERIC_EMAIL_ACTION_MESSAGE =
  'If an eligible account exists, instructions will be sent.';

export type AuthTokenPurpose = 'email-verification' | 'password-reset';

export type AuthEmailCredential = {
  userId: string;
  email: string;
  isVerified: boolean;
};

export type AuthTokenRecord = {
  userId: string;
  purpose: AuthTokenPurpose;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export interface AuthEmailDelivery {
  sendEmailVerification(input: { to: string; verificationUrl: string }): Promise<void>;
  sendPasswordReset(input: { to: string; resetUrl: string }): Promise<void>;
}

export interface AuthAncillaryRepository {
  findEmailCredential(email: string): Promise<AuthEmailCredential | null>;
  recordRequest(input: {
    identityHash: string;
    ipHash: string;
    requestedAt: Date;
  }): Promise<void>;
  replaceOutstandingToken(input: AuthTokenRecord): Promise<void>;
  invalidateToken(tokenHash: string, usedAt: Date): Promise<void>;
  consumeEmailVerificationToken(
    tokenHash: string,
    now: Date,
  ): Promise<{ userId: string } | null>;
  hasActivePasswordResetToken(tokenHash: string, now: Date): Promise<boolean>;
  consumePasswordResetToken(
    tokenHash: string,
    passwordHash: string,
    now: Date,
  ): Promise<{ userId: string; revokedSessionCount: number } | null>;
}

export class AuthAncillaryError extends Error {
  constructor(
    readonly code: 'INVALID_OR_EXPIRED_TOKEN' | 'PASSWORD_POLICY',
    message = 'The request could not be completed.',
  ) {
    super(message);
    this.name = 'AuthAncillaryError';
  }
}

type AncillaryServiceOptions = {
  audit?: AuthAuditSink;
  now?: () => Date;
  tokenFactory?: () => string;
  verificationExpiryMs?: number;
  passwordResetExpiryMs?: number;
};

const TOKEN_PREFIX: Record<AuthTokenPurpose, string> = {
  'email-verification': 'email-verification:v1:',
  'password-reset': 'password-reset:v1:',
};

const REQUEST_POLICY: Record<AuthTokenPurpose, {
  eventPrefix: string;
  identityLimit: number;
  networkLimit: number;
}> = {
  'email-verification': {
    eventPrefix: 'AUTH_EMAIL_VERIFICATION',
    identityLimit: 5,
    networkLimit: 30,
  },
  'password-reset': {
    eventPrefix: 'AUTH_PASSWORD_RESET',
    identityLimit: 5,
    networkLimit: 30,
  },
};

export function hashAuthToken(token: string, purpose: AuthTokenPurpose): string {
  const digest = createHash('sha256')
    .update(purpose)
    .update('\0')
    .update(token)
    .digest('hex');
  return `${TOKEN_PREFIX[purpose]}${digest}`;
}

export function authTokenHashPrefix(purpose: AuthTokenPurpose): string {
  return TOKEN_PREFIX[purpose];
}

function createToken(): string {
  return randomBytes(32).toString('base64url');
}

function linkFor(baseUrl: string, path: string, token: string): string {
  const url = new URL(path, baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

export class AuthAncillaryService {
  private readonly audit: AuthAuditSink;
  private readonly now: () => Date;
  private readonly tokenFactory: () => string;
  private readonly verificationExpiryMs: number;
  private readonly passwordResetExpiryMs: number;

  constructor(
    private readonly repository: AuthAncillaryRepository,
    private readonly delivery: AuthEmailDelivery,
    private readonly limiter: PhoneOtpRateLimiter,
    private readonly passwordHasher: PasswordHasher,
    options: AncillaryServiceOptions = {},
  ) {
    this.audit = options.audit || { write: () => undefined };
    this.now = options.now || (() => new Date());
    this.tokenFactory = options.tokenFactory || createToken;
    this.verificationExpiryMs = options.verificationExpiryMs || 24 * 60 * 60 * 1000;
    this.passwordResetExpiryMs = options.passwordResetExpiryMs || 30 * 60 * 1000;
  }

  async requestEmailVerification(input: {
    email: string;
    baseUrl: string;
    rawIp?: string | null;
  }) {
    return this.requestToken('email-verification', input);
  }

  async requestPasswordReset(input: {
    email: string;
    baseUrl: string;
    rawIp?: string | null;
  }) {
    return this.requestToken('password-reset', input);
  }

  async verifyEmail(token: string): Promise<{ verified: true }> {
    const tokenHash = hashAuthToken(token, 'email-verification');
    const result = await this.repository.consumeEmailVerificationToken(tokenHash, this.now());
    if (!result) {
      await this.audit.write({
        eventCode: 'AUTH_EMAIL_VERIFICATION_FAILED',
        outcome: 'FAILURE',
        metadata: { reason: 'invalid_expired_or_consumed' },
      });
      throw new AuthAncillaryError('INVALID_OR_EXPIRED_TOKEN');
    }

    await this.audit.write({
      eventCode: 'AUTH_EMAIL_VERIFIED',
      outcome: 'SUCCESS',
      userId: result.userId,
    });
    return { verified: true };
  }

  async resetPassword(input: { token: string; newPassword: string }): Promise<{ reset: true }> {
    const passwordResult = PasswordSchema.safeParse(input.newPassword);
    if (!passwordResult.success) {
      throw new AuthAncillaryError('PASSWORD_POLICY');
    }

    const tokenHash = hashAuthToken(input.token, 'password-reset');
    const active = await this.repository.hasActivePasswordResetToken(tokenHash, this.now());
    if (!active) {
      await this.audit.write({
        eventCode: 'AUTH_PASSWORD_RESET_FAILED',
        outcome: 'FAILURE',
        metadata: { reason: 'invalid_expired_or_consumed' },
      });
      throw new AuthAncillaryError('INVALID_OR_EXPIRED_TOKEN');
    }

    const passwordHash = await this.passwordHasher.hash(passwordResult.data);
    const result = await this.repository.consumePasswordResetToken(
      tokenHash,
      passwordHash,
      this.now(),
    );
    if (!result) {
      await this.audit.write({
        eventCode: 'AUTH_PASSWORD_RESET_FAILED',
        outcome: 'FAILURE',
        metadata: { reason: 'invalid_expired_or_consumed' },
      });
      throw new AuthAncillaryError('INVALID_OR_EXPIRED_TOKEN');
    }

    await this.audit.write({
      eventCode: 'AUTH_PASSWORD_RESET_COMPLETED',
      outcome: 'SUCCESS',
      userId: result.userId,
      metadata: { revokedSessionCount: result.revokedSessionCount },
    });
    return { reset: true };
  }

  private async requestToken(
    purpose: AuthTokenPurpose,
    input: { email: string; baseUrl: string; rawIp?: string | null },
  ): Promise<{ accepted: true }> {
    const email = canonicalizeEmail(input.email);
    const now = this.now();
    const policy = REQUEST_POLICY[purpose];
    const identityReference = createReferenceHash(email, `${purpose}-request`);
    const networkReference = createReferenceHash(input.rawIp || 'unknown', `${purpose}-network`);

    await this.repository.recordRequest({
      identityHash: identityReference,
      ipHash: networkReference,
      requestedAt: now,
    });

    const [identityAllowed, cooldownAllowed, networkAllowed] = await Promise.all([
      this.limiter.consume(`auth:${purpose}:identity:${identityReference}`, policy.identityLimit, 60 * 60 * 1000),
      this.limiter.consume(`auth:${purpose}:cooldown:${identityReference}`, 1, 60 * 1000),
      this.limiter.consume(`auth:${purpose}:network:${networkReference}`, policy.networkLimit, 60 * 60 * 1000),
    ]);

    if (!identityAllowed || !cooldownAllowed || !networkAllowed) {
      await this.audit.write({
        eventCode: `${policy.eventPrefix}_RATE_LIMITED`,
        outcome: 'RATE_LIMITED',
        subjectReference: identityReference,
      });
      return { accepted: true };
    }

    const credential = await this.repository.findEmailCredential(email);
    if (!credential || (purpose === 'email-verification' && credential.isVerified)) {
      await this.audit.write({
        eventCode: `${policy.eventPrefix}_REQUEST_ACCEPTED`,
        outcome: 'SUCCESS',
        subjectReference: identityReference,
      });
      return { accepted: true };
    }

    const rawToken = this.tokenFactory();
    const tokenHash = hashAuthToken(rawToken, purpose);
    const expiresAt = new Date(now.getTime() + (
      purpose === 'email-verification'
        ? this.verificationExpiryMs
        : this.passwordResetExpiryMs
    ));

    await this.repository.replaceOutstandingToken({
      userId: credential.userId,
      purpose,
      tokenHash,
      expiresAt,
      usedAt: null,
    });

    try {
      if (purpose === 'email-verification') {
        await this.delivery.sendEmailVerification({
          to: credential.email,
          verificationUrl: linkFor(input.baseUrl, '/verify-email', rawToken),
        });
      } else {
        await this.delivery.sendPasswordReset({
          to: credential.email,
          resetUrl: linkFor(input.baseUrl, '/reset-password', rawToken),
        });
      }
    } catch {
      await this.repository.invalidateToken(tokenHash, now);
      await this.audit.write({
        eventCode: `${policy.eventPrefix}_DELIVERY_FAILED`,
        outcome: 'FAILURE',
        userId: credential.userId,
        metadata: { reason: 'delivery_unavailable' },
      });
      return { accepted: true };
    }

    await this.audit.write({
      eventCode: `${policy.eventPrefix}_SENT`,
      outcome: 'SUCCESS',
      userId: credential.userId,
    });
    return { accepted: true };
  }
}
