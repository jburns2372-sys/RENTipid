import 'server-only';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { PhoneOtpRateLimiter } from './services';
import { canonicalizeEmail, createReferenceHash } from './identifiers';

export type AuthRateLimitRow = {
  points: number;
  reset_at: Date;
};

export interface RateLimitResult {
  allowed: boolean;
  points: number;
  limit: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

export interface AuthRateLimiterBackend extends PhoneOtpRateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<boolean>;
  consumeDetailed(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  pruneExpired?(): Promise<void>;
}

export class DatabaseAuthRateLimiter implements AuthRateLimiterBackend {
  async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    const res = await this.consumeDetailed(key, limit, windowMs);
    return res.allowed;
  }

  async consumeDetailed(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const rows = await prisma.$queryRaw<AuthRateLimitRow[]>`
      INSERT INTO "AuthRateLimit" ("key", "points", "reset_at")
      VALUES (${key}, 1, NOW() + (${windowMs} || ' milliseconds')::interval)
      ON CONFLICT ("key") DO UPDATE SET
        "points" = CASE
          WHEN "AuthRateLimit"."reset_at" < NOW() THEN 1
          ELSE "AuthRateLimit"."points" + 1
        END,
        "reset_at" = CASE
          WHEN "AuthRateLimit"."reset_at" < NOW() THEN NOW() + (${windowMs} || ' milliseconds')::interval
          ELSE "AuthRateLimit"."reset_at"
        END
      RETURNING "points", "reset_at"
    `;

    const row = rows[0];
    if (!row) {
      throw new Error('AUTH_RATE_LIMITER_EMPTY_RESULT');
    }

    const resetAt = new Date(row.reset_at);
    const now = Date.now();
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000));
    const allowed = row.points <= limit;

    return {
      allowed,
      points: row.points,
      limit,
      resetAt,
      retryAfterSeconds,
    };
  }

  async pruneExpired(): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`DELETE FROM "AuthRateLimit" WHERE "reset_at" < NOW()`);
  }
}

/**
 * Resolves the client IP address conservatively.
 * In a reverse-proxy topology (e.g. Vercel, ALB, Cloudflare), the nearest trusted
 * proxy appends the true client IP to the end of the X-Forwarded-For list.
 * Parsing the last element prevents attackers from rotating rate-limit keys by
 * spoofing leading IP elements.
 */
export function resolveRegistrationClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const parts = forwardedFor.split(',');
    const candidate = parts[parts.length - 1]?.trim();
    if (candidate) return candidate;
  }
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const cfConnectingIp = req.headers.get('cf-connecting-ip')?.trim();
  if (cfConnectingIp) return cfConnectingIp;
  return 'unknown';
}

export interface RegistrationRateLimitPolicy {
  ipLimit: number;
  emailLimit: number;
  windowMs: number;
}

export function getRegistrationRateLimitPolicy(
  env: Record<string, string | undefined> = process.env,
): RegistrationRateLimitPolicy {
  const ipLimitStr = env.AUTH_REGISTRATION_RATE_LIMIT_IP;
  const emailLimitStr = env.AUTH_REGISTRATION_RATE_LIMIT_EMAIL;
  const windowMsStr = env.AUTH_REGISTRATION_RATE_LIMIT_WINDOW_MS;

  const ipLimit = ipLimitStr ? parseInt(ipLimitStr, 10) : 10;
  const emailLimit = emailLimitStr ? parseInt(emailLimitStr, 10) : 5;
  const windowMs = windowMsStr ? parseInt(windowMsStr, 10) : 3600000; // 1 hour

  return {
    ipLimit: Number.isFinite(ipLimit) && ipLimit > 0 ? ipLimit : 10,
    emailLimit: Number.isFinite(emailLimit) && emailLimit > 0 ? emailLimit : 5,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 3600000,
  };
}

export function getRegistrationRateLimitKeys(ip: string, email: string) {
  const normalizedEmail = canonicalizeEmail(email);
  const networkHash = createReferenceHash(ip, 'register-network');
  const identityHash = createReferenceHash(normalizedEmail, 'register-identity');
  return {
    networkKey: `auth:register:network:${networkHash}`,
    identityKey: `auth:register:identity:${identityHash}`,
    networkHash,
    identityHash,
  };
}

export interface RegistrationRateLimitCheckResult {
  allowed: boolean;
  blockedDimension?: 'network' | 'identity';
  retryAfterSeconds: number;
}

export class RegistrationRateLimiter {
  constructor(private readonly backend: AuthRateLimiterBackend = new DatabaseAuthRateLimiter()) {}

  async check(
    req: Request,
    email: string,
    policyOverrides?: Partial<RegistrationRateLimitPolicy>,
  ): Promise<RegistrationRateLimitCheckResult> {
    const ip = resolveRegistrationClientIp(req);
    const { networkKey, identityKey } = getRegistrationRateLimitKeys(ip, email);
    const defaultPolicy = getRegistrationRateLimitPolicy();
    const policy: RegistrationRateLimitPolicy = {
      ipLimit: policyOverrides?.ipLimit ?? defaultPolicy.ipLimit,
      emailLimit: policyOverrides?.emailLimit ?? defaultPolicy.emailLimit,
      windowMs: policyOverrides?.windowMs ?? defaultPolicy.windowMs,
    };

    // Concurrently consume identity and network quotas
    const [identityResult, networkResult] = await Promise.all([
      this.backend.consumeDetailed(identityKey, policy.emailLimit, policy.windowMs),
      this.backend.consumeDetailed(networkKey, policy.ipLimit, policy.windowMs),
    ]);

    if (!identityResult.allowed) {
      return {
        allowed: false,
        blockedDimension: 'identity',
        retryAfterSeconds: identityResult.retryAfterSeconds,
      };
    }

    if (!networkResult.allowed) {
      return {
        allowed: false,
        blockedDimension: 'network',
        retryAfterSeconds: networkResult.retryAfterSeconds,
      };
    }

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }
}

let activeRegistrationRateLimiter: RegistrationRateLimiter | null = null;

export function getRegistrationRateLimiter(): RegistrationRateLimiter {
  if (!activeRegistrationRateLimiter) {
    activeRegistrationRateLimiter = new RegistrationRateLimiter();
  }
  return activeRegistrationRateLimiter;
}

export function setRegistrationRateLimiterForTesting(limiter: RegistrationRateLimiter | null): void {
  activeRegistrationRateLimiter = limiter;
}

export async function checkRegistrationRateLimit(
  req: Request,
  email: string,
  policyOverrides?: Partial<RegistrationRateLimitPolicy>,
): Promise<RegistrationRateLimitCheckResult> {
  return getRegistrationRateLimiter().check(req, email, policyOverrides);
}
