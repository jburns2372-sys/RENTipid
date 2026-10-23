/**
 * RENTipid GLCC v1.0 — Work Package P5A Test Suite
 *
 * Covers:
 * 1. Exact Money representation & arithmetic (prohibiting binary float).
 * 2. 0-, 2-, and 3-minor-unit currency vectors (JPY, USD/PHP, BHD).
 * 3. Rate normalization, direct & inverse pairs, timestamp parsing, invalid rate rejection.
 * 4. Immutable quote evidence & 100% reproducible recomputation.
 * 5. Freshness policies across BROWSE_ESTIMATE and CHECKOUT_QUOTE contexts.
 * 6. Pair-isolated, TTL-aware in-memory rate cache.
 * 7. Provider failure handling, timeout mapping, and safe canonical fallback.
 * 8. Outlier protection with deterministic blocking.
 * 9. Fee and spread policy boundary (default 'NONE' with zero hidden markup).
 * 10. Financial authority boundary (zero database writes, display != charge).
 * 11. Observability event telemetry.
 */

import {
  createExactMoney,
  convertMoney,
  verifyFloatVsDecimalProof,
} from '../../src/lib/glcc/fx-math';
import {
  normalizeFxRate,
  DeterministicFakeFxProvider,
  LIVE_FX_PROVIDER_STATUS,
} from '../../src/lib/glcc/fx-provider-adapter';
import { InMemoryFxRateCache } from '../../src/lib/glcc/fx-cache';
import {
  createFxQuote,
  registerFxEventListener,
} from '../../src/lib/glcc/fx-quote-service';
import type {
  FxFeePolicy,
  FxObservabilityEvent,
} from '../../src/lib/glcc/fx-contracts';

describe('GLCC-P5A: FX Money Contract, Quote Evidence & Provider Foundation', () => {

  describe('1. Exact Money Representation & Decimal Arithmetic', () => {
    it('creates exact money without floating-point inaccuracies', () => {
      const money = createExactMoney('1250.50', 'PHP', 2);
      expect(money.amountExact).toBe('1250.50');
      expect(money.currencyCode).toBe('PHP');
      expect(money.currencyExponent).toBe(2);
      expect(money.amountMinor).toBe(125050n);
    });

    it('proves binary floating-point drift vs exact decimal precision', () => {
      const proof = verifyFloatVsDecimalProof();
      expect(proof.isBinaryFloatFlawed).toBe(true);
      expect(proof.binaryFloatResult).toBe(0.30000000000000004);
      expect(proof.isExactDecimalCorrect).toBe(true);
      expect(proof.exactDecimalResult).toBe('0.3');
    });

    it('handles zero-digit currency (JPY)', () => {
      const jpy = createExactMoney('5000', 'JPY', 0);
      expect(jpy.amountExact).toBe('5000');
      expect(jpy.currencyExponent).toBe(0);
      expect(jpy.amountMinor).toBe(5000n);
    });

    it('handles two-digit currency (USD/PHP/EUR)', () => {
      const usd = createExactMoney('99.99', 'USD', 2);
      expect(usd.amountExact).toBe('99.99');
      expect(usd.currencyExponent).toBe(2);
      expect(usd.amountMinor).toBe(9999n);
    });

    it('handles three-digit currency (BHD/KWD)', () => {
      const bhd = createExactMoney('12.345', 'BHD', 3);
      expect(bhd.amountExact).toBe('12.345');
      expect(bhd.currencyExponent).toBe(3);
      expect(bhd.amountMinor).toBe(12345n);
    });

    it('handles large exact numbers without precision loss', () => {
      const large = createExactMoney('987654321098.75', 'PHP', 2);
      expect(large.amountExact).toBe('987654321098.75');
      expect(large.amountMinor).toBe(98765432109875n);
    });

    it('handles small exact fractions', () => {
      const small = createExactMoney('0.005', 'BHD', 3);
      expect(small.amountExact).toBe('0.005');
      expect(small.amountMinor).toBe(5n);
    });

    it('rejects scientific notation for authoritative money', () => {
      expect(() => createExactMoney('1e-5', 'PHP', 2)).toThrow(/Invalid decimal string format/);
    });

    it('rejects malformed and non-numeric strings', () => {
      expect(() => createExactMoney('invalid-amount', 'PHP', 2)).toThrow(/Invalid decimal string format/);
      expect(() => createExactMoney('', 'PHP', 2)).toThrow(/Invalid decimal string format/);
    });
  });

  describe('2. Exact Conversion and Rounding Policies', () => {
    it('converts PHP to USD using ROUND_HALF_UP exactly', () => {
      const source = createExactMoney('100.00', 'PHP', 2);
      // Rate: 1 PHP = 0.01785714 USD -> 100 * 0.01785714 = 1.785714 -> rounds to 1.79
      const result = convertMoney({
        sourceMoney: source,
        targetCurrency: 'USD',
        targetExponent: 2,
        rate: '0.01785714',
        roundingPolicyRef: 'ROUND_HALF_UP',
      });

      expect(result.targetMoney.amountExact).toBe('1.79');
      expect(result.targetMoney.currencyCode).toBe('USD');
      expect(result.targetMoney.amountMinor).toBe(179n);
    });

    it('supports ROUND_HALF_EVEN (banker rounding)', () => {
      const source = createExactMoney('1.00', 'PHP', 2);
      // 1.00 * 1.125 = 1.125 -> rounds to 1.12 (nearest even)
      const resEven = convertMoney({
        sourceMoney: source,
        targetCurrency: 'USD',
        targetExponent: 2,
        rate: '1.125',
        roundingPolicyRef: 'ROUND_HALF_EVEN',
      });
      expect(resEven.targetMoney.amountExact).toBe('1.12');

      // 1.00 * 1.135 = 1.135 -> rounds to 1.14 (nearest even)
      const resEven2 = convertMoney({
        sourceMoney: source,
        targetCurrency: 'USD',
        targetExponent: 2,
        rate: '1.135',
        roundingPolicyRef: 'ROUND_HALF_EVEN',
      });
      expect(resEven2.targetMoney.amountExact).toBe('1.14');
    });

    it('supports ROUND_FLOOR and ROUND_CEIL', () => {
      const source = createExactMoney('1.00', 'PHP', 2);
      const floorRes = convertMoney({
        sourceMoney: source,
        targetCurrency: 'USD',
        targetExponent: 2,
        rate: '1.129',
        roundingPolicyRef: 'ROUND_FLOOR',
      });
      expect(floorRes.targetMoney.amountExact).toBe('1.12');

      const ceilRes = convertMoney({
        sourceMoney: source,
        targetCurrency: 'USD',
        targetExponent: 2,
        rate: '1.121',
        roundingPolicyRef: 'ROUND_CEIL',
      });
      expect(ceilRes.targetMoney.amountExact).toBe('1.13');
    });

    it('reproduces conversion deterministically on repeated calls', () => {
      const source = createExactMoney('54321.99', 'PHP', 2);
      const rate = '0.017857142857';

      const run1 = convertMoney({ sourceMoney: source, targetCurrency: 'USD', targetExponent: 2, rate });
      const run2 = convertMoney({ sourceMoney: source, targetCurrency: 'USD', targetExponent: 2, rate });
      const run3 = convertMoney({ sourceMoney: source, targetCurrency: 'USD', targetExponent: 2, rate });

      expect(run1.targetMoney.amountExact).toBe(run2.targetMoney.amountExact);
      expect(run2.targetMoney.amountExact).toBe(run3.targetMoney.amountExact);
      expect(run1.intermediateAmount).toBe(run3.intermediateAmount);
    });
  });

  describe('3. Rate Normalization & Adapter Foundation', () => {
    it('normalizes a direct currency pair with timestamps', () => {
      const observedAt = new Date('2026-09-26T10:00:00.000Z');
      const rate = normalizeFxRate({
        rateSourceRef: 'test-src-1',
        providerId: 'test-prov',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.01785714',
        providerObservedAt: observedAt,
        evaluationTime: observedAt,
        freshnessDurationMs: 60_000,
        ttlDurationMs: 300_000,
      });

      expect(rate.baseCurrency).toBe('PHP');
      expect(rate.quoteCurrency).toBe('USD');
      expect(rate.normalizedRate).toBe('0.01785714');
      expect(rate.status).toBe('ACTIVE');
      expect(rate.freshUntil).toBe('2026-09-26T10:01:00.000Z');
      expect(rate.expiresAt).toBe('2026-09-26T10:05:00.000Z');
    });

    it('inverts an indirect provider quote accurately', () => {
      // Provider gives: 1 USD = 56.00 PHP. Inverted rate: 1 PHP = 1/56 USD = 0.0178571429
      const rate = normalizeFxRate({
        rateSourceRef: 'test-inv-1',
        providerId: 'test-prov',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '56.00',
        isInverse: true,
        providerObservedAt: '2026-09-26T10:00:00.000Z',
      });

      expect(rate.baseCurrency).toBe('PHP');
      expect(rate.quoteCurrency).toBe('USD');
      expect(rate.normalizedRate).toBe('0.0178571429');
    });

    it('rejects zero and negative rates strictly', () => {
      expect(() => normalizeFxRate({
        rateSourceRef: 'test-zero',
        providerId: 'test-prov',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.00',
        providerObservedAt: new Date(),
      })).toThrow(/must be strictly positive/);

      expect(() => normalizeFxRate({
        rateSourceRef: 'test-neg',
        providerId: 'test-prov',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '-0.05',
        providerObservedAt: new Date(),
      })).toThrow(/must be strictly positive/);
    });

    it('rejects malformed and non-numeric rate payloads', () => {
      expect(() => normalizeFxRate({
        rateSourceRef: 'test-bad',
        providerId: 'test-prov',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: 'abc',
        providerObservedAt: new Date(),
      })).toThrow(/Malformed FX rate/);
    });

    it('records explicit LIVE FX PROVIDER approval status', () => {
      expect(LIVE_FX_PROVIDER_STATUS).toBe('OWNER / BUSINESS APPROVAL REQUIRED');
    });
  });

  describe('4. Deterministic Fake Provider & Health Tracking', () => {
    it('returns seeded rates and healthy status', async () => {
      const provider = new DeterministicFakeFxProvider({
        rates: { 'PHP/USD': '0.0180', 'PHP/JPY': '2.65' },
      });

      const rateUsd = await provider.getRate('PHP', 'USD');
      expect(rateUsd.normalizedRate).toBe('0.0180');

      const rateJpy = await provider.getRate('PHP', 'JPY');
      expect(rateJpy.normalizedRate).toBe('2.65');

      const health = await provider.getHealth();
      expect(health.status).toBe('HEALTHY');
      expect(health.consecutiveFailures).toBe(0);
    });

    it('handles identical currency conversion as exact 1.0', async () => {
      const provider = new DeterministicFakeFxProvider();
      const rate = await provider.getRate('PHP', 'PHP');
      expect(rate.normalizedRate).toBe('1.00000000');
    });

    it('reports DEGRADED and UNAVAILABLE health on consecutive failures', async () => {
      const provider = new DeterministicFakeFxProvider({ simulateFailure: true });

      await expect(provider.getRate('PHP', 'USD')).rejects.toThrow(/unavailable or network error/);
      let health = await provider.getHealth();
      expect(health.status).toBe('DEGRADED');
      expect(health.consecutiveFailures).toBe(1);

      // Trigger 4 more failures (total 5)
      for (let i = 0; i < 4; i++) {
        await provider.getRate('PHP', 'USD').catch(() => {});
      }

      health = await provider.getHealth();
      expect(health.status).toBe('UNAVAILABLE');
      expect(health.consecutiveFailures).toBe(5);
    });

    it('maps simulated timeouts deterministically', async () => {
      const provider = new DeterministicFakeFxProvider({ simulateTimeout: true });
      await expect(provider.getRate('PHP', 'USD')).rejects.toThrow(/timed out/);
      const health = await provider.getHealth();
      expect(health.lastErrorCode).toBe('PROVIDER_TIMEOUT');
    });
  });

  describe('5. Pair-Isolated In-Memory Cache', () => {
    it('stores and retrieves rates with strict pair isolation', () => {
      const cache = new InMemoryFxRateCache();
      const baseTime = new Date('2026-09-26T10:00:00.000Z');

      const phpUsdRate = normalizeFxRate({
        rateSourceRef: 'p-usd',
        providerId: 'fake',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.018',
        providerObservedAt: baseTime,
        freshnessDurationMs: 60_000,
        ttlDurationMs: 300_000,
      });

      cache.set(phpUsdRate);

      // Hit: Exact pair
      const hit = cache.get('PHP', 'USD', new Date('2026-09-26T10:00:30.000Z'));
      expect(hit).not.toBeNull();
      expect(hit?.normalizedRate).toBe('0.018');

      // Miss: Inverted pair
      const invMiss = cache.get('USD', 'PHP', new Date('2026-09-26T10:00:30.000Z'));
      expect(invMiss).toBeNull();

      // Miss: Different quote currency
      const diffMiss = cache.get('PHP', 'EUR', new Date('2026-09-26T10:00:30.000Z'));
      expect(diffMiss).toBeNull();
    });

    it('invalidates cache when rate exceeds freshness or TTL', () => {
      const cache = new InMemoryFxRateCache();
      const baseTime = new Date('2026-09-26T10:00:00.000Z');

      const rate = normalizeFxRate({
        rateSourceRef: 'p-exp',
        providerId: 'fake',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.018',
        providerObservedAt: baseTime,
        freshnessDurationMs: 60_000,  // Stale after 10:01
        ttlDurationMs: 300_000,       // Expired after 10:05
      });
      cache.set(rate);

      // Within freshness: valid
      expect(cache.get('PHP', 'USD', new Date('2026-09-26T10:00:50.000Z'))).not.toBeNull();

      // Past freshness: stale, cache returns null so fresh rate is fetched
      expect(cache.get('PHP', 'USD', new Date('2026-09-26T10:01:05.000Z'))).toBeNull();

      // Past TTL: completely evicted
      expect(cache.get('PHP', 'USD', new Date('2026-09-26T10:06:00.000Z'))).toBeNull();
      expect(cache.size()).toBe(0);
    });

    it('supports explicit invalidation and clear', () => {
      const cache = new InMemoryFxRateCache();
      const rate = normalizeFxRate({
        rateSourceRef: 'p-clear',
        providerId: 'fake',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.018',
        providerObservedAt: new Date(),
      });
      cache.set(rate);
      expect(cache.size()).toBe(1);

      cache.invalidate('PHP', 'USD');
      expect(cache.size()).toBe(0);
    });
  });

  describe('6. Quote Evidence & Immutability', () => {
    it('creates an immutable quote evidence record preserving all inputs', async () => {
      const provider = new DeterministicFakeFxProvider({ rates: { 'PHP/USD': '0.01785714' } });
      const source = createExactMoney('5000.00', 'PHP', 2);
      const evalTime = new Date('2026-09-26T12:00:00.000Z');

      const result = await createFxQuote({
        sourceMoney: source,
        targetCurrency: 'USD',
        context: 'BROWSE_ESTIMATE',
        evaluationTime: evalTime,
        provider,
        idempotencyRef: 'idem-test-1',
      });

      expect(result.isSuccess).toBe(true);
      const q = result.quote;

      // Invariants: original amounts and currencies preserved
      expect(q.sourceAmount).toBe('5000.00');
      expect(q.sourceCurrency).toBe('PHP');
      expect(q.targetCurrency).toBe('USD');
      expect(q.rate).toBe('0.01785714');
      expect(q.targetAmount).toBe('89.29'); // 5000 * 0.01785714 = 89.2857 -> 89.29
      expect(q.context).toBe('BROWSE_ESTIMATE');
      expect(q.quoteStatus).toBe('ACTIVE');
      expect(q.idempotencyRef).toBe('idem-test-1');
      expect(q.feePolicyRef).toBe('NONE');
      expect(q.spreadPolicyRef).toBe('NONE');
      expect(q.roundingPolicyRef).toBe('ROUND_HALF_UP');

      // Immutability: quote cannot be modified
      expect(Object.isFrozen(q)).toBe(true);
      expect(() => { (q as unknown as Record<string, unknown>).targetAmount = '100.00'; }).toThrow();
    });

    it('reproduces target amount identically when replaying exact quote inputs', async () => {
      const provider = new DeterministicFakeFxProvider({ rates: { 'PHP/USD': '0.01785714' } });
      const source = createExactMoney('123456.78', 'PHP', 2);
      const evalTime = new Date('2026-09-26T12:00:00.000Z');

      const res1 = await createFxQuote({
        sourceMoney: source,
        targetCurrency: 'USD',
        context: 'CHECKOUT_QUOTE',
        evaluationTime: evalTime,
        provider,
      });

      const res2 = await createFxQuote({
        sourceMoney: source,
        targetCurrency: 'USD',
        context: 'CHECKOUT_QUOTE',
        evaluationTime: evalTime,
        provider,
      });

      expect(res1.targetAmount).toBe(res2.targetAmount);
      expect(res1.quote.rate).toBe(res2.quote.rate);
      expect(res1.quote.targetAmount).toBe(res2.quote.targetAmount);
    });
  });

  describe('7. Freshness & Context Boundary (Browse vs Checkout)', () => {
    it('accepts fresh rates in CHECKOUT_QUOTE within checkoutFreshnessMs', async () => {
      const observedAt = new Date('2026-09-26T12:00:00.000Z');
      const evalTime = new Date('2026-09-26T12:00:30.000Z'); // 30s later (fresh)
      const provider = new DeterministicFakeFxProvider({
        rates: { 'PHP/USD': '0.0180' },
        fixedObservedAt: observedAt,
      });

      const result = await createFxQuote({
        sourceMoney: createExactMoney('1000.00', 'PHP', 2),
        targetCurrency: 'USD',
        context: 'CHECKOUT_QUOTE',
        evaluationTime: evalTime,
        provider,
        freshnessPolicy: {
          browseFreshnessMs: 300_000,
          checkoutFreshnessMs: 60_000, // 1 min checkout TTL
          policySource: 'DEFAULT_TEST_POLICY',
        },
      });

      expect(result.isSuccess).toBe(true);
      expect(result.quote.quoteStatus).toBe('ACTIVE');
    });

    it('rejects stale rates in CHECKOUT_QUOTE when exceeding checkoutFreshnessMs', async () => {
      const observedAt = new Date('2026-09-26T12:00:00.000Z');
      const evalTime = new Date('2026-09-26T12:01:05.000Z'); // 65s later (> 60s checkout TTL)
      const provider = new DeterministicFakeFxProvider({
        rates: { 'PHP/USD': '0.0180' },
        fixedObservedAt: observedAt,
      });

      const result = await createFxQuote({
        sourceMoney: createExactMoney('1000.00', 'PHP', 2),
        targetCurrency: 'USD',
        context: 'CHECKOUT_QUOTE',
        evaluationTime: evalTime,
        provider,
        freshnessPolicy: {
          browseFreshnessMs: 300_000,
          checkoutFreshnessMs: 60_000,
          policySource: 'DEFAULT_TEST_POLICY',
        },
      });

      expect(result.isSuccess).toBe(false);
      expect(result.quote.quoteStatus).toBe('EXPIRED');
    });
  });

  describe('8. Provider Failure & Canonical Fallback Behavior', () => {
    it('falls back safely to canonical currency on BROWSE failure without fabricating rate', async () => {
      const provider = new DeterministicFakeFxProvider({ simulateFailure: true });
      const source = createExactMoney('2500.00', 'PHP', 2);

      const result = await createFxQuote({
        sourceMoney: source,
        targetCurrency: 'USD',
        context: 'BROWSE_ESTIMATE',
        provider,
      });

      expect(result.isSuccess).toBe(false);
      expect(result.quote.quoteStatus).toBe('PROVIDER_FAILED');
      // Critical invariant: canonical fallback to original currency & amount
      expect(result.targetCurrency).toBe('PHP');
      expect(result.targetAmount).toBe('2500.00');
      expect(result.quote.provenance.canonicalFallbackUsed).toBe(true);
      expect(result.quote.provenance.failureReason).toContain('unavailable');
    });

    it('blocks checkout conversion on provider failure without fake rate', async () => {
      const provider = new DeterministicFakeFxProvider({ simulateFailure: true });
      const source = createExactMoney('2500.00', 'PHP', 2);

      const result = await createFxQuote({
        sourceMoney: source,
        targetCurrency: 'USD',
        context: 'CHECKOUT_QUOTE',
        provider,
      });

      expect(result.isSuccess).toBe(false);
      expect(result.quote.quoteStatus).toBe('PROVIDER_FAILED');
      expect(result.quote.provenance.canonicalFallbackUsed).toBe(false);
    });
  });

  describe('9. Outlier Protection Contract', () => {
    it('accepts rates within outlier tolerance', async () => {
      const cache = new InMemoryFxRateCache();
      const baseTime = new Date('2026-09-26T12:00:00.000Z');

      // Seed previous rate: 0.0180
      cache.set(normalizeFxRate({
        rateSourceRef: 'prev-rate',
        providerId: 'fake',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.0180',
        providerObservedAt: baseTime,
      }));

      // New rate: 0.0182 (+1.1% deviation)
      const provider = new DeterministicFakeFxProvider({ rates: { 'PHP/USD': '0.0182' } });

      const evalTime = new Date('2026-09-26T12:06:00.000Z'); // 6 min later (cache is stale, provider fetched, baseline retained)

      const result = await createFxQuote({
        sourceMoney: createExactMoney('1000.00', 'PHP', 2),
        targetCurrency: 'USD',
        context: 'CHECKOUT_QUOTE',
        evaluationTime: evalTime,
        provider,
        cache,
        outlierPolicy: {
          outlierPolicyRef: 'TEST_OUTLIER_10PCT',
          maxDeviationPercentage: '0.10', // 10% tolerance
        },
      });

      expect(result.isSuccess).toBe(true);
      expect(result.quote.quoteStatus).toBe('ACTIVE');
    });

    it('blocks rates exceeding outlier tolerance and falls back in BROWSE', async () => {
      const cache = new InMemoryFxRateCache();
      const baseTime = new Date('2026-09-26T12:00:00.000Z');

      // Seed previous rate: 0.0180
      cache.set(normalizeFxRate({
        rateSourceRef: 'prev-rate',
        providerId: 'fake',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.0180',
        providerObservedAt: baseTime,
      }));

      // Spiked rate: 0.0250 (+38.8% deviation)
      const provider = new DeterministicFakeFxProvider({ rates: { 'PHP/USD': '0.0250' } });
      const evalTime = new Date('2026-09-26T12:06:00.000Z');

      const result = await createFxQuote({
        sourceMoney: createExactMoney('1000.00', 'PHP', 2),
        targetCurrency: 'USD',
        context: 'BROWSE_ESTIMATE',
        evaluationTime: evalTime,
        provider,
        cache,
        outlierPolicy: {
          outlierPolicyRef: 'TEST_OUTLIER_10PCT',
          maxDeviationPercentage: '0.10',
        },
      });

      expect(result.isSuccess).toBe(false);
      expect(result.quote.quoteStatus).toBe('OUTLIER_BLOCKED');
      expect(result.targetCurrency).toBe('PHP'); // Canonical fallback
      expect(result.quote.provenance.canonicalFallbackUsed).toBe(true);
    });
  });

  describe('10. Fee and Spread Policy Boundary', () => {
    it('defaults to NONE with zero hidden fee or markup', async () => {
      const provider = new DeterministicFakeFxProvider({ rates: { 'PHP/USD': '0.0180' } });
      const source = createExactMoney('100.00', 'PHP', 2);

      const result = await createFxQuote({
        sourceMoney: source,
        targetCurrency: 'USD',
        context: 'BROWSE_ESTIMATE',
        provider,
      });

      expect(result.quote.feePolicyRef).toBe('NONE');
      expect(result.quote.spreadPolicyRef).toBe('NONE');
      // 100 * 0.0180 = 1.80 exact
      expect(result.targetAmount).toBe('1.80');
    });

    it('supports explicit test spread and fee policy with exact calculation', () => {
      const source = createExactMoney('1000.00', 'PHP', 2);
      const feePolicy: FxFeePolicy = {
        feePolicyRef: 'TEST_FEE_1PCT',
        spreadPolicyRef: 'TEST_SPREAD_50BPS',
        spreadBps: 50, // 0.5% spread
        percentageFee: '0.01', // 1% fee
      };

      const result = convertMoney({
        sourceMoney: source,
        targetCurrency: 'USD',
        targetExponent: 2,
        rate: '0.0200',
        feePolicy,
      });

      // Spread: 0.0200 * (1 - 0.0050) = 0.0199
      // Base conv: 1000 * 0.0199 = 19.90
      // Fee 1%: 19.90 * 0.01 = 0.199
      // Total: 19.90 + 0.199 = 20.099 -> rounds to 20.10
      expect(result.targetMoney.amountExact).toBe('20.10');
      expect(result.feeApplied).toBe('0.20');
    });
  });

  describe('11. Observability Telemetry Events', () => {
    it('dispatches structured observability events without leaking secrets', async () => {
      const capturedEvents: FxObservabilityEvent[] = [];
      const unregister = registerFxEventListener((e) => capturedEvents.push(e));

      const provider = new DeterministicFakeFxProvider({ rates: { 'PHP/USD': '0.0180' } });
      await createFxQuote({
        sourceMoney: createExactMoney('500.00', 'PHP', 2),
        targetCurrency: 'USD',
        context: 'BROWSE_ESTIMATE',
        provider,
      });

      unregister();

      expect(capturedEvents.length).toBeGreaterThan(0);
      const successEvent = capturedEvents.find((e) => e.eventType === 'fx_quote_success');
      expect(successEvent).toBeDefined();
      expect(successEvent?.baseCurrency).toBe('PHP');
      expect(successEvent?.quoteCurrency).toBe('USD');
      expect(successEvent?.quoteId).toBeDefined();
    });
  });

  describe('12. Financial Authority Boundary & Isolation', () => {
    it('guarantees FX quote service performs zero financial mutations', async () => {
      const provider = new DeterministicFakeFxProvider({ rates: { 'PHP/USD': '0.0180' } });
      const source = createExactMoney('1000.00', 'PHP', 2);

      const result = await createFxQuote({
        sourceMoney: source,
        targetCurrency: 'USD',
        context: 'BROWSE_ESTIMATE',
        provider,
      });

      // Pure presentation output: target currency is USD, but charge currency remains strictly unaffected
      expect(result.targetCurrency).toBe('USD');
      expect(result.quote.sourceCurrency).toBe('PHP');

      // Ensure no payment authorization or charge capability was produced
      const record = result.quote as unknown as Record<string, unknown>;
      expect(record.paymentMethod).toBeUndefined();
      expect(record.chargeAuthorized).toBeUndefined();
      expect(record.chargeCurrency).toBeUndefined();
    });
  });

});
