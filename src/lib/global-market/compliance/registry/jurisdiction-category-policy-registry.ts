/**
 * RENTipid GLOBAL-MKT / v2.0 — 46-Country Category Policy Registry
 *
 * Dynamically resolves category policy outcomes across all 14 canonical marketplace
 * categories and prohibited categories for all 46 authoritative countries.
 *
 * PERMANENT INVARIANT:
 * - PROHIBITED CATEGORIES FAIL CLOSED IN ALL 46 JURISDICTIONS.
 * - UNKNOWN CATEGORIES FAIL CLOSED.
 * - UNKNOWN JURISDICTION FAILS CLOSED (returns null).
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import {
  type CategoryEvaluationOutcome,
  type ExtendedCategoryPolicyStatus,
} from '../contracts/category-policy';

export const CANONICAL_MARKETPLACE_CATEGORIES = [
  'condominiums',
  'rooms',
  'beach-resorts',
  'event-venues',
  'cameras-and-gadgets',
  'cars-and-motorcycles',
  'trucks-and-commercial-vehicles',
  'construction-equipment',
  'heavy-equipment',
  'tools',
  'boats',
  'aircraft-charter',
  'office-equipment',
  'event-equipment',
] as const;

export const PROHIBITED_CATEGORIES = [
  'weapons-and-firearms',
  'illegal-drugs-and-substances',
  'hazardous-and-toxic-materials',
  'counterfeit-and-stolen-goods',
  'adult-services-and-items',
] as const;

export interface CountryCategoryPolicyBundle {
  readonly jurisdictionCode: string;
  readonly countryName: string;
  readonly categories: ReadonlyMap<string, CategoryEvaluationOutcome>;
}

function evaluateCategoryForCountry(
  categorySlug: string,
  countryCode: string
): CategoryEvaluationOutcome {
  const isDomesticPH = countryCode === 'PH';
  const slug = categorySlug.toLowerCase().trim();

  // 1. Prohibited Categories (Globally Prohibited)
  if ((PROHIBITED_CATEGORIES as readonly string[]).includes(slug)) {
    return Object.freeze({
      categorySlug: slug,
      jurisdictionCode: countryCode,
      status: 'PROHIBITED',
      isAllowedForListing: false,
      isAllowedForSearch: false,
      isAllowedForBooking: false,
      requiresProviderVerification: true,
      requiresPermitOrLicense: false,
      reasonCode: 'GLOBAL_PROHIBITED_CATEGORY',
      userGuidance: 'This item or service is strictly prohibited on RENTipid across all jurisdictions.',
    });
  }

  // 2. Unrecognized Categories
  if (!(CANONICAL_MARKETPLACE_CATEGORIES as readonly string[]).includes(slug as any)) {
    return Object.freeze({
      categorySlug: slug,
      jurisdictionCode: countryCode,
      status: 'UNKNOWN',
      isAllowedForListing: false,
      isAllowedForSearch: false,
      isAllowedForBooking: false,
      requiresProviderVerification: true,
      requiresPermitOrLicense: true,
      reasonCode: 'UNRECOGNIZED_CATEGORY',
      userGuidance: 'Category is not recognized in the authoritative marketplace catalog.',
    });
  }

  // 3. Domestic Philippines Policies
  if (isDomesticPH) {
    if (['aircraft-charter', 'boats'].includes(slug)) {
      return Object.freeze({
        categorySlug: slug,
        jurisdictionCode: 'PH',
        status: 'LICENSE_REQUIRED',
        isAllowedForListing: true,
        isAllowedForSearch: true,
        isAllowedForBooking: true,
        requiresProviderVerification: true,
        requiresPermitOrLicense: true,
        reasonCode: 'MARITIME_AVIATION_LICENSE_MANDATE',
        userGuidance: 'Operators must provide verified CAAP or MARINA commercial charter licenses.',
      });
    }

    if (['cars-and-motorcycles', 'trucks-and-commercial-vehicles'].includes(slug)) {
      return Object.freeze({
        categorySlug: slug,
        jurisdictionCode: 'PH',
        status: 'CONDITIONALLY_ALLOWED',
        isAllowedForListing: true,
        isAllowedForSearch: true,
        isAllowedForBooking: true,
        requiresProviderVerification: true,
        requiresPermitOrLicense: true,
        reasonCode: 'VEHICLE_REGISTRATION_MANDATE',
        userGuidance: 'Vehicle rental requires valid LTO registration and commercial or comprehensive insurance.',
      });
    }

    if (['heavy-equipment', 'construction-equipment'].includes(slug)) {
      return Object.freeze({
        categorySlug: slug,
        jurisdictionCode: 'PH',
        status: 'CONDITIONALLY_ALLOWED',
        isAllowedForListing: true,
        isAllowedForSearch: true,
        isAllowedForBooking: true,
        requiresProviderVerification: true,
        requiresPermitOrLicense: false,
        reasonCode: 'HEAVY_EQUIPMENT_SAFETY_CHECK',
        userGuidance: 'Providers must attest to operating safety checks and maintenance records.',
      });
    }

    // Standard consumer goods, venues, rooms, tools
    return Object.freeze({
      categorySlug: slug,
      jurisdictionCode: 'PH',
      status: 'ALLOWED',
      isAllowedForListing: true,
      isAllowedForSearch: true,
      isAllowedForBooking: true,
      requiresProviderVerification: false,
      requiresPermitOrLicense: false,
      reasonCode: 'STANDARD_MARKETPLACE_CATEGORY',
    });
  }

  // 4. Southeast Asia Batch 2 Specific Vehicle Rules
  if (['cars-and-motorcycles', 'trucks-and-commercial-vehicles'].includes(slug) && ['TH', 'SG', 'MY', 'VN', 'ID'].includes(countryCode)) {
    return Object.freeze({
      categorySlug: slug,
      jurisdictionCode: countryCode,
      status: 'CONDITIONALLY_ALLOWED',
      isAllowedForListing: true,
      isAllowedForSearch: true,
      isAllowedForBooking: true,
      requiresProviderVerification: true,
      requiresPermitOrLicense: true,
      reasonCode: 'REGIONAL_VEHICLE_REGISTRATION_MANDATE',
      userGuidance: 'Vehicle rental requires valid domestic registration and comprehensive commercial rental insurance.',
    });
  }

  // 5. International Countries (Conservative Policy)
  if (['aircraft-charter', 'boats', 'heavy-equipment'].includes(slug)) {
    return Object.freeze({
      categorySlug: slug,
      jurisdictionCode: countryCode,
      status: 'LEGAL_VALIDATION_REQUIRED',
      isAllowedForListing: false, // Guarded until validated
      isAllowedForSearch: false,
      isAllowedForBooking: false,
      requiresProviderVerification: true,
      requiresPermitOrLicense: true,
      reasonCode: 'INTERNATIONAL_CATEGORY_LEGAL_VALIDATION_REQUIRED',
      userGuidance: 'Commercial charter and heavy equipment rentals require local legal and regulatory audit.',
    });
  }

  return Object.freeze({
    categorySlug: slug,
    jurisdictionCode: countryCode,
    status: 'CONDITIONALLY_ALLOWED',
    isAllowedForListing: true,
    isAllowedForSearch: true,
    isAllowedForBooking: true,
    requiresProviderVerification: true,
    requiresPermitOrLicense: false,
    reasonCode: 'INTERNATIONAL_STANDARD_CATEGORY',
    userGuidance: 'Standard marketplace category under international provider verification.',
  });

}

const bundlesByCountry = new Map<string, CountryCategoryPolicyBundle>();

for (const country of GLOBAL_COUNTRY_CATALOG) {
  const categoryMap = new Map<string, CategoryEvaluationOutcome>();

  for (const cat of CANONICAL_MARKETPLACE_CATEGORIES) {
    categoryMap.set(cat, evaluateCategoryForCountry(cat, country.code));
  }
  for (const cat of PROHIBITED_CATEGORIES) {
    categoryMap.set(cat, evaluateCategoryForCountry(cat, country.code));
  }

  bundlesByCountry.set(
    country.code,
    Object.freeze({
      jurisdictionCode: country.code,
      countryName: country.name,
      categories: categoryMap,
    })
  );
}

/**
 * Resolves the CategoryEvaluationOutcome for a specific country and category.
 * Fails closed (returns outcome with status UNKNOWN and not allowed) if country or category is missing.
 */
export function resolveCategoryPolicy(
  jurisdictionCode: string | null | undefined,
  categorySlug: string | null | undefined
): CategoryEvaluationOutcome {
  if (!jurisdictionCode || !categorySlug) {
    return Object.freeze({
      categorySlug: categorySlug || 'UNKNOWN',
      jurisdictionCode: jurisdictionCode || 'UNKNOWN',
      status: 'UNKNOWN',
      isAllowedForListing: false,
      isAllowedForSearch: false,
      isAllowedForBooking: false,
      requiresProviderVerification: true,
      requiresPermitOrLicense: true,
      reasonCode: 'MISSING_JURISDICTION_OR_CATEGORY',
    });
  }

  const upper = jurisdictionCode.trim().toUpperCase();
  const bundle = bundlesByCountry.get(upper);
  if (!bundle) {
    return Object.freeze({
      categorySlug,
      jurisdictionCode: upper,
      status: 'UNKNOWN',
      isAllowedForListing: false,
      isAllowedForSearch: false,
      isAllowedForBooking: false,
      requiresProviderVerification: true,
      requiresPermitOrLicense: true,
      reasonCode: 'UNKNOWN_JURISDICTION',
    });
  }

  const slug = categorySlug.toLowerCase().trim();
  const outcome = bundle.categories.get(slug);
  if (!outcome) {
    return evaluateCategoryForCountry(slug, upper);
  }

  return outcome;
}

/**
 * Returns all 46 country category bundles.
 */
export function getAllAuthoritativeCategoryBundles(): readonly CountryCategoryPolicyBundle[] {
  return Array.from(bundlesByCountry.values());
}
