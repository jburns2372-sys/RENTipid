/**
 * RENTipid GLCC v1.0 — Approved Production FX Policy & Configuration
 *
 * Work Package: GLCC-P5B
 * Owner Decision Authority: 2026-09-26
 *
 * Encapsulates the 6 Owner-Approved FX Production Policies:
 * 1. Live FX Provider: CurrencyAPI (Medium Plan)
 * 2. Browse Rate Freshness TTL: 300,000 ms (5 minutes)
 * 3. Checkout Quote Freshness TTL: 120,000 ms (120 seconds)
 * 4. Outlier Deviation Threshold: 5.00% (0.05)
 * 5. Commercial Rounding Policy: ROUND_HALF_UP
 * 6. Fee / Spread Policy: feePolicyRef = 'NONE', spreadPolicyRef = 'NONE' (0 bps markup)
 *
 * Invariants:
 * - Payment charge currency remains strictly PHP.
 * - Converted display amounts are informational estimates only.
 * - Zero hidden markups or unapproved rate modifiers.
 */

import type {
  FxFreshnessPolicy,
  FxFeePolicy,
  FxOutlierPolicy,
  FxRoundingPolicyRef,
} from './fx-contracts';

/**
 * Authoritative record of Owner Decision and Approval.
 */
export const GLCC_P5_OWNER_DECISION_METADATA = Object.freeze({
  approvedAt: '2026-09-26',
  authorizedProvider: 'CurrencyAPI',
  authorizedPlan: 'CurrencyAPI Medium',
  policyVersion: '1.0.0',
  authority: 'Owner Directive: GLCC-P5B Authorization (2026-09-26)',
} as const);

/**
 * Approved Live Provider Constants
 */
export const APPROVED_FX_PROVIDER_ID = 'currencyapi' as const;
export const APPROVED_FX_PROVIDER_NAME = 'CurrencyAPI' as const;
export const APPROVED_FX_BASE_URL = 'https://api.currencyapi.com' as const;
export const DEFAULT_PROVIDER_TIMEOUT_MS = 5_000 as const; // 5 seconds bounded timeout

/**
 * Decision 2: Approved Browse Rate Freshness TTL = 5 minutes (300,000 ms)
 */
export const APPROVED_BROWSE_FRESHNESS_MS = 300_000 as const;

/**
 * Decision 3: Approved Checkout Quote Freshness TTL = 120 seconds (120,000 ms)
 * Note: P5B tests this policy. Checkout foreign charging remains excluded (P6).
 */
export const APPROVED_CHECKOUT_FRESHNESS_MS = 120_000 as const;

/**
 * Decision 4: Approved Outlier Deviation Threshold = 5.00% (0.05)
 */
export const APPROVED_MAX_DEVIATION_PERCENTAGE = '0.05' as const;

/**
 * Decision 5: Approved Commercial Rounding Policy = ROUND_HALF_UP
 */
export const APPROVED_ROUNDING_POLICY: FxRoundingPolicyRef = 'ROUND_HALF_UP' as const;

/**
 * Decision 6: Approved Fee and Spread Policy = NONE (0 basis points)
 */
export const APPROVED_FEE_POLICY_REF = 'NONE' as const;
export const APPROVED_SPREAD_POLICY_REF = 'NONE' as const;

/**
 * Returns the immutable, Owner-approved production freshness policy.
 */
export function getApprovedFreshnessPolicy(): FxFreshnessPolicy {
  return Object.freeze({
    browseFreshnessMs: APPROVED_BROWSE_FRESHNESS_MS,
    checkoutFreshnessMs: APPROVED_CHECKOUT_FRESHNESS_MS,
    policySource: 'CONFIGURED_POLICY',
  });
}

/**
 * Returns the immutable, Owner-approved production outlier policy.
 */
export function getApprovedOutlierPolicy(): FxOutlierPolicy {
  return Object.freeze({
    outlierPolicyRef: 'APPROVED_P5_OUTLIER_5PCT',
    maxDeviationPercentage: APPROVED_MAX_DEVIATION_PERCENTAGE,
    baselineRateSource: 'PREVIOUS_CACHE',
  });
}

/**
 * Returns the immutable, Owner-approved production fee & spread policy (0 markup).
 */
export function getApprovedFeePolicy(): FxFeePolicy {
  return Object.freeze({
    feePolicyRef: APPROVED_FEE_POLICY_REF,
    spreadPolicyRef: APPROVED_SPREAD_POLICY_REF,
    spreadBps: 0,
  });
}
