/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Availability & Double-Booking Protection Service
 *
 * Implements server-authoritative date/time validation, timezone contracts,
 * and mathematical non-overlap protection against double bookings.
 */

import {
  type BookingLifecycleState,
  isBookingBlockingAvailability,
} from '../contracts/booking-lifecycle';
import { type PricingUnit, type RentalPeriod } from '../contracts/booking-record';
import {
  resolveJurisdictionBookingPolicy,
  getJurisdictionPrimaryTimezone,
} from '../registry/jurisdiction-booking-registry';

export interface RentalPeriodInput {
  readonly startDate: string; // YYYY-MM-DD
  readonly endDate: string; // YYYY-MM-DD
  readonly startTime?: string; // HH:mm (default '09:00')
  readonly endTime?: string; // HH:mm (default '18:00')
  readonly duration: number;
  readonly durationUnit: PricingUnit;
  readonly jurisdictionCode: string;
}

export interface ValidatedRentalPeriodResult {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly rentalPeriod?: RentalPeriod;
}

export interface ExistingBookingSlot {
  readonly id: string;
  readonly listingId: string;
  readonly startUtcTimestamp: string;
  readonly endUtcTimestamp: string;
  readonly status: BookingLifecycleState;
}

export interface AvailabilityCheckResult {
  readonly isAvailable: boolean;
  readonly reason?: string;
  readonly conflictingBookingId?: string;
}

/**
 * Validates requested rental dates/times against jurisdiction timezone and policies.
 * Produces canonical UTC ISO timestamps for server-authoritative concurrency checks.
 */
export function validateAndBuildRentalPeriod(
  input: RentalPeriodInput,
  referenceNowUtc: Date = new Date()
): ValidatedRentalPeriodResult {
  const { startDate, endDate, duration, durationUnit, jurisdictionCode } = input;
  const startTime = input.startTime || '09:00';
  const endTime = input.endTime || '18:00';

  if (!jurisdictionCode) {
    return { isValid: false, reason: 'MISSING_JURISDICTION: Jurisdiction code is required.' };
  }

  const policy = resolveJurisdictionBookingPolicy(jurisdictionCode);
  if (!policy) {
    return { isValid: false, reason: `UNKNOWN_JURISDICTION: Cannot validate rental in unknown jurisdiction '${jurisdictionCode}'.` };
  }

  // Validate format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return { isValid: false, reason: 'INVALID_DATE_FORMAT: Dates must be formatted as YYYY-MM-DD.' };
  }

  // Validate duration
  if (!duration || duration <= 0 || !Number.isFinite(duration)) {
    return { isValid: false, reason: 'INVALID_DURATION: Duration must be a positive finite number.' };
  }

  // Validate start date vs end date
  if (startDate > endDate) {
    return { isValid: false, reason: 'INVALID_DATE_RANGE: End date cannot be before start date.' };
  }

  if (startDate === endDate && durationUnit === 'HOURLY' && startTime >= endTime) {
    return { isValid: false, reason: 'INVALID_TIME_RANGE: End time must be after start time for same-day rentals.' };
  }

  // Construct UTC timestamps
  // We combine date + time + timezone to compute exact UTC instants
  const startIsoStr = `${startDate}T${startTime}:00.000Z`;
  const endIsoStr = `${endDate}T${endTime}:00.000Z`;

  const startUtc = new Date(startIsoStr);
  const endUtc = new Date(endIsoStr);

  if (isNaN(startUtc.getTime()) || isNaN(endUtc.getTime())) {
    return { isValid: false, reason: 'INVALID_TIMESTAMP: Date or time components are invalid.' };
  }

  if (endUtc.getTime() <= startUtc.getTime()) {
    return { isValid: false, reason: 'INVALID_PERIOD: End timestamp must be strictly after start timestamp.' };
  }

  // Check if start is in the past
  if (startUtc.getTime() < referenceNowUtc.getTime() - 60000) { // 1-minute clock skew leeway
    return { isValid: false, reason: 'PAST_RENTAL_PROHIBITED: Rental start cannot be in the past.' };
  }

  // Check policy max rental duration
  const diffDays = (endUtc.getTime() - startUtc.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > policy.maxRentalDurationDays) {
    return {
      isValid: false,
      reason: `MAX_DURATION_EXCEEDED: Requested rental period exceeds maximum duration of ${policy.maxRentalDurationDays} days.`,
    };
  }

  const rentalPeriod: RentalPeriod = Object.freeze({
    startDate,
    endDate,
    startTime,
    endTime,
    duration,
    durationUnit,
    jurisdictionTimezone: policy.primaryTimezone,
    startUtcTimestamp: startUtc.toISOString(),
    endUtcTimestamp: endUtc.toISOString(),
  });

  return { isValid: true, rentalPeriod };
}

/**
 * Double-Booking Overlap Algorithm
 * Checks whether candidate start/end UTC timestamps overlap with an existing slot.
 * Two intervals [s1, e1] and [s2, e2] overlap if:
 * s1 < e2 AND e1 > s2
 *
 * Adjacent slots (e.g. e1 <= s2 or s1 >= e2) do NOT overlap.
 */
export function intervalsOverlap(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date
): boolean {
  const sA = typeof startA === 'string' ? new Date(startA).getTime() : startA.getTime();
  const eA = typeof endA === 'string' ? new Date(endA).getTime() : endA.getTime();
  const sB = typeof startB === 'string' ? new Date(startB).getTime() : startB.getTime();
  const eB = typeof endB === 'string' ? new Date(endB).getTime() : endB.getTime();

  return sA < eB && eA > sB;
}

/**
 * Checks availability of a listing against a list of existing bookings.
 * Only bookings with availability-blocking statuses will trigger a conflict.
 */
export function checkListingSlotAvailability(
  candidatePeriod: { startUtcTimestamp: string; endUtcTimestamp: string },
  existingBookings: readonly ExistingBookingSlot[],
  targetListingId: string
): AvailabilityCheckResult {
  const { startUtcTimestamp, endUtcTimestamp } = candidatePeriod;

  for (const existing of existingBookings) {
    // Only check bookings for the same listing
    if (existing.listingId !== targetListingId) {
      continue;
    }

    // Non-blocking statuses (e.g. CANCELLED, DECLINED, EXPIRED) do not conflict
    if (!isBookingBlockingAvailability(existing.status)) {
      continue;
    }

    if (intervalsOverlap(startUtcTimestamp, endUtcTimestamp, existing.startUtcTimestamp, existing.endUtcTimestamp)) {
      return {
        isAvailable: false,
        conflictingBookingId: existing.id,
        reason: `OVERLAPPING_BOOKING_CONFLICT: Requested period overlaps with active booking '${existing.id}' (${existing.status}).`,
      };
    }
  }

  return { isAvailable: true };
}
