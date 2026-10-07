/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Dispute Engine
 *
 * Implements marketplace dispute lifecycles, adjudication authorization,
 * resolution outcomes, and payout/deposit impact.
 *
 * PERMANENT INVARIANT: Ordinary users CANNOT resolve their own disputes.
 */

import {
  type DisputeRecord,
  type DisputeOrigin,
  type DisputeLifecycleState,
  type DisputeResolutionOutcome,
  canTransitionDisputeStatus,
} from '../contracts/dispute-lifecycle';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';

const disputesById = new Map<string, DisputeRecord>();
const disputesByIdempotency = new Map<string, DisputeRecord>();
const disputesByBookingId = new Map<string, DisputeRecord[]>();

export interface OpenDisputeInput {
  readonly booking: GlobalBookingRecord;
  readonly claimId?: string;
  readonly openedByUserId: string;
  readonly origin: DisputeOrigin;
  readonly summary: string;
  readonly statement?: string;
  readonly idempotencyKey: string;
}

export interface DisputeOperationResult {
  readonly success: boolean;
  readonly dispute?: DisputeRecord;
  readonly isIdempotentReplay?: boolean;
  readonly error?: string;
}

/**
 * Opens a marketplace dispute tied to a booking or claim.
 */
export async function openDispute(
  input: OpenDisputeInput
): Promise<DisputeOperationResult> {
  const {
    booking,
    claimId,
    openedByUserId,
    origin,
    summary,
    statement,
    idempotencyKey,
  } = input;

  // 1. Idempotency Check
  if (disputesByIdempotency.has(idempotencyKey)) {
    const existing = disputesByIdempotency.get(idempotencyKey)!;
    return {
      success: true,
      dispute: existing,
      isIdempotentReplay: true,
    };
  }

  // 2. Participant Integrity Check (Section 26, 51)
  const isRenter = openedByUserId === booking.participants.renterId;
  const isProvider = openedByUserId === booking.participants.providerId;

  if (!isRenter && !isProvider) {
    return {
      success: false,
      error: 'DISPUTE_UNAUTHORIZED: Only participants of this booking may open a dispute.',
    };
  }

  const respondentUserId = isRenter ? booking.participants.providerId : booking.participants.renterId;
  const now = new Date().toISOString();
  const disputeId = `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const record: DisputeRecord = Object.freeze({
    id: disputeId,
    bookingId: booking.id,
    claimId,
    openedByUserId,
    respondentUserId,
    jurisdictionCode: booking.participants.jurisdictionCode,
    origin,
    status: 'OPEN',
    summary,
    renterStatement: isRenter ? statement : undefined,
    providerStatement: isProvider ? statement : undefined,
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
  });

  disputesById.set(disputeId, record);
  disputesByIdempotency.set(idempotencyKey, record);

  const existing = disputesByBookingId.get(booking.id) || [];
  disputesByBookingId.set(booking.id, [...existing, record]);

  return {
    success: true,
    dispute: record,
  };
}

export interface ResolveDisputeInput {
  readonly disputeId: string;
  readonly actorRole: 'ADMIN' | 'SUPPORT_AGENT' | 'MEDIATOR' | 'SUPER_ADMIN' | 'USER';
  readonly adjudicatorUserId: string;
  readonly outcome: DisputeResolutionOutcome;
}

/**
 * Authoritatively resolves a dispute. Ordinary users are strictly BLOCKED from resolving.
 */
export async function resolveDispute(
  input: ResolveDisputeInput
): Promise<DisputeOperationResult> {
  const { disputeId, actorRole, adjudicatorUserId, outcome } = input;

  const dispute = disputesById.get(disputeId);
  if (!dispute) {
    return { success: false, error: `DISPUTE_NOT_FOUND: Dispute '${disputeId}' does not exist.` };
  }

  // 1. Authority Guard (Section 28, 51)
  if (actorRole === 'USER' || adjudicatorUserId === dispute.openedByUserId || adjudicatorUserId === dispute.respondentUserId) {
    return {
      success: false,
      error: 'RESOLUTION_UNAUTHORIZED: Ordinary participants cannot resolve or adjudicate their own disputes.',
    };
  }

  // 2. Transition Guard
  if (!canTransitionDisputeStatus(dispute.status, outcome.resolvedState)) {
    return {
      success: false,
      error: `ILLEGAL_STATE_TRANSITION: Cannot transition dispute from '${dispute.status}' to '${outcome.resolvedState}'.`,
    };
  }

  const now = new Date().toISOString();
  const updated: DisputeRecord = Object.freeze({
    ...dispute,
    status: outcome.resolvedState,
    resolution: outcome,
    updatedAt: now,
  });

  disputesById.set(disputeId, updated);
  return { success: true, dispute: updated };
}

export function getDisputeById(disputeId: string): DisputeRecord | null {
  return disputesById.get(disputeId) || null;
}

export function getDisputesByBookingId(bookingId: string): readonly DisputeRecord[] {
  return disputesByBookingId.get(bookingId) || [];
}
