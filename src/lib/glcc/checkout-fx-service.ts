/**
 * RENTipid GLCC v1.0 — Checkout FX Service & Quote Verification Engine
 *
 * Work Package: GLCC-P6
 *
 * Implements:
 * 1. Checkout quote generation with strict Owner-approved 120s TTL (APPROVED_CHECKOUT_FRESHNESS_MS).
 * 2. Mandatory separation between display estimate currency and authoritative payment charge currency (PHP).
 * 3. Authoritative price re-read enforcement: quote is strictly bound to current booking amounts.
 * 4. Material change detection requiring renewed confirmation if rate or total deviates.
 * 5. Rejection of expired checkout quotes without charging.
 * 6. Protection against client tampering: client cannot provide rates, providers, or charge currency.
 * 7. Preservation of quote evidence snapshot for consequential transaction records.
 * 8. Zero persistent database mutations in this service.
 */

import { Prisma } from '@prisma/client';
import { PAYMENT_CONTRACT_CURRENCY } from '../payments/payment-currency-policy';
import {
  getApprovedFreshnessPolicy,
  getApprovedOutlierPolicy,
  getApprovedFeePolicy,
  APPROVED_ROUNDING_POLICY,
  APPROVED_CHECKOUT_FRESHNESS_MS,
} from './fx-policy';
import { createFxQuote, type FxQuoteResult } from './fx-quote-service';
import type {
  FxQuoteEvidence,
  FxRateProvider,
  FxRateCache,
} from './fx-contracts';
import { InMemoryFxRateCache } from './fx-cache';
import { CurrencyApiRateProvider } from './currencyapi-adapter';
import { getDefaultRegistryContext } from './default-registries';

// Shared default cache for checkout quote service
const defaultCheckoutCache = new InMemoryFxRateCache();

export interface CheckoutQuoteParams {
  /**
   * Authoritative base amount in PHP (e.g. from DB booking record).
   */
  readonly authoritativeAmountPhp: string | number;
  /**
   * Renter's target display currency (e.g. "USD", "JPY", "EUR").
   */
  readonly targetDisplayCurrency: string;
  /**
   * Evaluation timestamp (defaults to current server time).
   */
  readonly evaluationTime?: Date | string;
  /**
   * Optional custom provider (defaults to production CurrencyAPI adapter).
   */
  readonly provider?: FxRateProvider;
  /**
   * Optional custom cache (defaults to global memory cache).
   */
  readonly cache?: FxRateCache;
  /**
   * Previously acknowledged quote evidence to check for material divergence.
   */
  readonly previousQuote?: FxQuoteEvidence | null;
  /**
   * Idempotency or booking reference.
   */
  readonly idempotencyRef?: string;
}

export type ReconfirmationReason =
  | 'FIRST_EVALUATION'
  | 'RATE_CHANGED'
  | 'TOTAL_CHANGED'
  | 'QUOTE_EXPIRED'
  | 'OUTLIER_BLOCKED'
  | 'PROVIDER_UNAVAILABLE';

export interface CheckoutQuoteResult {
  readonly quote: FxQuoteEvidence;
  readonly isSuccess: boolean;
  readonly authoritativeCharge: {
    readonly amount: string;
    readonly currency: typeof PAYMENT_CONTRACT_CURRENCY;
  };
  readonly displayEstimate: {
    readonly amount: string;
    readonly currency: string;
  };
  readonly freshUntil: string;
  readonly requiresReconfirmation: boolean;
  readonly reconfirmationReason?: ReconfirmationReason;
}

export interface QuoteVerificationResult {
  readonly isValid: boolean;
  readonly failureReason?: string;
  readonly quote?: FxQuoteEvidence;
}

/**
 * Validates that the requested target currency is known and supported.
 */
function validateTargetCurrency(targetCurrency: string, evalDate: Date): string {
  const normalized = targetCurrency.trim().toUpperCase();
  const registryContext = getDefaultRegistryContext();
  const meta = registryContext.currencies.get(normalized, evalDate);
  if (!meta || !meta.isActive) {
    throw new Error(`Unsupported or inactive target currency for checkout: ${targetCurrency}`);
  }
  return normalized;
}

/**
 * Generates a fresh, authoritative checkout FX quote.
 */
export async function generateCheckoutQuote(
  params: CheckoutQuoteParams
): Promise<CheckoutQuoteResult> {
  const evalDate = params.evaluationTime
    ? (typeof params.evaluationTime === 'string' ? new Date(params.evaluationTime) : params.evaluationTime)
    : new Date();

  // 1. Authoritative price normalization
  const authoritativeDec = new Prisma.Decimal(params.authoritativeAmountPhp);
  if (authoritativeDec.isNegative() || authoritativeDec.isZero()) {
    throw new Error(`Authoritative checkout amount must be strictly positive: ${params.authoritativeAmountPhp}`);
  }
  const authoritativeAmountStr = authoritativeDec.toFixed(2);

  // 2. Target currency validation
  const targetCurrency = validateTargetCurrency(params.targetDisplayCurrency, evalDate);

  // 3. Provider & Cache resolution
  const provider = params.provider ?? new CurrencyApiRateProvider();
  const cache = params.cache ?? defaultCheckoutCache;

  // 4. Create authoritative quote evidence using P5 domain service
  const quoteResult: FxQuoteResult = await createFxQuote({
    sourceMoney: {
      amountExact: authoritativeAmountStr,
      currencyCode: PAYMENT_CONTRACT_CURRENCY,
      currencyExponent: 2,
    },
    targetCurrency,
    context: 'CHECKOUT_QUOTE',
    evaluationTime: evalDate,
    provider,
    cache,
    freshnessPolicy: getApprovedFreshnessPolicy(),
    outlierPolicy: getApprovedOutlierPolicy(),
    feePolicy: getApprovedFeePolicy(),
    roundingPolicyRef: APPROVED_ROUNDING_POLICY,
    idempotencyRef: params.idempotencyRef,
  });

  const quote = quoteResult.quote;
  const isSuccess = quoteResult.isSuccess && quote.quoteStatus === 'ACTIVE';

  // 5. Compute freshUntil timestamp (min of quote.expiresAt and evalDate + 120,000ms)
  const ttlMaxIso = new Date(evalDate.getTime() + APPROVED_CHECKOUT_FRESHNESS_MS).toISOString();
  const freshUntil = quote.expiresAt < ttlMaxIso ? quote.expiresAt : ttlMaxIso;

  // 6. Detect material divergence if a previous quote was provided
  let requiresReconfirmation = false;
  let reconfirmationReason: ReconfirmationReason | undefined;

  if (!params.previousQuote) {
    requiresReconfirmation = false;
  } else {
    const prev = params.previousQuote;
    const prevObservedTime = new Date(prev.providerObservedAt).getTime();
    const isPrevExpired = (evalDate.getTime() - prevObservedTime) > APPROVED_CHECKOUT_FRESHNESS_MS;

    if (isPrevExpired || prev.quoteStatus === 'EXPIRED') {
      requiresReconfirmation = true;
      reconfirmationReason = 'QUOTE_EXPIRED';
    } else if (prev.sourceAmount !== authoritativeAmountStr) {
      requiresReconfirmation = true;
      reconfirmationReason = 'TOTAL_CHANGED';
    } else if (prev.rate !== quote.rate || prev.targetAmount !== quote.targetAmount) {
      requiresReconfirmation = true;
      reconfirmationReason = 'RATE_CHANGED';
    }
  }

  if (!isSuccess) {
    if (quote.quoteStatus === 'OUTLIER_BLOCKED') {
      requiresReconfirmation = true;
      reconfirmationReason = 'OUTLIER_BLOCKED';
    } else if (quote.quoteStatus === 'PROVIDER_FAILED') {
      requiresReconfirmation = true;
      reconfirmationReason = 'PROVIDER_UNAVAILABLE';
    } else if (quote.quoteStatus === 'EXPIRED') {
      requiresReconfirmation = true;
      reconfirmationReason = 'QUOTE_EXPIRED';
    }
  }

  return Object.freeze({
    quote,
    isSuccess,
    authoritativeCharge: Object.freeze({
      amount: authoritativeAmountStr,
      currency: PAYMENT_CONTRACT_CURRENCY,
    }),
    displayEstimate: Object.freeze({
      amount: quote.targetAmount,
      currency: quote.targetCurrency,
    }),
    freshUntil,
    requiresReconfirmation,
    reconfirmationReason,
  });
}

/**
 * Strictly verifies a checkout quote before payment initiation.
 * Fails closed if expired, mutated, tampered, or mismatched with authoritative DB truth.
 */
export function verifyCheckoutQuote(
  quote: FxQuoteEvidence,
  currentAuthoritativeAmountPhp: string | number,
  evalTime: Date = new Date()
): QuoteVerificationResult {
  // 1. Context validation
  if (quote.context !== 'CHECKOUT_QUOTE') {
    return {
      isValid: false,
      failureReason: `Invalid quote context: expected CHECKOUT_QUOTE, got ${quote.context}`,
      quote,
    };
  }

  // 2. Status validation
  if (quote.quoteStatus !== 'ACTIVE') {
    return {
      isValid: false,
      failureReason: `Quote is not active: status is ${quote.quoteStatus}`,
      quote,
    };
  }

  // 3. Authoritative charge currency validation
  if (quote.sourceCurrency !== PAYMENT_CONTRACT_CURRENCY) {
    return {
      isValid: false,
      failureReason: `Authoritative source currency must strictly be ${PAYMENT_CONTRACT_CURRENCY}, got ${quote.sourceCurrency}`,
      quote,
    };
  }

  // 4. Authoritative amount check
  const currentDec = new Prisma.Decimal(currentAuthoritativeAmountPhp).toFixed(2);
  const quoteDec = new Prisma.Decimal(quote.sourceAmount).toFixed(2);
  if (currentDec !== quoteDec) {
    return {
      isValid: false,
      failureReason: `Authoritative amount mutated: quote had ${quoteDec} PHP, current booking total is ${currentDec} PHP`,
      quote,
    };
  }

  // 5. Expiry check against approved 120s TTL
  const expiresAtTime = new Date(quote.expiresAt).getTime();
  const evalTimestamp = evalTime.getTime();
  if (evalTimestamp >= expiresAtTime) {
    return {
      isValid: false,
      failureReason: `Checkout quote has expired (expired at ${quote.expiresAt}, verified at ${evalTime.toISOString()})`,
      quote,
    };
  }

  const observedAtTime = new Date(quote.providerObservedAt).getTime();
  const ageMs = evalTimestamp - observedAtTime;
  if (ageMs > APPROVED_CHECKOUT_FRESHNESS_MS) {
    return {
      isValid: false,
      failureReason: `Checkout quote age exceeds approved freshness TTL (${ageMs}ms > ${APPROVED_CHECKOUT_FRESHNESS_MS}ms)`,
      quote,
    };
  }

  return {
    isValid: true,
    quote,
  };
}

/**
 * Serializes immutable quote evidence for inclusion in transaction metadata / audit logs.
 */
export function serializeCheckoutFxEvidence(quote: FxQuoteEvidence): string {
  return JSON.stringify({
    quoteId: quote.quoteId,
    rateSourceRef: quote.rateSourceRef,
    providerId: quote.providerId,
    sourceAmount: quote.sourceAmount,
    sourceCurrency: quote.sourceCurrency,
    targetAmount: quote.targetAmount,
    targetCurrency: quote.targetCurrency,
    rate: quote.rate,
    providerObservedAt: quote.providerObservedAt,
    createdAt: quote.createdAt,
    expiresAt: quote.expiresAt,
    feePolicyRef: quote.feePolicyRef,
    spreadPolicyRef: quote.spreadPolicyRef,
    roundingPolicyRef: quote.roundingPolicyRef,
    context: quote.context,
    quoteStatus: quote.quoteStatus,
    idempotencyRef: quote.idempotencyRef,
    provenance: quote.provenance,
  });
}

/**
 * Deserializes and validates stored quote evidence.
 */
export function deserializeCheckoutFxEvidence(raw: string): FxQuoteEvidence | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.quoteId || !parsed.sourceCurrency || !parsed.targetCurrency || !parsed.rate) {
      return null;
    }
    return Object.freeze(parsed as FxQuoteEvidence);
  } catch {
    return null;
  }
}
