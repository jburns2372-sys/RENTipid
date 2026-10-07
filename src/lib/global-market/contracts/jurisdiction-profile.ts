/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Profile Contract
 *
 * Strongly typed JurisdictionProfile contract representing commercial jurisdiction
 * governance, capability records, policy references, and provider adapter references.
 */

import type { MarketCapability, MarketCapabilityRecord } from './market-capability';
import type { MarketActivationState } from './market-activation-state';

export type OperationalRegion = 'APAC' | 'AMERICAS' | 'EMEA' | 'EU_EEA';

export interface PolicyReference {
  readonly refId: string;
  readonly status: 'ACTIVE' | 'NOT_CONFIGURED' | 'VALIDATION_REQUIRED' | 'UNKNOWN';
  readonly notes?: string;
}

export interface ProviderReference {
  readonly providerId?: string;
  readonly status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'VALIDATION_REQUIRED' | 'UNKNOWN';
  readonly notes?: string;
}

export interface JurisdictionProfile {
  readonly countryCode: string; // ISO 3166-1 alpha-2 code matching GLCC
  readonly marketId: string; // e.g. "MKT-PH", "MKT-US"
  readonly glccAvailable: boolean;
  readonly complianceGroup: string;
  readonly operatingRegion: OperationalRegion;
  readonly activationState: MarketActivationState;
  readonly capabilities: Readonly<Record<MarketCapability, MarketCapabilityRecord>>;
  readonly kycProfileRef: ProviderReference;
  readonly addressProfileRef: PolicyReference;
  readonly listingPolicyRef: PolicyReference;
  readonly paymentProfileRef: ProviderReference;
  readonly payoutProfileRef: ProviderReference;
  readonly taxProfileRef: PolicyReference;
  readonly categoryPolicyRef: PolicyReference;
  readonly bookingPolicyRef: PolicyReference;
  readonly refundDepositDisputePolicyRef: PolicyReference;
  readonly privacyDataPolicyRef: PolicyReference;
  readonly operationalRestrictions: readonly string[];
  readonly knownBlockers: readonly string[];
  readonly validationRequirements: readonly string[];
}
