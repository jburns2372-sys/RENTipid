import { PrismaClient } from '@prisma/client';
import { ProfileBackfillDryRun } from '../../src/lib/security/crypto/profile-backfill-dry-run';

async function main() {
  console.log('=============================================');
  console.log('   READ_ONLY_DRY_RUN - PHASE 5F-D-B1         ');
  console.log('=============================================');

  const args = process.argv.slice(2);
  let batchSize = 10;

  for (const arg of args) {
    if (arg.startsWith('--batch-size=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (isNaN(val) || val < 1) {
        console.error('Invalid batch size provided.');
        process.exit(1);
      }
      batchSize = val;
    } else if (arg === '--write' || arg === '--apply' || arg === '--commit' || arg === '--update') {
      console.error(`Mutation flag ${arg} rejected in dry-run mode.`);
      process.exit(1);
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  // Determine database URL without loading env file manually here, 
  // assume it's loaded via cross-env / dotenv CLI
  const databaseUrl = process.env.DATABASE_URL || '';
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    console.error('Invalid DATABASE_URL');
    process.exit(1);
  }

  const host = url.hostname;
  const dbName = url.pathname.substring(1); // remove leading slash

  const isLoopback = host === '127.0.0.1' || host === 'localhost' || host === '[::1]';
  const isIsolated = dbName.includes('test') || dbName.includes('phase5f') || dbName.includes('sandbox') || dbName.includes('isolated');
  const hasCredentials = !!url.username && !!url.password;

  console.log(`Protocol: ${url.protocol}`);
  console.log(`Host: ${host}`);
  console.log(`Port: ${url.port}`);
  console.log(`Database name: ${dbName}`);
  console.log(`Loopback Boolean: ${isLoopback}`);
  console.log(`Isolation-name Boolean: ${isIsolated}`);
  console.log(`Credential-present Boolean: ${hasCredentials}`);

  if (!isLoopback) {
    console.error('Unsafe database identity: Not a loopback address.');
    process.exit(1);
  }

  if (!isIsolated) {
    console.error('Unsafe database identity: Database name does not match isolated test conventions.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const runner = new ProfileBackfillDryRun(prisma);

  try {
    const report = await runner.scan(batchSize);
    console.log(JSON.stringify(report, null, 2));
    await prisma.$disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(`Dry run failed: ${err.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
