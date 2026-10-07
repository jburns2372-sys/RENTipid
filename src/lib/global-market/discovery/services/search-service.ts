/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Search & Discovery Service
 *
 * Implements:
 * 1. Global Multi-Jurisdiction Search & International Discovery.
 * 2. Strict Public Visibility Gate (Hides DRAFT, REJECTED, SUSPENDED, ARCHIVED).
 * 3. Bounded Nearby Geosearch via Haversine Distance.
 * 4. Coordinate & Boundary Input Validation.
 * 5. Safe Location Privacy Masking (Never leaks private street address or exact coords).
 * 6. Stable Sorting & Bounded Pagination.
 */

import {
  type GlobalSearchQuery,
  type GlobalSearchResponse,
  type SearchResultItem,
} from '../contracts/search-query';

import {
  type Coordinates,
  validateCoordinates,
} from '@/lib/global-market/location/contracts/location';

import {
  calculateDistanceKm,
  toPublicLocation,
} from '@/lib/global-market/location/services/location-service';

import {
  type GlobalListingRecord,
} from '@/lib/global-market/supply/contracts/listing-record';

import { isPubliclyDiscoverable } from '@/lib/global-market/supply/contracts/listing-lifecycle';
import { resolveOperatingJurisdiction } from '@/lib/global-market/account/services/account-service';

export function validateSearchQuery(query: GlobalSearchQuery): { valid: boolean; errors: readonly string[] } {
  const errors: string[] = [];

  const rawCountry = query.countryCode || query.jurisdictionCode;
  if (rawCountry) {
    const resolved = resolveOperatingJurisdiction(rawCountry);
    if (!resolved) {
      errors.push(`UNKNOWN_JURISDICTION: Cannot search in unknown country '${rawCountry}'.`);
    }
  }

  if (query.nearby) {
    const centerCoords: Coordinates = query.nearby.center || {
      latitude: query.nearby.latitude ?? NaN,
      longitude: query.nearby.longitude ?? NaN,
    };

    const coordVal = validateCoordinates(centerCoords);
    if (!coordVal.valid) {
      errors.push(`Nearby center coordinate error: ${coordVal.reason}`);
    }

    if (typeof query.nearby.radiusKm !== 'number' || isNaN(query.nearby.radiusKm) || query.nearby.radiusKm <= 0) {
      errors.push(`Nearby radius must be a positive number, got ${query.nearby.radiusKm}.`);
    } else if (query.nearby.radiusKm > 500) {
      errors.push(`Nearby radius cannot exceed 500 km, got ${query.nearby.radiusKm}.`);
    }
  }

  if (query.minPrice !== undefined && (typeof query.minPrice !== 'number' || query.minPrice < 0)) {
    errors.push('minPrice cannot be negative.');
  }

  if (query.maxPrice !== undefined && (typeof query.maxPrice !== 'number' || query.maxPrice < 0)) {
    errors.push('maxPrice cannot be negative.');
  }

  if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
    errors.push('minPrice cannot exceed maxPrice.');
  }

  if (query.page !== undefined && query.page < 1) {
    errors.push('page must be greater than or equal to 1.');
  }

  if (query.pageSize !== undefined && (query.pageSize < 1 || query.pageSize > 100)) {
    errors.push('pageSize must be between 1 and 100.');
  }

  return {
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  };
}

/**
 * Searches listings across jurisdictions with visibility gating, nearby geosearch,
 * filtering, sorting, and pagination.
 *
 * Supports flexible argument order: (listings, query) OR (query, listings).
 */
export function searchListings(
  arg1: readonly GlobalListingRecord[] | GlobalSearchQuery,
  arg2: readonly GlobalListingRecord[] | GlobalSearchQuery
): GlobalSearchResponse {
  let allListings: readonly GlobalListingRecord[];
  let query: GlobalSearchQuery;

  if (Array.isArray(arg1)) {
    allListings = arg1;
    query = (arg2 || {}) as GlobalSearchQuery;
  } else if (Array.isArray(arg2)) {
    allListings = arg2;
    query = (arg1 || {}) as GlobalSearchQuery;
  } else {
    allListings = [];
    query = (arg1 || {}) as GlobalSearchQuery;
  }

  const validation = validateSearchQuery(query);
  if (!validation.valid) {
    throw new Error(`INVALID_SEARCH_QUERY: ${validation.errors.join(' ')}`);
  }

  const isPublic = query.isPublic !== false; // Default true: strictly public search
  const page = query.page && query.page >= 1 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize >= 1 ? Math.min(query.pageSize, 100) : 20;

  // 1. Visibility Filter (Section 25: Public search must NOT surface Draft, Rejected, Suspended, Archived)
  let filtered = allListings.filter(listing => {
    if (isPublic && !isPubliclyDiscoverable(listing.status)) {
      return false;
    }
    return true;
  });

  // 2. Jurisdiction Filter
  const targetCountry = query.countryCode || query.jurisdictionCode;
  if (targetCountry) {
    const resolvedTarget = resolveOperatingJurisdiction(targetCountry);
    filtered = filtered.filter(l => {
      const listingCountry = resolveOperatingJurisdiction(l.countryCode) || resolveOperatingJurisdiction(l.jurisdictionCode);
      return listingCountry === resolvedTarget;
    });
  }

  // 3. Category Filter
  if (query.categoryId) {
    filtered = filtered.filter(l => l.categoryId === query.categoryId);
  }
  if (query.categorySlug) {
    const slug = query.categorySlug.toLowerCase();
    filtered = filtered.filter(l => l.categorySlug?.toLowerCase() === slug);
  }

  // 4. Locality / City Filter
  if (query.locality) {
    const locLower = query.locality.toLowerCase().trim();
    filtered = filtered.filter(l => {
      const matchLocality = l.location.locality?.toLowerCase().includes(locLower);
      const matchAdmin1 = l.location.administrativeAreaLevel1?.toLowerCase().includes(locLower);
      const matchFormatted = l.location.formattedAddress?.toLowerCase().includes(locLower);
      return Boolean(matchLocality || matchAdmin1 || matchFormatted);
    });
  }

  // 5. Text Query Filter
  const textQuery = (query.query || query.queryText || '').toLowerCase().trim();
  if (textQuery) {
    filtered = filtered.filter(l => {
      const titleMatch = l.title.toLowerCase().includes(textQuery);
      const descMatch = l.description?.toLowerCase().includes(textQuery);
      const catMatch = l.categorySlug?.toLowerCase().includes(textQuery);
      return Boolean(titleMatch || descMatch || catMatch);
    });
  }

  // 6. Nearby Geo Filtering & Distance Calculation (Section 28)
  const itemsWithDistance: { listing: GlobalListingRecord; distanceKm?: number }[] = [];

  const nearbyCriteria = query.nearby;
  const nearbyCenter: Coordinates | undefined = nearbyCriteria
    ? nearbyCriteria.center || {
        latitude: nearbyCriteria.latitude ?? 0,
        longitude: nearbyCriteria.longitude ?? 0,
      }
    : undefined;

  for (const listing of filtered) {
    if (nearbyCriteria && nearbyCenter) {
      if (!listing.location.coordinates) {
        continue; // Exclude listings without coordinates from nearby radius query
      }
      const dist = calculateDistanceKm(nearbyCenter, listing.location.coordinates);
      if (dist <= nearbyCriteria.radiusKm) {
        itemsWithDistance.push({ listing, distanceKm: dist });
      }
    } else {
      itemsWithDistance.push({ listing });
    }
  }

  // Helper to extract base rate cents from either format
  const getPriceCents = (p: any): number => {
    return p?.baseRateCents ?? p?.baseRate?.amountCents ?? 0;
  };

  // 7. Price Bound Filtering (Section 17)
  let priceFiltered = itemsWithDistance;
  if (query.minPrice !== undefined) {
    priceFiltered = priceFiltered.filter(item => {
      const amountDecimal = getPriceCents(item.listing.pricing) / 100;
      return amountDecimal >= query.minPrice!;
    });
  }
  if (query.maxPrice !== undefined) {
    priceFiltered = priceFiltered.filter(item => {
      const amountDecimal = getPriceCents(item.listing.pricing) / 100;
      return amountDecimal <= query.maxPrice!;
    });
  }

  // 8. Sorting
  const sort = query.sort || 'recent';
  priceFiltered.sort((a, b) => {
    switch (sort) {
      case 'price_asc':
        return getPriceCents(a.listing.pricing) - getPriceCents(b.listing.pricing);
      case 'price_desc':
        return getPriceCents(b.listing.pricing) - getPriceCents(a.listing.pricing);
      case 'distance':
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      case 'recent':
      default: {
        const timeA = new Date(a.listing.publishedAt || a.listing.createdAt).getTime();
        const timeB = new Date(b.listing.publishedAt || b.listing.createdAt).getTime();
        return timeB - timeA;
      }
    }
  });

  // 9. Pagination (Section 29)
  const totalCount = priceFiltered.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const pageItems = priceFiltered.slice(startIndex, startIndex + pageSize);

  // 10. Map to public search result items (Section 21: privacy masking)
  const items: SearchResultItem[] = pageItems.map(({ listing, distanceKm }) => {
    const publicLoc = toPublicLocation(listing.location);
    const country = listing.countryCode || resolveOperatingJurisdiction(listing.jurisdictionCode) || 'PH';
    return Object.freeze({
      id: listing.id,
      providerId: listing.providerId,
      countryCode: country,
      jurisdictionCode: listing.jurisdictionCode,
      categoryId: listing.categoryId,
      categorySlug: listing.categorySlug,
      title: listing.title,
      description: listing.description,
      location: publicLoc,
      publicLocation: publicLoc,
      pricing: listing.pricing,
      status: listing.status,
      publishedAt: listing.publishedAt,
      distanceKm: distanceKm !== undefined ? Math.round(distanceKm * 100) / 100 : undefined,
      photosCount: listing.photos?.length || listing.photosCount || 0,
    });
  });

  return Object.freeze({
    items: Object.freeze(items),
    totalCount,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
    searchJurisdiction: query.countryCode || query.jurisdictionCode,
  });
}
