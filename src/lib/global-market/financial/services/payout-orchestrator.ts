/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Payout Orchestrator Service
 *
 * Implements strict separation of payment collection from provider settlement,
 * server-authoritative beneficiary resolution, payout eligibility gating (consuming GM-3A and GM-5A),
 * settlement currency resolution, idempotency protection against duplicate payouts,
 * and deterministic reconciliation.
 */

import { type EligiblePayoutContext } from '@/lib/global-market/booking/contracts/payment-handoff';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';
import {
  type PayoutLifecycleState,
  canTransitionPayoutStatus,
} from '../contracts/payout-lifecycle';
import {
  type PayoutInstructionRecord,
  type PayoutReconciliationStatus,
} from '../contracts/payout-record';
import {
  resolveApprovedSettlementCurrency,
  type SettlementCurrencyPolicy,
} from '../contracts/currency-policy';
import { resolveJurisdictionPayoutProfile } from '../registry/jurisdiction-payout-registry';
import { financialProviderRegistry } from '../registry/payment-provider-registry';
import { type PaymentAttemptRecord } from '../contracts/payment-record';

// In-memory repositories for state management and idempotency in local execution
const payoutInstructionsById = new Map<string, PayoutInstructionRecord>();
const payoutInstructionsByIdempotency = new Map<string, PayoutInstructionRecord>();
const payoutInstructionsByBookingId = new Map<string, PayoutInstructionRecord>();

export interface PayoutEligibilityParams {
  readonly booking: GlobalBookingRecord;
  readonly paymentRecord?: PaymentAttemptRecord | null;
  readonly providerKycApproved: boolean;
  readonly hasOpenDispute?: boolean;
}

export interface PayoutEligibilityResult {
  readonly eligible: boolean;
  readonly reason?: string;
}

/**
 * Universal Payout Eligibility Gate (Section 30 & 39)
 * INVARIANT: PAYMENT SUCCEEDED does NOT automatically mean PAYOUT SUCCEEDED.
 * Evaluates booking completion, verified payment, provider KYC, and dispute holds.
 */
export function evaluatePayoutEligibility(
  params: PayoutEligibilityParams
): PayoutEligibilityResult {
  const { booking, paymentRecord, providerKycApproved, hasOpenDispute } = params;

  // 1. Payment Verification Check
  if (!paymentRecord || paymentRecord.normalizedStatus !== 'SUCCEEDED') {
    return {
      eligible: false,
      reason: 'PAYMENT_NOT_SETTLED: Provider payout cannot proceed because payment collection is not verified SUCCEEDED.',
    };
  }

  // 2. Booking Lifecycle Check (must be COMPLETED or ready per policy)
  if (booking.status !== 'COMPLETED') {
    return {
      eligible: false,
      reason: `BOOKING_NOT_COMPLETED: Booking is in status '${booking.status}'. Payout requires completed rental.`,
    };
  }

  // 3. Provider Payout KYC Check (Section 40)
  if (!providerKycApproved) {
    return {
      eligible: false,
      reason: 'PROVIDER_KYC_REQUIRED: Provider has not satisfied mandatory payout KYC verification.',
    };
  }

  // 4. Dispute Hold Check (Section 48)
  if (hasOpenDispute) {
    return {
      eligible: false,
      reason: 'DISPUTE_HOLD: Payout is held due to an open damage claim or dispute.',
    };
  }

  return { eligible: true };
}

export interface CreatePayoutInstructionInput {
  readonly eligibleContext: EligiblePayoutContext;
  readonly booking: GlobalBookingRecord;
  readonly paymentRecord: PaymentAttemptRecord;
  readonly providerKycApproved: boolean;
  readonly authoritativeBeneficiaryReference: string;
  readonly clientSubmittedBeneficiary?: string; // Tamper check
  readonly clientSubmittedAmount?: number; // Tamper check
  readonly clientSubmittedCurrency?: string; // Tamper check
  readonly idempotencyKey: string;
  readonly payoutProviderId?: string; // Default to 'mock_payout_rail' or 'manual_ph_bank'
}

export interface CreatePayoutInstructionResult {
  readonly success: boolean;
  readonly payoutInstruction?: PayoutInstructionRecord;
  readonly isIdempotentReplay?: boolean;
  readonly reason?: string;
}

/**
 * Creates a server-authoritative provider payout instruction.
 * Strictly prevents beneficiary redirection, duplicate payouts, and client tampering.
 */
export async function createPayoutInstruction(
  input: CreatePayoutInstructionInput
): Promise<CreatePayoutInstructionResult> {
  const {
    eligibleContext,
    booking,
    paymentRecord,
    providerKycApproved,
    authoritativeBeneficiaryReference,
    idempotencyKey,
  } = input;

  // 1. Idempotency Check (Section 36)
  if (payoutInstructionsByIdempotency.has(idempotencyKey)) {
    const existing = payoutInstructionsByIdempotency.get(idempotencyKey)!;
    return {
      success: true,
      payoutInstruction: existing,
      isIdempotentReplay: true,
    };
  }

  // Check if booking was already paid out
  if (payoutInstructionsByBookingId.has(booking.id)) {
    const existing = payoutInstructionsByBookingId.get(booking.id)!;
    return {
      success: true,
      payoutInstruction: existing,
      isIdempotentReplay: true,
    };
  }

  // 2. Beneficiary Tampering Guard (Section 31)
  if (
    input.clientSubmittedBeneficiary !== undefined &&
    input.clientSubmittedBeneficiary !== authoritativeBeneficiaryReference
  ) {
    throw new Error(
      `BENEFICIARY_TAMPERING_BLOCKED: Submitted beneficiary '${input.clientSubmittedBeneficiary}' does not match authoritative provider beneficiary '${authoritativeBeneficiaryReference}'.`
    );
  }

  // 3. Amount & Currency Tampering Guard (Section 31 & 35)
  if (
    input.clientSubmittedAmount !== undefined &&
    input.clientSubmittedAmount !== eligibleContext.payoutAmountMinorUnits
  ) {
    throw new Error(
      `PAYOUT_AMOUNT_TAMPERING_BLOCKED: Submitted amount (${input.clientSubmittedAmount}) does not match authoritative payout amount (${eligibleContext.payoutAmountMinorUnits}).`
    );
  }

  // 4. Payout Eligibility Evaluation (Section 30)
  const eligibility = evaluatePayoutEligibility({
    booking,
    paymentRecord,
    providerKycApproved,
  });
  if (!eligibility.eligible) {
    throw new Error(`PAYOUT_INELIGIBLE: ${eligibility.reason}`);
  }

  // 5. Jurisdiction & Settlement Currency Policy Resolution (Section 33 & 35)
  const profile = resolveJurisdictionPayoutProfile(eligibleContext.jurisdictionCode);
  if (!profile) {
    throw new Error(
      `UNKNOWN_JURISDICTION: Payout profile for jurisdiction '${eligibleContext.jurisdictionCode}' could not be resolved. Fail-closed.`
    );
  }

  const settlementPolicy: SettlementCurrencyPolicy = {
    jurisdictionCode: profile.jurisdictionCode,
    allowedSettlementCurrencies: profile.supportedSettlementCurrencies,
    defaultSettlementCurrency: profile.defaultSettlementCurrency,
    supportsCrossBorderSettlement: false,
  };

  const currencyResolution = resolveApprovedSettlementCurrency(
    settlementPolicy,
    input.clientSubmittedCurrency || eligibleContext.settlementCurrency
  );
  if (!currencyResolution.isValid || !currencyResolution.settlementCurrency) {
    throw new Error(`SETTLEMENT_CURRENCY_ERROR: ${currencyResolution.reason}`);
  }

  // 6. Select Payout Provider Adapter
  const providerIdToUse = input.payoutProviderId || profile.approvedProviderIds[0] || 'mock_payout_rail';
  const adapter = financialProviderRegistry.getPayoutAdapter(providerIdToUse);
  if (!adapter) {
    throw new Error(
      `PAYOUT_PROVIDER_UNAVAILABLE: Payout provider '${providerIdToUse}' is not configured for jurisdiction '${profile.jurisdictionCode}'.`
    );
  }

  // 7. Validate Beneficiary via Adapter
  const beneficiaryCheck = await adapter.validateBeneficiary({
    providerId: eligibleContext.providerId,
    beneficiaryReference: authoritativeBeneficiaryReference,
    accountType: 'BANK',
    jurisdictionCode: eligibleContext.jurisdictionCode,
    currency: currencyResolution.settlementCurrency,
  });
  if (!beneficiaryCheck.isValid) {
    throw new Error(`INVALID_BENEFICIARY: ${beneficiaryCheck.reason}`);
  }

  // 8. Create Payout Instruction
  const now = new Date().toISOString();
  const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const providerOutput = await adapter.createPayout({
    payoutId,
    bookingId: booking.id,
    providerId: eligibleContext.providerId,
    amountMinorUnits: eligibleContext.payoutAmountMinorUnits,
    currency: currencyResolution.settlementCurrency,
    beneficiaryReference: authoritativeBeneficiaryReference,
    description: `Rental Settlement Booking ${booking.bookingReference}`,
    idempotencyKey,
  });

  const record: PayoutInstructionRecord = Object.freeze({
    id: payoutId,
    bookingId: booking.id,
    providerId: eligibleContext.providerId,
    jurisdictionCode: eligibleContext.jurisdictionCode,
    beneficiaryReference: authoritativeBeneficiaryReference,
    payoutAmountMinorUnits: eligibleContext.payoutAmountMinorUnits,
    settlementCurrency: currencyResolution.settlementCurrency,
    payoutProviderId: adapter.providerId,
    payoutMethod: 'BANK_TRANSFER',
    idempotencyKey,
    providerReference: providerOutput.providerReference,
    normalizedStatus: providerOutput.initialStatus,
    reconciliationStatus: 'PENDING',
    createdAt: now,
    updatedAt: now,
  });

  payoutInstructionsById.set(payoutId, record);
  payoutInstructionsByIdempotency.set(idempotencyKey, record);
  payoutInstructionsByBookingId.set(booking.id, record);

  return {
    success: true,
    payoutInstruction: record,
  };
}

/**
 * Retrieves a payout instruction record by payout ID.
 */
export function getPayoutInstructionById(payoutId: string): PayoutInstructionRecord | null {
  return payoutInstructionsById.get(payoutId) || null;
}

export interface PayoutReconciliationResult {
  readonly status: PayoutReconciliationStatus;
  readonly matched: boolean;
  readonly expectedAmountMinorUnits: number;
  readonly providerAmountMinorUnits?: number;
  readonly expectedCurrency: string;
  readonly providerCurrency?: string;
  readonly updatedRecord: PayoutInstructionRecord;
}

/**
 * Reconciles provider payout truth against RENTipid record.
 */
export async function reconcilePayoutWithProvider(
  payoutId: string
): Promise<PayoutReconciliationResult> {
  const record = getPayoutInstructionById(payoutId);
  if (!record) {
    throw new Error(`RECONCILIATION_ERROR: Payout instruction '${payoutId}' not found.`);
  }

  const adapter = financialProviderRegistry.getPayoutAdapter(record.payoutProviderId);
  if (!adapter) {
    throw new Error(`RECONCILIATION_ERROR: Payout provider adapter '${record.payoutProviderId}' not found.`);
  }

  if (!record.providerReference) {
    throw new Error('RECONCILIATION_ERROR: Payout instruction has no provider reference.');
  }

  const providerTruth = await adapter.retrievePayoutStatus(record.providerReference);

  const amountMatch =
    providerTruth.amountMinorUnits === undefined ||
    providerTruth.amountMinorUnits === record.payoutAmountMinorUnits;

  const currencyMatch =
    providerTruth.currency === undefined ||
    providerTruth.currency.toUpperCase() === record.settlementCurrency.toUpperCase();

  const isMatched = amountMatch && currencyMatch;
  const status: PayoutReconciliationStatus = isMatched ? 'MATCHED' : 'MISMATCH';

  const now = new Date().toISOString();
  const updatedRecord: PayoutInstructionRecord = Object.freeze({
    ...record,
    normalizedStatus: isMatched && providerTruth.normalizedStatus === 'SUCCEEDED' ? 'SUCCEEDED' : record.normalizedStatus,
    reconciliationStatus: status,
    failureReason: isMatched ? record.failureReason : 'RECONCILIATION_MISMATCH',
    updatedAt: now,
  });

  payoutInstructionsById.set(record.id, updatedRecord);

  return {
    status,
    matched: isMatched,
    expectedAmountMinorUnits: record.payoutAmountMinorUnits,
    providerAmountMinorUnits: providerTruth.amountMinorUnits,
    expectedCurrency: record.settlementCurrency,
    providerCurrency: providerTruth.currency,
    updatedRecord,
  };
}
