/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Location Domain Service
 *
 * Implements address validation against jurisdiction AddressProfiles,
 * Haversine distance calculations for nearby search, and privacy precision masking.
 */

import {
  type GlobalLocation,
  type Coordinates,
  validateCoordinates,
} from '../contracts/location';

import { type AddressProfile } from '../contracts/address-profile';
import { getJurisdictionAddressProfile } from '../registry/jurisdiction-address-registry';

import { resolveOperatingJurisdiction } from '@/lib/global-market/account/services/account-service';

export interface LocationValidationResult {
  readonly valid: boolean;
  readonly jurisdictionCode?: string;
  readonly missingFields: readonly string[];
  readonly errors: readonly string[];
}

/**
 * Validates a GlobalLocation against its jurisdiction AddressProfile.
 */
export function validateLocation(location: GlobalLocation | null | undefined): LocationValidationResult {
  if (!location) {
    return { valid: false, missingFields: ['countryCode'], errors: ['Location object is required.'] };
  }

  const jurisdictionCode = resolveOperatingJurisdiction(location.countryCode);
  if (!jurisdictionCode) {
    return {
      valid: false,
      missingFields: [],
      errors: [`UNKNOWN_JURISDICTION: Unknown or unsupported country code '${location.countryCode}'. Fail closed.`],
    };
  }

  const profile = getJurisdictionAddressProfile(jurisdictionCode);
  if (!profile) {
    return {
      valid: false,
      jurisdictionCode,
      missingFields: [],
      errors: [`Missing AddressProfile for jurisdiction '${jurisdictionCode}'.`],
    };
  }

  const missing: string[] = [];
  const errors: string[] = [];

  for (const field of profile.requiredFields) {
    const val = (location as any)[field];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim().length === 0)) {
      missing.push(field);
    }
  }

  // Postal code regex validation if pattern is defined
  if (profile.postalCodeRequired && location.postalCode && profile.postalCodeFormat) {
    const regex = new RegExp(profile.postalCodeFormat);
    if (!regex.test(location.postalCode.trim())) {
      errors.push(`Postal code '${location.postalCode}' does not match required format for ${jurisdictionCode}.`);
    }
  }

  // Coordinates validation if provided or required
  if (location.coordinates) {
    const coordRes = validateCoordinates(location.coordinates);
    if (!coordRes.valid) {
      errors.push(coordRes.reason || 'Invalid coordinates.');
    }
  } else if (profile.coordinatesRequired) {
    missing.push('coordinates');
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    jurisdictionCode,
    missingFields: Object.freeze(missing),
    errors: Object.freeze(errors),
  };
}

/**
 * Masks exact private residence/street addresses for public search and discovery.
 * Strips addressLine1, addressLine2, and sets precision to LOCALITY_ONLY.
 */
export function toPublicLocation(location: GlobalLocation): GlobalLocation {
  const parts: string[] = [];
  if (location.locality) parts.push(location.locality);
  if (location.administrativeAreaLevel1) parts.push(location.administrativeAreaLevel1);
  if (location.countryCode) parts.push(location.countryCode);

  return Object.freeze({
    countryCode: location.countryCode,
    locality: location.locality,
    administrativeAreaLevel1: location.administrativeAreaLevel1,
    administrativeAreaLevel2: location.administrativeAreaLevel2,
    sublocality: location.sublocality,
    district: location.district,
    formattedAddress: parts.join(', '),
    coordinates: location.coordinates
      ? {
          latitude: Math.round(location.coordinates.latitude * 100) / 100,
          longitude: Math.round(location.coordinates.longitude * 100) / 100,
        }
      : undefined,
    timezone: location.timezone,
    precision: 'LOCALITY_ONLY',
  });
}

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two coordinate points using the Haversine formula.
 */
export function calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(coord1.latitude);
  const lon1 = toRad(coord1.longitude);
  const lat2 = toRad(coord2.latitude);
  const lon2 = toRad(coord2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10; // Round to 1 decimal place
}
