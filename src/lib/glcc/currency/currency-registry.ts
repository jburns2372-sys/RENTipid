/**
 * RENTipid GLCC v1.1 — Centralized Global Currency Registry & Formatting Module
 *
 * Work Package: GLOBAL-W1
 *
 * Implements:
 * 1. ISO 4217 compliant registry covering all owner-confirmed compliance jurisdictions:
 *    - PHP, GBP, USD, CAD, AUD, SGD, MYR, IDR, VND, JPY, KRW, INR, AED, BRL, EUR,
 *      plus EU/EEA non-EUR national currencies (PLN, SEK, DKK, NOK, CZK, HUF, RON, CHF).
 * 2. Minor unit exponents (0 for JPY/KRW/VND, 2 for PHP/USD/EUR/GBP/etc.).
 * 3. Presentation formatting via native ECMA-402 Intl.NumberFormat.
 * 4. Strict Financial Boundary:
 *    - Transaction currency: Strictly PHP for marketplace contracts & charging.
 *    - Settlement currency: Strictly PHP for merchant payouts under Philippine regulatory laws.
 *    - Display currency: Independent user choice.
 * 5. Safe no-conversion fallback when live FX is unapproved:
 *    - LIVE_FX_PROVIDER_STATUS: 'OWNER / BUSINESS APPROVAL REQUIRED'.
 *    - FAKE PRODUCTION FX: NO.
 */

import type { CurrencyMetadata } from '../registry-contracts';

export interface GlobalCurrencyDefinition extends CurrencyMetadata {
  readonly standardSymbol: string;
  readonly countrySuggestions: readonly string[]; // ISO country codes suggesting this as default
  readonly decimalSeparator: '.' | ',';
  readonly groupSeparator: ',' | '.' | ' ' | "'";
}

export const GLOBAL_CURRENCY_CATALOG: readonly GlobalCurrencyDefinition[] = Object.freeze([
  // Core Baseline & Jurisdiction Required Currencies
  {
    code: 'PHP',
    numericCode: '608',
    name: 'Philippine Peso',
    symbol: '₱',
    standardSymbol: '₱',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['PH'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'USD',
    numericCode: '840',
    name: 'US Dollar',
    symbol: '$',
    standardSymbol: '$',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['US'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'GBP',
    numericCode: '826',
    name: 'British Pound',
    symbol: '£',
    standardSymbol: '£',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['GB'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'EUR',
    numericCode: '978',
    name: 'Euro',
    symbol: '€',
    standardSymbol: '€',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'PT', 'FI', 'GR', 'LU', 'CY', 'EE', 'LV', 'LT', 'MT', 'SK', 'SI'],
    decimalSeparator: ',',
    groupSeparator: '.',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'CAD',
    numericCode: '124',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    standardSymbol: '$',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['CA'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'AUD',
    numericCode: '036',
    name: 'Australian Dollar',
    symbol: 'A$',
    standardSymbol: '$',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['AU'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'SGD',
    numericCode: '702',
    name: 'Singapore Dollar',
    symbol: 'S$',
    standardSymbol: '$',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['SG'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'MYR',
    numericCode: '458',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    standardSymbol: 'RM',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['MY'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'IDR',
    numericCode: '360',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    standardSymbol: 'Rp',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['ID'],
    decimalSeparator: ',',
    groupSeparator: '.',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'VND',
    numericCode: '704',
    name: 'Vietnamese Dong',
    symbol: '₫',
    standardSymbol: '₫',
    minorUnitExponent: 0,
    isActive: true,
    countrySuggestions: ['VN'],
    decimalSeparator: ',',
    groupSeparator: '.',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'JPY',
    numericCode: '392',
    name: 'Japanese Yen',
    symbol: '¥',
    standardSymbol: '¥',
    minorUnitExponent: 0,
    isActive: true,
    countrySuggestions: ['JP'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'KRW',
    numericCode: '410',
    name: 'South Korean Won',
    symbol: '₩',
    standardSymbol: '₩',
    minorUnitExponent: 0,
    isActive: true,
    countrySuggestions: ['KR'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'INR',
    numericCode: '356',
    name: 'Indian Rupee',
    symbol: '₹',
    standardSymbol: '₹',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['IN'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'AED',
    numericCode: '784',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    standardSymbol: 'AED',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['AE'],
    decimalSeparator: '.',
    groupSeparator: ',',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'BRL',
    numericCode: '986',
    name: 'Brazilian Real',
    symbol: 'R$',
    standardSymbol: 'R$',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['BR'],
    decimalSeparator: ',',
    groupSeparator: '.',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },

  // EU / EEA Non-EUR Member State Currencies
  {
    code: 'PLN',
    numericCode: '985',
    name: 'Polish Zloty',
    symbol: 'zł',
    standardSymbol: 'zł',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['PL'],
    decimalSeparator: ',',
    groupSeparator: ' ',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'SEK',
    numericCode: '752',
    name: 'Swedish Krona',
    symbol: 'kr',
    standardSymbol: 'kr',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['SE'],
    decimalSeparator: ',',
    groupSeparator: ' ',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'DKK',
    numericCode: '208',
    name: 'Danish Krone',
    symbol: 'kr',
    standardSymbol: 'kr',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['DK'],
    decimalSeparator: ',',
    groupSeparator: '.',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'NOK',
    numericCode: '578',
    name: 'Norwegian Krone',
    symbol: 'kr',
    standardSymbol: 'kr',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['NO'],
    decimalSeparator: ',',
    groupSeparator: ' ',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'CZK',
    numericCode: '203',
    name: 'Czech Koruna',
    symbol: 'Kč',
    standardSymbol: 'Kč',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['CZ'],
    decimalSeparator: ',',
    groupSeparator: ' ',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'HUF',
    numericCode: '348',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    standardSymbol: 'Ft',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['HU'],
    decimalSeparator: ',',
    groupSeparator: ' ',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'RON',
    numericCode: '946',
    name: 'Romanian Leu',
    symbol: 'lei',
    standardSymbol: 'lei',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['RO'],
    decimalSeparator: ',',
    groupSeparator: '.',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
  {
    code: 'CHF',
    numericCode: '756',
    name: 'Swiss Franc',
    symbol: 'CHF',
    standardSymbol: 'CHF',
    minorUnitExponent: 2,
    isActive: true,
    countrySuggestions: ['LI', 'CH'],
    decimalSeparator: '.',
    groupSeparator: '\'',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
  },
]);

export const GLOBAL_SUPPORTED_CURRENCY_CODES: readonly string[] = Object.freeze(
  GLOBAL_CURRENCY_CATALOG.map(c => c.code)
);

/**
 * Retrieves currency metadata by ISO 4217 code.
 */
export function getCurrencyDefinition(code: string): GlobalCurrencyDefinition | null {
  if (!code || typeof code !== 'string') return null;
  const upper = code.trim().toUpperCase();
  return GLOBAL_CURRENCY_CATALOG.find(c => c.code === upper) ?? null;
}

/**
 * Checks if a currency code is supported in the global catalog.
 */
export function isSupportedCurrencyCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const upper = code.trim().toUpperCase();
  return GLOBAL_SUPPORTED_CURRENCY_CODES.includes(upper);
}

/**
 * Formats a monetary amount using standard ECMA-402 Intl.NumberFormat.
 * Strictly presentation-only: never modifies financial charge or settlement truth.
 */
export function formatGlobalCurrency(
  amount: number | string,
  currencyCode: string,
  localeTag: string = 'en-PH',
  options?: {
    display?: 'symbol' | 'code' | 'name' | 'narrowSymbol';
    overrideMinorExponent?: number;
  }
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return `${currencyCode} 0.00`;

  const upperCode = currencyCode.toUpperCase();
  const definition = getCurrencyDefinition(upperCode);
  const exponent = options?.overrideMinorExponent ?? definition?.minorUnitExponent ?? 2;

  try {
    return new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency: upperCode,
      currencyDisplay: options?.display ?? 'symbol',
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    }).format(num);
  } catch {
    // Safe standard fallback
    const sym = definition?.symbol ?? upperCode;
    return `${sym}${num.toFixed(exponent)}`;
  }
}

/**
 * Monetary Authority Boundaries:
 * Enforces separation between Display, Transaction, and Settlement currencies.
 */
export interface MonetaryAuthorityContext {
  readonly displayCurrency: string;
  readonly transactionCurrency: 'PHP'; // Immutable marketplace transaction currency
  readonly settlementCurrency: 'PHP';  // Immutable merchant payout currency
  readonly isDisplayDifferentFromCharge: boolean;
  readonly fxStatus: 'NO_LIVE_FX_AVAILABLE' | 'CONVERSION_NOT_APPLIED';
}

export function resolveMonetaryAuthority(displayCurrency: string): MonetaryAuthorityContext {
  const norm = isSupportedCurrencyCode(displayCurrency) ? displayCurrency.toUpperCase() : 'PHP';
  return {
    displayCurrency: norm,
    transactionCurrency: 'PHP',
    settlementCurrency: 'PHP',
    isDisplayDifferentFromCharge: norm !== 'PHP',
    fxStatus: 'NO_LIVE_FX_AVAILABLE',
  };
}
