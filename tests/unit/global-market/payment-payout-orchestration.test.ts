/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-6A Payment Collection & Provider Payout Unit Tests
 */

import {
  ALL_PAYMENT_LIFECYCLE_STATES,
  canTransitionPaymentStatus,
  isPaymentTerminalStatus,
  ALL_PAYOUT_LIFECYCLE_STATES,
  canTransitionPayoutStatus,
  isPayoutTerminalStatus,
  resolveApprovedTransactionCurrency,
  resolveApprovedSettlementCurrency,
  resolveJurisdictionPaymentProfile,
  getAllAuthoritativePaymentProfiles,
  resolveJurisdictionPayoutProfile,
  getAllAuthoritativePayoutProfiles,
  financialProviderRegistry,
  initiatePaymentAttempt,
  processPaymentWebhook,
  reconcilePaymentWithProvider,
  evaluatePayoutEligibility,
  createPayoutInstruction,
  reconcilePayoutWithProvider,
  MANNYPAY_PROVIDER_ID,
  MANNYPAY_STATUS,
  type PayableBookingContext,
  type EligiblePayoutContext,
  type GlobalBookingRecord,
} from '@/lib/global-market';

describe('GM-6A Global Payment Collection & Provider Payout Orchestration', () => {
  // Fixture for payable booking context (from GM-5A)
  const samplePayableContext: PayableBookingContext = Object.freeze({
    bookingId: 'book_camera_999',
    bookingReference: 'RENT-PH-123456',
    payerId: 'renter_alice_123',
    payeeProviderId: 'provider_bob_456',
    jurisdictionCode: 'PH',
    authoritativeAmountMinorUnits: 550000, // 5,500.00 PHP
    depositAmountMinorUnits: 100000,
    deliveryFeeMinorUnits: 20000,
    sourceListingCurrency: 'PHP',
    requiredTransactionCurrency: 'PHP',
    paymentStateRequirement: 'FULL_PREPAYMENT',
    idempotencyReference: 'pay_ref_book_camera_999',
    paymentStatus: 'NOT_REQUIRED_YET',
  });

  const sampleBookingRecord: GlobalBookingRecord = Object.freeze({
    id: 'book_camera_999',
    bookingReference: 'RENT-PH-123456',
    participants: {
      renterId: 'renter_alice_123',
      providerId: 'provider_bob_456',
      listingId: 'listing_camera_123',
      jurisdictionCode: 'PH',
    },
    listingSnapshot: {
      listingId: 'listing_camera_123',
      providerId: 'provider_bob_456',
      jurisdictionCode: 'PH',
      title: 'Sony Alpha Camera',
      pricingUnit: 'DAILY',
      basePriceMinorUnits: 150000,
      currency: 'PHP',
      securityDepositMinorUnits: 100000,
      snapshotTimestamp: '2026-01-01T00:00:00.000Z',
    },
    moneySnapshot: {
      listingPriceCurrency: 'PHP',
      bookingPriceCurrency: 'PHP',
      displayCurrency: 'PHP',
      baseRentalAmountMinorUnits: 450000,
      securityDepositAmountMinorUnits: 100000,
      deliveryFeeMinorUnits: 0,
      platformFeeMinorUnits: 0,
      estimatedTotalAmountMinorUnits: 550000,
      isFxGuaranteed: false,
      transactionCurrencyRequired: 'PHP',
      settlementCurrencyRequired: 'PHP',
      snapshotTimestamp: '2026-01-01T00:00:00.000Z',
    },
    rentalPeriod: {
      startDate: '2026-11-01',
      endDate: '2026-11-04',
      duration: 3,
      durationUnit: 'DAILY',
      jurisdictionTimezone: 'Asia/Manila',
      startUtcTimestamp: '2026-11-01T09:00:00.000Z',
      endUtcTimestamp: '2026-11-04T18:00:00.000Z',
    },
    status: 'COMPLETED',
    paymentStatus: 'AUTHORIZED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  const sampleEligiblePayoutContext: EligiblePayoutContext = Object.freeze({
    bookingId: 'book_camera_999',
    bookingReference: 'RENT-PH-123456',
    providerId: 'provider_bob_456',
    jurisdictionCode: 'PH',
    eligibleSettlementTrigger: 'BOOKING_COMPLETED',
    payoutAmountMinorUnits: 450000, // 4,500.00 PHP (base rental)
    settlementCurrency: 'PHP',
    amountAuthorityReference: 'payout_auth_book_camera_999',
    isSettled: false,
  });

  describe('1. 46-Country Payment and Payout Profile Resolution', () => {
    it('resolves exactly 46 authoritative payment collection profiles', () => {
      const profiles = getAllAuthoritativePaymentProfiles();
      expect(profiles).toHaveLength(46);
      const codes = new Set(profiles.map((p) => p.jurisdictionCode));
      expect(codes.size).toBe(46);
    });

    it('resolves exactly 46 authoritative provider payout settlement profiles', () => {
      const profiles = getAllAuthoritativePayoutProfiles();
      expect(profiles).toHaveLength(46);
      const codes = new Set(profiles.map((p) => p.jurisdictionCode));
      expect(codes.size).toBe(46);
    });

    it('fails closed on unknown or invalid country codes', () => {
      expect(resolveJurisdictionPaymentProfile('XX')).toBeNull();
      expect(resolveJurisdictionPaymentProfile('')).toBeNull();
      expect(resolveJurisdictionPaymentProfile(null)).toBeNull();

      expect(resolveJurisdictionPayoutProfile('ZZ')).toBeNull();
      expect(resolveJurisdictionPayoutProfile(undefined)).toBeNull();
    });

    it('configures domestic PH collection and preserves unconfigured state elsewhere', () => {
      const ph = resolveJurisdictionPaymentProfile('PH');
      expect(ph).not.toBeNull();
      expect(ph?.collectionStatus).toBe('PARTIAL');
      expect(ph?.approvedProviderIds).toContain('paymongo');
      expect(ph?.supportedTransactionCurrencies).toContain('PHP');

      const th = resolveJurisdictionPaymentProfile('TH');
      expect(th?.collectionStatus).toBe('NOT_CONFIGURED');

      const cn = resolveJurisdictionPaymentProfile('CN');
      expect(cn?.collectionStatus).toBe('NOT_CONFIGURED');
    });
  });

  describe('2. Currency Separation & Anti-Fake-FX Policy', () => {
    const phPolicy = {
      jurisdictionCode: 'PH',
      allowedTransactionCurrencies: ['PHP'],
      defaultTransactionCurrency: 'PHP',
      allowsForeignCardCollection: true,
      supportsMultiCurrencyTransaction: false,
    };

    it('allows valid native transaction currency', () => {
      const res = resolveApprovedTransactionCurrency('PHP', phPolicy, 'PHP');
      expect(res.isValid).toBe(true);
      expect(res.transactionCurrency).toBe('PHP');
      expect(res.conversionRequired).toBe(false);
    });

    it('rejects unverified foreign currency conversion with no fake FX', () => {
      const res = resolveApprovedTransactionCurrency('PHP', phPolicy, 'EUR');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('UNVERIFIED_TRANSACTION_CURRENCY');
    });

    it('resolves settlement currency independently of display or transaction currency', () => {
      const settlementPolicy = {
        jurisdictionCode: 'PH',
        allowedSettlementCurrencies: ['PHP'],
        defaultSettlementCurrency: 'PHP',
        supportsCrossBorderSettlement: false,
      };

      const res = resolveApprovedSettlementCurrency(settlementPolicy, 'PHP');
      expect(res.isValid).toBe(true);
      expect(res.settlementCurrency).toBe('PHP');

      const invalidRes = resolveApprovedSettlementCurrency(settlementPolicy, 'USD');
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.reason).toContain('UNSUPPORTED_SETTLEMENT_CURRENCY');
    });
  });

  describe('3. Payment Lifecycle & State Machine', () => {
    it('verifies all 13 typed payment states exist', () => {
      expect(ALL_PAYMENT_LIFECYCLE_STATES).toHaveLength(13);
      expect(ALL_PAYMENT_LIFECYCLE_STATES).toContain('CREATED');
      expect(ALL_PAYMENT_LIFECYCLE_STATES).toContain('AUTHORIZED');
      expect(ALL_PAYMENT_LIFECYCLE_STATES).toContain('SUCCEEDED');
      expect(ALL_PAYMENT_LIFECYCLE_STATES).toContain('FAILED');
      expect(ALL_PAYMENT_LIFECYCLE_STATES).toContain('REFUNDED');
    });

    it('permits valid linear payment transitions', () => {
      expect(canTransitionPaymentStatus('CREATED', 'PENDING')).toBe(true);
      expect(canTransitionPaymentStatus('PENDING', 'PROCESSING')).toBe(true);
      expect(canTransitionPaymentStatus('PROCESSING', 'SUCCEEDED')).toBe(true);
      expect(canTransitionPaymentStatus('SUCCEEDED', 'REFUND_PENDING')).toBe(true);
      expect(canTransitionPaymentStatus('REFUND_PENDING', 'REFUNDED')).toBe(true);
    });

    it('rejects illegal payment transitions', () => {
      expect(canTransitionPaymentStatus('SUCCEEDED', 'PENDING')).toBe(false);
      expect(canTransitionPaymentStatus('REFUNDED', 'SUCCEEDED')).toBe(false);
      expect(canTransitionPaymentStatus('CANCELLED', 'SUCCEEDED')).toBe(false);
    });

    it('identifies terminal payment states', () => {
      expect(isPaymentTerminalStatus('SUCCEEDED')).toBe(true);
      expect(isPaymentTerminalStatus('REFUNDED')).toBe(true);
      expect(isPaymentTerminalStatus('CANCELLED')).toBe(true);
      expect(isPaymentTerminalStatus('PENDING')).toBe(false);
    });
  });

  describe('4. Payment Initiation Security & Anti-Tampering', () => {
    it('blocks client amount tampering', async () => {
      await expect(
        initiatePaymentAttempt({
          payableContext: samplePayableContext,
          requestingPayerId: 'renter_alice_123',
          clientSubmittedAmount: 100, // Attempting to pay only 100 instead of 550,000
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
          idempotencyKey: `tamper_amt_${Date.now()}`,
        })
      ).rejects.toThrow(/AMOUNT_TAMPERING_BLOCKED/);
    });

    it('blocks client currency tampering', async () => {
      await expect(
        initiatePaymentAttempt({
          payableContext: samplePayableContext,
          requestingPayerId: 'renter_alice_123',
          clientSubmittedCurrency: 'JPY',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
          idempotencyKey: `tamper_curr_${Date.now()}`,
        })
      ).rejects.toThrow(/CURRENCY_TAMPERING_BLOCKED/);
    });

    it('blocks payer identity spoofing', async () => {
      await expect(
        initiatePaymentAttempt({
          payableContext: samplePayableContext,
          requestingPayerId: 'attacker_eve_999',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
          idempotencyKey: `tamper_payer_${Date.now()}`,
        })
      ).rejects.toThrow(/PAYER_SPOOFING_BLOCKED/);
    });

    it('creates authoritative payment attempt and enforces idempotency', async () => {
      const idempKey = `idemp_pay_${Date.now()}`;
      const firstCall = await initiatePaymentAttempt({
        payableContext: samplePayableContext,
        requestingPayerId: 'renter_alice_123',
        providerId: 'mock_gateway',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        idempotencyKey: idempKey,
      });

      expect(firstCall.success).toBe(true);
      expect(firstCall.paymentAttempt?.authoritativeAmountMinorUnits).toBe(550000);
      expect(firstCall.paymentAttempt?.transactionCurrency).toBe('PHP');
      expect(firstCall.paymentAttempt?.providerReference).toMatch(/^mock_pay_ref_/);
      expect(firstCall.isIdempotentReplay).toBeFalsy();

      // Retry with same idempotency key
      const secondCall = await initiatePaymentAttempt({
        payableContext: samplePayableContext,
        requestingPayerId: 'renter_alice_123',
        providerId: 'mock_gateway',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        idempotencyKey: idempKey,
      });

      expect(secondCall.success).toBe(true);
      expect(secondCall.isIdempotentReplay).toBe(true);
      expect(secondCall.paymentAttempt?.id).toBe(firstCall.paymentAttempt?.id);
    });
  });

  describe('5. Payment Webhook Security & Reconciliation', () => {
    it('rejects invalid webhook signatures', async () => {
      const res = await processPaymentWebhook(
        'mock_gateway',
        { status: 'succeeded' },
        'invalid_signature_xyz'
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('INVALID_WEBHOOK_SIGNATURE');
    });

    it('quarantines webhooks with amount mismatches', async () => {
      // First create attempt
      const attempt = await initiatePaymentAttempt({
        payableContext: samplePayableContext,
        requestingPayerId: 'renter_alice_123',
        providerId: 'mock_gateway',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        idempotencyKey: `idemp_mismatch_${Date.now()}`,
      });

      const providerRef = attempt.paymentAttempt!.providerReference!;

      // Webhook arrives with mismatched amount (e.g. 100 instead of 550,000)
      const res = await processPaymentWebhook(
        'mock_gateway',
        {
          eventId: `evt_mismatch_${Date.now()}`,
          providerReference: providerRef,
          status: 'succeeded',
          amountMinorUnits: 100, // Mismatched
          currency: 'PHP',
        },
        'valid_mock_signature'
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('WEBHOOK_AMOUNT_MISMATCH');
      expect(res.paymentAttempt?.reconciliationStatus).toBe('MISMATCH');
    });

    it('processes valid webhook and protects against out-of-order terminal regression', async () => {
      const attempt = await initiatePaymentAttempt({
        payableContext: samplePayableContext,
        requestingPayerId: 'renter_alice_123',
        providerId: 'mock_gateway',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        idempotencyKey: `idemp_success_${Date.now()}`,
      });

      const providerRef = attempt.paymentAttempt!.providerReference!;

      // Valid success webhook
      const successEvtId = `evt_succ_${Date.now()}`;
      const successRes = await processPaymentWebhook(
        'mock_gateway',
        {
          eventId: successEvtId,
          providerReference: providerRef,
          status: 'succeeded',
          amountMinorUnits: 550000,
          currency: 'PHP',
        },
        'valid_mock_signature'
      );

      expect(successRes.success).toBe(true);
      expect(successRes.paymentAttempt?.normalizedStatus).toBe('SUCCEEDED');

      // Delayed out-of-order 'PENDING' webhook arrives after SUCCEEDED
      const delayedPendingRes = await processPaymentWebhook(
        'mock_gateway',
        {
          eventId: `evt_pending_${Date.now()}`,
          providerReference: providerRef,
          status: 'pending',
          amountMinorUnits: 550000,
          currency: 'PHP',
        },
        'valid_mock_signature'
      );

      expect(delayedPendingRes.success).toBe(true);
      expect(delayedPendingRes.outOfOrderIgnored).toBe(true);
      // Status must remain SUCCEEDED!
      expect(delayedPendingRes.paymentAttempt?.normalizedStatus).toBe('SUCCEEDED');
    });

    it('reconciles payment state with provider truth', async () => {
      const attempt = await initiatePaymentAttempt({
        payableContext: samplePayableContext,
        requestingPayerId: 'renter_alice_123',
        providerId: 'mock_gateway',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        idempotencyKey: `idemp_recon_${Date.now()}`,
      });

      const recon = await reconcilePaymentWithProvider(attempt.paymentAttempt!.id);
      expect(recon.status).toBe('MATCHED');
      expect(recon.matched).toBe(true);
      expect(recon.updatedRecord.normalizedStatus).toBe('SUCCEEDED');
    });
  });

  describe('6. Payout Lifecycle, Eligibility & Anti-Tampering', () => {
    it('strictly enforces PAYMENT SUCCEEDED != PAYOUT SUCCEEDED', () => {
      // Payment SUCCEEDED, but booking not yet COMPLETED
      const activeBooking: GlobalBookingRecord = {
        ...sampleBookingRecord,
        status: 'ACTIVE', // Still active rental!
      };

      const eligibility = evaluatePayoutEligibility({
        booking: activeBooking,
        paymentRecord: {
          id: 'pay_1',
          bookingId: 'book_camera_999',
          payerId: 'renter_alice_123',
          providerId: 'provider_bob_456',
          jurisdictionCode: 'PH',
          authoritativeAmountMinorUnits: 550000,
          depositAmountMinorUnits: 100000,
          deliveryFeeMinorUnits: 0,
          transactionCurrency: 'PHP',
          paymentProviderId: 'mock_gateway',
          idempotencyKey: 'k1',
          normalizedStatus: 'SUCCEEDED',
          reconciliationStatus: 'MATCHED',
          createdAt: '',
          updatedAt: '',
        },
        providerKycApproved: true,
      });

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('BOOKING_NOT_COMPLETED');
    });

    it('blocks payout when provider KYC is incomplete', () => {
      const eligibility = evaluatePayoutEligibility({
        booking: sampleBookingRecord, // COMPLETED
        paymentRecord: {
          id: 'pay_1',
          bookingId: 'book_camera_999',
          payerId: 'renter_alice_123',
          providerId: 'provider_bob_456',
          jurisdictionCode: 'PH',
          authoritativeAmountMinorUnits: 550000,
          depositAmountMinorUnits: 100000,
          deliveryFeeMinorUnits: 0,
          transactionCurrency: 'PHP',
          paymentProviderId: 'mock_gateway',
          idempotencyKey: 'k1',
          normalizedStatus: 'SUCCEEDED',
          reconciliationStatus: 'MATCHED',
          createdAt: '',
          updatedAt: '',
        },
        providerKycApproved: false, // Incomplete KYC!
      });

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('PROVIDER_KYC_REQUIRED');
    });

    it('blocks payout when there is an active dispute hold', () => {
      const eligibility = evaluatePayoutEligibility({
        booking: sampleBookingRecord,
        paymentRecord: {
          id: 'pay_1',
          bookingId: 'book_camera_999',
          payerId: 'renter_alice_123',
          providerId: 'provider_bob_456',
          jurisdictionCode: 'PH',
          authoritativeAmountMinorUnits: 550000,
          depositAmountMinorUnits: 100000,
          deliveryFeeMinorUnits: 0,
          transactionCurrency: 'PHP',
          paymentProviderId: 'mock_gateway',
          idempotencyKey: 'k1',
          normalizedStatus: 'SUCCEEDED',
          reconciliationStatus: 'MATCHED',
          createdAt: '',
          updatedAt: '',
        },
        providerKycApproved: true,
        hasOpenDispute: true,
      });

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('DISPUTE_HOLD');
    });

    it('blocks payout beneficiary redirection tampering', async () => {
      const validPaymentRecord = {
        id: 'pay_1',
        bookingId: 'book_camera_999',
        payerId: 'renter_alice_123',
        providerId: 'provider_bob_456',
        jurisdictionCode: 'PH',
        authoritativeAmountMinorUnits: 550000,
        depositAmountMinorUnits: 100000,
        deliveryFeeMinorUnits: 0,
        transactionCurrency: 'PHP',
        paymentProviderId: 'mock_gateway',
        idempotencyKey: 'k1',
        normalizedStatus: 'SUCCEEDED' as const,
        reconciliationStatus: 'MATCHED' as const,
        createdAt: '',
        updatedAt: '',
      };

      await expect(
        createPayoutInstruction({
          eligibleContext: sampleEligiblePayoutContext,
          booking: sampleBookingRecord,
          paymentRecord: validPaymentRecord,
          providerKycApproved: true,
          authoritativeBeneficiaryReference: 'BDO-ACCOUNT-987654321',
          clientSubmittedBeneficiary: 'ATTACKER-ACCOUNT-0000000', // Spoof attempt!
          idempotencyKey: `payout_tamper_${Date.now()}`,
        })
      ).rejects.toThrow(/BENEFICIARY_TAMPERING_BLOCKED/);
    });

    it('creates payout instruction and enforces payout idempotency', async () => {
      const validPaymentRecord = {
        id: 'pay_1',
        bookingId: 'book_camera_999',
        payerId: 'renter_alice_123',
        providerId: 'provider_bob_456',
        jurisdictionCode: 'PH',
        authoritativeAmountMinorUnits: 550000,
        depositAmountMinorUnits: 100000,
        deliveryFeeMinorUnits: 0,
        transactionCurrency: 'PHP',
        paymentProviderId: 'mock_gateway',
        idempotencyKey: 'k1',
        normalizedStatus: 'SUCCEEDED' as const,
        reconciliationStatus: 'MATCHED' as const,
        createdAt: '',
        updatedAt: '',
      };

      const idempKey = `idemp_payout_${Date.now()}`;
      const firstPayout = await createPayoutInstruction({
        eligibleContext: sampleEligiblePayoutContext,
        booking: sampleBookingRecord,
        paymentRecord: validPaymentRecord,
        providerKycApproved: true,
        authoritativeBeneficiaryReference: 'BDO-ACCOUNT-987654321',
        idempotencyKey: idempKey,
      });

      expect(firstPayout.success).toBe(true);
      expect(firstPayout.payoutInstruction?.payoutAmountMinorUnits).toBe(450000);
      expect(firstPayout.payoutInstruction?.settlementCurrency).toBe('PHP');
      expect(firstPayout.payoutInstruction?.providerReference).toMatch(/^mock_payout_ref_/);
      expect(firstPayout.isIdempotentReplay).toBeFalsy();

      // Retry attempt with same idempotency key must not create second payout
      const secondPayout = await createPayoutInstruction({
        eligibleContext: sampleEligiblePayoutContext,
        booking: sampleBookingRecord,
        paymentRecord: validPaymentRecord,
        providerKycApproved: true,
        authoritativeBeneficiaryReference: 'BDO-ACCOUNT-987654321',
        idempotencyKey: idempKey,
      });

      expect(secondPayout.success).toBe(true);
      expect(secondPayout.isIdempotentReplay).toBe(true);
      expect(secondPayout.payoutInstruction?.id).toBe(firstPayout.payoutInstruction?.id);
    });
  });

  describe('7. MannyPay Strict Boundary', () => {
    it('strictly maintains MannyPay as SEPARATE_WORKSTREAM_PENDING', () => {
      expect(MANNYPAY_PROVIDER_ID).toBe('mannypay');
      expect(MANNYPAY_STATUS).toBe('SEPARATE_WORKSTREAM_PENDING');
      expect(financialProviderRegistry.getPaymentAdapter('mannypay')).toBeNull();
    });
  });

  describe('8. Representative 7-Country Financial Architecture Matrix', () => {
    const repMarkets = ['PH', 'TH', 'CN', 'SG', 'JP', 'US', 'DE'];

    repMarkets.forEach((code) => {
      it(`resolves architectural payment profile, payout profile, and currency policy for ${code}`, () => {
        const paymentProfile = resolveJurisdictionPaymentProfile(code);
        expect(paymentProfile).not.toBeNull();
        expect(paymentProfile?.jurisdictionCode).toBe(code);

        const payoutProfile = resolveJurisdictionPayoutProfile(code);
        expect(payoutProfile).not.toBeNull();
        expect(payoutProfile?.jurisdictionCode).toBe(code);
      });
    });
  });
});
