/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Refund Lifecycle Contracts
 *
 * Defines refund lifecycle states, refund types, server-authoritative refund instructions,
 * cumulative refund guards, and idempotency tracking.
 */

export const REFUND_LIFECYCLE_STATES = [
  'NOT_ELIGIBLE',
  'ELIGIBLE',
  'REQUESTED',
  'UNDER_REVIEW',
  'APPROVED',
  'EXECUTION_PENDING',
  'PROCESSING',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'REJECTED',
  'FAILED',
  'BLOCKED',
] as const;

export type RefundLifecycleState = (typeof REFUND_LIFECYCLE_STATES)[number];

export const ALL_REFUND_LIFECYCLE_STATES: readonly RefundLifecycleState[] = Object.freeze([
  ...REFUND_LIFECYCLE_STATES,
]);

export const REFUND_TYPES = [
  'FULL_CANCELLATION',
  'PARTIAL_CANCELLATION',
  'SECURITY_DEPOSIT_RETURN',
  'DISPUTE_RESOLUTION',
  'SERVICE_ISSUE_COMPENSATION',
  'GOODWILL',
] as const;

export type RefundType = (typeof REFUND_TYPES)[number];

export const LEGAL_REFUND_TRANSITIONS: Readonly<Record<RefundLifecycleState, readonly RefundLifecycleState[]>> = Object.freeze({
  NOT_ELIGIBLE: ['ELIGIBLE'],
  ELIGIBLE: ['REQUESTED', 'APPROVED', 'REJECTED'],
  REQUESTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'BLOCKED'],
  APPROVED: ['EXECUTION_PENDING', 'PROCESSING', 'REJECTED', 'BLOCKED'],
  EXECUTION_PENDING: ['PROCESSING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED'],
  PROCESSING: ['PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED'],
  PARTIALLY_REFUNDED: ['EXECUTION_PENDING', 'PROCESSING', 'REFUNDED'],
  REFUNDED: [], // Terminal
  REJECTED: [], // Terminal
  FAILED: ['EXECUTION_PENDING', 'PROCESSING', 'BLOCKED'],
  BLOCKED: ['UNDER_REVIEW', 'REJECTED'],
});

export function canTransitionRefundStatus(
  current: RefundLifecycleState,
  target: RefundLifecycleState
): boolean {
  if (current === target) return true;
  const allowed = LEGAL_REFUND_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

export const TERMINAL_REFUND_STATES: readonly RefundLifecycleState[] = Object.freeze([
  'REFUNDED',
  'REJECTED',
]);

export function isRefundTerminalStatus(status: RefundLifecycleState): boolean {
  return TERMINAL_REFUND_STATES.includes(status);
}

export interface RefundInstruction {
  readonly id: string;
  readonly refundNumber: string;
  readonly bookingId: string;
  readonly paymentAttemptId: string;
  readonly refundType: RefundType;
  readonly maximumRefundableAmountMinorUnits: number;
  readonly approvedAmountMinorUnits: number;
  readonly currency: string;
  readonly recipientUserId: string;
  readonly reason: string;
  readonly policyReference: string;
  readonly approvalAuthority: 'SYSTEM_POLICY' | 'ADMIN' | 'SUPPORT_AGENT' | 'FINANCE_ADMIN';
  readonly approvedByUserId?: string;
  readonly providerExecutionRequired: boolean;
  readonly providerRefundReference?: string;
  readonly status: RefundLifecycleState;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RefundExecutionResult {
  readonly success: boolean;
  readonly refundInstruction: RefundInstruction;
  readonly providerRefundReference?: string;
  readonly isIdempotentReplay?: boolean;
  readonly error?: string;
}
