/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Pricing Domain Service
 *
 * Implements:
 * 1. Safe Integer Money Creation & Minor-Unit Math.
 * 2. Separation of Listing Price, Display Price, Transaction Price, and Settlement Price.
 * 3. Strict "NO FAKE FX" Presentation Boundary (Never invents rates).
 * 4. Validation of Listing Price Structures.
 */

import {
  type MoneyAmount,
  validateMoneyAmount,
  isValidCurrencyCode,
} from '../contracts/money';

import {
  type ListingPriceStructure,
} from '../contracts/pricing-model';

import { getCurrencyDefinition } from '@/lib/glcc/currency/currency-registry';

/**
 * Creates an immutable minor-unit MoneyAmount from a decimal number and currency.
 */
export function createMoneyAmount(amount: number, currencyInput: string): MoneyAmount {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    throw new Error(`INVALID_AMOUNT: Amount must be a finite number, received ${amount}.`);
  }

  if (amount < 0) {
    throw new Error(`NEGATIVE_AMOUNT: Rental amounts cannot be negative, received ${amount}.`);
  }

  const currency = currencyInput.trim().toUpperCase();
  const def = getCurrencyDefinition(currency);
  if (!def) {
    throw new Error(`UNKNOWN_CURRENCY: Currency '${currency}' is not registered in GLCC.`);
  }

  const decimalUnits = def.minorUnitExponent ?? 2;
  const factor = Math.pow(10, decimalUnits);
  const amountCents = Math.round(amount * factor);

  return Object.freeze({
    amountCents,
    currency,
    decimalUnits,
  });
}

/**
 * Converts a MoneyAmount back to a human-readable decimal number.
 */
export function moneyAmountToDecimal(money: MoneyAmount): number {
  const factor = Math.pow(10, money.decimalUnits);
  return money.amountCents / factor;
}

/**
 * Formats a MoneyAmount using GLCC metadata and standard locale formatting.
 */
export function formatMoneyAmount(money: MoneyAmount, locale = 'en-US'): string {
  const def = getCurrencyDefinition(money.currency);
  const decimal = moneyAmountToDecimal(money);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: money.decimalUnits,
    maximumFractionDigits: money.decimalUnits,
  }).format(decimal);
}

export interface DisplayPricePresentation {
  readonly displayAmount: number;
  readonly displayCurrency: string;
  readonly displayString: string;
  readonly isConverted: boolean;
  readonly conversionAvailable: boolean;
  readonly sourceCurrency: string;
  readonly targetDisplayCurrency: string;
  readonly conversionNote?: string;
  readonly notes?: string;
}

/**
 * Formats a listing price for display.
 * If displayCurrency === listingPrice.currency, formats directly.
 * If displayCurrency !== listingPrice.currency, NEVER fabricates fake FX.
 * Displays authoritative listing price and flags unverified conversion.
 */
export function presentListingPrice(
  listingPrice: MoneyAmount,
  targetDisplayCurrencyInput?: string | null
): DisplayPricePresentation {
  const targetCurrency = targetDisplayCurrencyInput ? targetDisplayCurrencyInput.trim().toUpperCase() : listingPrice.currency;
  const decimalAmount = moneyAmountToDecimal(listingPrice);

  if (targetCurrency === listingPrice.currency || !isValidCurrencyCode(targetCurrency)) {
    return Object.freeze({
      displayAmount: decimalAmount,
      displayCurrency: listingPrice.currency,
      displayString: formatMoneyAmount(listingPrice),
      isConverted: false,
      conversionAvailable: true,
      sourceCurrency: listingPrice.currency,
      targetDisplayCurrency: listingPrice.currency,
    });
  }

  // Real FX integration is scheduled for GM-6A financial pipeline.
  // We NEVER fabricate arbitrary conversion rates. Truthful Presentation:
  return Object.freeze({
    displayAmount: decimalAmount,
    displayCurrency: listingPrice.currency, // Preserves source currency!
    displayString: formatMoneyAmount(listingPrice),
    isConverted: false,
    conversionAvailable: false,
    sourceCurrency: listingPrice.currency,
    targetDisplayCurrency: targetCurrency,
    conversionNote: `Price is authoritative in ${listingPrice.currency}. Live FX conversion to ${targetCurrency} will be available at checkout.`,
    notes: 'NO_FAKE_FX: Unverified exchange rate conversion suppressed.',
  });
}

/**
 * Validates a ListingPriceStructure for consistency and correctness.
 * Accepts full ListingPriceStructure or flat pricing object.
 */
export function validateListingPricing(pricing: any): {
  valid: boolean;
  errors: readonly string[];
} {
  if (!pricing) {
    return { valid: false, errors: ['Listing price structure is required.'] };
  }

  const errors: string[] = [];
  const currency = (pricing.listingCurrency || pricing.currency || '').trim().toUpperCase();

  if (!isValidCurrencyCode(currency)) {
    errors.push(`Invalid listing currency: '${currency}'.`);
  }

  if (pricing.baseRate) {
    const baseValidation = validateMoneyAmount(pricing.baseRate);
    if (!baseValidation.valid) {
      errors.push(`Base rate error: ${baseValidation.reason}`);
    } else if (pricing.baseRate.currency !== currency) {
      errors.push(`Base rate currency (${pricing.baseRate.currency}) does not match listing currency (${currency}).`);
    } else if (pricing.baseRate.amountCents <= 0) {
      errors.push('Base rental rate must be greater than zero.');
    }
  } else if (typeof pricing.baseRateCents === 'number') {
    if (isNaN(pricing.baseRateCents) || !isFinite(pricing.baseRateCents)) {
      errors.push('Base rate cents must be a finite number.');
    } else if (pricing.baseRateCents <= 0) {
      errors.push('Base rental rate must be greater than zero.');
    }
  } else {
    errors.push('Base rental rate is required.');
  }

  const checkOptionalRate = (name: string, rate?: MoneyAmount) => {
    if (rate) {
      const val = validateMoneyAmount(rate);
      if (!val.valid) {
        errors.push(`${name} error: ${val.reason}`);
      } else if (rate.currency !== currency) {
        errors.push(`${name} currency (${rate.currency}) must match listing currency (${currency}).`);
      }
    }
  };

  checkOptionalRate('Hourly rate', pricing.hourlyRate);
  checkOptionalRate('Daily rate', pricing.dailyRate);
  checkOptionalRate('Weekly rate', pricing.weeklyRate);
  checkOptionalRate('Monthly rate', pricing.monthlyRate);
  checkOptionalRate('Security deposit', pricing.securityDeposit);
  checkOptionalRate('Replacement value', pricing.replacementValue);

  return {
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  };
}
