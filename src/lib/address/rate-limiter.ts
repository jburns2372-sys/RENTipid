import 'server-only';
import { prisma } from '@/lib/prisma';

export class AddressRateLimiter {
  private static MAX_AUTOCOMPLETE_PER_MINUTE = 60; // 60 keystrokes per minute
  private static MAX_DETAILS_PER_MINUTE = 20;

  static async consumeAutocomplete(ip: string, userId: string): Promise<boolean> {
    const key = `rl:addr:auto:${userId}:${ip}`;
    return this.consume(key, this.MAX_AUTOCOMPLETE_PER_MINUTE, 60000);
  }

  static async consumeDetails(ip: string, userId: string): Promise<boolean> {
    const key = `rl:addr:det:${userId}:${ip}`;
    return this.consume(key, this.MAX_DETAILS_PER_MINUTE, 60000);
  }

  private static async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    try {
      if (Math.random() < 0.01) {
        await prisma.addressApiRateLimit.deleteMany({
          where: { resetAt: { lt: new Date() } }
        }).catch(() => { /* Silent failure to prevent PII/stack leak */ });
      }

      // Single atomic PostgreSQL decision using NOW() for accurate timezone-independent evaluation
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
      
      // console.log('Query Result Rows:', rows);

      if (!rows || rows.length === 0) return false;
      
      // rows[0].points contains the exact assigned sequence number for this concurrent request
      return (rows[0].points as number) <= limit;
    } catch {
      return false;
    }
  }
}
