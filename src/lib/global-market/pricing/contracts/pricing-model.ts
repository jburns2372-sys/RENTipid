/**
 * RENTipid GLOBAL-MKT / v2.0 — Listing Price Structure Contract
 *
 * Encapsulates the pricing models and security deposit structure for rental inventory.
 */

import { type MoneyAmount } from './money';

export type RentalRateType = 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export const ALL_RENTAL_RATE_TYPES: readonly RentalRateType[] = Object.freeze([
  'Hourly',
  'Daily',
  'Weekly',
  'Monthly',
]);

export interface ListingPriceStructure {
  readonly listingCurrency: string; // The authoritative base currency (e.g. PHP, USD, THB, CNY, EUR)
  readonly currency?: string; // Alias
  readonly rentalType?: RentalRateType;
  readonly rateType?: RentalRateType; // Alias
  readonly baseRate?: MoneyAmount;
  readonly baseRateCents?: number; // Minor unit cents convenience
  readonly hourlyRate?: MoneyAmount;
  readonly dailyRate?: MoneyAmount;
  readonly weeklyRate?: MoneyAmount;
  readonly monthlyRate?: MoneyAmount;
  readonly securityDeposit?: MoneyAmount;
  readonly securityDepositCents?: number;
  readonly replacementValue?: MoneyAmount;
}
