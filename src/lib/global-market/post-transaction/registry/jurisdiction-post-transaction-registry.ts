/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Post-Transaction Registry
 *
 * Resolves post-transaction policy profiles across all 46 authoritative jurisdictions.
 * Derives strictly from GLOBAL_COUNTRY_CATALOG (zero duplicate country lists).
 * Fails closed for unknown jurisdictions.
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import { type JurisdictionPostTransactionProfile } from '../contracts/post-transaction-profile';

function buildAuthoritativePostTransactionProfiles(): ReadonlyMap<string, JurisdictionPostTransactionProfile> {
  const map = new Map<string, JurisdictionPostTransactionProfile>();

  for (const country of GLOBAL_COUNTRY_CATALOG) {
    const code = country.code.toUpperCase();
    const isPh = code === 'PH';
    const isCn = code === 'CN';

    const blockers = isCn
      ? Object.freeze(['ICP_LICENSE_REQUIRED', 'PIPL_DATA_LOCALIZATION_COMPLIANCE'])
      : Object.freeze([]);

    const profile: JurisdictionPostTransactionProfile = Object.freeze({
      jurisdictionCode: code,
      countryName: country.name,
      defaultCancellationTier: isPh ? 'MODERATE' : 'STRICT',
      defaultDepositModel: 'PAYMENT_COLLECTED',
      allowsAuthorizationHold: false, // Default false until gateway verification
      refundEntitlementPolicy: isCn ? 'CONSUMER_RIGHTS_RESERVED' : 'STANDARD',
      claimSubmissionWindowHours: isPh ? 72 : 48,
      disputeMediationRequired: true,
      reviewWindowDays: 14,
      payoutHoldOnOpenClaim: true,
      payoutHoldOnOpenDispute: true,
      validationStatus: isPh ? 'CONFIGURED' : 'VALIDATION_REQUIRED',
      knownBlockers: blockers,
    });

    map.set(code, profile);
  }

  return map;
}

const AUTHORITATIVE_POST_TRANSACTION_PROFILES: ReadonlyMap<string, JurisdictionPostTransactionProfile> =
  buildAuthoritativePostTransactionProfiles();

export const AUTHORITATIVE_POST_TRANSACTION_PROFILE_COUNT =
  AUTHORITATIVE_POST_TRANSACTION_PROFILES.size;

/**
 * Resolves post-transaction policy profile for a jurisdiction code.
 * Fails closed (returns null) for any unknown or invalid code.
 */
export function resolveJurisdictionPostTransactionProfile(
  countryCode: string | null | undefined
): JurisdictionPostTransactionProfile | null {
  if (!countryCode || typeof countryCode !== 'string') return null;
  const clean = countryCode.trim().toUpperCase();
  return AUTHORITATIVE_POST_TRANSACTION_PROFILES.get(clean) || null;
}

/**
 * Returns all 46 authoritative post-transaction profiles.
 */
export function getAllAuthoritativePostTransactionProfiles(): readonly JurisdictionPostTransactionProfile[] {
  return Array.from(AUTHORITATIVE_POST_TRANSACTION_PROFILES.values());
}
