/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Notification Profile Registry
 *
 * Reuses and derives strictly from the authoritative GLCC country catalog (46 countries).
 * ZERO duplicated country lists. Fail-closed for unknown jurisdictions.
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import {
  type NotificationProfile,
  type DeliveryChannel,
} from '../contracts/notification-event';

/**
 * Builds the authoritative notification profiles derived from GLCC countries.
 */
function buildAuthoritativeNotificationProfiles(): ReadonlyMap<string, NotificationProfile> {
  const map = new Map<string, NotificationProfile>();

  for (const country of GLOBAL_COUNTRY_CATALOG) {
    const code = country.code.toUpperCase();

    // Specific channels per region/profile
    const channels: DeliveryChannel[] = ['IN_APP', 'EMAIL'];

    // SMS availability based on existing gateway configuration
    if (['PH', 'US', 'CA', 'SG', 'MY', 'GB', 'AU'].includes(code)) {
      channels.push('SMS');
    }

    const profile: NotificationProfile = Object.freeze({
      jurisdictionCode: code,
      supportedChannels: Object.freeze(channels),
      supportsWhatsAppOtpOnly: true, // Invariant: OTP auth is isolated from transactional notifications
      requiresEmailConfirmation: true,
      fallbackChannel: 'IN_APP',
    });

    map.set(code, profile);
  }

  return map;
}

const AUTHORITATIVE_NOTIFICATION_PROFILES: ReadonlyMap<string, NotificationProfile> =
  buildAuthoritativeNotificationProfiles();

export const AUTHORITATIVE_NOTIFICATION_PROFILE_COUNT =
  AUTHORITATIVE_NOTIFICATION_PROFILES.size;

/**
 * Resolves the notification capability profile for a jurisdiction.
 * Fails closed (returns null) for any unknown or unsupported jurisdiction.
 */
export function resolveJurisdictionNotificationProfile(
  countryCode: string | null | undefined
): NotificationProfile | null {
  if (!countryCode || typeof countryCode !== 'string') return null;
  const cleanCode = countryCode.trim().toUpperCase();
  return AUTHORITATIVE_NOTIFICATION_PROFILES.get(cleanCode) || null;
}

/**
 * Returns all 46 authoritative notification profiles.
 */
export function getAllAuthoritativeNotificationProfiles(): readonly NotificationProfile[] {
  return Array.from(AUTHORITATIVE_NOTIFICATION_PROFILES.values());
}
