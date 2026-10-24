/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Refund Entitlement & Execution Engine
 *
 * Implements server-authoritative refund calculation, cumulative over-refund protection,
 * client anti-tampering guards, idempotency, and provider-neutral execution handoff.
 *
 * PERMANENT INVARIANT:
 * REFUND POLICY ENGINE determines entitlement.
 * PAYMENT ORCHESTRATOR executes approved refund.
 * Provider adapter NEVER decides entitlement.
 */

import {
  type RefundInstruction,
  type RefundType,
  type RefundExecutionResult,
  canTransitionRefundStatus,
} from '../contracts/refund-lifecycle';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';
import { type PaymentAttemptRecord } from '@/lib/global-market/financial/contracts/payment-record';
import { financialProviderRegistry } from '@/lib/global-market/financial/registry/payment-provider-registry';
import { getPaymentAttemptById } from '@/lib/global-market/financial/services/payment-orchestrator';

// In-memory repositories for local and unit test state
const refundInstructionsById = new Map<string, RefundInstruction>();
const refundInstructionsByIdempotency = new Map<string, RefundInstruction>();
const cumulativeRefundsByPaymentAttempt = new Map<string, number>();

export interface CalculateRefundEntitlementInput {
  readonly booking: GlobalBookingRecord;
  readonly paymentRecord?: PaymentAttemptRecord | null;
  readonly refundType: RefundType;
  readonly refundPercentage: number; // 0 to 100 from cancellation or claim
  readonly requestedAmountMinorUnits?: number; // Optional client request
  readonly requestedCurrency?: string;
  readonly reason: string;
  readonly requestingUserId: string;
  readonly policyReference: string;
  readonly authorityRole?: 'SYSTEM_POLICY' | 'ADMIN' | 'SUPPORT_AGENT' | 'FINANCE_ADMIN';
  readonly idempotencyKey: string;
}

export interface RefundEntitlementResult {
  readonly eligible: boolean;
  readonly refundInstruction?: RefundInstruction;
  readonly maximumRefundableAmountMinorUnits: number;
  readonly approvedAmountMinorUnits: number;
  readonly currency: string;
  readonly isIdempotentReplay?: boolean;
  readonly error?: string;
}

/**
 * Calculates server-authoritative refund entitlement and creates an approved RefundInstruction.
 * Rejects tampering, prevents cumulative over-refunds, and verifies payment cleared state.
 */
export async function calculateAndCreateRefundInstruction(
  input: CalculateRefundEntitlementInput
): Promise<RefundEntitlementResult> {
  const {
    booking,
    paymentRecord,
    refundType,
    refundPercentage,
    requestedAmountMinorUnits,
    requestedCurrency,
    reason,
    requestingUserId,
    policyReference,
    authorityRole = 'SYSTEM_POLICY',
    idempotencyKey,
  } = input;

  // 1. Idempotency Check
  if (refundInstructionsByIdempotency.has(idempotencyKey)) {
    const existing = refundInstructionsByIdempotency.get(idempotencyKey)!;
    return {
      eligible: true,
      refundInstruction: existing,
      maximumRefundableAmountMinorUnits: existing.maximumRefundableAmountMinorUnits,
      approvedAmountMinorUnits: existing.approvedAmountMinorUnits,
      currency: existing.currency,
      isIdempotentReplay: true,
    };
  }

  // 2. Payment Existence & Success Verification (Section 37, 48)
  if (!paymentRecord) {
    return {
      eligible: false,
      maximumRefundableAmountMinorUnits: 0,
      approvedAmountMinorUnits: 0,
      currency: 'PHP',
      error: 'UNPAID_BOOKING_CANNOT_REFUND: No payment record associated with this booking.',
    };
  }

  if (paymentRecord.normalizedStatus !== 'SUCCEEDED') {
    return {
      eligible: false,
      maximumRefundableAmountMinorUnits: 0,
      approvedAmountMinorUnits: 0,
      currency: paymentRecord.transactionCurrency,
      error: `UNVERIFIED_PAYMENT_CANNOT_REFUND: Payment is in status '${paymentRecord.normalizedStatus}', must be 'SUCCEEDED'.`,
    };
  }

  // 3. Currency Tampering Guard (Section 48)
  if (requestedCurrency && requestedCurrency.toUpperCase() !== paymentRecord.transactionCurrency.toUpperCase()) {
    return {
      eligible: false,
      maximumRefundableAmountMinorUnits: 0,
      approvedAmountMinorUnits: 0,
      currency: paymentRecord.transactionCurrency,
      error: `REFUND_CURRENCY_TAMPERING_BLOCKED: Requested currency '${requestedCurrency}' does not match transaction currency '${paymentRecord.transactionCurrency}'.`,
    };
  }

  const transactionCurrency = paymentRecord.transactionCurrency;
  const totalPaid = paymentRecord.authoritativeAmountMinorUnits;
  const priorRefunds = cumulativeRefundsByPaymentAttempt.get(paymentRecord.id) || 0;
  const remainingPaidBalance = Math.max(0, totalPaid - priorRefunds);

  if (remainingPaidBalance <= 0) {
    return {
      eligible: false,
      maximumRefundableAmountMinorUnits: 0,
      approvedAmountMinorUnits: 0,
      currency: transactionCurrency,
      error: 'CUMULATIVE_OVER_REFUND_BLOCKED: Entire paid amount has already been refunded.',
    };
  }

  // 4. Calculate Maximum Refundable Base
  // Deposit is 100% refundable; rental base is subject to refundPercentage
  const depositMinor = booking.moneySnapshot.securityDepositAmountMinorUnits || 0;
  const rentalBaseMinor = Math.max(0, totalPaid - depositMinor);
  const calculatedRentalRefund = Math.round((rentalBaseMinor * Math.min(100, Math.max(0, refundPercentage))) / 100);
  const calculatedDepositRefund = depositMinor; // Full deposit returned on standard cancellation
  const calculatedTotalEligible = Math.min(remainingPaidBalance, calculatedRentalRefund + calculatedDepositRefund);

  // 5. Anti-Tampering on Requested Amount
  let finalApprovedAmount = calculatedTotalEligible;
  if (requestedAmountMinorUnits !== undefined) {
    if (requestedAmountMinorUnits > calculatedTotalEligible) {
      return {
        eligible: false,
        maximumRefundableAmountMinorUnits: calculatedTotalEligible,
        approvedAmountMinorUnits: 0,
        currency: transactionCurrency,
        error: `REFUND_AMOUNT_TAMPERING_BLOCKED: Requested amount ${requestedAmountMinorUnits} exceeds calculated eligible amount ${calculatedTotalEligible}.`,
      };
    }
    finalApprovedAmount = Math.max(0, requestedAmountMinorUnits);
  }

  // 6. Cumulative Over-Refund Check (Section 17, 48)
  if (priorRefunds + finalApprovedAmount > totalPaid) {
    return {
      eligible: false,
      maximumRefundableAmountMinorUnits: remainingPaidBalance,
      approvedAmountMinorUnits: 0,
      currency: transactionCurrency,
      error: `CUMULATIVE_OVER_REFUND_BLOCKED: Cumulative refunds (${priorRefunds + finalApprovedAmount}) would exceed paid amount (${totalPaid}).`,
    };
  }

  const now = new Date().toISOString();
  const instructionId = `ref_inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const refundNumber = `REF-${booking.participants.jurisdictionCode}-${Date.now().toString().slice(-6)}`;

  const instruction: RefundInstruction = Object.freeze({
    id: instructionId,
    refundNumber,
    bookingId: booking.id,
    paymentAttemptId: paymentRecord.id,
    refundType,
    maximumRefundableAmountMinorUnits: calculatedTotalEligible,
    approvedAmountMinorUnits: finalApprovedAmount,
    currency: transactionCurrency,
    recipientUserId: booking.participants.renterId,
    reason,
    policyReference,
    approvalAuthority: authorityRole,
    approvedByUserId: requestingUserId,
    providerExecutionRequired: true,
    status: 'APPROVED',
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
  });

  refundInstructionsById.set(instructionId, instruction);
  refundInstructionsByIdempotency.set(idempotencyKey, instruction);

  return {
    eligible: true,
    refundInstruction: instruction,
    maximumRefundableAmountMinorUnits: calculatedTotalEligible,
    approvedAmountMinorUnits: finalApprovedAmount,
    currency: transactionCurrency,
  };
}

/**
 * Executes an approved refund instruction through the payment provider rail.
 */
export async function executeApprovedRefund(
  instructionId: string,
  idempotencyKey: string
): Promise<RefundExecutionResult> {
  const instruction = refundInstructionsById.get(instructionId);
  if (!instruction) {
    return {
      success: false,
      refundInstruction: null as any,
      error: `REFUND_INSTRUCTION_NOT_FOUND: Instruction '${instructionId}' does not exist.`,
    };
  }

  if (instruction.status === 'REFUNDED') {
    return {
      success: true,
      refundInstruction: instruction,
      providerRefundReference: instruction.providerRefundReference,
      isIdempotentReplay: true,
    };
  }

  if (!canTransitionRefundStatus(instruction.status, 'PROCESSING')) {
    return {
      success: false,
      refundInstruction: instruction,
      error: `ILLEGAL_STATE_TRANSITION: Cannot execute refund from status '${instruction.status}'.`,
    };
  }

  const paymentRecord = getPaymentAttemptById(instruction.paymentAttemptId);
  if (!paymentRecord || !paymentRecord.providerReference) {
    return {
      success: false,
      refundInstruction: instruction,
      error: 'PAYMENT_RECORD_MISSING: Associated payment attempt or provider reference not found.',
    };
  }

  const adapter = financialProviderRegistry.getPaymentAdapter(paymentRecord.paymentProviderId);
  if (!adapter) {
    return {
      success: false,
      refundInstruction: instruction,
      error: `PROVIDER_ADAPTER_MISSING: Adapter '${paymentRecord.paymentProviderId}' not available.`,
    };
  }

  // Capability check (Section 11, 17)
  const hasRefundCapability = adapter.capabilities.includes('REFUND');
  if (!hasRefundCapability) {
    return {
      success: false,
      refundInstruction: instruction,
      error: `PROVIDER_REFUND_UNSUPPORTED: Provider '${paymentRecord.paymentProviderId}' does not support automated refunds.`,
    };
  }

  if (instruction.approvedAmountMinorUnits < paymentRecord.authoritativeAmountMinorUnits) {
    const hasPartialCapability = adapter.capabilities.includes('PARTIAL_REFUND');
    if (!hasPartialCapability) {
      return {
        success: false,
        refundInstruction: instruction,
        error: `PROVIDER_PARTIAL_REFUND_UNSUPPORTED: Provider '${paymentRecord.paymentProviderId}' does not support partial refunds.`,
      };
    }
  }

  // Invoke Provider Primitive
  const providerRefundRef = `prov_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let providerSuccess = true;
  if (adapter.refundPayment) {
    providerSuccess = await adapter.refundPayment(
      paymentRecord.providerReference,
      instruction.approvedAmountMinorUnits
    );
  }

  if (!providerSuccess) {
    return {
      success: false,
      refundInstruction: instruction,
      error: 'PROVIDER_REFUND_EXECUTION_FAILED: Payment provider rejected the refund instruction.',
    };
  }

  // Update cumulative refunds
  const currentCumulative = cumulativeRefundsByPaymentAttempt.get(paymentRecord.id) || 0;
  const newCumulative = currentCumulative + instruction.approvedAmountMinorUnits;
  cumulativeRefundsByPaymentAttempt.set(paymentRecord.id, newCumulative);

  const isFullRefund = newCumulative >= paymentRecord.authoritativeAmountMinorUnits;
  const newStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  const now = new Date().toISOString();

  const updatedInstruction: RefundInstruction = Object.freeze({
    ...instruction,
    providerRefundReference: providerRefundRef,
    status: newStatus,
    updatedAt: now,
  });

  refundInstructionsById.set(instructionId, updatedInstruction);

  return {
    success: true,
    refundInstruction: updatedInstruction,
    providerRefundReference: providerRefundRef,
  };
}

export function getRefundInstructionById(id: string): RefundInstruction | null {
  return refundInstructionsById.get(id) || null;
}

export function getCumulativeRefundAmount(paymentAttemptId: string): number {
  return cumulativeRefundsByPaymentAttempt.get(paymentAttemptId) || 0;
}
