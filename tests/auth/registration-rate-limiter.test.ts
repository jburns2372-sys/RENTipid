jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn(async () => ({ id: 'audit_123' })),
}));

const mockRequestEmailVerification = jest.fn(async () => ({ accepted: true }));
jest.mock('@/lib/auth/unified/ancillary-factory', () => ({
  createAuthAncillaryService: () => ({
    requestEmailVerification: mockRequestEmailVerification,
  }),
  resolveAuthPublicBaseUrl: (url: string) => url,
}));

let bcryptHashCalls = 0;
jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => {
    bcryptHashCalls += 1;
    return `$2a$10$syntheticBcryptHashForTesting_${bcryptHashCalls}`;
  }),
  compare: jest.fn(async () => true),
}));

jest.mock('@/lib/prisma', () => {
  const db = {
    user: {
      findUnique: jest.fn(async () => null),
      create: jest.fn(async ({ data }: any) => ({
        id: 'usr_mock_123',
        ...data,
      })),
    },
    emailCredential: {
      create: jest.fn(async ({ data }: any) => data),
    },
    userGlobalPreference: {
      create: jest.fn(async ({ data }: any) => data),
    },
    userProfile: {
      create: jest.fn(async ({ data }: any) => data),
    },
    businessProfile: {
      create: jest.fn(async ({ data }: any) => data),
    },
    $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) => callback((jest.requireMock('@/lib/prisma') as any).prisma)),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };
  return { prisma: db };
});

import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { createAuthAncillaryService } from '@/lib/auth/unified/ancillary-factory';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import {
  RegistrationRateLimiter,
  setRegistrationRateLimiterForTesting,
  resolveRegistrationClientIp,
  getRegistrationRateLimitKeys,
  DatabaseAuthRateLimiter,
  type AuthRateLimiterBackend,
  type RateLimitResult,
} from '@/lib/auth/unified/rate-limiter';

const db = prisma as unknown as {
  user: { findUnique: jest.Mock; create: jest.Mock };
  emailCredential: { create: jest.Mock };
  userGlobalPreference: { create: jest.Mock };
  userProfile: { create: jest.Mock };
  businessProfile: { create: jest.Mock };
  $transaction: jest.Mock;
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
};

const mockCreateAuditLog = createAuditLog as unknown as jest.Mock;

/**
 * In-memory test rate limiter backend for deterministic boundary testing.
 */
class MemoryAuthRateLimiterBackend implements AuthRateLimiterBackend {
  private readonly buckets = new Map<string, { points: number; resetAt: Date }>();
  public shouldThrow = false;

  async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    const res = await this.consumeDetailed(key, limit, windowMs);
    return res.allowed;
  }

  async consumeDetailed(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    if (this.shouldThrow) {
      throw new Error('DATABASE_CONNECTION_REFUSED');
    }

    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt.getTime() < now) {
      bucket = { points: 1, resetAt: new Date(now + windowMs) };
    } else {
      bucket.points += 1;
    }
    this.buckets.set(key, bucket);

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt.getTime() - now) / 1000));
    return {
      allowed: bucket.points <= limit,
      points: bucket.points,
      limit,
      resetAt: bucket.resetAt,
      retryAfterSeconds,
    };
  }

  reset(): void {
    this.buckets.clear();
    this.shouldThrow = false;
  }
}

function createRegisterRequest(body: Record<string, any>, ip: string = '198.51.100.1'): Request {
  return new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

const validRegistrationPayload = (email: string) => ({
  email,
  password: 'Password123!',
  full_name: 'Jane Doe',
  country: 'PH',
  account_type: 'Individual',
  role: 'Renter',
});

describe('ISO-C2-M3: Registration Pre-Effect Rate Limiting (DEF-RUNTIME-01 / TRT-C02)', () => {
  let memoryBackend: MemoryAuthRateLimiterBackend;

  beforeEach(() => {
    jest.clearAllMocks();
    bcryptHashCalls = 0;
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockImplementation(async ({ data }: any) => ({ id: 'usr_mock_123', ...data }));
    db.$transaction.mockImplementation(async (callback: any) => callback(db));

    memoryBackend = new MemoryAuthRateLimiterBackend();
    setRegistrationRateLimiterForTesting(new RegistrationRateLimiter(memoryBackend));
  });

  afterEach(() => {
    setRegistrationRateLimiterForTesting(null);
  });

  describe('Contract A: Sub-threshold requests follow normal registration behavior', () => {
    test('executes password hashing, transactional account writes, audit log, and email verification below threshold', async () => {
      const email = 'user1@example.com';
      const req = createRegisterRequest(validRegistrationPayload(email), '198.51.100.10');

      const response = await registerHandler(req);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.message).toContain('Registration accepted');

      // Side effects MUST have executed for authorized registration
      expect(bcryptHashCalls).toBe(1);
      expect(db.user.findUnique).toHaveBeenCalledTimes(1);
      expect(db.$transaction).toHaveBeenCalledTimes(1);
      expect(db.user.create).toHaveBeenCalledTimes(1);
      expect(mockCreateAuditLog).toHaveBeenCalledTimes(1);
      expect(mockRequestEmailVerification).toHaveBeenCalledTimes(1);
    });
  });

  describe('Contract B & C: Exact threshold boundary behavior & HTTP 429 contract', () => {
    test('allows requests exactly up to the limit and rejects the very next request with HTTP 429 and Retry-After', async () => {
      const email = 'boundary_user@example.com';
      const clientIp = '198.51.100.20';
      const limit = 3;

      process.env.AUTH_REGISTRATION_RATE_LIMIT_IP = '3';
      process.env.AUTH_REGISTRATION_RATE_LIMIT_EMAIL = '3';

      // Attempts 1, 2, 3 should all succeed
      for (let i = 1; i <= limit; i++) {
        const req = createRegisterRequest(validRegistrationPayload(`test_${i}_${email}`), clientIp);
        const res = await registerHandler(req);
        expect(res.status).toBe(201);
      }

      expect(bcryptHashCalls).toBe(3);
      expect(db.$transaction).toHaveBeenCalledTimes(3);

      // Attempt 4 MUST be throttled
      const req4 = createRegisterRequest(validRegistrationPayload(`test_4_${email}`), clientIp);
      const res4 = await registerHandler(req4);

      expect(res4.status).toBe(429);
      expect(res4.headers.get('Retry-After')).toBeTruthy();
      const retryAfter = Number(res4.headers.get('Retry-After'));
      expect(Number.isInteger(retryAfter)).toBe(true);
      expect(retryAfter).toBeGreaterThan(0);

      const body4 = await res4.json();
      expect(body4).toEqual({
        message: 'Too many registration attempts. Please try again later.',
      });

      delete process.env.AUTH_REGISTRATION_RATE_LIMIT_IP;
      delete process.env.AUTH_REGISTRATION_RATE_LIMIT_EMAIL;
    });
  });

  describe('Contract D & E: Zero side-effect proof on throttled requests', () => {
    test('produces ZERO password hashing, ZERO database writes, ZERO audit logs, and ZERO emails when throttled', async () => {
      const clientIp = '198.51.100.30';
      const email = 'pre_effect_test@example.com';

      process.env.AUTH_REGISTRATION_RATE_LIMIT_IP = '1';
      process.env.AUTH_REGISTRATION_RATE_LIMIT_EMAIL = '1';

      // First attempt consumes quota and succeeds
      const req1 = createRegisterRequest(validRegistrationPayload(email), clientIp);
      const res1 = await registerHandler(req1);
      expect(res1.status).toBe(201);

      // Record baseline counters
      const bcryptCountBefore = bcryptHashCalls;
      const dbTxCountBefore = db.$transaction.mock.calls.length;
      const findUniqueCountBefore = db.user.findUnique.mock.calls.length;
      const auditCountBefore = mockCreateAuditLog.mock.calls.length;
      const emailCountBefore = mockRequestEmailVerification.mock.calls.length;

      // Second attempt is throttled
      const req2 = createRegisterRequest(validRegistrationPayload(email), clientIp);
      const res2 = await registerHandler(req2);

      expect(res2.status).toBe(429);

      // RIGOROUS ZERO-SIDE-EFFECT VERIFICATION:
      // None of the expensive or state-mutating registration operations were executed on request 2
      expect(bcryptHashCalls).toBe(bcryptCountBefore); // NO bcrypt CPU consumption
      expect(db.user.findUnique.mock.calls.length).toBe(findUniqueCountBefore); // NO database lookup
      expect(db.$transaction.mock.calls.length).toBe(dbTxCountBefore); // NO user/credential/profile write
      expect(mockCreateAuditLog.mock.calls.length).toBe(auditCountBefore); // NO audit event
      expect(mockRequestEmailVerification.mock.calls.length).toBe(emailCountBefore); // NO verification token or email

      delete process.env.AUTH_REGISTRATION_RATE_LIMIT_IP;
      delete process.env.AUTH_REGISTRATION_RATE_LIMIT_EMAIL;
    });
  });

  describe('Contract F: Multi-dimensional scoping (IP vs Email)', () => {
    test('throttles IP exhaustion without blocking different IPs', async () => {
      process.env.AUTH_REGISTRATION_RATE_LIMIT_IP = '2';
      process.env.AUTH_REGISTRATION_RATE_LIMIT_EMAIL = '10';

      const ipA = '198.51.100.41';
      const ipB = '198.51.100.42';

      // IP A makes 2 attempts
      await registerHandler(createRegisterRequest(validRegistrationPayload('u1@test.com'), ipA));
      await registerHandler(createRegisterRequest(validRegistrationPayload('u2@test.com'), ipA));

      // IP A attempt 3 is blocked
      const resA3 = await registerHandler(createRegisterRequest(validRegistrationPayload('u3@test.com'), ipA));
      expect(resA3.status).toBe(429);

      // IP B should NOT be blocked
      const resB1 = await registerHandler(createRegisterRequest(validRegistrationPayload('u4@test.com'), ipB));
      expect(resB1.status).toBe(201);

      delete process.env.AUTH_REGISTRATION_RATE_LIMIT_IP;
      delete process.env.AUTH_REGISTRATION_RATE_LIMIT_EMAIL;
    });

    test('throttles targeted email attacks across distributed IPs', async () => {
      process.env.AUTH_REGISTRATION_RATE_LIMIT_IP = '10';
      process.env.AUTH_REGISTRATION_RATE_LIMIT_EMAIL = '2';

      const victimEmail = 'target@victim.com';

      // Attempt 1 from IP 1
      const res1 = await registerHandler(createRegisterRequest(validRegistrationPayload(victimEmail), '198.51.100.51'));
      expect(res1.status).toBe(201);

      // Attempt 2 from IP 2
      const res2 = await registerHandler(createRegisterRequest(validRegistrationPayload(victimEmail), '198.51.100.52'));
      expect(res2.status).toBe(201);

      // Attempt 3 from IP 3 targeting the same email must be throttled by identity quota
      const res3 = await registerHandler(createRegisterRequest(validRegistrationPayload(victimEmail), '198.51.100.53'));
      expect(res3.status).toBe(429);

      delete process.env.AUTH_REGISTRATION_RATE_LIMIT_IP;
      delete process.env.AUTH_REGISTRATION_RATE_LIMIT_EMAIL;
    });
  });

  describe('Contract G & H: Spoofable header safety & sanitized response', () => {
    test('safely extracts the nearest reverse-proxy client IP and ignores forged leading elements', () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 198.51.100.99',
        },
      });

      const resolvedIp = resolveRegistrationClientIp(req);
      expect(resolvedIp).toBe('198.51.100.99');
    });

    test('generates pseudonymous reference hashes with zero raw PII in limiter keys', () => {
      const { networkKey, identityKey } = getRegistrationRateLimitKeys('198.51.100.1', 'user@example.com');

      expect(networkKey).toMatch(/^auth:register:network:[a-f0-9]{64}$/);
      expect(identityKey).toMatch(/^auth:register:identity:[a-f0-9]{64}$/);

      // Raw PII must NOT appear in keys
      expect(networkKey).not.toContain('198.51.100.1');
      expect(identityKey).not.toContain('user@example.com');
    });

    test('contains no secrets or sensitive debug info in HTTP 429 response', async () => {
      process.env.AUTH_REGISTRATION_RATE_LIMIT_IP = '1';
      const ip = '198.51.100.88';

      await registerHandler(createRegisterRequest(validRegistrationPayload('u88@test.com'), ip));
      const res = await registerHandler(createRegisterRequest(validRegistrationPayload('u88_2@test.com'), ip));

      expect(res.status).toBe(429);
      const json = await res.json();

      expect(Object.keys(json)).toEqual(['message']);
      expect(json.message).toBe('Too many registration attempts. Please try again later.');

      delete process.env.AUTH_REGISTRATION_RATE_LIMIT_IP;
    });
  });

  describe('Contract I: Fail-Closed behavior on limiter backend error', () => {
    test('fails closed and blocks registration when rate limiter backend is unavailable', async () => {
      memoryBackend.shouldThrow = true; // Simulate database connectivity failure

      const req = createRegisterRequest(validRegistrationPayload('fail_closed@example.com'), '198.51.100.77');
      const response = await registerHandler(req);

      // Must reject with 500, NOT proceed with registration
      expect(response.status).toBe(500);

      // ZERO side effects occurred
      expect(bcryptHashCalls).toBe(0);
      expect(db.user.findUnique).not.toHaveBeenCalled();
      expect(db.$transaction).not.toHaveBeenCalled();
      expect(mockCreateAuditLog).not.toHaveBeenCalled();
      expect(mockRequestEmailVerification).not.toHaveBeenCalled();
    });
  });

  describe('DatabaseAuthRateLimiter SQL Engine & Pruning', () => {
    test('correctly executes SQL upsert and returns RateLimitResult', async () => {
      const dbLimiter = new DatabaseAuthRateLimiter();
      const mockResetAt = new Date(Date.now() + 60000);

      db.$queryRaw.mockResolvedValueOnce([
        { points: 2, reset_at: mockResetAt },
      ]);

      const result = await dbLimiter.consumeDetailed('test:key', 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.points).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);

      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    test('prunes expired records via DELETE query', async () => {
      const dbLimiter = new DatabaseAuthRateLimiter();
      db.$executeRaw.mockResolvedValueOnce(3);

      await dbLimiter.pruneExpired();
      expect(db.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });
});
