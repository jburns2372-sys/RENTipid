/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Cancellation Engine
 *
 * Enforces server-authoritative cancellation evaluation, participant authorization,
 * policy tier calculations, and cancellation records.
 *
 * PERMANENT INVARIANT: BOOKING CANCELLED != MONEY REFUNDED.
 */

import {
  type CancellationTier,
  type CancellationActor,
  type CancellationEvaluationInput,
  type CancellationEvaluationResult,
  type CancellationRecord,
} from '../contracts/cancellation-policy';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';
import { canTransitionBookingStatus } from '@/lib/global-market/booking/contracts/booking-lifecycle';

const cancellationRecordsById = new Map<string, CancellationRecord>();
const cancellationRecordsByBookingId = new Map<string, CancellationRecord>();

/**
 * Evaluates whether a booking can be cancelled and calculates the policy refund percentage.
 */
export function evaluateCancellationPolicy(
  input: CancellationEvaluationInput
): CancellationEvaluationResult {
  const {
    actor,
    requestingUserId,
    bookingRenterId,
    bookingProviderId,
    bookingStatus,
    rentalStartDate,
    cancellationDate,
    tier,
    forceMajeure,
  } = input;

  // 1. Authorization Guard
  if (actor === 'RENTER' && requestingUserId !== bookingRenterId) {
    return {
      canCancel: false,
      refundPercentage: 0,
      cancellationFeePercentage: 0,
      reason: 'UNAUTHORIZED_CANCELLATION: Requesting user is not the renter of this booking.',
      policyTier: tier,
      policyReference: `POLICY_${tier}`,
    };
  }

  if (actor === 'PROVIDER' && requestingUserId !== bookingProviderId) {
    return {
      canCancel: false,
      refundPercentage: 0,
      cancellationFeePercentage: 0,
      reason: 'UNAUTHORIZED_CANCELLATION: Requesting user is not the provider of this booking.',
      policyTier: tier,
      policyReference: `POLICY_${tier}`,
    };
  }

  // 2. Status Eligibility Guard
  const nonCancellableStatuses = ['COMPLETED', 'CANCELLED', 'DECLINED', 'EXPIRED'];
  if (nonCancellableStatuses.includes(bookingStatus)) {
    return {
      canCancel: false,
      refundPercentage: 0,
      cancellationFeePercentage: 0,
      reason: `INVALID_BOOKING_STATUS: Booking in status '${bookingStatus}' cannot be cancelled.`,
      policyTier: tier,
      policyReference: `POLICY_${tier}`,
    };
  }

  // 3. Provider or System/Admin cancellation -> 100% renter refund entitlement
  if (actor === 'PROVIDER' || actor === 'SYSTEM' || actor === 'ADMIN') {
    return {
      canCancel: true,
      refundPercentage: 100,
      cancellationFeePercentage: 0,
      policyTier: tier,
      policyReference: `POLICY_PROVIDER_CANCEL_${tier}`,
    };
  }

  // 4. Force Majeure exception
  if (forceMajeure) {
    return {
      canCancel: true,
      refundPercentage: 100,
      cancellationFeePercentage: 0,
      policyTier: tier,
      policyReference: `POLICY_FORCE_MAJEURE_${tier}`,
    };
  }

  // 5. Timeline calculation (in hours)
  const startMs = new Date(rentalStartDate).getTime();
  const cancelMs = new Date(cancellationDate).getTime();
  const hoursUntilStart = (startMs - cancelMs) / (1000 * 60 * 60);

  if (hoursUntilStart <= 0) {
    // Rental already started
    return {
      canCancel: true,
      refundPercentage: 0,
      cancellationFeePercentage: 100,
      policyTier: tier,
      policyReference: `POLICY_AFTER_START_${tier}`,
    };
  }

  // Tier-based evaluation
  switch (tier) {
    case 'FLEXIBLE':
      if (hoursUntilStart >= 24) {
        return { canCancel: true, refundPercentage: 100, cancellationFeePercentage: 0, policyTier: tier, policyReference: 'POLICY_FLEXIBLE_FULL' };
      }
      return { canCancel: true, refundPercentage: 50, cancellationFeePercentage: 50, policyTier: tier, policyReference: 'POLICY_FLEXIBLE_PARTIAL' };

    case 'MODERATE':
      if (hoursUntilStart >= 120) {
        // 5+ days
        return { canCancel: true, refundPercentage: 100, cancellationFeePercentage: 0, policyTier: tier, policyReference: 'POLICY_MODERATE_FULL' };
      }
      if (hoursUntilStart >= 24) {
        return { canCancel: true, refundPercentage: 50, cancellationFeePercentage: 50, policyTier: tier, policyReference: 'POLICY_MODERATE_PARTIAL' };
      }
      return { canCancel: true, refundPercentage: 0, cancellationFeePercentage: 100, policyTier: tier, policyReference: 'POLICY_MODERATE_ZERO' };

    case 'STRICT':
      if (hoursUntilStart >= 336) {
        // 14+ days
        return { canCancel: true, refundPercentage: 100, cancellationFeePercentage: 0, policyTier: tier, policyReference: 'POLICY_STRICT_FULL' };
      }
      if (hoursUntilStart >= 168) {
        // 7-14 days
        return { canCancel: true, refundPercentage: 50, cancellationFeePercentage: 50, policyTier: tier, policyReference: 'POLICY_STRICT_PARTIAL' };
      }
      return { canCancel: true, refundPercentage: 0, cancellationFeePercentage: 100, policyTier: tier, policyReference: 'POLICY_STRICT_ZERO' };

    case 'NON_REFUNDABLE':
    default:
      return { canCancel: true, refundPercentage: 0, cancellationFeePercentage: 100, policyTier: tier, policyReference: 'POLICY_NON_REFUNDABLE' };
  }
}

export interface ExecuteCancellationInput {
  readonly booking: GlobalBookingRecord;
  readonly requestingUserId: string;
  readonly actor: CancellationActor;
  readonly reason: string;
  readonly tier?: CancellationTier;
  readonly forceMajeure?: boolean;
  readonly cancellationDate?: string;
  readonly idempotencyKey: string;
}

export interface CancellationExecutionResult {
  readonly success: boolean;
  readonly cancellationRecord?: CancellationRecord;
  readonly evaluation?: CancellationEvaluationResult;
  readonly isIdempotentReplay?: boolean;
  readonly error?: string;
}

/**
 * Executes server-authoritative booking cancellation.
 * Mutates booking status to CANCELLED and records cancellation facts.
 * Does NOT execute refund (separation of cancellation vs refund).
 */
export async function executeBookingCancellation(
  input: ExecuteCancellationInput
): Promise<CancellationExecutionResult> {
  const {
    booking,
    requestingUserId,
    actor,
    reason,
    tier = 'MODERATE',
    forceMajeure = false,
    cancellationDate = new Date().toISOString(),
    idempotencyKey,
  } = input;

  // 1. Idempotency Check
  if (cancellationRecordsByBookingId.has(booking.id)) {
    const existing = cancellationRecordsByBookingId.get(booking.id)!;
    return {
      success: true,
      cancellationRecord: existing,
      isIdempotentReplay: true,
    };
  }

  // 2. Policy Evaluation
  const evalResult = evaluateCancellationPolicy({
    bookingId: booking.id,
    actor,
    requestingUserId,
    bookingRenterId: booking.participants.renterId,
    bookingProviderId: booking.participants.providerId,
    bookingStatus: booking.status,
    rentalStartDate: booking.rentalPeriod.startUtcTimestamp,
    cancellationDate,
    tier,
    forceMajeure,
  });

  if (!evalResult.canCancel) {
    return {
      success: false,
      evaluation: evalResult,
      error: evalResult.reason || 'CANCELLATION_REJECTED',
    };
  }

  // 3. Verify state transition guard
  if (!canTransitionBookingStatus(booking.status, 'CANCELLED')) {
    return {
      success: false,
      evaluation: evalResult,
      error: `ILLEGAL_STATE_TRANSITION: Cannot transition booking from '${booking.status}' to 'CANCELLED'.`,
    };
  }

  const recordId = `cancel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: CancellationRecord = Object.freeze({
    id: recordId,
    bookingId: booking.id,
    cancelledByActor: actor,
    cancelledByUserId: requestingUserId,
    cancellationReason: reason,
    cancellationTier: evalResult.policyTier,
    refundPercentageCalculated: evalResult.refundPercentage,
    cancellationFeePercentage: evalResult.cancellationFeePercentage,
    effectiveAt: cancellationDate,
  });

  cancellationRecordsById.set(recordId, record);
  cancellationRecordsByBookingId.set(booking.id, record);

  return {
    success: true,
    cancellationRecord: record,
    evaluation: evalResult,
  };
}

export function getCancellationRecordByBookingId(bookingId: string): CancellationRecord | null {
  return cancellationRecordsByBookingId.get(bookingId) || null;
}
