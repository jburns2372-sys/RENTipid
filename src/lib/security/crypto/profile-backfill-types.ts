export enum ProfileBackfillField {
  USER_ADDRESS = 'USER_ADDRESS',
  BUSINESS_ADDRESS = 'BUSINESS_ADDRESS',
  BUSINESS_REGISTRATION_NUMBER = 'BUSINESS_REGISTRATION_NUMBER',
}

export enum ProfileBackfillState {
  ABSENT = 'ABSENT',
  LEGACY_ONLY = 'LEGACY_ONLY',
  ENCRYPTED_ONLY = 'ENCRYPTED_ONLY',
  DUAL_MATCH = 'DUAL_MATCH',
  DUAL_MISMATCH = 'DUAL_MISMATCH',
  INVALID_CIPHERTEXT = 'INVALID_CIPHERTEXT',
  INVALID_LEGACY_VALUE = 'INVALID_LEGACY_VALUE',
  UNSUPPORTED_STATE = 'UNSUPPORTED_STATE',
}

export enum ProfileBackfillRunState {
  PLANNED = 'PLANNED',
  APPROVED_FOR_ISOLATED_TEST = 'APPROVED_FOR_ISOLATED_TEST',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  COMPLETED_WITH_QUARANTINE = 'COMPLETED_WITH_QUARANTINE',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum ProfileBackfillRecordOutcome {
  BACKFILLED = 'BACKFILLED',
  ALREADY_COMPLIANT = 'ALREADY_COMPLIANT',
  NOT_REQUIRED = 'NOT_REQUIRED',
  SKIPPED_CONCURRENT_CHANGE = 'SKIPPED_CONCURRENT_CHANGE',
  QUARANTINED_DUAL_MISMATCH = 'QUARANTINED_DUAL_MISMATCH',
  QUARANTINED_INVALID_CIPHERTEXT = 'QUARANTINED_INVALID_CIPHERTEXT',
  QUARANTINED_INVALID_LEGACY = 'QUARANTINED_INVALID_LEGACY',
  QUARANTINED_UNSUPPORTED = 'QUARANTINED_UNSUPPORTED',
  FAILED_RETRYABLE = 'FAILED_RETRYABLE',
  FAILED_FINAL = 'FAILED_FINAL'
}

export enum ProfileBackfillLockOutcome {
  LOCK_ACQUIRED = 'LOCK_ACQUIRED',
  LOCK_ALREADY_HELD = 'LOCK_ALREADY_HELD',
  LOCK_RELEASED = 'LOCK_RELEASED',
  LOCK_RELEASE_FAILED = 'LOCK_RELEASE_FAILED'
}

export interface ProfileBackfillKeyPinMetadata {
  keyPurpose: string;
  isPinned: boolean;
  hasChangedDuringRun: boolean;
  version?: string;
}

export interface ProfileBackfillStructuredWriteResult {
  outcome: ProfileBackfillRecordOutcome;
  profileType: 'User' | 'Business';
  fieldsEligible: number;
  fieldsBackfilled: number;
  fieldsAlreadyCompliant: number;
  fieldsNotRequired: number;
  fieldsQuarantined: number;
  fieldsConcurrent: number;
}

export interface ProfileBackfillAggregateWriteResult {
  runState: ProfileBackfillRunState;
  profilesUnchanged: number;
  profilesBackfilled: number;
  profilesQuarantined: number;
  profilesConcurrentlyChanged: number;
  profilesFailed: number;

  fieldsBackfilled: number;
  fieldsSkippedConcurrentChange: number;
  fieldsFailedRetryable: number;
  fieldsFailedFinal: number;
}

export interface ProfileBackfillFieldResult {
  field: ProfileBackfillField;
  state: ProfileBackfillState;
  reasonCode: string | null;
  isEligible: boolean;
  isQuarantined: boolean;
  isCompliant: boolean;
}

export interface ProfileBackfillEntityResult {
  entityHash: string;
  fields: ProfileBackfillFieldResult[];
}

export interface ProfileBackfillCounters {
  totalProfilesScanned: number;
  totalFieldsScanned: number;
  totalEligible: number;
  totalQuarantined: number;
  totalAlreadyCompliant: number;
  totalFailed: number;

  absent: number;
  legacyOnly: number;
  encryptedOnly: number;
  dualMatch: number;
  dualMismatch: number;
  invalidCiphertext: number;
  invalidLegacy: number;
  unsupportedState: number;

  batchesProcessed: number;
}

export interface ProfileBackfillConfig {
  batchSize: number;
}

export interface ProfileBackfillCommandConfig extends ProfileBackfillConfig {
  apply: boolean;
  environment: string;
  acknowledgePlaintextPreserved: boolean;
  confirmationToken: string;
  syntheticPrefix?: string;
}

export interface ProfileBackfillReport {
  startTimestamp: string;
  completionTimestamp: string;
  config: ProfileBackfillConfig;
  counters: ProfileBackfillCounters;
  pinnedKeyVersion?: string;
  writeAggregate?: ProfileBackfillAggregateWriteResult;
}

export interface ProfileBackfillCheckpoint {
  lastUserId?: string;
  lastBusinessId?: string;
  batchesCompleted: number;
}
