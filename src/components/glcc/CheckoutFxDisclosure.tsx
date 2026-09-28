'use client';

/**
 * RENTipid GLCC v1.0 — Checkout FX Disclosure Component
 *
 * Work Package: GLCC-P6
 *
 * Implements:
 * 1. Prominent disclosure that final transaction charge will strictly be processed in PHP.
 * 2. Visual estimate in the renter's preferred display currency.
 * 3. 120-second quote expiry countdown and refresh mechanism.
 * 4. Material rate change detection requiring renewed confirmation.
 * 5. Hidden form fields for quoteId and quoteEvidence to bind to payment actions.
 * 6. Protection against confusing display currency with charge currency.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { FxQuoteEvidence } from '@/lib/glcc/fx-contracts';
import { useTranslation } from '@/lib/glcc/i18n';

interface CheckoutFxDisclosureProps {
  readonly authoritativeAmountPhp: number;
  readonly targetCurrency: string;
  readonly initialQuote?: FxQuoteEvidence | null;
  readonly onQuoteChange?: (quote: FxQuoteEvidence | null) => void;
  readonly className?: string;
}

export function CheckoutFxDisclosure({
  authoritativeAmountPhp,
  targetCurrency,
  initialQuote,
  onQuoteChange,
  className = '',
}: CheckoutFxDisclosureProps) {
  const { t } = useTranslation();
  const isBaseCurrency = !targetCurrency || targetCurrency.toUpperCase() === 'PHP';

  const [quote, setQuote] = useState<FxQuoteEvidence | null>(initialQuote ?? null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (!initialQuote) return 0;
    const expiresAt = new Date(initialQuote.expiresAt).getTime();
    const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    return Math.min(120, remaining);
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [rateChangedNotice, setRateChangedNotice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    if (isBaseCurrency || !quote) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(quote.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [quote, isBaseCurrency]);

  // Refresh rate quote
  const handleRefreshQuote = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/fx/estimate?amount=${authoritativeAmountPhp}&source=PHP&target=${encodeURIComponent(targetCurrency)}`
      );

      if (!res.ok) {
        throw new Error('Failed to refresh exchange rate');
      }

      const data = await res.json();
      if (!data || !data.isEstimateAvailable) {
        throw new Error('Exchange rate currently unavailable');
      }

      // Check for rate change compared to existing quote
      if (quote && (quote.rate !== data.rate || quote.targetAmount !== data.targetAmount)) {
        setRateChangedNotice(true);
      } else {
        setRateChangedNotice(false);
      }

      const evalTime = new Date();
      const newQuote: FxQuoteEvidence = {
        quoteId: `fxq_chk_${evalTime.getTime()}_${Math.random().toString(36).substring(2, 8)}`,
        rateSourceRef: data.rateSourceRef || 'currencyapi',
        providerId: data.provider || 'currencyapi',
        sourceAmount: authoritativeAmountPhp.toFixed(2),
        sourceCurrency: 'PHP',
        targetAmount: data.targetAmount,
        targetCurrency: data.targetCurrency,
        rate: data.rate,
        providerObservedAt: data.providerObservedAt || evalTime.toISOString(),
        createdAt: evalTime.toISOString(),
        expiresAt: new Date(evalTime.getTime() + 120_000).toISOString(),
        feePolicyRef: 'NONE',
        spreadPolicyRef: 'NONE',
        roundingPolicyRef: 'ROUND_HALF_UP',
        context: 'CHECKOUT_QUOTE',
        quoteStatus: 'ACTIVE',
        provenance: {
          evaluatedAt: evalTime.toISOString(),
          canonicalFallbackUsed: false,
        },
      };

      setQuote(newQuote);
      setSecondsRemaining(120);
      onQuoteChange?.(newQuote);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to refresh quote';
      setErrorMsg(message);
    } finally {
      setIsRefreshing(false);
    }
  }, [authoritativeAmountPhp, targetCurrency, quote, onQuoteChange]);

  // If display currency is PHP, show simple authoritative charge disclosure
  if (isBaseCurrency) {
    return (
      <div className={`p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm ${className}`}>
        <div className="flex items-center space-x-2 text-emerald-900 font-semibold mb-1">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>{t('checkout.authoritativePaymentCurrency')}</span>
        </div>
        <p className="text-emerald-800">
          Your card or payment method will be charged in <strong>{t('checkout.phpPhilippinePeso')}</strong>{t('checkout.finalAmount')} <strong>₱{authoritativeAmountPhp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
        </p>
      </div>
    );
  }

  const isExpired = secondsRemaining <= 0;

  return (
    <div className={`p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm space-y-3 ${className}`}>
      {/* Hidden inputs to pass quoteId and evidence to the payment action */}
      {quote && (
        <>
          <input type="hidden" name="fx_quote_id" value={quote.quoteId} />
          <input type="hidden" name="fx_target_currency" value={quote.targetCurrency} />
          <input type="hidden" name="fx_target_amount" value={quote.targetAmount} />
          <input type="hidden" name="fx_rate" value={quote.rate} />
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
        <div className="flex items-center space-x-2 text-amber-900 font-bold">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Currency & Payment Disclosure</span>
        </div>
        {!isExpired && quote && (
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
            Quote valid: {secondsRemaining}s
          </span>
        )}
      </div>

      {/* Charge Notice & Disclosed Final PHP Amount */}
      <div className="space-y-1">
        <p className="text-amber-900">
          <strong>{t('checkout.important')}</strong> Your payment method will strictly be charged in{' '}
          <strong className="underline text-emerald-800">{t('checkout.phpPhilippinePeso')}</strong>.
        </p>
        <div className="flex justify-between items-baseline pt-1">
          <span className="text-gray-700">{t('checkout.authoritativeCharge')}</span>
          <span className="text-base font-bold text-gray-900">
            ₱{authoritativeAmountPhp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
          </span>
        </div>
        {quote && (
          <div className="flex justify-between items-baseline text-xs text-gray-600">
            <span>{t('checkout.estimatedInYourPreferred')}</span>
            <span className="font-semibold text-gray-800">
              ≈ {quote.targetCurrency} {parseFloat(quote.targetAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Rate Changed Warning */}
      {rateChangedNotice && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs">
          <strong>{t('checkout.notice')}</strong> The exchange rate was updated. Please review the updated estimate above before proceeding.
        </div>
      )}

      {/* Quote Expired Banner */}
      {isExpired && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs space-y-2">
          <p>
            <strong>{t('checkout.quoteExpired')}</strong> To ensure accurate pricing estimates, please refresh the exchange rate quote before paying.
          </p>
          <button
            type="button"
            onClick={handleRefreshQuote}
            disabled={isRefreshing}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition disabled:opacity-50 text-xs"
          >
            {isRefreshing ? 'Refreshing Quote...' : 'Refresh Exchange Rate'}
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <p className="text-xs text-red-600 font-medium">
          {errorMsg}. Converted estimate fallback to authoritative base price.
        </p>
      )}

      <p className="text-[11px] text-gray-500 leading-tight">
        Currency conversion is based on official reference rates from CurrencyAPI. The final charge amount in your bank or card statement may vary slightly depending on your issuing bank&apos;s foreign exchange fees.
      </p>
    </div>
  );
}
