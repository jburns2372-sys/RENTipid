/**
 * RENTipid GLCC v1.0 — ECMA-402 Standards-Based Formatters (P3A)
 *
 * Implements presentation-only formatting abstractions using native Intl APIs:
 * - Intl.DateTimeFormat
 * - Intl.NumberFormat
 * - Intl.PluralRules
 * - Intl.DisplayNames
 *
 * IMPORTANT:
 * Formatters are presentation-only. They never convert currency, fetch FX,
 * recalculate listing prices, change charge currency, or mutate financial truth.
 */

import type { CurrencyFormatOptions, PluralForms } from './contracts';
import { t } from './engine';

/**
 * Format a date using native Intl.DateTimeFormat.
 */
export function formatDate(
  date: Date | number | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
      return String(date);
    }
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Format a number using native Intl.NumberFormat.
 */
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Format a percentage value using native Intl.NumberFormat.
 */
export function formatPercent(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      ...options,
    }).format(value);
  } catch {
    return `${(value * 100).toFixed(0)}%`;
  }
}

/**
 * Format currency presentation using native Intl.NumberFormat.
 *
 * Strictly presentation-only. Does not convert currencies, alter amounts,
 * or mutate the authoritative charge currency.
 *
 * Fully supports zero-, two-, and three-minor-digit ISO currencies:
 * - Exponent 0: JPY, KRW (e.g. ¥1,500)
 * - Exponent 2: PHP, USD, EUR (e.g. ₱1,500.00)
 * - Exponent 3: BHD, KWD, OMR (e.g. BHD 1.500)
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string,
  options?: CurrencyFormatOptions
): string {
  try {
    const intlOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency.toUpperCase(),
      currencyDisplay: options?.display || 'symbol',
    };

    if (typeof options?.minorUnitExponent === 'number') {
      intlOptions.minimumFractionDigits = options.minorUnitExponent;
      intlOptions.maximumFractionDigits = options.minorUnitExponent;
    }

    return new Intl.NumberFormat(locale, intlOptions).format(amount);
  } catch {
    // Graceful fallback for non-standard or mock currency identifiers in tests
    const exponent = typeof options?.minorUnitExponent === 'number' ? options.minorUnitExponent : 2;
    return `${currency.toUpperCase()} ${amount.toFixed(exponent)}`;
  }
}

/**
 * Standards-aware pluralization using Intl.PluralRules.
 *
 * Avoids rigid English-only ternary logic (count === 1 ? ... : ...).
 * Resolves exact plural category ('zero' | 'one' | 'two' | 'few' | 'many' | 'other')
 * and interpolates parameters into the selected form.
 */
export function formatPlural(
  count: number,
  locale: string,
  forms: PluralForms,
  params?: Record<string, string | number>
): string {
  try {
    const pr = new Intl.PluralRules(locale);
    const category = pr.select(count);
    const template = forms[category] ?? forms.other ?? forms.one ?? '';

    const mergedParams: Record<string, string | number> = {
      count: String(count),
      ...params,
    };

    return template.replace(/\{(\w+)\}/g, (match, token: string) => {
      return Object.prototype.hasOwnProperty.call(mergedParams, token)
        ? String(mergedParams[token])
        : match;
    });
  } catch {
    // Fallback to basic other/one
    const fallbackTemplate = count === 1 ? forms.one : forms.other;
    return fallbackTemplate.replace(/\{count\}/g, String(count));
  }
}

/**
 * Localized country/region display name using Intl.DisplayNames.
 */
export function getCountryDisplayName(countryCode: string, locale: string): string {
  try {
    if (typeof Intl.DisplayNames !== 'undefined') {
      const dn = new Intl.DisplayNames([locale], { type: 'region' });
      return dn.of(countryCode.toUpperCase()) || countryCode;
    }
  } catch {
    // Fallback to code
  }
  return countryCode;
}

/**
 * Localized language display name using Intl.DisplayNames.
 */
export function getLanguageDisplayName(languageTag: string, locale: string): string {
  try {
    if (typeof Intl.DisplayNames !== 'undefined') {
      const dn = new Intl.DisplayNames([locale], { type: 'language' });
      return dn.of(languageTag) || languageTag;
    }
  } catch {
    // Fallback to tag
  }
  return languageTag;
}

/**
 * Localized currency display name using Intl.DisplayNames.
 */
export function getCurrencyDisplayName(currencyCode: string, locale: string): string {
  try {
    if (typeof Intl.DisplayNames !== 'undefined') {
      const dn = new Intl.DisplayNames([locale], { type: 'currency' });
      return dn.of(currencyCode.toUpperCase()) || currencyCode;
    }
  } catch {
    // Fallback to code
  }
  return currencyCode;
}

/**
 * Standards-aware pluralized duration formatting.
 *
 * Avoids rigid English concatenations like `count + " days"`.
 * Uses Intl.PluralRules through formatPlural and canonical translation templates.
 */
export function formatPluralDuration(
  count: number,
  unit: string,
  locale = 'en-PH'
): string {
  const norm = unit.toLowerCase().replace(/ly$/, '').trim();
  let keyPrefix = 'booking.duration.days';
  if (norm === 'hour' || norm === 'hourly') {
    keyPrefix = 'booking.duration.hours';
  } else if (norm === 'week' || norm === 'weekly') {
    keyPrefix = 'booking.duration.weeks';
  } else if (norm === 'month' || norm === 'monthly') {
    keyPrefix = 'booking.duration.months';
  }

  const forms: PluralForms = {
    one: t(`${keyPrefix}.one`, { count }, locale, `{count} ${norm}`),
    other: t(`${keyPrefix}.other`, { count }, locale, `{count} ${norm}s`),
  };

  return formatPlural(count, locale, forms, { count });
}

