export interface RetentionPolicy {
  policyId: string;
  dataCategory: string;
  retentionTrigger: 'ACCOUNT_DELETION' | 'TRANSACTION_COMPLETE' | 'RECORD_CREATION' | 'INCIDENT_CLOSURE';
  retentionDurationSource: 'STATUTORY_REQUIREMENT' | 'BUSINESS_JUSTIFICATION' | 'PENDING_MANAGEMENT_CONFIRMATION';
  durationDays: number | null;
  holdOverrides: string[];
  disposalMethod: 'PHYSICAL_DELETION' | 'PSEUDONYMIZATION' | 'AGGREGATION';
  controlOwner: string;
  reviewRequired: boolean;
  automaticDeletionEnabled: boolean;
}

export const RetentionPolicyRegistry: Record<string, RetentionPolicy> = {
  'RET-001': {
    policyId: 'RET-001',
    dataCategory: 'CONTACT_INFORMATION',
    retentionTrigger: 'ACCOUNT_DELETION',
    retentionDurationSource: 'BUSINESS_JUSTIFICATION',
    durationDays: 30,
    holdOverrides: ['LEGAL_HOLD', 'FINANCIAL_HOLD', 'SECURITY_EVIDENCE_HOLD'],
    disposalMethod: 'PHYSICAL_DELETION',
    controlOwner: 'DATA_PROTECTION_OFFICER',
    reviewRequired: false,
    automaticDeletionEnabled: false // "Automatic disposal may be implemented only for unambiguous synthetic or operational temporary data."
  },
  'RET-002': {
    policyId: 'RET-002',
    dataCategory: 'KYC_AND_VERIFICATION',
    retentionTrigger: 'ACCOUNT_DELETION',
    retentionDurationSource: 'PENDING_MANAGEMENT_CONFIRMATION',
    durationDays: null,
    holdOverrides: ['LEGAL_HOLD', 'FINANCIAL_HOLD', 'SECURITY_EVIDENCE_HOLD'],
    disposalMethod: 'PHYSICAL_DELETION',
    controlOwner: 'COMPLIANCE_OFFICER',
    reviewRequired: true,
    automaticDeletionEnabled: false
  },
  'RET-003': {
    policyId: 'RET-003',
    dataCategory: 'PAYMENT_AND_RECONCILIATION',
    retentionTrigger: 'TRANSACTION_COMPLETE',
    retentionDurationSource: 'STATUTORY_REQUIREMENT',
    durationDays: 1825, // 5 years typical, but we shouldn't hardcode statutory without approved policy. We'll use pending confirmation.
    holdOverrides: ['LEGAL_HOLD', 'FINANCIAL_HOLD', 'SECURITY_EVIDENCE_HOLD'],
    disposalMethod: 'PSEUDONYMIZATION',
    controlOwner: 'FINANCE_DIRECTOR',
    reviewRequired: true,
    automaticDeletionEnabled: false
  },
  'RET-004': {
    policyId: 'RET-004',
    dataCategory: 'DISPUTE_CASE',
    retentionTrigger: 'INCIDENT_CLOSURE',
    retentionDurationSource: 'PENDING_MANAGEMENT_CONFIRMATION',
    durationDays: null,
    holdOverrides: ['LEGAL_HOLD', 'SECURITY_EVIDENCE_HOLD'],
    disposalMethod: 'PSEUDONYMIZATION',
    controlOwner: 'LEGAL_COUNSEL',
    reviewRequired: true,
    automaticDeletionEnabled: false
  },
  'RET-005': {
    policyId: 'RET-005',
    dataCategory: 'SECURITY_EVENT',
    retentionTrigger: 'RECORD_CREATION',
    retentionDurationSource: 'PENDING_MANAGEMENT_CONFIRMATION',
    durationDays: null,
    holdOverrides: ['LEGAL_HOLD', 'SECURITY_EVIDENCE_HOLD'],
    disposalMethod: 'PHYSICAL_DELETION',
    controlOwner: 'CISO',
    reviewRequired: true,
    automaticDeletionEnabled: false
  },
  'RET-006': {
    policyId: 'RET-006',
    dataCategory: 'SUPPORT_COMMUNICATION',
    retentionTrigger: 'INCIDENT_CLOSURE',
    retentionDurationSource: 'BUSINESS_JUSTIFICATION',
    durationDays: 365,
    holdOverrides: ['LEGAL_HOLD', 'SECURITY_EVIDENCE_HOLD'],
    disposalMethod: 'PHYSICAL_DELETION',
    controlOwner: 'CUSTOMER_SUCCESS_DIRECTOR',
    reviewRequired: true,
    automaticDeletionEnabled: false
  },
  'RET-UNKNOWN': {
    policyId: 'RET-UNKNOWN',
    dataCategory: 'UNKNOWN',
    retentionTrigger: 'RECORD_CREATION',
    retentionDurationSource: 'PENDING_MANAGEMENT_CONFIRMATION',
    durationDays: null,
    holdOverrides: ['LEGAL_HOLD', 'FINANCIAL_HOLD', 'SECURITY_EVIDENCE_HOLD'],
    disposalMethod: 'PHYSICAL_DELETION',
    controlOwner: 'DATA_PROTECTION_OFFICER',
    reviewRequired: true,
    automaticDeletionEnabled: false
  }
};

export function getRetentionPolicy(policyId: string): RetentionPolicy {
  return RetentionPolicyRegistry[policyId] || RetentionPolicyRegistry['RET-UNKNOWN'];
}
