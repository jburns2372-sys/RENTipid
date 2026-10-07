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
    const profile: JurisdictionPayoutProfile = Object.freeze({
      jurisdictionCode: code,
      jurisdictionName: country.name,
      payoutStatus: isPh ? 'PARTIAL' : 'NOT_CONFIGURED',
      approvedProviderIds: isPh ? Object.freeze(['manual_ph_bank']) : Object.freeze([]),
      supportedSettlementCurrencies: isPh ? Object.freeze(['PHP']) : Object.freeze([currency]),
      defaultSettlementCurrency: isPh ? 'PHP' : currency,
      supportedPayoutMethods: isPh ? Object.freeze(['BANK_TRANSFER', 'GCASH']) : Object.freeze([]),
      requiresProviderPayoutKyc: true,
      settlementHoldingDays: isPh ? 3 : 7,
      knownBlockers: isPh
        ? Object.freeze(['PH-BLK-001: Automated domestic provider payout rail integration required for GLOBAL-MKT v2.0'])
        : Object.freeze([`Automated provider settlement rail not configured for ${code}`]),
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
