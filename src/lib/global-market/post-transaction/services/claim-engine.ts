/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Claim Engine
 *
 * Enforces participant authorization, evidence protection, and separation of
 * claimed amount from approved financial liability.
 *
 * PERMANENT INVARIANT: CLAIMED AMOUNT != APPROVED FINANCIAL LIABILITY.
 */

import {
  type ClaimRecord,
  type ClaimCategory,
  type ClaimEvidenceItem,
  type ClaimLifecycleState,
  canTransitionClaimStatus,
} from '../contracts/claim-lifecycle';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';

const claimsById = new Map<string, ClaimRecord>();
const claimsByIdempotency = new Map<string, ClaimRecord>();
const claimsByBookingId = new Map<string, ClaimRecord[]>();

export interface CreateClaimInput {
  readonly booking: GlobalBookingRecord;
  readonly claimantUserId: string;
  readonly category: ClaimCategory;
  readonly description: string;
  readonly claimedAmountMinorUnits: number;
  readonly providerEvidenceSummary?: string;
  readonly initialEvidence?: readonly ClaimEvidenceItem[];
  readonly idempotencyKey: string;
}

export interface ClaimOperationResult {
  readonly success: boolean;
  readonly claim?: ClaimRecord;
  readonly isIdempotentReplay?: boolean;
  readonly error?: string;
}

/**
 * Creates a damage or dispute claim tied to a booking.
 */
export async function createDamageClaim(
  input: CreateClaimInput
): Promise<ClaimOperationResult> {
  const {
    booking,
    claimantUserId,
    category,
    description,
    claimedAmountMinorUnits,
    providerEvidenceSummary,
    initialEvidence = [],
    idempotencyKey,
  } = input;

  // 1. Idempotency Check
  if (claimsByIdempotency.has(idempotencyKey)) {
    const existing = claimsByIdempotency.get(idempotencyKey)!;
    return {
      success: true,
      claim: existing,
      isIdempotentReplay: true,
    };
  }

  // 2. Participant Integrity Check (Section 22, 50)
  const isRenter = claimantUserId === booking.participants.renterId;
  const isProvider = claimantUserId === booking.participants.providerId;

  if (!isRenter && !isProvider) {
    return {
      success: false,
      error: 'CLAIMANT_NOT_PARTICIPANT: Only the renter or provider of this booking may submit a claim.',
    };
  }

  const respondentUserId = isRenter ? booking.participants.providerId : booking.participants.renterId;

  // 3. Amount Validation (Must be non-negative)
  if (claimedAmountMinorUnits < 0) {
    return {
      success: false,
      error: 'INVALID_CLAIM_AMOUNT: Claimed amount cannot be negative.',
    };
  }

  const now = new Date().toISOString();
  const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const claimNumber = `CLM-${booking.participants.jurisdictionCode}-${Date.now().toString().slice(-6)}`;

  // INVARIANT: Claimed amount is recorded, approved liability is strictly 0 until resolution!
  const record: ClaimRecord = Object.freeze({
    id: claimId,
    claimNumber,
    bookingId: booking.id,
    listingId: booking.participants.listingId,
    renterId: booking.participants.renterId,
    providerId: booking.participants.providerId,
    claimantUserId,
    respondentUserId,
    jurisdictionCode: booking.participants.jurisdictionCode,
    category,
    claimedAmountMinorUnits,
    approvedLiabilityMinorUnits: 0, // Unapproved upon submission
    currency: booking.moneySnapshot.bookingPriceCurrency,
    status: 'SUBMITTED',
    description,
    providerEvidenceSummary,
    evidence: Object.freeze([...initialEvidence]),
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
  });

  claimsById.set(claimId, record);
  claimsByIdempotency.set(idempotencyKey, record);

  const existingForBooking = claimsByBookingId.get(booking.id) || [];
  claimsByBookingId.set(booking.id, [...existingForBooking, record]);

  return {
    success: true,
    claim: record,
  };
}

export interface SubmitEvidenceInput {
  readonly claimId: string;
  readonly uploaderUserId: string;
  readonly fileType: string;
  readonly filePath: string;
  readonly fileSize: number;
  readonly caption?: string;
}

/**
 * Submits secure evidence for a claim, preventing access by unrelated parties.
 */
export async function submitClaimEvidence(
  input: SubmitEvidenceInput
): Promise<ClaimOperationResult> {
  const claim = claimsById.get(input.claimId);
  if (!claim) {
    return { success: false, error: `CLAIM_NOT_FOUND: Claim '${input.claimId}' does not exist.` };
  }

  // Authorization Guard (Section 25, 50)
  const isParticipant =
    input.uploaderUserId === claim.claimantUserId ||
    input.uploaderUserId === claim.respondentUserId;

  if (!isParticipant) {
    return {
      success: false,
      error: 'EVIDENCE_SUBMISSION_UNAUTHORIZED: Unrelated users cannot attach evidence to this claim.',
    };
  }

  // Security checks: file size max 15MB
  if (input.fileSize > 15 * 1024 * 1024) {
    return {
      success: false,
      error: 'EVIDENCE_FILE_TOO_LARGE: Evidence file size exceeds 15MB limit.',
    };
  }

  const evidenceItem: ClaimEvidenceItem = Object.freeze({
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fileType: input.fileType,
    filePath: input.filePath,
    fileSize: input.fileSize,
    uploadedByUserId: input.uploaderUserId,
    uploadedAt: new Date().toISOString(),
    caption: input.caption,
  });

  const updated: ClaimRecord = Object.freeze({
    ...claim,
    evidence: Object.freeze([...claim.evidence, evidenceItem]),
    updatedAt: new Date().toISOString(),
  });

  claimsById.set(claim.id, updated);
  return { success: true, claim: updated };
}

export interface ResolveClaimInput {
  readonly claimId: string;
  readonly actorRole: 'ADMIN' | 'SUPPORT_AGENT' | 'MEDIATOR' | 'USER';
  readonly deciderUserId: string;
  readonly targetStatus: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'RESOLVED';
  readonly approvedLiabilityMinorUnits: number;
  readonly decisionNotes: string;
}

/**
 * Authoritatively resolves a claim. Ordinary users CANNOT resolve their own claims.
 */
export async function resolveClaim(
  input: ResolveClaimInput
): Promise<ClaimOperationResult> {
  const {
    claimId,
    actorRole,
    deciderUserId,
    targetStatus,
    approvedLiabilityMinorUnits,
    decisionNotes,
  } = input;

  const claim = claimsById.get(claimId);
  if (!claim) {
    return { success: false, error: `CLAIM_NOT_FOUND: Claim '${claimId}' does not exist.` };
  }

  // 1. Authority Guard (Section 28, 50)
  if (actorRole === 'USER' || deciderUserId === claim.claimantUserId) {
    return {
      success: false,
      error: 'RESOLUTION_UNAUTHORIZED: Ordinary users cannot adjudicate or approve their own claims.',
    };
  }

  // 2. Transition Guard
  if (!canTransitionClaimStatus(claim.status, targetStatus)) {
    return {
      success: false,
      error: `ILLEGAL_STATE_TRANSITION: Cannot transition claim from '${claim.status}' to '${targetStatus}'.`,
    };
  }

  // 3. Approved liability cannot exceed claimed amount
  if (approvedLiabilityMinorUnits > claim.claimedAmountMinorUnits) {
    return {
      success: false,
      error: `LIABILITY_EXCEEDS_CLAIM: Approved liability ${approvedLiabilityMinorUnits} cannot exceed claimed amount ${claim.claimedAmountMinorUnits}.`,
    };
  }

  const now = new Date().toISOString();
  const updated: ClaimRecord = Object.freeze({
    ...claim,
    status: targetStatus,
    approvedLiabilityMinorUnits,
    adminDecision: decisionNotes,
    decidedByUserId: deciderUserId,
    decidedAt: now,
    updatedAt: now,
  });

  claimsById.set(claimId, updated);
  return { success: true, claim: updated };
}

/**
 * Escalates an unresolved claim to a marketplace dispute.
 */
export async function escalateClaimToDispute(
  claimId: string,
  requestingUserId: string
): Promise<ClaimOperationResult> {
  const claim = claimsById.get(claimId);
  if (!claim) {
    return { success: false, error: `CLAIM_NOT_FOUND: Claim '${claimId}' does not exist.` };
  }

  if (!canTransitionClaimStatus(claim.status, 'ESCALATED_TO_DISPUTE')) {
    return {
      success: false,
      error: `ILLEGAL_STATE_TRANSITION: Cannot escalate claim in status '${claim.status}'.`,
    };
  }

  const updated: ClaimRecord = Object.freeze({
    ...claim,
    status: 'ESCALATED_TO_DISPUTE',
    updatedAt: new Date().toISOString(),
  });

  claimsById.set(claimId, updated);
  return { success: true, claim: updated };
}

export function getClaimById(claimId: string): ClaimRecord | null {
  return claimsById.get(claimId) || null;
}

export function getClaimsByBookingId(bookingId: string): readonly ClaimRecord[] {
  return claimsByBookingId.get(bookingId) || [];
}
