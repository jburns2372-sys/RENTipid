jest.mock('@/lib/address/rate-limiter', () => ({
  DatabaseRateLimiter: { consume: jest.fn() },
}));

import { MfaRateLimiter } from '@/lib/security/auth/mfa-rate-limiter';
import { DatabaseRateLimiter } from '@/lib/address/rate-limiter';

const mockConsume = DatabaseRateLimiter.consume as jest.Mock;

describe('MfaRateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['enrollment', 5, 15 * 60 * 1000],
    ['activation', 10, 10 * 60 * 1000],
    ['verification', 10, 10 * 60 * 1000],
  ] as const)('uses durable user-and-operation keys for %s', async (operation, limit, windowMs) => {
    mockConsume.mockResolvedValue(true);

    await expect(MfaRateLimiter.consume('user-1', operation)).resolves.toBe(true);

    expect(mockConsume).toHaveBeenCalledWith(`rl:mfa:${operation}:user-1`, limit, windowMs);
  });

  it('preserves a fail-closed result from the durable limiter', async () => {
    mockConsume.mockResolvedValue(false);

    await expect(MfaRateLimiter.consume('user-1', 'verification')).resolves.toBe(false);
  });
});
