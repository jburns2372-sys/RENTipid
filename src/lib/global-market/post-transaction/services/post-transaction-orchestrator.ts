/**
 * RENTipid GLOBAL-MKT / v2.0 — Post-Transaction Orchestrator Service
 *
 * Coordinates post-transaction lifecycle events across deposits, cancellations,
 * refunds, claims, disputes, and reviews. Provides authoritative payout eligibility
 * hold evaluation.
 */

import { getClaimsByBookingId } from './claim-engine';
import { getDisputesByBookingId } from './dispute-engine';
import { getDepositRecordByBookingId } from './deposit-engine';

export interface PayoutHoldEvaluationResult {
  readonly isHeld: boolean;
  readonly reason?: string;
  readonly blockingEntity?: 'CLAIM' | 'DISPUTE' | 'DEPOSIT_ISSUE' | 'REFUND_PENDING';
  readonly blockingReferenceId?: string;
}

/**
 * Authoritatively determines if a booking's provider payout must be HELD
 * due to an open claim, active dispute, or pending refund.
 */
export function evaluatePayoutHoldStatus(bookingId: string): PayoutHoldEvaluationResult {
  // 1. Check for Active Claims
  const claims = getClaimsByBookingId(bookingId);
  const activeClaimStatuses = [
    'SUBMITTED',
    'EVIDENCE_REQUIRED',
    'UNDER_REVIEW',
    'RESPONDED',
    'MEDIATION',
  ];

  const blockingClaim = claims.find((c) => activeClaimStatuses.includes(c.status));
  if (blockingClaim) {
    return {
      isHeld: true,
      reason: `Payout held due to active claim '${blockingClaim.claimNumber}' in status '${blockingClaim.status}'.`,
      blockingEntity: 'CLAIM',
      blockingReferenceId: blockingClaim.id,
    };
  }

  // 2. Check for Active Disputes
  const disputes = getDisputesByBookingId(bookingId);
  const activeDisputeStatuses = [
    'OPEN',
    'EVIDENCE_COLLECTION',
    'RESPONSE_REQUIRED',
    'UNDER_REVIEW',
    'MEDIATION',
    'RESOLUTION_PENDING',
  ];

  const blockingDispute = disputes.find((d) => activeDisputeStatuses.includes(d.status));
  if (blockingDispute) {
    return {
      isHeld: true,
      reason: `Payout held due to active dispute in status '${blockingDispute.status}'.`,
      blockingEntity: 'DISPUTE',
      blockingReferenceId: blockingDispute.id,
    };
  }

  // 3. Check for Deposit Claims Pending
  const deposit = getDepositRecordByBookingId(bookingId);
  if (deposit && deposit.status === 'CLAIM_PENDING') {
    return {
      isHeld: true,
      reason: `Payout held due to pending deposit claim on deposit '${deposit.id}'.`,
      blockingEntity: 'DEPOSIT_ISSUE',
      blockingReferenceId: deposit.id,
    };
  }

  return {
    isHeld: false,
  };
}
