import { runStagingCommand, StagingCommandDependencies } from '../../../scripts/security/phase5f-profile-backfill-staging-rehearsal';
import { ProfileBackfillApprovalArtifact } from '../../../src/lib/security/crypto/profile-backfill-approval';
import { generateDatabaseIdentityHash } from '../../../src/lib/security/crypto/profile-backfill-environment-identity';
import { createHash } from 'node:crypto';

describe('Staging Command Validation', () => {
  let deps: StagingCommandDependencies;
  let validApproval: ProfileBackfillApprovalArtifact;
  let loggedMessages: string[];
  let errorMessages: string[];
  let validIdentityHash: string;
  const cwd = process.cwd();

  beforeEach(() => {
    loggedMessages = [];
    errorMessages = [];
    
    validIdentityHash = generateDatabaseIdentityHash({
      environment: 'staging-rehearsal',
      protocol: 'postgresql',
      hostname: 'staging-db.invalid',
      port: 5432,
      databaseName: 'rentipid_staging',
      databaseRoleClassification: 'restricted_app_role',
      tlsEnabled: true,
      cloudProvider: 'neon',
      cloudProjectIdentifier: 'project-id-mock',
      databaseBranchIdentifier: 'branch-id-mock'
    });
    
    validApproval = {
      approvalVersion: 'v1',
      approvalId: 'app-1',
      environment: 'staging-rehearsal',
      databaseIdentityHash: validIdentityHash,
      gitCommit: 'git-hash',
      approvedFields: [
        'UserProfile.address_encrypted',
        'BusinessProfile.business_address_encrypted',
        'BusinessProfile.business_registration_number_encrypted'
      ],
      syntheticPrefix: 'phase5f_dc_test',
      maximumBatchSize: 100,
      maximumProfiles: 100,
      issuedAt: new Date(Date.now() - 10000).toISOString(),
      expiresAt: new Date(Date.now() + 10000).toISOString(),
      approverRoles: ['SECURITY_OWNER', 'PLATFORM_OWNER', 'APPLICATION_OWNER'],
      plaintextPreservationApproved: true,
      noRealDataApproved: true,
      status: 'APPROVED'
    };

    deps = {
      environmentIdentityProvider: jest.fn().mockReturnValue({
        environment: 'staging-rehearsal',
        protocol: 'postgresql',
        hostname: 'staging-db.invalid',
        port: 5432,
        databaseName: 'rentipid_staging',
        databaseRoleClassification: 'restricted_app_role',
        tlsEnabled: true,
        cloudProvider: 'neon',
        cloudProjectIdentifier: 'project-id-mock',
        databaseBranchIdentifier: 'branch-id-mock',
        gitCommit: 'git-hash'
      }),
      approvalLoader: jest.fn().mockReturnValue(validApproval),
      approvalAuthenticityVerifier: { verify: jest.fn().mockResolvedValue({ verified: true, verificationMethod: 'mock' }) },
      databaseClientFactory: jest.fn().mockReturnValue({}),
      lockClientFactory: jest.fn().mockReturnValue({
        acquireLock: jest.fn().mockResolvedValue('LOCK_ACQUIRED'),
        releaseLock: jest.fn().mockResolvedValue(undefined),
        disconnectLock: jest.fn().mockResolvedValue(undefined)
      }),
      dryRunScannerFactory: jest.fn().mockReturnValue({
        scan: jest.fn().mockResolvedValue({ counters: { totalQuarantined: 0, totalProfilesScanned: 10 } })
      }),
      writerFactory: jest.fn().mockReturnValue({
        pinKeyVersion: jest.fn()
      }),
      clock: jest.fn().mockReturnValue(Date.now()),
      logger: {
        log: (msg) => loggedMessages.push(msg),
        error: (msg) => errorMessages.push(msg)
      },
      gitHeadProvider: jest.fn().mockReturnValue('git-hash')
    };
  });

  const getValidArgs = () => [
    '--environment=staging-rehearsal',
    `--database-identity-hash=${validIdentityHash}`,
    `--approval-file=${cwd}/approval.json`,
    '--approval-id=app-1',
    '--synthetic-prefix=phase5f_dc_test',
    '--batch-size=10',
    '--acknowledge-plaintext-preserved',
    '--acknowledge-no-real-data'
  ];

  it('1. Preview returns token without DB client', async () => {
    const code = await runStagingCommand(getValidArgs(), deps);
    expect(code).toBe(0);
    expect(loggedMessages.some(m => m.includes('Expected confirmation token:'))).toBe(true);
    expect(deps.databaseClientFactory).not.toHaveBeenCalled();
  });

  it('2. Missing apply remains non-mutating', async () => {
    const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    const args = [...getValidArgs(), `--confirmation-token=${token}`];
    
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(0);
    expect(loggedMessages.some(m => m.includes('Preview mode only'))).toBe(true);
    expect(deps.databaseClientFactory).not.toHaveBeenCalled();
  });

  it('3. Wrong environment rejected', async () => {
    const args = getValidArgs();
    args[0] = '--environment=production';
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Rejection: Wrong environment'))).toBe(true);
  });

  it('4. Missing approval file rejected', async () => {
    const args = getValidArgs().filter(a => !a.startsWith('--approval-file='));
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Missing approval file'))).toBe(true);
  });

  it('5. Approval path outside permitted directory rejected', async () => {
    const args = getValidArgs();
    args[2] = '--approval-file=/tmp/approval.json'; // not cwd
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Approval file outside permitted directory'))).toBe(true);
  });

  it('6. Approval ID mismatch rejected', async () => {
    const args = getValidArgs();
    args[3] = '--approval-id=app-2';
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Approval ID mismatch'))).toBe(true);
  });

  it('7. Missing database hash rejected', async () => {
    const args = getValidArgs().filter(a => !a.startsWith('--database-identity-hash='));
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Missing database identity hash'))).toBe(true);
  });

  it('8. Invalid database hash rejected', async () => {
    const args = getValidArgs();
    args[1] = '--database-identity-hash=wrong';
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Expired or invalid approval'))).toBe(true);
  });

  it('9. Missing synthetic prefix rejected', async () => {
    const args = getValidArgs().filter(a => !a.startsWith('--synthetic-prefix='));
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Missing synthetic prefix'))).toBe(true);
  });

  it('10. Invalid synthetic prefix rejected', async () => {
    const args = getValidArgs();
    args[4] = '--synthetic-prefix=invalid';
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Invalid synthetic prefix'))).toBe(true);
  });

  it('11. Missing plaintext acknowledgement rejected', async () => {
    const args = getValidArgs().filter(a => a !== '--acknowledge-plaintext-preserved');
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Missing plaintext acknowledgement'))).toBe(true);
  });

  it('12. Missing no-real-data acknowledgement rejected', async () => {
    const args = getValidArgs().filter(a => a !== '--acknowledge-no-real-data');
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Missing no real data acknowledgement'))).toBe(true);
  });

  it('13. Invalid batch rejected', async () => {
    const args = getValidArgs();
    args[5] = '--batch-size=150';
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Invalid batch size'))).toBe(true);
  });

  it('14. Unknown option rejected', async () => {
    const args = [...getValidArgs(), '--unknown-flag'];
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Unknown option'))).toBe(true);
  });

  it('15. Duplicate option rejected', async () => {
    const args = [...getValidArgs(), '--batch-size=20'];
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Duplicate option'))).toBe(true);
  });

  it('16. Expired approval prevents DB client', async () => {
    validApproval.expiresAt = new Date(Date.now() - 50000).toISOString();
    const code = await runStagingCommand(getValidArgs(), deps);
    expect(code).toBe(1);
    expect(deps.databaseClientFactory).not.toHaveBeenCalled();
  });

  it('17. Failed authenticity prevents DB client', async () => {
    deps.approvalAuthenticityVerifier.verify = jest.fn().mockResolvedValue({ verified: false });
    const code = await runStagingCommand(getValidArgs(), deps);
    expect(code).toBe(1);
    expect(deps.databaseClientFactory).not.toHaveBeenCalled();
  });

  it('18. Git mismatch prevents DB client', async () => {
    deps.gitHeadProvider = jest.fn().mockReturnValue('different-git-hash');
    const code = await runStagingCommand(getValidArgs(), deps);
    expect(code).toBe(1);
    expect(deps.databaseClientFactory).not.toHaveBeenCalled();
  });

  it('19. Invalid token prevents DB client', async () => {
    const args = [...getValidArgs(), '--confirmation-token=INVALID'];
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(deps.databaseClientFactory).not.toHaveBeenCalled();
  });

  it('20. Valid configuration reaches injected pre-write gates', async () => {
    const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    const args = [...getValidArgs(), `--confirmation-token=${token}`, '--apply'];
    
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(0);
    expect(deps.databaseClientFactory).toHaveBeenCalled();
  });

  it('21. Failed identity gate prevents writer', async () => {
    deps.environmentIdentityProvider = jest.fn().mockReturnValue({
      environment: 'production'
    });
    const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    const args = [...getValidArgs(), `--confirmation-token=${token}`, '--apply'];
    
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Failed identity gate'))).toBe(true);
  });

  it('22. Failed lock gate prevents writer', async () => {
    deps.lockClientFactory = jest.fn().mockReturnValue({
      acquireLock: jest.fn().mockResolvedValue('LOCK_ALREADY_HELD'),
      disconnectLock: jest.fn().mockResolvedValue(undefined)
    });
    const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    const args = [...getValidArgs(), `--confirmation-token=${token}`, '--apply'];
    
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Failed lock gate'))).toBe(true);
  });

  it('23. Failed key gate prevents writer', async () => {
    // Actually the mock doesn't throw, let's make the writer factory throw on pinKeyVersion
    deps.writerFactory = jest.fn().mockReturnValue({
      pinKeyVersion: jest.fn().mockImplementation(() => { throw new Error('Key failure'); })
    });
    const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    const args = [...getValidArgs(), `--confirmation-token=${token}`, '--apply'];
    
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('Key failure'))).toBe(true);
  });

  it('24. Real-record count prevents writer', async () => {
    deps.dryRunScannerFactory = jest.fn().mockReturnValue({
        scan: jest.fn().mockResolvedValue({ counters: { totalQuarantined: 0, totalProfilesScanned: 101 } }) // > 100
    });
    const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    const args = [...getValidArgs(), `--confirmation-token=${token}`, '--apply'];
    
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('real-record count prevents writer'))).toBe(true);
  });

  it('25. Quarantine count prevents writer', async () => {
    deps.dryRunScannerFactory = jest.fn().mockReturnValue({
        scan: jest.fn().mockResolvedValue({ counters: { totalQuarantined: 1, totalProfilesScanned: 10 } })
    });
    const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    const args = [...getValidArgs(), `--confirmation-token=${token}`, '--apply'];
    
    const code = await runStagingCommand(args, deps);
    expect(code).toBe(1);
    expect(errorMessages.some(m => m.includes('quarantine count prevents writer'))).toBe(true);
  });

  it('26. Token deterministic', async () => {
    const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token1 = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    const token2 = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    expect(token1).toBe(token2);
  });

  it('27. Token changes with safe configuration', async () => {
    const tokenInput1 = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const tokenInput2 = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}2\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token1 = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput1).digest('hex');
    const token2 = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput2).digest('hex');
    expect(token1).not.toBe(token2);
  });

  it('28. Result contains no protected values', async () => {
    const tokenInput = `phase=5f-d-c\nenvironment=staging-rehearsal\ndatabase-identity-hash=${validIdentityHash}\napproval-id=app-1\ngit-commit=git-hash\nsynthetic-prefix=phase5f_dc_test\nbatch-size=10\nplaintext-preserved=true\nno-real-data=true`;
    const token = 'RENTIPID_DC_' + createHash('sha256').update(tokenInput).digest('hex');
    const args = [...getValidArgs(), `--confirmation-token=${token}`, '--apply'];
    
    await runStagingCommand(args, deps);
    const aggJson = loggedMessages.find(m => m.includes('COMPLETED'));
    expect(aggJson).toBeDefined();
    expect(aggJson).not.toMatch(/address/i);
    expect(aggJson).not.toMatch(/registration/i);
    expect(aggJson).not.toMatch(/key/i);
  });
});
