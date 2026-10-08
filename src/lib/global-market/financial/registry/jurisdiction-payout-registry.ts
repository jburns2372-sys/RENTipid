/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Payout Profile Registry
 *
 * Reuses and derives strictly from the authoritative GLCC country catalog (46 countries).
 * ZERO duplicated country lists. Fail-closed for unknown jurisdictions.
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import { type JurisdictionPayoutProfile } from '../contracts/jurisdiction-payout-profile';

function buildAuthoritativePayoutProfiles(): ReadonlyMap<string, JurisdictionPayoutProfile> {
  const map = new Map<string, JurisdictionPayoutProfile>();

  for (const country of GLOBAL_COUNTRY_CATALOG) {
    const code = country.code.toUpperCase();
    const currency = country.defaultCurrency || country.defaultDisplayCurrency || 'PHP';

    const isPh = code === 'PH';
    let supportedMethods: readonly string[] = Object.freeze([]);
    let approvedProviders: readonly string[] = Object.freeze([]);
    let payoutStatus: 'NOT_CONFIGURED' | 'PARTIAL' | 'READY' = 'NOT_CONFIGURED';
    let blockers: readonly string[] = Object.freeze([`Automated provider settlement rail not configured for ${code}`]);

    if (isPh) {
      payoutStatus = 'PARTIAL';
      approvedProviders = Object.freeze(['manual_ph_bank']);
      supportedMethods = Object.freeze(['BANK_TRANSFER', 'GCASH']);
      blockers = Object.freeze(['PH-BLK-001: Automated domestic provider payout rail integration required for GLOBAL-MKT v2.0']);
    } else if (code === 'TH') {
      supportedMethods = Object.freeze(['PROMPTPAY', 'DIRECT_BANK_TRANSFER']);
      blockers = Object.freeze(['Automated Thai bank transfer / PromptPay provider disbursement rail required for TH']);
    } else if (code === 'SG') {
      supportedMethods = Object.freeze(['PAYNOW', 'FAST_BANK_TRANSFER']);
      blockers = Object.freeze(['Automated FAST / PayNow provider disbursement rail required for SG']);
    } else if (code === 'MY') {
      supportedMethods = Object.freeze(['DUITNOW', 'INTERBANK_GIRO']);
      blockers = Object.freeze(['Automated DuitNow / Interbank GIRO disbursement rail required for MY']);
    } else if (code === 'VN') {
      supportedMethods = Object.freeze(['NAPAS_DIRECT_TRANSFER', 'DOMESTIC_BANK_TRANSFER']);
      blockers = Object.freeze(['Automated NAPAS / domestic bank disbursement rail required for VN']);
    } else if (code === 'ID') {
      supportedMethods = Object.freeze(['BI_FAST', 'DIRECT_BANK_TRANSFER']);
      blockers = Object.freeze(['Automated BI-FAST / domestic bank disbursement rail required for ID']);
    }

    // Technical candidate routing only: readiness remains NOT_CONFIGURED.
    if (['TH', 'SG', 'MY', 'VN', 'ID'].includes(code)) approvedProviders = Object.freeze(['xendit_payout']);

    const profile: JurisdictionPayoutProfile = Object.freeze({
      jurisdictionCode: code,
      jurisdictionName: country.name,
      payoutStatus,
      approvedProviderIds: approvedProviders,
      supportedSettlementCurrencies: isPh ? Object.freeze(['PHP']) : Object.freeze([currency]),
      defaultSettlementCurrency: isPh ? 'PHP' : currency,
      supportedPayoutMethods: supportedMethods,
      requiresProviderPayoutKyc: true,
      settlementHoldingDays: isPh ? 3 : 7,
      knownBlockers: blockers,
    });

    map.set(code, profile);
  }


  return map;
}

const AUTHORITATIVE_PAYOUT_PROFILES: ReadonlyMap<string, JurisdictionPayoutProfile> =
  buildAuthoritativePayoutProfiles();

export const AUTHORITATIVE_PAYOUT_PROFILE_COUNT = AUTHORITATIVE_PAYOUT_PROFILES.size;

/**
 * Resolves the payout settlement profile for a jurisdiction.
 * Fails closed (returns null) for any unknown or unsupported jurisdiction.
 */
export function resolveJurisdictionPayoutProfile(
  countryCode: string | null | undefined
): JurisdictionPayoutProfile | null {
  if (!countryCode || typeof countryCode !== 'string') return null;
  const cleanCode = countryCode.trim().toUpperCase();
  return AUTHORITATIVE_PAYOUT_PROFILES.get(cleanCode) || null;
}

/**
 * Returns all 46 authoritative payout settlement profiles.
 */
export function getAllAuthoritativePayoutProfiles(): readonly JurisdictionPayoutProfile[] {
  return Array.from(AUTHORITATIVE_PAYOUT_PROFILES.values());
}
