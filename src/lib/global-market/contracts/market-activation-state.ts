/**
 * RENTipid GLOBAL-MKT / v2.0 — Commercial Activation State Contract
 *
 * Implements the governed commercial activation lifecycle state machine
 * defined in GLOBAL_MARKET_ACTIVATION_CONTRACT.md.
 */

export const MARKET_ACTIVATION_STATES = [
  'REGISTERED',
  'FOUNDATION_READY',
  'COMPLIANCE_VALIDATED',
  'KYC_READY',
  'PAYMENT_READY',
  'PAYOUT_READY',
  'MARKETPLACE_READY',
  'LOCAL_ACCEPTED',
  'PREVIEW_ACCEPTED',
  'PRODUCTION_ACCEPTED',
  'OWNER_ACCEPTED',
  'ACTIVE',
  'SUSPENDED',
  'BLOCKED',
] as const;

export type MarketActivationState = (typeof MARKET_ACTIVATION_STATES)[number];

export const ALL_ACTIVATION_STATES: readonly MarketActivationState[] = Object.freeze([...MARKET_ACTIVATION_STATES]);

/**
 * Sequential progression order for normal linear activation promotions.
 * SUSPENDED and BLOCKED represent exceptional holds and are handled separately.
 */
export const ACTIVATION_STATE_PROGRESSION: readonly MarketActivationState[] = Object.freeze([
  'REGISTERED',
  'FOUNDATION_READY',
  'COMPLIANCE_VALIDATED',
  'KYC_READY',
  'PAYMENT_READY',
  'PAYOUT_READY',
  'MARKETPLACE_READY',
  'LOCAL_ACCEPTED',
  'PREVIEW_ACCEPTED',
  'PRODUCTION_ACCEPTED',
  'OWNER_ACCEPTED',
  'ACTIVE',
]);

/**
 * Compares whether the current activation state meets or exceeds a target state in the progression.
 * Returns false if either state is non-linear ('SUSPENDED' or 'BLOCKED') or if current is lower.
 */
export function isActivationStateAtLeast(
  currentState: MarketActivationState,
  targetState: MarketActivationState
): boolean {
  if (currentState === 'SUSPENDED' || currentState === 'BLOCKED') return false;
  if (targetState === 'SUSPENDED' || targetState === 'BLOCKED') return false;

  const currentIndex = ACTIVATION_STATE_PROGRESSION.indexOf(currentState);
  const targetIndex = ACTIVATION_STATE_PROGRESSION.indexOf(targetState);

  if (currentIndex === -1 || targetIndex === -1) return false;
  return currentIndex >= targetIndex;
}
