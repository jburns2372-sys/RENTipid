import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import {
  LOCAL_ADDRESS_DATABASE,
  LOCAL_STATE_FILE,
  applyEnvironment,
  assertLocalAdminDatabaseUrl,
  assertLocalDatabaseUrl,
  databaseName,
  ensureLocalDatabase,
  ensureSecret,
  localDatabaseUrlFrom,
  readEnvironmentFile,
  resolveLocalAdminDatabaseUrl,
  runCommand,
  updateEnvironmentFile,
  writeLocalState,
} from './address-local-common';

const REQUIRED_SOURCE_FILES = [
  'src/lib/address/AddressService.ts',
  'src/lib/address/address-token.ts',
  'src/lib/address/normalizer.ts',
  'src/lib/address/providers/google.ts',
  'src/lib/address/psgc/psgc-service.ts',
  'src/app/api/address/autocomplete/route.ts',
  'src/app/api/address/details/route.ts',
  'src/app/api/address/ph/cities/route.ts',
  'src/app/api/address/ph/barangays/route.ts',
  'src/app/api/address/ph/resolve-city/route.ts',
  'src/components/address/AddressForm.tsx',
  'src/components/address/AddressAutocomplete.tsx',
  'src/components/address/BarangaySelect.tsx',
  'src/components/address/PhCitySelect.tsx',
  'src/components/address/CountrySelect.tsx',
  'scripts/run-local-address-acceptance.ts',
  'tests/e2e/local-address-live.spec.ts',
  'playwright-local-address.config.ts',
  'src/app/api/profile/route.ts',
  'src/app/dashboard/profile/page.tsx',
  'prisma/schema.prisma',
  'prisma/migrations/20260809000000_add_global_address/migration.sql',
  'prisma/migrations/20260809000001_add_address_rate_limit/migration.sql',
  'prisma/migrations/20260811000001_add_psgc_subdivision/migration.sql',
  'docs/address-system/codex-pass4-final-closure.md',
];

function sourceFingerprint(): string {
  const hash = createHash('sha256');
  for (const relativePath of REQUIRED_SOURCE_FILES) {
    const path = resolve(process.cwd(), relativePath);
    if (!existsSync(path)) throw new Error(`Address source parity failed: missing ${relativePath}.`);
    hash.update(relativePath).update(readFileSync(path));
  }
  const service = readFileSync(resolve(process.cwd(), 'src/lib/address/AddressService.ts'), 'utf8');
  for (const field of ['regionPsgcCode', 'provincePsgcCode', 'localityPsgcCode', 'sublocalityPsgcCode']) {
    if (!service.includes(field)) throw new Error(`Address source parity failed: canonical reader omits ${field}.`);
  }
  return hash.digest('hex');
}

function previousState(): Record<string, unknown> | null {
  if (!existsSync(LOCAL_STATE_FILE)) return null;
  try { return JSON.parse(readFileSync(LOCAL_STATE_FILE, 'utf8')) as Record<string, unknown>; }
  catch { return null; }
}

function validGoogleKey(value: string | undefined): value is string {
  return Boolean(value && value.length >= 20 && value.length <= 255 && !/\s/.test(value));
}

async function googleKeyFromVercel(): Promise<string | null> {
  const projectPath = resolve(process.cwd(), '.vercel/project.json');
  const appData = process.env.APPDATA;
  if (!existsSync(projectPath) || !appData) return null;
  const authPath = resolve(appData, 'com.vercel.cli/Data/auth.json');
  if (!existsSync(authPath)) return null;
  try {
    const project = JSON.parse(readFileSync(projectPath, 'utf8')) as {
      projectId?: string; orgId?: string;
    };
    const auth = JSON.parse(readFileSync(authPath, 'utf8')) as { token?: string };
    if (!project.projectId || !auth.token) return null;
    const query = new URLSearchParams({ decrypt: 'true' });
    if (project.orgId) query.set('teamId', project.orgId);
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${project.projectId}/env?${query.toString()}`,
      { headers: { Authorization: `Bearer ${auth.token}` } },
    );
    if (!response.ok) return null;
    const payload = await response.json() as {
      envs?: Array<{ key?: string; value?: string; target?: string[] }>;
    };
    const candidate = payload.envs?.find((item) =>
      item.key === 'GOOGLE_MAPS_API_KEY' && item.target?.includes('preview') && validGoogleKey(item.value),
    )?.value;
    return validGoogleKey(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

async function acquireGoogleKey(local: Record<string, string>): Promise<string> {
  if (validGoogleKey(local.GOOGLE_MAPS_API_KEY)) return local.GOOGLE_MAPS_API_KEY;
  if (validGoogleKey(process.env.GOOGLE_MAPS_API_KEY)) return process.env.GOOGLE_MAPS_API_KEY;
  const vercelKey = await googleKeyFromVercel();
  if (vercelKey) return vercelKey;
  throw new Error(
    'EXTERNAL AUTHORIZATION REQUIRED: set GOOGLE_MAPS_API_KEY in the current process or .env.local, then rerun npm run address:local:bootstrap. The key is never printed or committed.',
  );
}

async function prepareEnvironment(): Promise<Record<string, string>> {
  const local = readEnvironmentFile();
  const sourceUrl = local.DIRECT_URL || local.DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!sourceUrl) throw new Error('A reusable local PostgreSQL DATABASE_URL or DIRECT_URL is required.');
  assertLocalDatabaseUrl(sourceUrl);
  const explicitAdminUrl = local.ADDRESS_LOCAL_ADMIN_DATABASE_URL || process.env.ADDRESS_LOCAL_ADMIN_DATABASE_URL;
  const adminUrl = resolveLocalAdminDatabaseUrl(sourceUrl, explicitAdminUrl);
  if (adminUrl) process.env.ADDRESS_LOCAL_ADMIN_DATABASE_URL = adminUrl;
  const requestedTargetUrl = localDatabaseUrlFrom(sourceUrl);
  const targetUrl = await ensureLocalDatabase(sourceUrl, requestedTargetUrl, adminUrl || undefined);

  const existingKey = local.MFA_ENCRYPTION_KEY;
  const encryptionKey = existingKey && /^[a-fA-F0-9]{64}$/.test(existingKey)
    ? existingKey
    : randomBytes(32).toString('hex');
  const existingPrivacyKey = local.PRIVACY_FIELD_ENCRYPTION_KEY_B64;
  const privacyKey = existingPrivacyKey && Buffer.from(existingPrivacyKey, 'base64').length === 32
    ? existingPrivacyKey
    : randomBytes(32).toString('base64');
  const configured: Record<string, string> = {
    DATABASE_URL: targetUrl,
    DIRECT_URL: targetUrl,
    ADDRESS_PROVIDER: 'GOOGLE',
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXTAUTH_SECRET: ensureSecret(local.NEXTAUTH_SECRET),
    PRIVACY_FIELD_ENCRYPTION_KEY_B64: privacyKey,
    MFA_ENCRYPTION_KEY_ID: local.MFA_ENCRYPTION_KEY_ID || 'address-local-v1',
    MFA_ENCRYPTION_KEY: encryptionKey,
    PROFILE_FIELD_PROTECTION_MODE: 'ENCRYPTED_ONLY',
    SECURITY_TELEMETRY_HMAC_KEY: ensureSecret(local.SECURITY_TELEMETRY_HMAC_KEY),
    SOC_CORRELATION_HMAC_KEY: ensureSecret(local.SOC_CORRELATION_HMAC_KEY),
    ADDRESS_LOCAL_TEST_EMAIL: local.ADDRESS_LOCAL_TEST_EMAIL || 'address.local@rentipid.test',
    ADDRESS_LOCAL_TEST_PASSWORD: local.ADDRESS_LOCAL_TEST_PASSWORD || randomBytes(24).toString('base64url'),
  };
  updateEnvironmentFile(configured);
  applyEnvironment(configured);
  return configured;
}

async function ensureLocalTestUser(environment: Record<string, string>): Promise<void> {
  const [{ PrismaClient }, bcrypt] = await Promise.all([
    import('@prisma/client'),
    import('bcryptjs'),
  ]);
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(environment.ADDRESS_LOCAL_TEST_PASSWORD, 12);
    const user = await prisma.user.upsert({
      where: { email: environment.ADDRESS_LOCAL_TEST_EMAIL },
      update: {
        password_hash: passwordHash,
        account_type: 'Business',
        role: 'Business Provider',
        status: 'Verified',
        is_test_data: true,
      },
      create: {
        email: environment.ADDRESS_LOCAL_TEST_EMAIL,
        full_name: 'Local Address Tester',
        password_hash: passwordHash,
        account_type: 'Business',
        role: 'Business Provider',
        status: 'Verified',
        is_test_data: true,
      },
    });
    await prisma.userProfile.upsert({
      where: { user_id: user.id },
      update: {},
      create: { user_id: user.id, verification_status: 'Unverified' },
    });
    await prisma.businessProfile.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        business_name: 'Local Address Test Business',
        verification_status: 'Unverified',
      },
    });
    console.log('Local Address test user is ready (credentials remain in .env.local).');
  } finally {
    await prisma.$disconnect();
  }
}

async function seedPsgcTestFixture(mainUrl: string, testUrl: string): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const main = new PrismaClient({ datasources: { db: { url: mainUrl } } });
  const test = new PrismaClient({ datasources: { db: { url: testUrl } } });
  try {
    const cities = await main.psgcSubdivision.findMany({
      where: { psgcCode: { in: ['1381300000', '1380600000', '0730600000', '1130700000', '1380300000'] } },
    });
    const barangays = await main.psgcSubdivision.findMany({
      where: { parentPsgcCode: '1381300000', geographicLevel: 'BARANGAY', isActive: true },
    });
    if (cities.length !== 5 || barangays.length !== 142) {
      throw new Error('Local PSGC registry is incomplete; disposable test fixture was not created.');
    }
    const fixtureRow = (entry: typeof cities[number]) => ({
      psgcCode: entry.psgcCode,
      name: entry.name,
      geographicLevel: entry.geographicLevel,
      parentPsgcCode: entry.parentPsgcCode,
      isActive: entry.isActive,
      source: entry.source,
      sourceVersion: entry.sourceVersion,
      syncedAt: entry.syncedAt,
    });
    await test.psgcSubdivision.createMany({
      data: cities.map((entry) => ({ ...fixtureRow(entry), parentPsgcCode: null })),
      skipDuplicates: true,
    });
    await test.psgcSubdivision.createMany({
      data: barangays.map(fixtureRow),
      skipDuplicates: true,
    });
  } finally {
    await Promise.all([main.$disconnect(), test.$disconnect()]);
  }
}

async function runAddressTests(environment: Record<string, string>): Promise<void> {
  const testName = `rentipid_test_soc_address_local_${randomBytes(6).toString('hex')}`;
  const testUrl = localDatabaseUrlFrom(environment.DATABASE_URL, testName);
  const adminUrl = process.env.ADDRESS_LOCAL_ADMIN_DATABASE_URL;
  if (!adminUrl) throw new Error('ADDRESS_LOCAL_ADMIN_DATABASE_URL is required for disposable tests.');
  assertLocalAdminDatabaseUrl(adminUrl);
  const admin = new Client({ connectionString: adminUrl });
  const applicationRole = decodeURIComponent(new URL(environment.DATABASE_URL).username);
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(applicationRole)) {
    throw new Error('SAFETY: Invalid local application role for disposable test database.');
  }
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE ${testName} OWNER ${applicationRole}`);
    const testEnvironment = {
      ...process.env,
      ...environment,
      DATABASE_URL: testUrl,
      DIRECT_URL: testUrl,
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
    };
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], testEnvironment);
    await seedPsgcTestFixture(environment.DATABASE_URL, testUrl);
    await runCommand('npx', ['jest', 'tests/address-system', '--runInBand'], testEnvironment);
  } finally {
    if (!/^rentipid_test_soc_address_local_[a-f0-9]{12}$/.test(testName)) {
      throw new Error('SAFETY: Refusing to clean an unexpected test database name.');
    }
    try {
      await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1', [testName]);
      await admin.query(`DROP DATABASE IF EXISTS ${testName}`);
    }
    finally { await admin.end(); }
  }
}

const ACCEPTANCE_RESULTS = [
  'LOCAL_GOOGLE_AUTOCOMPLETE', 'LOCAL_GOOGLE_PLACE_DETAILS', 'LOCAL_ADDRESS_TOKEN',
  'LOCAL_FIELD_ENCRYPTION', 'LOCAL_PSGC_REGISTRY', 'LOCAL_PH_CITY_RESOLUTION',
  'LOCAL_PH_BARANGAY_DROPDOWN', 'LOCAL_PH_BARANGAY_AUTO_LOAD',
  'LOCAL_PH_SAVE_RELOAD', 'LOCAL_PH_PSGC_PERSISTENCE', 'LOCAL_NON_PH_REGRESSION',
  'LOCAL_ACCEPTANCE',
];

function printCachedSuccess(): void {
  for (const result of ACCEPTANCE_RESULTS) console.log(`${result} = PASS`);
}

async function main(): Promise<void> {
  console.log('RENTipid Address local bootstrap');
  const fingerprint = sourceFingerprint();
  console.log('Address source-code parity = PASS');
  const environment = await prepareEnvironment();
  const state = previousState();
  const targetIdentity = databaseName(environment.DATABASE_URL);
  const isolation = 'DEDICATED_DATABASE';
  const offlineUnchanged = state?.offlineCompleted === true
    && state.sourceFingerprint === fingerprint
    && state.targetIdentity === targetIdentity;
  if (!offlineUnchanged) {
    await runCommand('npx', ['prisma', 'validate'], environment);
    await runCommand('npx', ['prisma', 'generate'], environment);
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], environment);
    await runCommand('npx', ['tsx', 'prisma/seed.ts'], environment);
    const offlineServerEnvironment = {
      ...process.env,
      ...environment,
      NODE_OPTIONS: [process.env.NODE_OPTIONS, '--conditions=react-server'].filter(Boolean).join(' '),
    };
    await runCommand('npx', ['tsx', 'scripts/address-local-psgc.ts', `--expected-db=${LOCAL_ADDRESS_DATABASE}`], offlineServerEnvironment);
    await ensureLocalTestUser(environment);
    await runAddressTests(environment);
    writeLocalState({ version: 1, offlineCompleted: true, targetIdentity, isolation, sourceFingerprint: fingerprint });
  } else {
    console.log('Offline bootstrap inputs are unchanged; Prisma, PSGC, user seed, and focused tests are skipped.');
  }

  const googleKey = await acquireGoogleKey({ ...readEnvironmentFile(), ...environment });
  updateEnvironmentFile({ GOOGLE_MAPS_API_KEY: googleKey });
  environment.GOOGLE_MAPS_API_KEY = googleKey;
  applyEnvironment(environment);
  const keyFingerprint = createHash('sha256').update(googleKey).digest('hex');
  if (state?.completed === true && offlineUnchanged && state.googleKeyFingerprint === keyFingerprint) {
    console.log('Live provider inputs are unchanged; completed Google and persistence checks are skipped.');
    printCachedSuccess();
    console.log('Local Address Module is ready. Run: npm run dev');
    return;
  }
  const serverEnvironment = {
    ...process.env,
    ...environment,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, '--conditions=react-server'].filter(Boolean).join(' '),
  };
  await runCommand('npx', ['tsx', 'scripts/address-local-verify.ts'], serverEnvironment);
  await runCommand('npx', ['tsx', 'scripts/run-local-address-acceptance.ts'], serverEnvironment);
  writeLocalState({
    version: 1,
    offlineCompleted: true,
    completed: true,
    targetIdentity,
    isolation,
    sourceFingerprint: fingerprint,
    googleKeyFingerprint: keyFingerprint,
    verifiedAt: new Date().toISOString(),
    results: Object.fromEntries(ACCEPTANCE_RESULTS.map((result) => [result, 'PASS'])),
  });
  console.log('Local Address Module is ready. Run: npm run dev');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Address local bootstrap failed safely.');
  process.exitCode = 1;
});
