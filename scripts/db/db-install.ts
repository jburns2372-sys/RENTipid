import { Client } from 'pg';
import { execSync } from 'node:child_process';
import path from 'node:path';

// Security Allowlist for Local Development & Test Databases
const APPROVED_LOCAL_DATABASES = new Set([
  'rentipid_local_dev',
  'rentipid_disposable_test',
  'rentipid_dev_test',
  'rentipid_test',
  'rentipid_test_soc'
]);

export interface DatabaseClassification {
  track: 'INSTALLATION' | 'LEGACY' | 'UNKNOWN';
  reason: string;
  tableCount: number;
  migrationCount: number;
}

export async function classifyDatabase(connectionString: string): Promise<{
  databaseName: string;
  serverAddr: string;
  classification: DatabaseClassification;
}> {
  // Pre-connection URL parse defense
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(connectionString);
  } catch {
    throw new Error('[SECURITY_FAIL_CLOSED] Malformed connection string provided to classifyDatabase');
  }

  const preHost = parsedUrl.hostname.toLowerCase();
  const preDb = decodeURIComponent(parsedUrl.pathname.replace(/^\//, '').split('?')[0]).toLowerCase();

  const isPreLoopback = preHost === '127.0.0.1' || preHost === '::1' || preHost === 'localhost';
  if (!isPreLoopback) {
    throw new Error(`[SECURITY_FAIL_CLOSED] Refusing to connect to non-loopback host: ${preHost}`);
  }

  if (preDb.includes('prod') && !preDb.includes('test') && !APPROVED_LOCAL_DATABASES.has(preDb)) {
    throw new Error(`[SECURITY_FAIL_CLOSED] Refusing to connect to production-named database: ${preDb}`);
  }

  if (preDb.includes('preview')) {
    throw new Error(`[SECURITY_FAIL_CLOSED] Refusing to connect to preview database: ${preDb}`);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const identRes = await client.query(`
      SELECT 
        current_database() AS db_name, 
        coalesce(inet_server_addr()::text, '127.0.0.1') AS server_addr, 
        inet_server_port() AS server_port;
    `);
    const dbName = identRes.rows[0].db_name;
    const serverAddrRaw = identRes.rows[0].server_addr;
    const serverAddr = serverAddrRaw.split('/')[0];

    // Hard Safety Checks
    const isLoopback = serverAddr === '127.0.0.1' || serverAddr === '::1' || serverAddr === 'localhost';
    if (!isLoopback) {
      throw new Error(`[SECURITY_FAIL_CLOSED] Refusing to run db:install on non-loopback host: ${serverAddr}`);
    }

    if (dbName.includes('prod') && !dbName.includes('test') && !APPROVED_LOCAL_DATABASES.has(dbName)) {
      throw new Error(`[SECURITY_FAIL_CLOSED] Refusing to run db:install on production-named database: ${dbName}`);
    }
    if (dbName.includes('preview')) {
      throw new Error(`[SECURITY_FAIL_CLOSED] Refusing to run db:install on preview database: ${dbName}`);
    }

    // Live Inspection of Public Tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    const tables = new Set(tablesRes.rows.map((r: { table_name: string }) => r.table_name));

    if (tables.size === 0) {
      return {
        databaseName: dbName,
        serverAddr,
        classification: {
          track: 'INSTALLATION',
          reason: 'Completely empty database; clean baseline installation track applies.',
          tableCount: 0,
          migrationCount: 0,
        },
      };
    }

    // Check if _prisma_migrations exists
    if (!tables.has('_prisma_migrations')) {
      return {
        databaseName: dbName,
        serverAddr,
        classification: {
          track: 'UNKNOWN',
          reason: 'Database contains tables but has no _prisma_migrations ledger.',
          tableCount: tables.size,
          migrationCount: 0,
        },
      };
    }

    const migRes = await client.query(`
      SELECT migration_name, finished_at, rolled_back_at 
      FROM "_prisma_migrations" 
      ORDER BY started_at ASC;
    `);
    const migrations = migRes.rows;
    const hasBaseline = migrations.some((m: { migration_name: string }) => m.migration_name.includes('installation_baseline'));
    const hasLegacy = migrations.some((m: { migration_name: string }) => m.migration_name.startsWith('202607') || m.migration_name.startsWith('202608'));

    if (hasBaseline && !hasLegacy) {
      return {
        databaseName: dbName,
        serverAddr,
        classification: {
          track: 'INSTALLATION',
          reason: 'Baseline installation database; successor installation track applies.',
          tableCount: tables.size,
          migrationCount: migrations.length,
        },
      };
    }

    if (hasLegacy && !hasBaseline) {
      return {
        databaseName: dbName,
        serverAddr,
        classification: {
          track: 'LEGACY',
          reason: 'Canonical legacy migration chain detected.',
          tableCount: tables.size,
          migrationCount: migrations.length,
        },
      };
    }

    return {
      databaseName: dbName,
      serverAddr,
      classification: {
        track: 'UNKNOWN',
        reason: 'Mixed or ambiguous migration ledger state detected (both baseline and legacy entries present).',
        tableCount: tables.size,
        migrationCount: migrations.length,
      },
    };
  } finally {
    await client.end();
  }
}

export async function runDbInstall(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('[FAIL_CLOSED] DATABASE_URL environment variable is missing.');
  }

  console.log('==================================================');
  console.log('  RENTipid Conditional Dual-Track Database Installer');
  console.log('==================================================');

  const { databaseName, serverAddr, classification } = await classifyDatabase(dbUrl);
  console.log(`DATABASE:       ${databaseName}`);
  console.log(`HOST:           ${serverAddr}`);
  console.log(`DETECTED TRACK: ${classification.track}`);
  console.log(`REASON:         ${classification.reason}`);
  console.log('--------------------------------------------------');

  if (classification.track === 'UNKNOWN') {
    throw new Error(`[FATAL] Cannot determine safe migration track for ${databaseName}: ${classification.reason}`);
  }

  let migrationsPath = 'prisma/migrations';
  if (classification.track === 'INSTALLATION') {
    migrationsPath = 'prisma/installation_migrations';
  }

  console.log(`Applying migrations from: ${migrationsPath}`);

  const env = {
    ...process.env,
    PRISMA_MIGRATIONS_PATH: migrationsPath,
  };

  try {
    execSync('npx prisma migrate deploy', {
      env,
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    });
    console.log('--------------------------------------------------');
    console.log(`STATUS: SUCCESS (Track: ${classification.track})`);
    console.log('==================================================');
  } catch (error) {
    console.error(`[FATAL] Migration execution failed on ${classification.track} track:`, error);
    process.exit(1);
  }
}

if (require.main === module) {
  runDbInstall().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
