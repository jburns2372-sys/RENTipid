import { 
  validateStagingApproval, 
  ProfileBackfillApprovalArtifact 
} from '../../../src/lib/security/crypto/profile-backfill-approval';

describe('Staging Approval Validation', () => {
  const expectedDbHash = 'db-hash-123';
  const expectedGit = 'abc123commit';
  const now = 1000000000000;

  let validApproval: ProfileBackfillApprovalArtifact;

  beforeEach(() => {
    validApproval = {
      approvalVersion: 'v1',
      approvalId: 'app-1',
      environment: 'staging-rehearsal',
      databaseIdentityHash: expectedDbHash,
      gitCommit: expectedGit,
      approvedFields: [
        'UserProfile.address_encrypted',
        'BusinessProfile.business_address_encrypted',
        'BusinessProfile.business_registration_number_encrypted'
      ],
      syntheticPrefix: 'phase5f_dc_test1',
      maximumBatchSize: 100,
      maximumProfiles: 100,
      issuedAt: new Date(now - 10000).toISOString(),
      expiresAt: new Date(now + 10000).toISOString(),
      approverRoles: ['SECURITY_OWNER', 'PLATFORM_OWNER', 'APPLICATION_OWNER'],
      plaintextPreservationApproved: true,
      noRealDataApproved: true,
      status: 'APPROVED'
    };
  });

  it('1. Valid approval', () => {
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(true);
  });

  it('2. Unsupported version', () => {
    validApproval.approvalVersion = 'v2';
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('UNSUPPORTED_VERSION');
  });

  it('3. Missing approval ID', () => {
    validApproval.approvalId = ' ';
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('MISSING_APPROVAL_ID');
  });

  it('4. Status not approved', () => {
    validApproval.status = 'PENDING';
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('STATUS_NOT_APPROVED');
  });

  it('5. Wrong environment', () => {
    validApproval.environment = 'production';
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('WRONG_ENVIRONMENT');
  });

  it('6. Expired approval', () => {
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now + 20000);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('EXPIRED_APPROVAL');
  });

  it('7. Future-issued approval', () => {
    validApproval.issuedAt = new Date(now + 20000).toISOString();
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('FUTURE_ISSUED_APPROVAL');
  });

  it('8. Database hash mismatch', () => {
    const result = validateStagingApproval(validApproval, 'wrong-hash', expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('DATABASE_HASH_MISMATCH');
  });

  it('9. Git mismatch', () => {
    const result = validateStagingApproval(validApproval, expectedDbHash, 'wrong-git', 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('GIT_COMMIT_MISMATCH');
  });

  it('10. Invalid field set', () => {
    validApproval.approvedFields = ['UserProfile.address_encrypted'];
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('INVALID_FIELD_SET');
  });

  it('11. Extra protected field', () => {
    validApproval.approvedFields.push('SomeOtherField');
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('INVALID_FIELD_SET');
  });

  it('12. Invalid prefix', () => {
    validApproval.syntheticPrefix = 'invalid_prefix_test1';
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'invalid_prefix_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('INVALID_PREFIX');
  });

  it('13. Batch exceeds approval', () => {
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 150, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('BATCH_EXCEEDS_APPROVAL');
  });

  it('14. Profiles exceed approval', () => {
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, 150, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('PROFILES_EXCEED_APPROVAL');
  });

  it('15. Plaintext approval missing', () => {
    validApproval.plaintextPreservationApproved = false;
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('PLAINTEXT_APPROVAL_MISSING');
  });

  it('16. No-real-data approval missing', () => {
    validApproval.noRealDataApproved = false;
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('NO_REAL_DATA_APPROVAL_MISSING');
  });

  it('17. Security owner missing', () => {
    validApproval.approverRoles = ['PLATFORM_OWNER', 'APPLICATION_OWNER'];
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('SECURITY_OWNER_MISSING');
  });

  it('18. Platform owner missing', () => {
    validApproval.approverRoles = ['SECURITY_OWNER', 'APPLICATION_OWNER'];
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('PLATFORM_OWNER_MISSING');
  });

  it('19. Application owner missing', () => {
    validApproval.approverRoles = ['SECURITY_OWNER', 'PLATFORM_OWNER'];
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('APPLICATION_OWNER_MISSING');
  });

  it('20. Duplicate approver role', () => {
    validApproval.approverRoles = ['SECURITY_OWNER', 'PLATFORM_OWNER', 'APPLICATION_OWNER', 'SECURITY_OWNER'];
    const result = validateStagingApproval(validApproval, expectedDbHash, expectedGit, 'phase5f_dc_test1', 10, undefined, 5000, now);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('DUPLICATE_APPROVER_ROLE');
  });

});
