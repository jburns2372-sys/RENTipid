/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Payout Lifecycle Contracts
 *
 * Implements the 11-state typed provider payout state machine, eligibility transitions,
 * terminal state recognition, and settlement security boundaries.
 */

export const PAYOUT_LIFECYCLE_STATES = [
  'NOT_ELIGIBLE',
  'ELIGIBLE',
  'CREATED',
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REVERSED',
  'HELD',
  'BLOCKED',
] as const;

export type PayoutLifecycleState = (typeof PAYOUT_LIFECYCLE_STATES)[number];

export const ALL_PAYOUT_LIFECYCLE_STATES: readonly PayoutLifecycleState[] = Object.freeze([
  ...PAYOUT_LIFECYCLE_STATES,
]);

/**
 * Authoritative legal transition table for provider payouts.
 */
export const LEGAL_PAYOUT_TRANSITIONS: Readonly<Record<PayoutLifecycleState, readonly PayoutLifecycleState[]>> = Object.freeze({
  NOT_ELIGIBLE: ['ELIGIBLE', 'BLOCKED'],
  ELIGIBLE: ['CREATED', 'HELD', 'BLOCKED', 'CANCELLED'],
  CREATED: ['PENDING', 'PROCESSING', 'HELD', 'BLOCKED', 'CANCELLED'],
  PENDING: ['PROCESSING', 'SUCCEEDED', 'FAILED', 'HELD', 'CANCELLED'],
  PROCESSING: ['SUCCEEDED', 'FAILED', 'HELD'],
  SUCCEEDED: ['REVERSED'],
  FAILED: ['PENDING', 'CANCELLED', 'BLOCKED'],
  CANCELLED: [], // Terminal
  REVERSED: [], // Terminal
  HELD: ['ELIGIBLE', 'CREATED', 'CANCELLED', 'BLOCKED'],
  BLOCKED: ['ELIGIBLE', 'CANCELLED'],
});

export function canTransitionPayoutStatus(
  current: PayoutLifecycleState,
  target: PayoutLifecycleState
): boolean {
  if (current === target) return true;
  const allowed = LEGAL_PAYOUT_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

export const TERMINAL_PAYOUT_STATES: readonly PayoutLifecycleState[] = Object.freeze([
  'SUCCEEDED',
  'CANCELLED',
  'REVERSED',
]);

export function isPayoutTerminalStatus(status: PayoutLifecycleState): boolean {
  return TERMINAL_PAYOUT_STATES.includes(status);
}
