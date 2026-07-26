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
    else if (arg.startsWith('--synthetic-prefix=')) config.syntheticPrefix = arg.split('=')[1];
    else {
      console.error('Unknown option:', arg);
      process.exitCode = 1;
      return;
    }
  }

  if (config.environment !== 'isolated-test') {
    console.error('Rejection: Environment not exactly isolated test');
    process.exitCode = 1;
    return;
  }

  const batchSize = config.batchSize || 10;
  if (batchSize < 1 || batchSize > 100) {
    console.error('Rejection: Invalid batch size');
    process.exitCode = 1;
    return;
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.includes('rentipid_test_soc') || !(dbUrl.includes('@127.0.0.1:') || dbUrl.includes('@localhost:'))) {
    console.error('Rejection: Unsafe database identity');
    process.exitCode = 1;
    return;
  }

  if (!config.acknowledgePlaintextPreserved) {
    console.error('Rejection: Missing plaintext-preservation acknowledgement');
    process.exitCode = 1;
    return;
  }

  if (!config.syntheticPrefix || !config.syntheticPrefix.startsWith('phase5f_b2_')) {
    console.error('Rejection: Invalid or missing synthetic prefix. Must start with phase5f_b2_');
    process.exitCode = 1;
    return;
  }

  const gitHeadProc = execSync('git rev-parse HEAD');
  const gitHead = gitHeadProc.toString().trim();

  const tokenInput = `phase=5f-d-b2\nenvironment=isolated-test\nbatch-size=${batchSize}\nplaintext-preserved=true\ncurrent-git-head=${gitHead}`;
  const expectedToken = 'RENTIPID_B2_' + createHash('sha256').update(tokenInput).digest('hex');

  if (!config.confirmationToken) {
    console.log('Expected confirmation token:', expectedToken);
    console.log('Safe configuration summary: isolated-test, batch size', batchSize);
    process.exitCode = 0;
    return;
  }

  if (config.confirmationToken !== expectedToken) {
    console.error('Rejection: Invalid confirmation token');
    process.exitCode = 1;
    return;
  }

  if (!config.apply) {
    console.error('Rejection: Missing --apply');
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  const writer = new ProfileBackfillWriter(prisma);
  const scanner = new ProfileBackfillDryRun(prisma);

  const lockRes = await writer.acquireLock();
  if (lockRes !== 'LOCK_ACQUIRED') {
    console.error('Rejection: Lock already held');
    await writer.disconnectLock();
    await prisma.$disconnect();
    process.exitCode = 1;
    return;
  }

  try {
    writer.pinKeyVersion();

    // Initial Dry Run
    const preRun = await scanner.scan(batchSize, config.syntheticPrefix);
    
    if (preRun.counters.totalQuarantined > 0) {
      console.error('Rejection: pre-run dry run detected quarantined synthetic records. Expected 0.');
      process.exitCode = 1;
      return;
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
        where: { id: { startsWith: config.syntheticPrefix } },
        take: batchSize,
        skip: lastUserId ? 1 : 0,
        cursor: lastUserId ? { id: lastUserId } : undefined,
        orderBy: { id: 'asc' },
        select: { id: true }
      });
      if (users.length === 0) break;
      for (const u of users) {
        const out = await writer.processUserProfile(u.id);
        if (out.outcome === ProfileBackfillRecordOutcome.BACKFILLED) { agg.profilesBackfilled++; agg.fieldsBackfilled += out.fieldsBackfilled; }
        else if (out.outcome === ProfileBackfillRecordOutcome.NOT_REQUIRED || out.outcome === ProfileBackfillRecordOutcome.ALREADY_COMPLIANT) agg.profilesUnchanged++;
        else if (out.outcome.startsWith('QUARANTINE')) agg.profilesQuarantined++;
        else if (out.outcome === ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE) { agg.profilesConcurrentlyChanged++; agg.fieldsSkippedConcurrentChange += out.fieldsConcurrent; }
      }
      lastUserId = users[users.length - 1].id;
    }

    let lastBusinessId: string | undefined;
    while (true) {
      const businesses = await prisma.businessProfile.findMany({
        where: { id: { startsWith: config.syntheticPrefix } },
        take: batchSize,
        skip: lastBusinessId ? 1 : 0,
        cursor: lastBusinessId ? { id: lastBusinessId } : undefined,
        orderBy: { id: 'asc' },
        select: { id: true }
      });
      if (businesses.length === 0) break;
      for (const b of businesses) {
        const out = await writer.processBusinessProfile(b.id);
        if (out.outcome === ProfileBackfillRecordOutcome.BACKFILLED) { agg.profilesBackfilled++; agg.fieldsBackfilled += out.fieldsBackfilled; }
        else if (out.outcome === ProfileBackfillRecordOutcome.NOT_REQUIRED || out.outcome === ProfileBackfillRecordOutcome.ALREADY_COMPLIANT) agg.profilesUnchanged++;
        else if (out.outcome.startsWith('QUARANTINE')) agg.profilesQuarantined++;
        else if (out.outcome === ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE) { agg.profilesConcurrentlyChanged++; agg.fieldsSkippedConcurrentChange += out.fieldsConcurrent; }
      }
      lastBusinessId = businesses[businesses.length - 1].id;
    }

    // Post Run Dry Run
    const postRun = await scanner.scan(batchSize, config.syntheticPrefix);
    
    // Reconciliation
    const totalPreScan = preRun.counters.absent + preRun.counters.legacyOnly + preRun.counters.encryptedOnly + preRun.counters.dualMatch + preRun.counters.dualMismatch + preRun.counters.invalidCiphertext + preRun.counters.invalidLegacy + preRun.counters.unsupportedState;
    if (totalPreScan !== preRun.counters.totalFieldsScanned) {
      throw new Error('Reconciliation Imbalance: pre-scan total fields do not match state sums');
    }

    const eligible = agg.fieldsBackfilled + agg.fieldsSkippedConcurrentChange + agg.fieldsFailedRetryable + agg.fieldsFailedFinal;
    if (eligible !== preRun.counters.legacyOnly) {
      throw new Error('Reconciliation Imbalance: eligible fields do not match legacyOnly count');
    }

    const profilesScanned = agg.profilesUnchanged + agg.profilesBackfilled + agg.profilesQuarantined + agg.profilesConcurrentlyChanged + agg.profilesFailed;
    if (profilesScanned !== preRun.counters.totalProfilesScanned) {
      throw new Error('Reconciliation Imbalance: profiles scanned do not match outcome sums');
    }

    if (postRun.counters.dualMatch !== preRun.counters.dualMatch + agg.fieldsBackfilled) {
      throw new Error('Reconciliation Imbalance: post-run dualMatch count is incorrect');
    }

    if (postRun.counters.legacyOnly !== preRun.counters.legacyOnly - agg.fieldsBackfilled - agg.fieldsSkippedConcurrentChange) {
      throw new Error('Reconciliation Imbalance: post-run legacyOnly count is incorrect');
    }
    
    agg.runState = ProfileBackfillRunState.COMPLETED;
    console.log(JSON.stringify(agg));
    process.exitCode = 0;

  } catch (e: Error | unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Run failed:', msg);
    process.exitCode = 1;
  } finally {
    await writer.releaseLock();
    await writer.disconnectLock();
    await prisma.$disconnect();
  }
}

run();
