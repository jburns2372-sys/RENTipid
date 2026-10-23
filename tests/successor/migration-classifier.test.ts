import { Client } from 'pg';
import { execSync } from 'node:child_process';
import { classifyDatabase, runDbInstall } from '../../scripts/db/db-install';

jest.mock('pg', () => ({ Client: jest.fn() }));
jest.mock('node:child_process', () => ({ execSync: jest.fn() }));

const target = 'postgresql://disposable:disposable@127.0.0.1:55465/rentipid_test_soc';
const query = jest.fn();
const end = jest.fn();
const connect = jest.fn();
function database(tables: string[], migrations: string[] = []) {
  query.mockResolvedValueOnce({rows: [{db_name: 'rentipid_test_soc', server_addr: '127.0.0.1', server_port: 55465}]});
  query.mockResolvedValueOnce({rows: tables.map(table_name => ({table_name}))});
  if (tables.includes('_prisma_migrations')) query.mockResolvedValueOnce({rows: migrations.map(migration_name => ({migration_name, finished_at: new Date(), rolled_back_at: null}))});
}

beforeEach(() => {
  jest.clearAllMocks();
  query.mockReset();
  (Client as unknown as jest.Mock).mockImplementation(() => ({connect, query, end}));
});

describe('Migration classifier and dispatcher without persistent database connections', () => {
  it.each([
    ['empty', [], [], 'INSTALLATION'],
    ['installation successors', ['User', '_prisma_migrations'], ['20260916000000_installation_baseline', '20260925000000_add_user_global_preference'], 'INSTALLATION'],
    ['legacy', ['User', '_prisma_migrations'], ['20260715145648_init_soc_events', '20260822134500_reconcile_semantic_type'], 'LEGACY'],
    ['unmanaged tables', ['User'], [], 'UNKNOWN'],
    ['mixed history', ['User', '_prisma_migrations'], ['20260916000000_installation_baseline', '20260822134500_reconcile_semantic_type'], 'UNKNOWN'],
    ['empty ledger', ['User', '_prisma_migrations'], [], 'UNKNOWN'],
  ])('classifies %s safely', async (_label, tables, migrations, expected) => {
    database(tables as string[], migrations as string[]);
    const result = await classifyDatabase(target);
    expect(result.classification.track).toBe(expected);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it.each([
    'postgresql://disposable:disposable@shared.example.com/rentipid_test_soc',
    'postgresql://disposable:disposable@127.0.0.1/rentipid_preview',
    'postgresql://disposable:disposable@127.0.0.1/rentipid_production',
    'invalid',
  ])('rejects unsafe target before connecting: %s', async url => {
    await expect(classifyDatabase(url)).rejects.toThrow(/SECURITY_FAIL_CLOSED/);
    expect(connect).not.toHaveBeenCalled();
  });

  it.each([
    ['empty', [], [], 'prisma/installation_migrations'],
    ['existing installation', ['User', '_prisma_migrations'], ['20260916000000_installation_baseline'], 'prisma/installation_migrations'],
    ['existing legacy', ['User', '_prisma_migrations'], ['20260822134500_reconcile_semantic_type'], 'prisma/migrations'],
  ])('dispatches %s to the correct track', async (_label, tables, migrations, expectedPath) => {
    const saved = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL = target;
      database(tables as string[], migrations as string[]);
      await runDbInstall();
      expect(execSync).toHaveBeenCalledWith('npx prisma migrate deploy', expect.objectContaining({env: expect.objectContaining({PRISMA_MIGRATIONS_PATH: expectedPath})}));
    } finally {
      if (saved === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = saved;
    }
  });

  it('never dispatches an ambiguous existing database', async () => {
    const saved = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL = target;
      database(['User']);
      await expect(runDbInstall()).rejects.toThrow(/Cannot determine safe migration track/);
      expect(execSync).not.toHaveBeenCalled();
    } finally {
      if (saved === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = saved;
    }
  });
});
