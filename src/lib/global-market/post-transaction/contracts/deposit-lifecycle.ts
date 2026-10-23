/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Deposit Lifecycle Contracts
 *
 * Defines deposit models, controlled 14-state lifecycle, legal transition guards,
 * and immutable deposit records.
 */

export const DEPOSIT_MODELS = [
  'NONE',
  'PAYMENT_COLLECTED',
  'AUTHORIZATION_HOLD',
  'MANUAL_OFF_PLATFORM',
] as const;

export type DepositModel = (typeof DEPOSIT_MODELS)[number];

export const DEPOSIT_LIFECYCLE_STATES = [
  'NOT_REQUIRED',
  'REQUIRED',
  'PENDING',
  'HELD',
  'COLLECTED',
  'PARTIALLY_RELEASED',
  'RELEASED',
  'CLAIM_PENDING',
  'PARTIALLY_APPLIED',
  'APPLIED',
  'REFUND_PENDING',
  'REFUNDED',
  'FAILED',
  'BLOCKED',
] as const;

export type DepositLifecycleState = (typeof DEPOSIT_LIFECYCLE_STATES)[number];

export const ALL_DEPOSIT_LIFECYCLE_STATES: readonly DepositLifecycleState[] = Object.freeze([
  ...DEPOSIT_LIFECYCLE_STATES,
]);

export const LEGAL_DEPOSIT_TRANSITIONS: Readonly<Record<DepositLifecycleState, readonly DepositLifecycleState[]>> = Object.freeze({
  NOT_REQUIRED: [],
  REQUIRED: ['PENDING', 'HELD', 'COLLECTED', 'FAILED', 'BLOCKED', 'NOT_REQUIRED'],
  PENDING: ['HELD', 'COLLECTED', 'FAILED', 'BLOCKED'],
  HELD: ['RELEASED', 'PARTIALLY_RELEASED', 'CLAIM_PENDING', 'APPLIED', 'PARTIALLY_APPLIED', 'BLOCKED'],
  COLLECTED: ['RELEASED', 'PARTIALLY_RELEASED', 'CLAIM_PENDING', 'APPLIED', 'PARTIALLY_APPLIED', 'REFUND_PENDING', 'BLOCKED'],
  CLAIM_PENDING: ['HELD', 'COLLECTED', 'APPLIED', 'PARTIALLY_APPLIED', 'RELEASED', 'PARTIALLY_RELEASED', 'BLOCKED'],
  PARTIALLY_APPLIED: ['APPLIED', 'RELEASED', 'PARTIALLY_RELEASED', 'CLAIM_PENDING'],
  APPLIED: ['REFUND_PENDING', 'REFUNDED'],
  PARTIALLY_RELEASED: ['RELEASED', 'CLAIM_PENDING', 'APPLIED', 'PARTIALLY_APPLIED'],
  RELEASED: [], // Terminal
  REFUND_PENDING: ['REFUNDED', 'FAILED'],
  REFUNDED: [], // Terminal
  FAILED: ['PENDING', 'REQUIRED'],
  BLOCKED: ['REQUIRED', 'HELD', 'COLLECTED'],
});

export function canTransitionDepositStatus(
  current: DepositLifecycleState,
  target: DepositLifecycleState
): boolean {
  if (current === target) return true;
  const allowed = LEGAL_DEPOSIT_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

export const TERMINAL_DEPOSIT_STATES: readonly DepositLifecycleState[] = Object.freeze([
  'NOT_REQUIRED',
  'RELEASED',
  'REFUNDED',
]);

export function isDepositTerminalStatus(status: DepositLifecycleState): boolean {
  return TERMINAL_DEPOSIT_STATES.includes(status);
}

export interface DepositPolicy {
  readonly jurisdictionCode: string;
  readonly defaultDepositModel: DepositModel;
  readonly allowsAuthorizationHold: boolean;
  readonly requiresKycForHold: boolean;
  readonly maxDepositPercentageOfBooking: number;
  readonly defaultHoldingPeriodDays: number;
}

export interface DepositRecord {
  readonly id: string;
  readonly bookingId: string;
  readonly jurisdictionCode: string;
  readonly depositModel: DepositModel;
  readonly requiredAmountMinorUnits: number;
  readonly heldAmountMinorUnits: number;
  readonly releasedAmountMinorUnits: number;
  readonly appliedAmountMinorUnits: number;
  readonly currency: string;
  readonly status: DepositLifecycleState;
  readonly providerReference?: string;
  readonly claimId?: string;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
