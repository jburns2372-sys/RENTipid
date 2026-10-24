import { normalizeAddress } from '../../address/normalizer';
import type { NormalizedAddress } from '../../address/types';
import type { ListingBridgeConfidenceState } from '../types/canonical-contract';

export interface LocationConflict {
  readonly code: string;
  readonly message: string;
  readonly severity: 'BLOCKING' | 'OPTIONAL';
}

export interface LocationIntelligenceResult {
  readonly normalizedAddress: NormalizedAddress;
  readonly confidence: ListingBridgeConfidenceState;
  readonly isWithinPhilippineBounds: boolean;
  readonly conflicts: readonly LocationConflict[];
  readonly requiresReview: boolean;
}

export interface RawLocationInput {
  readonly rawLocationString?: string;
  readonly city?: string;
  readonly province?: string;
  readonly country?: string;
  readonly postalCode?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

// Known approximate bounds for the Philippines
const PH_BOUNDS = Object.freeze({
  minLat: 4.5,
  maxLat: 21.5,
  minLng: 116.0,
  maxLng: 127.0,
});

export class ListingBridgeLocationIntelligenceService {
  evaluate(input: RawLocationInput): LocationIntelligenceResult {
    const conflicts: LocationConflict[] = [];

    // 1. Coordinates range validation
    const hasLat = input.latitude !== undefined && input.latitude !== null;
    const hasLng = input.longitude !== undefined && input.longitude !== null;

    let validCoords = false;
    let inPhBounds = false;

    if (hasLat && hasLng) {
      const lat = input.latitude as number;
      const lng = input.longitude as number;

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        conflicts.push({
          code: 'LOCATION_INVALID_LATITUDE',
          message: `Latitude ${lat} is outside valid range [-90, 90]`,
          severity: 'BLOCKING',
        });
      } else if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        conflicts.push({
          code: 'LOCATION_INVALID_LONGITUDE',
          message: `Longitude ${lng} is outside valid range [-180, 180]`,
          severity: 'BLOCKING',
        });
      } else {
        validCoords = true;
        inPhBounds = lat >= PH_BOUNDS.minLat
          && lat <= PH_BOUNDS.maxLat
          && lng >= PH_BOUNDS.minLng
          && lng <= PH_BOUNDS.maxLng;
      }
    }

    // 2. Normalize address via standard RENTipid normalizer
    const norm = normalizeAddress({
      addressLine1: input.rawLocationString || input.city || null,
      locality: input.city || null,
      administrativeArea1: input.province || null,
      countryCode: input.country ? (input.country.toLowerCase().includes('ph') ? 'PH' : input.country) : 'PH',
      postalCode: input.postalCode || null,
      latitude: validCoords ? (input.latitude as number) : null,
      longitude: validCoords ? (input.longitude as number) : null,
      validationStatus: validCoords ? 'VERIFIED' : 'UNVERIFIED',
    });

    // 3. Coordinate vs Country / Regional Conflict
    const isPhAddress = !norm.countryCode || norm.countryCode === 'PH' || norm.countryCode.toLowerCase().includes('philippines');
    if (validCoords && isPhAddress && !inPhBounds) {
      conflicts.push({
        code: 'LOCATION_COORDINATES_COUNTRY_MISMATCH',
        message: `Coordinates (${input.latitude}, ${input.longitude}) fall outside Philippine territory for a Philippine listing`,
        severity: 'BLOCKING',
      });
    }

    // 4. Missing required address fields
    if (!norm.locality && !norm.addressLine1) {
      conflicts.push({
        code: 'LOCATION_CITY_MISSING',
        message: 'City or formatted address string is required',
        severity: 'BLOCKING',
      });
    }

    // 5. Determine overall location confidence
    let confidence: ListingBridgeConfidenceState = 'HIGH_CONFIDENCE';

    if (conflicts.some((c) => c.severity === 'BLOCKING')) {
      confidence = 'CONFLICT';
    } else if (!validCoords || !norm.locality) {
      confidence = 'REVIEW_RECOMMENDED';
    }

    return Object.freeze({
      normalizedAddress: norm,
      confidence,
      isWithinPhilippineBounds: inPhBounds,
      conflicts: Object.freeze(conflicts),
      requiresReview: confidence !== 'HIGH_CONFIDENCE',
    });
  }
}
