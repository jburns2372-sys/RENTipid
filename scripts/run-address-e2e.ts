import { execSync } from 'child_process';
import { Client } from 'pg';
import * as crypto from 'crypto';

const POSTGRES_URL = 'postgresql://postgres:postgres@localhost:5432/postgres';
const UNIQUE_DB_NAME = `rentipid_address_e2e_${crypto.randomBytes(4).toString('hex')}_${Date.now()}`;
const E2E_DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${UNIQUE_DB_NAME}?schema=public`;

async function main() {
  console.log(`[E2E Orchestrator] Starting targeted Address E2E`);
  console.log(`[E2E Orchestrator] Generating unique DB: ${UNIQUE_DB_NAME}`);

  // Safety checks
  if (!/^rentipid_address_e2e_[A-Za-z0-9_-]+$/.test(UNIQUE_DB_NAME)) {
    throw new Error('Database name does not match expected disposable pattern');
  }

  const client = new Client({ connectionString: POSTGRES_URL });
  await client.connect();

  try {
    // 1. Create unique disposable DB
    console.log(`[E2E Orchestrator] Creating DB...`);
    await client.query(`CREATE DATABASE "${UNIQUE_DB_NAME}"`);

    // 2. Migrate Schema
    console.log(`[E2E Orchestrator] Running prisma migrate deploy...`);
    execSync(`npx prisma migrate deploy`, {
      env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, DIRECT_URL: E2E_DATABASE_URL, ALLOW_TEST_DATABASE_MUTATION: 'true' },
      stdio: 'inherit'
    });

    // 3. Seed users
    console.log(`[E2E Orchestrator] Seeding E2E users...`);
    execSync(`npx ts-node --compiler-options "{\\"module\\":\\"commonjs\\"}" scripts/seed-e2e-users.ts`, {
      env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, DIRECT_URL: E2E_DATABASE_URL, ALLOW_TEST_DATABASE_MUTATION: 'true' },
      stdio: 'inherit'
    });

    // 4. Run Playwright Tests
    console.log(`[E2E Orchestrator] Running Playwright...`);
    const pwEnv = {
      ...process.env,
      DATABASE_URL: E2E_DATABASE_URL,
      DIRECT_URL: E2E_DATABASE_URL,
      ADDRESS_PROVIDER: 'MOCK_E2E',
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
    };
    
    // We launch Playwright with the custom configuration
    execSync(`npx playwright test --config=playwright-address.config.ts`, {
      env: pwEnv,
      stdio: 'inherit'
    });
    
    console.log(`[E2E Orchestrator] Playwright completed successfully.`);
  } catch (err) {
    console.error(`[E2E Orchestrator] E2E Pipeline failed!`);
    console.error(err);
    process.exitCode = 1;
  } finally {
    console.log(`[E2E Orchestrator] Cleaning up database ${UNIQUE_DB_NAME}...`);
    try {
      // Ensure we are dropping the exact verified identifier
      const checkRes = await client.query(`SELECT datname FROM pg_database WHERE datname = $1`, [UNIQUE_DB_NAME]);
      if (checkRes.rowCount === 1) {
        // Terminate specific connections
        await client.query(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
            AND pid <> pg_backend_pid()
        `, [UNIQUE_DB_NAME]);

        await client.query(`DROP DATABASE "${UNIQUE_DB_NAME}"`);
        console.log(`[E2E Orchestrator] Database dropped successfully.`);
      } else {
        console.warn(`[E2E Orchestrator] Database ${UNIQUE_DB_NAME} not found in catalog, skipping drop.`);
      }
    } catch (cleanupErr) {
      console.error(`[E2E Orchestrator] Failed to drop database!`, cleanupErr);
    }
    await client.end();
  }
}

main();
