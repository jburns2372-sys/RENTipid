/**
 * RENTipid GLCC v1.0 — FX Quote Service & Evidence Builder
 *
 * Work Package: GLCC-P5A
 *
 * Implements:
 * 1. Pure domain service for creating authoritative FX quote evidence.
 * 2. Strict enforcement of context separation (BROWSE_ESTIMATE vs CHECKOUT_QUOTE vs REFUND_REFERENCE).
 * 3. Freshness and TTL validation (browse tolerance vs strict checkout freshness).
 * 4. Outlier protection with deterministic blocking.
 * 5. Safe canonical fallback on provider failure in BROWSE_ESTIMATE (never fabricate rates).
 * 6. Fee / spread policy boundary (explicit 'NONE' if unconfigured; no hidden markup).
 * 7. Complete immutability of generated quote evidence records.
 * 8. Zero database writes, zero payment operations, zero ledger mutations.
 */

import { Prisma } from '@prisma/client';
import { convertMoney } from './fx-math';
import { getDefaultRegistryContext } from './default-registries';
import type {
  CreateFxQuoteInput,
  FxQuoteEvidence,
  FxStatus,
  FxObservabilityEvent,
  NormalizedFxRate,
} from './fx-contracts';

// In-memory observability listener registry
type FxEventListener = (event: FxObservabilityEvent) => void;
const eventListeners: FxEventListener[] = [];

export function registerFxEventListener(listener: FxEventListener): () => void {
  eventListeners.push(listener);
  return () => {
    const idx = eventListeners.indexOf(listener);
    if (idx >= 0) eventListeners.splice(idx, 1);
  };
}

function dispatchFxEvent(event: FxObservabilityEvent): void {
  for (const listener of eventListeners) {
    try {
      listener(event);
    } catch {
      // Non-blocking telemetry
    }
  }
}

/**
 * Generates an opaque, traceable quote ID.
 */
function generateQuoteId(context: string, evalTime: Date): string {
  const timestamp = evalTime.getTime();
  const rand = Math.random().toString(36).substring(2, 10);
  return `fxq_${context.toLowerCase().slice(0, 3)}_${timestamp}_${rand}`;
}

export interface FxQuoteResult {
  readonly quote: FxQuoteEvidence;
  readonly isSuccess: boolean;
  readonly targetAmount: string;
  readonly targetCurrency: string;
}

/**
 * Creates an authoritative, immutable FX quote evidence record.
 */
export async function createFxQuote(input: CreateFxQuoteInput): Promise<FxQuoteResult> {
  const evalDate = input.evaluationTime
    ? (typeof input.evaluationTime === 'string' ? new Date(input.evaluationTime) : input.evaluationTime)
    : new Date();

  const evalIso = evalDate.toISOString();
  const sourceCurrency = input.sourceMoney.currencyCode.toUpperCase();
  const targetCurrency = input.targetCurrency.toUpperCase();
  const quoteId = generateQuoteId(input.context, evalDate);

  const registryContext = getDefaultRegistryContext();
  const targetMeta = registryContext.currencies.get(targetCurrency, evalDate);

  // Target currency exponent: from registry, input override, or fallback to 2
  let targetExponent = input.customTargetExponent;
  if (targetExponent === undefined) {
    targetExponent = targetMeta ? targetMeta.minorUnitExponent : 2;
  }

  // Identical source and target currency: Identity conversion
  if (sourceCurrency === targetCurrency) {
    const quote: FxQuoteEvidence = Object.freeze({
      quoteId,
      rateSourceRef: 'identity',
      providerId: input.provider.providerId,
      sourceAmount: input.sourceMoney.amountExact,
      sourceCurrency,
      targetCurrency,
      rate: '1.00000000',
      providerObservedAt: evalIso,
      createdAt: evalIso,
      expiresAt: new Date(evalDate.getTime() + 86_400_000).toISOString(), // 24h
      feePolicyRef: input.feePolicy?.feePolicyRef ?? 'NONE',
      spreadPolicyRef: input.feePolicy?.spreadPolicyRef ?? 'NONE',
      roundingPolicyRef: input.roundingPolicyRef ?? 'ROUND_HALF_UP',
      targetAmount: input.sourceMoney.amountExact,
      context: input.context,
      idempotencyRef: input.idempotencyRef,
      quoteStatus: 'ACTIVE',
      provenance: {
        evaluatedAt: evalIso,
        canonicalFallbackUsed: false,
      },
    });

    dispatchFxEvent({
      eventType: 'fx_quote_success',
      timestamp: evalIso,
      providerId: input.provider.providerId,
      baseCurrency: sourceCurrency,
      quoteCurrency: targetCurrency,
      quoteId,
    });

    return {
      quote,
      isSuccess: true,
      targetAmount: quote.targetAmount,
      targetCurrency: quote.targetCurrency,
    };
  }

  // 1. Resolve Normalized Rate (Cache -> Provider)
  let rate: NormalizedFxRate | null = null;
  let cachedBaseline: NormalizedFxRate | null = null;
  if (input.cache) {
    cachedBaseline = input.cache.getLatest
      ? input.cache.getLatest(sourceCurrency, targetCurrency)
      : input.cache.get(sourceCurrency, targetCurrency);
    rate = input.cache.get(sourceCurrency, targetCurrency, evalDate);
  }

  const startTime = Date.now();
  let fetchedFromProvider = false;
  if (!rate) {
    try {
      rate = await input.provider.getRate(sourceCurrency, targetCurrency, { asOf: evalDate });
      fetchedFromProvider = true;
      const latencyMs = Date.now() - startTime;
      dispatchFxEvent({
        eventType: 'fx_provider_latency',
        timestamp: evalIso,
        providerId: input.provider.providerId,
        latencyMs,
      });
    } catch (err: unknown) {
      // Provider failure / timeout / unsupported
      const errorMsg = err instanceof Error ? err.message : String(err);
      dispatchFxEvent({
        eventType: 'fx_quote_failure',
        timestamp: evalIso,
        providerId: input.provider.providerId,
        baseCurrency: sourceCurrency,
        quoteCurrency: targetCurrency,
        reason: errorMsg,
        quoteId,
      });

      // BROWSE fallback behavior: Return canonical currency without fabricating rate
      if (input.context === 'BROWSE_ESTIMATE') {
        const fallbackQuote: FxQuoteEvidence = Object.freeze({
          quoteId,
          rateSourceRef: 'unavailable',
          providerId: input.provider.providerId,
          sourceAmount: input.sourceMoney.amountExact,
          sourceCurrency,
          targetCurrency: sourceCurrency, // Canonical currency fallback
          rate: '1.00000000',
          providerObservedAt: evalIso,
          createdAt: evalIso,
          expiresAt: evalIso,
          feePolicyRef: input.feePolicy?.feePolicyRef ?? 'NONE',
          spreadPolicyRef: input.feePolicy?.spreadPolicyRef ?? 'NONE',
          roundingPolicyRef: input.roundingPolicyRef ?? 'ROUND_HALF_UP',
          targetAmount: input.sourceMoney.amountExact,
          context: input.context,
          idempotencyRef: input.idempotencyRef,
          quoteStatus: 'PROVIDER_FAILED',
          provenance: {
            evaluatedAt: evalIso,
            canonicalFallbackUsed: true,
            failureReason: errorMsg,
          },
        });

        return {
          quote: fallbackQuote,
          isSuccess: false,
          targetAmount: fallbackQuote.targetAmount,
          targetCurrency: fallbackQuote.targetCurrency,
        };
      }

      // CHECKOUT failure behavior: Fail closed, zero fake rates
      const failedQuote: FxQuoteEvidence = Object.freeze({
        quoteId,
        rateSourceRef: 'unavailable',
        providerId: input.provider.providerId,
        sourceAmount: input.sourceMoney.amountExact,
        sourceCurrency,
        targetCurrency,
        rate: '0.00000000',
        providerObservedAt: evalIso,
        createdAt: evalIso,
        expiresAt: evalIso,
        feePolicyRef: input.feePolicy?.feePolicyRef ?? 'NONE',
        spreadPolicyRef: input.feePolicy?.spreadPolicyRef ?? 'NONE',
        roundingPolicyRef: input.roundingPolicyRef ?? 'ROUND_HALF_UP',
        targetAmount: '0.00',
        context: input.context,
        idempotencyRef: input.idempotencyRef,
        quoteStatus: 'PROVIDER_FAILED',
        provenance: {
          evaluatedAt: evalIso,
          canonicalFallbackUsed: false,
          failureReason: errorMsg,
        },
      });

      return {
        quote: failedQuote,
        isSuccess: false,
        targetAmount: failedQuote.targetAmount,
        targetCurrency: failedQuote.targetCurrency,
      };
    }
  }

  // 2. Freshness & Expiry Validation
  const observedAt = new Date(rate.providerObservedAt);
  const expiresAt = new Date(rate.expiresAt);
  const ageMs = evalDate.getTime() - observedAt.getTime();

  const browseFreshnessMs = input.freshnessPolicy?.browseFreshnessMs ?? 300_000;  // 5 min
  const checkoutFreshnessMs = input.freshnessPolicy?.checkoutFreshnessMs ?? 60_000; // 1 min

  let quoteStatus: FxStatus = 'ACTIVE';

  if (evalDate.getTime() >= expiresAt.getTime()) {
    quoteStatus = 'EXPIRED';
  } else if (input.context === 'CHECKOUT_QUOTE' && ageMs > checkoutFreshnessMs) {
    quoteStatus = 'EXPIRED';
  } else if (input.context === 'BROWSE_ESTIMATE' && ageMs > browseFreshnessMs) {
    quoteStatus = 'STALE';
  }

  // If checkout quote is expired or stale, reject it
  if (input.context === 'CHECKOUT_QUOTE' && (quoteStatus === 'EXPIRED' || quoteStatus === 'STALE')) {
    dispatchFxEvent({
      eventType: 'fx_quote_stale',
      timestamp: evalIso,
      providerId: input.provider.providerId,
      baseCurrency: sourceCurrency,
      quoteCurrency: targetCurrency,
      reason: `Checkout quote expired (age: ${ageMs}ms > max: ${checkoutFreshnessMs}ms)`,
      quoteId,
    });

    const expiredQuote: FxQuoteEvidence = Object.freeze({
      quoteId,
      rateSourceRef: rate.rateSourceRef,
      providerId: rate.providerId,
      sourceAmount: input.sourceMoney.amountExact,
      sourceCurrency,
      targetCurrency,
      rate: rate.normalizedRate,
      providerObservedAt: rate.providerObservedAt,
      createdAt: evalIso,
      expiresAt: rate.expiresAt,
      feePolicyRef: input.feePolicy?.feePolicyRef ?? 'NONE',
      spreadPolicyRef: input.feePolicy?.spreadPolicyRef ?? 'NONE',
      roundingPolicyRef: input.roundingPolicyRef ?? 'ROUND_HALF_UP',
      targetAmount: '0.00',
      context: input.context,
      idempotencyRef: input.idempotencyRef,
      quoteStatus: 'EXPIRED',
      provenance: {
        evaluatedAt: evalIso,
        canonicalFallbackUsed: false,
        failureReason: 'RATE_EXPIRED',
      },
    });

    return {
      quote: expiredQuote,
      isSuccess: false,
      targetAmount: expiredQuote.targetAmount,
      targetCurrency: expiredQuote.targetCurrency,
    };
  }

  // 3. Outlier Protection Validation
  if (input.outlierPolicy) {
    const maxDeviationDec = new Prisma.Decimal(input.outlierPolicy.maxDeviationPercentage);
    // Baseline can be supplied or derived
    const currentRateDec = new Prisma.Decimal(rate.normalizedRate);

    // If cache has a baseline
    const baseline = cachedBaseline;
    if (baseline && baseline.rateSourceRef !== rate.rateSourceRef) {
      const baselineDec = new Prisma.Decimal(baseline.normalizedRate);
      const deviation = currentRateDec.sub(baselineDec).abs().div(baselineDec);

      if (deviation.gt(maxDeviationDec)) {
        quoteStatus = 'OUTLIER_BLOCKED';
        dispatchFxEvent({
          eventType: 'fx_quote_outlier_block',
          timestamp: evalIso,
          providerId: input.provider.providerId,
          baseCurrency: sourceCurrency,
          quoteCurrency: targetCurrency,
          reason: `Deviation ${deviation.toFixed(4)} exceeded tolerance ${maxDeviationDec.toFixed(4)}`,
          quoteId,
        });

        // In browse, fall back to canonical currency
        const outlierQuote: FxQuoteEvidence = Object.freeze({
          quoteId,
          rateSourceRef: rate.rateSourceRef,
          providerId: rate.providerId,
          sourceAmount: input.sourceMoney.amountExact,
          sourceCurrency,
          targetCurrency: input.context === 'BROWSE_ESTIMATE' ? sourceCurrency : targetCurrency,
          rate: rate.normalizedRate,
          providerObservedAt: rate.providerObservedAt,
          createdAt: evalIso,
          expiresAt: rate.expiresAt,
          feePolicyRef: input.feePolicy?.feePolicyRef ?? 'NONE',
          spreadPolicyRef: input.feePolicy?.spreadPolicyRef ?? 'NONE',
          roundingPolicyRef: input.roundingPolicyRef ?? 'ROUND_HALF_UP',
          targetAmount: input.sourceMoney.amountExact,
          context: input.context,
          idempotencyRef: input.idempotencyRef,
          quoteStatus: 'OUTLIER_BLOCKED',
          provenance: {
            evaluatedAt: evalIso,
            canonicalFallbackUsed: input.context === 'BROWSE_ESTIMATE',
            failureReason: 'OUTLIER_DEVIATION_EXCEEDED',
          },
        });

        return {
          quote: outlierQuote,
          isSuccess: false,
          targetAmount: outlierQuote.targetAmount,
          targetCurrency: outlierQuote.targetCurrency,
        };
      }
    }
  }

  // 4. Exact Mathematical Conversion
  const conversionResult = convertMoney({
    sourceMoney: input.sourceMoney,
    targetCurrency,
    targetExponent,
    rate: rate.normalizedRate,
    roundingPolicyRef: input.roundingPolicyRef,
    feePolicy: input.feePolicy,
  });

  const quote: FxQuoteEvidence = Object.freeze({
    quoteId,
    rateSourceRef: rate.rateSourceRef,
    providerId: rate.providerId,
    sourceAmount: input.sourceMoney.amountExact,
    sourceCurrency,
    targetCurrency,
    rate: rate.normalizedRate,
    providerObservedAt: rate.providerObservedAt,
    createdAt: evalIso,
    expiresAt: rate.expiresAt,
    feePolicyRef: input.feePolicy?.feePolicyRef ?? 'NONE',
    spreadPolicyRef: input.feePolicy?.spreadPolicyRef ?? 'NONE',
    roundingPolicyRef: input.roundingPolicyRef ?? 'ROUND_HALF_UP',
    targetAmount: conversionResult.targetMoney.amountExact,
    context: input.context,
    idempotencyRef: input.idempotencyRef,
    quoteStatus,
    provenance: {
      evaluatedAt: evalIso,
      canonicalFallbackUsed: false,
    },
  });

  dispatchFxEvent({
    eventType: 'fx_quote_success',
    timestamp: evalIso,
    providerId: rate.providerId,
    baseCurrency: sourceCurrency,
    quoteCurrency: targetCurrency,
    quoteId,
  });

  // Populate cache only if fetched from provider and passed all validation
  if (input.cache && fetchedFromProvider && quoteStatus === 'ACTIVE') {
    input.cache.set(rate);
  }

  return {
    quote,
    isSuccess: quoteStatus === 'ACTIVE' || quoteStatus === 'STALE',
    targetAmount: quote.targetAmount,
    targetCurrency: quote.targetCurrency,
  };
}
