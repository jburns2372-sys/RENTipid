import type { ListingBridgeRetrievalRatePolicy } from './policy';
import { ListingBridgeSecurityError } from '../security/errors';

export interface ListingBridgeRateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<boolean>;
}

export class DatabaseListingBridgeRateLimiter implements ListingBridgeRateLimiter {
  async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    try {
      const { prisma } = await import('../../prisma');
      const rows: Record<string, unknown>[] = await prisma.$queryRaw`
        INSERT INTO "AddressApiRateLimit" ("key", "points", "resetAt")
        VALUES (${key}, 1, NOW() + (${windowMs} || ' milliseconds')::interval)
        ON CONFLICT ("key") DO UPDATE SET
          "points" = CASE
            WHEN "AddressApiRateLimit"."resetAt" < NOW() THEN 1
            ELSE "AddressApiRateLimit"."points" + 1
          END,
          "resetAt" = CASE
            WHEN "AddressApiRateLimit"."resetAt" < NOW() THEN NOW() + (${windowMs} || ' milliseconds')::interval
            ELSE "AddressApiRateLimit"."resetAt"
          END
        RETURNING "points";
      `;
      const points = rows[0]?.points as number | undefined;
      return points !== undefined ? points <= limit : false;
    } catch {
      return true;
    }
  }
}

export async function enforceListingBridgeRatePolicy(
  ratePolicy: ListingBridgeRetrievalRatePolicy | undefined,
  limiter: ListingBridgeRateLimiter,
): Promise<void> {
  if (!ratePolicy) return;
  const allowed = await limiter.consume(ratePolicy.key, ratePolicy.limit, ratePolicy.windowMs);
  if (!allowed) {
    throw new ListingBridgeSecurityError({
      code: 'RATE_LIMITED',
      safeDetails: {
        rateKey: ratePolicy.key,
        limit: ratePolicy.limit,
        windowMs: ratePolicy.windowMs,
      },
    });
  }
}

export function buildListingBridgeRateKey(input: {
  readonly actorUserId: string;
  readonly providerId: string;
  readonly connectorId: string;
  readonly sourceReferenceHash: string;
}): string {
  return [
    'rl:listingbridge:retrieval',
    input.providerId,
    input.actorUserId,
    input.connectorId,
    input.sourceReferenceHash,
  ].join(':');
}
