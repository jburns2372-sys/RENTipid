/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Claim Lifecycle Contracts
 *
 * Defines claim categories, 13-state lifecycle, participant binding,
 * evidence protection, and financial liability isolation.
 */

export const CLAIM_CATEGORIES = [
  'DAMAGE',
  'LOSS',
  'NON_RETURN',
  'LATE_RETURN',
  'ITEM_NOT_AS_DESCRIBED',
  'SERVICE_FAILURE',
  'PAYMENT_ISSUE',
  'OTHER',
] as const;

export type ClaimCategory = (typeof CLAIM_CATEGORIES)[number];

export const CLAIM_LIFECYCLE_STATES = [
  'DRAFT',
  'SUBMITTED',
  'EVIDENCE_REQUIRED',
  'UNDER_REVIEW',
  'RESPONDED',
  'MEDIATION',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'REJECTED',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
  'ESCALATED_TO_DISPUTE',
] as const;

export type ClaimLifecycleState = (typeof CLAIM_LIFECYCLE_STATES)[number];

export const ALL_CLAIM_LIFECYCLE_STATES: readonly ClaimLifecycleState[] = Object.freeze([
  ...CLAIM_LIFECYCLE_STATES,
]);

export const LEGAL_CLAIM_TRANSITIONS: Readonly<Record<ClaimLifecycleState, readonly ClaimLifecycleState[]>> = Object.freeze({
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['EVIDENCE_REQUIRED', 'UNDER_REVIEW', 'RESPONDED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'CANCELLED', 'ESCALATED_TO_DISPUTE'],
  EVIDENCE_REQUIRED: ['UNDER_REVIEW', 'RESPONDED', 'CANCELLED'],
  UNDER_REVIEW: ['RESPONDED', 'MEDIATION', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'ESCALATED_TO_DISPUTE'],
  RESPONDED: ['UNDER_REVIEW', 'MEDIATION', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'ESCALATED_TO_DISPUTE'],
  MEDIATION: ['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'ESCALATED_TO_DISPUTE'],
  APPROVED: ['RESOLVED', 'CLOSED'],
  PARTIALLY_APPROVED: ['RESOLVED', 'CLOSED'],
  REJECTED: ['CLOSED', 'ESCALATED_TO_DISPUTE'],
  RESOLVED: ['CLOSED'],
  CLOSED: [], // Terminal
  CANCELLED: [], // Terminal
  ESCALATED_TO_DISPUTE: [], // Handed off to Dispute Engine
});

export function canTransitionClaimStatus(
  current: ClaimLifecycleState,
  target: ClaimLifecycleState
): boolean {
  if (current === target) return true;
  const allowed = LEGAL_CLAIM_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

export const TERMINAL_CLAIM_STATES: readonly ClaimLifecycleState[] = Object.freeze([
  'CLOSED',
  'CANCELLED',
  'ESCALATED_TO_DISPUTE',
]);

export function isClaimTerminalStatus(status: ClaimLifecycleState): boolean {
  return TERMINAL_CLAIM_STATES.includes(status);
}

export interface ClaimEvidenceItem {
  readonly id: string;
  readonly fileType: string;
  readonly filePath: string;
  readonly fileSize: number;
  readonly uploadedByUserId: string;
  readonly uploadedAt: string;
  readonly caption?: string;
}

export interface ClaimRecord {
  readonly id: string;
  readonly claimNumber: string;
  readonly bookingId: string;
  readonly listingId: string;
  readonly renterId: string;
  readonly providerId: string;
  readonly claimantUserId: string;
  readonly respondentUserId: string;
  readonly jurisdictionCode: string;
  readonly category: ClaimCategory;
  readonly claimedAmountMinorUnits: number;
  readonly approvedLiabilityMinorUnits: number;
  readonly currency: string;
  readonly status: ClaimLifecycleState;
  readonly description: string;
  readonly providerEvidenceSummary?: string;
  readonly renterResponse?: string;
  readonly adminDecision?: string;
  readonly decidedByUserId?: string;
  readonly decidedAt?: string;
  readonly evidence: readonly ClaimEvidenceItem[];
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
