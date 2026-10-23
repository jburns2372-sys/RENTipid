/**
 * RENTipid GLOBAL-MKT / v2.0 — Onboarding & Verification State Contracts
 *
 * Implements provider intent vs authorization separation, renter onboarding readiness,
 * honest KYC state representations (boundary for GM-3), and profile completeness.
 */

export const PROVIDER_ONBOARDING_STATES = [
  'NOT_STARTED',
  'STARTED',
  'INCOMPLETE',
  'DOCUMENTS_REQUIRED',
  'KYC_REQUIRED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'BLOCKED',
] as const;

export type ProviderOnboardingState = (typeof PROVIDER_ONBOARDING_STATES)[number];
export const ALL_PROVIDER_ONBOARDING_STATES: readonly ProviderOnboardingState[] = Object.freeze([...PROVIDER_ONBOARDING_STATES]);

export const RENTER_ONBOARDING_STATES = [
  'NOT_STARTED',
  'PROFILE_PENDING',
  'CONTACT_VERIFICATION_REQUIRED',
  'KYC_REQUIRED',
  'READY',
  'SUSPENDED',
  'BLOCKED',
] as const;

export type RenterOnboardingState = (typeof RENTER_ONBOARDING_STATES)[number];
export const ALL_RENTER_ONBOARDING_STATES: readonly RenterOnboardingState[] = Object.freeze([...RENTER_ONBOARDING_STATES]);

/**
 * Account-side KYC state contract representing compliance boundary for GM-3.
 * Do not fake KYC approval.
 */
export const KYC_STATES = [
  'KYC_NOT_REQUIRED',
  'KYC_REQUIRED',
  'KYC_PENDING',
  'KYC_APPROVED',
  'KYC_REJECTED',
  'KYC_EXPIRED',
  'KYC_BLOCKED',
] as const;

export type KycState = (typeof KYC_STATES)[number];
export const ALL_KYC_STATES: readonly KycState[] = Object.freeze([...KYC_STATES]);

export const PROVIDER_TYPES = ['INDIVIDUAL', 'BUSINESS'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];
export const ALL_PROVIDER_TYPES: readonly ProviderType[] = Object.freeze([...PROVIDER_TYPES]);

export interface ProfileCompletenessReport {
  readonly isComplete: boolean;
  readonly missingFields: readonly string[];
  readonly completedFields: readonly string[];
  readonly completionPercentage: number;
}
