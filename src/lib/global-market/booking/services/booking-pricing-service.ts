/**
 * RENTipid GLOBAL-MKT / v2.0 — Server-Authoritative Booking Pricing Service
 *
 * Implements deterministic server-side rental calculation, integer minor unit arithmetic,
 * multi-currency money snapshots, and strict prevention of client-side price tampering.
 */

import { type ListingPriceStructure, type MoneyAmount } from '@/lib/global-market/pricing';
import { type PricingUnit, type MoneySnapshot } from '../contracts/booking-record';

export interface AuthoritativePriceCalculationResult {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly baseRentalAmountMinorUnits: number;
  readonly securityDepositAmountMinorUnits: number;
  readonly deliveryFeeMinorUnits: number;
  readonly platformFeeMinorUnits: number;
  readonly estimatedTotalAmountMinorUnits: number;
  readonly unitRateMinorUnits: number;
  readonly currency: string;
}

/**
 * Deterministically calculates the authoritative rental amount on the server.
 * Never trusts any client-submitted totals or rates.
 */
export function calculateAuthoritativeRentalPrice(
  listingPricing: ListingPriceStructure | any,
  duration: number,
  durationUnit: PricingUnit,
  deliveryRequested: boolean = false
): AuthoritativePriceCalculationResult {
  const currency = listingPricing.listingCurrency || listingPricing.currency || 'PHP';

  if (!duration || duration <= 0 || !Number.isFinite(duration)) {
    return {
      isValid: false,
      reason: 'INVALID_DURATION: Rental duration must be a positive finite number.',
      baseRentalAmountMinorUnits: 0,
      securityDepositAmountMinorUnits: 0,
      deliveryFeeMinorUnits: 0,
      platformFeeMinorUnits: 0,
      estimatedTotalAmountMinorUnits: 0,
      unitRateMinorUnits: 0,
      currency,
    };
  }

  let rate: MoneyAmount | undefined;
  switch (durationUnit) {
    case 'HOURLY':
      rate = listingPricing.hourlyRate || listingPricing.rates?.hourly;
      break;
    case 'DAILY':
      rate = listingPricing.dailyRate || listingPricing.rates?.daily || listingPricing.baseRate;
      break;
    case 'WEEKLY':
      rate = listingPricing.weeklyRate || listingPricing.rates?.weekly;
      break;
    case 'MONTHLY':
      rate = listingPricing.monthlyRate || listingPricing.rates?.monthly;
      break;
    default:
      return {
        isValid: false,
        reason: `UNSUPPORTED_PRICING_UNIT: Pricing unit '${durationUnit}' is invalid.`,
        baseRentalAmountMinorUnits: 0,
        securityDepositAmountMinorUnits: 0,
        deliveryFeeMinorUnits: 0,
        platformFeeMinorUnits: 0,
        estimatedTotalAmountMinorUnits: 0,
        unitRateMinorUnits: 0,
        currency,
      };
  }

  const extractMinorUnits = (amount: any): number => {
    if (!amount) return 0;
    if (typeof amount === 'number') return Math.round(amount);
    return amount.amountCents ?? amount.amountMinorUnits ?? 0;
  };

  const unitRateMinorUnits = extractMinorUnits(rate);

  if (!rate || unitRateMinorUnits <= 0) {
    return {
      isValid: false,
      reason: `RATE_UNAVAILABLE: Listing does not offer ${durationUnit} rate.`,
      baseRentalAmountMinorUnits: 0,
      securityDepositAmountMinorUnits: 0,
      deliveryFeeMinorUnits: 0,
      platformFeeMinorUnits: 0,
      estimatedTotalAmountMinorUnits: 0,
      unitRateMinorUnits: 0,
      currency,
    };
  }

  const baseRentalAmountMinorUnits = Math.round(unitRateMinorUnits * duration);
  const securityDepositAmountMinorUnits = extractMinorUnits(
    listingPricing.securityDeposit || listingPricing.securityDepositCents
  );
  const deliveryFeeAmount = extractMinorUnits(listingPricing.deliveryFee);
  const deliveryFeeMinorUnits = deliveryRequested ? deliveryFeeAmount : 0;
  const platformFeeMinorUnits = 0; // Platform fee hooks prepared for GM-6A

  const estimatedTotalAmountMinorUnits =
    baseRentalAmountMinorUnits +
    securityDepositAmountMinorUnits +
    deliveryFeeMinorUnits +
    platformFeeMinorUnits;

  return {
    isValid: true,
    baseRentalAmountMinorUnits,
    securityDepositAmountMinorUnits,
    deliveryFeeMinorUnits,
    platformFeeMinorUnits,
    estimatedTotalAmountMinorUnits,
    unitRateMinorUnits,
    currency,
  };
}

export interface MoneySnapshotInput {
  readonly listingPricing: ListingPriceStructure | any;
  readonly baseRentalAmountMinorUnits: number;
  readonly securityDepositAmountMinorUnits: number;
  readonly deliveryFeeMinorUnits: number;
  readonly platformFeeMinorUnits: number;
  readonly estimatedTotalAmountMinorUnits: number;
  readonly displayCurrencyPreference?: string;
}

/**
 * Creates an immutable MoneySnapshot preserving GM-4A money rules.
 * Distinguishes listing price currency, booking currency, display currency,
 * transaction currency, and settlement currency.
 */
export function createAuthoritativeMoneySnapshot(
  input: MoneySnapshotInput
): MoneySnapshot {
  const {
    listingPricing,
    baseRentalAmountMinorUnits,
    securityDepositAmountMinorUnits,
    deliveryFeeMinorUnits,
    platformFeeMinorUnits,
    estimatedTotalAmountMinorUnits,
    displayCurrencyPreference,
  } = input;

  const currency = listingPricing.listingCurrency || listingPricing.currency || 'PHP';
  const now = new Date().toISOString();

  return Object.freeze({
    listingPriceCurrency: currency,
    bookingPriceCurrency: currency,
    displayCurrency: displayCurrencyPreference || currency,
    baseRentalAmountMinorUnits,
    securityDepositAmountMinorUnits,
    deliveryFeeMinorUnits,
    platformFeeMinorUnits,
    estimatedTotalAmountMinorUnits,
    isFxGuaranteed: false, // Invariant: No fake FX
    transactionCurrencyRequired: 'PHP', // Locked to authoritative charge currency
    settlementCurrencyRequired: 'PHP', // Provider settlement currency
    snapshotTimestamp: now,
  });
}
