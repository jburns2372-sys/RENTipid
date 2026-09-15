import { assertSafeLocalEnvironment } from '../../scripts/ai/seed-canonical-ai';

describe('Canonical AI Seeder Guard Suite (G1 Gate)', () => {
  it('allows safe local loopback database target', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/rentipid_local_dev',
      NODE_ENV: 'development',
    };
    const result = assertSafeLocalEnvironment(env);
    expect(result.hostname).toBe('127.0.0.1');
    expect(result.dbName).toBe('rentipid_local_dev');
  });

  it('allows localhost and ipv6 loopback', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/rentipid_dev',
      NODE_ENV: 'development',
    };
    const result = assertSafeLocalEnvironment(env);
    expect(result.hostname).toBe('localhost');
  });

  it('rejects execution when NODE_ENV is production', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/rentipid_local_dev',
      NODE_ENV: 'production',
    };
    expect(() => assertSafeLocalEnvironment(env)).toThrow(/AI_SEED_REJECTED.*production environment/);
  });

  it('rejects execution when VERCEL_ENV is production', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/rentipid_local_dev',
      VERCEL_ENV: 'production',
    };
    expect(() => assertSafeLocalEnvironment(env)).toThrow(/AI_SEED_REJECTED.*production environment/);
  });

  it('rejects execution when VERCEL_ENV is preview', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/rentipid_local_dev',
      VERCEL_ENV: 'preview',
    };
    expect(() => assertSafeLocalEnvironment(env)).toThrow(/AI_SEED_REJECTED.*preview environment/);
  });

  it('rejects execution when target database name indicates preview', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/rentipid_preview',
      NODE_ENV: 'development',
    };
    expect(() => assertSafeLocalEnvironment(env)).toThrow(/AI_SEED_REJECTED.*preview database/);
  });

  it('rejects execution when target database name indicates production', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/rentipid_production',
      NODE_ENV: 'development',
    };
    expect(() => assertSafeLocalEnvironment(env)).toThrow(/AI_SEED_REJECTED.*production database/);
  });

  it('rejects execution when target host is non-loopback', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@postgres.internal.cloud:5432/rentipid_local_dev',
      NODE_ENV: 'development',
    };
    expect(() => assertSafeLocalEnvironment(env)).toThrow(/AI_SEED_REJECTED.*not a local loopback address/);
  });

  it('rejects execution when DATABASE_URL is missing or malformed', () => {
    expect(() => assertSafeLocalEnvironment({})).toThrow(/AI_SEED_REJECTED.*missing/);
    expect(() => assertSafeLocalEnvironment({ DATABASE_URL: 'not-a-valid-url' })).toThrow(/AI_SEED_REJECTED.*malformed/);
  });
});
