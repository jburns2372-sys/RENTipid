/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Booking Policy Registry
 *
 * Reuses and derives strictly from the authoritative GLCC country catalog (46 countries).
 * ZERO duplicated country lists. Fail-closed for unknown jurisdictions.
 */

import {
  GLOBAL_COUNTRY_CATALOG,
  getCountryProfile,
} from '@/lib/glcc/country/country-registry';
import { type BookingPolicy } from '../contracts/booking-policy';

/**
 * Builds the authoritative booking policies derived from GLCC countries.
 */
function buildAuthoritativeBookingPolicies(): ReadonlyMap<string, BookingPolicy> {
  const map = new Map<string, BookingPolicy>();

  for (const country of GLOBAL_COUNTRY_CATALOG) {
    const code = country.code.toUpperCase();
    const timezone = country.defaultTimezone || country.timezoneDefault || 'UTC';
    const currency = country.defaultCurrency || country.defaultDisplayCurrency || 'PHP';

    // Renter KYC requirement logic: mandatory in direct APAC / AMERICAS / EU jurisdictions
    const requiresRenterKyc = true;
    const requiresProviderKyc = true; // Invariant from GM-3A

    const policy: BookingPolicy = Object.freeze({
      jurisdictionCode: code,
      jurisdictionName: country.name,
      minRentalDurationHours: 1,
      maxRentalDurationDays: 365,
      minAdvanceNoticeHours: 2,
      allowInstantBooking: false, // Default requires provider acceptance
      requiresRenterKyc,
      requiresProviderKyc,
      securityDepositAllowed: true,
      defaultCancellationPolicyRef: `CP-${code}-STANDARD-FLEXIBLE-V1`,
      currencyAuthority: currency,
      primaryTimezone: timezone,
    });

    map.set(code, policy);
  }

  return map;
}

const AUTHORITATIVE_BOOKING_POLICIES: ReadonlyMap<string, BookingPolicy> =
  buildAuthoritativeBookingPolicies();

export const AUTHORITATIVE_BOOKING_POLICY_COUNT = AUTHORITATIVE_BOOKING_POLICIES.size;

/**
 * Resolves the booking policy for a jurisdiction code.
 * Fails closed (returns null) for any unknown or unsupported jurisdiction.
 */
export function resolveJurisdictionBookingPolicy(
  countryCode: string | null | undefined
): BookingPolicy | null {
  if (!countryCode || typeof countryCode !== 'string') return null;
  const cleanCode = countryCode.trim().toUpperCase();
  return AUTHORITATIVE_BOOKING_POLICIES.get(cleanCode) || null;
}

/**
 * Returns all 46 authoritative booking policies.
 */
export function getAllAuthoritativeBookingPolicies(): readonly BookingPolicy[] {
  return Array.from(AUTHORITATIVE_BOOKING_POLICIES.values());
}

/**
 * Resolves the primary timezone for a jurisdiction.
 * Returns null if the jurisdiction is unknown.
 */
export function getJurisdictionPrimaryTimezone(
  countryCode: string | null | undefined
): string | null {
  const policy = resolveJurisdictionBookingPolicy(countryCode);
  return policy ? policy.primaryTimezone : null;
}
