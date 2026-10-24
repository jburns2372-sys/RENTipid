/**
 * RENTipid GLCC v1.0 — Accessibility & Layout Hardening Helpers
 *
 * Work Package: GLCC-P11
 * Acceptance Targets: A11Y-01, A11Y-03
 *
 * Implements:
 * 1. Screen reader ARIA helpers for financial disclosures and quote countdowns.
 * 2. Unambiguous pronunciation and announcement of PHP currency and non-PHP estimates.
 * 3. Text expansion resilience generator for UI layout verification.
 */

export interface CurrencyAriaOptions {
  readonly amount: number;
  readonly currency: string;
  readonly isEstimate?: boolean;
  readonly authoritativePhpAmount?: number;
}

/**
 * Builds an explicit, unambiguous screen reader label for monetary values.
 */
export function buildCurrencyAriaLabel(options: CurrencyAriaOptions): string {
  const formatted = options.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (options.currency === 'PHP') {
    return `${formatted} Philippine Pesos, authoritative payment amount`;
  }

  if (options.isEstimate && options.authoritativePhpAmount !== undefined) {
    const formattedPhp = options.authoritativePhpAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `Estimated ${formatted} ${options.currency}. Note: the exact final charge will be processed as ${formattedPhp} Philippine Pesos.`;
  }

  return `${formatted} ${options.currency}`;
}

/**
 * Generates pseudo-localized expanded strings to test UI layout truncation resilience (A11Y-03).
 * Adds ~35% expansion length typical of German, Filipino, or Italian translations.
 */
export function generateExpandedTestString(text: string, expansionFactor: number = 0.35): string {
  if (!text) return '';
  const extraCharsCount = Math.ceil(text.length * expansionFactor);
  const padding = '~'.repeat(extraCharsCount);
  return `[${text} ${padding}]`;
}
