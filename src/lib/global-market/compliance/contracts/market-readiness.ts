/**
 * RENTipid GLOBAL-MKT / v2.0 — Market Readiness Ladder & Profile Contracts
 *
 * Defines the strict promotion ladder for marketplace jurisdictions and blockers.
 *
 * PERMANENT INVARIANT:
 * No jurisdiction may be marked ACTIVE without full end-to-end evidence.
 * GM-8A commerciallyActive count is strictly 0.
 */

export const MARKET_READINESS_STAGES = [
  'REGISTERED',
  'FOUNDATION_READY',
  'COMPLIANCE_VALIDATED',
  'KYC_READY',
  'PAYMENT_READY',
  'PAYOUT_READY',
  'MARKETPLACE_READY',
  'LOCAL_ACCEPTED',
  'PREVIEW_ACCEPTED',
  'PRODUCTION_ACCEPTED',
  'OWNER_ACCEPTED',
  'ACTIVE',
  'SUSPENDED',
  'BLOCKED',
] as const;

export type MarketReadinessStage = (typeof MARKET_READINESS_STAGES)[number];

export const BLOCKER_SEVERITY_LEVELS = [
  'BLOCKER',
  'REQUIRED_BEFORE_LOCAL_ACCEPTANCE',
  'REQUIRED_BEFORE_PREVIEW',
  'REQUIRED_BEFORE_PRODUCTION',
  'DEFERRED_NON_BLOCKING',
  'INFORMATIONAL',
  'BLOCKS_LISTING',
  'BLOCKS_BOOKING',
  'BLOCKS_PAYMENT',
  'BLOCKS_PAYOUT',
  'BLOCKS_POST_TRANSACTION',
  'BLOCKS_PRODUCTION',
  'BLOCKS_FULL_MARKET_ACTIVATION',
  'NON_BLOCKING',
] as const;

export type BlockerSeverity = (typeof BLOCKER_SEVERITY_LEVELS)[number];

export type GapCategory =
  | 'APPLICATION_CODE'
  | 'KYC_PROVIDER'
  | 'BUSINESS_VERIFICATION'
  | 'PAYMENT_PROVIDER'
  | 'PAYMENT_METHODS'
  | 'TRANSACTION_CURRENCY'
  | 'PAYOUT_PROVIDER'
  | 'PAYOUT_METHOD'
  | 'SETTLEMENT_CURRENCY'
  | 'TAX'
  | 'INVOICE_RECEIPT'
  | 'CONSUMER_PROTECTION'
  | 'PRIVACY_DATA'
  | 'MARKETPLACE_LICENSING'
  | 'RESTRICTED_CATEGORIES'
  | 'AGE_ID_REQUIREMENTS'
  | 'ADDRESS_GEOCODING'
  | 'NOTIFICATION'
  | 'CROSS_BORDER'
  | 'DATA_RESIDENCY'
  | 'PUBLIC_NETWORK'
  | 'LEGAL_REVIEW'
  | 'PROVIDER_COMMERCIAL_AGREEMENT'
  | 'PROVIDER_SANDBOX'
  | 'PROVIDER_PRODUCTION_ACCESS'
  | 'OTHER';

export type BlockerType =
  | 'CODE_FIX'
  | 'CONFIGURATION'
  | 'DOCUMENTATION'
  | 'TECHNICAL_VALIDATION'
  | 'LEGAL_REVIEW'
  | 'PROJECT_OWNER_DECISION'
  | 'EXTERNAL_PROVIDER_REQUIRED'
  | 'VENDOR_INFORMATION_REQUIRED'
  | 'SANDBOX_CREDENTIALS_REQUIRED'
  | 'PRODUCTION_CREDENTIALS_REQUIRED'
  | 'COMMERCIAL_AGREEMENT_REQUIRED'
  | 'REGULATORY_REQUIREMENT'
  | 'NETWORK_VALIDATION'
  | 'NO_BLOCKER';

export interface MarketBlockerItem {
  readonly code: string;
  readonly title: string;
  readonly severity: BlockerSeverity;
  readonly description: string;
  readonly remediationAction: string;
  readonly gapCategory?: GapCategory;
  readonly blockerType?: BlockerType;
  readonly affectedCapabilities?: readonly string[];
}

export interface MarketReadinessProfile {
  readonly jurisdictionCode: string;
  readonly countryName: string;
  readonly currentStage: MarketReadinessStage;
  readonly highestProvenStage: MarketReadinessStage;
  readonly isEligibleForLocalAcceptance: boolean; // Preserved for GM-9A PH full transaction backward compatibility
  readonly commerciallyActive: false; // Strictly false for GM-8A/9A!

  // Capability readiness flags (Section 7, 10, 11, 12)
  readonly accountReady: boolean;
  readonly renterReady: boolean;
  readonly providerReady: boolean;
  readonly kycReady: boolean;
  readonly businessVerificationReady: boolean;
  readonly addressReady: boolean;
  readonly listingCreateReady: boolean;
  readonly listingPublishReady: boolean;
  readonly searchDiscoveryReady: boolean;
  readonly internationalDiscoveryReady: boolean;
  readonly messagingReady: boolean;
  readonly bookingReady: boolean;
  readonly paymentReady: boolean;
  readonly payoutReady: boolean;
  readonly depositReady: boolean;
  readonly cancellationReady: boolean;
  readonly refundReady: boolean;
  readonly claimReady: boolean;
  readonly disputeReady: boolean;
  readonly reviewReady: boolean;
  readonly taxReady: boolean;
  readonly invoiceReady: boolean;
  readonly categoryPolicyReady: boolean;
  readonly complianceReady: boolean;
  readonly transactionReady: boolean;
  readonly localAccepted: boolean;
  readonly previewAccepted: boolean;
  readonly productionAccepted: boolean;
  readonly ownerAccepted: boolean;
  readonly fullyActive: boolean;

  // Gap closure tracking (Section 9, 10, 11)
  readonly requiresGapClosure: boolean;
  readonly remainingBlockers: readonly MarketBlockerItem[];

  readonly blockers: readonly MarketBlockerItem[];
  readonly providerGaps: readonly string[];
  readonly complianceGaps: readonly string[];
  readonly validationRequiredItems: readonly string[];
  readonly activationPrerequisites: readonly string[];
}

