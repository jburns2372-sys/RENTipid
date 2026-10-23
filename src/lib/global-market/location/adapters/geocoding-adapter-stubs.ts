/**
 * RENTipid GLOBAL-MKT / v2.0 — Geocoding Provider Adapter Stubs
 *
 * Provides conservative adapter stubs strictly classified as NOT_CONFIGURED.
 */

import {
  type IGeocodingProviderAdapter,
  type GeocodingResult,
  type ReverseGeocodingResult,
  type AddressSuggestion,
} from './geocoding-adapter.interface';

import { type Coordinates, type GlobalLocation } from '../contracts/location';

export const KNOWN_GEOCODING_PROVIDERS = [
  'GOOGLE_MAPS',
  'MAPBOX',
  'OPENSTREETMAP_NOMINATIM',
  'HERE',
] as const;

export type KnownGeocodingProvider = (typeof KNOWN_GEOCODING_PROVIDERS)[number];

export class UnconfiguredGeocodingAdapter implements IGeocodingProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly isConfigured: boolean = false;

  constructor(providerId: string = 'GOOGLE_MAPS', providerName: string = 'Google Maps Platform') {
    this.providerId = providerId;
    this.providerName = providerName;
  }

  async geocode(_address: string, _countryCode?: string): Promise<GeocodingResult> {
    return {
      success: false,
      providerName: this.providerName,
    };
  }

  async reverseGeocode(_coords: Coordinates): Promise<ReverseGeocodingResult> {
    return {
      success: false,
      providerName: this.providerName,
    };
  }

  async autocomplete(_query: string, _countryCode?: string): Promise<readonly AddressSuggestion[]> {
    return [];
  }

  normalizeAddress(raw: Partial<GlobalLocation>): GlobalLocation {
    return {
      countryCode: raw.countryCode || 'PH',
      addressLine1: raw.addressLine1,
      addressLine2: raw.addressLine2,
      administrativeAreaLevel1: raw.administrativeAreaLevel1,
      administrativeAreaLevel2: raw.administrativeAreaLevel2,
      locality: raw.locality,
      sublocality: raw.sublocality,
      district: raw.district,
      postalCode: raw.postalCode,
      coordinates: raw.coordinates,
      precision: raw.precision || 'EXACT',
    };
  }
}

export function getGeocodingProviderAdapter(providerId: string = 'GOOGLE_MAPS'): IGeocodingProviderAdapter {
  return new UnconfiguredGeocodingAdapter(providerId);
}
