import 'server-only';
import { DatabaseRateLimiter } from '@/lib/address/rate-limiter';

export type MfaRateLimitOperation = 'enrollment' | 'activation' | 'verification';

const MFA_RATE_LIMITS: Record<MfaRateLimitOperation, { limit: number; windowMs: number }> = {
  enrollment: { limit: 5, windowMs: 15 * 60 * 1000 },
  activation: { limit: 10, windowMs: 10 * 60 * 1000 },
  verification: { limit: 10, windowMs: 10 * 60 * 1000 },
};

export class MfaRateLimiter {
  static async consume(userId: string, operation: MfaRateLimitOperation): Promise<boolean> {
    const policy = MFA_RATE_LIMITS[operation];
    const key = `rl:mfa:${operation}:${userId}`;
    return DatabaseRateLimiter.consume(key, policy.limit, policy.windowMs);
  }

  static retryAfterSeconds(operation: MfaRateLimitOperation): number {
    return Math.ceil(MFA_RATE_LIMITS[operation].windowMs / 1000);
  }
}
