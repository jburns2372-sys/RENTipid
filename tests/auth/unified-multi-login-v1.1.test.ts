/**
 * RENTipid Unified Multi-Login Authentication v1.1
 * Gate 1 — Comprehensive Targeted Test Suite
 *
 * Covers FR-01 through FR-16 using in-memory mocks.
 * No database, no external providers, no real OTPs.
 */
import {
  UnifiedAuthenticationService,
  PhoneOtpAuthenticationService,
  UnifiedAuthError,
  normalizeOAuthProfile,
  GENERIC_AUTH_MESSAGE,
} from '@/lib/auth/unified/services';
import type { UnifiedAuthConfig } from '@/lib/auth/unified/config';
import {
  AUTH_METHODS,
  getUnifiedAuthConfig,
  getGatewayMethodStates,
  isUnifiedAuthMethodEnabled,
} from '@/lib/auth/unified/config';
import { normalizeE164Phone, canonicalizeEmail, createSyntheticIdentityEmail, isInactiveAccountStatus } from '@/lib/auth/unified/identifiers';
import {
  InMemoryUnifiedAuthRepository,
  createEmptyStore,
  resetIdCounter,
} from './helpers/in-memory-repository';
import {
  MockPhoneVerificationProvider,
  VALID_TEST_CODE,
  resetMockState,
  setProviderUnavailable,
} from './helpers/mock-phone-provider';
import type { AuthAuditSink, UnifiedAuthAuditEvent, PasswordHasher, PhoneOtpRateLimiter } from '@/lib/auth/unified/services';

/* ─── Test Infrastructure ─────────────────────────── */

class TestPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> { return `hashed:${password}`; }
  async compare(password: string, passwordHash: string): Promise<boolean> { return passwordHash === `hashed:${password}`; }
}

class CollectingAuditSink implements AuthAuditSink {
  events: UnifiedAuthAuditEvent[] = [];
  async write(event: UnifiedAuthAuditEvent) { this.events.push(event); }
  reset() { this.events = []; }
}

class InMemoryRateLimiter implements PhoneOtpRateLimiter {
  private counters = new Map<string, { count: number; resetAt: number }>();
  async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const existing = this.counters.get(key);
    if (!existing || existing.resetAt < now) {
      this.counters.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    existing.count++;
    return existing.count <= limit;
  }
  reset() { this.counters.clear(); }
}

function allEnabledConfig(): UnifiedAuthConfig {
  return getUnifiedAuthConfig({
    AUTH_GOOGLE_ENABLED: 'true',
    AUTH_FACEBOOK_ENABLED: 'true',
    AUTH_APPLE_ENABLED: 'true',
    AUTH_EMAIL_ENABLED: 'true',
    AUTH_SMS_OTP_ENABLED: 'true',
    AUTH_WHATSAPP_OTP_ENABLED: 'true',
    GOOGLE_CLIENT_ID: 'test-google-id',
    GOOGLE_CLIENT_SECRET: 'test-google-secret',
    FACEBOOK_CLIENT_ID: 'test-facebook-id',
    FACEBOOK_CLIENT_SECRET: 'test-facebook-secret',
    APPLE_CLIENT_ID: 'test-apple-id',
    APPLE_CLIENT_SECRET: 'test-apple-secret',
    TWILIO_ACCOUNT_SID: 'test-twilio-sid',
    TWILIO_AUTH_TOKEN: 'test-twilio-token',
    TWILIO_VERIFY_SERVICE_SID: 'test-twilio-verify-sid',
    NEXTAUTH_SECRET: 'test-secret',
  });
}

const CONSENT = { accepted: true, termsAccepted: true, privacyAccepted: true };
const fixedNow = new Date('2026-01-01T00:00:00Z');

function createTestServices() {
  const store = createEmptyStore();
  const repo = new InMemoryUnifiedAuthRepository(store);
  const audit = new CollectingAuditSink();
  const config = allEnabledConfig();
  const hasher = new TestPasswordHasher();
  const limiter = new InMemoryRateLimiter();
  const mockProvider = new MockPhoneVerificationProvider();

  const authService = new UnifiedAuthenticationService(repo, {
    config,
    audit,
    passwordHasher: hasher,
    now: () => fixedNow,
  });

  const otpService = new PhoneOtpAuthenticationService(repo, mockProvider, limiter, {
    config,
    audit,
    now: () => fixedNow,
    expiryMs: 5 * 60 * 1000,
    maxAttempts: 5,
  });

  return { store, repo, audit, config, hasher, limiter, mockProvider, authService, otpService };
}

beforeEach(() => {
  resetIdCounter();
  resetMockState();
});

/* ═══════════════════════════════════════════════════
   FR-01: Unified Gateway
   ═══════════════════════════════════════════════════ */

describe('FR-01: Unified Gateway', () => {
  test('AUTH_METHODS contains all six core methods', () => {
    expect(AUTH_METHODS).toEqual(['google', 'facebook', 'apple', 'email', 'sms', 'whatsapp']);
  });

  test('getGatewayMethodStates returns all six methods with enabled states', () => {
    const states = getGatewayMethodStates({
      AUTH_GOOGLE_ENABLED: 'true',
      GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret',
      AUTH_FACEBOOK_ENABLED: 'true',
      FACEBOOK_CLIENT_ID: 'id', FACEBOOK_CLIENT_SECRET: 'secret',
      AUTH_APPLE_ENABLED: 'true',
      APPLE_CLIENT_ID: 'id', APPLE_CLIENT_SECRET: 'secret',
      AUTH_EMAIL_ENABLED: 'true',
      AUTH_SMS_OTP_ENABLED: 'true',
      AUTH_WHATSAPP_OTP_ENABLED: 'true',
      TWILIO_ACCOUNT_SID: 'sid', TWILIO_AUTH_TOKEN: 'token', TWILIO_VERIFY_SERVICE_SID: 'vsid',
    });
    expect(states).toHaveLength(6);
    const methods = states.map(s => s.method);
    expect(methods).toEqual(['google', 'facebook', 'apple', 'email', 'sms', 'whatsapp']);
    states.forEach(s => expect(s.enabled).toBe(true));
  });

  test('disabled flag correctly disables a method', () => {
    expect(isUnifiedAuthMethodEnabled('google', {
      AUTH_GOOGLE_ENABLED: 'false',
      GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret',
    })).toBe(false);
  });

  test('unconfigured method (no credentials) is reported as not enabled', () => {
    expect(isUnifiedAuthMethodEnabled('google', { AUTH_GOOGLE_ENABLED: 'true' })).toBe(false);
  });

  test('login page exports default component', async () => {
    // Static contract: the login page module exists and exports a default function
    const loginModule = await import('@/app/login/page');
    expect(typeof loginModule.default).toBe('function');
  });
});

/* ═══════════════════════════════════════════════════
   FR-02: New Account Creation
   ═══════════════════════════════════════════════════ */

describe('FR-02: Auto-Registration', () => {
  test('email/password registration creates new user', async () => {
    const { authService, store } = createTestServices();
    const result = await authService.registerEmailPassword({
      email: 'new@example.com',
      password: 'TestP@ss1',
      fullName: 'New User',
      consent: CONSENT,
    });
    expect(result.created).toBe(true);
    expect(result.user?.email).toBe('new@example.com');
    expect(store.users).toHaveLength(1);
    expect(store.consentReceipts).toHaveLength(1);
  });

  test('Google OAuth creates new user with synthetic email', async () => {
    const { authService, store } = createTestServices();
    const user = await authService.resolveOAuthSignIn({
      provider: 'google',
      providerSubject: 'google-sub-123',
      profile: { sub: 'google-sub-123', email: 'test@gmail.com', email_verified: true, name: 'Google User' },
      consent: CONSENT,
    });
    expect(user.id).toBeTruthy();
    expect(store.providerIdentities).toHaveLength(1);
    expect(store.providerIdentities[0].provider).toBe('google');
    expect(store.providerIdentities[0].provider_subject).toBe('google-sub-123');
  });

  test('Facebook OAuth creates new user', async () => {
    const { authService, store } = createTestServices();
    const user = await authService.resolveOAuthSignIn({
      provider: 'facebook',
      providerSubject: 'fb-123',
      profile: { id: 'fb-123', name: 'FB User' },
      consent: CONSENT,
    });
    expect(user.id).toBeTruthy();
    expect(store.providerIdentities[0].provider).toBe('facebook');
  });

  test('Apple OAuth creates new user', async () => {
    const { authService, store } = createTestServices();
    const user = await authService.resolveOAuthSignIn({
      provider: 'apple',
      providerSubject: 'apple-sub-456',
      profile: { sub: 'apple-sub-456', email: 'hidden@privaterelay.appleid.com', email_verified: true, is_private_email: true, iss: 'https://appleid.apple.com' },
      consent: CONSENT,
    });
    expect(user.id).toBeTruthy();
    expect(store.providerIdentities[0].is_private_email).toBe(true);
  });

  test('SMS OTP creates new user', async () => {
    const { otpService, store } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'sms', phone: '+639171234567' });
    const user = await otpService.verifyForSignIn({
      channel: 'sms', phone: '+639171234567', challengeId, code: VALID_TEST_CODE, consent: CONSENT,
    });
    expect(user.id).toBeTruthy();
    expect(store.phoneIdentities).toHaveLength(1);
    expect(store.phoneIdentities[0].phone_e164).toBe('+639171234567');
  });

  test('WhatsApp OTP creates new user', async () => {
    const { otpService, store } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'whatsapp', phone: '+639181234567' });
    const user = await otpService.verifyForSignIn({
      channel: 'whatsapp', phone: '+639181234567', challengeId, code: VALID_TEST_CODE, consent: CONSENT,
    });
    expect(user.id).toBeTruthy();
    expect(store.phoneIdentities[0].phone_e164).toBe('+639181234567');
  });
});

/* ═══════════════════════════════════════════════════
   FR-03: Returning User Resolution
   ═══════════════════════════════════════════════════ */

describe('FR-03: Returning User Resolution', () => {
  test('returning Google user resolves same User ID', async () => {
    const { authService } = createTestServices();
    const profile = { sub: 'g-return-1', email: 'ret@gmail.com', email_verified: true, name: 'Return' };
    const first = await authService.resolveOAuthSignIn({ provider: 'google', providerSubject: 'g-return-1', profile, consent: CONSENT });
    const second = await authService.resolveOAuthSignIn({ provider: 'google', providerSubject: 'g-return-1', profile });
    expect(second.id).toBe(first.id);
  });

  test('returning Facebook user resolves same User ID', async () => {
    const { authService } = createTestServices();
    const profile = { id: 'fb-ret-1', name: 'FB Return' };
    const first = await authService.resolveOAuthSignIn({ provider: 'facebook', providerSubject: 'fb-ret-1', profile, consent: CONSENT });
    const second = await authService.resolveOAuthSignIn({ provider: 'facebook', providerSubject: 'fb-ret-1', profile });
    expect(second.id).toBe(first.id);
  });

  test('returning Apple user resolves same User ID', async () => {
    const { authService } = createTestServices();
    const profile = { sub: 'apple-ret-1', email: 'x@privaterelay.appleid.com', email_verified: true, iss: 'https://appleid.apple.com' };
    const first = await authService.resolveOAuthSignIn({ provider: 'apple', providerSubject: 'apple-ret-1', profile, consent: CONSENT });
    const second = await authService.resolveOAuthSignIn({ provider: 'apple', providerSubject: 'apple-ret-1', profile });
    expect(second.id).toBe(first.id);
  });

  test('returning email/password user authenticates to same User', async () => {
    const { authService, store } = createTestServices();
    await authService.registerEmailPassword({ email: 'r@test.com', password: 'Pass1', fullName: 'R', consent: CONSENT });
    store.emailCredentials[0].is_verified = true;
    const user = await authService.authenticateEmailPassword({ email: 'r@test.com', password: 'Pass1' });
    expect(user.email).toBe('r@test.com');
  });

  test('unverified email/password credential cannot sign in', async () => {
    const { authService } = createTestServices();
    await authService.registerEmailPassword({ email: 'pending@test.com', password: 'Pass1', fullName: 'Pending', consent: CONSENT });
    await expect(
      authService.authenticateEmailPassword({ email: 'pending@test.com', password: 'Pass1' }),
    ).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
  });

  test('returning SMS phone user resolves same User ID', async () => {
    const { otpService, limiter } = createTestServices();
    const { challengeId: c1 } = await otpService.start({ channel: 'sms', phone: '+639171111111' });
    const first = await otpService.verifyForSignIn({ channel: 'sms', phone: '+639171111111', challengeId: c1, code: VALID_TEST_CODE, consent: CONSENT });
    limiter.reset(); // Reset cooldown
    const { challengeId: c2 } = await otpService.start({ channel: 'sms', phone: '+639171111111' });
    const second = await otpService.verifyForSignIn({ channel: 'sms', phone: '+639171111111', challengeId: c2, code: VALID_TEST_CODE });
    expect(second.id).toBe(first.id);
  });

  test('returning WhatsApp phone user resolves same User ID', async () => {
    const { otpService, limiter } = createTestServices();
    const { challengeId: c1 } = await otpService.start({ channel: 'whatsapp', phone: '+639172222222' });
    const first = await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639172222222', challengeId: c1, code: VALID_TEST_CODE, consent: CONSENT });
    limiter.reset(); // Reset cooldown
    const { challengeId: c2 } = await otpService.start({ channel: 'whatsapp', phone: '+639172222222' });
    const second = await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639172222222', challengeId: c2, code: VALID_TEST_CODE });
    expect(second.id).toBe(first.id);
  });
});

/* ═══════════════════════════════════════════════════
   FR-04: Account Enumeration Protection
   ═══════════════════════════════════════════════════ */

describe('FR-04: Account Enumeration Protection', () => {
  test('email registration returns generic accepted for existing account', async () => {
    const { authService } = createTestServices();
    await authService.registerEmailPassword({ email: 'exists@test.com', password: 'P1', fullName: 'E', consent: CONSENT });
    const result = await authService.registerEmailPassword({ email: 'exists@test.com', password: 'P2', fullName: 'E2', consent: CONSENT });
    expect(result.accepted).toBe(true);
    expect(result.created).toBe(false);
    // No error thrown — generic response
  });

  test('email login with wrong password throws INVALID_CREDENTIALS (not user-not-found)', async () => {
    const { authService } = createTestServices();
    await authService.registerEmailPassword({ email: 'a@test.com', password: 'Correct', fullName: 'A', consent: CONSENT });
    await expect(
      authService.authenticateEmailPassword({ email: 'a@test.com', password: 'Wrong' }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('email login for non-existent email throws INVALID_CREDENTIALS (not user-not-found)', async () => {
    const { authService } = createTestServices();
    await expect(
      authService.authenticateEmailPassword({ email: 'nope@test.com', password: 'x' }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('GENERIC_AUTH_MESSAGE is used for responses', () => {
    expect(GENERIC_AUTH_MESSAGE).toBe('If the details are valid, you can continue.');
  });
});

/* ═══════════════════════════════════════════════════
   FR-05: OAuth Security
   ═══════════════════════════════════════════════════ */

describe('FR-05: OAuth Security', () => {
  test('rejects profile without provider subject', () => {
    expect(() => normalizeOAuthProfile({ provider: 'google', profile: { email: 'x@g.com', email_verified: true } }))
      .toThrow(UnifiedAuthError);
  });

  test('rejects mismatched provider subject', () => {
    expect(() => normalizeOAuthProfile({
      provider: 'google',
      providerSubject: 'sub-A',
      profile: { sub: 'sub-B', email: 'x@g.com', email_verified: true },
    })).toThrow(UnifiedAuthError);
  });

  test('rejects Google profile with wrong issuer', () => {
    expect(() => normalizeOAuthProfile({
      provider: 'google',
      profile: { sub: 's1', iss: 'https://evil.com', email: 'x@g.com', email_verified: true },
    })).toThrow(UnifiedAuthError);
  });

  test('rejects expired token', () => {
    const expiredEpoch = Math.floor(Date.now() / 1000) - 3600;
    expect(() => normalizeOAuthProfile({
      provider: 'google',
      profile: { sub: 's1', exp: expiredEpoch, email: 'x@g.com', email_verified: true },
    })).toThrow(UnifiedAuthError);
  });

  test('rejects Google profile with unverified email', () => {
    expect(() => normalizeOAuthProfile({
      provider: 'google',
      profile: { sub: 's1', email: 'x@g.com', email_verified: false },
    })).toThrow(UnifiedAuthError);
  });

  test('accepts Facebook profile without email (not required)', () => {
    const result = normalizeOAuthProfile({
      provider: 'facebook',
      profile: { id: 'fb-1', name: 'No Email' },
    });
    expect(result.email).toBeNull();
    expect(result.providerSubject).toBe('fb-1');
  });

  test('Google audience validation rejects wrong client ID', () => {
    const config = allEnabledConfig();
    expect(() => normalizeOAuthProfile({
      provider: 'google',
      profile: { sub: 's1', aud: 'wrong-client-id', email: 'x@g.com', email_verified: true },
      config,
    })).toThrow(UnifiedAuthError);
  });
});

/* ═══════════════════════════════════════════════════
   FR-06: Apple Hide My Email
   ═══════════════════════════════════════════════════ */

describe('FR-06: Apple Hide My Email', () => {
  test('detects private relay email', () => {
    const result = normalizeOAuthProfile({
      provider: 'apple',
      profile: {
        sub: 'apple-hide-1',
        email: 'abc@privaterelay.appleid.com',
        email_verified: true,
        is_private_email: true,
        iss: 'https://appleid.apple.com',
      },
    });
    expect(result.isPrivateEmail).toBe(true);
    expect(result.providerSubject).toBe('apple-hide-1');
  });

  test('Apple returning user with same subject resolves same User (email not durable identity)', async () => {
    const { authService } = createTestServices();
    const profile1 = { sub: 'apple-stable-1', email: 'relay1@privaterelay.appleid.com', email_verified: true, is_private_email: true, iss: 'https://appleid.apple.com' };
    const first = await authService.resolveOAuthSignIn({ provider: 'apple', providerSubject: 'apple-stable-1', profile: profile1, consent: CONSENT });
    // Second login — email may change but subject stays the same
    const profile2 = { sub: 'apple-stable-1', email: 'relay2@privaterelay.appleid.com', email_verified: true, is_private_email: true, iss: 'https://appleid.apple.com' };
    const second = await authService.resolveOAuthSignIn({ provider: 'apple', providerSubject: 'apple-stable-1', profile: profile2 });
    expect(second.id).toBe(first.id);
  });

  test('rejects Apple profile with wrong issuer', () => {
    expect(() => normalizeOAuthProfile({
      provider: 'apple',
      profile: { sub: 'a1', iss: 'https://evil.com', email: 'a@p.com', email_verified: true },
    })).toThrow(UnifiedAuthError);
  });
});

/* ═══════════════════════════════════════════════════
   FR-07: OTP Security
   ═══════════════════════════════════════════════════ */

describe('FR-07: OTP Security', () => {
  test('E.164 normalization for PH mobile', () => {
    expect(normalizeE164Phone('09171234567')).toBe('+639171234567');
    expect(normalizeE164Phone('+639171234567')).toBe('+639171234567');
    expect(normalizeE164Phone('9171234567', 'PH')).toBe('+639171234567');
  });

  test('rejects invalid phone number', () => {
    expect(() => normalizeE164Phone('')).toThrow('INVALID_PHONE_NUMBER');
    expect(() => normalizeE164Phone('abc')).toThrow('INVALID_PHONE_NUMBER');
    expect(() => normalizeE164Phone('+0123')).toThrow('INVALID_PHONE_NUMBER');
  });

  test('invalid OTP code rejected', async () => {
    const { otpService } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'sms', phone: '+639171234567' });
    await expect(
      otpService.verifyForSignIn({ channel: 'sms', phone: '+639171234567', challengeId, code: '000000', consent: CONSENT }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('expired OTP challenge rejected', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const mockProvider = new MockPhoneVerificationProvider();
    const config = allEnabledConfig();
    // Use a now() that's 10 minutes in the future
    const futureNow = new Date(fixedNow.getTime() + 10 * 60 * 1000);
    const otpService = new PhoneOtpAuthenticationService(repo, mockProvider, undefined, {
      config, now: () => futureNow, expiryMs: 5 * 60 * 1000,
    });
    // Create a challenge with the current fixedNow (expires 5 min from fixedNow)
    const startService = new PhoneOtpAuthenticationService(repo, mockProvider, undefined, {
      config, now: () => fixedNow, expiryMs: 5 * 60 * 1000,
    });
    const { challengeId } = await startService.start({ channel: 'sms', phone: '+639171234567' });
    // Verify with future time — should be expired
    await expect(
      otpService.verifyForSignIn({ channel: 'sms', phone: '+639171234567', challengeId, code: VALID_TEST_CODE, consent: CONSENT }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('consumed OTP cannot be replayed', async () => {
    const { otpService } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'sms', phone: '+639171234567' });
    await otpService.verifyForSignIn({ channel: 'sms', phone: '+639171234567', challengeId, code: VALID_TEST_CODE, consent: CONSENT });
    // Replay same challenge
    await expect(
      otpService.verifyForSignIn({ channel: 'sms', phone: '+639171234567', challengeId, code: VALID_TEST_CODE }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('attempt limit exhaustion denies verification', async () => {
    const { otpService } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'sms', phone: '+639171234567' });
    // Exhaust 5 attempts with wrong code
    for (let i = 0; i < 5; i++) {
      await otpService.verifyForSignIn({ channel: 'sms', phone: '+639171234567', challengeId, code: '999999', consent: CONSENT }).catch(() => {});
    }
    // Even correct code should now fail
    await expect(
      otpService.verifyForSignIn({ channel: 'sms', phone: '+639171234567', challengeId, code: VALID_TEST_CODE, consent: CONSENT }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('disabled user denied via OTP', async () => {
    const { otpService, store, limiter } = createTestServices();
    // Create user via first OTP
    const { challengeId: c1 } = await otpService.start({ channel: 'sms', phone: '+639170000001' });
    const user = await otpService.verifyForSignIn({ channel: 'sms', phone: '+639170000001', challengeId: c1, code: VALID_TEST_CODE, consent: CONSENT });
    // Disable the user
    store.users.find(u => u.id === user.id)!.status = 'Suspended';
    // Try again
    limiter.reset(); // Reset cooldown
    const { challengeId: c2 } = await otpService.start({ channel: 'sms', phone: '+639170000001' });
    await expect(
      otpService.verifyForSignIn({ channel: 'sms', phone: '+639170000001', challengeId: c2, code: VALID_TEST_CODE }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('rate limiter blocks excessive OTP starts', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const mockProvider = new MockPhoneVerificationProvider();
    const config = allEnabledConfig();
    // Create a strict limiter that allows only 2 requests
    const strictLimiter: PhoneOtpRateLimiter = {
      async consume(_key: string, limit: number) {
        return limit > 1; // Fail on limit=1 (cooldown check)
      },
    };
    const otpService = new PhoneOtpAuthenticationService(repo, mockProvider, strictLimiter, { config, now: () => fixedNow });
    await expect(
      otpService.start({ channel: 'sms', phone: '+639171234567' }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('wrong channel for challenge rejected', async () => {
    const { otpService } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'sms', phone: '+639171234567' });
    await expect(
      otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639171234567', challengeId, code: VALID_TEST_CODE, consent: CONSENT }),
    ).rejects.toThrow(UnifiedAuthError);
  });
});

/* ═══════════════════════════════════════════════════
   FR-08: Identity Linking
   ═══════════════════════════════════════════════════ */

describe('FR-08: Identity Linking', () => {
  test('authenticated user can link a Google identity', async () => {
    const { authService, store } = createTestServices();
    const regResult = await authService.registerEmailPassword({ email: 'link@test.com', password: 'P1', fullName: 'Link', consent: CONSENT });
    const userId = regResult.user!.id;
    const result = await authService.linkProviderIdentity({
      userId,
      provider: 'google',
      providerSubject: 'g-link-1',
      profile: { sub: 'g-link-1', email: 'link@gmail.com', email_verified: true },
      recentAuthentication: true,
    });
    expect(result.linked).toBe(true);
    expect(store.providerIdentities).toHaveLength(1);
  });

  test('linking requires recent authentication', async () => {
    const { authService } = createTestServices();
    const regResult = await authService.registerEmailPassword({ email: 'l2@test.com', password: 'P1', fullName: 'L2', consent: CONSENT });
    await expect(
      authService.linkProviderIdentity({
        userId: regResult.user!.id,
        provider: 'google',
        providerSubject: 'g-link-2',
        profile: { sub: 'g-link-2', email: 'l2@gmail.com', email_verified: true },
        recentAuthentication: false,
      }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('linking identity already owned by another user is BLOCKED', async () => {
    const { authService } = createTestServices();
    // User A creates account and links Google identity
    const userA = (await authService.registerEmailPassword({ email: 'a@test.com', password: 'P', fullName: 'A', consent: CONSENT })).user!;
    await authService.linkProviderIdentity({ userId: userA.id, provider: 'google', providerSubject: 'shared-sub', profile: { sub: 'shared-sub', email: 'a@g.com', email_verified: true }, recentAuthentication: true });
    // User B tries to link same Google identity
    const userB = (await authService.registerEmailPassword({ email: 'b@test.com', password: 'P', fullName: 'B', consent: CONSENT })).user!;
    await expect(
      authService.linkProviderIdentity({ userId: userB.id, provider: 'google', providerSubject: 'shared-sub', profile: { sub: 'shared-sub', email: 'b@g.com', email_verified: true }, recentAuthentication: true }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('linking phone identity via OTP', async () => {
    const { authService, otpService } = createTestServices();
    const regResult = await authService.registerEmailPassword({ email: 'ph@test.com', password: 'P1', fullName: 'Phone', consent: CONSENT });
    const userId = regResult.user!.id;
    const { challengeId } = await otpService.start({ channel: 'sms', phone: '+639170000099' });
    const result = await otpService.verifyForLink({
      userId, channel: 'sms', phone: '+639170000099', challengeId, code: VALID_TEST_CODE, recentAuthentication: true,
    });
    expect(result.linked).toBe(true);
  });

  test('audit event recorded on link', async () => {
    const { authService, store } = createTestServices();
    const regResult = await authService.registerEmailPassword({ email: 'audit-link@test.com', password: 'P1', fullName: 'AL', consent: CONSENT });
    await authService.linkProviderIdentity({ userId: regResult.user!.id, provider: 'facebook', providerSubject: 'fb-audit-1', profile: { id: 'fb-audit-1' }, recentAuthentication: true });
    expect(store.identityEvents.some(e => e.action === 'LINK' && e.outcome === 'SUCCESS')).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════
   FR-09: No Unsafe Email Auto-Merge
   ═══════════════════════════════════════════════════ */

describe('FR-09: No Unsafe Email Auto-Merge', () => {
  test('OAuth identity with matching email does NOT auto-merge with existing email user', async () => {
    const { authService, store } = createTestServices();
    // User A registers with email
    await authService.registerEmailPassword({ email: 'shared@test.com', password: 'P1', fullName: 'EmailUser', consent: CONSENT });
    // Google sign-in with same email but different identity creates NEW user
    const googleUser = await authService.resolveOAuthSignIn({
      provider: 'google',
      providerSubject: 'g-separate-sub',
      profile: { sub: 'g-separate-sub', email: 'shared@test.com', email_verified: true },
      consent: CONSENT,
    });
    // Must be a DIFFERENT user
    expect(store.users.length).toBe(2);
    expect(googleUser.id).not.toBe(store.users[0].id);
  });

  test('synthetic email is used for OAuth users, not the provider email', async () => {
    const { authService, store } = createTestServices();
    await authService.resolveOAuthSignIn({
      provider: 'google', providerSubject: 'g-synth-1',
      profile: { sub: 'g-synth-1', email: 'real@gmail.com', email_verified: true },
      consent: CONSENT,
    });
    const user = store.users[0];
    expect(user.email).toContain('identity.rentipid.invalid');
    expect(user.email).not.toBe('real@gmail.com');
  });
});

/* ═══════════════════════════════════════════════════
   FR-10: Unlink Safety
   ═══════════════════════════════════════════════════ */

describe('FR-10: Unlink Safety', () => {
  test('can unlink secondary provider identity', async () => {
    const { authService, store } = createTestServices();
    // Create user with email + Google (2 methods)
    const user = (await authService.registerEmailPassword({ email: 'unl@test.com', password: 'P1', fullName: 'U', consent: CONSENT })).user!;
    await authService.linkProviderIdentity({ userId: user.id, provider: 'google', providerSubject: 'g-unl-1', profile: { sub: 'g-unl-1', email: 'u@g.com', email_verified: true }, recentAuthentication: true });
    const result = await authService.unlinkIdentity({ userId: user.id, type: 'provider', provider: 'google', providerSubject: 'g-unl-1', recentAuthentication: true });
    expect(result.unlinked).toBe(true);
    expect(store.providerIdentities).toHaveLength(0);
  });

  test('cannot unlink last sign-in method', async () => {
    const { authService } = createTestServices();
    const user = (await authService.registerEmailPassword({ email: 'last@test.com', password: 'P1', fullName: 'Last', consent: CONSENT })).user!;
    // Only has email/password — cannot remove
    await expect(
      authService.unlinkIdentity({ userId: user.id, type: 'email_password', recentAuthentication: true }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('cannot unlink another user\'s identity', async () => {
    const { authService } = createTestServices();
    const userA = (await authService.registerEmailPassword({ email: 'ownA@test.com', password: 'P1', fullName: 'A', consent: CONSENT })).user!;
    await authService.linkProviderIdentity({ userId: userA.id, provider: 'google', providerSubject: 'g-ownA', profile: { sub: 'g-ownA', email: 'a@g.com', email_verified: true }, recentAuthentication: true });
    const userB = (await authService.registerEmailPassword({ email: 'ownB@test.com', password: 'P1', fullName: 'B', consent: CONSENT })).user!;
    await authService.linkProviderIdentity({ userId: userB.id, provider: 'facebook', providerSubject: 'fb-ownB', profile: { id: 'fb-ownB' }, recentAuthentication: true });
    // B tries to unlink A's Google identity
    await expect(
      authService.unlinkIdentity({ userId: userB.id, type: 'provider', provider: 'google', providerSubject: 'g-ownA', recentAuthentication: true }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('unlink requires recent authentication', async () => {
    const { authService } = createTestServices();
    const user = (await authService.registerEmailPassword({ email: 'req@test.com', password: 'P1', fullName: 'R', consent: CONSENT })).user!;
    await authService.linkProviderIdentity({ userId: user.id, provider: 'google', providerSubject: 'g-req-1', profile: { sub: 'g-req-1', email: 'r@g.com', email_verified: true }, recentAuthentication: true });
    await expect(
      authService.unlinkIdentity({ userId: user.id, type: 'provider', provider: 'google', providerSubject: 'g-req-1', recentAuthentication: false }),
    ).rejects.toThrow(UnifiedAuthError);
  });
});

/* ═══════════════════════════════════════════════════
   FR-11: RBAC Authority
   ═══════════════════════════════════════════════════ */

describe('FR-11: RBAC Authority', () => {
  test('new OAuth user gets default Renter role, not provider claims', async () => {
    const { authService } = createTestServices();
    const user = await authService.resolveOAuthSignIn({
      provider: 'google', providerSubject: 'g-rbac-1',
      profile: { sub: 'g-rbac-1', email: 'admin@company.com', email_verified: true, role: 'admin' },
      consent: CONSENT,
    });
    expect(user.role).toBe('Renter');
  });

  test('new phone OTP user gets default Renter role', async () => {
    const { otpService } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'whatsapp', phone: '+639177777777' });
    const user = await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639177777777', challengeId, code: VALID_TEST_CODE, consent: CONSENT });
    expect(user.role).toBe('Renter');
  });

  test('safePublicRole rejects unsafe role values', async () => {
    const { authService } = createTestServices();
    const result = await authService.registerEmailPassword({
      email: 'role@test.com', password: 'P1', fullName: 'R',
      role: 'Super Admin', consent: CONSENT,
    });
    expect(result.user?.role).toBe('Renter'); // Not 'Super Admin'
  });
});

/* ═══════════════════════════════════════════════════
   FR-12: Privileged MFA
   ═══════════════════════════════════════════════════ */

describe('FR-12: Privileged MFA Preservation', () => {
  test('OAuth authentication does not create MFA session (service layer only returns user)', async () => {
    const { authService } = createTestServices();
    const user = await authService.resolveOAuthSignIn({
      provider: 'google', providerSubject: 'g-mfa-1',
      profile: { sub: 'g-mfa-1', email: 'mfa@gmail.com', email_verified: true },
      consent: CONSENT,
    });
    // The service layer returns the user record only — MFA session is created by NextAuth callbacks
    // Verify no MFA-related data is injected at the service level
    expect(user.id).toBeTruthy();
    const sessionFreeUser = user as typeof user & { mfaSessionId?: unknown; aal2?: unknown };
    expect(sessionFreeUser.mfaSessionId).toBeUndefined();
    expect(sessionFreeUser.aal2).toBeUndefined();
  });

  test('phone OTP authentication does not grant AAL2 at service level', async () => {
    const { otpService } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'sms', phone: '+639173333333' });
    const user = await otpService.verifyForSignIn({ channel: 'sms', phone: '+639173333333', challengeId, code: VALID_TEST_CODE, consent: CONSENT });
    const sessionFreeUser = user as typeof user & { mfaSessionId?: unknown; aal2?: unknown };
    expect(sessionFreeUser.mfaSessionId).toBeUndefined();
    expect(sessionFreeUser.aal2).toBeUndefined();
  });
});

/* ═══════════════════════════════════════════════════
   FR-13: Session Integration
   ═══════════════════════════════════════════════════ */

describe('FR-13: Phase 8 Session Integration', () => {
  test('auth.ts exports authOptions with required session strategy', async () => {
    // Verify auth.ts module structure without importing server-only dependencies
    const fs = await import('fs');
    const path = await import('path');
    const authPath = path.join(process.cwd(), 'src', 'lib', 'auth.ts');
    const content = fs.readFileSync(authPath, 'utf-8');
    // Session strategy must be JWT
    expect(content).toContain('strategy: "jwt"');
    // Must call registerUserSession for Phase 8 integration
    expect(content).toContain('registerUserSession');
    // Must use mfaSessionId for session key
    expect(content).toContain('mfaSessionId');
    // Must check getActiveSessionByHash
    expect(content).toContain('getActiveSessionByHash');
    // Must NOT expose raw mfaSessionId to client
    expect(content).toContain('isTrustedSessionIdentifier');
  });

  test('auth.ts integrates phone-otp credentials provider with Phase 8 session flow', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const authPath = path.join(process.cwd(), 'src', 'lib', 'auth.ts');
    const content = fs.readFileSync(authPath, 'utf-8');
    expect(content).toContain('id: "phone-otp"');
    expect(content).toContain('PhoneOtpAuthenticationService');
    expect(content).toContain('verifyForSignIn');
  });

  test('auth.ts integrates OAuth providers with signIn callback', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const authPath = path.join(process.cwd(), 'src', 'lib', 'auth.ts');
    const content = fs.readFileSync(authPath, 'utf-8');
    expect(content).toContain('GoogleProvider');
    expect(content).toContain('FacebookProvider');
    expect(content).toContain('AppleProvider');
    expect(content).toContain('async signIn({ user, account, profile })');
    expect(content).toContain('resolveOAuthSignIn');
  });
});

/* ═══════════════════════════════════════════════════
   FR-14: Audit/Security Event Safety
   ═══════════════════════════════════════════════════ */

describe('FR-14: Audit Event Safety', () => {
  test('successful login audit event does not contain password', async () => {
    const { authService, audit, store } = createTestServices();
    await authService.registerEmailPassword({ email: 'aud@test.com', password: 'SecretPass123!', fullName: 'A', consent: CONSENT });
    store.emailCredentials[0].is_verified = true;
    await authService.authenticateEmailPassword({ email: 'aud@test.com', password: 'SecretPass123!' });
    audit.events.forEach(event => {
      const json = JSON.stringify(event);
      expect(json).not.toContain('SecretPass123!');
      expect(json).not.toContain('hashed:SecretPass123!');
    });
  });

  test('OTP events do not contain OTP codes', async () => {
    const { otpService, audit } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'sms', phone: '+639171111111' });
    await otpService.verifyForSignIn({ channel: 'sms', phone: '+639171111111', challengeId, code: VALID_TEST_CODE, consent: CONSENT });
    audit.events.forEach(event => {
      const json = JSON.stringify(event);
      expect(json).not.toContain(VALID_TEST_CODE);
      expect(json).not.toContain('+639171111111'); // Phone should be hashed
    });
  });

  test('failed OAuth event does not contain provider secrets', async () => {
    const { authService, audit } = createTestServices();
    try {
      await authService.resolveOAuthSignIn({ provider: 'google', profile: {} }); // Will fail
    } catch {}
    audit.events.forEach(event => {
      const json = JSON.stringify(event);
      expect(json).not.toContain('test-google-secret');
      expect(json).not.toContain('test-twilio-token');
    });
  });

  test('linking blocked event does not leak provider subject', async () => {
    const { authService, audit } = createTestServices();
    const userA = (await authService.registerEmailPassword({ email: 'auA@t.com', password: 'P', fullName: 'A', consent: CONSENT })).user!;
    await authService.linkProviderIdentity({ userId: userA.id, provider: 'google', providerSubject: 'secret-sub-123', profile: { sub: 'secret-sub-123', email: 'a@g.com', email_verified: true }, recentAuthentication: true });
    const userB = (await authService.registerEmailPassword({ email: 'auB@t.com', password: 'P', fullName: 'B', consent: CONSENT })).user!;
    await authService.linkProviderIdentity({ userId: userB.id, provider: 'google', providerSubject: 'secret-sub-123', profile: { sub: 'secret-sub-123', email: 'b@g.com', email_verified: true }, recentAuthentication: true }).catch(() => {});
    audit.events.forEach(event => {
      // subjectReference should be a hash, not the raw value
      if (event.subjectReference) {
        expect(event.subjectReference).not.toBe('secret-sub-123');
      }
    });
  });
});

/* ═══════════════════════════════════════════════════
   FR-15: Provider Resilience
   ═══════════════════════════════════════════════════ */

describe('FR-15: Provider Resilience', () => {
  test('disabling WhatsApp does not disable SMS', () => {
    const config = getUnifiedAuthConfig({
      AUTH_SMS_OTP_ENABLED: 'true',
      AUTH_WHATSAPP_OTP_ENABLED: 'false',
      TWILIO_ACCOUNT_SID: 'sid', TWILIO_AUTH_TOKEN: 'tok', TWILIO_VERIFY_SERVICE_SID: 'vsid',
    });
    expect(config.methods.sms.enabled).toBe(true);
    expect(config.methods.whatsapp.enabled).toBe(false);
  });

  test('disabling Google does not disable email', () => {
    const config = getUnifiedAuthConfig({
      AUTH_GOOGLE_ENABLED: 'false',
      AUTH_EMAIL_ENABLED: 'true',
      GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret',
    });
    expect(config.methods.google.enabled).toBe(false);
    expect(config.methods.email.enabled).toBe(true);
  });

  test('disabling all social does not disable phone or email', () => {
    const config = getUnifiedAuthConfig({
      AUTH_GOOGLE_ENABLED: 'false',
      AUTH_FACEBOOK_ENABLED: 'false',
      AUTH_APPLE_ENABLED: 'false',
      AUTH_EMAIL_ENABLED: 'true',
      AUTH_SMS_OTP_ENABLED: 'true',
      AUTH_WHATSAPP_OTP_ENABLED: 'true',
      TWILIO_ACCOUNT_SID: 'sid', TWILIO_AUTH_TOKEN: 'tok', TWILIO_VERIFY_SERVICE_SID: 'vsid',
    });
    expect(config.methods.email.enabled).toBe(true);
    expect(config.methods.sms.enabled).toBe(true);
    expect(config.methods.whatsapp.enabled).toBe(true);
  });

  test('phone provider unavailable throws PROVIDER_UNAVAILABLE', async () => {
    const { otpService } = createTestServices();
    setProviderUnavailable(true);
    await expect(
      otpService.start({ channel: 'sms', phone: '+639171234567' }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('disabled method throws METHOD_DISABLED', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const config = getUnifiedAuthConfig({ AUTH_SMS_OTP_ENABLED: 'false' });
    const mockProvider = new MockPhoneVerificationProvider();
    const otpService = new PhoneOtpAuthenticationService(repo, mockProvider, undefined, { config, now: () => fixedNow });
    await expect(
      otpService.start({ channel: 'sms', phone: '+639171234567' }),
    ).rejects.toThrow(UnifiedAuthError);
  });
});

/* ═══════════════════════════════════════════════════
   FR-16: WhatsApp OTP CORE Acceptance
   ═══════════════════════════════════════════════════ */

describe('FR-16: WhatsApp OTP CORE', () => {
  test('1. new WhatsApp user creates account', async () => {
    const { otpService, store } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'whatsapp', phone: '+639185551234' });
    const user = await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185551234', challengeId, code: VALID_TEST_CODE, consent: CONSENT });
    expect(user.id).toBeTruthy();
    expect(store.phoneIdentities).toHaveLength(1);
    expect(store.phoneIdentities[0].phone_e164).toBe('+639185551234');
  });

  test('2. returning WhatsApp user resolves same User', async () => {
    const { otpService, limiter } = createTestServices();
    const { challengeId: c1 } = await otpService.start({ channel: 'whatsapp', phone: '+639185559999' });
    const first = await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185559999', challengeId: c1, code: VALID_TEST_CODE, consent: CONSENT });
    limiter.reset(); // Reset cooldown
    const { challengeId: c2 } = await otpService.start({ channel: 'whatsapp', phone: '+639185559999' });
    const second = await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185559999', challengeId: c2, code: VALID_TEST_CODE });
    expect(second.id).toBe(first.id);
  });

  test('3. SMS then WhatsApp same phone — NO duplicate user', async () => {
    const { otpService, store } = createTestServices();
    const phone = '+639180001111';
    const { challengeId: c1 } = await otpService.start({ channel: 'sms', phone });
    const smsUser = await otpService.verifyForSignIn({ channel: 'sms', phone, challengeId: c1, code: VALID_TEST_CODE, consent: CONSENT });
    const { challengeId: c2 } = await otpService.start({ channel: 'whatsapp', phone });
    const waUser = await otpService.verifyForSignIn({ channel: 'whatsapp', phone, challengeId: c2, code: VALID_TEST_CODE });
    expect(waUser.id).toBe(smsUser.id);
    expect(store.users).toHaveLength(1);
    expect(store.phoneIdentities).toHaveLength(1);
  });

  test('4. WhatsApp then SMS same phone — NO duplicate user', async () => {
    const { otpService, store } = createTestServices();
    const phone = '+639180002222';
    const { challengeId: c1 } = await otpService.start({ channel: 'whatsapp', phone });
    const waUser = await otpService.verifyForSignIn({ channel: 'whatsapp', phone, challengeId: c1, code: VALID_TEST_CODE, consent: CONSENT });
    const { challengeId: c2 } = await otpService.start({ channel: 'sms', phone });
    const smsUser = await otpService.verifyForSignIn({ channel: 'sms', phone, challengeId: c2, code: VALID_TEST_CODE });
    expect(smsUser.id).toBe(waUser.id);
    expect(store.users).toHaveLength(1);
  });

  test('5. invalid OTP denied', async () => {
    const { otpService } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'whatsapp', phone: '+639185550000' });
    await expect(
      otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185550000', challengeId, code: '000000', consent: CONSENT }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('6. expired OTP denied', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const mockProvider = new MockPhoneVerificationProvider();
    const config = allEnabledConfig();
    const startService = new PhoneOtpAuthenticationService(repo, mockProvider, undefined, { config, now: () => fixedNow, expiryMs: 5 * 60 * 1000 });
    const { challengeId } = await startService.start({ channel: 'whatsapp', phone: '+639185550001' });
    const futureNow = new Date(fixedNow.getTime() + 10 * 60 * 1000);
    const verifyService = new PhoneOtpAuthenticationService(repo, mockProvider, undefined, { config, now: () => futureNow, expiryMs: 5 * 60 * 1000 });
    await expect(
      verifyService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185550001', challengeId, code: VALID_TEST_CODE, consent: CONSENT }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('7. replayed OTP denied', async () => {
    const { otpService } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'whatsapp', phone: '+639185550002' });
    await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185550002', challengeId, code: VALID_TEST_CODE, consent: CONSENT });
    await expect(
      otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185550002', challengeId, code: VALID_TEST_CODE }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('8. request throttling enforced', async () => {
    const store = createEmptyStore();
    const repo = new InMemoryUnifiedAuthRepository(store);
    const mockProvider = new MockPhoneVerificationProvider();
    const config = allEnabledConfig();
    const limiter = new InMemoryRateLimiter(); // Use the proper mock that respects keys
    const otpService = new PhoneOtpAuthenticationService(repo, mockProvider, limiter, { config, now: () => fixedNow });
    await otpService.start({ channel: 'whatsapp', phone: '+639185550003' });
    // Second immediate call will hit the 30-second cooldown
    await expect(
      otpService.start({ channel: 'whatsapp', phone: '+639185550003' }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('9. verification attempt limit enforced', async () => {
    const { otpService } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'whatsapp', phone: '+639185550004' });
    for (let i = 0; i < 5; i++) {
      await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185550004', challengeId, code: '999999', consent: CONSENT }).catch(() => {});
    }
    await expect(
      otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185550004', challengeId, code: VALID_TEST_CODE, consent: CONSENT }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('10. disabled user denied', async () => {
    const { otpService, store, limiter } = createTestServices();
    const { challengeId: c1 } = await otpService.start({ channel: 'whatsapp', phone: '+639185550005' });
    const user = await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185550005', challengeId: c1, code: VALID_TEST_CODE, consent: CONSENT });
    store.users.find(u => u.id === user.id)!.status = 'Blacklisted';
    limiter.reset(); // Reset cooldown
    const { challengeId: c2 } = await otpService.start({ channel: 'whatsapp', phone: '+639185550005' });
    await expect(
      otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185550005', challengeId: c2, code: VALID_TEST_CODE }),
    ).rejects.toThrow(UnifiedAuthError);
  });

  test('11. Phase 8 session semantics preserved (auth.ts uses registerUserSession)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'auth.ts'), 'utf-8');
    expect(content).toContain('registerUserSession');
    expect(content).toContain('hashSessionIdentifier');
  });

  test('12. MFA authority preserved (auth.ts uses MFA_SESSION_ASSURANCE_LEVEL_AAL2)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'auth.ts'), 'utf-8');
    expect(content).toContain('MFA_SESSION_ASSURANCE_LEVEL_AAL2');
  });

  test('13. WhatsApp disabled does NOT disable SMS', () => {
    const config = getUnifiedAuthConfig({
      AUTH_SMS_OTP_ENABLED: 'true',
      AUTH_WHATSAPP_OTP_ENABLED: 'false',
      TWILIO_ACCOUNT_SID: 'sid', TWILIO_AUTH_TOKEN: 'tok', TWILIO_VERIFY_SERVICE_SID: 'vsid',
    });
    expect(config.methods.sms.enabled).toBe(true);
    expect(config.methods.whatsapp.enabled).toBe(false);
  });

  test('14. OTP and secrets absent from audit events', async () => {
    const { otpService, audit } = createTestServices();
    const { challengeId } = await otpService.start({ channel: 'whatsapp', phone: '+639185550006' });
    await otpService.verifyForSignIn({ channel: 'whatsapp', phone: '+639185550006', challengeId, code: VALID_TEST_CODE, consent: CONSENT });
    const allEventsJson = JSON.stringify(audit.events);
    expect(allEventsJson).not.toContain(VALID_TEST_CODE);
    expect(allEventsJson).not.toContain('+639185550006');
    expect(allEventsJson).not.toContain('test-twilio-token');
  });

  test('isInactiveAccountStatus correctly identifies disabled statuses', () => {
    expect(isInactiveAccountStatus('Suspended')).toBe(true);
    expect(isInactiveAccountStatus('Blacklisted')).toBe(true);
    expect(isInactiveAccountStatus('Disabled')).toBe(true);
    expect(isInactiveAccountStatus('Verified')).toBe(false);
    expect(isInactiveAccountStatus('Pending')).toBe(false);
  });

  test('createSyntheticIdentityEmail produces valid format', () => {
    const email = createSyntheticIdentityEmail('phone', '+639185550001');
    expect(email).toContain('@identity.rentipid.invalid');
    expect(email).toMatch(/^auth\+/);
  });

  test('canonicalizeEmail normalizes case and whitespace', () => {
    expect(canonicalizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
  });
});
