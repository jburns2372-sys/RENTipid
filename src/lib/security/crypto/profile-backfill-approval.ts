export interface ProfileBackfillApprovalArtifact {
  approvalVersion: string;
  approvalId: string;
  environment: string;
  databaseIdentityHash: string;
  gitCommit: string;
  approvedFields: string[];
  syntheticPrefix: string;
  maximumBatchSize: number;
  maximumProfiles: number;
  issuedAt: string;
  expiresAt: string;
  approverRoles: string[];
  plaintextPreservationApproved: boolean;
  noRealDataApproved: boolean;
  status: string;
}

export type ApprovalFailureCode =
  | 'UNSUPPORTED_VERSION'
  | 'MISSING_APPROVAL_ID'
  | 'STATUS_NOT_APPROVED'
  | 'WRONG_ENVIRONMENT'
  | 'EXPIRED_APPROVAL'
  | 'FUTURE_ISSUED_APPROVAL'
  | 'DATABASE_HASH_MISMATCH'
  | 'GIT_COMMIT_MISMATCH'
  | 'INVALID_FIELD_SET'
  | 'EXTRA_PROTECTED_FIELD'
  | 'INVALID_PREFIX'
  | 'BATCH_EXCEEDS_APPROVAL'
  | 'PROFILES_EXCEED_APPROVAL'
  | 'PLAINTEXT_APPROVAL_MISSING'
  | 'NO_REAL_DATA_APPROVAL_MISSING'
  | 'SECURITY_OWNER_MISSING'
  | 'PLATFORM_OWNER_MISSING'
  | 'APPLICATION_OWNER_MISSING'
  | 'DUPLICATE_APPROVER_ROLE'
  | 'AUTHENTICITY_VERIFICATION_FAILURE';

export interface ApprovalValidationResult {
  isValid: boolean;
  failureCode?: ApprovalFailureCode;
}

export interface ApprovalAuthenticityVerifier {
  verify(approval: ProfileBackfillApprovalArtifact): Promise<{
    verified: boolean;
    verificationMethod: string;
    failureCode?: ApprovalFailureCode;
  }>;
}

export function validateStagingApproval(
  approval: ProfileBackfillApprovalArtifact,
  expectedDbHash: string,
  expectedGitCommit: string,
  requestedPrefix: string,
  requestedBatchSize: number,
  requestedProfiles?: number,
  clockToleranceMs = 5000,
  nowMs = Date.now()
): ApprovalValidationResult {
  if (approval.approvalVersion !== 'v1') return { isValid: false, failureCode: 'UNSUPPORTED_VERSION' };
  if (!approval.approvalId || approval.approvalId.trim() === '') return { isValid: false, failureCode: 'MISSING_APPROVAL_ID' };
  if (approval.status !== 'APPROVED') return { isValid: false, failureCode: 'STATUS_NOT_APPROVED' };
  if (approval.environment !== 'staging-rehearsal') return { isValid: false, failureCode: 'WRONG_ENVIRONMENT' };
  
  const issuedTime = new Date(approval.issuedAt).getTime();
  const expiresTime = new Date(approval.expiresAt).getTime();
  
  if (nowMs > expiresTime) return { isValid: false, failureCode: 'EXPIRED_APPROVAL' };
  if (issuedTime > nowMs + clockToleranceMs) return { isValid: false, failureCode: 'FUTURE_ISSUED_APPROVAL' };
  
  if (approval.databaseIdentityHash !== expectedDbHash) return { isValid: false, failureCode: 'DATABASE_HASH_MISMATCH' };
  if (approval.gitCommit !== expectedGitCommit) return { isValid: false, failureCode: 'GIT_COMMIT_MISMATCH' };
  
  const allowedFields = [
    'UserProfile.address_encrypted',
    'BusinessProfile.business_address_encrypted',
    'BusinessProfile.business_registration_number_encrypted'
  ];
  if (approval.approvedFields.length !== allowedFields.length) return { isValid: false, failureCode: 'INVALID_FIELD_SET' };
  for (const field of approval.approvedFields) {
    if (!allowedFields.includes(field)) return { isValid: false, failureCode: 'EXTRA_PROTECTED_FIELD' };
  }
  
  if (!approval.syntheticPrefix || !approval.syntheticPrefix.startsWith('phase5f_dc_')) return { isValid: false, failureCode: 'INVALID_PREFIX' };
  if (requestedPrefix && requestedPrefix !== approval.syntheticPrefix) return { isValid: false, failureCode: 'INVALID_PREFIX' };
  
  if (requestedBatchSize > approval.maximumBatchSize) return { isValid: false, failureCode: 'BATCH_EXCEEDS_APPROVAL' };
  if (requestedProfiles !== undefined && requestedProfiles > approval.maximumProfiles) return { isValid: false, failureCode: 'PROFILES_EXCEED_APPROVAL' };
  
  if (!approval.plaintextPreservationApproved) return { isValid: false, failureCode: 'PLAINTEXT_APPROVAL_MISSING' };
  if (!approval.noRealDataApproved) return { isValid: false, failureCode: 'NO_REAL_DATA_APPROVAL_MISSING' };
  
  const roles = approval.approverRoles;
  const uniqueRoles = new Set(roles);
  if (uniqueRoles.size !== roles.length) return { isValid: false, failureCode: 'DUPLICATE_APPROVER_ROLE' };
  
  if (!roles.includes('SECURITY_OWNER')) return { isValid: false, failureCode: 'SECURITY_OWNER_MISSING' };
  if (!roles.includes('PLATFORM_OWNER')) return { isValid: false, failureCode: 'PLATFORM_OWNER_MISSING' };
  if (!roles.includes('APPLICATION_OWNER')) return { isValid: false, failureCode: 'APPLICATION_OWNER_MISSING' };
  
  return { isValid: true };
}
