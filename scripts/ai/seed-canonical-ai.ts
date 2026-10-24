import { prisma } from '../../src/lib/prisma';
import { synchronizeKnowledge } from '../../src/lib/ai/knowledge/synchronizer';
import { seedCanonicalIntents } from '../../src/lib/ai/context/canonical-intent-registry';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const ALLOWED_LOCAL_DBS = new Set(['rentipid_local_dev', 'rentipid_dev']);
const PRODUCTION_DBS = new Set(['production', 'rentipid_production', 'rentipid_prod', 'rentipid_db']);

export function assertSafeLocalEnvironment(env: Record<string, string | undefined> = process.env): { hostname: string; dbName: string } {
  if (env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production') {
    throw new Error('AI_SEED_REJECTED: Cannot run canonical AI seed in production environment');
  }

  if (env.VERCEL_ENV === 'preview') {
    throw new Error('AI_SEED_REJECTED: Cannot run local AI seed in preview environment');
  }

  const dbUrl = env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('AI_SEED_REJECTED: DATABASE_URL environment variable is missing');
  }

  let parsed: URL;
  try {
    parsed = new URL(dbUrl);
  } catch {
    throw new Error('AI_SEED_REJECTED: DATABASE_URL is malformed');
  }

  const hostname = parsed.hostname.toLowerCase();
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, '').split('?')[0]).toLowerCase();

  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(`AI_SEED_REJECTED: Target database host "${hostname}" is not a local loopback address`);
  }

  if (PRODUCTION_DBS.has(dbName) || /(?:^|[._-])(?:prod|production)(?:[._-]|$)/i.test(dbName)) {
    throw new Error(`AI_SEED_REJECTED: Target database name "${dbName}" appears to be a production database`);
  }

  if (dbName.includes('preview')) {
    throw new Error(`AI_SEED_REJECTED: Target database name "${dbName}" appears to be a preview database`);
  }

  if (!ALLOWED_LOCAL_DBS.has(dbName) && !/^rentipid_test_soc(?:_[0-9]+)?$/i.test(dbName)) {
    throw new Error(`AI_SEED_REJECTED: Target database name "${dbName}" is not in the allowed local development database set`);
  }

  return { hostname, dbName };
}

async function main(): Promise<void> {
  const { hostname, dbName } = assertSafeLocalEnvironment();
  console.log(`[AI-SEED-GUARD] Verified safe local database target: ${hostname}/${dbName}`);

  console.log('=== Step 1: Synchronizing Unified AI Knowledge Sources ===');
  const syncSummary = await synchronizeKnowledge(prisma);
  console.log('Knowledge sync summary:', {
    created: syncSummary.created,
    newVersions: syncSummary.newVersions,
    noOp: syncSummary.noOp,
    failed: syncSummary.failed,
    chunksCreated: syncSummary.chunksCreated,
  });

  if (syncSummary.failed > 0) {
    throw new Error(`Knowledge sync completed with ${syncSummary.failed} failures`);
  }

  console.log('=== Step 2: Seeding Canonical Question Intents ===');
  const intentSummary = await seedCanonicalIntents();
  console.log('Canonical intent seed summary:', intentSummary);

  console.log('=== Canonical AI Seed Complete ===');
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('Fatal error during canonical AI seed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
