/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Payout Instruction Record Contract
 *
 * Implements server-authoritative provider payout tracking, immutable beneficiary linkage,
 * integer minor units settlement representation, and payout reconciliation states.
 */

import { type PayoutLifecycleState } from './payout-lifecycle';

export type PayoutReconciliationStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'MISMATCH'
  | 'MANUAL_REVIEW_REQUIRED';

export interface PayoutInstructionRecord {
  readonly id: string;
  readonly bookingId: string;
  readonly providerId: string;
  readonly jurisdictionCode: string;
  readonly beneficiaryReference: string;
  readonly payoutAmountMinorUnits: number;
  readonly settlementCurrency: string;
  readonly payoutProviderId: string;
  readonly payoutMethod: string;
  readonly idempotencyKey: string;
  readonly providerReference?: string;
  readonly normalizedStatus: PayoutLifecycleState;
  readonly reconciliationStatus: PayoutReconciliationStatus;
  readonly failureReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
