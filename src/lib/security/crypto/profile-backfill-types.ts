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

export interface ProfileBackfillReport {
  startTimestamp: string;
  completionTimestamp: string;
  config: ProfileBackfillConfig;
  counters: ProfileBackfillCounters;
  pinnedKeyVersion?: string;
}
