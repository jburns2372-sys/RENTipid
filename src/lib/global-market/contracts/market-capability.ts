/**
 * RENTipid GLOBAL-MKT / v2.0 — Market Capability Contract
 *
 * Implements the controlled capability vocabulary covering the Project Owner's
 * 13-capability lifecycle standard (C01 - C13) and granular market capabilities.
 */

/**
 * Granular commercial marketplace capabilities
 */
export const MARKET_CAPABILITIES = [
  'ACCOUNT_REGISTRATION',
  'RENTER_ONBOARDING',
  'PROVIDER_ONBOARDING',
  'KYC_VERIFICATION',
  'LISTING_CREATE',
  'LISTING_PUBLISH',
  'PRICING',
  'SEARCH_DISCOVERY',
  'BOOKING_RENTAL',
  'MESSAGING',
  'PAYMENT_COLLECTION',
  'PROVIDER_PAYOUT',
  'DEPOSIT',
  'CANCELLATION',
  'REFUND',
  'CLAIM',
  'DISPUTE',
  'REVIEW',
  'LOCALIZATION',
  'DISPLAY_CURRENCY',
  'TAX_INVOICE',
  'RESTRICTED_CATEGORY_POLICY',
  'COMPLIANCE',
  'ADDRESS_LOCATION',
] as const;

export type MarketCapability = (typeof MARKET_CAPABILITIES)[number];

export const ALL_MARKET_CAPABILITIES: readonly MarketCapability[] = Object.freeze([...MARKET_CAPABILITIES]);

/**
 * Controlled Capability Status Model
 */
export const CAPABILITY_STATUSES = [
  'READY',
  'PARTIAL',
  'BLOCKED',
  'NOT_CONFIGURED',
  'VALIDATION_REQUIRED',
  'NOT_APPLICABLE',
  'UNKNOWN',
] as const;

export type MarketCapabilityStatus = (typeof CAPABILITY_STATUSES)[number];

export const ALL_CAPABILITY_STATUSES: readonly MarketCapabilityStatus[] = Object.freeze([...CAPABILITY_STATUSES]);

/**
 * Project Owner 13-Lifecycle Codes (from GLOBAL_MARKET_ACTIVATION_CONTRACT.md)
 */
export const OWNER_LIFECYCLE_CODES = [
  'C01_ACCOUNT_REGISTRATION',
  'C02_KYC_VERIFICATION',
  'C03_LISTING_PUBLICATION',
  'C04_PRICING_AUTHORITY',
  'C05_SEARCH_DISCOVERY',
  'C06_BOOKING_RENTAL',
  'C07_COMMUNICATIONS',
  'C08_PAYMENT_COLLECTION',
  'C09_PROVIDER_PAYOUT',
  'C10_DEPOSIT_DISPUTES',
  'C11_MULTILINGUAL_UI',
  'C12_LOCALIZED_CURRENCY',
  'C13_REGULATORY_COMPLIANCE',
] as const;

export type OwnerLifecycleCode = (typeof OWNER_LIFECYCLE_CODES)[number];

/**
 * Mapping of Owner 13-Lifecycle Codes to granular market capabilities
 */
export const OWNER_LIFECYCLE_MAPPING: Readonly<Record<OwnerLifecycleCode, readonly MarketCapability[]>> = Object.freeze({
  C01_ACCOUNT_REGISTRATION: ['ACCOUNT_REGISTRATION', 'RENTER_ONBOARDING', 'PROVIDER_ONBOARDING'] as const,
  C02_KYC_VERIFICATION: ['KYC_VERIFICATION'] as const,
  C03_LISTING_PUBLICATION: ['LISTING_CREATE', 'LISTING_PUBLISH'] as const,
  C04_PRICING_AUTHORITY: ['PRICING'] as const,
  C05_SEARCH_DISCOVERY: ['SEARCH_DISCOVERY'] as const,
  C06_BOOKING_RENTAL: ['BOOKING_RENTAL'] as const,
  C07_COMMUNICATIONS: ['MESSAGING'] as const,
  C08_PAYMENT_COLLECTION: ['PAYMENT_COLLECTION'] as const,
  C09_PROVIDER_PAYOUT: ['PROVIDER_PAYOUT'] as const,
  C10_DEPOSIT_DISPUTES: ['DEPOSIT', 'CANCELLATION', 'REFUND', 'CLAIM', 'DISPUTE', 'REVIEW'] as const,
  C11_MULTILINGUAL_UI: ['LOCALIZATION'] as const,
  C12_LOCALIZED_CURRENCY: ['DISPLAY_CURRENCY'] as const,
  C13_REGULATORY_COMPLIANCE: ['TAX_INVOICE', 'RESTRICTED_CATEGORY_POLICY', 'COMPLIANCE', 'ADDRESS_LOCATION'] as const,
});

/**
 * All 24 market capabilities are mandatory for full commercial marketplace activation.
 */
export const MANDATORY_MARKET_CAPABILITIES: readonly MarketCapability[] = Object.freeze([...ALL_MARKET_CAPABILITIES]);

/**
 * Capability evidence record
 */
export interface MarketCapabilityRecord {
  readonly capability: MarketCapability;
  readonly status: MarketCapabilityStatus;
  readonly isMandatory: boolean;
  readonly evidenceSource?: string;
  readonly validatedAt?: string;
  readonly validationAuthority?: string;
  readonly notes?: string;
  readonly blockers?: readonly string[];
  readonly providerDependencies?: readonly string[];
  readonly acceptanceGate?: string;
}
