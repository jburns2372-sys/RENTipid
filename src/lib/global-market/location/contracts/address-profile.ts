/**
 * RENTipid GLOBAL-MKT / v2.0 — Address Profile Contract
 *
 * Defines jurisdiction-specific address schema, field expectations,
 * and geographic division terminology.
 */

import { type GlobalLocation } from './location';

export type AddressFieldKey =
  | 'addressLine1'
  | 'addressLine2'
  | 'administrativeAreaLevel1'
  | 'administrativeAreaLevel2'
  | 'locality'
  | 'sublocality'
  | 'district'
  | 'postalCode'
  | 'coordinates';

export interface AddressProfile {
  readonly countryCode: string; // ISO 3166-1 alpha-2
  readonly countryName: string;
  readonly requiredFields: readonly AddressFieldKey[];
  readonly optionalFields: readonly AddressFieldKey[];
  readonly postalCodeRequired: boolean;
  readonly postalCodeFormat?: string; // Regex pattern description
  readonly administrativeArea1Label: string; // "Province", "State", "Prefecture", "Region"
  readonly localityLabel: string; // "City / Municipality"
  readonly sublocalityLabel?: string; // "Barangay", "Ward", "District"
  readonly coordinatesRequired: boolean;
  readonly psgcSupported: boolean;
  readonly status: 'READY' | 'VALIDATION_REQUIRED' | 'NOT_CONFIGURED';
  readonly knownLimitations: readonly string[];
}
