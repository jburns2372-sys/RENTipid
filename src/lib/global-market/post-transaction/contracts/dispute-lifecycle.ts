/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Dispute Lifecycle Contracts
 *
 * Defines dispute origins, 12-state lifecycle, authority boundaries,
 * resolution outcomes, and payout/refund impact.
 */

export const DISPUTE_ORIGINS = [
  'CLAIM_ESCALATION',
  'REFUND_DISAGREEMENT',
  'DEPOSIT_DISAGREEMENT',
  'BOOKING_DISAGREEMENT',
  'FINANCIAL_PROVIDER_DISPUTE',
] as const;

export type DisputeOrigin = (typeof DISPUTE_ORIGINS)[number];

export const DISPUTE_LIFECYCLE_STATES = [
  'OPEN',
  'EVIDENCE_COLLECTION',
  'RESPONSE_REQUIRED',
  'UNDER_REVIEW',
  'MEDIATION',
  'RESOLUTION_PENDING',
  'RESOLVED_RENTER',
  'RESOLVED_PROVIDER',
  'PARTIAL_RESOLUTION',
  'REJECTED',
  'CLOSED',
  'EXTERNAL_ESCALATION',
] as const;

export type DisputeLifecycleState = (typeof DISPUTE_LIFECYCLE_STATES)[number];

export const ALL_DISPUTE_LIFECYCLE_STATES: readonly DisputeLifecycleState[] = Object.freeze([
  ...DISPUTE_LIFECYCLE_STATES,
]);

export const LEGAL_DISPUTE_TRANSITIONS: Readonly<Record<DisputeLifecycleState, readonly DisputeLifecycleState[]>> = Object.freeze({
  OPEN: ['EVIDENCE_COLLECTION', 'RESPONSE_REQUIRED', 'UNDER_REVIEW', 'CLOSED'],
  EVIDENCE_COLLECTION: ['RESPONSE_REQUIRED', 'UNDER_REVIEW', 'CLOSED'],
  RESPONSE_REQUIRED: ['UNDER_REVIEW', 'MEDIATION', 'CLOSED'],
  UNDER_REVIEW: ['MEDIATION', 'RESOLUTION_PENDING', 'RESOLVED_RENTER', 'RESOLVED_PROVIDER', 'PARTIAL_RESOLUTION', 'REJECTED', 'EXTERNAL_ESCALATION', 'CLOSED'],
  MEDIATION: ['RESOLUTION_PENDING', 'RESOLVED_RENTER', 'RESOLVED_PROVIDER', 'PARTIAL_RESOLUTION', 'REJECTED', 'EXTERNAL_ESCALATION', 'CLOSED'],
  RESOLUTION_PENDING: ['RESOLVED_RENTER', 'RESOLVED_PROVIDER', 'PARTIAL_RESOLUTION', 'REJECTED', 'CLOSED'],
  RESOLVED_RENTER: ['CLOSED'],
  RESOLVED_PROVIDER: ['CLOSED'],
  PARTIAL_RESOLUTION: ['CLOSED'],
  REJECTED: ['CLOSED'],
  CLOSED: [], // Terminal
  EXTERNAL_ESCALATION: ['CLOSED'],
});

export function canTransitionDisputeStatus(
  current: DisputeLifecycleState,
  target: DisputeLifecycleState
): boolean {
  if (current === target) return true;
  const allowed = LEGAL_DISPUTE_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

export const TERMINAL_DISPUTE_STATES: readonly DisputeLifecycleState[] = Object.freeze([
  'CLOSED',
]);

export function isDisputeTerminalStatus(status: DisputeLifecycleState): boolean {
  return TERMINAL_DISPUTE_STATES.includes(status);
}

export interface DisputeResolutionOutcome {
  readonly resolvedState: DisputeLifecycleState;
  readonly renterAwardMinorUnits: number;
  readonly providerAwardMinorUnits: number;
  readonly depositDisposition: 'RELEASE_TO_RENTER' | 'APPLY_TO_PROVIDER' | 'SPLIT' | 'UNTOUCHED';
  readonly payoutAction: 'RELEASE' | 'HOLD' | 'ADJUST_NET';
  readonly notes: string;
  readonly resolvedByUserId: string;
  readonly resolvedAt: string;
}

export interface DisputeRecord {
  readonly id: string;
  readonly bookingId: string;
  readonly claimId?: string;
  readonly openedByUserId: string;
  readonly respondentUserId: string;
  readonly jurisdictionCode: string;
  readonly origin: DisputeOrigin;
  readonly status: DisputeLifecycleState;
  readonly summary: string;
  readonly renterStatement?: string;
  readonly providerStatement?: string;
  readonly resolution?: DisputeResolutionOutcome;
  readonly externalProviderDisputeReference?: string;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
