/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Deposit Engine
 *
 * Enforces deposit policy evaluation, provider hold capability checks,
 * server-authoritative deposit amounts, anti-tampering guards, and deduction lifecycles.
 */

import {
  type DepositRecord,
  type DepositModel,
  type DepositLifecycleState,
  canTransitionDepositStatus,
} from '../contracts/deposit-lifecycle';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';
import { type PaymentAttemptRecord } from '@/lib/global-market/financial/contracts/payment-record';
import { financialProviderRegistry } from '@/lib/global-market/financial/registry/payment-provider-registry';

const depositRecordsById = new Map<string, DepositRecord>();
const depositRecordsByBookingId = new Map<string, DepositRecord>();

export interface RecordDepositInput {
  readonly booking: GlobalBookingRecord;
  readonly paymentRecord?: PaymentAttemptRecord | null;
  readonly depositModel?: DepositModel;
  readonly clientSubmittedAmount?: number; // Tamper check
  readonly clientSubmittedCurrency?: string; // Tamper check
  readonly idempotencyKey: string;
}

export interface DepositOperationResult {
  readonly success: boolean;
  readonly depositRecord?: DepositRecord;
  readonly isIdempotentReplay?: boolean;
  readonly error?: string;
}

/**
 * Records an authoritative deposit tied to a booking and payment snapshot.
 */
export async function recordBookingDeposit(
  input: RecordDepositInput
): Promise<DepositOperationResult> {
  const {
    booking,
    paymentRecord,
    depositModel = 'PAYMENT_COLLECTED',
    clientSubmittedAmount,
    clientSubmittedCurrency,
    idempotencyKey,
  } = input;

  // 1. Idempotency Check
  if (depositRecordsByBookingId.has(booking.id)) {
    const existing = depositRecordsByBookingId.get(booking.id)!;
    return {
      success: true,
      depositRecord: existing,
      isIdempotentReplay: true,
    };
  }

  const authoritativeDeposit = booking.moneySnapshot.securityDepositAmountMinorUnits || 0;
  const authoritativeCurrency = booking.moneySnapshot.bookingPriceCurrency;

  // 2. Anti-Tampering Check (Section 10, 49)
  if (clientSubmittedAmount !== undefined && clientSubmittedAmount !== authoritativeDeposit) {
    return {
      success: false,
      error: `DEPOSIT_AMOUNT_TAMPERING_BLOCKED: Client amount ${clientSubmittedAmount} does not match server authority ${authoritativeDeposit}.`,
    };
  }

  if (clientSubmittedCurrency && clientSubmittedCurrency.toUpperCase() !== authoritativeCurrency.toUpperCase()) {
    return {
      success: false,
      error: `DEPOSIT_CURRENCY_TAMPERING_BLOCKED: Client currency '${clientSubmittedCurrency}' does not match server authority '${authoritativeCurrency}'.`,
    };
  }

  // 3. Provider Hold Capability Check (Section 11, 49)
  if (depositModel === 'AUTHORIZATION_HOLD') {
    if (!paymentRecord) {
      return {
        success: false,
        error: 'DEPOSIT_PROVIDER_ERROR: Authorization hold requires an active payment provider attempt.',
      };
    }

    const adapter = financialProviderRegistry.getPaymentAdapter(paymentRecord.paymentProviderId);
    if (!adapter || !adapter.capabilities.includes('AUTHORIZATION')) {
      return {
        success: false,
        error: `DEPOSIT_HOLD_UNSUPPORTED: Provider '${paymentRecord?.paymentProviderId}' does not support authorization hold.`,
      };
    }
  }

  if (authoritativeDeposit <= 0) {
    const zeroRecord: DepositRecord = Object.freeze({
      id: `dep_zero_${booking.id}`,
      bookingId: booking.id,
      jurisdictionCode: booking.participants.jurisdictionCode,
      depositModel: 'NONE',
      requiredAmountMinorUnits: 0,
      heldAmountMinorUnits: 0,
      releasedAmountMinorUnits: 0,
      appliedAmountMinorUnits: 0,
      currency: authoritativeCurrency,
      status: 'NOT_REQUIRED',
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    depositRecordsById.set(zeroRecord.id, zeroRecord);
    depositRecordsByBookingId.set(booking.id, zeroRecord);
    return { success: true, depositRecord: zeroRecord };
  }

  const now = new Date().toISOString();
  const depositId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const initialStatus: DepositLifecycleState =
    paymentRecord?.normalizedStatus === 'SUCCEEDED' ? 'COLLECTED' : 'PENDING';

  const record: DepositRecord = Object.freeze({
    id: depositId,
    bookingId: booking.id,
    jurisdictionCode: booking.participants.jurisdictionCode,
    depositModel,
    requiredAmountMinorUnits: authoritativeDeposit,
    heldAmountMinorUnits: initialStatus === 'COLLECTED' ? authoritativeDeposit : 0,
    releasedAmountMinorUnits: 0,
    appliedAmountMinorUnits: 0,
    currency: authoritativeCurrency,
    status: initialStatus,
    providerReference: paymentRecord?.providerReference,
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
  });

  depositRecordsById.set(depositId, record);
  depositRecordsByBookingId.set(booking.id, record);

  return {
    success: true,
    depositRecord: record,
  };
}

/**
 * Releases deposit back to the renter.
 */
export async function releaseDeposit(
  depositId: string,
  authorizedByUserId: string,
  reason: string,
  releaseAmountMinorUnits?: number
): Promise<DepositOperationResult> {
  const deposit = depositRecordsById.get(depositId);
  if (!deposit) {
    return { success: false, error: `DEPOSIT_NOT_FOUND: Deposit '${depositId}' does not exist.` };
  }

  if (deposit.status === 'RELEASED') {
    return { success: true, depositRecord: deposit, isIdempotentReplay: true };
  }

  const amountToRelease = releaseAmountMinorUnits ?? deposit.heldAmountMinorUnits;
  if (amountToRelease > deposit.heldAmountMinorUnits) {
    return {
      success: false,
      error: `OVER_RELEASE_BLOCKED: Cannot release ${amountToRelease} which exceeds currently held amount ${deposit.heldAmountMinorUnits}.`,
    };
  }

  const remainingHeld = deposit.heldAmountMinorUnits - amountToRelease;
  const isFullRelease = remainingHeld <= 0;
  const targetStatus: DepositLifecycleState = isFullRelease ? 'RELEASED' : 'PARTIALLY_RELEASED';

  if (!canTransitionDepositStatus(deposit.status, targetStatus)) {
    return {
      success: false,
      error: `ILLEGAL_STATE_TRANSITION: Cannot transition deposit from '${deposit.status}' to '${targetStatus}'.`,
    };
  }

  const now = new Date().toISOString();
  const updated: DepositRecord = Object.freeze({
    ...deposit,
    heldAmountMinorUnits: remainingHeld,
    releasedAmountMinorUnits: deposit.releasedAmountMinorUnits + amountToRelease,
    status: targetStatus,
    updatedAt: now,
  });

  depositRecordsById.set(depositId, updated);
  depositRecordsByBookingId.set(deposit.bookingId, updated);

  return { success: true, depositRecord: updated };
}

/**
 * Applies a deposit deduction to compensate a provider for damage or loss.
 */
export async function applyDepositDeduction(
  depositId: string,
  claimId: string,
  deductionAmountMinorUnits: number,
  authorizedByUserId: string
): Promise<DepositOperationResult> {
  const deposit = depositRecordsById.get(depositId);
  if (!deposit) {
    return { success: false, error: `DEPOSIT_NOT_FOUND: Deposit '${depositId}' does not exist.` };
  }

  if (deductionAmountMinorUnits > deposit.heldAmountMinorUnits) {
    return {
      success: false,
      error: `DEDUCTION_EXCEEDS_DEPOSIT: Deduction amount ${deductionAmountMinorUnits} exceeds held deposit ${deposit.heldAmountMinorUnits}.`,
    };
  }

  const remainingHeld = deposit.heldAmountMinorUnits - deductionAmountMinorUnits;
  const isFullDeduction = remainingHeld <= 0;
  const targetStatus: DepositLifecycleState = isFullDeduction ? 'APPLIED' : 'PARTIALLY_APPLIED';

  if (!canTransitionDepositStatus(deposit.status, targetStatus)) {
    return {
      success: false,
      error: `ILLEGAL_STATE_TRANSITION: Cannot transition deposit from '${deposit.status}' to '${targetStatus}'.`,
    };
  }

  const now = new Date().toISOString();
  const updated: DepositRecord = Object.freeze({
    ...deposit,
    heldAmountMinorUnits: remainingHeld,
    appliedAmountMinorUnits: deposit.appliedAmountMinorUnits + deductionAmountMinorUnits,
    claimId,
    status: targetStatus,
    updatedAt: now,
  });

  depositRecordsById.set(depositId, updated);
  depositRecordsByBookingId.set(deposit.bookingId, updated);

  return { success: true, depositRecord: updated };
}

export function getDepositRecordByBookingId(bookingId: string): DepositRecord | null {
  return depositRecordsByBookingId.get(bookingId) || null;
}
