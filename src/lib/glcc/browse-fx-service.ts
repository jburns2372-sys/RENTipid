/**
 * RENTipid GLCC v1.0 — Server-Side Browse FX Presentation Service
 *
 * Work Package: GLCC-P5B
 * Owner Decision Authority: 2026-09-26
 *
 * Implements:
 * 1. Smallest server-side presentation path required for renter-facing browse/listing FX estimates.
 * 2. Enforces Server as Rate Authority: caller CANNOT supply rate, choose provider, or alter charge currency.
 * 3. Exact P5A conversion math using Prisma.Decimal and CurrencyRegistry minor unit exponents.
 * 4. Bound to approved CurrencyAPI provider adapter + in-memory pair-isolated rate cache.
 * 5. Applies approved production policies:
 *    - Browse freshness TTL = 300,000 ms (5 min)
 *    - Outlier threshold = 5.00% (0.05)
 *    - Rounding = ROUND_HALF_UP
 *    - Fee / Spread = NONE (0 bps)
 * 6. Safe failure & fallback behavior:
 *    - If provider fails, times out, or rate is outlier/stale, safely falls back to canonical source currency.
 *    - Never fabricates rates, never alters authoritative base/listing price, never blocks browsing.
 * 7. Gated by glcc_fx_display_enabled feature flag (fail-closed if missing/false).
 * 8. Zero database writes, zero payment operations, zero ledger mutations.
 */

import { createFxQuote, type FxQuoteResult } from './fx-quote-service';
import { CurrencyApiRateProvider } from './currencyapi-adapter';
import { InMemoryFxRateCache } from './fx-cache';
import { getDefaultRegistryContext } from './default-registries';
import { evaluateGlccFeatureFlags } from './feature-flags';
import {
  getApprovedFreshnessPolicy,
  getApprovedOutlierPolicy,
  getApprovedFeePolicy,
  APPROVED_ROUNDING_POLICY,
  APPROVED_FX_PROVIDER_ID,
} from './fx-policy';
import type {
  ExactMoney,
  FxRateProvider,
  FxRateCache,
  FxStatus,
} from './fx-contracts';

// Shared in-memory cache instance for server runtime
const sharedBrowseFxCache = new InMemoryFxRateCache();

// Shared default provider instance (uses CURRENCYAPI_API_KEY from environment)
let sharedCurrencyApiProvider: FxRateProvider | null = null;

function getSharedProvider(): FxRateProvider {
  if (!sharedCurrencyApiProvider) {
    sharedCurrencyApiProvider = new CurrencyApiRateProvider();
  }
  return sharedCurrencyApiProvider;
}

export interface BrowseFxEstimateRequest {
  readonly sourceAmount: string;
  readonly sourceCurrency?: string;
  readonly targetCurrency: string;
  readonly evaluationTime?: Date | string;
  // Test/override injection hooks
  readonly customProvider?: FxRateProvider;
  readonly customCache?: FxRateCache;
  readonly customRegistryContext?: import('./registry-contracts').RegistryContext;
  readonly customTargetExponent?: number;
  readonly skipFlagCheck?: boolean;
}

export interface BrowseFxEstimateResponse {
  readonly isEstimateAvailable: boolean;
  readonly sourceAmountExact: string;
  readonly sourceCurrency: string;
  readonly targetCurrency: string;
  readonly targetAmountExact: string;
  readonly rate: string;
  readonly providerId: string;
  readonly quoteId: string;
  readonly status: FxStatus;
  readonly isCanonicalFallback: boolean;
  readonly evaluatedAt: string;
  readonly failureReason?: string;
}

/**
 * Resolves a renter-facing browse/listing display currency estimate.
 */
export async function getBrowseFxEstimate(
  request: BrowseFxEstimateRequest
): Promise<BrowseFxEstimateResponse> {
  const evalDate = request.evaluationTime
    ? (typeof request.evaluationTime === 'string' ? new Date(request.evaluationTime) : request.evaluationTime)
    : new Date();
  const evalIso = evalDate.toISOString();

  const sourceCurrency = (request.sourceCurrency || 'PHP').toUpperCase().trim();
  const targetCurrency = request.targetCurrency.toUpperCase().trim();
  const rawAmount = request.sourceAmount.trim();

  const registries = request.customRegistryContext ?? getDefaultRegistryContext();

  // 1. Feature Flag Check: glcc_fx_display_enabled (unless explicitly bypassed in tests)
  if (!request.skipFlagCheck) {
    try {
      const flags = await evaluateGlccFeatureFlags();
      if (!flags.fxDisplayEnabled) {
        return Object.freeze({
          isEstimateAvailable: false,
          sourceAmountExact: rawAmount,
          sourceCurrency,
          targetCurrency: sourceCurrency, // Canonical fallback
          targetAmountExact: rawAmount,
          rate: '1.00000000',
          providerId: APPROVED_FX_PROVIDER_ID,
          quoteId: `fx_browse_disabled_${Date.now()}`,
          status: 'PROVIDER_FAILED' as FxStatus,
          isCanonicalFallback: true,
          evaluatedAt: evalIso,
          failureReason: 'FEATURE_FLAG_DISABLED',
        });
      }
    } catch {
      // Fail closed on flag evaluation error
      return Object.freeze({
        isEstimateAvailable: false,
        sourceAmountExact: rawAmount,
        sourceCurrency,
        targetCurrency: sourceCurrency,
        targetAmountExact: rawAmount,
        rate: '1.00000000',
        providerId: APPROVED_FX_PROVIDER_ID,
        quoteId: `fx_browse_err_${Date.now()}`,
        status: 'PROVIDER_FAILED' as FxStatus,
        isCanonicalFallback: true,
        evaluatedAt: evalIso,
        failureReason: 'FEATURE_FLAG_ERROR',
      });
    }
  }

  // 2. Validate Currencies against CurrencyRegistry
  const sourceCurrencyMeta = registries.currencies.get(sourceCurrency, evalDate);
  const targetCurrencyMeta = registries.currencies.get(targetCurrency, evalDate);

  if ((!sourceCurrencyMeta || !targetCurrencyMeta) && request.customTargetExponent === undefined) {
    return Object.freeze({
      isEstimateAvailable: false,
      sourceAmountExact: rawAmount,
      sourceCurrency,
      targetCurrency: sourceCurrency, // Fall back to source
      targetAmountExact: rawAmount,
      rate: '1.00000000',
      providerId: APPROVED_FX_PROVIDER_ID,
      quoteId: `fx_browse_inv_${Date.now()}`,
      status: 'INVALID' as FxStatus,
      isCanonicalFallback: true,
      evaluatedAt: evalIso,
      failureReason: `UNSUPPORTED_CURRENCY: source=${sourceCurrency}, target=${targetCurrency}`,
    });
  }

  // 3. Construct ExactMoney for Source
  const sourceMoney: ExactMoney = {
    amountExact: rawAmount,
    currencyCode: sourceCurrency,
    currencyExponent: sourceCurrencyMeta?.minorUnitExponent ?? 2,
    role: 'LISTING_BASE_CURRENCY',
  };

  // 4. Same currency check (e.g. PHP -> PHP)
  if (sourceCurrency === targetCurrency) {
    return Object.freeze({
      isEstimateAvailable: true,
      sourceAmountExact: rawAmount,
      sourceCurrency,
      targetCurrency,
      targetAmountExact: rawAmount,
      rate: '1.00000000',
      providerId: APPROVED_FX_PROVIDER_ID,
      quoteId: `fx_browse_identity_${Date.now()}`,
      status: 'ACTIVE' as FxStatus,
      isCanonicalFallback: false,
      evaluatedAt: evalIso,
    });
  }

  // 5. Invoke FxQuoteService with Approved P5 Policies
  const provider = request.customProvider ?? getSharedProvider();
  const cache = request.customCache ?? sharedBrowseFxCache;

  try {
    const quoteResult: FxQuoteResult = await createFxQuote({
      sourceMoney,
      targetCurrency,
      context: 'BROWSE_ESTIMATE',
      evaluationTime: evalDate,
      provider,
      cache,
      freshnessPolicy: getApprovedFreshnessPolicy(),
      outlierPolicy: getApprovedOutlierPolicy(),
      feePolicy: getApprovedFeePolicy(),
      roundingPolicyRef: APPROVED_ROUNDING_POLICY,
      customTargetExponent: request.customTargetExponent ?? targetCurrencyMeta?.minorUnitExponent,
    });

    const isSuccess = quoteResult.isSuccess && quoteResult.quote.quoteStatus === 'ACTIVE';

    if (isSuccess) {
      return Object.freeze({
        isEstimateAvailable: true,
        sourceAmountExact: sourceMoney.amountExact,
        sourceCurrency,
        targetCurrency,
        targetAmountExact: quoteResult.targetAmount,
        rate: quoteResult.quote.rate,
        providerId: quoteResult.quote.providerId,
        quoteId: quoteResult.quote.quoteId,
        status: quoteResult.quote.quoteStatus,
        isCanonicalFallback: false,
        evaluatedAt: evalIso,
      });
    }

    // Provider failure / stale / outlier block: Safe canonical fallback
    return Object.freeze({
      isEstimateAvailable: false,
      sourceAmountExact: sourceMoney.amountExact,
      sourceCurrency,
      targetCurrency: sourceCurrency, // Canonical base currency fallback
      targetAmountExact: sourceMoney.amountExact,
      rate: quoteResult.quote.rate || '1.00000000',
      providerId: quoteResult.quote.providerId,
      quoteId: quoteResult.quote.quoteId,
      status: quoteResult.quote.quoteStatus,
      isCanonicalFallback: true,
      evaluatedAt: evalIso,
      failureReason: quoteResult.quote.provenance.failureReason ?? 'ESTIMATE_UNAVAILABLE',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return Object.freeze({
      isEstimateAvailable: false,
      sourceAmountExact: sourceMoney.amountExact,
      sourceCurrency,
      targetCurrency: sourceCurrency,
      targetAmountExact: sourceMoney.amountExact,
      rate: '1.00000000',
      providerId: APPROVED_FX_PROVIDER_ID,
      quoteId: `fx_browse_err_${Date.now()}`,
      status: 'PROVIDER_FAILED' as FxStatus,
      isCanonicalFallback: true,
      evaluatedAt: evalIso,
      failureReason: errorMsg,
    });
  }
}

/**
 * Resets the shared in-memory browse cache (primarily for tests).
 */
export function resetSharedBrowseFxCache(): void {
  sharedBrowseFxCache.clear();
}
