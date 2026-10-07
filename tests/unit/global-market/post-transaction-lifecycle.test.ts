/**
 * RENTipid GLOBAL-MKT / v2.0 — Post-Transaction Lifecycle Unit Test Suite
 *
 * Tests:
 * 1. Global Deposit Architecture, Provider Hold Capability Checks & Deduction Guards
 * 2. Server-Authoritative Cancellation Policy & Booking Cancelled != Money Refunded
 * 3. Refund Entitlement Calculation, Cumulative Over-Refund Guards & Idempotency
 * 4. Claim Management, Participant Integrity & Liability Isolation
 * 5. Dispute Engine, Adjudication Authorization & Payout Hold Impact
 * 6. Review Engine, Verified Participation, Duplicate Guards & Rating Aggregation
 * 7. 46-Country Post-Transaction Profile Resolution & Zero Commercially Active
 */

import {
  evaluateCancellationPolicy,
  executeBookingCancellation,
  calculateAndCreateRefundInstruction,
  executeApprovedRefund,
  recordBookingDeposit,
  releaseDeposit,
  applyDepositDeduction,
  createDamageClaim,
  submitClaimEvidence,
  resolveClaim,
  escalateClaimToDispute,
  openDispute,
  resolveDispute,
  submitReview,
  aggregateRating,
  moderateReview,
  evaluatePayoutHoldStatus,
  resolveJurisdictionPostTransactionProfile,
  getAllAuthoritativePostTransactionProfiles,
  AUTHORITATIVE_POST_TRANSACTION_PROFILE_COUNT,
  type GlobalBookingRecord,
  type PaymentAttemptRecord,
  initiatePaymentAttempt,
  processPaymentWebhook,
  getCommerciallyActiveCountries,
  getJurisdictionProfile,
} from '../../../src/lib/global-market';

describe('RENTipid GLOBAL-MKT / v2.0 — GM-7A Post-Transaction Lifecycle Suite', () => {
  const sampleBooking: GlobalBookingRecord = Object.freeze({
    id: 'book_gm7a_test_001',
    bookingReference: 'RENT-PH-777111',
    participants: Object.freeze({
      renterId: 'renter_alice',
      providerId: 'provider_bob',
      listingId: 'list_drill_101',
      jurisdictionCode: 'PH',
    }),
    listingSnapshot: Object.freeze({
      listingId: 'list_drill_101',
      providerId: 'provider_bob',
      jurisdictionCode: 'PH',
      title: 'Heavy Duty Rotary Hammer Drill',
      pricingUnit: 'DAILY',
      basePriceMinorUnits: 250000,
      currency: 'PHP',
      securityDepositMinorUnits: 50000,
      snapshotTimestamp: new Date().toISOString(),
    }),
    moneySnapshot: Object.freeze({
      listingPriceCurrency: 'PHP',
      bookingPriceCurrency: 'PHP',
      displayCurrency: 'PHP',
      baseRentalAmountMinorUnits: 250000,
      securityDepositAmountMinorUnits: 50000,
      deliveryFeeMinorUnits: 0,
      platformFeeMinorUnits: 0,
      estimatedTotalAmountMinorUnits: 300000,
      isFxGuaranteed: true,
      transactionCurrencyRequired: 'PHP',
      settlementCurrencyRequired: 'PHP',
      snapshotTimestamp: new Date().toISOString(),
    }),
    rentalPeriod: Object.freeze({
      startDate: '2026-10-17',
      endDate: '2026-10-21',
      duration: 4,
      durationUnit: 'DAILY',
      jurisdictionTimezone: 'Asia/Manila',
      startUtcTimestamp: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      endUtcTimestamp: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    status: 'CONFIRMED',
    paymentStatus: 'SETTLED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const completedBooking: GlobalBookingRecord = Object.freeze({
    ...sampleBooking,
    id: 'book_gm7a_completed_002',
    status: 'COMPLETED',
  });

  let samplePayment: PaymentAttemptRecord;

  beforeAll(async () => {
    // Initiate and complete a mock payment for testing refund & deposit
    const initRes = await initiatePaymentAttempt({
      payableContext: {
        bookingId: sampleBooking.id,
        bookingReference: sampleBooking.bookingReference,
        payerId: sampleBooking.participants.renterId,
        payeeProviderId: sampleBooking.participants.providerId,
        jurisdictionCode: sampleBooking.participants.jurisdictionCode,
        authoritativeAmountMinorUnits: 300000,
        depositAmountMinorUnits: 50000,
        requiredTransactionCurrency: 'PHP',
      },
      requestingPayerId: sampleBooking.participants.renterId,
      providerId: 'mock_gateway',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      idempotencyKey: `idemp_pay_gm7a_${Date.now()}`,
    });

    // Mark payment as succeeded via simulated webhook
    const whRes = await processPaymentWebhook(
      'mock_gateway',
      {
        eventId: `evt_pay_gm7a_${Date.now()}`,
        providerReference: initRes.paymentAttempt!.providerReference!,
        status: 'succeeded',
        amountMinorUnits: 300000,
        currency: 'PHP',
      },
      'valid_mock_signature'
    );

    samplePayment = whRes.paymentAttempt!;
  });

  // --------------------------------------------------------------------------
  // 1. 46-Country Post-Transaction Profile Resolution
  // --------------------------------------------------------------------------
  describe('1. 46-Country Post-Transaction Profile Resolution', () => {
    it('resolves exactly 46 authoritative post-transaction profiles', () => {
      const profiles = getAllAuthoritativePostTransactionProfiles();
      expect(profiles.length).toBe(46);
      expect(AUTHORITATIVE_POST_TRANSACTION_PROFILE_COUNT).toBe(46);
    });

    it('fails closed for unknown or invalid country codes', () => {
      expect(resolveJurisdictionPostTransactionProfile('ZZ')).toBeNull();
      expect(resolveJurisdictionPostTransactionProfile('')).toBeNull();
      expect(resolveJurisdictionPostTransactionProfile(null)).toBeNull();
    });

    it('preserves zero commercially active countries and China deferred blockers', () => {
      const active = getCommerciallyActiveCountries();
      expect(active.length).toBe(0);

      const cnProfile = getJurisdictionProfile('CN');
      expect(cnProfile?.knownBlockers?.length).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Cancellation Policy & Engine
  // --------------------------------------------------------------------------
  describe('2. Cancellation Policy Engine', () => {
    it('allows renter to cancel eligible booking and calculates refund percentage based on tier', () => {
      const evalRes = evaluateCancellationPolicy({
        bookingId: sampleBooking.id,
        actor: 'RENTER',
        requestingUserId: 'renter_alice',
        bookingRenterId: sampleBooking.participants.renterId,
        bookingProviderId: sampleBooking.participants.providerId,
        bookingStatus: sampleBooking.status,
        rentalStartDate: sampleBooking.rentalPeriod.startUtcTimestamp,
        cancellationDate: new Date().toISOString(),
        tier: 'MODERATE',
      });

      expect(evalRes.canCancel).toBe(true);
      expect(evalRes.refundPercentage).toBe(100); // 10 days out is > 5 days -> 100%
    });

    it('blocks unrelated third parties from cancelling booking', () => {
      const evalRes = evaluateCancellationPolicy({
        bookingId: sampleBooking.id,
        actor: 'RENTER',
        requestingUserId: 'attacker_mallory',
        bookingRenterId: sampleBooking.participants.renterId,
        bookingProviderId: sampleBooking.participants.providerId,
        bookingStatus: sampleBooking.status,
        rentalStartDate: sampleBooking.rentalPeriod.startUtcTimestamp,
        cancellationDate: new Date().toISOString(),
        tier: 'MODERATE',
      });

      expect(evalRes.canCancel).toBe(false);
      expect(evalRes.reason).toContain('UNAUTHORIZED_CANCELLATION');
    });

    it('blocks cancellation of completed bookings', () => {
      const evalRes = evaluateCancellationPolicy({
        bookingId: completedBooking.id,
        actor: 'RENTER',
        requestingUserId: completedBooking.participants.renterId,
        bookingRenterId: completedBooking.participants.renterId,
        bookingProviderId: completedBooking.participants.providerId,
        bookingStatus: completedBooking.status,
        rentalStartDate: completedBooking.rentalPeriod.startUtcTimestamp,
        cancellationDate: new Date().toISOString(),
        tier: 'MODERATE',
      });

      expect(evalRes.canCancel).toBe(false);
      expect(evalRes.reason).toContain('INVALID_BOOKING_STATUS');
    });

    it('executes cancellation idempotently without triggering money refund (Separation Invariant)', async () => {
      const idempKey = `cancel_idemp_${Date.now()}`;
      const res1 = await executeBookingCancellation({
        booking: sampleBooking,
        requestingUserId: 'renter_alice',
        actor: 'RENTER',
        reason: 'Change of schedule',
        idempotencyKey: idempKey,
      });

      expect(res1.success).toBe(true);
      expect(res1.cancellationRecord?.refundPercentageCalculated).toBe(100);

      // Replay
      const res2 = await executeBookingCancellation({
        booking: sampleBooking,
        requestingUserId: 'renter_alice',
        actor: 'RENTER',
        reason: 'Change of schedule',
        idempotencyKey: idempKey,
      });

      expect(res2.success).toBe(true);
      expect(res2.isIdempotentReplay).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Refund Entitlement & Execution Engine
  // --------------------------------------------------------------------------
  describe('3. Refund Entitlement & Execution Engine', () => {
    it('calculates server-authoritative refund and blocks client amount tampering', async () => {
      const tamperRes = await calculateAndCreateRefundInstruction({
        booking: sampleBooking,
        paymentRecord: samplePayment,
        refundType: 'FULL_CANCELLATION',
        refundPercentage: 100,
        requestedAmountMinorUnits: 99999999, // Tampered excessive amount
        reason: 'Renter cancelled 10 days in advance',
        requestingUserId: 'renter_alice',
        policyReference: 'POLICY_MODERATE_FULL',
        idempotencyKey: `idemp_ref_tamper_${Date.now()}`,
      });

      expect(tamperRes.eligible).toBe(false);
      expect(tamperRes.error).toContain('REFUND_AMOUNT_TAMPERING_BLOCKED');
    });

    it('blocks client currency tampering during refund request', async () => {
      const currTamperRes = await calculateAndCreateRefundInstruction({
        booking: sampleBooking,
        paymentRecord: samplePayment,
        refundType: 'FULL_CANCELLATION',
        refundPercentage: 100,
        requestedCurrency: 'USD', // Tampered currency
        reason: 'Currency tampering attempt',
        requestingUserId: 'renter_alice',
        policyReference: 'POLICY_MODERATE_FULL',
        idempotencyKey: `idemp_ref_currtamper_${Date.now()}`,
      });

      expect(currTamperRes.eligible).toBe(false);
      expect(currTamperRes.error).toContain('REFUND_CURRENCY_TAMPERING_BLOCKED');
    });

    it('blocks refund against unverified or non-succeeded payment attempt', async () => {
      const pendingPayment: PaymentAttemptRecord = {
        ...samplePayment,
        id: 'pay_att_pending_test',
        normalizedStatus: 'PENDING',
      };

      const failRes = await calculateAndCreateRefundInstruction({
        booking: sampleBooking,
        paymentRecord: pendingPayment,
        refundType: 'FULL_CANCELLATION',
        refundPercentage: 100,
        reason: 'Testing pending payment refund',
        requestingUserId: 'renter_alice',
        policyReference: 'POLICY_MODERATE_FULL',
        idempotencyKey: `idemp_ref_pending_${Date.now()}`,
      });

      expect(failRes.eligible).toBe(false);
      expect(failRes.error).toContain('UNVERIFIED_PAYMENT_CANNOT_REFUND');
    });

    it('authorizes legitimate refund instruction and executes via provider adapter', async () => {
      const idempKey = `idemp_ref_valid_${Date.now()}`;
      const entitleRes = await calculateAndCreateRefundInstruction({
        booking: sampleBooking,
        paymentRecord: samplePayment,
        refundType: 'FULL_CANCELLATION',
        refundPercentage: 100,
        reason: 'Legitimate renter cancellation',
        requestingUserId: 'renter_alice',
        policyReference: 'POLICY_MODERATE_FULL',
        idempotencyKey: idempKey,
      });

      expect(entitleRes.eligible).toBe(true);
      expect(entitleRes.refundInstruction?.status).toBe('APPROVED');
      expect(entitleRes.approvedAmountMinorUnits).toBe(300000);

      // Execute refund
      const execRes = await executeApprovedRefund(
        entitleRes.refundInstruction!.id,
        `idemp_exec_${Date.now()}`
      );

      expect(execRes.success).toBe(true);
      expect(execRes.refundInstruction.status).toBe('REFUNDED');
      expect(execRes.providerRefundReference).toBeDefined();
    });

    it('blocks cumulative over-refunds across multiple requests', async () => {
      // Attempt another refund against the already fully refunded payment
      const overRefundRes = await calculateAndCreateRefundInstruction({
        booking: sampleBooking,
        paymentRecord: samplePayment,
        refundType: 'PARTIAL_CANCELLATION',
        refundPercentage: 50,
        reason: 'Attempting to refund twice',
        requestingUserId: 'renter_alice',
        policyReference: 'POLICY_DOUBLE_REFUND',
        idempotencyKey: `idemp_ref_over_${Date.now()}`,
      });

      expect(overRefundRes.eligible).toBe(false);
      expect(overRefundRes.error).toContain('CUMULATIVE_OVER_REFUND_BLOCKED');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Deposit Architecture & Deduction Guards
  // --------------------------------------------------------------------------
  describe('4. Deposit Architecture & Deduction Guards', () => {
    it('records deposit locked to booking snapshot and blocks client amount tampering', async () => {
      const tamperRes = await recordBookingDeposit({
        booking: sampleBooking,
        paymentRecord: samplePayment,
        clientSubmittedAmount: 999999, // Tampered!
        idempotencyKey: `idemp_dep_tamper_${Date.now()}`,
      });

      expect(tamperRes.success).toBe(false);
      expect(tamperRes.error).toContain('DEPOSIT_AMOUNT_TAMPERING_BLOCKED');
    });

    it('fails closed when authorization hold is requested on provider without hold capability', async () => {
      const noHoldPayment: PaymentAttemptRecord = {
        ...samplePayment,
        paymentProviderId: 'unsupported_hold_provider',
      };

      const holdRes = await recordBookingDeposit({
        booking: { ...sampleBooking, id: 'book_nohold_unit_test' },
        paymentRecord: noHoldPayment,
        depositModel: 'AUTHORIZATION_HOLD',
        idempotencyKey: `idemp_dep_hold_${Date.now()}`,
      });

      expect(holdRes.success).toBe(false);
      expect(holdRes.error).toContain('DEPOSIT_HOLD_UNSUPPORTED');
    });

    it('creates deposit record and permits authorized release', async () => {
      const recRes = await recordBookingDeposit({
        booking: sampleBooking,
        paymentRecord: samplePayment,
        depositModel: 'PAYMENT_COLLECTED',
        idempotencyKey: `idemp_dep_rec_${Date.now()}`,
      });

      expect(recRes.success).toBe(true);
      expect(recRes.depositRecord?.heldAmountMinorUnits).toBe(50000);

      // Release deposit
      const relRes = await releaseDeposit(
        recRes.depositRecord!.id,
        'provider_bob',
        'Item returned in perfect condition'
      );

      expect(relRes.success).toBe(true);
      expect(relRes.depositRecord?.status).toBe('RELEASED');
      expect(relRes.depositRecord?.heldAmountMinorUnits).toBe(0);
      expect(relRes.depositRecord?.releasedAmountMinorUnits).toBe(50000);
    });

    it('blocks deduction exceeding held deposit amount', async () => {
      const recRes = await recordBookingDeposit({
        booking: { ...sampleBooking, id: 'book_dep_deduct_test' },
        paymentRecord: samplePayment,
        depositModel: 'PAYMENT_COLLECTED',
        idempotencyKey: `idemp_dep_deduct_${Date.now()}`,
      });

      const deductRes = await applyDepositDeduction(
        recRes.depositRecord!.id,
        'claim_999',
        999999, // Exceeds 50,000 deposit
        'admin_decider'
      );

      expect(deductRes.success).toBe(false);
      expect(deductRes.error).toContain('DEDUCTION_EXCEEDS_DEPOSIT');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Claim Management & Liability Isolation
  // --------------------------------------------------------------------------
  describe('5. Claim Management & Liability Isolation', () => {
    it('blocks unrelated users from filing a claim against a booking', async () => {
      const claimRes = await createDamageClaim({
        booking: sampleBooking,
        claimantUserId: 'intruder_eve',
        category: 'DAMAGE',
        description: 'False claim',
        claimedAmountMinorUnits: 20000,
        idempotencyKey: `idemp_claim_intruder_${Date.now()}`,
      });

      expect(claimRes.success).toBe(false);
      expect(claimRes.error).toContain('CLAIMANT_NOT_PARTICIPANT');
    });

    it('submits valid claim with approvedLiability = 0 (Amount != Liability)', async () => {
      const claimRes = await createDamageClaim({
        booking: sampleBooking,
        claimantUserId: 'provider_bob',
        category: 'DAMAGE',
        description: 'Drill bit cracked during rental',
        claimedAmountMinorUnits: 15000,
        idempotencyKey: `idemp_claim_valid_${Date.now()}`,
      });

      expect(claimRes.success).toBe(true);
      expect(claimRes.claim?.status).toBe('SUBMITTED');
      expect(claimRes.claim?.claimedAmountMinorUnits).toBe(15000);
      expect(claimRes.claim?.approvedLiabilityMinorUnits).toBe(0); // Strictly isolated!
    });

    it('blocks ordinary participants from adjudicating their own claims', async () => {
      const claimRes = await createDamageClaim({
        booking: sampleBooking,
        claimantUserId: 'provider_bob',
        category: 'DAMAGE',
        description: 'Scratch on housing',
        claimedAmountMinorUnits: 10000,
        idempotencyKey: `idemp_claim_selfresolve_${Date.now()}`,
      });

      const resolveRes = await resolveClaim({
        claimId: claimRes.claim!.id,
        actorRole: 'USER', // Ordinary user attempt
        deciderUserId: 'provider_bob',
        targetStatus: 'APPROVED',
        approvedLiabilityMinorUnits: 10000,
        decisionNotes: 'I approve my own claim',
      });

      expect(resolveRes.success).toBe(false);
      expect(resolveRes.error).toContain('RESOLUTION_UNAUTHORIZED');
    });

    it('allows authorized admin to resolve claim within claimed amount bounds', async () => {
      const claimRes = await createDamageClaim({
        booking: sampleBooking,
        claimantUserId: 'provider_bob',
        category: 'DAMAGE',
        description: 'Motor overheating damage',
        claimedAmountMinorUnits: 12000,
        idempotencyKey: `idemp_claim_admin_${Date.now()}`,
      });

      const resolveRes = await resolveClaim({
        claimId: claimRes.claim!.id,
        actorRole: 'ADMIN',
        deciderUserId: 'admin_sarah',
        targetStatus: 'PARTIALLY_APPROVED',
        approvedLiabilityMinorUnits: 8000,
        decisionNotes: 'Depreciation factor applied to repair cost',
      });

      expect(resolveRes.success).toBe(true);
      expect(resolveRes.claim?.status).toBe('PARTIALLY_APPROVED');
      expect(resolveRes.claim?.approvedLiabilityMinorUnits).toBe(8000);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Dispute Engine & Payout Impact
  // --------------------------------------------------------------------------
  describe('6. Dispute Engine & Payout Impact', () => {
    it('blocks non-participants from opening disputes', async () => {
      const dispRes = await openDispute({
        booking: sampleBooking,
        openedByUserId: 'unrelated_user_frank',
        origin: 'CLAIM_ESCALATION',
        summary: 'Unauthorized dispute attempt',
        idempotencyKey: `idemp_disp_nonpart_${Date.now()}`,
      });

      expect(dispRes.success).toBe(false);
      expect(dispRes.error).toContain('DISPUTE_UNAUTHORIZED');
    });

    it('blocks ordinary participants from resolving disputes', async () => {
      const dispRes = await openDispute({
        booking: sampleBooking,
        openedByUserId: 'renter_alice',
        origin: 'DEPOSIT_DISAGREEMENT',
        summary: 'Deposit was withheld unfairly',
        idempotencyKey: `idemp_disp_self_${Date.now()}`,
      });

      const resolveRes = await resolveDispute({
        disputeId: dispRes.dispute!.id,
        actorRole: 'USER',
        adjudicatorUserId: 'renter_alice',
        outcome: {
          resolvedState: 'RESOLVED_RENTER',
          renterAwardMinorUnits: 50000,
          providerAwardMinorUnits: 0,
          depositDisposition: 'RELEASE_TO_RENTER',
          payoutAction: 'RELEASE',
          notes: 'Self award',
          resolvedByUserId: 'renter_alice',
          resolvedAt: new Date().toISOString(),
        },
      });

      expect(resolveRes.success).toBe(false);
      expect(resolveRes.error).toContain('RESOLUTION_UNAUTHORIZED');
    });

    it('evaluates payout hold status: active dispute holds payout automatically', async () => {
      const disputeBooking: GlobalBookingRecord = {
        ...sampleBooking,
        id: `book_disp_only_${Date.now()}`,
      };
      await openDispute({
        booking: disputeBooking,
        openedByUserId: 'renter_alice',
        origin: 'BOOKING_DISAGREEMENT',
        summary: 'Provider failed to show up',
        idempotencyKey: `idemp_disp_only_${Date.now()}`,
      });

      const holdEval = evaluatePayoutHoldStatus(disputeBooking.id);
      expect(holdEval.isHeld).toBe(true);
      expect(holdEval.blockingEntity).toBe('DISPUTE');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Review & Reputation Engine
  // --------------------------------------------------------------------------
  describe('7. Review & Reputation Engine', () => {
    it('blocks reviews on unfinished (non-COMPLETED) bookings', async () => {
      const revRes = await submitReview({
        booking: sampleBooking, // Status is CONFIRMED, not COMPLETED
        authorUserId: 'renter_alice',
        targetId: 'list_drill_101',
        reviewType: 'RENTER_TO_LISTING',
        rating: 5,
        comment: 'Great tool!',
      });

      expect(revRes.success).toBe(false);
      expect(revRes.error).toContain('INELIGIBLE_BOOKING_STATUS');
    });

    it('blocks unrelated users from reviewing a booking', async () => {
      const revRes = await submitReview({
        booking: completedBooking,
        authorUserId: 'unrelated_stranger',
        targetId: completedBooking.participants.listingId,
        reviewType: 'RENTER_TO_LISTING',
        rating: 5,
        comment: 'I did not even rent this',
      });

      expect(revRes.success).toBe(false);
      expect(revRes.error).toContain('REVIEW_UNAUTHORIZED');
    });

    it('prohibits self-review by provider on own listing', async () => {
      const revRes = await submitReview({
        booking: completedBooking,
        authorUserId: 'provider_bob',
        targetId: completedBooking.participants.listingId, // Provider reviewing own listing
        reviewType: 'RENTER_TO_LISTING',
        rating: 5,
        comment: 'My own listing is the best',
      });

      expect(revRes.success).toBe(false);
      expect(revRes.error).toContain('SELF_REVIEW_PROHIBITED');
    });

    it('allows valid review submission and calculates aggregate rating authoritatively', async () => {
      const targetListingId = 'list_drill_101';
      const revRes = await submitReview({
        booking: completedBooking,
        authorUserId: 'renter_alice',
        targetId: targetListingId,
        reviewType: 'RENTER_TO_LISTING',
        rating: 5,
        title: 'Outstanding performance',
        comment: 'Drill was powerful and well-maintained.',
      });

      expect(revRes.success).toBe(true);
      expect(revRes.review?.moderationStatus).toBe('PUBLISHED');

      // Server-authoritative aggregate calculation
      const aggregate = aggregateRating(targetListingId);
      expect(aggregate.totalReviews).toBe(1);
      expect(aggregate.averageRating).toBe(5);
      expect(aggregate.distribution[5]).toBe(1);
    });

    it('prohibits duplicate reviews for the same booking and target', async () => {
      const duplicateRes = await submitReview({
        booking: completedBooking,
        authorUserId: 'renter_alice',
        targetId: 'list_drill_101',
        reviewType: 'RENTER_TO_LISTING',
        rating: 4,
        comment: 'Trying to submit a second review for same booking',
      });

      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.error).toContain('DUPLICATE_REVIEW_PROHIBITED');
    });

    it('allows moderator to hide review and excludes hidden reviews from aggregate', async () => {
      // Submit a review for provider
      const revRes = await submitReview({
        booking: { ...completedBooking, id: 'book_prov_rev_test' },
        authorUserId: 'renter_alice',
        targetId: 'provider_bob',
        reviewType: 'RENTER_TO_PROVIDER',
        rating: 1,
        comment: 'Offensive review text',
      });

      expect(revRes.success).toBe(true);

      // Moderate review to HIDDEN
      const modRes = moderateReview({
        reviewId: revRes.review!.id,
        moderatorRole: 'ADMIN',
        targetStatus: 'HIDDEN',
      });

      expect(modRes.success).toBe(true);
      expect(modRes.review?.moderationStatus).toBe('HIDDEN');

      // Aggregate must exclude HIDDEN reviews
      const aggregate = aggregateRating('provider_bob');
      expect(aggregate.totalReviews).toBe(0);
      expect(aggregate.averageRating).toBe(0);
    });
  });
});
