/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Location Contract
 *
 * Implements the unified, jurisdiction-neutral location representation.
 * Supports exact coordinates, hierarchical administrative divisions,
 * and privacy precision masking.
 */

export const LOCATION_PRECISIONS = [
  'EXACT',
  'LOCALITY_ONLY',
  'DISTRICT_ONLY',
  'COUNTRY_ONLY',
] as const;

export type LocationPrecision = (typeof LOCATION_PRECISIONS)[number];

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface GlobalLocation {
  readonly countryCode: string; // ISO 3166-1 alpha-2
  readonly formattedAddress?: string;
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly administrativeAreaLevel1?: string; // State / Province / Region
  readonly administrativeAreaLevel2?: string; // County / Prefecture / District
  readonly locality?: string; // City / Municipality
  readonly sublocality?: string; // Barangay / Neighborhood / Ward
  readonly district?: string;
  readonly postalCode?: string;
  readonly coordinates?: Coordinates;
  readonly timezone?: string;
  readonly precision: LocationPrecision;
  readonly providerPlaceId?: string;
}

/**
 * Validates latitude strictly between -90 and +90 degrees.
 */
export function isValidLatitude(lat: unknown): lat is number {
  if (typeof lat !== 'number' || isNaN(lat)) return false;
  return lat >= -90 && lat <= 90;
}

/**
 * Validates longitude strictly between -180 and +180 degrees.
 */
export function isValidLongitude(lng: unknown): lng is number {
  if (typeof lng !== 'number' || isNaN(lng)) return false;
  return lng >= -180 && lng <= 180;
}

/**
 * Validates a coordinate pair.
 */
export function validateCoordinates(coords: unknown): { valid: boolean; reason?: string } {
  if (!coords || typeof coords !== 'object') {
    return { valid: false, reason: 'Coordinates must be an object with latitude and longitude.' };
  }
  const { latitude, longitude } = coords as any;
  if (!isValidLatitude(latitude)) {
    return { valid: false, reason: `Invalid latitude: ${latitude}. Must be between -90 and +90.` };
  }
  if (!isValidLongitude(longitude)) {
    return { valid: false, reason: `Invalid longitude: ${longitude}. Must be between -180 and +180.` };
  }
  return { valid: true };
}

/**
 * Sanitizes coordinates by clamping them to 6 decimal places (~10cm precision).
 * Returns null if coordinates are invalid.
 */
export function sanitizeCoordinates(coords: unknown): Coordinates | null {
  const val = validateCoordinates(coords);
  if (!val.valid) return null;
  const { latitude, longitude } = coords as Coordinates;
  return Object.freeze({
    latitude: Math.round(latitude * 1e6) / 1e6,
    longitude: Math.round(longitude * 1e6) / 1e6,
  });
}

