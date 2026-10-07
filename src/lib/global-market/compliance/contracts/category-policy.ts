/**
 * RENTipid GLOBAL-MKT / v2.0 — Extended Category Policy Contract
 *
 * Defines controlled category policy outcomes, prohibited item enforcement,
 * and jurisdiction-specific listing rules across all 46 markets.
 */

export const EXTENDED_CATEGORY_POLICY_STATUSES = [
  'ALLOWED',
  'CONDITIONALLY_ALLOWED',
  'VERIFICATION_REQUIRED',
  'LICENSE_REQUIRED',
  'AGE_RESTRICTED',
  'MANUAL_REVIEW_REQUIRED',
  'PROHIBITED',
  'LEGAL_VALIDATION_REQUIRED',
  'UNKNOWN',
] as const;

export type ExtendedCategoryPolicyStatus =
  (typeof EXTENDED_CATEGORY_POLICY_STATUSES)[number];

export interface CategoryEvaluationOutcome {
  readonly categorySlug: string;
  readonly jurisdictionCode: string;
  readonly status: ExtendedCategoryPolicyStatus;
  readonly isAllowedForListing: boolean;
  readonly isAllowedForSearch: boolean;
  readonly isAllowedForBooking: boolean;
  readonly requiresProviderVerification: boolean;
  readonly requiresPermitOrLicense: boolean;
  readonly minimumAge?: number;
  readonly reasonCode: string;
  readonly userGuidance?: string;
}

export interface JurisdictionCategoryRule {
  readonly categorySlug: string;
  readonly status: ExtendedCategoryPolicyStatus;
  readonly requiresPermitOrLicense?: boolean;
  readonly requiresProviderVerification?: boolean;
  readonly minimumAge?: number;
  readonly guidanceNote?: string;
}
