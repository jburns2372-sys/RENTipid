import { createHash } from 'crypto';

export type EnvironmentIdentityFailureCode =
  | 'INVALID_ENVIRONMENT'
  | 'LOOPBACK_NOT_STAGING'
  | 'PRODUCTION_LIKE_HOST'
  | 'PRODUCTION_LIKE_DATABASE'
  | 'HOST_NOT_ALLOWLISTED'
  | 'DATABASE_NOT_ALLOWLISTED'
  | 'TLS_REQUIRED'
  | 'ROLE_NOT_RESTRICTED'
  | 'ROLE_IS_ADMINISTRATOR'
  | 'ROLE_IS_SCHEMA_OWNER'
  | 'PROJECT_IDENTITY_MISMATCH'
  | 'BRANCH_IDENTITY_MISMATCH'
  | 'GIT_COMMIT_MISMATCH'
  | 'DATABASE_IDENTITY_HASH_MISMATCH'
  | 'AMBIGUOUS_IDENTITY';

export interface StagingEnvironmentIdentity {
  environment: string;
  protocol: string;
  hostname: string;
  port: number;
  databaseName: string;
  databaseRoleClassification: string;
  tlsEnabled: boolean;
  cloudProvider: string;
  cloudProjectIdentifier: string;
  databaseBranchIdentifier: string;
  gitCommit: string;
  databaseIdentityHash?: string;
}

export interface StagingEnvironmentValidationResult {
  isValid: boolean;
  failureCode?: EnvironmentIdentityFailureCode;
}

export interface DatabaseIdentityComponents {
  environment: string;
  protocol: string;
  hostname: string;
  port: number;
  databaseName: string;
  cloudProvider: string;
  cloudProjectIdentifier: string;
  databaseBranchIdentifier: string;
  databaseRoleClassification: string;
  tlsEnabled: boolean;
}

export interface DatabaseIdentityHash {
  hash: string;
}

export function generateDatabaseIdentityHash(components: DatabaseIdentityComponents): string {
  const normalizedHost = components.hostname.toLowerCase().trim();
  const port = components.port || 5432;
  const input = `rentipid-db-identity-v1|${components.environment}|${components.protocol}|${normalizedHost}|${port}|${components.databaseName}|${components.cloudProvider}|${components.cloudProjectIdentifier}|${components.databaseBranchIdentifier}|${components.databaseRoleClassification}|${components.tlsEnabled}`;
  return createHash('sha256').update(input).digest('hex');
}

export function validateStagingEnvironmentIdentity(
  identity: StagingEnvironmentIdentity,
  expectedApprovalHash: string,
  expectedApprovalProject: string,
  expectedApprovalBranch: string,
  expectedApprovalGit: string
): StagingEnvironmentValidationResult {
  if (identity.environment !== 'staging-rehearsal') {
    return { isValid: false, failureCode: 'INVALID_ENVIRONMENT' };
  }
  if (identity.cloudProvider !== 'LOCAL_DOCKER_POSTGRESQL') {
    if (!identity.tlsEnabled) {
      return { isValid: false, failureCode: 'TLS_REQUIRED' };
    }
    if (identity.hostname === 'localhost' || identity.hostname === '127.0.0.1' || identity.hostname === '::1') {
      return { isValid: false, failureCode: 'LOOPBACK_NOT_STAGING' };
    }
  }
  if (identity.hostname.includes('prod') || identity.hostname.includes('production')) {
    return { isValid: false, failureCode: 'PRODUCTION_LIKE_HOST' };
  }
  if (identity.databaseName.includes('prod') || identity.databaseName.includes('production')) {
    return { isValid: false, failureCode: 'PRODUCTION_LIKE_DATABASE' };
  }
  
  if (identity.cloudProvider !== 'LOCAL_DOCKER_POSTGRESQL') {
    const allowlistedHosts = ['staging-db.invalid', 'neon-staging.invalid', 'azure-staging.invalid'];
    if (!allowlistedHosts.includes(identity.hostname)) {
      return { isValid: false, failureCode: 'HOST_NOT_ALLOWLISTED' };
    }
  }
  const allowlistedDbs = ['rentipid_staging', 'rentipid_rehearsal', 'rentipid_synthetic', 'rentipid_phase5f_final'];
  if (!allowlistedDbs.includes(identity.databaseName)) {
    return { isValid: false, failureCode: 'DATABASE_NOT_ALLOWLISTED' };
  }

  if (identity.databaseRoleClassification === 'owner') return { isValid: false, failureCode: 'ROLE_IS_SCHEMA_OWNER' };
  if (identity.databaseRoleClassification === 'admin' || identity.databaseRoleClassification === 'superuser') return { isValid: false, failureCode: 'ROLE_IS_ADMINISTRATOR' };
  
  if (identity.databaseRoleClassification !== 'restricted_app_role' && identity.databaseRoleClassification !== 'restricted' && identity.databaseRoleClassification !== 'isolated-staging') {
    return { isValid: false, failureCode: 'ROLE_NOT_RESTRICTED' };
  }
  if (!identity.cloudProjectIdentifier || identity.cloudProjectIdentifier !== expectedApprovalProject) {
    return { isValid: false, failureCode: 'PROJECT_IDENTITY_MISMATCH' };
  }
  if (!identity.databaseBranchIdentifier || identity.databaseBranchIdentifier !== expectedApprovalBranch) {
    return { isValid: false, failureCode: 'BRANCH_IDENTITY_MISMATCH' };
  }
  if (!identity.gitCommit || identity.gitCommit !== expectedApprovalGit) {
    return { isValid: false, failureCode: 'GIT_COMMIT_MISMATCH' };
  }

  const generatedHash = generateDatabaseIdentityHash({
    environment: identity.environment,
    protocol: identity.protocol,
    hostname: identity.hostname,
    port: identity.port,
    databaseName: identity.databaseName,
    cloudProvider: identity.cloudProvider,
    cloudProjectIdentifier: identity.cloudProjectIdentifier,
    databaseBranchIdentifier: identity.databaseBranchIdentifier,
    databaseRoleClassification: identity.databaseRoleClassification,
    tlsEnabled: identity.tlsEnabled
  });

  if (generatedHash !== expectedApprovalHash) {
    return { isValid: false, failureCode: 'DATABASE_IDENTITY_HASH_MISMATCH' };
  }

  return { isValid: true };
}
