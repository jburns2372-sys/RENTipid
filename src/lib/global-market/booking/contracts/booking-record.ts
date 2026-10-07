/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Booking Record & Snapshot Contracts
 *
 * Implements server-authoritative booking participants, immutable listing snapshots,
 * immutable multi-currency money snapshots, and timezone-aware rental duration contracts.
 */

import { type BookingLifecycleState } from './booking-lifecycle';

export interface BookingParticipants {
  readonly renterId: string;
  readonly providerId: string;
  readonly listingId: string;
  readonly jurisdictionCode: string;
}

export type PricingUnit = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ListingSnapshot {
  readonly listingId: string;
  readonly providerId: string;
  readonly jurisdictionCode: string;
  readonly title: string;
  readonly categorySlug?: string;
  readonly pricingUnit: PricingUnit;
  readonly basePriceMinorUnits: number;
  readonly currency: string;
  readonly securityDepositMinorUnits: number;
  readonly snapshotTimestamp: string;
  readonly policyVersion?: string;
}

export interface MoneySnapshot {
  readonly listingPriceCurrency: string;
  readonly bookingPriceCurrency: string;
  readonly displayCurrency: string;
  readonly baseRentalAmountMinorUnits: number;
  readonly securityDepositAmountMinorUnits: number;
  readonly deliveryFeeMinorUnits: number;
  readonly platformFeeMinorUnits: number;
  readonly estimatedTotalAmountMinorUnits: number;
  readonly isFxGuaranteed: boolean;
  readonly transactionCurrencyRequired: string; // Authoritative currency in which transaction must settle (PHP for GM-5A)
  readonly settlementCurrencyRequired: string; // Authoritative currency in which provider settles (PHP for GM-5A)
  readonly snapshotTimestamp: string;
}

export interface RentalPeriod {
  readonly startDate: string; // YYYY-MM-DD
  readonly endDate: string; // YYYY-MM-DD
  readonly startTime?: string; // HH:mm
  readonly endTime?: string; // HH:mm
  readonly duration: number;
  readonly durationUnit: PricingUnit;
  readonly jurisdictionTimezone: string;
  readonly startUtcTimestamp: string; // Canonical ISO 8601 UTC
  readonly endUtcTimestamp: string; // Canonical ISO 8601 UTC
}

export type PaymentLifecycleStatus =
  | 'NOT_REQUIRED_YET'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'SETTLED'
  | 'REFUNDED'
  | 'FAILED';

export interface CancellationDetails {
  readonly cancelledBy: string;
  readonly cancelledAt: string;
  readonly reason?: string;
  readonly policyReference?: string;
}

export interface GlobalBookingRecord {
  readonly id: string;
  readonly bookingReference: string;
  readonly participants: BookingParticipants;
  readonly listingSnapshot: ListingSnapshot;
  readonly moneySnapshot: MoneySnapshot;
  readonly rentalPeriod: RentalPeriod;
  readonly status: BookingLifecycleState;
  readonly paymentStatus: PaymentLifecycleStatus;
  readonly cancellationDetails?: CancellationDetails;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly idempotencyKey?: string;
}
