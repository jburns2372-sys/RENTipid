import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { execSync } from 'child_process';
import { ProfileBackfillWriter } from '../../src/lib/security/crypto/profile-backfill-writer';
import { ProfileBackfillDryRun } from '../../src/lib/security/crypto/profile-backfill-dry-run';
import { ProfileBackfillRunState, ProfileBackfillAggregateWriteResult, ProfileBackfillRecordOutcome, ProfileBackfillCommandConfig } from '../../src/lib/security/crypto/profile-backfill-types';

async function run() {
  const args = process.argv.slice(2);
  const config: Partial<ProfileBackfillCommandConfig> = {};
  
  for (const arg of args) {
    if (arg === '--apply') config.apply = true;
    else if (arg.startsWith('--environment=')) config.environment = arg.split('=')[1];
    else if (arg.startsWith('--batch-size=')) config.batchSize = parseInt(arg.split('=')[1], 10);
    else if (arg === '--acknowledge-plaintext-preserved') config.acknowledgePlaintextPreserved = true;
    else if (arg.startsWith('--confirmation-token=')) config.confirmationToken = arg.split('=')[1];
    else {
      console.error('Unknown option:', arg);
      process.exit(1);
    }
  }

  if (config.environment !== 'isolated-test') {
    console.error('Rejection: Environment not exactly isolated test');
    process.exit(1);
  }

  const batchSize = config.batchSize || 10;
  if (batchSize < 1 || batchSize > 100) {
    console.error('Rejection: Invalid batch size');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.includes('rentipid_test_soc') || !(dbUrl.includes('@127.0.0.1:') || dbUrl.includes('@localhost:'))) {
    console.error('Rejection: Unsafe database identity');
    process.exit(1);
  }

  if (!config.acknowledgePlaintextPreserved) {
    console.error('Rejection: Missing plaintext-preservation acknowledgement');
    process.exit(1);
  }

  const gitHeadProc = execSync('git rev-parse HEAD');
  const gitHead = gitHeadProc.toString().trim();

  const tokenInput = `phase=5f-d-b2\nenvironment=isolated-test\nbatch-size=${batchSize}\nplaintext-preserved=true\ncurrent-git-head=${gitHead}`;
  const expectedToken = 'RENTIPID_B2_' + createHash('sha256').update(tokenInput).digest('hex');

  if (!config.confirmationToken) {
    console.log('Expected confirmation token:', expectedToken);
    console.log('Safe configuration summary: isolated-test, batch size', batchSize);
    process.exit(0);
  }

  if (config.confirmationToken !== expectedToken) {
    console.error('Rejection: Invalid confirmation token');
    process.exit(1);
  }

  if (!config.apply) {
    console.error('Rejection: Missing --apply');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const lockPrisma = new PrismaClient();
  const writer = new ProfileBackfillWriter(prisma, lockPrisma);
  const scanner = new ProfileBackfillDryRun(prisma);

  const lockRes = await writer.acquireLock();
  if (lockRes !== 'LOCK_ACQUIRED') {
    console.error('Rejection: Lock already held');
    process.exit(1);
  }

    try {
    writer.pinKeyVersion();
    // Initial Dry Run
    const preRun = await scanner.scan(batchSize);
    
    if (preRun.counters.dualMismatch > 0 || preRun.counters.invalidCiphertext > 0 || preRun.counters.invalidLegacy > 0 || preRun.counters.unsupportedState > 0) {
      console.warn('Warning: pre-run dry run detected quarantined synthetic records');
    }

    const agg: ProfileBackfillAggregateWriteResult = {
      runState: ProfileBackfillRunState.RUNNING,
      profilesUnchanged: 0,
      profilesBackfilled: 0,
      profilesQuarantined: 0,
      profilesConcurrentlyChanged: 0,
      profilesFailed: 0,
      fieldsBackfilled: 0,
      fieldsSkippedConcurrentChange: 0,
      fieldsFailedRetryable: 0,
      fieldsFailedFinal: 0,
    };

    let lastUserId: string | undefined;
    while (true) {
      const users = await prisma.userProfile.findMany({
        take: batchSize,
        skip: lastUserId ? 1 : 0,
        cursor: lastUserId ? { id: lastUserId } : undefined,
        orderBy: { id: 'asc' },
        select: { id: true }
      });
      if (users.length === 0) break;
      for (const u of users) {
        const out = await writer.processUserProfile(u.id);
        if (out === ProfileBackfillRecordOutcome.BACKFILLED) { agg.profilesBackfilled++; agg.fieldsBackfilled++; }
        else if (out === ProfileBackfillRecordOutcome.NOT_REQUIRED || out === ProfileBackfillRecordOutcome.ALREADY_COMPLIANT) agg.profilesUnchanged++;
        else if (out.startsWith('QUARANTINE')) agg.profilesQuarantined++;
        else if (out === ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE) { agg.profilesConcurrentlyChanged++; agg.fieldsSkippedConcurrentChange++; }
      }
      lastUserId = users[users.length - 1].id;
    }

    let lastBusinessId: string | undefined;
    while (true) {
      const businesses = await prisma.businessProfile.findMany({
        take: batchSize,
        skip: lastBusinessId ? 1 : 0,
        cursor: lastBusinessId ? { id: lastBusinessId } : undefined,
        orderBy: { id: 'asc' },
        select: { id: true }
      });
      if (businesses.length === 0) break;
      for (const b of businesses) {
        const out = await writer.processBusinessProfile(b.id);
        if (out === ProfileBackfillRecordOutcome.BACKFILLED) { agg.profilesBackfilled++; agg.fieldsBackfilled++; /* simplification: counts as 1 for basic reconciliation */ }
        else if (out === ProfileBackfillRecordOutcome.NOT_REQUIRED || out === ProfileBackfillRecordOutcome.ALREADY_COMPLIANT) agg.profilesUnchanged++;
        else if (out.startsWith('QUARANTINE')) agg.profilesQuarantined++;
        else if (out === ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE) { agg.profilesConcurrentlyChanged++; agg.fieldsSkippedConcurrentChange++; }
      }
      lastBusinessId = businesses[businesses.length - 1].id;
    }

    // Post Run Dry Run
    
    
    agg.runState = ProfileBackfillRunState.COMPLETED;
    console.log(JSON.stringify(agg));

    success = true;
  } catch (e: Error | unknown) {
    console.error('Run failed:', e.message);
    process.exit(1);
  } finally {
    await writer.releaseLock();
    await prisma.$disconnect();
    await lockPrisma.$disconnect();
  }
}

run();



