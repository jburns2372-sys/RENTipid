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
] as const;

export type BlockerSeverity = (typeof BLOCKER_SEVERITY_LEVELS)[number];

export interface MarketBlockerItem {
  readonly code: string;
  readonly title: string;
  readonly severity: BlockerSeverity;
  readonly description: string;
  readonly remediationAction: string;
}

export interface MarketReadinessProfile {
  readonly jurisdictionCode: string;
  readonly countryName: string;
  readonly currentStage: MarketReadinessStage;
  readonly highestProvenStage: MarketReadinessStage;
  readonly isEligibleForLocalAcceptance: boolean;
  readonly commerciallyActive: false; // Strictly false for GM-8A!
  readonly blockers: readonly MarketBlockerItem[];
  readonly providerGaps: readonly string[];
  readonly complianceGaps: readonly string[];
  readonly validationRequiredItems: readonly string[];
  readonly activationPrerequisites: readonly string[];
}
