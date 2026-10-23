/**
 * RENTipid GLOBAL-MKT / v2.0 — Payment & Payout Handoff Contracts
 *
 * Prepares the authoritative contexts for future GM-6A (Payment & Payout)
 * and GM-7A (Deposits, Refunds, Claims, Disputes) without executing money movement.
 */

export interface PayableBookingContext {
  readonly bookingId: string;
  readonly bookingReference: string;
  readonly payerId: string;
  readonly payeeProviderId: string;
  readonly jurisdictionCode: string;
  readonly authoritativeAmountMinorUnits: number;
  readonly depositAmountMinorUnits: number;
  readonly deliveryFeeMinorUnits: number;
  readonly sourceListingCurrency: string;
  readonly requiredTransactionCurrency: string;
  readonly paymentStateRequirement: 'FULL_PREPAYMENT' | 'AUTHORIZE_HOLD' | 'ESCROW';
  readonly idempotencyReference: string;
  readonly paymentStatus: string;
}

export interface EligiblePayoutContext {
  readonly bookingId: string;
  readonly bookingReference: string;
  readonly providerId: string;
  readonly jurisdictionCode: string;
  readonly eligibleSettlementTrigger: 'BOOKING_COMPLETED' | 'HANDOVER_CONFIRMED';
  readonly payoutAmountMinorUnits: number;
  readonly settlementCurrency: string;
  readonly amountAuthorityReference: string;
  readonly isSettled: boolean;
}

export interface PostTransactionLifecycleHooks {
  readonly cancellationPolicyReference?: string;
  readonly securityDepositHoldReference?: string;
  readonly refundEligibilityReference?: string;
  readonly disputeReference?: string;
  readonly reviewEligibilityReference?: string;
}
