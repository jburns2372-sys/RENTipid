/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Payment Attempt Record Contract
 *
 * Implements server-authoritative payment tracking, immutable booking linkage,
 * integer minor units financial representation, and reconciliation states.
 */

import { type PaymentLifecycleState } from './payment-lifecycle';

export type PaymentReconciliationStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'MISMATCH'
  | 'MANUAL_REVIEW_REQUIRED';

export interface PaymentAttemptRecord {
  readonly id: string;
  readonly bookingId: string;
  readonly payerId: string;
  readonly providerId: string;
  readonly jurisdictionCode: string;
  readonly authoritativeAmountMinorUnits: number;
  readonly depositAmountMinorUnits: number;
  readonly deliveryFeeMinorUnits: number;
  readonly transactionCurrency: string;
  readonly paymentProviderId: string;
  readonly paymentMethod?: string;
  readonly idempotencyKey: string;
  readonly providerReference?: string;
  readonly providerCheckoutUrl?: string;
  readonly normalizedStatus: PaymentLifecycleState;
  readonly reconciliationStatus: PaymentReconciliationStatus;
  readonly failureReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
