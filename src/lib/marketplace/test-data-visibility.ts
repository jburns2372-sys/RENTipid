import 'server-only';

const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1']);

export function canShowMarketplaceTestData(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.SHOW_MARKETPLACE_TEST_DATA !== 'true' || env.NODE_ENV === 'production') return false;

  try {
    return LOCAL_DATABASE_HOSTS.has(new URL(env.DATABASE_URL ?? '').hostname);
  } catch {
    return false;
  }
}

