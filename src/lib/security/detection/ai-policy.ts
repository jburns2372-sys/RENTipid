export type AIActionClassification = 'READ_ONLY' | 'USER_CONFIRMATION_REQUIRED' | 'HUMAN_APPROVAL_REQUIRED' | 'PROHIBITED';

export interface AIActionPolicy {
  toolName?: string;
  classification: AIActionClassification;
  requiresResourceOwnershipCheck: boolean;
  maxCallsPerTurn: number;
}

export const AIActionPolicies: Record<string, AIActionPolicy> = {
  // Read-only
  'SEARCH_PUBLIC_LISTINGS': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 5 },
  'EXPLAIN_BOOKING_STATUS_FOR_AUTHORIZED_USER': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },
  'EXPLAIN_PROVIDER_ONBOARDING': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 3 },
  'EXPLAIN_POLICIES': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 5 },
  'NAVIGATE_TO_AUTHORIZED_SCREEN': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 5 },
  'getBookingSummary': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },
  'getListingSummary': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 5 },
  'getKYCChecklist': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },
  'getPaymentSummary': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },
  'getAgreementSummary': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },
  'getInspectionSummary': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },
  'getDisputeSummary': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },
  'getFinanceSummary': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },
  'getUserNextActions': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },
  'summarizeAuditLogs': { classification: 'READ_ONLY', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 3 },

  // User Confirmation Required
  'DRAFT_SUPPORT_REQUEST': { classification: 'USER_CONFIRMATION_REQUIRED', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 2 },
  'DRAFT_CLAIM': { classification: 'USER_CONFIRMATION_REQUIRED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 2 },
  'DRAFT_LISTING_CHANGES': { classification: 'USER_CONFIRMATION_REQUIRED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 2 },
  'DRAFT_ACCOUNT_UPDATE': { classification: 'USER_CONFIRMATION_REQUIRED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 2 },
  'createDraftListingDescription': { classification: 'USER_CONFIRMATION_REQUIRED', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 2 },
  'createDraftSupportReply': { classification: 'USER_CONFIRMATION_REQUIRED', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 2 },
  'createDraftAdminNote': { classification: 'USER_CONFIRMATION_REQUIRED', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 2 },

  // Human Approval Required
  'REFUND_RECOMMENDATION': { classification: 'HUMAN_APPROVAL_REQUIRED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 1 },
  'ESCROW_RELEASE_RECOMMENDATION': { classification: 'HUMAN_APPROVAL_REQUIRED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 1 },
  'KYC_APPROVAL_RECOMMENDATION': { classification: 'HUMAN_APPROVAL_REQUIRED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 1 },
  'DISPUTE_RESOLUTION_RECOMMENDATION': { classification: 'HUMAN_APPROVAL_REQUIRED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 1 },
  'ACCOUNT_RESTRICTION_RECOMMENDATION': { classification: 'HUMAN_APPROVAL_REQUIRED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 1 },
  'SECURITY_FREEZE_RECOMMENDATION': { classification: 'HUMAN_APPROVAL_REQUIRED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 1 },

  // Prohibited actions explicitly identified
  'DIRECT_ESCROW_RELEASE': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 0 },
  'DIRECT_PAYMENT_CAPTURE': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 0 },
  'DIRECT_REFUND': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 0 },
  'DIRECT_KYC_APPROVAL': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 0 },
  'DIRECT_ROLE_CHANGE': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 0 },
  'DIRECT_PERMISSION_CHANGE': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 0 },
  'DIRECT_ACCOUNT_DELETION': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 0 },
  'DIRECT_SECURITY_SETTING_CHANGE': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 0 },
  'DIRECT_SECRET_RETRIEVAL': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 0 },
  'DIRECT_AUDIT_LOG_DELETION': { classification: 'PROHIBITED', requiresResourceOwnershipCheck: false, maxCallsPerTurn: 0 }
};

export function getAIPolicyForTool(toolName: string): AIActionPolicy {
  return AIActionPolicies[toolName] || { classification: 'PROHIBITED', requiresResourceOwnershipCheck: true, maxCallsPerTurn: 0 };
}
