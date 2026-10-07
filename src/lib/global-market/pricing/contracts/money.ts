/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Money Contract
 *
 * Implements safe integer-based monetary amounts (minor units / cents)
 * and distinguishes the 4 distinct currency roles in a global marketplace.
 */

import { getCurrencyDefinition } from '@/lib/glcc/currency/currency-registry';

export const CURRENCY_ROLES = [
  'LISTING_PRICE_CURRENCY',
  'DISPLAY_CURRENCY',
  'TRANSACTION_CURRENCY',
  'SETTLEMENT_CURRENCY',
] as const;

export type CurrencyRole = (typeof CURRENCY_ROLES)[number];

export interface MoneyAmount {
  readonly amountCents: number; // Stored in minor units (e.g. 100 PHP = 10000 cents, 100 JPY = 100 cents)
  readonly currency: string; // ISO 4217 code (e.g. PHP, USD, THB, CNY, EUR, JPY)
  readonly decimalUnits: number; // Number of minor unit decimals (usually 2, 0 for JPY/KRW)
}

/**
 * Validates a currency code against the authoritative GLCC currency catalog.
 */
export function isValidCurrencyCode(currency: unknown): currency is string {
  if (typeof currency !== 'string') return false;
  const upper = currency.trim().toUpperCase();
  return getCurrencyDefinition(upper) !== null;
}

/**
 * Validates a MoneyAmount object.
 * Rejects negative amounts, non-integers, NaN, and unknown currencies.
 */
export function validateMoneyAmount(money: unknown): { valid: boolean; reason?: string } {
  if (!money || typeof money !== 'object') {
    return { valid: false, reason: 'MoneyAmount must be an object.' };
  }

  const { amountCents, currency, decimalUnits } = money as any;

  if (typeof amountCents !== 'number' || isNaN(amountCents) || !Number.isInteger(amountCents)) {
    return { valid: false, reason: `amountCents must be a valid integer, got ${amountCents}.` };
  }

  if (amountCents < 0) {
    return { valid: false, reason: `amountCents cannot be negative, got ${amountCents}.` };
  }

  if (!isValidCurrencyCode(currency)) {
    return { valid: false, reason: `Unknown or unverified currency code: '${currency}'.` };
  }

  if (typeof decimalUnits !== 'number' || decimalUnits < 0 || decimalUnits > 4) {
    return { valid: false, reason: `decimalUnits must be between 0 and 4, got ${decimalUnits}.` };
  }

  return { valid: true };
}
