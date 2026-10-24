import { PrismaClient } from '@prisma/client';
import {
  assertProductionDatabaseIdentity,
  bootstrapProductionPsgc,
  type PsgcClient,
} from '../src/lib/address/psgc-bulk-bootstrap';

function argument(name: string): string {
  const prefix = '--' + name + '=';
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) || '';
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const identityOptions = {
    databaseUrl,
    expectedDatabase: argument('expected-db'),
    confirmedDatabase: argument('confirm-db'),
    environment: argument('environment'),
  };
  assertProductionDatabaseIdentity(identityOptions, identityOptions.expectedDatabase);
  const prisma = new PrismaClient();
  try {
    const identity = await prisma.$queryRawUnsafe<Array<{
      current_database: string;
      current_user: string;
    }>>('SELECT current_database() AS current_database, current_user AS current_user');
    if (!identity[0]) throw new Error('SAFETY: Database identity query returned no result.');
    assertProductionDatabaseIdentity(identityOptions, identity[0].current_database);

    const result = await bootstrapProductionPsgc(prisma as unknown as PsgcClient);
    const status = result.status === 'already-ready' ? 'SKIPPED_READY' : 'PASS';
    console.log('PSGC_PRODUCTION_BOOTSTRAP = ' + status);
    console.log('PSGC_NETWORK_REQUESTS = ' + result.networkRequests);
    console.log('PSGC_BARANGAY_COUNT = ' + result.barangayCount);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'PSGC Production bootstrap failed safely.');
  process.exitCode = 1;
});
