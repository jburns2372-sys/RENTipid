export enum DataClassification {
  PUBLIC = "PUBLIC",
  INTERNAL = "INTERNAL",
  CONFIDENTIAL = "CONFIDENTIAL",
  RESTRICTED_PERSONAL = "RESTRICTED_PERSONAL",
  RESTRICTED_FINANCIAL = "RESTRICTED_FINANCIAL",
  RESTRICTED_IDENTITY = "RESTRICTED_IDENTITY",
  SECURITY_SENSITIVE = "SECURITY_SENSITIVE"
}

export interface DataCategoryConfig {
  classification: DataClassification;
  allowedPurposes: string[];
  defaultExportPolicy: 'ALLOW' | 'REDACT' | 'DENY';
  defaultDeletionPolicy: 'DELETE' | 'PSEUDONYMIZE' | 'RETAIN';
  retentionPolicyId: string;
  loggingPolicy: 'FULL' | 'METADATA_ONLY' | 'OMIT';
}

export const DataClassificationRegistry: Record<string, DataCategoryConfig> = {
  ACCOUNT_IDENTITY: {
    classification: DataClassification.RESTRICTED_IDENTITY,
    allowedPurposes: ['AUTHENTICATION', 'AUTHORIZATION'],
    defaultExportPolicy: 'ALLOW',
    defaultDeletionPolicy: 'PSEUDONYMIZE',
    retentionPolicyId: 'RET-001',
    loggingPolicy: 'METADATA_ONLY'
  },
  CONTACT_INFORMATION: {
    classification: DataClassification.RESTRICTED_PERSONAL,
    allowedPurposes: ['COMMUNICATION', 'MARKETING_IF_CONSENTED'],
    defaultExportPolicy: 'ALLOW',
    defaultDeletionPolicy: 'DELETE',
    retentionPolicyId: 'RET-001',
    loggingPolicy: 'METADATA_ONLY'
  },
  PROFILE_ADDRESS: {
    classification: DataClassification.RESTRICTED_PERSONAL,
    allowedPurposes: ['DELIVERY', 'TRUST_AND_SAFETY'],
    defaultExportPolicy: 'ALLOW',
    defaultDeletionPolicy: 'DELETE',
    retentionPolicyId: 'RET-001',
    loggingPolicy: 'METADATA_ONLY'
  },
  BUSINESS_REGISTRATION: {
    classification: DataClassification.RESTRICTED_IDENTITY,
    allowedPurposes: ['KYC', 'TRUST_AND_SAFETY'],
    defaultExportPolicy: 'ALLOW',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-002',
    loggingPolicy: 'METADATA_ONLY'
  },
  KYC_AND_VERIFICATION: {
    classification: DataClassification.RESTRICTED_IDENTITY,
    allowedPurposes: ['KYC'],
    defaultExportPolicy: 'DENY',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-002',
    loggingPolicy: 'OMIT'
  },
  BOOKING_AND_AGREEMENT: {
    classification: DataClassification.CONFIDENTIAL,
    allowedPurposes: ['SERVICE_DELIVERY', 'LEGAL_COMPLIANCE'],
    defaultExportPolicy: 'ALLOW',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-003',
    loggingPolicy: 'METADATA_ONLY'
  },
  PAYMENT_AND_RECONCILIATION: {
    classification: DataClassification.RESTRICTED_FINANCIAL,
    allowedPurposes: ['PAYMENT_PROCESSING', 'ACCOUNTING'],
    defaultExportPolicy: 'REDACT',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-003',
    loggingPolicy: 'METADATA_ONLY'
  },
  DAMAGE_CLAIM: {
    classification: DataClassification.CONFIDENTIAL,
    allowedPurposes: ['DISPUTE_RESOLUTION'],
    defaultExportPolicy: 'ALLOW',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-004',
    loggingPolicy: 'METADATA_ONLY'
  },
  DISPUTE_CASE: {
    classification: DataClassification.CONFIDENTIAL,
    allowedPurposes: ['DISPUTE_RESOLUTION'],
    defaultExportPolicy: 'ALLOW',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-004',
    loggingPolicy: 'METADATA_ONLY'
  },
  INSPECTION_REPORT: {
    classification: DataClassification.CONFIDENTIAL,
    allowedPurposes: ['SERVICE_DELIVERY', 'DISPUTE_RESOLUTION'],
    defaultExportPolicy: 'ALLOW',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-004',
    loggingPolicy: 'METADATA_ONLY'
  },
  SECURITY_EVENT: {
    classification: DataClassification.SECURITY_SENSITIVE,
    allowedPurposes: ['SECURITY_MONITORING', 'INCIDENT_RESPONSE'],
    defaultExportPolicy: 'DENY',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-005',
    loggingPolicy: 'METADATA_ONLY'
  },
  AUDIT_LOG: {
    classification: DataClassification.SECURITY_SENSITIVE,
    allowedPurposes: ['COMPLIANCE_AUDIT', 'SECURITY_MONITORING'],
    defaultExportPolicy: 'DENY',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-005',
    loggingPolicy: 'METADATA_ONLY'
  },
  AI_SECURITY_METADATA: {
    classification: DataClassification.SECURITY_SENSITIVE,
    allowedPurposes: ['SECURITY_MONITORING'],
    defaultExportPolicy: 'DENY',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-005',
    loggingPolicy: 'METADATA_ONLY'
  },
  DEVICE_AND_SESSION_METADATA: {
    classification: DataClassification.SECURITY_SENSITIVE,
    allowedPurposes: ['SECURITY_MONITORING'],
    defaultExportPolicy: 'DENY',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-005',
    loggingPolicy: 'METADATA_ONLY'
  },
  SUPPORT_COMMUNICATION: {
    classification: DataClassification.CONFIDENTIAL,
    allowedPurposes: ['CUSTOMER_SUPPORT'],
    defaultExportPolicy: 'ALLOW',
    defaultDeletionPolicy: 'DELETE',
    retentionPolicyId: 'RET-006',
    loggingPolicy: 'METADATA_ONLY'
  },
  UNKNOWN: {
    classification: DataClassification.RESTRICTED_PERSONAL,
    allowedPurposes: [],
    defaultExportPolicy: 'DENY',
    defaultDeletionPolicy: 'RETAIN',
    retentionPolicyId: 'RET-UNKNOWN',
    loggingPolicy: 'OMIT'
  }
};

export function getClassificationForCategory(category: string): DataCategoryConfig {
  return DataClassificationRegistry[category] || DataClassificationRegistry['UNKNOWN'];
}
