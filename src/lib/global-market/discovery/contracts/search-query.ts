/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Search & Discovery Contracts
 *
 * Implements search criteria, nearby parameters, and discovery result structures.
 */

import { type Coordinates, type GlobalLocation } from '@/lib/global-market/location/contracts/location';
import { type ListingPriceStructure } from '@/lib/global-market/pricing/contracts/pricing-model';
import { type ListingLifecycleStatus } from '@/lib/global-market/supply/contracts/listing-lifecycle';

export type SearchSortOption = 'recent' | 'price_asc' | 'price_desc' | 'distance';

export interface NearbySearchCriteria {
  readonly center?: Coordinates;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly radiusKm: number;
}

export interface GlobalSearchQuery {
  readonly query?: string;
  readonly queryText?: string; // Alias
  readonly jurisdictionCode?: string; // Country filter (e.g. 'PH', 'TH', 'US')
  readonly countryCode?: string; // Alias
  readonly categoryId?: string;
  readonly categorySlug?: string;
  readonly locality?: string; // City / Town
  readonly nearby?: NearbySearchCriteria;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly currency?: string;
  readonly sort?: SearchSortOption;
  readonly page?: number;
  readonly pageSize?: number;
  readonly isPublic?: boolean; // When true (default), strictly queries PUBLISHED listings
}

export interface SearchResultItem {
  readonly id: string;
  readonly providerId: string;
  readonly countryCode: string;
  readonly jurisdictionCode: string;
  readonly categoryId: string;
  readonly categorySlug?: string;
  readonly title: string;
  readonly description?: string;
  readonly location: GlobalLocation; // Public masked location
  readonly publicLocation?: GlobalLocation; // Alias
  readonly pricing: ListingPriceStructure;
  readonly status: ListingLifecycleStatus;
  readonly publishedAt?: string | null;
  readonly distanceKm?: number;
  readonly photosCount: number;
}

export interface GlobalSearchResponse {
  readonly items: readonly SearchResultItem[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasMore: boolean;
  readonly searchJurisdiction?: string;
}
