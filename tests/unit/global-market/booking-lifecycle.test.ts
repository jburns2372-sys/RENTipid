/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-5A Booking Lifecycle & Communications Unit Tests
 */

import {
  ALL_BOOKING_LIFECYCLE_STATES,
  canTransitionBookingStatus,
  canActorPerformTransition,
  isBookingBlockingAvailability,
  isTerminalBookingStatus,
  resolveJurisdictionBookingPolicy,
  getAllAuthoritativeBookingPolicies,
  getJurisdictionPrimaryTimezone,
  validateAndBuildRentalPeriod,
  intervalsOverlap,
  checkListingSlotAvailability,
  calculateAuthoritativeRentalPrice,
  createAuthoritativeMoneySnapshot,
  evaluateRentalEligibilityGate,
  createGlobalBookingRequest,
  transitionBookingLifecycle,
  createPayableBookingContext,
  createEligiblePayoutContext,
  resolveJurisdictionNotificationProfile,
  getAllAuthoritativeNotificationProfiles,
  createMarketplaceConversation,
  createBookingLinkedConversation,
  validateConversationAccess,
  createMarketplaceMessage,
  sanitizeMessageContent,
  buildNotificationIntent,
  dispatchNotificationIntent,
  type GlobalListingRecord,
  type ExistingBookingSlot,
} from '@/lib/global-market';

describe('GM-5A Global Booking & Communications Engine', () => {
  // Mock listing fixture
  const samplePublishedListing: GlobalListingRecord = Object.freeze({
    id: 'listing_camera_123',
    providerId: 'provider_user_456',
    countryCode: 'PH',
    jurisdictionCode: 'JUR-PH',
    categoryId: 'cat_electronics',
    categorySlug: 'cameras',
    title: 'Sony Alpha A7 IV Camera',
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    photos: ['photo1.jpg'],
    photosCount: 1,
    location: {
      countryCode: 'PH',
      jurisdictionCode: 'JUR-PH',
      formattedAddress: 'Makati, Metro Manila, Philippines',
      city: 'Makati',
      region: 'NCR',
      coordinates: { latitude: 14.5547, longitude: 121.0244 },
      privacyRadiusMeters: 500,
    },
    pricing: {
      currency: 'PHP',
      rates: {
        daily: { amountMinorUnits: 150000, currency: 'PHP' }, // 1,500.00 PHP / day
        hourly: { amountMinorUnits: 25000, currency: 'PHP' }, // 250.00 PHP / hour
        weekly: { amountMinorUnits: 900000, currency: 'PHP' }, // 9,000.00 PHP / week
      },
      securityDeposit: { amountMinorUnits: 500000, currency: 'PHP' }, // 5,000.00 PHP
      deliveryFee: { amountMinorUnits: 20000, currency: 'PHP' }, // 200.00 PHP
    },
  });

  describe('1. 46-Country Booking Policy & Notification Profile Resolution', () => {
    it('resolves authoritative booking policies for exactly 46 countries', () => {
      const policies = getAllAuthoritativeBookingPolicies();
      expect(policies).toHaveLength(46);

      const codes = new Set(policies.map((p) => p.jurisdictionCode));
      expect(codes.size).toBe(46);
    });

    it('resolves authoritative notification profiles for exactly 46 countries', () => {
      const profiles = getAllAuthoritativeNotificationProfiles();
      expect(profiles).toHaveLength(46);

      const codes = new Set(profiles.map((p) => p.jurisdictionCode));
      expect(codes.size).toBe(46);
    });

    it('fails closed on unknown or invalid country codes', () => {
      expect(resolveJurisdictionBookingPolicy('XX')).toBeNull();
      expect(resolveJurisdictionBookingPolicy('')).toBeNull();
      expect(resolveJurisdictionBookingPolicy(undefined)).toBeNull();

      expect(resolveJurisdictionNotificationProfile('ZZ')).toBeNull();
      expect(resolveJurisdictionNotificationProfile(null)).toBeNull();
    });

    it('resolves canonical timezones for key representative markets', () => {
      expect(getJurisdictionPrimaryTimezone('PH')).toBe('Asia/Manila');
      expect(getJurisdictionPrimaryTimezone('JP')).toBe('Asia/Tokyo');
      expect(getJurisdictionPrimaryTimezone('TH')).toBe('Asia/Bangkok');
      expect(getJurisdictionPrimaryTimezone('CN')).toBe('Asia/Shanghai');
      expect(getJurisdictionPrimaryTimezone('US')).toBe('America/New_York');
      expect(getJurisdictionPrimaryTimezone('DE')).toBe('Europe/Berlin');
      expect(getJurisdictionPrimaryTimezone('SG')).toBe('Asia/Singapore');
    });
  });

  describe('2. Booking Lifecycle State Machine', () => {
    it('verifies all 15 typed lifecycle states exist', () => {
      expect(ALL_BOOKING_LIFECYCLE_STATES).toHaveLength(16); // includes DRAFT & INITIATED alias
      expect(ALL_BOOKING_LIFECYCLE_STATES).toContain('REQUESTED');
      expect(ALL_BOOKING_LIFECYCLE_STATES).toContain('ACCEPTED');
      expect(ALL_BOOKING_LIFECYCLE_STATES).toContain('CONFIRMED');
      expect(ALL_BOOKING_LIFECYCLE_STATES).toContain('ACTIVE');
      expect(ALL_BOOKING_LIFECYCLE_STATES).toContain('COMPLETED');
    });

    it('permits valid linear lifecycle transitions', () => {
      expect(canTransitionBookingStatus('REQUESTED', 'ACCEPTED')).toBe(true);
      expect(canTransitionBookingStatus('ACCEPTED', 'AWAITING_PAYMENT')).toBe(true);
      expect(canTransitionBookingStatus('AWAITING_PAYMENT', 'CONFIRMED')).toBe(true);
      expect(canTransitionBookingStatus('CONFIRMED', 'READY_FOR_HANDOVER')).toBe(true);
      expect(canTransitionBookingStatus('READY_FOR_HANDOVER', 'ACTIVE')).toBe(true);
      expect(canTransitionBookingStatus('ACTIVE', 'RETURN_PENDING')).toBe(true);
      expect(canTransitionBookingStatus('RETURN_PENDING', 'COMPLETED')).toBe(true);
    });

    it('rejects illegal lifecycle transitions', () => {
      expect(canTransitionBookingStatus('REQUESTED', 'COMPLETED')).toBe(false);
      expect(canTransitionBookingStatus('DRAFT', 'ACTIVE')).toBe(false);
      expect(canTransitionBookingStatus('CANCELLED', 'CONFIRMED')).toBe(false);
      expect(canTransitionBookingStatus('COMPLETED', 'REQUESTED')).toBe(false);
      expect(canTransitionBookingStatus('DECLINED', 'ACCEPTED')).toBe(false);
    });

    it('recognizes availability-blocking statuses and terminal statuses', () => {
      expect(isBookingBlockingAvailability('REQUESTED')).toBe(true);
      expect(isBookingBlockingAvailability('CONFIRMED')).toBe(true);
      expect(isBookingBlockingAvailability('ACTIVE')).toBe(true);
      expect(isBookingBlockingAvailability('CANCELLED')).toBe(false);
      expect(isBookingBlockingAvailability('DECLINED')).toBe(false);

      expect(isTerminalBookingStatus('CANCELLED')).toBe(true);
      expect(isTerminalBookingStatus('DECLINED')).toBe(true);
      expect(isTerminalBookingStatus('ACTIVE')).toBe(false);
    });
  });

  describe('3. Availability Engine & Double-Booking Protection', () => {
    it('validates date format, start before end, and duration constraints', () => {
      const valid = validateAndBuildRentalPeriod({
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        duration: 4,
        durationUnit: 'DAILY',
        jurisdictionCode: 'PH',
      });
      expect(valid.isValid).toBe(true);
      expect(valid.rentalPeriod?.startUtcTimestamp).toBe('2026-11-01T09:00:00.000Z');
      expect(valid.rentalPeriod?.endUtcTimestamp).toBe('2026-11-05T18:00:00.000Z');

      const invalidRange = validateAndBuildRentalPeriod({
        startDate: '2026-11-05',
        endDate: '2026-11-01',
        duration: 4,
        durationUnit: 'DAILY',
        jurisdictionCode: 'PH',
      });
      expect(invalidRange.isValid).toBe(false);
      expect(invalidRange.reason).toContain('INVALID_DATE_RANGE');

      const pastRental = validateAndBuildRentalPeriod(
        {
          startDate: '2020-01-01',
          endDate: '2020-01-05',
          duration: 4,
          durationUnit: 'DAILY',
          jurisdictionCode: 'PH',
        },
        new Date('2026-10-01T00:00:00.000Z')
      );
      expect(pastRental.isValid).toBe(false);
      expect(pastRental.reason).toContain('PAST_RENTAL_PROHIBITED');
    });

    it('detects interval overlap scenarios mathematically', () => {
      // Slot 1: Nov 10 to Nov 15
      const s1 = '2026-11-10T09:00:00.000Z';
      const e1 = '2026-11-15T18:00:00.000Z';

      // Exact overlap
      expect(intervalsOverlap(s1, e1, s1, e1)).toBe(true);

      // Enclosing overlap (candidate encloses existing)
      expect(intervalsOverlap('2026-11-08T09:00:00.000Z', '2026-11-18T18:00:00.000Z', s1, e1)).toBe(true);

      // Partial start overlap (candidate starts during existing)
      expect(intervalsOverlap('2026-11-12T09:00:00.000Z', '2026-11-17T18:00:00.000Z', s1, e1)).toBe(true);

      // Partial end overlap (candidate ends during existing)
      expect(intervalsOverlap('2026-11-05T09:00:00.000Z', '2026-11-12T18:00:00.000Z', s1, e1)).toBe(true);

      // Adjacent non-overlap (strictly finishes before existing starts)
      expect(intervalsOverlap('2026-11-01T09:00:00.000Z', '2026-11-10T09:00:00.000Z', s1, e1)).toBe(false);

      // Adjacent non-overlap (strictly starts when existing finishes)
      expect(intervalsOverlap('2026-11-15T18:00:00.000Z', '2026-11-20T18:00:00.000Z', s1, e1)).toBe(false);
    });

    it('protects listing from double-booking against existing active bookings', () => {
      const existing: ExistingBookingSlot[] = [
        {
          id: 'existing_book_1',
          listingId: 'listing_camera_123',
          startUtcTimestamp: '2026-11-10T09:00:00.000Z',
          endUtcTimestamp: '2026-11-15T18:00:00.000Z',
          status: 'CONFIRMED',
        },
        {
          id: 'existing_book_cancelled',
          listingId: 'listing_camera_123',
          startUtcTimestamp: '2026-11-20T09:00:00.000Z',
          endUtcTimestamp: '2026-11-25T18:00:00.000Z',
          status: 'CANCELLED', // Cancelled booking should NOT block availability
        },
      ];

      // Overlapping attempt
      const overlapCheck = checkListingSlotAvailability(
        {
          startUtcTimestamp: '2026-11-12T09:00:00.000Z',
          endUtcTimestamp: '2026-11-16T18:00:00.000Z',
        },
        existing,
        'listing_camera_123'
      );
      expect(overlapCheck.isAvailable).toBe(false);
      expect(overlapCheck.conflictingBookingId).toBe('existing_book_1');

      // Attempt overlapping cancelled slot (should be available!)
      const cancelledSlotCheck = checkListingSlotAvailability(
        {
          startUtcTimestamp: '2026-11-21T09:00:00.000Z',
          endUtcTimestamp: '2026-11-24T18:00:00.000Z',
        },
        existing,
        'listing_camera_123'
      );
      expect(cancelledSlotCheck.isAvailable).toBe(true);

      // Attempt for a different listing (should not conflict)
      const diffListingCheck = checkListingSlotAvailability(
        {
          startUtcTimestamp: '2026-11-12T09:00:00.000Z',
          endUtcTimestamp: '2026-11-16T18:00:00.000Z',
        },
        existing,
        'listing_different_999'
      );
      expect(diffListingCheck.isAvailable).toBe(true);
    });
  });

  describe('4. Server-Authoritative Pricing & Money Snapshot', () => {
    it('calculates deterministic prices without client tampering', () => {
      // 3 days at 1500 PHP/day = 4500 PHP (450,000 minor units) + 500,000 deposit = 950,000
      const priceResult = calculateAuthoritativeRentalPrice(
        samplePublishedListing.pricing,
        3,
        'DAILY',
        false
      );
      expect(priceResult.isValid).toBe(true);
      expect(priceResult.baseRentalAmountMinorUnits).toBe(450000);
      expect(priceResult.securityDepositAmountMinorUnits).toBe(500000);
      expect(priceResult.deliveryFeeMinorUnits).toBe(0);
      expect(priceResult.estimatedTotalAmountMinorUnits).toBe(950000);
    });

    it('includes delivery fee when requested', () => {
      const priceWithDelivery = calculateAuthoritativeRentalPrice(
        samplePublishedListing.pricing,
        2,
        'DAILY',
        true
      );
      expect(priceWithDelivery.isValid).toBe(true);
      expect(priceWithDelivery.deliveryFeeMinorUnits).toBe(20000); // 200 PHP
      expect(priceWithDelivery.estimatedTotalAmountMinorUnits).toBe(300000 + 500000 + 20000);
    });

    it('creates immutable multi-currency snapshot preserving GM-4A money rules', () => {
      const snapshot = createAuthoritativeMoneySnapshot({
        listingPricing: samplePublishedListing.pricing,
        baseRentalAmountMinorUnits: 450000,
        securityDepositAmountMinorUnits: 500000,
        deliveryFeeMinorUnits: 0,
        platformFeeMinorUnits: 0,
        estimatedTotalAmountMinorUnits: 950000,
        displayCurrencyPreference: 'USD',
      });

      expect(snapshot.listingPriceCurrency).toBe('PHP');
      expect(snapshot.bookingPriceCurrency).toBe('PHP');
      expect(snapshot.displayCurrency).toBe('USD');
      expect(snapshot.transactionCurrencyRequired).toBe('PHP');
      expect(snapshot.settlementCurrencyRequired).toBe('PHP');
      expect(snapshot.isFxGuaranteed).toBe(false); // No fake FX
    });
  });

  describe('5. Universal Rental Eligibility Gate & Anti-Tampering', () => {
    it('prohibits providers from renting their own listings', () => {
      const eligibility = evaluateRentalEligibilityGate({
        renter: {
          userId: 'provider_user_456', // Same as listing provider
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        jurisdictionCode: 'PH',
      });
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('SELF_BOOKING_PROHIBITED');
    });

    it('blocks unverified renters when KYC is required by jurisdiction', () => {
      const eligibility = evaluateRentalEligibilityGate({
        renter: {
          userId: 'renter_unverified_789',
          role: 'Renter',
          isKycVerified: false,
          kycStatus: 'PENDING',
        },
        listing: samplePublishedListing,
        jurisdictionCode: 'PH',
      });
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('RENTER_KYC_REQUIRED');
    });

    it('blocks booking for unpublished or paused listings', () => {
      const draftListing: GlobalListingRecord = {
        ...samplePublishedListing,
        status: 'DRAFT',
      };

      const eligibility = evaluateRentalEligibilityGate({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: draftListing,
        jurisdictionCode: 'PH',
      });
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('LISTING_NOT_BOOKABLE');
    });

    it('fails closed when attempting booking in unknown jurisdiction', () => {
      const eligibility = evaluateRentalEligibilityGate({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        jurisdictionCode: 'UNKNOWN_COUNTRY',
      });
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('UNKNOWN_JURISDICTION');
    });
  });

  describe('6. Booking Creation, Snapshots, and Lifecycle Transitions', () => {
    it('creates server-authoritative booking with immutable snapshots', () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-01',
          endDate: '2026-12-04',
          duration: 3,
          durationUnit: 'DAILY',
        },
        displayCurrencyPreference: 'PHP',
      });

      expect(booking.id).toMatch(/^book_/);
      expect(booking.status).toBe('REQUESTED');
      expect(booking.paymentStatus).toBe('NOT_REQUIRED_YET');
      expect(booking.participants.renterId).toBe('renter_verified_111');
      expect(booking.participants.providerId).toBe('provider_user_456');
      expect(booking.listingSnapshot.listingId).toBe(samplePublishedListing.id);
      expect(booking.moneySnapshot.baseRentalAmountMinorUnits).toBe(450000);
      expect(booking.moneySnapshot.estimatedTotalAmountMinorUnits).toBe(950000);
    });

    it('allows provider to accept booking request', () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      const accepted = transitionBookingLifecycle(
        booking,
        'ACCEPTED',
        { userId: 'provider_user_456', role: 'Individual Provider' }
      );
      expect(accepted.status).toBe('ACCEPTED');
    });

    it('blocks renter from accepting own booking request', () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-15',
          endDate: '2026-12-17',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      expect(() =>
        transitionBookingLifecycle(
          booking,
          'ACCEPTED',
          { userId: 'renter_verified_111', role: 'Renter' }
        )
      ).toThrow(/RENTER_FORBIDDEN/);
    });

    it('requires payment evidence before transitioning from AWAITING_PAYMENT to CONFIRMED', () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-20',
          endDate: '2026-12-22',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      const accepted = transitionBookingLifecycle(booking, 'ACCEPTED', {
        userId: 'provider_user_456',
        role: 'Individual Provider',
      });

      const awaitingPayment = transitionBookingLifecycle(
        accepted,
        'AWAITING_PAYMENT',
        { userId: 'SYSTEM', role: 'System' }
      );

      // Attempting to confirm without authoritative payment evidence must FAIL
      expect(() =>
        transitionBookingLifecycle(
          awaitingPayment,
          'CONFIRMED',
          { userId: 'SYSTEM', role: 'System' },
          { paymentEvidence: false }
        )
      ).toThrow(/PAYMENT_EVIDENCE_REQUIRED/);

      // With authoritative payment evidence -> SUCCESS
      const confirmed = transitionBookingLifecycle(
        awaitingPayment,
        'CONFIRMED',
        { userId: 'SYSTEM', role: 'System' },
        { paymentEvidence: true }
      );
      expect(confirmed.status).toBe('CONFIRMED');
      expect(confirmed.paymentStatus).toBe('AUTHORIZED');
    });

    it('records cancellation hooks with actor and reason without executing refunds', () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-25',
          endDate: '2026-12-27',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      const cancelled = transitionBookingLifecycle(
        booking,
        'CANCELLED',
        { userId: 'renter_verified_111', role: 'Renter' },
        { reason: 'Change of schedule', cancellationPolicyRef: 'CP-PH-STANDARD' }
      );

      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.cancellationDetails?.cancelledBy).toBe('renter_verified_111');
      expect(cancelled.cancellationDetails?.reason).toBe('Change of schedule');
      expect(cancelled.cancellationDetails?.policyReference).toBe('CP-PH-STANDARD');
    });
  });

  describe('7. Payment & Payout Handoff Contracts', () => {
    it('generates PayableBookingContext for GM-6A without moving money', () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      const payableCtx = createPayableBookingContext(booking);
      expect(payableCtx.bookingId).toBe(booking.id);
      expect(payableCtx.payerId).toBe('renter_verified_111');
      expect(payableCtx.payeeProviderId).toBe('provider_user_456');
      expect(payableCtx.authoritativeAmountMinorUnits).toBe(booking.moneySnapshot.estimatedTotalAmountMinorUnits);
      expect(payableCtx.requiredTransactionCurrency).toBe('PHP');
      expect(payableCtx.paymentStateRequirement).toBe('FULL_PREPAYMENT');
    });

    it('generates EligiblePayoutContext for GM-6A without executing payout', () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      const payoutCtx = createEligiblePayoutContext(booking);
      expect(payoutCtx.bookingId).toBe(booking.id);
      expect(payoutCtx.providerId).toBe('provider_user_456');
      expect(payoutCtx.payoutAmountMinorUnits).toBe(booking.moneySnapshot.baseRentalAmountMinorUnits);
      expect(payoutCtx.isSettled).toBe(false); // Invariant: Not paid out yet!
    });
  });

  describe('8. Global Conversation & Messaging Security', () => {
    it('creates booking-linked conversation bound strictly to participants', () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      const conv = createBookingLinkedConversation(booking);
      expect(conv.contextType).toBe('BOOKING');
      expect(conv.contextId).toBe(booking.id);
      expect(conv.participants).toEqual(['renter_verified_111', 'provider_user_456']);

      // Access checks
      expect(validateConversationAccess(conv, 'renter_verified_111').allowed).toBe(true);
      expect(validateConversationAccess(conv, 'provider_user_456').allowed).toBe(true);
      expect(validateConversationAccess(conv, 'unrelated_attacker_999').allowed).toBe(false);
      expect(validateConversationAccess(conv, 'admin_user', 'Super Admin').allowed).toBe(true);
    });

    it('prohibits ordinary users from forging system events', () => {
      const conv = createMarketplaceConversation(
        'LISTING_INQUIRY',
        'listing_camera_123',
        ['renter_verified_111', 'provider_user_456'],
        'PH'
      );

      // Ordinary renter attempting to forge a system event
      expect(() =>
        createMarketplaceMessage({
          conversation: conv,
          senderId: 'renter_verified_111',
          senderRole: 'Renter',
          messageType: 'SYSTEM_EVENT',
          content: 'Booking confirmed without payment!',
        })
      ).toThrow(/FORGERY_VIOLATION/);

      // System role allowed
      const systemMsg = createMarketplaceMessage({
        conversation: conv,
        senderId: 'SYSTEM',
        senderRole: 'System',
        messageType: 'SYSTEM_EVENT',
        content: 'Booking request sent to provider.',
      });
      expect(systemMsg.messageType).toBe('SYSTEM_EVENT');
    });

    it('sanitizes message content to redact credit card patterns', () => {
      const raw = 'Please pay to 4111 2222 3333 4444 with cvv: 123';
      const clean = sanitizeMessageContent(raw);
      expect(clean).toContain('[REDACTED_PAYMENT_CARD]');
      expect(clean).toContain('cvv: [REDACTED]');
      expect(clean).not.toContain('4111 2222 3333 4444');
    });
  });

  describe('9. Global Notification Core & Delivery Isolation', () => {
    it('builds localized notification intents matching recipient locale', () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      // Thai recipient
      const thaiIntent = buildNotificationIntent({
        eventCode: 'BOOKING_REQUESTED',
        recipientId: 'provider_th_user',
        recipientLocale: 'th-TH',
        jurisdictionCode: 'TH',
        booking,
      });
      expect(thaiIntent.payload.title).toBe('คำขอจองใหม่');
      expect(thaiIntent.channels).toContain('IN_APP');

      // Tagalog recipient
      const filIntent = buildNotificationIntent({
        eventCode: 'BOOKING_ACCEPTED',
        recipientId: 'renter_ph_user',
        recipientLocale: 'fil-PH',
        jurisdictionCode: 'PH',
        booking,
      });
      expect(filIntent.payload.title).toBe('Tinanggap ang Pag-arkila');

      // German recipient
      const deIntent = buildNotificationIntent({
        eventCode: 'BOOKING_CONFIRMED',
        recipientId: 'renter_de_user',
        recipientLocale: 'de-DE',
        jurisdictionCode: 'DE',
        booking,
      });
      expect(deIntent.payload.title).toBe('Buchung bestätigt');
    });

    it('isolates external delivery failures without corrupting booking state', async () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      const intent = buildNotificationIntent({
        eventCode: 'BOOKING_REQUESTED',
        recipientId: 'provider_user_456',
        jurisdictionCode: 'PH',
        booking,
        idempotencyKey: `test_idemp_failure_${Date.now()}`,
      });

      // Provider throws network exception
      const faultyAdapter = async () => {
        throw new Error('SMTP_SERVER_UNREACHABLE');
      };

      // Dispatching must NOT throw to the caller!
      const result = await dispatchNotificationIntent(intent, faultyAdapter);
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('SMTP_SERVER_UNREACHABLE');
      // Booking state remains pristine
      expect(booking.status).toBe('REQUESTED');
    });

    it('skips duplicate notification intents with the same idempotency key', async () => {
      const booking = createGlobalBookingRequest({
        renter: {
          userId: 'renter_verified_111',
          role: 'Renter',
          isKycVerified: true,
        },
        listing: samplePublishedListing,
        period: {
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          duration: 2,
          durationUnit: 'DAILY',
        },
      });

      const key = `test_idemp_duplicate_${Date.now()}`;
      const intent = buildNotificationIntent({
        eventCode: 'BOOKING_CONFIRMED',
        recipientId: 'renter_verified_111',
        jurisdictionCode: 'PH',
        booking,
        idempotencyKey: key,
      });

      const workingAdapter = async () => true;

      const firstSend = await dispatchNotificationIntent(intent, workingAdapter);
      expect(firstSend.status).toBe('SENT');

      // Duplicate send attempt with same key
      const secondSend = await dispatchNotificationIntent(intent, workingAdapter);
      expect(secondSend.status).toBe('SKIPPED_DUPLICATE');
    });
  });

  describe('10. Representative 7-Country Architecture Matrix', () => {
    const representativeMarkets = ['PH', 'TH', 'CN', 'SG', 'JP', 'US', 'DE'];

    representativeMarkets.forEach((code) => {
      it(`resolves architectural booking policy, notification profile, and timezone for ${code}`, () => {
        const policy = resolveJurisdictionBookingPolicy(code);
        expect(policy).not.toBeNull();
        expect(policy?.jurisdictionCode).toBe(code);
        expect(policy?.primaryTimezone).toBeTruthy();

        const notifProfile = resolveJurisdictionNotificationProfile(code);
        expect(notifProfile).not.toBeNull();
        expect(notifProfile?.jurisdictionCode).toBe(code);
        expect(notifProfile?.supportedChannels).toContain('IN_APP');
      });
    });
  });
});
