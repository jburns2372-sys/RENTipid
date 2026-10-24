/**
 * RENTipid GLOBAL-MKT / v2.0 — Provider Mapping & Capability Contracts
 *
 * Defines evidence-based provider registrations and 46-country service mappings.
 */

export const PROVIDER_CLASSES = [
  'KYC',
  'PAYMENT',
  'PAYOUT',
  'GEOCODING',
  'EMAIL',
  'SMS',
  'WHATSAPP',
  'PUSH',
  'TAX_CALCULATION',
  'FRAUD_RISK',
] as const;

export type ProviderClass = (typeof PROVIDER_CLASSES)[number];

export type CapabilityProviderStatus =
  | 'VERIFIED'
  | 'READY'
  | 'PARTIAL'
  | 'VALIDATION_REQUIRED'
  | 'NOT_CONFIGURED'
  | 'UNSUPPORTED'
  | 'BLOCKED'
  | 'TEST_ONLY';

export interface ProviderCapabilityRecord {
  readonly providerId: string;
  readonly providerName: string;
  readonly providerClass: ProviderClass;
  readonly supportedCountries: readonly string[];
  readonly supportedCurrencies: readonly string[];
  readonly capabilities: readonly string[];
  readonly webhookSupported: boolean;
  readonly reconciliationSupported: boolean;
  readonly verificationStatus: CapabilityProviderStatus;
  readonly knownLimitations: readonly string[];
  readonly documentationReference: string;
  readonly lastVerifiedDate: string;
}

export interface JurisdictionProviderMapping {
  readonly jurisdictionCode: string;
  readonly countryName: string;
  readonly kycProviderId: string | null;
  readonly paymentProviderId: string | null;
  readonly payoutProviderId: string | null;
  readonly geocodingProviderId: string | null;
  readonly emailProviderId: string | null;
  readonly smsProviderId: string | null;
  readonly whatsappProviderId: string | null;
  readonly pushProviderId: string | null;
  readonly taxProviderId: string | null;
  readonly kycStatus: CapabilityProviderStatus;
  readonly paymentStatus: CapabilityProviderStatus;
  readonly payoutStatus: CapabilityProviderStatus;
  readonly geocodingStatus: CapabilityProviderStatus;
  readonly notificationStatus: CapabilityProviderStatus;
  readonly explicitProviderGaps: readonly string[];
}
