/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Provider Capability Registry & 46-Country Mapping
 *
 * Implements evidence-based provider registration and 46-country service mapping.
 *
 * PERMANENT INVARIANTS:
 * - PAYMONGO: VERIFIED FOR DOMESTIC PH ONLY. NO EXPANSION WITHOUT EVIDENCE.
 * - MANNYPAY: SEPARATE_WORKSTREAM_PENDING. UNMODIFIED. NOT READY.
 * - EXTERNAL KYC: 0 VERIFIED EXTERNAL PROVIDERS.
 * - UNKNOWN PROVIDER / JURISDICTION FAILS CLOSED.
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import {
  type ProviderCapabilityRecord,
  type JurisdictionProviderMapping,
  type CapabilityProviderStatus,
} from '../contracts/provider-mapping';

export const AUTHORITATIVE_PROVIDER_MAPPING_COUNT = GLOBAL_COUNTRY_CATALOG.length; // 46

/**
 * Authoritative registry of known provider configurations.
 */
export const KNOWN_PROVIDER_CAPABILITIES: readonly ProviderCapabilityRecord[] = Object.freeze([
  {
    providerId: 'paymongo_global',
    providerName: 'PayMongo Global Adapter',
    providerClass: 'PAYMENT',
    supportedCountries: Object.freeze(['PH']),
    supportedCurrencies: Object.freeze(['PHP']),
    capabilities: Object.freeze(['CARD_PAYMENT', 'E_WALLET', 'WEBHOOK', 'MANUAL_REFUND']),
    webhookSupported: true,
    reconciliationSupported: true,
    verificationStatus: 'VERIFIED',
    knownLimitations: Object.freeze([
      'Authoritative production settlement limited to Philippine Peso (PHP) and domestic accounts',
    ]),
    documentationReference: 'https://developers.paymongo.com/docs',
    lastVerifiedDate: '2026-10-07',
  },
  {
    providerId: 'mannypay',
    providerName: 'MannyPay (Separate Workstream)',
    providerClass: 'PAYMENT',
    supportedCountries: Object.freeze([]),
    supportedCurrencies: Object.freeze([]),
    capabilities: Object.freeze([]),
    webhookSupported: false,
    reconciliationSupported: false,
    verificationStatus: 'NOT_CONFIGURED',
    knownLimitations: Object.freeze([
      'Separate workstream pending review and independent promotion pipeline',
    ]),
    documentationReference: 'RENTipid Internal Architecture Memo',
    lastVerifiedDate: '2026-10-07',
  },
  {
    providerId: 'manual_internal_kyc',
    providerName: 'RENTipid Internal Manual Verification',
    providerClass: 'KYC',
    supportedCountries: Object.freeze(['PH']),
    supportedCurrencies: Object.freeze([]),
    capabilities: Object.freeze(['DOCUMENT_INSPECTION', 'MANUAL_APPROVAL', 'AUDIT_TRAIL']),
    webhookSupported: false,
    reconciliationSupported: true,
    verificationStatus: 'READY',
    knownLimitations: Object.freeze([
      'Requires human compliance agent adjudication; throughput constrained',
    ]),
    documentationReference: 'RENTipid Internal SOP: KYC Review',
    lastVerifiedDate: '2026-10-07',
  },
  {
    providerId: 'mock_gateway',
    providerName: 'Mock Sandbox Financial Rail',
    providerClass: 'PAYMENT',
    supportedCountries: Object.freeze(GLOBAL_COUNTRY_CATALOG.map((c) => c.code)),
    supportedCurrencies: Object.freeze(['PHP', 'USD', 'EUR', 'JPY', 'THB']),
    capabilities: Object.freeze(['CARD_PAYMENT', 'AUTHORIZATION', 'CAPTURE', 'REFUND', 'PARTIAL_REFUND', 'WEBHOOK']),
    webhookSupported: true,
    reconciliationSupported: true,
    verificationStatus: 'TEST_ONLY',
    knownLimitations: Object.freeze([
      'Sandbox mock only. Never constitutes commercial readiness.',
    ]),
    documentationReference: 'Internal Unit & Local Acceptance Test Suite',
    lastVerifiedDate: '2026-10-07',
  },
  {
    providerId: 'pwa_push',
    providerName: 'Browser WebPush / ServiceWorker',
    providerClass: 'PUSH',
    supportedCountries: Object.freeze(GLOBAL_COUNTRY_CATALOG.map((c) => c.code)),
    supportedCurrencies: Object.freeze([]),
    capabilities: Object.freeze(['BACKGROUND_PUSH', 'DEVICE_NOTIFICATION']),
    webhookSupported: false,
    reconciliationSupported: false,
    verificationStatus: 'READY',
    knownLimitations: Object.freeze([
      'Requires user browser permission grant and active service worker registration',
    ]),
    documentationReference: 'W3C Push API Standard',
    lastVerifiedDate: '2026-10-07',
  },
]);

function buildProviderMapping(countryCode: string, countryName: string): JurisdictionProviderMapping {
  const isDomesticPH = countryCode === 'PH';

  if (isDomesticPH) {
    return Object.freeze({
      jurisdictionCode: 'PH',
      countryName,
      kycProviderId: 'manual_internal_kyc',
      paymentProviderId: 'paymongo_global',
      payoutProviderId: null, // Batch manual payout; automated direct rail unconfigured
      geocodingProviderId: null, // Domestic PSGC fallback
      emailProviderId: 'system_mailer',
      smsProviderId: null,
      whatsappProviderId: 'whatsapp_otp_auth_only',
      pushProviderId: 'pwa_push',
      taxProviderId: null,
      kycStatus: 'READY',
      paymentStatus: 'VERIFIED',
      payoutStatus: 'PARTIAL',
      geocodingStatus: 'PARTIAL',
      notificationStatus: 'PARTIAL',
      explicitProviderGaps: Object.freeze([
        'AUTOMATED_PAYOUT_RAIL_MISSING',
        'EXTERNAL_AUTOMATED_KYC_PROVIDER_MISSING',
        'TRANSACTIONAL_SMS_PROVIDER_MISSING',
        'AUTOMATED_TAX_ENGINE_MISSING',
      ]),
    });
  }

  // International 45 Countries
  return Object.freeze({
    jurisdictionCode: countryCode,
    countryName,
    kycProviderId: null,
    paymentProviderId: null,
    payoutProviderId: null,
    geocodingProviderId: null,
    emailProviderId: 'system_mailer',
    smsProviderId: null,
    whatsappProviderId: null,
    pushProviderId: 'pwa_push',
    taxProviderId: null,
    kycStatus: 'NOT_CONFIGURED',
    paymentStatus: 'NOT_CONFIGURED',
    payoutStatus: 'NOT_CONFIGURED',
    geocodingStatus: 'NOT_CONFIGURED',
    notificationStatus: 'NOT_CONFIGURED',
    explicitProviderGaps: Object.freeze([
      'KYC_PROVIDER_MISSING',
      'PAYMENT_PROVIDER_MISSING',
      'PAYOUT_PROVIDER_MISSING',
      'GEOCODING_PROVIDER_MISSING',
      'NOTIFICATION_PROVIDER_MISSING',
      'TAX_PROVIDER_MISSING',
    ]),
  });
}

const providerMappingsByCode = new Map<string, JurisdictionProviderMapping>();
for (const country of GLOBAL_COUNTRY_CATALOG) {
  providerMappingsByCode.set(country.code, buildProviderMapping(country.code, country.name));
}

/**
 * Resolves the JurisdictionProviderMapping for a country code.
 * Fails closed (returns null) for unknown country codes.
 */
export function resolveJurisdictionProviderMapping(
  jurisdictionCode: string | null | undefined
): JurisdictionProviderMapping | null {
  if (!jurisdictionCode) return null;
  const upper = jurisdictionCode.trim().toUpperCase();
  return providerMappingsByCode.get(upper) || null;
}

/**
 * Returns all 46 authoritative provider mappings.
 */
export function getAllAuthoritativeProviderMappings(): readonly JurisdictionProviderMapping[] {
  return Array.from(providerMappingsByCode.values());
}
