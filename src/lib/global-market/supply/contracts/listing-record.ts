/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Listing Record Contract
 *
 * Implements the unified listing data model integrating location, pricing,
 * provider ownership, and publication state.
 */

import { type GlobalLocation } from '@/lib/global-market/location/contracts/location';
import { type ListingPriceStructure } from '@/lib/global-market/pricing/contracts/pricing-model';
import { type ListingLifecycleState } from './listing-lifecycle';

export interface GlobalListingRecord {
  readonly id: string;
  readonly providerId: string;
  readonly countryCode?: string; // ISO 3166-1 alpha-2
  readonly jurisdictionCode: string; // ISO 3166-1 alpha-2 or JUR-XX
  readonly categoryId: string;
  readonly categorySlug?: string;
  readonly title: string;
  readonly description?: string;
  readonly location: GlobalLocation;
  readonly pricing: ListingPriceStructure;
  readonly status: ListingLifecycleState;
  readonly publishedAt?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly photos?: readonly string[];
  readonly photosCount: number;
  readonly isTestData: boolean;
}

export interface ListingDraftInput {
  readonly providerId?: string;
  readonly countryCode?: string;
  readonly jurisdictionCode?: string;
  readonly categoryId: string;
  readonly categorySlug?: string;
  readonly title: string;
  readonly description?: string;
  readonly location: GlobalLocation;
  readonly pricing: ListingPriceStructure | any;
  readonly photos?: readonly string[];
  readonly isTestData?: boolean;
}
