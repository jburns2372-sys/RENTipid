import { NextRequest } from 'next/server';
import { POST as createOAuthIntent } from '@/app/api/auth/oauth/intent/route';
import { handleOtpPost } from '@/app/api/auth/otp/route';
import { getUnifiedAuthConfig } from '@/lib/auth/unified/config';
import {
  OTP_ANONYMOUS_CLIENT_COOKIE,
} from '@/lib/auth/unified/anonymous-client';
import { OAUTH_CONSENT_COOKIE } from '@/lib/auth/unified/oauth-consent';
import {
  PhoneOtpAuthenticationService,
  type PhoneOtpRateLimiter,
  type PhoneVerificationProvider,
} from '@/lib/auth/unified/services';
import {
  InMemoryUnifiedAuthRepository,
  createEmptyStore,
} from './helpers/in-memory-repository';

const TEST_ENV_KEYS = [
  'AUTH_GOOGLE_ENABLED',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'AUTH_SMS_OTP_ENABLED',
  'AUTH_WHATSAPP_OTP_ENABLED',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_VERIFY_SERVICE_SID',
  'AUTH_REFERENCE_HASH_SECRET',
  'NEXTAUTH_SECRET',
] as const;

type TestEnvKey = typeof TEST_ENV_KEYS[number];
type OtpStartInput = Parameters<PhoneOtpAuthenticationService['start']>[0];

const originalEnv = Object.fromEntries(
  TEST_ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<TestEnvKey, string | undefined>;

class RecordingRateLimiter implements PhoneOtpRateLimiter {
  readonly calls: { key: string; limit: number; windowMs: number }[] = [];

  constructor(private readonly blockedDimension?: 'number' | 'client' | 'network') {}

  async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    this.calls.push({ key, limit, windowMs });
    return !this.blockedDimension || !key.includes(`:${this.blockedDimension}:`);
  }
}

class CountingPhoneProvider implements PhoneVerificationProvider {
  startCalls = 0;

  async start(): Promise<{ providerChallengeId: string }> {
    this.startCalls += 1;
    return { providerChallengeId: `route-test-${this.startCalls}` };
  }

  async verify(): Promise<{ approved: boolean }> {
    return { approved: true };
  }
}

function restoreEnvironment() {
  for (const key of TEST_ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function oauthRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/oauth/intent', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function otpRequest(options: {
  phone?: string;
  cookieValue?: string;
  userAgent?: string;
  network?: string;
} = {}): NextRequest {
  const headers = new Headers({
    'content-type': 'application/json',
    'user-agent': options.userAgent || 'Shared Browser/1.0',
    'x-forwarded-for': options.network || '198.51.100.10',
  });
  if (options.cookieValue) {
    headers.set('cookie', `${OTP_ANONYMOUS_CLIENT_COOKIE}=${options.cookieValue}`);
  }

  return new NextRequest('http://localhost/api/auth/otp', {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone: options.phone || '+639171000001', channel: 'whatsapp' }),
  });
}

function createOtpHarness(blockedDimension?: 'number' | 'client' | 'network') {
  const store = createEmptyStore();
  const limiter = new RecordingRateLimiter(blockedDimension);
  const provider = new CountingPhoneProvider();
  const service = new PhoneOtpAuthenticationService(
    new InMemoryUnifiedAuthRepository(store),
    provider,
    limiter,
    {
      config: getUnifiedAuthConfig({
        AUTH_WHATSAPP_OTP_ENABLED: 'true',
        TWILIO_ACCOUNT_SID: 'test-account',
        TWILIO_AUTH_TOKEN: 'test-token',
        TWILIO_VERIFY_SERVICE_SID: 'test-service',
      }),
    },
  );
  const starts: OtpStartInput[] = [];
  const routeService = {
    start: async (input: OtpStartInput) => {
      starts.push(input);
      return service.start(input);
    },
  };
  return { limiter, provider, routeService, starts, store };
}

function rawOpaqueIdentifier(cookieValue: string): string {
  return cookieValue.split('.')[0];
}

describe('Unified auth route corrections', () => {
  beforeAll(() => {
    process.env.AUTH_GOOGLE_ENABLED = 'true';
    process.env.GOOGLE_CLIENT_ID = 'route-test-google-client';
    process.env.GOOGLE_CLIENT_SECRET = 'route-test-google-secret';
    process.env.AUTH_SMS_OTP_ENABLED = 'true';
    process.env.AUTH_WHATSAPP_OTP_ENABLED = 'true';
    process.env.TWILIO_ACCOUNT_SID = 'route-test-account';
    process.env.TWILIO_AUTH_TOKEN = 'route-test-token';
    process.env.TWILIO_VERIFY_SERVICE_SID = 'route-test-service';
    process.env.AUTH_REFERENCE_HASH_SECRET = 'route-test-reference-secret-0123456789abcdef';
    process.env.NEXTAUTH_SECRET = 'route-test-nextauth-secret-0123456789abcdef';
  });

  afterAll(restoreEnvironment);

  describe('OAuth consent intent', () => {
    test('issues a signed intent only when Terms and Privacy are explicitly accepted', async () => {
      const response = await createOAuthIntent(oauthRequest({
        provider: 'google',
        termsAccepted: true,
        privacyAccepted: true,
      }));

      const token = response.cookies.get(OAUTH_CONSENT_COOKIE)?.value;
      expect(token).toBeDefined();
      const encodedPayload = token?.split('.')[0] || '';
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
        provider: string;
        termsVersion: string;
        privacyVersion: string;
      };
      expect(payload).toMatchObject({
        provider: 'google',
        termsVersion: 'unified-multi-login-v1.1',
        privacyVersion: 'unified-multi-login-v1.1',
      });
    });

    test.each([
      ['Terms only', { provider: 'google', termsAccepted: true, privacyAccepted: false }],
      ['Privacy only', { provider: 'google', termsAccepted: false, privacyAccepted: true }],
      ['neither policy', { provider: 'google', termsAccepted: false, privacyAccepted: false }],
      ['missing Terms', { provider: 'google', privacyAccepted: true }],
      ['missing Privacy', { provider: 'google', termsAccepted: true }],
      ['non-boolean values', { provider: 'google', termsAccepted: 'true', privacyAccepted: 1 }],
      ['legacy accepted shortcut', { provider: 'google', accepted: true }],
    ])('rejects %s without manufacturing dual consent', async (_label, body) => {
      const response = await createOAuthIntent(oauthRequest(body));
      expect(response.cookies.get(OAUTH_CONSENT_COOKIE)).toBeUndefined();
    });
  });

  describe('OTP anonymous client identity', () => {
    test('same User-Agent clients receive distinct server-generated client buckets', async () => {
      const harness = createOtpHarness();
      const first = await handleOtpPost(otpRequest({ phone: '+639171000011' }), harness.routeService);
      const second = await handleOtpPost(otpRequest({ phone: '+639171000012' }), harness.routeService);

      const firstCookie = first.cookies.get(OTP_ANONYMOUS_CLIENT_COOKIE)?.value;
      const secondCookie = second.cookies.get(OTP_ANONYMOUS_CLIENT_COOKIE)?.value;
      expect(firstCookie).toBeDefined();
      expect(secondCookie).toBeDefined();
      expect(firstCookie).not.toBe(secondCookie);
      expect(harness.starts[0].clientReference).not.toBe(harness.starts[1].clientReference);
      const clientKeys = harness.limiter.calls
        .filter((call) => call.key.includes(':client:'))
        .map((call) => call.key);
      expect(clientKeys).toHaveLength(2);
      expect(clientKeys[0]).not.toBe(clientKeys[1]);
    });

    test('the same signed client cookie retains its bucket when User-Agent changes', async () => {
      const harness = createOtpHarness();
      const first = await handleOtpPost(otpRequest({
        phone: '+639171000021',
        userAgent: 'Shared Browser/1.0',
      }), harness.routeService);
      const cookieValue = first.cookies.get(OTP_ANONYMOUS_CLIENT_COOKIE)?.value;
      expect(cookieValue).toBeDefined();

      await handleOtpPost(otpRequest({
        phone: '+639171000022',
        cookieValue,
        userAgent: 'Different Browser/9.0',
      }), harness.routeService);

      expect(harness.starts[0].clientReference).toBe(harness.starts[1].clientReference);
      const clientKeys = harness.limiter.calls
        .filter((call) => call.key.includes(':client:'))
        .map((call) => call.key);
      expect(clientKeys).toHaveLength(2);
      expect(clientKeys[0]).toBe(clientKeys[1]);
      expect(harness.starts[0]).not.toHaveProperty('sessionKey');
      expect(harness.starts[0]).not.toHaveProperty('mfaSessionId');
      expect(harness.starts[0]).not.toHaveProperty('userAgent');
    });

    test('keeps phone, client, and network controls while persisting only derived references', async () => {
      const harness = createOtpHarness();
      const response = await handleOtpPost(otpRequest({ phone: '+639171000031' }), harness.routeService);
      const cookieValue = response.cookies.get(OTP_ANONYMOUS_CLIENT_COOKIE)?.value;
      expect(cookieValue).toBeDefined();
      const setCookie = response.headers.get('set-cookie') || '';
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=lax');
      expect(setCookie).toContain('Path=/api/auth');
      expect(cookieValue).not.toContain('+639171000031');

      const keys = harness.limiter.calls.map((call) => call.key);
      expect(keys.some((key) => key.includes(':number:'))).toBe(true);
      expect(keys.some((key) => key.includes(':cooldown:'))).toBe(true);
      expect(keys.some((key) => key.includes(':client:'))).toBe(true);
      expect(keys.some((key) => key.includes(':network:'))).toBe(true);

      const opaqueIdentifier = rawOpaqueIdentifier(cookieValue || '');
      expect(keys.every((key) => !key.includes(opaqueIdentifier))).toBe(true);
      expect(JSON.stringify(harness.store)).not.toContain(opaqueIdentifier);
      expect(harness.store.challenges[0].session_reference_hash).toMatch(/^[a-f0-9]{64}$/);
      await expect(response.json()).resolves.not.toHaveProperty('clientReference');
    });

    test.each([
      ['phone target', 'number' as const],
      ['anonymous client', 'client' as const],
      ['network', 'network' as const],
    ])('%s limiter can block before the provider is called', async (_label, dimension) => {
      const harness = createOtpHarness(dimension);
      const response = await handleOtpPost(otpRequest(), harness.routeService);
      const body = await response.json() as { challengeId?: string };
      expect(body.challengeId).toBeUndefined();
      expect(harness.provider.startCalls).toBe(0);
    });

    test('rejects an unsigned arbitrary cookie and replaces it server-side', async () => {
      const harness = createOtpHarness();
      const forged = `${'A'.repeat(43)}.${'B'.repeat(43)}`;
      const response = await handleOtpPost(otpRequest({ cookieValue: forged }), harness.routeService);
      const replacement = response.cookies.get(OTP_ANONYMOUS_CLIENT_COOKIE)?.value;
      expect(replacement).toBeDefined();
      expect(replacement).not.toBe(forged);
    });
  });
});
