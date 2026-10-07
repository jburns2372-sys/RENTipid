/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Restricted Category Engine
 *
 * Implements server-authoritative category clearance, prohibited items enforcement,
 * and fail-closed security guards across all 46 markets.
 *
 * PERMANENT INVARIANTS:
 * - PROHIBITED CATEGORIES FAIL CLOSED IN ALL 46 JURISDICTIONS.
 * - UNKNOWN CATEGORIES FAIL CLOSED.
 * - UNKNOWN JURISDICTION FAILS CLOSED.
 */

import {
  type CategoryEvaluationOutcome,
} from '../contracts/category-policy';
import {
  resolveCategoryPolicy,
} from '../registry/jurisdiction-category-policy-registry';

export interface CategoryPolicyEvaluationResult {
  readonly outcome: CategoryEvaluationOutcome;
  readonly canList: boolean;
  readonly canSearch: boolean;
  readonly canBook: boolean;
  readonly rejectionReason?: string;
}

/**
 * Authoritatively evaluates the category policy for a listing or search context.
 */
export function evaluateCategoryPolicy(
  jurisdictionCode: string,
  categorySlug: string
): CategoryPolicyEvaluationResult {
  const outcome = resolveCategoryPolicy(jurisdictionCode, categorySlug);

  return Object.freeze({
    outcome,
    canList: outcome.isAllowedForListing,
    canSearch: outcome.isAllowedForSearch,
    canBook: outcome.isAllowedForBooking,
    rejectionReason: !outcome.isAllowedForListing ? outcome.userGuidance : undefined,
  });
}

/**
 * Enforces server-side gate on listing creation/publication.
 */
export function isListingAllowed(jurisdictionCode: string, categorySlug: string): boolean {
  const result = evaluateCategoryPolicy(jurisdictionCode, categorySlug);
  return result.canList;
}

/**
 * Enforces search discovery visibility for a category.
 */
export function isSearchAllowed(jurisdictionCode: string, categorySlug: string): boolean {
  const result = evaluateCategoryPolicy(jurisdictionCode, categorySlug);
  return result.canSearch;
}

/**
 * Enforces booking checkout gate for a category.
 */
export function isBookingAllowed(jurisdictionCode: string, categorySlug: string): boolean {
  const result = evaluateCategoryPolicy(jurisdictionCode, categorySlug);
  return result.canBook;
}
