/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

const dbBases = {
  clean: 'rentipid_test_v6_clean',
  rollback: 'rentipid_test_v6_rollback',
  existing: 'rentipid_test_v6_existing',
};

function getDbUrl(dbName) {
  return process.env.DATABASE_URL.replace('/rentipid_test_soc', '/' + dbName);
}

function runCmd(cmd, env = {}) {
  console.log(`\n======================================================`);
  console.log(`Executing: ${cmd}`);
  const start = Date.now();
  try {
    const output = execSync(cmd, { encoding: 'utf8', env: { ...process.env, ...env } });
    const duration = Date.now() - start;
    console.log(`Exit code: 0 | Duration: ${duration}ms\nOutput:\n${output.trim()}`);
    return { success: true, output };
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`Exit code: ${err.status} | Duration: ${duration}ms\nError:\n${err.stdout ? err.stdout.toString() : err.message}`);
    return { success: false, output: err.stdout ? err.stdout.toString() : err.message };
  }
}

async function runRollbackProof() {
  console.log(`\n\n=== 1. ROLLBACK PROOF ===`);
  const url = getDbUrl(dbBases.rollback);
  runCmd(`npx prisma migrate deploy`, { DATABASE_URL: url });

  const client = new Client({ connectionString: url });
  await client.connect();

  // Insert synthetic business records
  await client.query(`
    INSERT INTO "User" (id, email, password_hash, full_name, role, status, account_type, created_at, updated_at)
    VALUES ('test-user-v6', 'v6@example.com', 'hash', 'V6 User', 'Super Admin', 'Verified', 'Business', NOW(), NOW())
    ON CONFLICT DO NOTHING;
  `);

  // Insert Phase 2 records
  await client.query(`
    INSERT INTO "SecurityEvent" (id, event_code, source_type, source_record_id, security_domain, event_category, event_classification, severity, environment, lifecycle_type, idempotency_key, occurred_at, source_received_at, ingested_at, updated_at)
    VALUES ('sec-evt-v6', 'TEST_EVT', 'SYSTEM_SETTING', 'rec-1', 'TRUST_AND_SAFETY', 'Test', 'OBSERVATION', 'INFO', 'PRODUCTION', 'LIVE', 'idemp-v6', NOW(), NOW(), NOW(), NOW())
    ON CONFLICT DO NOTHING;
  `);

  await client.query(`
    INSERT INTO "SecurityEventIngestionFailure" (id, source_type, source_record_id, privacy_safe_error_code, lifecycle, environment)
    VALUES ('fail-v6', 'SYSTEM_SETTING', 'rec-1', 'TEST_ERR', 'LIVE', 'PRODUCTION')
    ON CONFLICT DO NOTHING;
  `);

  await client.query(`
    INSERT INTO "SecurityEventIngestionCheckpoint" (id, source_type, environment, lifecycle_type, updated_at)
    VALUES ('chk-v6', 'SYSTEM_SETTING', 'PRODUCTION', 'LIVE', NOW())
    ON CONFLICT DO NOTHING;
  `);

  // Execute drop script
  const dropScript = fs.readFileSync('scripts/drop_phase2_soc.sql', 'utf8');
  await client.query(dropScript);

  // Check tables
  const tablesResult = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
  `);
  const tables = tablesResult.rows.map(r => r.table_name);
  console.log(`Tables after rollback: ${tables.join(', ')}`);
  console.log(`SecurityEvent exists? ${tables.includes('SecurityEvent')}`);
  console.log(`User exists? ${tables.includes('User')}`);

  // Check enums
  const enumsResult = await client.query(`
    SELECT t.typname FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid GROUP BY t.typname;
  `);
  const enums = enumsResult.rows.map(r => r.typname);
  console.log(`Phase 2 Enums exists? ${enums.includes('SecurityEventSource')}`);

  // Check synthetic data
  const userResult = await client.query(`SELECT email FROM "User" WHERE id = 'test-user-v6'`);
  console.log(`Synthetic user retained? ${userResult.rows.length > 0}`);

  await client.end();
}

async function runReapplicationProof() {
  console.log(`\n\n=== 1B. REAPPLICATION PROOF ===`);
  const url = getDbUrl(dbBases.clean);
  runCmd(`npx prisma migrate deploy`, { DATABASE_URL: url });

  const client = new Client({ connectionString: url });
  await client.connect();

  const tablesResult = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
  `);
  const tables = tablesResult.rows.map(r => r.table_name);
  console.log(`SecurityEvent exists? ${tables.includes('SecurityEvent')}`);
  console.log(`SecurityEventIngestionFailure exists? ${tables.includes('SecurityEventIngestionFailure')}`);
  console.log(`SecurityEventIngestionCheckpoint exists? ${tables.includes('SecurityEventIngestionCheckpoint')}`);

  const enumsResult = await client.query(`
    SELECT t.typname FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid GROUP BY t.typname;
  `);
  const enums = enumsResult.rows.map(r => r.typname);
  console.log(`SecurityEventSource Enum exists? ${enums.includes('SecurityEventSource')}`);

  await client.end();

  // Create synthetic event via Prisma Client
  console.log(`\nRunning Prisma Client synthetic test...`);
  const code = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({ datasources: { db: { url: '${url}' } } });
    async function main() {
      const evt = await prisma.securityEvent.create({
        data: {
          event_code: 'TEST_REAPP',
          source_type: 'SYSTEM_SETTING',
          source_record_id: 'reapp-1',
          security_domain: 'TRUST_AND_SAFETY',
          event_category: 'Reapp',
          event_classification: 'OBSERVATION',
          severity: 'INFO',
          environment: 'PRODUCTION',
          lifecycle_type: 'LIVE',
          idempotency_key: 'idemp-reapp',
          occurred_at: new Date(),
          source_received_at: new Date()
        }
      });
      console.log('Created synthetic SecurityEvent via Prisma Client: ' + evt.id);
      await prisma.$disconnect();
    }
    main().catch(e => { console.error(e); process.exit(1); });
  `;
  fs.writeFileSync('scripts/tmp-reapp.js', code);
  runCmd(`node scripts/tmp-reapp.js`, { DATABASE_URL: url });
}

async function runCleanMigration() {
  console.log(`\n\n=== 2. CLEAN DATABASE MIGRATION ===`);
  const url = getDbUrl(dbBases.clean); 
  runCmd(`npx prisma migrate deploy`, { DATABASE_URL: url });
  runCmd(`npx prisma migrate status`, { DATABASE_URL: url });
  runCmd(`npx prisma generate`);
  runCmd(`npx prisma validate`);
}

async function runExistingSchema() {
  console.log(`\n\n=== 3. EXISTING-SCHEMA MIGRATION ===`);
  const url = getDbUrl(dbBases.existing);
  const migrationsDir = 'prisma/migrations';
  const tmpDir = 'prisma/migrations_tmp';
  
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  // Move all migrations except baseline to tmp
  const allMigs = fs.readdirSync(migrationsDir).filter(f => f !== 'migration_lock.toml');
  for (const m of allMigs) {
    if (m !== '20260715145648_init_soc_events') {
      fs.renameSync(path.join(migrationsDir, m), path.join(tmpDir, m));
    }
  }

  console.log("Applying baseline migration to simulate existing schema...");
  runCmd(`npx prisma migrate deploy`, { DATABASE_URL: url });

  const client = new Client({ connectionString: url });
  await client.connect();

  await client.query(`
    INSERT INTO "User" (id, email, password_hash, full_name, role, status, account_type, created_at, updated_at)
    VALUES ('test-user-existing', 'existing@example.com', 'hash', 'Existing User', 'Super Admin', 'Verified', 'Business', NOW(), NOW())
    ON CONFLICT DO NOTHING;
  `);
  console.log("Inserted synthetic business records.");

  // Move migrations back
  const tmpMigs = fs.readdirSync(tmpDir);
  for (const m of tmpMigs) {
    fs.renameSync(path.join(tmpDir, m), path.join(migrationsDir, m));
  }

  console.log("Running Phase 2 migrations on existing schema...");
  runCmd(`npx prisma migrate deploy`, { DATABASE_URL: url });

  const userResult = await client.query(`SELECT email FROM "User" WHERE id = 'test-user-existing'`);
  console.log(`Business records remain? ${userResult.rows.length > 0}`);

  const tablesResult = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  const tables = tablesResult.rows.map(r => r.table_name);
  console.log(`Phase 2 tables created? SecurityEvent exists: ${tables.includes('SecurityEvent')}`);
  console.log(`No unrelated business table dropped? User exists: ${tables.includes('User')}`);

  await client.end();
}

async function main() {
  await runRollbackProof();
  await runReapplicationProof();
  await runCleanMigration();
  await runExistingSchema();
}

main().catch(console.error);
