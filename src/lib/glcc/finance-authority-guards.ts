/**
 * RENTipid GLCC v1.0 — Financial Authority Invariant Guards
 *
 * Work Package: GLCC-P6
 *
 * Implements:
 * 1. Strict mathematical and currency guards for settlement, ledger, refund, and payout.
 * 2. Immutable preservation of PAYMENT_CONTRACT_CURRENCY = 'PHP'.
 * 3. Prohibition of foreign-currency processor settlement or ledger mutation.
 * 4. Safe refund calculation strictly anchored in original PHP payment transaction.
 * 5. Provider payout calculation strictly anchored in PHP contract amounts.
 */

import { Prisma } from '@prisma/client';
import { PAYMENT_CONTRACT_CURRENCY } from '../payments/payment-currency-policy';

export class FinancialAuthorityError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FinancialAuthorityError';
  }
}

/**
 * Asserts that the settlement currency strictly matches the canonical platform currency (PHP).
 */
export function assertSettlementCurrencyInvariant(currency: string): void {
  const normalized = (currency || '').trim().toUpperCase();
  if (normalized !== PAYMENT_CONTRACT_CURRENCY) {
    throw new FinancialAuthorityError(
      `Provider settlement currency violation: expected ${PAYMENT_CONTRACT_CURRENCY}, got '${currency}'. Renter display currency must never alter settlement truth.`,
      'INVALID_SETTLEMENT_CURRENCY'
    );
  }
}

/**
 * Asserts that finance ledger entries are strictly recorded in the canonical currency (PHP).
 */
export function assertLedgerCurrencyInvariant(currency: string): void {
  const normalized = (currency || '').trim().toUpperCase();
  if (normalized !== PAYMENT_CONTRACT_CURRENCY) {
    throw new FinancialAuthorityError(
      `Finance ledger currency violation: expected ${PAYMENT_CONTRACT_CURRENCY}, got '${currency}'. Accounting truth must remain strictly in PHP.`,
      'INVALID_LEDGER_CURRENCY'
    );
  }
}

export interface RefundValidationParams {
  readonly originalPaymentAmountPhp: string | number;
  readonly originalPaymentCurrency: string;
  readonly requestedRefundAmountPhp: string | number;
  readonly refundCurrency: string;
}

/**
 * Asserts that refund operations are strictly derived from original PHP payment transactions.
 * Prohibits recalculating refunds using dynamic or current FX rates.
 */
export function assertRefundCalculationInvariant(params: RefundValidationParams): void {
  const origCurr = (params.originalPaymentCurrency || '').trim().toUpperCase();
  const refCurr = (params.refundCurrency || '').trim().toUpperCase();

  if (origCurr !== PAYMENT_CONTRACT_CURRENCY) {
    throw new FinancialAuthorityError(
      `Original payment currency violation: expected ${PAYMENT_CONTRACT_CURRENCY}, got '${params.originalPaymentCurrency}'`,
      'INVALID_ORIGINAL_PAYMENT_CURRENCY'
    );
  }

  if (refCurr !== PAYMENT_CONTRACT_CURRENCY) {
    throw new FinancialAuthorityError(
      `Refund currency violation: refunds must strictly be processed in ${PAYMENT_CONTRACT_CURRENCY}, got '${params.refundCurrency}'. Never refund in foreign display currencies.`,
      'INVALID_REFUND_CURRENCY'
    );
  }

  const origAmount = new Prisma.Decimal(params.originalPaymentAmountPhp);
  const refundAmount = new Prisma.Decimal(params.requestedRefundAmountPhp);

  if (refundAmount.isNegative()) {
    throw new FinancialAuthorityError('Refund amount cannot be negative', 'NEGATIVE_REFUND_AMOUNT');
  }

  if (refundAmount.greaterThan(origAmount)) {
    throw new FinancialAuthorityError(
      `Refund amount (${refundAmount.toFixed(2)} PHP) exceeds original payment amount (${origAmount.toFixed(2)} PHP)`,
      'EXCESSIVE_REFUND_AMOUNT'
    );
  }
}

export interface ProviderPayoutValidationParams {
  readonly grossRentalPhp: string | number;
  readonly platformCommissionPhp: string | number;
  readonly deliveryFeePassThroughPhp?: string | number;
  readonly expectedNetPayoutPhp: string | number;
  readonly payoutCurrency: string;
}

/**
 * Asserts that provider payouts are strictly calculated from authoritative booking amounts in PHP.
 */
export function assertProviderPayoutInvariant(params: ProviderPayoutValidationParams): void {
  const payoutCurr = (params.payoutCurrency || '').trim().toUpperCase();
  if (payoutCurr !== PAYMENT_CONTRACT_CURRENCY) {
    throw new FinancialAuthorityError(
      `Provider payout currency violation: expected ${PAYMENT_CONTRACT_CURRENCY}, got '${params.payoutCurrency}'. Renter display currency does not control provider payout currency.`,
      'INVALID_PAYOUT_CURRENCY'
    );
  }

  const gross = new Prisma.Decimal(params.grossRentalPhp);
  const commission = new Prisma.Decimal(params.platformCommissionPhp);
  const delivery = new Prisma.Decimal(params.deliveryFeePassThroughPhp ?? 0);
  const expectedNet = new Prisma.Decimal(params.expectedNetPayoutPhp);

  const calculatedNet = gross.minus(commission).plus(delivery);

  if (!calculatedNet.equals(expectedNet)) {
    throw new FinancialAuthorityError(
      `Payout calculation discrepancy: expected net ${expectedNet.toFixed(2)} PHP, calculated gross(${gross}) - comm(${commission}) + delivery(${delivery}) = ${calculatedNet.toFixed(2)} PHP`,
      'PAYOUT_CALCULATION_MISMATCH'
    );
  }
}

/**
 * Deterministically computes a safe refund amount in PHP based on the original payment transaction.
 */
export function calculateDeterministicRefund(params: {
  readonly originalPaymentAmountPhp: string | number;
  readonly refundRatio?: number; // e.g. 1.0 for 100%, 0.5 for 50%
  readonly flatDeductionPhp?: string | number;
}): { readonly refundAmountPhp: string; readonly currency: typeof PAYMENT_CONTRACT_CURRENCY } {
  const orig = new Prisma.Decimal(params.originalPaymentAmountPhp);
  const ratio = new Prisma.Decimal(params.refundRatio ?? 1.0);
  const deduction = new Prisma.Decimal(params.flatDeductionPhp ?? 0);

  if (ratio.isNegative() || ratio.greaterThan(1)) {
    throw new FinancialAuthorityError('Refund ratio must be between 0 and 1', 'INVALID_REFUND_RATIO');
  }

  let amount = orig.mul(ratio).minus(deduction);
  if (amount.isNegative()) {
    amount = new Prisma.Decimal(0);
  }

  return {
    refundAmountPhp: amount.toFixed(2),
    currency: PAYMENT_CONTRACT_CURRENCY,
  };
}
