/**
 * RENTipid GLOBAL-MKT / v2.0 — Geocoding Provider Adapter Interface
 *
 * Implements the provider-neutral abstraction layer for geocoding,
 * reverse geocoding, and address autocompletion.
 */

import { type Coordinates, type GlobalLocation } from '../contracts/location';

export interface GeocodingResult {
  readonly success: boolean;
  readonly coordinates?: Coordinates;
  readonly formattedAddress?: string;
  readonly location?: GlobalLocation;
  readonly confidence?: number;
  readonly providerName: string;
}

export interface ReverseGeocodingResult {
  readonly success: boolean;
  readonly location?: GlobalLocation;
  readonly formattedAddress?: string;
  readonly providerName: string;
}

export interface AddressSuggestion {
  readonly placeId: string;
  readonly description: string;
  readonly mainText: string;
  readonly secondaryText?: string;
}

export interface IGeocodingProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly isConfigured: boolean;

  geocode(address: string, countryCode?: string): Promise<GeocodingResult>;
  reverseGeocode(coords: Coordinates): Promise<ReverseGeocodingResult>;
  autocomplete(query: string, countryCode?: string): Promise<readonly AddressSuggestion[]>;
  normalizeAddress(raw: Partial<GlobalLocation>): GlobalLocation;
}
