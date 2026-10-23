export interface KnowledgeEnvironmentIdentity {
  kind: 'LOCAL_TEST' | 'PREVIEW';
  environment: 'LOCAL' | 'TEST' | 'PREVIEW';
  databaseIdentity: 'TEST' | 'PREVIEW';
  databaseName: string;
  host: string;
}

interface ParsedDatabaseIdentity {
  databaseName: string;
  host: string;
  port: string;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const LOCAL_TEST_DATABASE = /^rentipid_test_soc(?:_[0-9]+)?$/i;
const PREVIEW_DATABASE = 'rentipid_preview';
const PRODUCTION_DATABASES = new Set([
  'production',
  'rentipid_db',
  'rentipid_prod',
  'rentipid_production',
]);

function reject(reason: string): never {
  throw new Error(`KNOWLEDGE_ENVIRONMENT_REJECTED:${reason}`);
}

function parseDatabaseIdentity(value: string, malformedReason: string): ParsedDatabaseIdentity {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return reject(malformedReason);
  }
  return {
    host: url.hostname.toLowerCase(),
    port: url.port || '5432',
    databaseName: decodeURIComponent(url.pathname.replace(/^\//, '').split('?')[0]).toLowerCase(),
  };
}

function sameDatabaseIdentity(left: ParsedDatabaseIdentity, right: ParsedDatabaseIdentity): boolean {
  return left.host === right.host
    && left.port === right.port
    && left.databaseName === right.databaseName;
}

function isProductionDatabase(
  database: ParsedDatabaseIdentity,
  environment: Readonly<Record<string, string | undefined>>,
): boolean {
  if (PRODUCTION_DATABASES.has(database.databaseName)) return true;
  if (/(?:^|[.-])(?:prod|production)(?:[.-]|$)/i.test(database.host)) return true;
  if (!environment.PRODUCTION_DATABASE_URL) return false;
  const production = parseDatabaseIdentity(
    environment.PRODUCTION_DATABASE_URL,
    'PRODUCTION_DATABASE_IDENTITY_MALFORMED',
  );
  return sameDatabaseIdentity(database, production);
}

function isVerifiedPreviewDatabase(
  database: ParsedDatabaseIdentity,
  environment: Readonly<Record<string, string | undefined>>,
): boolean {
  if (LOCAL_HOSTS.has(database.host) || database.databaseName !== PREVIEW_DATABASE) return false;
  if (!environment.PREVIEW_DATABASE_URL) return true;
  const preview = parseDatabaseIdentity(
    environment.PREVIEW_DATABASE_URL,
    'PREVIEW_DATABASE_IDENTITY_MALFORMED',
  );
  return preview.databaseName === PREVIEW_DATABASE && sameDatabaseIdentity(database, preview);
}

export function assertKnowledgeMutationEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): KnowledgeEnvironmentIdentity {
  if (environment.NODE_ENV === 'production') {
    return reject('NODE_ENV_PRODUCTION');
  }
  if (environment.VERCEL_ENV === 'production') {
    return reject('VERCEL_ENV_PRODUCTION');
  }
  if (!environment.DATABASE_URL) {
    return reject('DATABASE_IDENTITY_MISSING');
  }
  const database = parseDatabaseIdentity(
    environment.DATABASE_URL,
    'DATABASE_IDENTITY_MALFORMED',
  );
  if (isProductionDatabase(database, environment)) {
    return reject('PRODUCTION_DATABASE');
  }
  if (environment.ALLOW_KNOWLEDGE_MUTATION !== 'true') {
    return reject('EXPLICIT_MUTATION_FLAG_REQUIRED');
  }

  if (LOCAL_HOSTS.has(database.host)) {
    if (environment.VERCEL_ENV === 'preview') return reject('PREVIEW_DATABASE_IDENTITY_MISMATCH');
    if (!LOCAL_TEST_DATABASE.test(database.databaseName)) return reject('UNKNOWN_LOCAL_DATABASE');
    return {
      kind: 'LOCAL_TEST',
      environment: environment.NODE_ENV === 'test' ? 'TEST' : 'LOCAL',
      databaseIdentity: 'TEST',
      databaseName: database.databaseName,
      host: database.host,
    };
  }

  if (environment.VERCEL_ENV !== 'preview') return reject('UNKNOWN_REMOTE_DATABASE');
  if (environment.ALLOW_PREVIEW_KNOWLEDGE_MUTATION !== 'true') {
    return reject('PREVIEW_MUTATION_FLAG_REQUIRED');
  }
  if (!isVerifiedPreviewDatabase(database, environment)) {
    return reject('PREVIEW_DATABASE_IDENTITY_MISMATCH');
  }
  return {
    kind: 'PREVIEW',
    environment: 'PREVIEW',
    databaseIdentity: 'PREVIEW',
    databaseName: database.databaseName,
    host: database.host,
  };
}
