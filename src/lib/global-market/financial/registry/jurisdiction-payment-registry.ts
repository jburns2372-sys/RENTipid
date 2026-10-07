/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Payment Profile Registry
 *
 * Reuses and derives strictly from the authoritative GLCC country catalog (46 countries).
 * ZERO duplicated country lists. Fail-closed for unknown jurisdictions.
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import { type JurisdictionPaymentProfile } from '../contracts/jurisdiction-payment-profile';

function buildAuthoritativePaymentProfiles(): ReadonlyMap<string, JurisdictionPaymentProfile> {
  const map = new Map<string, JurisdictionPaymentProfile>();

  for (const country of GLOBAL_COUNTRY_CATALOG) {
    const code = country.code.toUpperCase();
    const currency = country.defaultCurrency || country.defaultDisplayCurrency || 'PHP';

    const isPh = code === 'PH';
    const profile: JurisdictionPaymentProfile = Object.freeze({
      jurisdictionCode: code,
      jurisdictionName: country.name,
      collectionStatus: isPh ? 'PARTIAL' : 'NOT_CONFIGURED',
      approvedProviderIds: isPh ? Object.freeze(['paymongo']) : Object.freeze([]),
      supportedTransactionCurrencies: isPh ? Object.freeze(['PHP']) : Object.freeze([currency]),
      defaultTransactionCurrency: isPh ? 'PHP' : currency,
      supportedPaymentMethods: isPh
        ? Object.freeze(['CARD', 'GCASH', 'PAYMAYA', 'BANK'])
        : Object.freeze([]),
      requiresPayerKyc: true,
      webhookRequired: true,
      reconciliationRequired: true,
      knownBlockers: isPh
        ? Object.freeze([])
        : Object.freeze([`Domestic payment collection adapter not configured for ${code}`]),
    });

    map.set(code, profile);
  }

  return map;
}

const AUTHORITATIVE_PAYMENT_PROFILES: ReadonlyMap<string, JurisdictionPaymentProfile> =
  buildAuthoritativePaymentProfiles();

export const AUTHORITATIVE_PAYMENT_PROFILE_COUNT = AUTHORITATIVE_PAYMENT_PROFILES.size;

/**
 * Resolves the payment collection profile for a jurisdiction.
 * Fails closed (returns null) for any unknown or unsupported jurisdiction.
 */
export function resolveJurisdictionPaymentProfile(
  countryCode: string | null | undefined
): JurisdictionPaymentProfile | null {
  if (!countryCode || typeof countryCode !== 'string') return null;
  const cleanCode = countryCode.trim().toUpperCase();
  return AUTHORITATIVE_PAYMENT_PROFILES.get(cleanCode) || null;
}

/**
 * Returns all 46 authoritative payment collection profiles.
 */
export function getAllAuthoritativePaymentProfiles(): readonly JurisdictionPaymentProfile[] {
  return Array.from(AUTHORITATIVE_PAYMENT_PROFILES.values());
}
