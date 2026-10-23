/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Cancellation Policy Contracts
 *
 * Defines cancellation tiers, actor evaluations, and immutable cancellation records.
 * INVARIANT: BOOKING CANCELLED != MONEY REFUNDED.
 */

export const CANCELLATION_TIERS = [
  'FLEXIBLE',
  'MODERATE',
  'STRICT',
  'NON_REFUNDABLE',
] as const;

export type CancellationTier = (typeof CANCELLATION_TIERS)[number];

export const CANCELLATION_ACTORS = [
  'RENTER',
  'PROVIDER',
  'SYSTEM',
  'ADMIN',
] as const;

export type CancellationActor = (typeof CANCELLATION_ACTORS)[number];

export interface CancellationEvaluationInput {
  readonly bookingId: string;
  readonly actor: CancellationActor;
  readonly requestingUserId: string;
  readonly bookingRenterId: string;
  readonly bookingProviderId: string;
  readonly bookingStatus: string;
  readonly rentalStartDate: string; // ISO-8601
  readonly cancellationDate: string; // ISO-8601
  readonly tier: CancellationTier;
  readonly forceMajeure?: boolean;
}

export interface CancellationEvaluationResult {
  readonly canCancel: boolean;
  readonly refundPercentage: number; // 0 to 100
  readonly cancellationFeePercentage: number;
  readonly reason?: string;
  readonly policyTier: CancellationTier;
  readonly policyReference: string;
}

export interface CancellationRecord {
  readonly id: string;
  readonly bookingId: string;
  readonly cancelledByActor: CancellationActor;
  readonly cancelledByUserId: string;
  readonly cancellationReason: string;
  readonly cancellationTier: CancellationTier;
  readonly refundPercentageCalculated: number;
  readonly cancellationFeePercentage: number;
  readonly effectiveAt: string;
}
