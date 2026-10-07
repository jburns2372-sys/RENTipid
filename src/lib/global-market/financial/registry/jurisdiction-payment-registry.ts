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
    let supportedMethods: readonly string[] = Object.freeze([]);
    let approvedProviders: readonly string[] = Object.freeze([]);
    let collectionStatus: 'NOT_CONFIGURED' | 'PARTIAL' | 'READY' = 'NOT_CONFIGURED';
    let blockers: readonly string[] = Object.freeze([`Domestic payment collection adapter not configured for ${code}`]);

    if (isPh) {
      collectionStatus = 'PARTIAL';
      approvedProviders = Object.freeze(['paymongo']);
      supportedMethods = Object.freeze(['CARD', 'GCASH', 'PAYMAYA', 'BANK']);
      blockers = Object.freeze([]);
    } else if (code === 'TH') {
      supportedMethods = Object.freeze(['CARD', 'PROMPTPAY', 'BANK']);
      blockers = Object.freeze(['PromptPay payment acquiring merchant agreement and credentials required for TH']);
    } else if (code === 'SG') {
      supportedMethods = Object.freeze(['CARD', 'PAYNOW', 'FAST_BANK_TRANSFER']);
      blockers = Object.freeze(['Singapore MAS-compliant payment acquiring merchant agreement required for SG']);
    } else if (code === 'MY') {
      supportedMethods = Object.freeze(['CARD', 'DUITNOW', 'FPX_ONLINE_BANKING']);
      blockers = Object.freeze(['FPX / DuitNow payment merchant account required for MY']);
    } else if (code === 'VN') {
      supportedMethods = Object.freeze(['CARD', 'NAPAS_BANK_TRANSFER', 'MOMO_WALLET']);
      blockers = Object.freeze(['State Bank of Vietnam licensed payment gateway agreement required for VN']);
    } else if (code === 'ID') {
      supportedMethods = Object.freeze(['CARD', 'QRIS', 'VIRTUAL_ACCOUNT']);
      blockers = Object.freeze(['Bank Indonesia licensed payment gateway agreement required for ID']);
    }

    const profile: JurisdictionPaymentProfile = Object.freeze({
      jurisdictionCode: code,
      jurisdictionName: country.name,
      collectionStatus,
      approvedProviderIds: approvedProviders,
      supportedTransactionCurrencies: isPh ? Object.freeze(['PHP']) : Object.freeze([currency]),
      defaultTransactionCurrency: isPh ? 'PHP' : currency,
      supportedPaymentMethods: supportedMethods,
      requiresPayerKyc: true,
      webhookRequired: true,
      reconciliationRequired: true,
      knownBlockers: blockers,
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
