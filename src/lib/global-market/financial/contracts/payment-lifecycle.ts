/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Payment Lifecycle Contracts
 *
 * Implements the 15-state typed payment state machine, legal state transitions,
 * terminal state recognition, and failure classification.
 */

export const PAYMENT_LIFECYCLE_STATES = [
  'CREATED',
  'REQUIRES_ACTION',
  'PENDING',
  'PROCESSING',
  'AUTHORIZED',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
  'REFUND_PENDING',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'DISPUTED',
] as const;

export type PaymentLifecycleState = (typeof PAYMENT_LIFECYCLE_STATES)[number];

export const ALL_PAYMENT_LIFECYCLE_STATES: readonly PaymentLifecycleState[] = Object.freeze([
  ...PAYMENT_LIFECYCLE_STATES,
]);

/**
 * Authoritative legal transition table for marketplace payments.
 */
export const LEGAL_PAYMENT_TRANSITIONS: Readonly<Record<PaymentLifecycleState, readonly PaymentLifecycleState[]>> = Object.freeze({
  CREATED: ['REQUIRES_ACTION', 'PENDING', 'PROCESSING', 'AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED'],
  REQUIRES_ACTION: ['PENDING', 'PROCESSING', 'AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED'],
  PENDING: ['PROCESSING', 'AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED'],
  PROCESSING: ['AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELLED'],
  AUTHORIZED: ['SUCCEEDED', 'CANCELLED', 'EXPIRED', 'REFUND_PENDING', 'REFUNDED'],
  SUCCEEDED: ['REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'DISPUTED'],
  FAILED: ['PENDING'], // Allowed only on retry within same attempt context
  CANCELLED: [], // Terminal
  EXPIRED: [], // Terminal
  REFUND_PENDING: ['PARTIALLY_REFUNDED', 'REFUNDED', 'SUCCEEDED'], // SUCCEEDED if refund failed/cancelled
  PARTIALLY_REFUNDED: ['REFUND_PENDING', 'REFUNDED', 'DISPUTED'],
  REFUNDED: [], // Terminal
  DISPUTED: ['REFUNDED', 'SUCCEEDED'],
});

export function canTransitionPaymentStatus(
  current: PaymentLifecycleState,
  target: PaymentLifecycleState
): boolean {
  if (current === target) return true;
  const allowed = LEGAL_PAYMENT_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

export const TERMINAL_PAYMENT_STATES: readonly PaymentLifecycleState[] = Object.freeze([
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED',
]);

export function isPaymentTerminalStatus(status: PaymentLifecycleState): boolean {
  return TERMINAL_PAYMENT_STATES.includes(status);
}
