import { assertSafeLocalTestDatabaseTarget } from '../../src/lib/test-database-guard';

describe('Test Database Guard Hardening', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    (process.env as any).NODE_ENV = 'test';
    (process.env as any).ALLOW_TEST_DATABASE_MUTATION = 'true';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const runWithDb = (dbName: string, host: string = '127.0.0.1') => {
    process.env.DATABASE_URL = `postgresql://user:pass@${host}:5432/${dbName}`;
    delete process.env.DIRECT_URL;
    assertSafeLocalTestDatabaseTarget();
  };

  it('accepts exact match rentipid_test_soc', () => {
    expect(() => runWithDb('rentipid_test_soc')).not.toThrow();
  });

  it('accepts numeric suffixed matches rentipid_test_soc_123', () => {
    expect(() => runWithDb('rentipid_test_soc_1')).not.toThrow();
    expect(() => runWithDb('rentipid_test_soc_99')).not.toThrow();
  });

  it('rejects missing or empty test database', () => {
    expect(() => runWithDb('')).toThrow();
  });

  it('rejects rentipid_test_soc_prod', () => {
    expect(() => runWithDb('rentipid_test_soc_prod')).toThrow('DATABASE_SAFETY_GUARD_REJECTED_TARGET');
  });

  it('rejects rentipid_test_soc_preview', () => {
    expect(() => runWithDb('rentipid_test_soc_preview')).toThrow('DATABASE_SAFETY_GUARD_REJECTED_TARGET');
  });

  it('rejects rentipid_test_social', () => {
    expect(() => runWithDb('rentipid_test_social')).toThrow('DATABASE_SAFETY_GUARD_REJECTED_TARGET');
  });

  it('rejects rentipid', () => {
    expect(() => runWithDb('rentipid')).toThrow('DATABASE_SAFETY_GUARD_REJECTED_TARGET');
  });

  it('rejects production', () => {
    expect(() => runWithDb('production')).toThrow('DATABASE_SAFETY_GUARD_REJECTED_TARGET');
  });
  
  it('rejects remote host targets', () => {
    expect(() => runWithDb('rentipid_test_soc', 'rentipid-postgres-db.postgres.database.azure.com')).toThrow();
  });
});
