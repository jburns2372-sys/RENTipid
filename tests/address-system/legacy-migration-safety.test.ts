import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import { LEGACY_MIGRATION_LOCK_ID } from '../../scripts/legacy-migration-constants';

const prisma = new PrismaClient();

describe('Legacy Migration Safety', () => {
  beforeAll(async () => {
    await prisma.businessProfile.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const getDbName = () => {
    return process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown';
  };

  const runMigration = (args: string, envOverrides: Record<string, string> = {}) => {
    try {
      const output = execSync(`node --conditions react-server -r tsx/cjs scripts/migrate-legacy-addresses.ts ${args} 2>&1`, { 
        env: { 
          ...process.env, 
          ENCRYPTION_KEY: '12345678901234567890123456789012',
          ...envOverrides
        }
      });
      return { success: true, output: output.toString() };
    } catch (error: unknown) {
      const err = error as { stdout?: Buffer; stderr?: Buffer };
      return { success: false, output: err.stdout?.toString() + '\n' + err.stderr?.toString() };
    }
  };

  it('LEGACY DEFAULT NO-WRITE: should not mutate database if --execute is not provided (dry-run)', async () => {
    const user = await prisma.user.create({
      data: { id: 'user_mig_dry', email: 'mig_dry@example.com', full_name: 'Mig Dry', account_type: 'Individual', password_hash: 'hash', role: 'Individual Provider', status: 'Active' }
    });
    await prisma.userProfile.create({ data: { user_id: user.id, verification_status: 'Unverified', address: 'Old Plaintext Address' } });

    const res = runMigration('');
    expect(res.success).toBe(true);
    
    const profile = await prisma.userProfile.findUnique({ where: { user_id: user.id } });
    expect(profile?.global_address_id).toBeNull();
  });
  
  it('LEGACY DRY-RUN: same behavior as default no-write', async () => {
    // Satisfy dry-run explicitly
    const res = runMigration('--dry-run');
    expect(res.success).toBe(true);
    
    // Ensure zero writes
    const profile = await prisma.userProfile.findUnique({ where: { user_id: 'user_mig_dry' } });
    expect(profile?.global_address_id ?? null).toBeNull();
  });

  it('LEGACY EXPECTED-DB GUARD: should block execution if --expected-db is missing', () => {
    const res = runMigration('--execute');
    expect(res.success).toBe(false);
    expect(res.output).toContain('Missing --expected-db');
  });

  it('LEGACY EXPECTED-DB GUARD: should block execution if --expected-db does not match current_database()', () => {
    const res = runMigration('--execute --expected-db=wrong_db_name');
    expect(res.success).toBe(false);
    expect(res.output).toContain('Database safety guard');
  });

  it('LEGACY PROTECTED-DB GUARD: should block execution if target is a protected database', () => {
    const protectedDbs = ['rentipid_test_soc', 'postgres', 'template0', 'template1'];
    for (const db of protectedDbs) {
      const res = runMigration(`--execute --expected-db=${db}`);
      
      expect(res.success).toBe(false);
      const blockedByGuard = res.output.includes(`Database '${db}' is blocked from migrations.`);
      expect(blockedByGuard).toBe(true);
    }
  });

  it('LEGACY CONCURRENT LOCK: should block execution if another process holds the advisory lock', async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const lockAcquired = await client.query(`SELECT pg_try_advisory_lock(${LEGACY_MIGRATION_LOCK_ID}) as acquired`);
    expect(lockAcquired.rows[0].acquired).toBe(true);

    const dbName = getDbName();
    const res = runMigration(`--execute --expected-db=${dbName}`);
    
    expect(res.success).toBe(false);
    expect(res.output).toContain('Migration is already running');

    await client.query(`SELECT pg_advisory_unlock(${LEGACY_MIGRATION_LOCK_ID})`);
    await client.end();
  });

  it('LEGACY UNLOCK SUCCESS: should successfully migrate and release the advisory lock', async () => {
    const user = await prisma.user.create({
      data: { id: 'user_mig_exec', email: 'mig_exec@example.com', full_name: 'Mig Exec', account_type: 'Individual', password_hash: 'hash', role: 'Individual Provider', status: 'Active' }
    });
    await prisma.userProfile.create({ data: { user_id: user.id, verification_status: 'Unverified', address: 'Old Plaintext Address Exec', country: 'Philippines' } });

    const dbName = getDbName();
    const res = runMigration(`--execute --expected-db=${dbName}`);
    expect(res.success).toBe(true);

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const lockAcquired = await client.query(`SELECT pg_try_advisory_lock(${LEGACY_MIGRATION_LOCK_ID}) as acquired`);
    expect(lockAcquired.rows[0].acquired).toBe(true); 
    
    await client.query(`SELECT pg_advisory_unlock(${LEGACY_MIGRATION_LOCK_ID})`);
    await client.end();
  });

  it('LEGACY IDEMPOTENCY: should be idempotent on rerun', async () => {
    const dbName = getDbName();
    const res = runMigration(`--execute --expected-db=${dbName}`);
    expect(res.success).toBe(true);
    expect(res.output).toContain('Found 0 user profiles to migrate');
  });

  it('LEGACY UNKNOWN COUNTRY: should handle unknown countries safely and write to legacy fallback', async () => {
    const user = await prisma.user.create({
      data: { id: 'user_unknown_country', email: 'mig_unknown@example.com', full_name: 'Mig Unknown', account_type: 'Individual', password_hash: 'hash', role: 'Individual Provider', status: 'Active' }
    });
    await prisma.userProfile.create({ data: { user_id: user.id, verification_status: 'Unverified', address: 'Unknown St', country: 'Atlantis' } });

    const dbName = getDbName();
    const res = runMigration(`--execute --expected-db=${dbName}`);
    expect(res.success).toBe(true);

    const profile = await prisma.userProfile.findUnique({ where: { user_id: user.id }, include: { global_address: true } });
    expect(profile?.global_address_id).not.toBeNull(); 
    expect(profile?.global_address?.countryCode).toBeNull(); 
    expect(profile?.global_address?.addressLine1_encrypted).not.toBeNull();
  });

  it('LEGACY RECORD FAILURE ISOLATION: should isolate per-record DB failures and not crash the whole migration', async () => {
    const user1 = await prisma.user.create({ data: { id: 'user_fail_isolate_1', email: 'iso1@example.com', full_name: 'Iso 1', account_type: 'Individual', password_hash: 'hash', role: 'Individual Provider', status: 'Active' } });
    const user2 = await prisma.user.create({ data: { id: 'user_fail_isolate_2', email: 'iso2@example.com', full_name: 'Iso 2', account_type: 'Individual', password_hash: 'hash', role: 'Individual Provider', status: 'Active' } });

    await prisma.userProfile.create({ data: { user_id: user1.id, verification_status: 'Unverified', address: 'Fail Me' } });
    await prisma.userProfile.create({ data: { user_id: user2.id, verification_status: 'Unverified', address: 'Success Me' } });

    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION fail_specific_profile() RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.user_id = 'user_fail_isolate_1' THEN
          RAISE EXCEPTION 'Simulated failure for isolation test';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER fail_specific_profile_trigger
      BEFORE UPDATE ON "UserProfile"
      FOR EACH ROW EXECUTE FUNCTION fail_specific_profile();
    `);

    const dbName = getDbName();
    const res = runMigration(`--execute --expected-db=${dbName}`);
    expect(res.success).toBe(true);

    const profile1 = await prisma.userProfile.findUnique({ where: { user_id: user1.id } });
    expect(profile1?.global_address_id).toBeNull();

    const profile2 = await prisma.userProfile.findUnique({ where: { user_id: user2.id } });
    expect(profile2?.global_address_id).not.toBeNull();

    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS fail_specific_profile_trigger ON "UserProfile"`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS fail_specific_profile()`);
  });

  it('LEGACY CRYPTO PLAINTEXT PROTECTION & LEGACY PII REDACTION: should never fallback to plaintext on crypto failure and omit PII from logs', async () => {
    const user = await prisma.user.create({ data: { id: 'user_mig_crypto', email: 'mig_crypto@example.com', full_name: 'Mig Crypto', account_type: 'Individual', password_hash: 'hash', role: 'Individual Provider', status: 'Active' } });
    await prisma.userProfile.create({ 
      data: { 
        user_id: user.id, 
        verification_status: 'Unverified', 
        address: 'Plaintext Street 123', 
        address_encrypted: 'INVALID_CIPHERTEXT' 
      } 
    });

    const dbName = getDbName();
    const res = runMigration(`--execute --expected-db=${dbName}`);
    expect(res.success).toBe(true);
    expect(res.output).toContain('Skipping record to prevent plaintext fallback');
    
    // PII Redaction assertions
    expect(res.output).not.toContain('Plaintext Street 123');
    expect(res.output).not.toContain('INVALID_CIPHERTEXT');
    expect(res.output).not.toContain(user.id);
    expect(res.output).not.toContain('mig_crypto@example.com');
    
    const profile = await prisma.userProfile.findUnique({ where: { user_id: user.id } });
    expect(profile?.global_address_id).toBeNull();
  });

  it('LEGACY UNLOCK FAILURE & LEGACY DISCONNECT FAILURE PATH: should unlock and disconnect even if migration fails completely', async () => {
    const dbName = getDbName();
    
    // Inject a failure right after lock by renaming a table
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile" RENAME TO "UserProfile_Temp"`);

    const res = runMigration(`--execute --expected-db=${dbName}`, { PGAPPNAME: 'legacy_migration_test' });
    
    expect(res.success).toBe(false);
    expect(res.output).toContain('does not exist');

    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile_Temp" RENAME TO "UserProfile"`);

    // Verify Unlock Failure
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const lockAcquired = await client.query(`SELECT pg_try_advisory_lock(${LEGACY_MIGRATION_LOCK_ID}) as acquired`);
    expect(lockAcquired.rows[0].acquired).toBe(true); 
    await client.query(`SELECT pg_advisory_unlock(${LEGACY_MIGRATION_LOCK_ID})`);
    
    // Verify Disconnect Failure Path
    const statActivity = await client.query(`SELECT count(*) as count FROM pg_stat_activity WHERE application_name = 'legacy_migration_test'`);
    expect(parseInt(statActivity.rows[0].count)).toBe(0);

    await client.end();
  });
});
