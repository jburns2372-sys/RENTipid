"use client";

import React, { useState, useEffect } from 'react';
import { t, formatCurrency } from '@/lib/glcc/i18n';
import { useGlobalPreferences } from './useGlobalPreferences';

export interface BrowsePriceEstimateProps {
  readonly amount: string | number;
  readonly baseCurrency?: string;
  readonly targetCurrency?: string;
  readonly locale?: string;
  readonly unitLabel?: string;
  readonly className?: string;
  readonly showEstimateBadge?: boolean;
}

interface EstimateState {
  readonly isEstimateAvailable: boolean;
  readonly targetAmountExact?: string;
  readonly targetCurrency?: string;
  readonly isStale?: boolean;
  readonly isError?: boolean;
}

/**
 * Renter-facing browse & listing price component.
 *
 * Invariants:
 * 1. Authoritative base price (PHP) is ALWAYS prominent and never replaced.
 * 2. If user's display currency matches base currency, no FX call is made.
 * 3. If display currency differs and estimate is available, displays localized estimate
 *    clearly labeled with "approx." / "Estimated".
 * 4. If FX is unavailable, stale, or feature flag is disabled, seamlessly displays
 *    authoritative price without breaking browse layout or fabricating numbers.
 * 5. Formatting uses ECMA-402 Intl only at the final presentation boundary.
 */
export default function BrowsePriceEstimate({
  amount,
  baseCurrency = 'PHP',
  targetCurrency: explicitTargetCurrency,
  locale = 'en-PH',
  unitLabel,
  className = '',
  showEstimateBadge = true,
}: BrowsePriceEstimateProps) {
  const { serverPreference } = useGlobalPreferences({ isGuest: true });

  const activeTargetCurrency = (
    explicitTargetCurrency ||
    serverPreference?.displayCurrency ||
    baseCurrency
  ).toUpperCase();

  const [estimate, setEstimate] = useState<EstimateState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const amountStr = typeof amount === 'string' ? amount : String(amount);

  const isDifferentCurrency = activeTargetCurrency !== baseCurrency.toUpperCase();

  useEffect(() => {
    if (!isDifferentCurrency || !numericAmount) {
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    async function fetchEstimate() {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          sourceAmount: amountStr,
          sourceCurrency: baseCurrency,
          targetCurrency: activeTargetCurrency,
        });

        const res = await fetch(`/api/fx/estimate?${query.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (isCancelled) return;

        if (res.ok) {
          const data = await res.json();
          if (data.isEstimateAvailable && data.targetAmountExact) {
            setEstimate({
              isEstimateAvailable: true,
              targetAmountExact: data.targetAmountExact,
              targetCurrency: data.targetCurrency,
              isStale: data.status === 'STALE',
            });
          } else {
            setEstimate({ isEstimateAvailable: false, isError: true });
          }
        } else {
          // Feature flag disabled (403) or error
          setEstimate({ isEstimateAvailable: false, isError: true });
        }
      } catch {
        if (!isCancelled) {
          setEstimate({ isEstimateAvailable: false, isError: true });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchEstimate();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [amountStr, baseCurrency, activeTargetCurrency, isDifferentCurrency, numericAmount]);

  const effectiveEstimate = isDifferentCurrency && numericAmount > 0 ? estimate : null;
  const effectiveLoading = isDifferentCurrency && numericAmount > 0 ? loading : false;

  // Format authoritative base price (e.g. ₱1,500.00)
  const formattedBasePrice = formatCurrency(numericAmount, baseCurrency, locale);

  return (
    <div className={`flex flex-col ${className}`} data-testid="browse-price-estimate">
      {/* Authoritative Base Price (Always Primary) */}
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-gray-900" data-testid="authoritative-price">
          {formattedBasePrice}
        </span>
        {unitLabel && (
          <span className="text-gray-500 text-sm ml-0.5">{unitLabel}</span>
        )}
      </div>

      {/* Converted Display Estimate (when target currency differs) */}
      {isDifferentCurrency && (
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1" data-testid="estimate-container">
          {effectiveLoading ? (
            <span className="text-gray-400 italic text-[11px] animate-pulse">
              {t('common.loading', undefined, locale)}...
            </span>
          ) : effectiveEstimate?.isEstimateAvailable && effectiveEstimate.targetAmountExact ? (
            <>
              <span className="text-gray-600 font-medium" data-testid="converted-amount">
                {t('fx.estimate.approximate', undefined, locale)}{' '}
                {formatCurrency(parseFloat(effectiveEstimate.targetAmountExact), effectiveEstimate.targetCurrency || activeTargetCurrency, locale)}
              </span>
              {showEstimateBadge && (
                <span
                  className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.2 rounded border border-gray-200"
                  title={t('fx.estimate.originalPrice', { price: formattedBasePrice }, locale)}
                >
                  {t('fx.estimate.label', undefined, locale)}
                </span>
              )}
              {effectiveEstimate.isStale && (
                <span className="text-amber-600 text-[10px]" title={t('fx.estimate.stale', undefined, locale)}>
                  *
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400 text-[11px]" data-testid="estimate-unavailable">
              {t('fx.estimate.unavailable', undefined, locale)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
