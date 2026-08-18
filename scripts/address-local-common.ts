import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

export const LOCAL_ADDRESS_DATABASE = 'rentipid_address_local';
export const LOCAL_ENV_FILE = resolve(process.cwd(), '.env.local');
export const LOCAL_STATE_FILE = resolve(process.cwd(), '.address-local-state.json');
const FORBIDDEN_DATABASES = new Set([
  'postgres', 'template0', 'template1', 'rentipid_preview',
  'rentipid_production', 'production',
]);

export type EnvironmentMap = Record<string, string>;

function decodeEnvValue(raw: string): string {
  const value = raw.trim();
  const quote = String.fromCharCode(34);
  const apostrophe = String.fromCharCode(39);
  if (value.startsWith(quote) && value.endsWith(quote)) {
    try { return JSON.parse(value) as string; } catch { return value.slice(1, -1); }
  }
  if (value.startsWith(apostrophe) && value.endsWith(apostrophe)) return value.slice(1, -1);
  return value;
}

export function readEnvironmentFile(path = LOCAL_ENV_FILE): EnvironmentMap {
  if (!existsSync(path)) return {};
  const values: EnvironmentMap = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) values[match[1]] = decodeEnvValue(match[2]);
  }
  return values;
}

function encodeEnvValue(value: string): string {
  if (/^[A-Za-z0-9_./:@+-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

export function updateEnvironmentFile(updates: EnvironmentMap, path = LOCAL_ENV_FILE): void {
  const original = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const remaining = new Map(Object.entries(updates));
  const lines = original.split(/\r?\n/).map((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!match || !remaining.has(match[1])) return line;
    const value = remaining.get(match[1])!;
    remaining.delete(match[1]);
    return `${match[1]}=${encodeEnvValue(value)}`;
  });
  if (lines.length && lines.at(-1) !== '') lines.push('');
  for (const [key, value] of remaining) lines.push(`${key}=${encodeEnvValue(value)}`);
  lines.push('');
  const temporaryPath = `${path}.address-bootstrap.tmp`;
  writeFileSync(temporaryPath, lines.join('\n'), { encoding: 'utf8', mode: 0o600 });
  renameSync(temporaryPath, path);
}

export function applyEnvironment(values: EnvironmentMap): void {
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
}

export function databaseName(databaseUrl: string): string {
  const parsed = new URL(databaseUrl);
  return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
}

export function assertLocalDatabaseUrl(databaseUrl: string, expectedDatabase?: string): URL {
  const parsed = new URL(databaseUrl);
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error('SAFETY: Address local bootstrap requires PostgreSQL.');
  }
  const host = parsed.hostname.toLowerCase();
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error(`SAFETY: Refusing non-local database host '${host}'.`);
  }
  const name = databaseName(databaseUrl).toLowerCase();
  if (!name || FORBIDDEN_DATABASES.has(name) || /preview|prod(?:uction)?/.test(name)) {
    throw new Error(`SAFETY: Refusing protected database '${name || '<empty>'}'.`);
  }
  if (expectedDatabase && name !== expectedDatabase.toLowerCase()) {
    throw new Error(`SAFETY: Expected database '${expectedDatabase}', received '${name}'.`);
  }
  return parsed;
}

export function assertLocalAdminDatabaseUrl(databaseUrl: string): URL {
  const parsed = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('SAFETY: Local admin URL must use PostgreSQL.');
  }
  if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname.toLowerCase())) {
    throw new Error('SAFETY: Local admin URL must use a loopback host.');
  }
  if (databaseName(databaseUrl) !== 'postgres') {
    throw new Error('SAFETY: Local admin URL must target the postgres maintenance database.');
  }
  return parsed;
}

function splitPgpassLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let escaped = false;
  for (const character of line) {
    if (escaped) { current += character; escaped = false; continue; }
    if (character.charCodeAt(0) === 92) { escaped = true; continue; }
    if (character === ':') { fields.push(current); current = ''; continue; }
    current += character;
  }
  fields.push(current);
  return fields;
}

export function resolveLocalAdminDatabaseUrl(sourceUrl: string, explicitUrl?: string): string | null {
  if (explicitUrl) {
    assertLocalAdminDatabaseUrl(explicitUrl);
    return explicitUrl;
  }
  const source = new URL(sourceUrl);
  const candidates = [
    process.env.APPDATA ? resolve(process.env.APPDATA, 'postgresql/pgpass.conf') : '',
    process.env.USERPROFILE ? resolve(process.env.USERPROFILE, '.pgpass') : '',
  ].filter(Boolean);
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue;
      const [host, port, database, user, password] = splitPgpassLine(line);
      const hostsMatch = host === '*' || host === source.hostname
        || (['localhost', '127.0.0.1'].includes(host) && ['localhost', '127.0.0.1'].includes(source.hostname));
      if (!hostsMatch || (port !== '*' && port !== (source.port || '5432'))) continue;
      if (database !== '*' && database !== 'postgres') continue;
      if (!user || !password) continue;
      const admin = new URL(sourceUrl);
      admin.username = user;
      admin.password = password;
      admin.pathname = '/postgres';
      admin.searchParams.delete('schema');
      assertLocalAdminDatabaseUrl(admin.toString());
      return admin.toString();
    }
  }
  return null;
}

export function localDatabaseUrlFrom(sourceUrl: string, name = LOCAL_ADDRESS_DATABASE): string {
  assertLocalDatabaseUrl(sourceUrl);
  if (!/^[a-z][a-z0-9_]{2,62}$/.test(name) || FORBIDDEN_DATABASES.has(name)) {
    throw new Error('SAFETY: Invalid local database name.');
  }
  const parsed = new URL(sourceUrl);
  parsed.pathname = `/${name}`;
  parsed.searchParams.delete('schema');
  return parsed.toString();
}

export async function ensureLocalDatabase(
  sourceUrl: string,
  targetUrl: string,
  explicitAdminUrl?: string,
): Promise<string> {
  assertLocalDatabaseUrl(sourceUrl);
  assertLocalDatabaseUrl(targetUrl, LOCAL_ADDRESS_DATABASE);
  const applicationRole = decodeURIComponent(new URL(sourceUrl).username);
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(applicationRole)) {
    throw new Error('SAFETY: Local application database role has an invalid identifier.');
  }
  const adminUrl = new URL(sourceUrl);
  adminUrl.pathname = '/postgres';
  adminUrl.searchParams.delete('schema');
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  let needsExplicitAdmin = false;
  try {
    const existing = await admin.query<{ datname: string }>(
      'SELECT datname FROM pg_database WHERE datname = $1',
      [LOCAL_ADDRESS_DATABASE],
    );
    if (existing.rowCount === 0) {
      try { await admin.query(`CREATE DATABASE ${LOCAL_ADDRESS_DATABASE}`); }
      catch (error: unknown) {
        if ((error as { code?: string }).code !== '42501') throw error;
        needsExplicitAdmin = true;
      }
      if (!needsExplicitAdmin) console.log(`Created dedicated local database: ${LOCAL_ADDRESS_DATABASE}`);
    } else {
      console.log(`Reusing dedicated local database: ${LOCAL_ADDRESS_DATABASE}`);
    }
  } finally {
    await admin.end();
  }

  if (needsExplicitAdmin) {
    if (!explicitAdminUrl) {
      throw new Error('EXTERNAL AUTHORIZATION REQUIRED: set ADDRESS_LOCAL_ADMIN_DATABASE_URL to a loopback postgres maintenance URL, then rerun. It is used only to create disposable local databases.');
    }
    assertLocalAdminDatabaseUrl(explicitAdminUrl);
    const privileged = new Client({ connectionString: explicitAdminUrl });
    await privileged.connect();
    try {
      const existing = await privileged.query<{ datname: string }>(
        'SELECT datname FROM pg_database WHERE datname = $1', [LOCAL_ADDRESS_DATABASE],
      );
      if (existing.rowCount === 0) await privileged.query(`CREATE DATABASE ${LOCAL_ADDRESS_DATABASE}`);
      console.log(`Created dedicated local database: ${LOCAL_ADDRESS_DATABASE}`);
    } finally {
      await privileged.end();
    }
  }

  if (explicitAdminUrl) {
    assertLocalAdminDatabaseUrl(explicitAdminUrl);
    const privileged = new Client({ connectionString: explicitAdminUrl });
    await privileged.connect();
    try {
      const owner = await privileged.query<{ owner_name: string }>(
        `SELECT r.rolname AS owner_name FROM pg_database d
         JOIN pg_roles r ON r.oid = d.datdba WHERE d.datname = $1`,
        [LOCAL_ADDRESS_DATABASE],
      );
      if (owner.rows[0]?.owner_name !== applicationRole) {
        await privileged.query(`ALTER DATABASE ${LOCAL_ADDRESS_DATABASE} OWNER TO ${applicationRole}`);
        console.log('Dedicated local database ownership assigned to the application role.');
      }
    } finally {
      await privileged.end();
    }
  }

  const target = new Client({ connectionString: targetUrl });
  await target.connect();
  try {
    const identity = await target.query<{ current_database: string; server_address: string | null }>(
      'SELECT current_database(), inet_server_addr()::text AS server_address',
    );
    if (identity.rows[0]?.current_database !== LOCAL_ADDRESS_DATABASE) {
      throw new Error('SAFETY: PostgreSQL identity did not match the selected local database.');
    }
    const serverAddress = identity.rows[0]?.server_address;
    const normalizedServerAddress = serverAddress?.split('/')[0];
    if (normalizedServerAddress && !['127.0.0.1', '::1'].includes(normalizedServerAddress)) {
      throw new Error(`SAFETY: PostgreSQL server resolved to non-local address '${serverAddress}'.`);
    }
  } finally {
    await target.end();
  }
  return targetUrl;
}

export function ensureSecret(value: string | undefined, bytes = 32): string {
  return value && value.trim() ? value : randomBytes(bytes).toString('hex');
}

export async function runCommand(
  command: string,
  args: string[],
  environment: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: environment,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}.`));
    });
  });
}

export function writeLocalState(state: Record<string, unknown>): void {
  writeFileSync(LOCAL_STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
}
