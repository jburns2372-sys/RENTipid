import { assertSafeLocalTestDatabaseTarget } from '../../src/lib/test-database-guard';

describe('Database Safety Guard Synthetic Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const expectRejection = (envPatch: Partial<NodeJS.ProcessEnv>, expectedMessagePart: string) => {
    Object.assign(process.env, envPatch);
    expect(() => assertSafeLocalTestDatabaseTarget()).toThrow(
      new RegExp(`DATABASE_SAFETY_GUARD_REJECTED_TARGET:.*${expectedMessagePart}`)
    );
  };

  it('rejects Azure production hostname', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://user:pass@rentipid-postgres-db.postgres.database.azure.com/rentipid_test_soc'
    }, 'Host is not local');
  });

  it('rejects database name rentipid_db', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/rentipid_db'
    }, 'rentipid_db');
  });

  it('rejects arbitrary remote PostgreSQL hostname', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://user:pass@some-remote-host.com/rentipid_test_soc'
    }, 'Host is not local');
  });

  it('rejects missing database name', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/'
    }, 'Database name is not exactly rentipid_test_soc');
  });

  it('rejects database name without test', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/rentipid_dev'
    }, 'Database name is not exactly rentipid_test_soc');
  });

  it('rejects NODE_ENV=development', () => {
    expectRejection({
      NODE_ENV: 'development',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/rentipid_test_soc'
    }, 'NODE_ENV is not test');
  });

  it('rejects missing ALLOW_TEST_DATABASE_MUTATION', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: undefined,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/rentipid_test_soc'
    }, 'ALLOW_TEST_DATABASE_MUTATION is not exactly true');
  });

  it('rejects ALLOW_TEST_DATABASE_MUTATION=false', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'false',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/rentipid_test_soc'
    }, 'ALLOW_TEST_DATABASE_MUTATION is not exactly true');
  });

  it('rejects missing DATABASE_URL', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: undefined
    }, 'DATABASE_URL missing');
  });

  it('rejects malformed DATABASE_URL', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'not-a-url'
    }, 'DATABASE_URL malformed');
  });

  it('rejects DIRECT_URL host mismatch', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/rentipid_test_soc',
      DIRECT_URL: 'postgresql://user:pass@127.0.0.1:5432/rentipid_test_soc' // '127.0.0.1' != 'localhost'
    }, 'DIRECT_URL host differs');
  });

  it('rejects DIRECT_URL database mismatch', () => {
    expectRejection({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/rentipid_test_soc',
      DIRECT_URL: 'postgresql://user:pass@localhost:5432/rentipid_db'
    }, 'DIRECT_URL database differs');
  });
});
