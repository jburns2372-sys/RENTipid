import 'server-only';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { PhoneOtpRateLimiter } from './services';

type AuthRateLimitRow = {
  points: number;
  reset_at: Date;
};

export class DatabaseAuthRateLimiter implements PhoneOtpRateLimiter {
  async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
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
    return Boolean(row && row.points <= limit);
  }

  async pruneExpired(): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`DELETE FROM "AuthRateLimit" WHERE "reset_at" < NOW()`);
  }
}
