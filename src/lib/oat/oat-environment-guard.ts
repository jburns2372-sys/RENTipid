export function assertSafeOatEnvironment() {
  const dbUrlStr = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;
  
  if (nodeEnv === 'production') {
    throw new Error('OAT_ENVIRONMENT_GUARD_REJECTED: NODE_ENV is production');
  }

  if (vercelEnv === 'production') {
    throw new Error('OAT_ENVIRONMENT_GUARD_REJECTED: VERCEL_ENV is production');
  }

  if (!dbUrlStr) {
    throw new Error('OAT_ENVIRONMENT_GUARD_REJECTED: DATABASE_URL missing');
  }

  let dbUrl: URL;
  try {
    dbUrl = new URL(dbUrlStr);
  } catch {
    throw new Error('OAT_ENVIRONMENT_GUARD_REJECTED: DATABASE_URL malformed');
  }

  const host = dbUrl.hostname;
  const dbName = dbUrl.pathname.replace(/^\//, '');

  if (dbName === 'rentipid_db' && host.includes('rentipid-postgres-db.postgres.database.azure.com')) {
    throw new Error('OAT_ENVIRONMENT_GUARD_REJECTED: Database identity matches Production Azure DB');
  }
  
  if (dbName === 'rentipid_db' && (host.includes('azure') || host.includes('neon') || host.includes('aws'))) {
      throw new Error('OAT_ENVIRONMENT_GUARD_REJECTED: Database identity appears to be a remote Production DB (rentipid_db on remote host)');
  }

  // Acceptable environments:
  // 1. Local testing (localhost, rentipid_test_soc)
  // 2. Vercel Preview (VERCEL_ENV === 'preview' or similar known preview states)
  // 3. Explicit local preview (NODE_ENV !== production)
  
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      // Local is generally safe for OAT if we are doing local readiness
      console.log('OAT_ENVIRONMENT: Local Development/Test');
      return true;
  }
  
  if (vercelEnv === 'preview') {
      console.log('OAT_ENVIRONMENT: Vercel Preview');
      return true;
  }
  
  // If it's a remote db but not strictly rentipid_db on azure, it might be a preview db.
  // We should enforce some known preview DB pattern if we have one, but for now we rely on it not being the prod DB.
  console.log('OAT_ENVIRONMENT: Unknown/Custom Preview (Non-Production)');
  return true;
}
