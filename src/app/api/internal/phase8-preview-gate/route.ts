import { randomUUID } from 'node:crypto';
import { connection, NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getActiveSessionByHash,
  listActiveUserSessions,
  registerUserSession,
  revokeCurrentUserSession,
  revokeOtherUserSessions,
  revokeUserSession,
} from '@/lib/auth/session-registry';
import { hashSessionIdentifier, isTrustedSessionIdentifier } from '@/lib/security/auth/session-key';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PHASE8_BRANCH = 'feature/phase8-multi-login-session-management';
const PHASE8_ACCEPTED_SHA = '525044a7c9bbc1ad3545cea265691c8ed0444a8c';
const PHASE8_MIGRATION_NAME = '20260826120000_add_user_session_registry';
const PHASE8_MIGRATION_CHECKSUM = '400216f7a6da11c106a24a44f0576b8295e8aa20ac239ee8a68be0ec417b2dee';
const TEST_EMAIL_PREFIX = 'phase8-preview-gate+';

type GateResult = Record<string, 'PASS' | 'FAIL'>;

function forbidden() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

function assertPreviewGate(request?: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') return false;
  
  const isCorrectBranch = process.env.VERCEL_GIT_COMMIT_REF === PHASE8_BRANCH || process.env.PHASE8_PREVIEW_GATE === PHASE8_ACCEPTED_SHA;
  if (!isCorrectBranch) return false;

  const authHeader = request?.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.PREVIEW_OAT_PASSWORD}`;
  if (!process.env.PREVIEW_OAT_PASSWORD || authHeader !== expectedAuth) return false;

  return true;
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function pass(value: boolean): 'PASS' | 'FAIL' {
  return value ? 'PASS' : 'FAIL';
}

async function databaseIdentity() {
  const rows = await prisma.$queryRaw<Array<{
    current_database: string;
    server_address: string | null;
  }>>`SELECT current_database()::text AS current_database, inet_server_addr()::text AS server_address`;
  const row = rows[0];
  const parsed = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  return {
    databaseName: row?.current_database ?? null,
    databaseNameClassification: row?.current_database === 'rentipid_preview' ? 'PREVIEW' : 'NON_PREVIEW',
    serverAddressPresent: Boolean(row?.server_address),
    urlHostClassification: parsed?.hostname.includes('azure') ? 'AZURE' : parsed?.hostname.includes('neon') ? 'NEON' : parsed?.hostname ? 'OTHER' : 'MISSING',
    urlDatabaseNameClassification: parsed?.pathname.replace(/^\//, '') === 'rentipid_preview' ? 'PREVIEW' : parsed ? 'NON_PREVIEW' : 'MISSING',
  };
}

async function migrationRecord() {
  const rows = await prisma.$queryRaw<Array<{
    migration_name: string;
    checksum: string;
    finished_at: Date | null;
    rolled_back_at: Date | null;
  }>>`
    SELECT migration_name, checksum, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    WHERE migration_name = ${PHASE8_MIGRATION_NAME}
    ORDER BY started_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function schemaVerification(): Promise<GateResult> {
  const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public."UserSession"') IS NOT NULL AS exists
  `;
  const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name::text AS column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'UserSession'
  `;
  const columnSet = new Set(columns.map((row) => row.column_name));
  const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname::text AS indexname
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'UserSession'
  `;
  const indexSet = new Set(indexes.map((row) => row.indexname));
  const fk = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_class r ON r.oid = c.confrelid
      WHERE c.contype = 'f'
        AND t.relname = 'UserSession'
        AND r.relname = 'User'
        AND c.conname = 'UserSession_user_id_fkey'
    ) AS exists
  `;
  const expectedColumns = ['id', 'user_id', 'session_key_hash', 'created_at', 'last_seen_at', 'expires_at', 'revoked_at'];
  return {
    table: pass(Boolean(table[0]?.exists)),
    columns: pass(expectedColumns.every((column) => columnSet.has(column))),
    uniqueSessionKeyHashIndex: pass(indexSet.has('UserSession_session_key_hash_key')),
    userRevocationExpiryIndex: pass(indexSet.has('UserSession_user_id_revoked_at_expires_at_idx')),
    expiryIndex: pass(indexSet.has('UserSession_expires_at_idx')),
    foreignKey: pass(Boolean(fk[0]?.exists)),
  };
}

async function applyPhase8Migration() {
  const record = await migrationRecord();
  if (record?.finished_at && !record.rolled_back_at) return { applied: false, reason: 'already_applied' };

  const id = randomUUID();
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserSession" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "session_key_hash" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "revoked_at" TIMESTAMP(3),
        CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
      )
    `);
    await tx.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_session_key_hash_key" ON "UserSession"("session_key_hash")`);
    await tx.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserSession_user_id_revoked_at_expires_at_idx" ON "UserSession"("user_id", "revoked_at", "expires_at")`);
    await tx.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserSession_expires_at_idx" ON "UserSession"("expires_at")`);
    await tx.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UserSession_user_id_fkey'
        ) THEN
          ALTER TABLE "UserSession"
          ADD CONSTRAINT "UserSession_user_id_fkey"
          FOREIGN KEY ("user_id") REFERENCES "User"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    await tx.$executeRaw`
      INSERT INTO "_prisma_migrations"
        (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      SELECT ${id}, ${PHASE8_MIGRATION_CHECKSUM}, ${now}, ${PHASE8_MIGRATION_NAME}, NULL, NULL, ${now}, 1
      WHERE NOT EXISTS (
        SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ${PHASE8_MIGRATION_NAME}
      )
    `;
  });
  return { applied: true, reason: 'applied' };
}

async function cleanupPreviewUsers() {
  await prisma.user.deleteMany({
    where: { email: { startsWith: TEST_EMAIL_PREFIX, endsWith: '@rentipid.invalid' } },
  });
}

async function runAcceptance() {
  await cleanupPreviewUsers();
  const suffix = `${Date.now()}-${randomUUID()}`;
  const user = await prisma.user.create({
    data: {
      email: `${TEST_EMAIL_PREFIX}${suffix}@rentipid.invalid`,
      full_name: 'Phase 8 Preview Gate',
      account_type: 'Individual',
      role: 'Renter',
      status: 'Verified',
      password_hash: 'preview-gate-only',
      is_test_data: true,
      beta_label: 'PHASE8_PREVIEW_GATE',
    },
  });
  const other = await prisma.user.create({
    data: {
      email: `${TEST_EMAIL_PREFIX}${suffix}-other@rentipid.invalid`,
      full_name: 'Phase 8 Preview Gate Other',
      account_type: 'Individual',
      role: 'Renter',
      status: 'Verified',
      password_hash: 'preview-gate-only',
      is_test_data: true,
      beta_label: 'PHASE8_PREVIEW_GATE',
    },
  });

  const results: GateResult = {};
  try {
    const rawA = `phase8-${randomUUID()}-${'a'.repeat(32)}`;
    const rawB = `phase8-${randomUUID()}-${'b'.repeat(32)}`;
    const rawC = `phase8-${randomUUID()}-${'c'.repeat(32)}`;
    const hashA = hashSessionIdentifier(rawA);
    const hashB = hashSessionIdentifier(rawB);
    const hashC = hashSessionIdentifier(rawC);

    const first = await registerUserSession({ userId: user.id, mfaSessionId: rawA });
    const persisted = await prisma.userSession.findUnique({ where: { id: first.id } });
    results.P8_SESSION_REGISTRY = pass(Boolean(persisted && persisted.session_key_hash === hashA));
    results.P8_RAW_SESSION_SECRET_NOT_PERSISTED = pass(Boolean(persisted && persisted.session_key_hash !== rawA));

    const duplicate = await registerUserSession({ userId: user.id, mfaSessionId: rawA });
    results.P8_UNIQUE_SESSION_PER_LOGIN = pass(duplicate.id === first.id);
    const duplicateCount = await prisma.userSession.count({ where: { user_id: user.id, session_key_hash: hashA } });
    results.P8_REFRESH_PRESERVES_SESSION = pass(duplicateCount === 1);

    const second = await registerUserSession({ userId: user.id, mfaSessionId: rawB });
    results.P8_CONCURRENT_LOGIN = pass(second.id !== first.id);

    const listed = await listActiveUserSessions(user.id, hashA);
    results.P8_RAW_SESSION_SECRET_NOT_EXPOSED = pass(!JSON.stringify(listed).includes('session_key_hash') && !JSON.stringify(listed).includes(hashA));
    results.P8_CURRENT_SESSION_IDENTIFICATION = pass(Boolean(listed.find((row) => row.id === first.id && row.isCurrent)));
    results.P8_ACTIVE_SESSION_LIST = pass(listed.length >= 2 && listed.every((row) => row.expires_at > new Date()));

    const ownership = await revokeUserSession(other.id, second.id, hashA);
    results.P8_SESSION_OWNERSHIP_ENFORCED = pass(!ownership.found && !ownership.revoked);

    await prisma.mfaSessionAssurance.create({
      data: {
        session_key_hash: hashB,
        user_id: user.id,
        assurance_level: 'AAL2',
        verified_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
        revoked_at: null,
      },
    });
    const revokeOther = await revokeUserSession(user.id, second.id, hashA);
    const revokedAssurance = await prisma.mfaSessionAssurance.findUnique({ where: { session_key_hash: hashB } });
    results.P8_REVOKE_OTHER_SESSION = pass(revokeOther.revoked === true);
    results.P8_MFA_ASSURANCE_REVOKED_WITH_SESSION = pass(Boolean(revokedAssurance?.revoked_at));
    results.P8_REVOKED_SESSION_DENIED = pass((await getActiveSessionByHash(user.id, hashB)) === null);
    results.P8_OTHER_SESSION_SURVIVES_REVOKE = pass(Boolean(await getActiveSessionByHash(user.id, hashA)));

    const third = await registerUserSession({ userId: user.id, mfaSessionId: rawC });
    await prisma.mfaSessionAssurance.create({
      data: {
        session_key_hash: hashA,
        user_id: user.id,
        assurance_level: 'AAL2',
        verified_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
        revoked_at: null,
      },
    });
    await prisma.mfaSessionAssurance.create({
      data: {
        session_key_hash: hashC,
        user_id: user.id,
        assurance_level: 'AAL2',
        verified_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
        revoked_at: null,
      },
    });
    const revokedOthers = await revokeOtherUserSessions(user.id, hashA);
    const currentAfterOthers = await getActiveSessionByHash(user.id, hashA);
    const thirdAfterOthers = await prisma.mfaSessionAssurance.findUnique({ where: { session_key_hash: hashC } });
    results.P8_LOGOUT_OTHER_SESSIONS = pass(revokedOthers >= 1);
    results.P8_CURRENT_SESSION_SURVIVES_LOGOUT_OTHERS = pass(Boolean(currentAfterOthers));
    results.P8_AAL2_SESSION_ISOLATION = pass(Boolean(currentAfterOthers) && Boolean(thirdAfterOthers?.revoked_at));

    const currentRevoked = await revokeCurrentUserSession({ userId: user.id, sessionKeyHash: hashA });
    results.P8_CURRENT_LOGOUT_REVOCATION = pass(currentRevoked === 1);

    const expiredRaw = `phase8-${randomUUID()}-${'e'.repeat(32)}`;
    const expiredHash = hashSessionIdentifier(expiredRaw);
    await prisma.userSession.create({
      data: {
        user_id: user.id,
        session_key_hash: expiredHash,
        expires_at: new Date(Date.now() - 60 * 1000),
      },
    });
    results.P8_EXPIRED_SESSION_DENIED = pass((await getActiveSessionByHash(user.id, expiredHash)) === null);

    const disabledRaw = `phase8-${randomUUID()}-${'d'.repeat(32)}`;
    const disabledHash = hashSessionIdentifier(disabledRaw);
    await prisma.userSession.create({
      data: {
        user_id: user.id,
        session_key_hash: disabledHash,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await prisma.user.update({ where: { id: user.id }, data: { status: 'Suspended' } });
    results.P8_DISABLED_ACCOUNT_SESSION_DENIED = pass((await getActiveSessionByHash(user.id, disabledHash)) === null);

    results.P8_LEGACY_UNREGISTERED_SESSION_POLICY = pass((await getActiveSessionByHash(user.id, hashSessionIdentifier(`missing-${randomUUID()}-${'x'.repeat(32)}`))) === null);
    results.P8_SESSION_SECRET_SAFETY = pass(isTrustedSessionIdentifier(rawA) && !isTrustedSessionIdentifier('client-value'));

    return results;
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [user.id, other.id] } } });
  }
}

export async function GET(request: NextRequest) {
  await connection();
  if (!assertPreviewGate(request)) return forbidden();
  const identity = await databaseIdentity();
  const record = await migrationRecord();
  const schema = await schemaVerification();
  return json(200, {
    targetIdentity: {
      vercelEnv: process.env.VERCEL_ENV,
      branch: process.env.VERCEL_GIT_COMMIT_REF,
      commit: process.env.VERCEL_GIT_COMMIT_SHA,
    },
    databaseIdentity: identity,
    migration: {
      present: Boolean(record),
      finished: Boolean(record?.finished_at && !record.rolled_back_at),
      checksumMatches: record?.checksum === PHASE8_MIGRATION_CHECKSUM,
    },
    schema,
  });
}

export async function POST(request: NextRequest) {
  await connection();
  if (!assertPreviewGate(request)) return forbidden();
  const action = request.nextUrl.searchParams.get('action');
  const identity = await databaseIdentity();
  if (
    identity.databaseNameClassification !== 'PREVIEW' ||
    identity.urlDatabaseNameClassification !== 'PREVIEW'
  ) {
    return json(409, { gate: 'PHASE8_PREVIEW_DB_TARGET_QUALIFICATION', result: 'FAIL', databaseIdentity: identity });
  }

  if (action === 'migrate') {
    const migration = await applyPhase8Migration();
    const record = await migrationRecord();
    const schema = await schemaVerification();
    return json(200, {
      gate: 'PHASE8_PREVIEW_MIGRATION',
      result: pass(Boolean(record?.finished_at && record.checksum === PHASE8_MIGRATION_CHECKSUM) && Object.values(schema).every((value) => value === 'PASS')),
      migration,
      record: {
        present: Boolean(record),
        finished: Boolean(record?.finished_at && !record.rolled_back_at),
        checksumMatches: record?.checksum === PHASE8_MIGRATION_CHECKSUM,
      },
      schema,
    });
  }

  if (action === 'acceptance') {
    const schema = await schemaVerification();
    if (!Object.values(schema).every((value) => value === 'PASS')) {
      return json(409, { gate: 'PHASE8_PREVIEW_ACCEPTANCE', result: 'FAIL', schema });
    }
    const acceptance = await runAcceptance();
    return json(200, {
      gate: 'PHASE8_PREVIEW_ACCEPTANCE',
      result: pass(Object.values(acceptance).every((value) => value === 'PASS')),
      acceptance,
    });
  }

  return json(400, { error: 'Unsupported action' });
}
