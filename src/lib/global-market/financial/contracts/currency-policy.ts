/**
 * RENTipid GLOBAL-MKT / v2.0 — Transaction & Settlement Currency Policies
 *
 * Enforces the permanent architectural invariant:
 * PAYMENT COLLECTION != PROVIDER PAYOUT != DISPLAY CURRENCY != TRANSACTION CURRENCY != SETTLEMENT CURRENCY
 * Strictly prohibits fake FX and unverified currency conversions.
 */

export interface TransactionCurrencyPolicy {
  readonly jurisdictionCode: string;
  readonly allowedTransactionCurrencies: readonly string[];
  readonly defaultTransactionCurrency: string;
  readonly allowsForeignCardCollection: boolean;
  readonly supportsMultiCurrencyTransaction: boolean;
}

export interface SettlementCurrencyPolicy {
  readonly jurisdictionCode: string;
  readonly allowedSettlementCurrencies: readonly string[];
  readonly defaultSettlementCurrency: string;
  readonly supportsCrossBorderSettlement: boolean;
}

export interface TransactionCurrencyResolutionResult {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly transactionCurrency?: string;
  readonly conversionRequired: boolean;
}

/**
 * Resolves the approved transaction currency for payment collection.
 * Rejects fake FX; fails closed if currency conversion is unverified.
 */
export function resolveApprovedTransactionCurrency(
  bookingCurrency: string,
  policy: TransactionCurrencyPolicy,
  requestedCurrency?: string
): TransactionCurrencyResolutionResult {
  const targetCurrency = (requestedCurrency || bookingCurrency).toUpperCase();

  // 1. If target currency is directly supported in policy
  if (policy.allowedTransactionCurrencies.includes(targetCurrency)) {
    return {
      isValid: true,
      transactionCurrency: targetCurrency,
      conversionRequired: targetCurrency !== bookingCurrency,
    };
  }

  // 2. If conversion is requested but unverified
  if (targetCurrency !== policy.defaultTransactionCurrency) {
    return {
      isValid: false,
      reason: `UNVERIFIED_TRANSACTION_CURRENCY: Currency '${targetCurrency}' is not an approved transaction currency in jurisdiction '${policy.jurisdictionCode}'. Fake FX is strictly prohibited.`,
      conversionRequired: true,
    };
  }

  return {
    isValid: true,
    transactionCurrency: policy.defaultTransactionCurrency,
    conversionRequired: bookingCurrency !== policy.defaultTransactionCurrency,
  };
}

export interface SettlementCurrencyResolutionResult {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly settlementCurrency?: string;
}

/**
 * Resolves the approved settlement currency for provider payout.
 * Decoupled from display currency, listing currency, and transaction currency.
 */
export function resolveApprovedSettlementCurrency(
  policy: SettlementCurrencyPolicy,
  requestedSettlementCurrency?: string
): SettlementCurrencyResolutionResult {
  const target = (requestedSettlementCurrency || policy.defaultSettlementCurrency).toUpperCase();

  if (!policy.allowedSettlementCurrencies.includes(target)) {
    return {
      isValid: false,
      reason: `UNSUPPORTED_SETTLEMENT_CURRENCY: Settlement currency '${target}' is not allowed in jurisdiction '${policy.jurisdictionCode}'.`,
    };
  }

  return {
    isValid: true,
    settlementCurrency: target,
  };
}
