export function assertSafeLocalTestDatabaseTarget() {
  const dbUrlStr = process.env.DATABASE_URL;
  const directUrlStr = process.env.DIRECT_URL;
  const nodeEnv = process.env.NODE_ENV;
  const allowMutation = process.env.ALLOW_TEST_DATABASE_MUTATION;

  if (nodeEnv !== 'test') {
    throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: NODE_ENV is not test. Value: ' + nodeEnv);
  }

  if (allowMutation !== 'true') {
    throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: ALLOW_TEST_DATABASE_MUTATION is not exactly true.');
  }

  if (!dbUrlStr) {
    throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: DATABASE_URL missing');
  }

  let dbUrl: URL;
  try {
    dbUrl = new URL(dbUrlStr);
  } catch (e) {
    throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: DATABASE_URL malformed');
  }

  const host = dbUrl.hostname;
  const dbName = dbUrl.pathname.replace(/^\//, '');

  if (host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') {
    throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: Host is not local. Classification: REMOTE/CLOUD');
  }

  if (host.includes('rentipid-postgres-db.postgres.database.azure.com') || host.includes('azure') || host.includes('neon') || host.includes('aws')) {
    throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: Host is a cloud or remote hostname');
  }

  if (dbName === 'rentipid_db') {
    throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: Database name is rentipid_db');
  }

  if (dbName !== 'rentipid_test_soc') {
    throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: Database name is not exactly rentipid_test_soc');
  }

  if (!dbName.includes('test')) {
    throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: Database name does not contain test');
  }

  if (directUrlStr) {
    let directUrl: URL;
    try {
      directUrl = new URL(directUrlStr);
    } catch (e) {
      throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: DIRECT_URL malformed');
    }
    
    if (directUrl.hostname !== host) {
      throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: DIRECT_URL host differs from DATABASE_URL');
    }
    
    if (directUrl.pathname.replace(/^\//, '') !== dbName) {
      throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: DIRECT_URL database differs from DATABASE_URL');
    }
  }

  if (dbUrl.searchParams.has('sslmode') && dbUrl.searchParams.get('sslmode') === 'require') {
    if (host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') {
      throw new Error('DATABASE_SAFETY_GUARD_REJECTED_TARGET: Target classification is uncertain (SSL on remote)');
    }
  }

  console.log('TARGET_HOST_CLASSIFICATION:\nLOCALHOST');
  console.log('TARGET_DATABASE:\n' + dbName);
  console.log('TARGET_ENVIRONMENT:\n' + nodeEnv.toUpperCase());
  console.log('PRODUCTION_TARGET:\nNO');
  console.log('LOCAL_ISOLATED_TEST_TARGET_ACCEPTED');
}
