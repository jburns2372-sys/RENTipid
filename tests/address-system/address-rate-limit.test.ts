import { AddressRateLimiter } from '../../src/lib/address/rate-limiter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('AddressRateLimiter', () => {
  const testUserId = 'user_test_123';

  beforeAll(async () => {
    // Ensure the table exists in the test database in case local migrations are broken
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AddressApiRateLimit" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "key" TEXT NOT NULL,
          "points" INTEGER NOT NULL DEFAULT 0,
          "resetAt" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AddressApiRateLimit_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AddressApiRateLimit_key_key" ON "AddressApiRateLimit"("key");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AddressApiRateLimit_resetAt_idx" ON "AddressApiRateLimit"("resetAt");
    `);
  });

  beforeEach(async () => {
    await prisma.$executeRaw`DELETE FROM "AddressApiRateLimit"`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should allow requests under the limit', async () => {
    const allowed1 = await AddressRateLimiter.consumeAutocomplete('192.168.1.1', testUserId);
    const allowed2 = await AddressRateLimiter.consumeAutocomplete('192.168.1.1', testUserId);
    expect(allowed1).toBe(true);
    expect(allowed2).toBe(true);
  });

  it('should block requests over the limit for autocomplete', async () => {
    // Autocomplete limit is 60 per minute
    let allAllowed = true;
    for (let i = 0; i < 60; i++) {
      const allowed = await AddressRateLimiter.consumeAutocomplete('192.168.1.2', testUserId);
      if (!allowed) allAllowed = false;
    }
    expect(allAllowed).toBe(true);

    const blocked = await AddressRateLimiter.consumeAutocomplete('192.168.1.2', testUserId);
    expect(blocked).toBe(false);
  });

  it('should block requests over the limit for details', async () => {
    // Details limit is 20 per minute
    let allAllowed = true;
    for (let i = 0; i < 20; i++) {
      const allowed = await AddressRateLimiter.consumeDetails('192.168.1.3', testUserId);
      if (!allowed) allAllowed = false;
    }
    expect(allAllowed).toBe(true);

    const blocked = await AddressRateLimiter.consumeDetails('192.168.1.3', testUserId);
    expect(blocked).toBe(false);
  });

  it('should isolate limits by ip and endpoint', async () => {
    for (let i = 0; i < 20; i++) {
      await AddressRateLimiter.consumeDetails('192.168.1.4', testUserId);
    }
    const blockedDetails = await AddressRateLimiter.consumeDetails('192.168.1.4', testUserId);
    expect(blockedDetails).toBe(false);

    const allowedAutocomplete = await AddressRateLimiter.consumeAutocomplete('192.168.1.4', testUserId);
    expect(allowedAutocomplete).toBe(true);
    
    const allowedDetailsOtherIp = await AddressRateLimiter.consumeDetails('192.168.1.5', testUserId);
    expect(allowedDetailsOtherIp).toBe(true);
  });

  it('should enforce concurrency limits strictly atomically (80 attempts against limit 60)', async () => {
    const attempts = 80;
    const limit = 60;
    
    // Fire 80 simultaneous attempts
    const promises = Array.from({ length: attempts }).map(() => 
      AddressRateLimiter.consumeAutocomplete('10.0.0.1', 'concurrent_user')
    );
    
    const results = await Promise.all(promises);
    
    const allowedCount = results.filter(r => r === true).length;
    const deniedCount = results.filter(r => r === false).length;
    
    console.log('Concurrent Results:', results);

    expect(allowedCount).toBe(limit);
    expect(deniedCount).toBe(attempts - limit);
  });

  it('should strictly deny concurrent bursts at limit boundary', async () => {
    // We can't change the limit easily as it's hardcoded to 60.
    // Instead we will pre-fill 59 slots, and then fire 5 concurrent requests.
    // Exactly 1 should pass, 4 should fail.
    for (let i = 0; i < 59; i++) {
      await AddressRateLimiter.consumeAutocomplete('10.0.0.2', 'boundary_user');
    }
    
    const promises = Array.from({ length: 5 }).map(() => 
      AddressRateLimiter.consumeAutocomplete('10.0.0.2', 'boundary_user')
    );
    
    const results = await Promise.all(promises);
    
    const allowedCount = results.filter(r => r === true).length;
    const deniedCount = results.filter(r => r === false).length;
    
    expect(allowedCount).toBe(1);
    expect(deniedCount).toBe(4);
  });
});
