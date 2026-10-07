/**
 * RENTipid GLOBAL-MKT / v2.0 — Listing Category Policy Contract
 *
 * Defines the category clearance status and restrictions per jurisdiction.
 */

export const CATEGORY_POLICY_STATUSES = [
  'ALLOWED',
  'CONDITIONALLY_ALLOWED',
  'LICENSE_REQUIRED',
  'PROVIDER_VERIFICATION_REQUIRED',
  'MANUAL_REVIEW_REQUIRED',
  'PROHIBITED',
] as const;

export type CategoryPolicyStatus = (typeof CATEGORY_POLICY_STATUSES)[number];

export interface CategoryJurisdictionPolicy {
  readonly categoryId: string;
  readonly categorySlug: string;
  readonly jurisdictionCode: string;
  readonly status: CategoryPolicyStatus;
  readonly requiresPermit: boolean;
  readonly requiresInsurance: boolean;
  readonly requiresDeposit: boolean;
  readonly notes?: string;
}
