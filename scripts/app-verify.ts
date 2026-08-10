import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import {
  LOCAL_ADDRESS_DATABASE,
  applyEnvironment,
  assertLocalDatabaseUrl,
  databaseName,
  readEnvironmentFile,
} from './address-local-common';

type GateResult = 'PASS' | 'FAIL' | 'PENDING';
const stage = process.argv[2] || 'local';

function validBase64Key(value: string | undefined): boolean {
  if (!value) return false;
  try { return Buffer.from(value, 'base64').length === 32; } catch { return false; }
}

function validGoogleKey(value: string | undefined): boolean {
  return Boolean(value && value.length >= 20 && value.length <= 255 && !/\s/.test(value));
}

function print(name: string, result: GateResult, detail?: string): void {
  console.log(`${name} = ${result}${detail ? ` (${detail})` : ''}`);
}

async function verifyDatabase(databaseUrl: string, expectedName: string) {
  const parsed = new URL(databaseUrl);
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const identity = await client.query<{ current_database: string; current_user: string; server_address: string | null }>(
      'SELECT current_database(), current_user, inet_server_addr()::text AS server_address',
    );
    if (identity.rows[0]?.current_database !== expectedName) throw new Error('Database identity mismatch.');
    const migrations = await client.query<{ migration_name: string; finished_at: Date | null }>(
      `SELECT migration_name, finished_at FROM _prisma_migrations
       WHERE migration_name = '20260811000001_add_psgc_subdivision'`,
    );
    const quote = String.fromCharCode(34);
    const counts = await client.query<{
      categories: string; settings: string; users: string; qc_barangays: string; barangays: string;
    }>(`SELECT
      (SELECT COUNT(*) FROM ${quote}Category${quote})::text AS categories,
      (SELECT COUNT(*) FROM ${quote}SystemSetting${quote})::text AS settings,
      (SELECT COUNT(*) FROM ${quote}User${quote})::text AS users,
      (SELECT COUNT(*) FROM ${quote}PsgcSubdivision${quote} WHERE ${quote}parentPsgcCode${quote} = '1381300000' AND ${quote}geographicLevel${quote} = 'BARANGAY' AND ${quote}isActive${quote})::text AS qc_barangays,
      (SELECT COUNT(*) FROM ${quote}PsgcSubdivision${quote} WHERE ${quote}geographicLevel${quote} = 'BARANGAY' AND ${quote}isActive${quote})::text AS barangays`);
    const cities = await client.query<{ psgcCode: string }>(
      `SELECT ${quote}psgcCode${quote} FROM ${quote}PsgcSubdivision${quote} WHERE ${quote}psgcCode${quote} = ANY($1::text[]) AND ${quote}isActive${quote}`,
      [['1381300000', '1380600000', '1380300000', '0730600000', '1130700000']],
    );
    const roles = await client.query<{ role: string }>(
      `SELECT DISTINCT role FROM ${quote}User${quote} WHERE role = ANY($1::text[])`,
      [['Super Admin', 'Compliance Admin', 'Finance Admin', 'Renter', 'Individual Provider', 'Business Provider']],
    );
    return { identity: identity.rows[0], migrationApplied: migrations.rows[0]?.finished_at != null,
      counts: counts.rows[0], cities: cities.rowCount, roles: roles.rowCount, host: parsed.hostname };
  } finally {
    await client.end();
  }
}

async function verifyLocal(): Promise<void> {
  const environment = readEnvironmentFile();
  applyEnvironment(environment);
  const requiredSource = [
    'src/app/api/profile/route.ts',
    'src/app/api/address/autocomplete/route.ts',
    'src/app/api/address/details/route.ts',
    'src/app/api/address/ph/barangays/route.ts',
    'src/lib/address/address-token.ts',
    'src/lib/address/psgc/psgc-service.ts',
    'src/components/address/BarangaySelect.tsx',
    'prisma/migrations/20260811000001_add_psgc_subdivision/migration.sql',
  ];
  const sourcePass = requiredSource.every((path) => existsSync(resolve(process.cwd(), path)));
  const databaseUrl = environment.DATABASE_URL;
  const envPass = Boolean(
    databaseUrl
    && environment.NEXTAUTH_URL === 'http://localhost:3000'
    && environment.NEXTAUTH_SECRET?.length >= 32
    && environment.ADDRESS_PROVIDER === 'GOOGLE'
    && validGoogleKey(environment.GOOGLE_MAPS_API_KEY)
    && validBase64Key(environment.PRIVACY_FIELD_ENCRYPTION_KEY_B64)
    && environment.MFA_ENCRYPTION_KEY_ID
    && /^[a-fA-F0-9]{64}$/.test(environment.MFA_ENCRYPTION_KEY || ''),
  );
  let databasePass = false;
  let migrationPass = false;
  let systemPass = false;
  let referencePass = false;
  let rbacPass = false;
  if (databaseUrl) {
    assertLocalDatabaseUrl(databaseUrl, LOCAL_ADDRESS_DATABASE);
    const evidence = await verifyDatabase(databaseUrl, LOCAL_ADDRESS_DATABASE);
    databasePass = ['localhost', '127.0.0.1', '::1'].includes(evidence.host);
    migrationPass = evidence.migrationApplied;
    systemPass = Number(evidence.counts.categories) >= 15
      && Number(evidence.counts.settings) >= 2 && Number(evidence.counts.users) >= 6;
    referencePass = Number(evidence.counts.qc_barangays) === 142
      && Number(evidence.counts.barangays) >= 40000 && evidence.cities === 5;
    rbacPass = evidence.roles === 6;
  }
  let state: Record<string, unknown> | null = null;
  const statePath = resolve(process.cwd(), '.address-local-state.json');
  if (existsSync(statePath)) {
    try { state = JSON.parse(readFileSync(statePath, 'utf8')) as Record<string, unknown>; } catch { state = null; }
  }
  const focusedTests = state?.offlineCompleted === true;
  const workflows = state?.completed === true;
  const securityPass = envPass && sourcePass;
  print('LOCAL_SOURCE_PARITY', sourcePass ? 'PASS' : 'FAIL');
  print('LOCAL_ENVIRONMENT', envPass ? 'PASS' : 'FAIL');
  print('LOCAL_DATABASE_SAFE', databasePass ? 'PASS' : 'FAIL');
  console.log(`LOCAL_DATABASE_NAME = ${databaseUrl ? databaseName(databaseUrl) : 'UNAVAILABLE'}`);
  print('LOCAL_DATABASE_MIGRATED', migrationPass ? 'PASS' : 'FAIL');
  print('LOCAL_SYSTEM_DATA', systemPass ? 'PASS' : 'FAIL');
  print('LOCAL_REFERENCE_DATA', referencePass ? 'PASS' : 'FAIL');
  print('LOCAL_RBAC', rbacPass ? 'PASS' : 'FAIL');
  print('LOCAL_CRITICAL_APIS', sourcePass ? 'PASS' : 'FAIL');
  print('LOCAL_SECURITY', securityPass ? 'PASS' : 'FAIL');
  print('LOCAL_FOCUSED_TESTS', focusedTests ? 'PASS' : 'FAIL');
  print('LOCAL_CRITICAL_WORKFLOWS', workflows ? 'PASS' : 'FAIL');
  if (![sourcePass, envPass, databasePass, migrationPass, systemPass, referencePass,
    rbacPass, securityPass, focusedTests, workflows].every(Boolean)) process.exitCode = 1;
}

async function verifyRemote(kind: 'preview' | 'production-readiness'): Promise<void> {
  const variable = kind === 'preview' ? 'PREVIEW_DATABASE_URL' : 'PRODUCTION_DATABASE_URL';
  const databaseUrl = process.env[variable];
  const statusName = kind === 'preview' ? 'PREVIEW_STATUS' : 'PRODUCTION_READINESS_STATUS';
  if (!databaseUrl) {
    console.log(`${statusName} = PENDING (${variable} not supplied; no remote connection attempted)`);
    process.exitCode = 2;
    return;
  }
  if (kind === 'production-readiness' && process.env.ALLOW_PRODUCTION_READONLY_VERIFICATION !== 'true') {
    console.log(`${statusName} = PENDING (explicit read-only production verification authorization missing)`);
    process.exitCode = 2;
    return;
  }
  const expectedName = kind === 'preview' ? 'rentipid_preview' : databaseName(databaseUrl);
  if (kind === 'preview' && databaseName(databaseUrl) !== 'rentipid_preview') {
    throw new Error('Preview verification URL does not target rentipid_preview.');
  }
  const evidence = await verifyDatabase(databaseUrl, expectedName);
  const migrated = evidence.migrationApplied;
  const system = Number(evidence.counts.categories) >= 15 && Number(evidence.counts.settings) >= 2;
  const reference = Number(evidence.counts.qc_barangays) === 142
    && Number(evidence.counts.barangays) >= 40000 && evidence.cities === 5;
  print(`${kind.toUpperCase().replace('-', '_')}_DATABASE_IDENTITY`, 'PASS');
  print(`${kind.toUpperCase().replace('-', '_')}_MIGRATIONS`, migrated ? 'PASS' : 'FAIL');
  print(`${kind.toUpperCase().replace('-', '_')}_SYSTEM_DATA`, system ? 'PASS' : 'FAIL');
  print(`${kind.toUpperCase().replace('-', '_')}_REFERENCE_DATA`, reference ? 'PASS' : 'FAIL');
  console.log(`${statusName} = ${migrated && system && reference ? 'PASS' : 'FAIL'}`);
  if (!migrated || !system || !reference) process.exitCode = 1;
}

async function main(): Promise<void> {
  if (stage === 'local') return verifyLocal();
  if (stage === 'preview') return verifyRemote('preview');
  if (stage === 'production-readiness') return verifyRemote('production-readiness');
  throw new Error(`Unknown verification stage '${stage}'.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Application verification failed safely.');
  process.exitCode = 1;
});
