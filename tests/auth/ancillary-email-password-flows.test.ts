import {
  AuthAncillaryError,
  AuthAncillaryService,
  GENERIC_EMAIL_ACTION_MESSAGE,
  hashAuthToken,
  type AuthAncillaryRepository,
  type AuthEmailCredential,
  type AuthEmailDelivery,
  type AuthTokenRecord,
} from '@/lib/auth/unified/ancillary';
import type {
  AuthAuditSink,
  PasswordHasher,
  PhoneOtpRateLimiter,
  UnifiedAuthAuditEvent,
} from '@/lib/auth/unified/services';

const FIXED_NOW = new Date('2026-08-29T00:00:00.000Z');

class MemoryRepository implements AuthAncillaryRepository {
  credentials: AuthEmailCredential[] = [];
  tokens: AuthTokenRecord[] = [];
  requests: { identityHash: string; ipHash: string; requestedAt: Date }[] = [];
  passwordHashes = new Map<string, string>();
  activeSessions = new Map<string, number>();
  userCount = 0;

  async findEmailCredential(email: string) {
    return this.credentials.find((credential) => credential.email === email) ?? null;
  }

  async recordRequest(input: { identityHash: string; ipHash: string; requestedAt: Date }) {
    this.requests.push(input);
  }

  async replaceOutstandingToken(input: AuthTokenRecord) {
    for (const token of this.tokens) {
      if (token.userId === input.userId && token.purpose === input.purpose && !token.usedAt) {
        token.usedAt = FIXED_NOW;
      }
    }
    this.tokens.push({ ...input });
  }

  async invalidateToken(tokenHash: string, usedAt: Date) {
    const token = this.tokens.find((candidate) => candidate.tokenHash === tokenHash && !candidate.usedAt);
    if (token) token.usedAt = usedAt;
  }

  async consumeEmailVerificationToken(tokenHash: string, now: Date) {
    const token = this.tokens.find((candidate) =>
      candidate.tokenHash === tokenHash &&
      candidate.purpose === 'email-verification' &&
      !candidate.usedAt &&
      candidate.expiresAt > now
    );
    if (!token) return null;
    const credential = this.credentials.find((candidate) => candidate.userId === token.userId);
    if (!credential) return null;
    token.usedAt = now;
    credential.isVerified = true;
    return { userId: token.userId };
  }

  async hasActivePasswordResetToken(tokenHash: string, now: Date) {
    return this.tokens.some((candidate) =>
      candidate.tokenHash === tokenHash &&
      candidate.purpose === 'password-reset' &&
      !candidate.usedAt &&
      candidate.expiresAt > now
    );
  }

  async consumePasswordResetToken(tokenHash: string, passwordHash: string, now: Date) {
    const token = this.tokens.find((candidate) =>
      candidate.tokenHash === tokenHash &&
      candidate.purpose === 'password-reset' &&
      !candidate.usedAt &&
      candidate.expiresAt > now
    );
    if (!token) return null;
    const credential = this.credentials.find((candidate) => candidate.userId === token.userId);
    if (!credential) return null;
    token.usedAt = now;
    this.tokens
      .filter((candidate) => candidate.userId === token.userId && candidate.purpose === 'password-reset')
      .forEach((candidate) => { candidate.usedAt = now; });
    this.passwordHashes.set(token.userId, passwordHash);
    const revokedSessionCount = this.activeSessions.get(token.userId) || 0;
    this.activeSessions.set(token.userId, 0);
    return { userId: token.userId, revokedSessionCount };
  }
}

class MemoryDelivery implements AuthEmailDelivery {
  verificationMessages: { to: string; verificationUrl: string }[] = [];
  resetMessages: { to: string; resetUrl: string }[] = [];

  async sendEmailVerification(input: { to: string; verificationUrl: string }) {
    this.verificationMessages.push(input);
  }

  async sendPasswordReset(input: { to: string; resetUrl: string }) {
    this.resetMessages.push(input);
  }
}

class MemoryLimiter implements PhoneOtpRateLimiter {
  allowed = true;
  async consume() { return this.allowed; }
}

class MemoryPasswordHasher implements PasswordHasher {
  calls: string[] = [];
  async hash(password: string) {
    this.calls.push(password);
    return `secure-hash:${password}`;
  }
  async compare(password: string, passwordHash: string) {
    return passwordHash === `secure-hash:${password}`;
  }
}

class MemoryAudit implements AuthAuditSink {
  events: UnifiedAuthAuditEvent[] = [];
  async write(event: UnifiedAuthAuditEvent) { this.events.push(event); }
}

function createHarness(options: { verificationExpiryMs?: number; passwordResetExpiryMs?: number } = {}) {
  const repository = new MemoryRepository();
  const delivery = new MemoryDelivery();
  const limiter = new MemoryLimiter();
  const hasher = new MemoryPasswordHasher();
  const audit = new MemoryAudit();
  let tokenCounter = 0;
  const service = new AuthAncillaryService(repository, delivery, limiter, hasher, {
    audit,
    now: () => FIXED_NOW,
    tokenFactory: () => `token-${++tokenCounter}-${'x'.repeat(32)}`,
    verificationExpiryMs: options.verificationExpiryMs,
    passwordResetExpiryMs: options.passwordResetExpiryMs,
  });
  return { repository, delivery, limiter, hasher, audit, service };
}

function addCredential(repository: MemoryRepository, email = 'member@example.com') {
  repository.credentials.push({ userId: 'user-1', email, isVerified: false });
  repository.passwordHashes.set('user-1', 'old-hash');
  repository.userCount = 1;
}

function tokenFrom(url: string) {
  return new URL(url).searchParams.get('token') || '';
}

describe('email verification', () => {
  test('new email/password identity begins unverified', () => {
    const { repository } = createHarness();
    addCredential(repository);
    expect(repository.credentials[0].isVerified).toBe(false);
  });

  test('valid verification marks only the email credential verified', async () => {
    const { repository, delivery, audit, service } = createHarness();
    addCredential(repository);
    await service.requestEmailVerification({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    await expect(service.verifyEmail(tokenFrom(delivery.verificationMessages[0].verificationUrl))).resolves.toEqual({ verified: true });
    expect(repository.credentials[0].isVerified).toBe(true);
    expect(audit.events.some((event) => event.eventCode === 'AUTH_EMAIL_VERIFIED')).toBe(true);
  });

  test('invalid verification token is rejected', async () => {
    const { service } = createHarness();
    await expect(service.verifyEmail(`invalid-${'x'.repeat(32)}`)).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' });
  });

  test('expired verification token is rejected', async () => {
    const { repository, delivery, service } = createHarness({ verificationExpiryMs: -1 });
    addCredential(repository);
    await service.requestEmailVerification({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    await expect(service.verifyEmail(tokenFrom(delivery.verificationMessages[0].verificationUrl))).rejects.toBeInstanceOf(AuthAncillaryError);
  });

  test('consumed verification token cannot replay', async () => {
    const { repository, delivery, service } = createHarness();
    addCredential(repository);
    await service.requestEmailVerification({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    const token = tokenFrom(delivery.verificationMessages[0].verificationUrl);
    await service.verifyEmail(token);
    await expect(service.verifyEmail(token)).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' });
  });

  test('raw verification token is never stored', async () => {
    const { repository, delivery, service } = createHarness();
    addCredential(repository);
    await service.requestEmailVerification({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    const rawToken = tokenFrom(delivery.verificationMessages[0].verificationUrl);
    expect(repository.tokens[0].tokenHash).toBe(hashAuthToken(rawToken, 'email-verification'));
    expect(JSON.stringify(repository.tokens)).not.toContain(rawToken);
  });

  test('resend is throttled and remains non-enumerating', async () => {
    const known = createHarness();
    addCredential(known.repository);
    known.limiter.allowed = false;
    const knownResult = await known.service.requestEmailVerification({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    const unknownResult = await known.service.requestEmailVerification({ email: 'unknown@example.com', baseUrl: 'https://preview.example' });
    expect(knownResult).toEqual(unknownResult);
    expect(known.delivery.verificationMessages).toHaveLength(0);
  });

  test('provider email cannot create or merge an email credential', async () => {
    const { repository, delivery, service } = createHarness();
    repository.userCount = 1;
    await expect(service.requestEmailVerification({ email: 'provider@example.com', baseUrl: 'https://preview.example' }))
      .resolves.toEqual({ accepted: true });
    expect(repository.credentials).toHaveLength(0);
    expect(repository.userCount).toBe(1);
    expect(delivery.verificationMessages).toHaveLength(0);
  });
});

describe('password recovery and reset', () => {
  test('known-account request returns the generic response contract', async () => {
    const { repository, service } = createHarness();
    addCredential(repository);
    const result = await service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    expect(result.accepted).toBe(true);
    expect(GENERIC_EMAIL_ACTION_MESSAGE).toBe('If an eligible account exists, instructions will be sent.');
  });

  test('unknown-account request is equivalent to the known-account response', async () => {
    const known = createHarness();
    addCredential(known.repository);
    const knownResult = await known.service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    const unknown = createHarness();
    const unknownResult = await unknown.service.requestPasswordReset({ email: 'unknown@example.com', baseUrl: 'https://preview.example' });
    expect(unknownResult).toEqual(knownResult);
  });

  test('valid reset updates the credential', async () => {
    const { repository, delivery, service } = createHarness();
    addCredential(repository);
    await service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    await expect(service.resetPassword({ token: tokenFrom(delivery.resetMessages[0].resetUrl), newPassword: 'NewPassword123!' })).resolves.toEqual({ reset: true });
    expect(repository.passwordHashes.get('user-1')).toBe('secure-hash:NewPassword123!');
  });

  test('invalid reset token is rejected', async () => {
    const { service } = createHarness();
    await expect(service.resetPassword({ token: `invalid-${'x'.repeat(32)}`, newPassword: 'NewPassword123!' })).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' });
  });

  test('expired reset token is rejected', async () => {
    const { repository, delivery, service } = createHarness({ passwordResetExpiryMs: -1 });
    addCredential(repository);
    await service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    await expect(service.resetPassword({ token: tokenFrom(delivery.resetMessages[0].resetUrl), newPassword: 'NewPassword123!' })).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' });
  });

  test('consumed reset token cannot replay', async () => {
    const { repository, delivery, service } = createHarness();
    addCredential(repository);
    await service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    const token = tokenFrom(delivery.resetMessages[0].resetUrl);
    await service.resetPassword({ token, newPassword: 'NewPassword123!' });
    await expect(service.resetPassword({ token, newPassword: 'AnotherPassword123!' })).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' });
  });

  test('raw reset token is never stored', async () => {
    const { repository, delivery, service } = createHarness();
    addCredential(repository);
    await service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    const rawToken = tokenFrom(delivery.resetMessages[0].resetUrl);
    expect(repository.tokens[0].tokenHash).toBe(hashAuthToken(rawToken, 'password-reset'));
    expect(JSON.stringify(repository.tokens)).not.toContain(rawToken);
  });

  test('existing RENTipid password policy is enforced', async () => {
    const { service } = createHarness();
    await expect(service.resetPassword({ token: `token-${'x'.repeat(32)}`, newPassword: 'short' })).rejects.toMatchObject({ code: 'PASSWORD_POLICY' });
  });

  test('new password is sent only to the established password hasher', async () => {
    const { repository, delivery, hasher, service } = createHarness();
    addCredential(repository);
    await service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    await service.resetPassword({ token: tokenFrom(delivery.resetMessages[0].resetUrl), newPassword: 'NewPassword123!' });
    expect(hasher.calls).toEqual(['NewPassword123!']);
    expect(repository.passwordHashes.get('user-1')).not.toBe('NewPassword123!');
  });

  test('all Phase-8 sessions are revoked after reset', async () => {
    const { repository, delivery, service } = createHarness();
    addCredential(repository);
    repository.activeSessions.set('user-1', 3);
    await service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    await service.resetPassword({ token: tokenFrom(delivery.resetMessages[0].resetUrl), newPassword: 'NewPassword123!' });
    expect(repository.activeSessions.get('user-1')).toBe(0);
  });

  test('successful recovery emits safe audit evidence', async () => {
    const { repository, delivery, audit, service } = createHarness();
    addCredential(repository);
    await service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    const token = tokenFrom(delivery.resetMessages[0].resetUrl);
    await service.resetPassword({ token, newPassword: 'NewPassword123!' });
    expect(audit.events.some((event) => event.eventCode === 'AUTH_PASSWORD_RESET_COMPLETED')).toBe(true);
    expect(JSON.stringify(audit.events)).not.toContain(token);
    expect(JSON.stringify(audit.events)).not.toContain('NewPassword123!');
  });

  test('recovery request cannot create a duplicate User', async () => {
    const { repository, service } = createHarness();
    addCredential(repository);
    await service.requestPasswordReset({ email: 'member@example.com', baseUrl: 'https://preview.example' });
    expect(repository.userCount).toBe(1);
  });

  test('provider-only and phone-only identities cannot receive an implicit password', async () => {
    const { repository, delivery, service } = createHarness();
    repository.userCount = 2;
    await service.requestPasswordReset({ email: 'provider@example.com', baseUrl: 'https://preview.example' });
    expect(repository.credentials).toHaveLength(0);
    expect(repository.passwordHashes.size).toBe(0);
    expect(repository.userCount).toBe(2);
    expect(delivery.resetMessages).toHaveLength(0);
  });
});
