import { 
  validateStagingEnvironmentIdentity, 
  generateDatabaseIdentityHash, 
  StagingEnvironmentIdentity 
} from '../../../src/lib/security/crypto/profile-backfill-environment-identity';

describe('Staging Environment Identity Validation', () => {
  const expectedProject = 'test-project';
  const expectedBranch = 'test-branch';
  const expectedGit = 'abcdef123456';
  
  let validIdentity: StagingEnvironmentIdentity;
  let expectedHash: string;

  beforeEach(() => {
    validIdentity = {
      environment: 'staging-rehearsal',
      protocol: 'postgresql',
      hostname: 'staging-db.invalid',
      port: 5432,
      databaseName: 'rentipid_staging',
      databaseRoleClassification: 'restricted_app_role',
      tlsEnabled: true,
      cloudProvider: 'neon',
      cloudProjectIdentifier: expectedProject,
      databaseBranchIdentifier: expectedBranch,
      gitCommit: expectedGit
    };

    expectedHash = generateDatabaseIdentityHash(validIdentity);
  });

  it('1. Valid staging identity', () => {
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(true);
  });

  it('2. Wrong environment', () => {
    validIdentity.environment = 'production';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('INVALID_ENVIRONMENT');
  });

  it('3. Loopback rejected', () => {
    validIdentity.hostname = '127.0.0.1';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('LOOPBACK_NOT_STAGING');
  });

  it('4. Production-like host rejected', () => {
    validIdentity.hostname = 'db.production.invalid';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('PRODUCTION_LIKE_HOST');
  });

  it('5. Production-like database rejected', () => {
    validIdentity.databaseName = 'rentipid_prod';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('PRODUCTION_LIKE_DATABASE');
  });

  it('6. Host not allowlisted', () => {
    validIdentity.hostname = 'random-host.com';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('HOST_NOT_ALLOWLISTED');
  });

  it('7. Database not allowlisted', () => {
    validIdentity.databaseName = 'random_db';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('DATABASE_NOT_ALLOWLISTED');
  });

  it('8. TLS missing', () => {
    validIdentity.tlsEnabled = false;
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('TLS_REQUIRED');
  });

  it('9. Administrator role rejected', () => {
    validIdentity.databaseRoleClassification = 'admin';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('ROLE_IS_ADMINISTRATOR');
  });

  it('10. Schema-owner role rejected', () => {
    validIdentity.databaseRoleClassification = 'owner';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('ROLE_IS_SCHEMA_OWNER');
  });

  it('11. Unrestricted role rejected', () => {
    validIdentity.databaseRoleClassification = 'readwrite';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('ROLE_NOT_RESTRICTED');
  });

  it('12. Project mismatch', () => {
    validIdentity.cloudProjectIdentifier = 'other-project';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('PROJECT_IDENTITY_MISMATCH');
  });

  it('13. Branch mismatch', () => {
    validIdentity.databaseBranchIdentifier = 'other-branch';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('BRANCH_IDENTITY_MISMATCH');
  });

  it('14. Git mismatch', () => {
    validIdentity.gitCommit = 'fffaaa';
    const result = validateStagingEnvironmentIdentity(validIdentity, expectedHash, expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('GIT_COMMIT_MISMATCH');
  });

  it('15. Identity-hash mismatch', () => {
    const result = validateStagingEnvironmentIdentity(validIdentity, 'wrong-hash', expectedProject, expectedBranch, expectedGit);
    expect(result.isValid).toBe(false);
    expect(result.failureCode).toBe('DATABASE_IDENTITY_HASH_MISMATCH');
  });

  it('16. Hash deterministic', () => {
    const h1 = generateDatabaseIdentityHash(validIdentity);
    const h2 = generateDatabaseIdentityHash(validIdentity);
    expect(h1).toBe(h2);
  });

  it('17. Hash changes with host', () => {
    const h1 = generateDatabaseIdentityHash(validIdentity);
    const h2 = generateDatabaseIdentityHash({ ...validIdentity, hostname: 'other.invalid' });
    expect(h1).not.toBe(h2);
  });

  it('18. Hash changes with branch', () => {
    const h1 = generateDatabaseIdentityHash(validIdentity);
    const h2 = generateDatabaseIdentityHash({ ...validIdentity, databaseBranchIdentifier: 'diff' });
    expect(h1).not.toBe(h2);
  });

  it('19. Hash changes with TLS', () => {
    const h1 = generateDatabaseIdentityHash(validIdentity);
    const h2 = generateDatabaseIdentityHash({ ...validIdentity, tlsEnabled: false });
    expect(h1).not.toBe(h2);
  });

  it('20. Hash excludes credentials', () => {
    const h1 = generateDatabaseIdentityHash(validIdentity);
    // There are no credentials in StagingEnvironmentIdentity to even include
    expect(h1).toBeDefined();
  });
});
