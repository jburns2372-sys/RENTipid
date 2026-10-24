/**
 * RENTipid GLCC v1.0 — Layout Direction & Bidi Hardening
 *
 * Work Package: GLCC-P11
 * Acceptance Targets: A11Y-01, A11Y-02
 *
 * Implements:
 * 1. Document-level and component-level text direction resolution (LTR vs RTL).
 * 2. RTL locales catalog (Arabic, Hebrew, Persian, Urdu, Yiddish).
 * 3. Bidirectional (bidi) text isolation and boundary wrapping.
 * 4. Protection of structured financial values, dates, and phone numbers in RTL contexts.
 */

const RTL_LANGUAGE_CODES = new Set([
  'ar', // Arabic
  'he', // Hebrew
  'fa', // Persian/Farsi
  'ur', // Urdu
  'yi', // Yiddish
]);

export interface DocumentAttributes {
  readonly lang: string;
  readonly dir: 'ltr' | 'rtl';
  readonly isRtl: boolean;
}

/**
 * Resolves HTML document lang and dir attributes from an effective locale string.
 */
export function resolveDocumentAttributes(locale: string | undefined | null): DocumentAttributes {
  if (!locale || typeof locale !== 'string') {
    return { lang: 'en-PH', dir: 'ltr', isRtl: false };
  }

  const normalized = locale.trim().replace('_', '-');
  const baseLang = normalized.split('-')[0].toLowerCase();
  const isRtl = RTL_LANGUAGE_CODES.has(baseLang);

  return {
    lang: normalized,
    dir: isRtl ? 'rtl' : 'ltr',
    isRtl,
  };
}

/**
 * Wraps structured text (currency amounts, telephone numbers, codes) in Left-to-Right
 * directional isolation markers (LRI \u2066 ... PDI \u2069) to prevent number inversion in RTL layouts.
 */
export function isolateLtrInRtl(content: string | number): string {
  const str = String(content);
  // \u2066 = LEFT-TO-RIGHT ISOLATE, \u2069 = POP DIRECTIONAL ISOLATE
  return `\u2066${str}\u2069`;
}

/**
 * Formats a financial amount safely for RTL or LTR presentation.
 */
export function formatBidiMonetaryAmount(amountString: string, isRtl: boolean): string {
  if (!isRtl) return amountString;
  return isolateLtrInRtl(amountString);
}
