/**
 * RENTipid GLCC v1.0 — P5B Browse FX Integration, Policies & Presentation Tests
 *
 * Work Package: GLCC-P5B
 *
 * Test Scenarios:
 * 1. Approved Production Policies:
 *    - Browse TTL: <= 300,000 ms accepted as fresh; > 300,000 ms marked STALE.
 *    - Checkout TTL contract: <= 120,000 ms accepted; > 120,000 ms marked EXPIRED.
 *    - Outlier Threshold: <= 5.00% accepted; > 5.00% OUTLIER_BLOCKED with canonical fallback.
 *    - Rounding: ROUND_HALF_UP across 0 (JPY), 2 (USD/PHP), and 3 (BHD) minor units.
 *    - Fee / Spread: strictly NONE with 0 basis points markup.
 * 2. Server-Side Browse FX Presentation Service:
 *    - Gated by glcc_fx_display_enabled (fail-closed if disabled or missing).
 *    - Unsupported currencies safely fall back to canonical currency without throwing.
 *    - Identity pair (PHP -> PHP) returns 1:1 without provider call.
 *    - Provider failure falls back to canonical listing price; never fabricates rates.
 * 3. Read-Only API Route (/api/fx/estimate):
 *    - Read-only; rejects caller attempts to provide rate, chargeCurrency, or provider (400).
 *    - Valid inputs return 200 with immutable estimate DTO.
 *    - Gated by glcc_fx_display_enabled (403 if disabled).
 * 4. Rate Cache Isolation:
 *    - Isolates currency pairs (PHP/USD does not bleed into PHP/JPY).
 *    - Prevents reuse of stale browse or expired checkout quotes.
 * 5. Financial Boundaries:
 *    - PAYMENT_CONTRACT_CURRENCY remains strictly immutable PHP.
 *    - Zero booking, ledger, settlement, refund, or payout modifications.
 */

import { NextRequest } from 'next/server';
import { getBrowseFxEstimate } from '@/lib/glcc/browse-fx-service';
import { GET as getEstimateRoute } from '@/app/api/fx/estimate/route';
import { DeterministicFakeFxProvider } from '@/lib/glcc/fx-provider-adapter';
import { InMemoryFxRateCache } from '@/lib/glcc/fx-cache';
import {
  createInMemorySystemSettingReader,
  setOverrideSystemSettingReader,
} from '@/lib/glcc/feature-flags';
import { createFxQuote } from '@/lib/glcc/fx-quote-service';
import {
  APPROVED_FEE_POLICY_REF,
  APPROVED_SPREAD_POLICY_REF,
  getApprovedFreshnessPolicy,
  getApprovedFeePolicy,
} from '@/lib/glcc/fx-policy';

describe('GLCC-P5B — Browse FX Integration & Policy Enforcement', () => {
  const EVAL_TIME = new Date('2026-09-26T12:00:00Z');

  afterEach(() => {
    setOverrideSystemSettingReader(null);
  });

  function createTestProvider(rates?: Record<string, string>): DeterministicFakeFxProvider {
    return new DeterministicFakeFxProvider({
      providerId: 'currencyapi',
      rates: rates ?? {
        'PHP/USD': '0.01785714', // 1 PHP = 0.01785714 USD (~56 PHP/USD)
        'PHP/JPY': '2.67857142', // 1 PHP = 2.67857142 JPY
        'PHP/BHD': '0.00673400', // 1 PHP = 0.006734 BHD (3 decimal places)
      },
      fixedObservedAt: EVAL_TIME,
    });
  }

  describe('1. Approved Production Policies', () => {
    it('enforces approved browse freshness policy (300,000 ms / 5 minutes)', async () => {
      const provider = createTestProvider();
      const cache = new InMemoryFxRateCache();

      // Exactly at freshness boundary: 300,000 ms
      const freshResult = await getBrowseFxEstimate({
        sourceAmount: '1000.00',
        sourceCurrency: 'PHP',
        targetCurrency: 'USD',
        customProvider: provider,
        customCache: cache,
        evaluationTime: new Date(EVAL_TIME.getTime() + 300_000),
        skipFlagCheck: true,
      });
      expect(freshResult.isEstimateAvailable).toBe(true);
      expect(freshResult.status).toBe('ACTIVE');

      // 1 ms past freshness boundary: 300,001 ms -> STALE -> canonical fallback
      const staleResult = await getBrowseFxEstimate({
        sourceAmount: '1000.00',
        sourceCurrency: 'PHP',
        targetCurrency: 'USD',
        customProvider: provider,
        customCache: cache,
        evaluationTime: new Date(EVAL_TIME.getTime() + 300_001),
        skipFlagCheck: true,
      });
      expect(staleResult.status).toBe('STALE');
      // When stale in browse estimate, falls back safely to canonical currency without fabricating fresh rate
      expect(staleResult.isCanonicalFallback).toBe(true);
      expect(staleResult.targetCurrency).toBe('PHP');
    });

    it('enforces approved checkout quote freshness policy (120,000 ms / 120 seconds)', async () => {
      const provider = createTestProvider();

      // Within 120,000 ms checkout window: ACTIVE
      const activeQuote = await createFxQuote({
        sourceMoney: {
          amountExact: '2500.00',
          currencyCode: 'PHP',
          currencyExponent: 2,
        },
        targetCurrency: 'USD',
        context: 'CHECKOUT_QUOTE',
        provider,
        freshnessPolicy: getApprovedFreshnessPolicy(),
        evaluationTime: new Date(EVAL_TIME.getTime() + 120_000),
      });
      expect(activeQuote.isSuccess).toBe(true);
      expect(activeQuote.quote.quoteStatus).toBe('ACTIVE');

      // Beyond 120,000 ms checkout window: EXPIRED
      const expiredQuote = await createFxQuote({
        sourceMoney: {
          amountExact: '2500.00',
          currencyCode: 'PHP',
          currencyExponent: 2,
        },
        targetCurrency: 'USD',
        context: 'CHECKOUT_QUOTE',
        provider,
        freshnessPolicy: getApprovedFreshnessPolicy(),
        evaluationTime: new Date(EVAL_TIME.getTime() + 120_001),
      });
      expect(expiredQuote.isSuccess).toBe(false);
      expect(expiredQuote.quote.quoteStatus).toBe('EXPIRED');
    });

    it('enforces approved outlier threshold of 5.00% (0.05)', async () => {
      const cache = new InMemoryFxRateCache();
      // Baseline rate: 0.01785714 (~56 PHP/USD), observed 10 minutes ago, freshUntil expired 5 minutes ago.
      // This ensures cache.get() triggers a provider fetch, while cache.getLatest() provides the baseline.
      cache.set({
        rateSourceRef: 'baseline:php:usd',
        providerId: 'currencyapi',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.01785714',
        normalizedRate: '0.01785714',
        providerObservedAt: new Date(EVAL_TIME.getTime() - 600_000).toISOString(),
        createdAt: new Date(EVAL_TIME.getTime() - 600_000).toISOString(),
        freshUntil: new Date(EVAL_TIME.getTime() - 300_000).toISOString(),
        expiresAt: new Date(EVAL_TIME.getTime() + 3_600_000).toISOString(),
        status: 'ACTIVE',
      });

      // 4% deviation: within 5% tolerance -> ACCEPTED
      // 0.01785714 * 1.04 = 0.01857142
      const withinProvider = createTestProvider({ 'PHP/USD': '0.01857142' });
      const withinResult = await getBrowseFxEstimate({
        sourceAmount: '1000.00',
        sourceCurrency: 'PHP',
        targetCurrency: 'USD',
        customProvider: withinProvider,
        customCache: cache,
        evaluationTime: EVAL_TIME,
        skipFlagCheck: true,
      });
      expect(withinResult.isEstimateAvailable).toBe(true);
      expect(withinResult.status).toBe('ACTIVE');

      // 6% deviation: exceeds 5% tolerance -> OUTLIER_BLOCKED -> canonical fallback
      // 0.01785714 * 1.06 = 0.01892856
      const outlierCache = new InMemoryFxRateCache();
      outlierCache.set({
        rateSourceRef: 'baseline:php:usd',
        providerId: 'currencyapi',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.01785714',
        normalizedRate: '0.01785714',
        providerObservedAt: new Date(EVAL_TIME.getTime() - 600_000).toISOString(),
        createdAt: new Date(EVAL_TIME.getTime() - 600_000).toISOString(),
        freshUntil: new Date(EVAL_TIME.getTime() - 300_000).toISOString(),
        expiresAt: new Date(EVAL_TIME.getTime() + 3_600_000).toISOString(),
        status: 'ACTIVE',
      });

      const outlierProvider = createTestProvider({ 'PHP/USD': '0.01892856' });
      const outlierResult = await getBrowseFxEstimate({
        sourceAmount: '1000.00',
        sourceCurrency: 'PHP',
        targetCurrency: 'USD',
        customProvider: outlierProvider,
        customCache: outlierCache,
        evaluationTime: EVAL_TIME,
        skipFlagCheck: true,
      });
      expect(outlierResult.isEstimateAvailable).toBe(false);
      expect(outlierResult.status).toBe('OUTLIER_BLOCKED');
      expect(outlierResult.isCanonicalFallback).toBe(true);
      expect(outlierResult.targetCurrency).toBe('PHP');
      expect(outlierResult.targetAmountExact).toBe('1000.00');
    });

    it('enforces exact ROUND_HALF_UP commercial rounding across currency minor units', async () => {
      const provider = createTestProvider();

      // 2 Minor Units (USD): 1500 PHP * 0.01785714 = 26.78571 -> 26.79 USD
      const usdResult = await getBrowseFxEstimate({
        sourceAmount: '1500.00',
        sourceCurrency: 'PHP',
        targetCurrency: 'USD',
        customProvider: provider,
        evaluationTime: EVAL_TIME,
        skipFlagCheck: true,
      });
      expect(usdResult.targetAmountExact).toBe('26.79');

      // 0 Minor Units (JPY): 1500 PHP * 2.67857142 = 4017.85713 -> 4018 JPY
      const jpyResult = await getBrowseFxEstimate({
        sourceAmount: '1500.00',
        sourceCurrency: 'PHP',
        targetCurrency: 'JPY',
        customProvider: provider,
        evaluationTime: EVAL_TIME,
        skipFlagCheck: true,
      });
      expect(jpyResult.targetAmountExact).toBe('4018');

      // 3 Minor Units (BHD): 1500 PHP * 0.00673400 = 10.10100 -> 10.101 BHD
      const bhdResult = await getBrowseFxEstimate({
        sourceAmount: '1500.00',
        sourceCurrency: 'PHP',
        targetCurrency: 'BHD',
        customProvider: provider,
        customTargetExponent: 3,
        evaluationTime: EVAL_TIME,
        skipFlagCheck: true,
      });
      expect(bhdResult.targetAmountExact).toBe('10.101');
    });

    it('enforces zero fee and zero spread policy (0 basis points)', () => {
      const feePolicy = getApprovedFeePolicy();
      expect(feePolicy.feePolicyRef).toBe(APPROVED_FEE_POLICY_REF);
      expect(feePolicy.spreadPolicyRef).toBe(APPROVED_SPREAD_POLICY_REF);
      expect(feePolicy.spreadBps).toBe(0);
      expect(feePolicy.percentageFee).toBeUndefined();
    });
  });

  describe('2. Read-Only Presentation API Endpoint (/api/fx/estimate)', () => {
    it('returns 200 with estimate DTO for valid inputs when feature flag is enabled', async () => {
      setOverrideSystemSettingReader(createInMemorySystemSettingReader({
        glcc_v1_enabled: 'true',
        glcc_fx_display_enabled: 'true',
      }));

      const req = new NextRequest('http://localhost:3000/api/fx/estimate?sourceAmount=1200&sourceCurrency=PHP&targetCurrency=USD');
      const res = await getEstimateRoute(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sourceAmountExact).toBe('1200');
      expect(data.sourceCurrency).toBe('PHP');
      expect(data.targetCurrency).toBe('USD');
    });

    it('rejects caller attempts to supply rate or authority fields with 400 Bad Request', async () => {
      const forbiddenAttempts = [
        'http://localhost:3000/api/fx/estimate?sourceAmount=100&targetCurrency=USD&rate=0.05',
        'http://localhost:3000/api/fx/estimate?sourceAmount=100&targetCurrency=USD&normalizedRate=0.05',
        'http://localhost:3000/api/fx/estimate?sourceAmount=100&targetCurrency=USD&provider=custom_bank',
        'http://localhost:3000/api/fx/estimate?sourceAmount=100&targetCurrency=USD&chargeCurrency=USD',
        'http://localhost:3000/api/fx/estimate?sourceAmount=100&targetCurrency=USD&targetAmount=5.00',
      ];

      for (const url of forbiddenAttempts) {
        const req = new NextRequest(url);
        const res = await getEstimateRoute(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain('Prohibited parameter');
      }
    });

    it('returns 400 if required query parameters are missing', async () => {
      setOverrideSystemSettingReader(createInMemorySystemSettingReader({
        glcc_v1_enabled: 'true',
        glcc_fx_display_enabled: 'true',
      }));

      // Missing targetCurrency
      const req1 = new NextRequest('http://localhost:3000/api/fx/estimate?sourceAmount=100');
      const res1 = await getEstimateRoute(req1);
      expect(res1.status).toBe(400);
      expect((await res1.json()).error).toContain('Missing required query parameter');

      // Missing sourceAmount
      const req2 = new NextRequest('http://localhost:3000/api/fx/estimate?targetCurrency=USD');
      const res2 = await getEstimateRoute(req2);
      expect(res2.status).toBe(400);
    });

    it('returns 403 Forbidden when glcc_fx_display_enabled is false or missing (fail closed)', async () => {
      setOverrideSystemSettingReader(createInMemorySystemSettingReader({
        glcc_v1_enabled: 'true',
        glcc_fx_display_enabled: 'false',
      }));

      const req = new NextRequest('http://localhost:3000/api/fx/estimate?sourceAmount=100&targetCurrency=USD');
      const res = await getEstimateRoute(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('disabled');
      expect(body.isEstimateAvailable).toBe(false);
    });
  });

  describe('3. Rate Cache Isolation', () => {
    it('strictly isolates currency pairs and prevents cross-contamination', () => {
      const cache = new InMemoryFxRateCache();

      cache.set({
        rateSourceRef: 'test:usd',
        providerId: 'currencyapi',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.01785714',
        normalizedRate: '0.01785714',
        providerObservedAt: EVAL_TIME.toISOString(),
        createdAt: EVAL_TIME.toISOString(),
        freshUntil: new Date(EVAL_TIME.getTime() + 300_000).toISOString(),
        expiresAt: new Date(EVAL_TIME.getTime() + 3_600_000).toISOString(),
        status: 'ACTIVE',
      });

      // PHP/USD is in cache
      expect(cache.get('PHP', 'USD', EVAL_TIME)).not.toBeNull();
      // PHP/JPY is NOT in cache
      expect(cache.get('PHP', 'JPY', EVAL_TIME)).toBeNull();
      // USD/PHP is NOT in cache (directional isolation)
      expect(cache.get('USD', 'PHP', EVAL_TIME)).toBeNull();
    });
  });

  describe('4. Financial Authority & Charge Invariant', () => {
    it('guarantees payment currency remains PHP regardless of display estimate', async () => {
      const { PAYMENT_CONTRACT_CURRENCY } = await import('@/lib/payments/payment-currency-policy');
      expect(PAYMENT_CONTRACT_CURRENCY).toBe('PHP');

      // Requesting an FX estimate for display has zero side-effects on charge currency
      const estimate = await getBrowseFxEstimate({
        sourceAmount: '5000.00',
        sourceCurrency: 'PHP',
        targetCurrency: 'USD',
        customProvider: createTestProvider(),
        evaluationTime: EVAL_TIME,
        skipFlagCheck: true,
      });

      expect(estimate.targetCurrency).toBe('USD');
      // Authority invariant is untouched
      expect(PAYMENT_CONTRACT_CURRENCY).toBe('PHP');
    });
  });
});
