/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Booking Domain Service
 *
 * Implements the unified rental eligibility gate (consuming GM-1, GM-2, GM-3A, GM-4A),
 * server-authoritative booking creation, double-booking prevention, participant integrity,
 * immutable snapshots, and guarded state transitions.
 */

import { type GlobalListingRecord } from '@/lib/global-market/supply/contracts/listing-record';
import { type GlobalAccountContext } from '@/lib/global-market/account';
import {
  type BookingLifecycleState,
  canActorPerformTransition,
  type TransitionActor,
} from '../contracts/booking-lifecycle';
import {
  type GlobalBookingRecord,
  type BookingParticipants,
  type ListingSnapshot,
  type MoneySnapshot,
  type PricingUnit,
  type CancellationDetails,
} from '../contracts/booking-record';
import {
  type PayableBookingContext,
  type EligiblePayoutContext,
} from '../contracts/payment-handoff';
import { resolveJurisdictionBookingPolicy } from '../registry/jurisdiction-booking-registry';
import {
  validateAndBuildRentalPeriod,
  checkListingSlotAvailability,
  type ExistingBookingSlot,
  type RentalPeriodInput,
} from './availability-service';
import {
  calculateAuthoritativeRentalPrice,
  createAuthoritativeMoneySnapshot,
} from './booking-pricing-service';

export interface RentalEligibilityParams {
  readonly renter: {
    readonly userId: string;
    readonly role: string;
    readonly isKycVerified?: boolean;
    readonly kycStatus?: string;
  };
  readonly listing: GlobalListingRecord;
  readonly jurisdictionCode: string;
}

export interface EligibilityEvaluationResult {
  readonly eligible: boolean;
  readonly reason?: string;
}

/**
 * Universal Rental Eligibility Gate
 * Evaluates GM-1 capability, GM-2 account, GM-3A KYC, and GM-4A listing state.
 * Fails closed on any policy violation or unknown jurisdiction.
 */
export function evaluateRentalEligibilityGate(
  params: RentalEligibilityParams
): EligibilityEvaluationResult {
  const { renter, listing, jurisdictionCode } = params;

  if (!jurisdictionCode) {
    return { eligible: false, reason: 'MISSING_JURISDICTION: Jurisdiction is required.' };
  }

  // 1. Resolve Jurisdiction Booking Policy (GM-1 & GLCC integration)
  const policy = resolveJurisdictionBookingPolicy(jurisdictionCode);
  if (!policy) {
    return { eligible: false, reason: `UNKNOWN_JURISDICTION: Jurisdiction '${jurisdictionCode}' is not supported.` };
  }

  // 2. Listing Publication Gate (GM-4A integration)
  if (!listing) {
    return { eligible: false, reason: 'LISTING_NOT_FOUND: Target listing does not exist.' };
  }

  if (listing.status !== 'PUBLISHED') {
    return { eligible: false, reason: `LISTING_NOT_BOOKABLE: Listing is in '${listing.status}' state and not publicly bookable.` };
  }

  // 3. Self-Booking Protection
  if (renter.userId === listing.providerId) {
    return { eligible: false, reason: 'SELF_BOOKING_PROHIBITED: A provider cannot book their own listing.' };
  }

  // 4. Renter Role Check (GM-2 integration)
  const validRoles = ['Renter', 'RENTER', 'Individual Provider', 'INDIVIDUAL_PROVIDER', 'Business Provider', 'BUSINESS_PROVIDER', 'Super Admin', 'SUPER_ADMIN'];
  if (!validRoles.includes(renter.role)) {
    return { eligible: false, reason: `INVALID_ROLE: Role '${renter.role}' is not authorized to create rental bookings.` };
  }

  // 5. Renter KYC Gate (GM-3A integration)
  if (policy.requiresRenterKyc) {
    const isVerified = renter.isKycVerified || renter.kycStatus === 'VERIFIED' || renter.kycStatus === 'APPROVED';
    if (!isVerified) {
      return { eligible: false, reason: 'RENTER_KYC_REQUIRED: Renter must complete KYC identity verification before booking in this jurisdiction.' };
    }
  }

  return { eligible: true };
}

export interface CreateBookingRequestInput {
  readonly renter: {
    readonly userId: string;
    readonly role: string;
    readonly isKycVerified?: boolean;
    readonly kycStatus?: string;
  };
  readonly listing: GlobalListingRecord;
  readonly period: {
    readonly startDate: string;
    readonly endDate: string;
    readonly startTime?: string;
    readonly endTime?: string;
    readonly duration: number;
    readonly durationUnit: PricingUnit;
  };
  readonly deliveryRequested?: boolean;
  readonly displayCurrencyPreference?: string;
  readonly idempotencyKey?: string;
}

/**
 * Creates a server-authoritative Global Booking Record.
 * Executes eligibility, availability, and pricing gates.
 */
export function createGlobalBookingRequest(
  input: CreateBookingRequestInput,
  existingBookings: readonly ExistingBookingSlot[] = [],
  referenceNowUtc: Date = new Date()
): GlobalBookingRecord {
  const { renter, listing, period, deliveryRequested, displayCurrencyPreference, idempotencyKey } = input;
  const jurisdictionCode = listing.countryCode || listing.location?.countryCode || listing.jurisdictionCode || 'PH';
  const currency = listing.pricing.listingCurrency || listing.pricing.currency || 'PHP';

  // 1. Run Universal Eligibility Gate
  const eligibility = evaluateRentalEligibilityGate({
    renter,
    listing,
    jurisdictionCode,
  });
  if (!eligibility.eligible) {
    throw new Error(`ELIGIBILITY_ERROR: ${eligibility.reason}`);
  }

  // 2. Validate and Build Rental Period with Timezone
  const periodValidation = validateAndBuildRentalPeriod(
    {
      startDate: period.startDate,
      endDate: period.endDate,
      startTime: period.startTime,
      endTime: period.endTime,
      duration: period.duration,
      durationUnit: period.durationUnit,
      jurisdictionCode,
    },
    referenceNowUtc
  );
  if (!periodValidation.isValid || !periodValidation.rentalPeriod) {
    throw new Error(`PERIOD_VALIDATION_ERROR: ${periodValidation.reason}`);
  }
  const rentalPeriod = periodValidation.rentalPeriod;

  // 3. Double-Booking Protection (Availability Check)
  const availability = checkListingSlotAvailability(
    {
      startUtcTimestamp: rentalPeriod.startUtcTimestamp,
      endUtcTimestamp: rentalPeriod.endUtcTimestamp,
    },
    existingBookings,
    listing.id
  );
  if (!availability.isAvailable) {
    throw new Error(`AVAILABILITY_ERROR: ${availability.reason}`);
  }

  // 4. Server-Authoritative Price Calculation
  const priceResult = calculateAuthoritativeRentalPrice(
    listing.pricing,
    rentalPeriod.duration,
    rentalPeriod.durationUnit,
    Boolean(deliveryRequested)
  );
  if (!priceResult.isValid) {
    throw new Error(`PRICING_ERROR: ${priceResult.reason}`);
  }

  // 5. Generate Immutable Snapshots
  const now = new Date().toISOString();
  const listingSnapshot: ListingSnapshot = Object.freeze({
    listingId: listing.id,
    providerId: listing.providerId,
    jurisdictionCode,
    title: listing.title,
    categorySlug: listing.categorySlug,
    pricingUnit: rentalPeriod.durationUnit,
    basePriceMinorUnits: priceResult.unitRateMinorUnits,
    currency,
    securityDepositMinorUnits: priceResult.securityDepositAmountMinorUnits,
    snapshotTimestamp: now,
    policyVersion: 'v2.0',
  });

  const moneySnapshot: MoneySnapshot = createAuthoritativeMoneySnapshot({
    listingPricing: listing.pricing,
    baseRentalAmountMinorUnits: priceResult.baseRentalAmountMinorUnits,
    securityDepositAmountMinorUnits: priceResult.securityDepositAmountMinorUnits,
    deliveryFeeMinorUnits: priceResult.deliveryFeeMinorUnits,
    platformFeeMinorUnits: priceResult.platformFeeMinorUnits,
    estimatedTotalAmountMinorUnits: priceResult.estimatedTotalAmountMinorUnits,
    displayCurrencyPreference,
  });

  const participants: BookingParticipants = Object.freeze({
    renterId: renter.userId,
    providerId: listing.providerId,
    listingId: listing.id,
    jurisdictionCode,
  });

  const bookingId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const bookingReference = `RENT-${jurisdictionCode}-${Date.now().toString().slice(-6)}`;

  return Object.freeze({
    id: bookingId,
    bookingReference,
    participants,
    listingSnapshot,
    moneySnapshot,
    rentalPeriod,
    status: 'REQUESTED',
    paymentStatus: 'NOT_REQUIRED_YET',
    createdAt: now,
    updatedAt: now,
    idempotencyKey,
  });
}

/**
 * Transitions a booking record through the guarded state machine.
 */
export function transitionBookingLifecycle(
  booking: GlobalBookingRecord,
  targetStatus: BookingLifecycleState,
  actor: TransitionActor,
  options?: {
    readonly paymentEvidence?: boolean;
    readonly reason?: string;
    readonly cancellationPolicyRef?: string;
  }
): GlobalBookingRecord {
  const actorCheck = canActorPerformTransition(
    actor,
    {
      renterId: booking.participants.renterId,
      providerId: booking.participants.providerId,
      currentStatus: booking.status,
      hasAuthoritativePayment: options?.paymentEvidence,
    },
    targetStatus
  );

  if (!actorCheck.allowed) {
    throw new Error(`TRANSITION_FORBIDDEN: ${actorCheck.reason}`);
  }

  const now = new Date().toISOString();
  let cancellationDetails: CancellationDetails | undefined = booking.cancellationDetails;
  if (targetStatus === 'CANCELLED') {
    cancellationDetails = Object.freeze({
      cancelledBy: actor.userId,
      cancelledAt: now,
      reason: options?.reason,
      policyReference: options?.cancellationPolicyRef || 'STANDARD-CANCELLATION-POLICY',
    });
  }

  // Update payment status conditionally based on lifecycle
  let nextPaymentStatus = booking.paymentStatus;
  if (targetStatus === 'AWAITING_PAYMENT') {
    nextPaymentStatus = 'PENDING';
  } else if (targetStatus === 'CONFIRMED' && options?.paymentEvidence) {
    nextPaymentStatus = 'AUTHORIZED';
  }

  return Object.freeze({
    ...booking,
    status: targetStatus,
    paymentStatus: nextPaymentStatus,
    cancellationDetails,
    updatedAt: now,
  });
}

/**
 * Creates the authoritative PayableBookingContext for GM-6A.
 * Exposes strictly what payment collection requires.
 */
export function createPayableBookingContext(
  booking: GlobalBookingRecord
): PayableBookingContext {
  return Object.freeze({
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    payerId: booking.participants.renterId,
    payeeProviderId: booking.participants.providerId,
    jurisdictionCode: booking.participants.jurisdictionCode,
    authoritativeAmountMinorUnits: booking.moneySnapshot.estimatedTotalAmountMinorUnits,
    depositAmountMinorUnits: booking.moneySnapshot.securityDepositAmountMinorUnits,
    deliveryFeeMinorUnits: booking.moneySnapshot.deliveryFeeMinorUnits,
    sourceListingCurrency: booking.moneySnapshot.listingPriceCurrency,
    requiredTransactionCurrency: booking.moneySnapshot.transactionCurrencyRequired,
    paymentStateRequirement: 'FULL_PREPAYMENT',
    idempotencyReference: `pay_ref_${booking.id}`,
    paymentStatus: booking.paymentStatus,
  });
}

/**
 * Creates the EligiblePayoutContext for GM-6A provider payout settlement.
 */
export function createEligiblePayoutContext(
  booking: GlobalBookingRecord
): EligiblePayoutContext {
  return Object.freeze({
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    providerId: booking.participants.providerId,
    jurisdictionCode: booking.participants.jurisdictionCode,
    eligibleSettlementTrigger: 'BOOKING_COMPLETED',
    payoutAmountMinorUnits: booking.moneySnapshot.baseRentalAmountMinorUnits,
    settlementCurrency: booking.moneySnapshot.settlementCurrencyRequired,
    amountAuthorityReference: `payout_auth_${booking.id}`,
    isSettled: false,
  });
}
