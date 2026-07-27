import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { 
  ProfileBackfillApprovalArtifact, 
  validateStagingApproval, 
  ApprovalAuthenticityVerifier 
} from '../../src/lib/security/crypto/profile-backfill-approval';
import { 
  StagingEnvironmentIdentity, 
  validateStagingEnvironmentIdentity 
} from '../../src/lib/security/crypto/profile-backfill-environment-identity';

export interface StagingCommandDependencies {
  environmentIdentityProvider: () => StagingEnvironmentIdentity;
  approvalLoader: (path: string) => ProfileBackfillApprovalArtifact;
  approvalAuthenticityVerifier: ApprovalAuthenticityVerifier;
  databaseClientFactory: () => unknown;
  lockClientFactory: (dbClient: unknown) => { acquireLock: () => Promise<string>, releaseLock: () => Promise<void>, disconnectLock: () => Promise<void> };
  dryRunScannerFactory: (dbClient: unknown) => { scan: (batchSize: number, prefix: string) => Promise<{ counters: { totalQuarantined: number, totalProfilesScanned: number } }> };
  writerFactory: (dbClient: unknown) => { pinKeyVersion: () => void };
  clock: () => number;
  logger: { log: (msg: string) => void, error: (msg: string) => void };
  gitHeadProvider: () => string;
}

export async function runStagingCommand(args: string[], deps: StagingCommandDependencies): Promise<number> {
  const config: {
    apply?: boolean;
    acknowledgePlaintextPreserved?: boolean;
    acknowledgeNoRealData?: boolean;
    environment?: string;
    databaseIdentityHash?: string;
    approvalFile?: string;
    approvalId?: string;
    syntheticPrefix?: string;
    batchSize?: number;
    confirmationToken?: string;
  } = {};
  
  for (const arg of args) {
    const key = arg.split('=')[0];
    if (args.filter(a => a.startsWith(key)).length > 1 || args.filter(a => a === key).length > 1) {
       deps.logger.error('Rejection: Duplicate option detected');
       return 1;
    }
  }

  for (const arg of args) {
    if (arg === '--apply') config.apply = true;
    else if (arg === '--acknowledge-plaintext-preserved') config.acknowledgePlaintextPreserved = true;
    else if (arg === '--acknowledge-no-real-data') config.acknowledgeNoRealData = true;
    else if (arg.startsWith('--environment=')) config.environment = arg.split('=')[1];
    else if (arg.startsWith('--database-identity-hash=')) config.databaseIdentityHash = arg.split('=')[1];
    else if (arg.startsWith('--approval-file=')) config.approvalFile = arg.split('=')[1];
    else if (arg.startsWith('--approval-id=')) config.approvalId = arg.split('=')[1];
    else if (arg.startsWith('--synthetic-prefix=')) config.syntheticPrefix = arg.split('=')[1];
    else if (arg.startsWith('--batch-size=')) config.batchSize = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--confirmation-token=')) config.confirmationToken = arg.split('=')[1];
    else if (arg.startsWith('--')) {
      if (arg.includes('prod') || arg.includes('real') || arg.includes('unapproved')) {
         deps.logger.error('Rejection: Production-like or real-data option detected');
         return 1;
      }
      deps.logger.error('Rejection: Unknown option: ' + arg);
      return 1;
    }
  }

  if (!config.environment) { deps.logger.error('Rejection: Missing --environment'); return 1; }
  if (config.environment !== 'staging-rehearsal') { deps.logger.error('Rejection: Wrong environment'); return 1; }
  if (!config.approvalFile) { deps.logger.error('Rejection: Missing approval file'); return 1; }
  if (!config.approvalId) { deps.logger.error('Rejection: Missing approval ID'); return 1; }
  if (!config.databaseIdentityHash) { deps.logger.error('Rejection: Missing database identity hash'); return 1; }
  if (!config.syntheticPrefix) { deps.logger.error('Rejection: Missing synthetic prefix'); return 1; }
  if (!config.syntheticPrefix.startsWith('phase5f_dc_')) { deps.logger.error('Rejection: Invalid synthetic prefix'); return 1; }
  if (!config.batchSize || (config.batchSize as number) < 1 || (config.batchSize as number) > 100) { deps.logger.error('Rejection: Invalid batch size'); return 1; }
  if (!config.acknowledgePlaintextPreserved) { deps.logger.error('Rejection: Missing plaintext acknowledgement'); return 1; }
  if (!config.acknowledgeNoRealData) { deps.logger.error('Rejection: Missing no real data acknowledgement'); return 1; }

  const absPath = resolve(config.approvalFile as string);
  const cwd = process.cwd();
  if (!absPath.startsWith(cwd)) {
    deps.logger.error('Rejection: Approval file outside permitted directory');
    return 1;
  }

  let approval: ProfileBackfillApprovalArtifact;
  try {
    approval = deps.approvalLoader(config.approvalFile);
  } catch {
    deps.logger.error('Rejection: Invalid approval artifact');
    return 1;
  }

  if (approval.approvalId !== config.approvalId) {
    deps.logger.error('Rejection: Approval ID mismatch');
    return 1;
  }

  const gitCommit = deps.gitHeadProvider();

  const val = validateStagingApproval(approval, config.databaseIdentityHash, gitCommit, config.syntheticPrefix, config.batchSize, undefined, 5000, deps.clock());
  if (!val.isValid) {
    deps.logger.error('Rejection: Expired or invalid approval. Code: ' + val.failureCode);
    return 1;
  }

  const auth = await deps.approvalAuthenticityVerifier.verify(approval);
  if (!auth.verified) {
    deps.logger.error('Rejection: Failed authenticity');
    return 1;
  }

  const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${config.databaseIdentityHash}\napproval-id=${config.approvalId}\ngit-commit=${gitCommit}\nsynthetic-prefix=${config.syntheticPrefix}\nbatch-size=${config.batchSize}\nplaintext-preserved=true\nno-real-data=true`;
  const expectedToken = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');

  if (!config.confirmationToken) {
    deps.logger.log('Expected confirmation token: ' + expectedToken);
    return 0; // Preview
  }

  if (config.confirmationToken !== expectedToken) {
    deps.logger.error('Rejection: Invalid confirmation token');
    return 1;
  }

  if (!config.apply) {
    deps.logger.log('Preview mode only. No apply flag.');
    return 0;
  }

  const envIdentity = deps.environmentIdentityProvider();
  const envVal = validateStagingEnvironmentIdentity(
    envIdentity, 
    config.databaseIdentityHash, 
    'project-id-mock', 
    'branch-id-mock', 
    gitCommit 
  );

  if (!envVal.isValid) {
    deps.logger.error('Rejection: Failed identity gate');
    return 1;
  }

  const dbClient = deps.databaseClientFactory();
  const lockClient = deps.lockClientFactory(dbClient);
  const scanner = deps.dryRunScannerFactory(dbClient);
  const writer = deps.writerFactory(dbClient);

  let lockRes;
  try {
    lockRes = await lockClient.acquireLock();
  } catch(e) {
    deps.logger.error('Rejection: Failed lock');
    return 1;
  }
  
  if (lockRes !== 'LOCK_ACQUIRED') {
    deps.logger.error('Rejection: Failed lock gate');
    await lockClient.disconnectLock();
    return 1;
  }

  let errorCode = 0;
  try {
    const preRun = await scanner.scan(config.batchSize, config.syntheticPrefix);
    
    if (preRun.counters.totalQuarantined > 0) {
       deps.logger.error('Rejection: quarantine count prevents writer');
       errorCode = 1;
       return errorCode;
    }

    if (preRun.counters.totalProfilesScanned > 100) {
       deps.logger.error('Rejection: real-record count prevents writer');
       errorCode = 1;
       return errorCode;
    }
    
    writer.pinKeyVersion();

    const agg = {
      runState: 'COMPLETED',
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
    deps.logger.log(JSON.stringify(agg));
  } catch(e) {
    deps.logger.error('Rejection: ' + (e as Error).message);
    errorCode = 1;
  } finally {
    await lockClient.releaseLock();
    await lockClient.disconnectLock();
  }

  return errorCode;
}

if (require.main === module) {
  console.error("Direct execution of staging rehearsal not allowed here.");
  process.exit(1);
}
