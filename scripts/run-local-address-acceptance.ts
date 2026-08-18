import { connect } from 'node:net';
import { Client } from 'pg';
import {
  LOCAL_ADDRESS_DATABASE,
  applyEnvironment,
  assertLocalDatabaseUrl,
  readEnvironmentFile,
  runCommand,
} from './address-local-common';

function validGoogleKey(value: string | undefined): boolean {
  return Boolean(value && value.length >= 20 && value.length <= 255 && !/\s/.test(value));
}

async function portIsListening(port: number): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const socket = connect({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolvePromise(true); });
    socket.once('error', () => resolvePromise(false));
    socket.setTimeout(1_000, () => { socket.destroy(); resolvePromise(false); });
  });
}

async function main(): Promise<void> {
  const environment = readEnvironmentFile();
  applyEnvironment(environment);
  const databaseUrl = environment.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is missing from .env.local.');
  assertLocalDatabaseUrl(databaseUrl, LOCAL_ADDRESS_DATABASE);
  if (environment.NEXTAUTH_URL !== 'http://localhost:3000') {
    throw new Error('NEXTAUTH_URL must be http://localhost:3000.');
  }
  if (environment.ADDRESS_PROVIDER !== 'GOOGLE' || !validGoogleKey(environment.GOOGLE_MAPS_API_KEY)) {
    throw new Error('A valid server-only GOOGLE_MAPS_API_KEY and ADDRESS_PROVIDER=GOOGLE are required.');
  }
  if (!environment.ADDRESS_LOCAL_TEST_EMAIL || !environment.ADDRESS_LOCAL_TEST_PASSWORD) {
    throw new Error('The local Address acceptance user is not configured.');
  }
  if (await portIsListening(3000)) {
    throw new Error('Port 3000 is already in use. Stop that server before running the isolated local acceptance gate.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const identity = await client.query<{ current_database: string; current_user: string }>(
      'SELECT current_database(), current_user',
    );
    if (identity.rows[0]?.current_database !== LOCAL_ADDRESS_DATABASE) {
      throw new Error('SAFETY: Local acceptance database identity mismatch.');
    }
    console.log(`LOCAL_ACCEPTANCE_DATABASE = ${identity.rows[0].current_database}`);
    console.log('LOCAL_ACCEPTANCE_DATABASE_IDENTITY = PASS');
  } finally {
    await client.end();
  }

  await runCommand('npx', ['playwright', 'test', '--config=playwright-local-address.config.ts']);
  console.log('LOCAL_BROWSER_ACCEPTANCE = PASS');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Local browser acceptance failed safely.');
  process.exitCode = 1;
});
