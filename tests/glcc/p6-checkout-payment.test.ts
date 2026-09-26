/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RENTipid GLCC v1.0 — Test Suite: Package P6
 * Checkout / Payment / Refund / Payout Integration
 *
 * Verifies:
 * 1. Fresh checkout quote generation with strict 120s TTL (APPROVED_CHECKOUT_FRESHNESS_MS).
 * 2. Strict rejection of expired checkout quotes (> 120s) without charging.
 * 3. Material rate and total divergence detection requiring renewed user confirmation.
 * 4. Unchanged refresh path cleanly accepts renewed quote without duplicate confirmation warnings.
 * 5. Exact final charge currency disclosure (PAYMENT_CONTRACT_CURRENCY = 'PHP').
 * 6. Protection against client tampering: caller cannot supply rates, providers, or foreign charge currency.
 * 7. Payment retry idempotency preservation (deriveCheckoutIdempotencyKey).
 * 8. Consequential transaction evidence preservation (quoteId, rates, timestamps, policies).
 * 9. Provider settlement currency invariant strictly PHP.
 * 10. Finance ledger currency invariant strictly PHP.
 * 11. Refund authority invariant: strictly PHP, anchored in original payment, zero FX recalculation.
 * 12. Provider payout authority invariant: strictly PHP from gross rental, commission, and delivery fee.
 * 13. Provider failure / outlier (> 5%) safe handling in checkout context.
 */

import {
  generateCheckoutQuote,
  verifyCheckoutQuote,
  serializeCheckoutFxEvidence,
  deserializeCheckoutFxEvidence,
} from '../../src/lib/glcc/checkout-fx-service';
import {
  assertSettlementCurrencyInvariant,
  assertLedgerCurrencyInvariant,
  assertRefundCalculationInvariant,
  assertProviderPayoutInvariant,
  calculateDeterministicRefund,
  FinancialAuthorityError,
} from '../../src/lib/glcc/finance-authority-guards';
import {
  deriveCheckoutIdempotencyKey,
  validateCheckoutQuoteContext,
  buildTransactionFxMetadata,
} from '../../src/app/checkout/[bookingId]/checkout-helpers';
import { InMemoryFxRateCache } from '../../src/lib/glcc/fx-cache';
import type { FxRateProvider, NormalizedFxRate } from '../../src/lib/glcc/fx-contracts';

// Deterministic test double for FX provider
class TestFxProvider implements FxRateProvider {
  public readonly providerId = 'currencyapi';
  public readonly providerName = 'CurrencyAPI (Deterministic Test Double)';

  constructor(
    private rate: string = '0.01785714',
    private observedAtIso: string = '2026-09-26T12:00:00.000Z',
    private shouldFail: boolean = false
  ) {}

  public setRate(rate: string, observedAtIso?: string): void {
    this.rate = rate;
    if (observedAtIso) this.observedAtIso = observedAtIso;
  }

  public setFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  public async getRate(
    baseCurrency: string,
    quoteCurrency: string,
    options?: { asOf?: Date }
  ): Promise<NormalizedFxRate> {
    if (this.shouldFail) {
      throw new Error('Upstream provider timed out (5000ms limit)');
    }

    const evalDate = options?.asOf ?? new Date();
    return {
      providerId: this.providerId,
      rateSourceRef: 'test_wire_observation',
      baseCurrency,
      quoteCurrency,
      rawRate: this.rate,
      normalizedRate: this.rate,
      rateDirection: 'DIRECT',
      providerObservedAt: this.observedAtIso,
      receivedAt: evalDate.toISOString(),
      expiresAt: new Date(new Date(this.observedAtIso).getTime() + 120_000).toISOString(),
      rateStatus: 'FRESH',
    };
  }

  public async getHealth(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE'; latencyMs?: number }> {
    return { status: this.shouldFail ? 'UNAVAILABLE' : 'HEALTHY', latencyMs: 12 };
  }
}

describe('GLCC-P6 — Checkout / Payment / Refund / Payout Integration', () => {
  const baseTime = new Date('2026-09-26T12:00:00.000Z');
  let provider: TestFxProvider;
  let cache: InMemoryFxRateCache;

  beforeEach(() => {
    provider = new TestFxProvider('0.01785714', baseTime.toISOString());
    cache = new InMemoryFxRateCache();
  });

  // ──────────────────────────────────────────────────────────
  // 1. Fresh Checkout Quote Generation & Freshness Policy (120s TTL)
  // ──────────────────────────────────────────────────────────
  describe('1. Checkout Quote Generation & Freshness Policy (120s TTL)', () => {
    it('generates a fresh active checkout quote with strict 120s freshness window', async () => {
      const res = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      expect(res.isSuccess).toBe(true);
      expect(res.quote.quoteStatus).toBe('ACTIVE');
      expect(res.quote.context).toBe('CHECKOUT_QUOTE');
      expect(res.authoritativeCharge.currency).toBe('PHP');
      expect(res.authoritativeCharge.amount).toBe('5600.00');
      expect(res.displayEstimate.currency).toBe('USD');
      expect(parseFloat(res.displayEstimate.amount)).toBeCloseTo(100.00, 2);

      // Verify strict 120s freshUntil
      const expiresAtMs = new Date(res.freshUntil).getTime();
      const diffMs = expiresAtMs - baseTime.getTime();
      expect(diffMs).toBeLessThanOrEqual(120_000);
      expect(diffMs).toBeGreaterThan(0);
    });

    it('accepts quote evaluated within 120 seconds TTL (e.g. at 60s age)', async () => {
      const evalAt60s = new Date(baseTime.getTime() + 60_000);
      const res = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: evalAt60s,
        provider,
        cache,
      });

      expect(res.isSuccess).toBe(true);
      expect(res.quote.quoteStatus).toBe('ACTIVE');
    });

    it('rejects checkout quote when rate age exceeds 120 seconds (e.g. at 120,001 ms)', async () => {
      const evalAt121s = new Date(baseTime.getTime() + 120_001);
      const res = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: evalAt121s,
        provider,
        cache,
      });

      expect(res.isSuccess).toBe(false);
      expect(res.quote.quoteStatus).toBe('EXPIRED');
      expect(res.requiresReconfirmation).toBe(true);
      expect(res.reconfirmationReason).toBe('QUOTE_EXPIRED');
    });

    it('handles identity conversion (PHP -> PHP) without FX conversion or markup', async () => {
      const res = await generateCheckoutQuote({
        authoritativeAmountPhp: '1500.00',
        targetDisplayCurrency: 'PHP',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      expect(res.isSuccess).toBe(true);
      expect(res.authoritativeCharge.amount).toBe('1500.00');
      expect(res.displayEstimate.amount).toBe('1500.00');
      expect(res.displayEstimate.currency).toBe('PHP');
      expect(res.quote.rate).toBe('1.00000000');
    });
  });

  // ──────────────────────────────────────────────────────────
  // 2. Material Divergence & Renewed Confirmation
  // ──────────────────────────────────────────────────────────
  describe('2. Quote Refresh & Material Divergence Reconfirmation', () => {
    it('does NOT require reconfirmation when quote is refreshed with identical rate and total', async () => {
      const first = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      const refreshed = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: new Date(baseTime.getTime() + 10_000), // 10s later
        provider,
        cache,
        previousQuote: first.quote,
      });

      expect(refreshed.requiresReconfirmation).toBe(false);
      expect(refreshed.reconfirmationReason).toBeUndefined();
    });

    it('requires reconfirmation when refreshed quote rate deviates', async () => {
      const first = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      // Provider updates rate from 0.01785714 to 0.01800000
      provider.setRate('0.01800000', new Date(baseTime.getTime() + 10_000).toISOString());
      cache.clear();

      const refreshed = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: new Date(baseTime.getTime() + 10_000),
        provider,
        cache,
        previousQuote: first.quote,
      });

      expect(refreshed.requiresReconfirmation).toBe(true);
      expect(refreshed.reconfirmationReason).toBe('RATE_CHANGED');
    });

    it('requires reconfirmation when booking total amount changes between quotes', async () => {
      const first = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      // Price updated to 6000.00 on server
      const refreshed = await generateCheckoutQuote({
        authoritativeAmountPhp: '6000.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: new Date(baseTime.getTime() + 5_000),
        provider,
        cache,
        previousQuote: first.quote,
      });

      expect(refreshed.requiresReconfirmation).toBe(true);
      expect(refreshed.reconfirmationReason).toBe('TOTAL_CHANGED');
    });

    it('requires reconfirmation when previous quote was expired', async () => {
      const first = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      // 130 seconds later, previous quote is expired
      const refreshed = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: new Date(baseTime.getTime() + 130_000),
        provider,
        cache,
        previousQuote: first.quote,
      });

      expect(refreshed.requiresReconfirmation).toBe(true);
      expect(refreshed.reconfirmationReason).toBe('QUOTE_EXPIRED');
    });
  });

  // ──────────────────────────────────────────────────────────
  // 3. Strict Verification Before Payment Execution
  // ──────────────────────────────────────────────────────────
  describe('3. Pre-Payment Quote Verification Engine', () => {
    it('verifies valid active quote against current booking total', async () => {
      const quoteRes = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      const verification = verifyCheckoutQuote(quoteRes.quote, '5600.00', baseTime);
      expect(verification.isValid).toBe(true);
      expect(verification.failureReason).toBeUndefined();
    });

    it('rejects quote if authoritative booking amount mutated on server', async () => {
      const quoteRes = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      // Current booking total changed to 5700.00 PHP
      const verification = verifyCheckoutQuote(quoteRes.quote, '5700.00', baseTime);
      expect(verification.isValid).toBe(false);
      expect(verification.failureReason).toContain('Authoritative amount mutated');
    });

    it('rejects quote if verification time exceeds 120s TTL', async () => {
      const quoteRes = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      // Verify at 121 seconds
      const verification = verifyCheckoutQuote(
        quoteRes.quote,
        '5600.00',
        new Date(baseTime.getTime() + 121_000)
      );
      expect(verification.isValid).toBe(false);
      expect(verification.failureReason).toContain('Checkout quote has expired');
    });

    it('rejects quote with incorrect context (e.g. BROWSE_ESTIMATE presented at checkout)', () => {
      const fakeBrowseQuote: any = {
        quoteId: 'fxq_brw_123',
        context: 'BROWSE_ESTIMATE',
        quoteStatus: 'ACTIVE',
        sourceCurrency: 'PHP',
        sourceAmount: '5600.00',
        expiresAt: new Date(baseTime.getTime() + 300_000).toISOString(),
        providerObservedAt: baseTime.toISOString(),
      };

      const verification = verifyCheckoutQuote(fakeBrowseQuote, '5600.00', baseTime);
      expect(verification.isValid).toBe(false);
      expect(verification.failureReason).toContain('Invalid quote context');
    });
  });

  // ──────────────────────────────────────────────────────────
  // 4. Client Input Sanitization & Anti-Tampering Protections
  // ──────────────────────────────────────────────────────────
  describe('4. Client Input Sanitization & Anti-Tampering Protections', () => {
    it('strictly prohibits client attempt to override payment charge currency with foreign currency', () => {
      expect(() => {
        validateCheckoutQuoteContext({
          clientRequestedChargeCurrency: 'USD',
        });
      }).toThrow('Unauthorized payment currency override attempt: \'USD\'');
    });

    it('accepts explicit PHP charge currency confirmation without error', () => {
      const res = validateCheckoutQuoteContext({
        clientRequestedChargeCurrency: 'PHP',
      });
      expect(res.enforcedChargeCurrency).toBe('PHP');
    });

    it('validates and accepts valid quote ID format', () => {
      const res = validateCheckoutQuoteContext({
        rawQuoteId: 'fxq_chk_1727352000000_abc123',
      });
      expect(res.quoteId).toBe('fxq_chk_1727352000000_abc123');
    });

    it('rejects malformed quote IDs with whitespace or invalid characters', () => {
      expect(() => {
        validateCheckoutQuoteContext({ rawQuoteId: 'fxq_chk_123; DROP TABLE;' });
      }).toThrow('Malformed checkout FX quote identifier');

      expect(() => {
        validateCheckoutQuoteContext({ rawQuoteId: 'a'.repeat(150) });
      }).toThrow('Malformed checkout FX quote identifier');
    });
  });

  // ──────────────────────────────────────────────────────────
  // 5. Payment Idempotency & Consequential Evidence Preservation
  // ──────────────────────────────────────────────────────────
  describe('5. Payment Idempotency & Evidence Serialization', () => {
    it('deriveCheckoutIdempotencyKey produces deterministic SHA-256 digests', () => {
      const key1 = deriveCheckoutIdempotencyKey('user-100', 'booking-200', '123e4567-e89b-12d3-a456-426614174000');
      const key2 = deriveCheckoutIdempotencyKey('user-100', 'booking-200', '123e4567-e89b-12d3-a456-426614174000');
      expect(key1).toBe(key2);
      expect(key1).toHaveLength(64); // SHA-256 hex string
    });

    it('serializes and deserializes checkout FX evidence without loss', async () => {
      const quoteRes = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
        idempotencyRef: 'RENTIPID_CHECKOUT_V1|user-1|booking-1|req-1',
      });

      const serialized = serializeCheckoutFxEvidence(quoteRes.quote);
      expect(typeof serialized).toBe('string');

      const deserialized = deserializeCheckoutFxEvidence(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized?.quoteId).toBe(quoteRes.quote.quoteId);
      expect(deserialized?.sourceAmount).toBe('5600.00');
      expect(deserialized?.sourceCurrency).toBe('PHP');
      expect(deserialized?.targetCurrency).toBe('USD');
      expect(deserialized?.targetAmount).toBe(quoteRes.quote.targetAmount);
      expect(deserialized?.rate).toBe(quoteRes.quote.rate);
    });

    it('buildTransactionFxMetadata attaches structured quote reference', () => {
      const summary = buildTransactionFxMetadata({
        quoteId: 'fxq_chk_123',
        targetCurrency: 'USD',
        targetAmount: '100.00',
        rate: '0.01785714',
      });

      expect(summary).toBeDefined();
      const parsed = JSON.parse(summary!);
      expect(parsed.fxQuoteRef.quoteId).toBe('fxq_chk_123');
      expect(parsed.fxQuoteRef.baseCurrency).toBe('PHP');
      expect(parsed.fxQuoteRef.displayCurrency).toBe('USD');
      expect(parsed.fxQuoteRef.displayAmount).toBe('100.00');
      expect(parsed.fxQuoteRef.referenceRate).toBe('0.01785714');
    });
  });

  // ──────────────────────────────────────────────────────────
  // 6. Financial Authority Invariants (Settlement, Ledger, Refund, Payout)
  // ──────────────────────────────────────────────────────────
  describe('6. Financial Authority Invariants', () => {
    it('assertSettlementCurrencyInvariant permits PHP and strictly rejects foreign currencies', () => {
      expect(() => assertSettlementCurrencyInvariant('PHP')).not.toThrow();
      expect(() => assertSettlementCurrencyInvariant('php')).not.toThrow();

      expect(() => assertSettlementCurrencyInvariant('USD')).toThrow(FinancialAuthorityError);
      expect(() => assertSettlementCurrencyInvariant('EUR')).toThrow(FinancialAuthorityError);
      expect(() => assertSettlementCurrencyInvariant('JPY')).toThrow(FinancialAuthorityError);
    });

    it('assertLedgerCurrencyInvariant permits PHP and strictly rejects foreign currencies', () => {
      expect(() => assertLedgerCurrencyInvariant('PHP')).not.toThrow();
      expect(() => assertLedgerCurrencyInvariant('USD')).toThrow(FinancialAuthorityError);
    });

    it('assertRefundCalculationInvariant ensures refunds are strictly in PHP and never exceed original payment', () => {
      // Valid full refund
      expect(() =>
        assertRefundCalculationInvariant({
          originalPaymentAmountPhp: '5600.00',
          originalPaymentCurrency: 'PHP',
          requestedRefundAmountPhp: '5600.00',
          refundCurrency: 'PHP',
        })
      ).not.toThrow();

      // Valid partial refund
      expect(() =>
        assertRefundCalculationInvariant({
          originalPaymentAmountPhp: '5600.00',
          originalPaymentCurrency: 'PHP',
          requestedRefundAmountPhp: '2800.00',
          refundCurrency: 'PHP',
        })
      ).not.toThrow();

      // Rejects foreign refund currency
      expect(() =>
        assertRefundCalculationInvariant({
          originalPaymentAmountPhp: '5600.00',
          originalPaymentCurrency: 'PHP',
          requestedRefundAmountPhp: '100.00',
          refundCurrency: 'USD',
        })
      ).toThrow('Refund currency violation');

      // Rejects refund exceeding original amount
      expect(() =>
        assertRefundCalculationInvariant({
          originalPaymentAmountPhp: '5600.00',
          originalPaymentCurrency: 'PHP',
          requestedRefundAmountPhp: '6000.00',
          refundCurrency: 'PHP',
        })
      ).toThrow('exceeds original payment amount');
    });

    it('calculateDeterministicRefund computes exact refund amounts in PHP using Prisma.Decimal', () => {
      // 50% partial refund
      const refund50 = calculateDeterministicRefund({
        originalPaymentAmountPhp: '5600.00',
        refundRatio: 0.5,
      });
      expect(refund50.refundAmountPhp).toBe('2800.00');
      expect(refund50.currency).toBe('PHP');

      // Full refund with flat deduction (e.g. 500 PHP cancellation fee)
      const refundWithFee = calculateDeterministicRefund({
        originalPaymentAmountPhp: '5600.00',
        refundRatio: 1.0,
        flatDeductionPhp: '500.00',
      });
      expect(refundWithFee.refundAmountPhp).toBe('5100.00');
      expect(refundWithFee.currency).toBe('PHP');
    });

    it('assertProviderPayoutInvariant verifies exact gross - commission + delivery = net in PHP', () => {
      // Gross 5000 PHP, 10% commission (500 PHP), 200 PHP delivery -> Net 4700 PHP
      expect(() =>
        assertProviderPayoutInvariant({
          grossRentalPhp: '5000.00',
          platformCommissionPhp: '500.00',
          deliveryFeePassThroughPhp: '200.00',
          expectedNetPayoutPhp: '4700.00',
          payoutCurrency: 'PHP',
        })
      ).not.toThrow();

      // Discrepancy throws FinancialAuthorityError
      expect(() =>
        assertProviderPayoutInvariant({
          grossRentalPhp: '5000.00',
          platformCommissionPhp: '500.00',
          deliveryFeePassThroughPhp: '200.00',
          expectedNetPayoutPhp: '4800.00', // Mismatch!
          payoutCurrency: 'PHP',
        })
      ).toThrow('Payout calculation discrepancy');

      // Foreign payout currency throws FinancialAuthorityError
      expect(() =>
        assertProviderPayoutInvariant({
          grossRentalPhp: '5000.00',
          platformCommissionPhp: '500.00',
          deliveryFeePassThroughPhp: '200.00',
          expectedNetPayoutPhp: '4700.00',
          payoutCurrency: 'USD',
        })
      ).toThrow('Provider payout currency violation');
    });
  });

  // ──────────────────────────────────────────────────────────
  // 7. Provider Failure & Outlier Protections in Checkout
  // ──────────────────────────────────────────────────────────
  describe('7. Safe Provider Failure & Outlier Protection in Checkout', () => {
    it('fails closed safely when provider times out without corrupting booking amounts', async () => {
      provider.setFail(true);

      const res = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache,
      });

      expect(res.isSuccess).toBe(false);
      expect(res.quote.quoteStatus).toBe('PROVIDER_FAILED');
      expect(res.requiresReconfirmation).toBe(true);
      expect(res.reconfirmationReason).toBe('PROVIDER_UNAVAILABLE');
      // Authoritative charge remains fully intact
      expect(res.authoritativeCharge.amount).toBe('5600.00');
      expect(res.authoritativeCharge.currency).toBe('PHP');
    });

    it('blocks checkout quote and flags reconfirmation when rate exceeds 5% outlier threshold', async () => {
      // Baseline cached rate: 0.01785714 (1 USD = 56 PHP)
      cache.set({
        providerId: 'currencyapi',
        rateSourceRef: 'baseline',
        baseCurrency: 'PHP',
        quoteCurrency: 'USD',
        rawRate: '0.01785714',
        normalizedRate: '0.01785714',
        rateDirection: 'DIRECT',
        providerObservedAt: new Date(baseTime.getTime() - 10_000).toISOString(),
        receivedAt: new Date(baseTime.getTime() - 10_000).toISOString(),
        expiresAt: new Date(baseTime.getTime() + 120_000).toISOString(),
        rateStatus: 'FRESH',
      });

      // New rate 0.02000000 -> +12% deviation (> 5% threshold)
      provider.setRate('0.02000000', baseTime.toISOString());

      // Dedicated outlier cache where get() returns null to trigger provider lookup
      const outlierCache = {
        get: () => null,
        getLatest: () => cache.get('PHP', 'USD'),
        set: () => {},
        has: () => false,
        clear: () => {},
        size: () => 1,
      };

      const res = await generateCheckoutQuote({
        authoritativeAmountPhp: '5600.00',
        targetDisplayCurrency: 'USD',
        evaluationTime: baseTime,
        provider,
        cache: outlierCache as any,
      });

      expect(res.isSuccess).toBe(false);
      expect(res.quote.quoteStatus).toBe('OUTLIER_BLOCKED');
      expect(res.requiresReconfirmation).toBe(true);
      expect(res.reconfirmationReason).toBe('OUTLIER_BLOCKED');
      expect(res.authoritativeCharge.currency).toBe('PHP');
    });
  });
});
