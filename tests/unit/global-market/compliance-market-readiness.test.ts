/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-8A Compliance & Market Readiness Unit Test Suite
 *
 * Tests:
 * 1. 46-Country Tax Profile Resolution & Suppression of Fake Tax
 * 2. 46-Country Invoice & Receipt Generation & Authority Isolation
 * 3. 46-Country Compliance Profile Resolution & Governance Invariants
 * 4. 46-Country Category Policy Engine & Prohibited Items Enforcement
 * 5. 46-Country Provider Mapping Resolution & Strict Workstream Boundaries
 * 6. 46-Country Market Readiness Ladder & Fail-Closed Resolution
 * 7. Security Anti-Tampering & Client Override Prohibition Guards
 */

import {
  resolveJurisdictionTaxProfile,
  getAllAuthoritativeTaxProfiles,
  AUTHORITATIVE_TAX_PROFILE_COUNT,
  isTaxConfigurationReady,
  calculateAuthoritativeTax,
  resolveJurisdictionComplianceProfile,
  getAllAuthoritativeComplianceProfiles,
  AUTHORITATIVE_COMPLIANCE_PROFILE_COUNT,
  canRegister,
  canOnboardProvider,
  canBook,
  canCollectPayment,
  canPayoutProvider,
  canActivateCommercially,
  resolveCategoryPolicy,
  getAllAuthoritativeCategoryBundles,
  CANONICAL_MARKETPLACE_CATEGORIES,
  PROHIBITED_CATEGORIES,
  evaluateCategoryPolicy,
  isListingAllowed,
  isSearchAllowed,
  isBookingAllowed,
  resolveJurisdictionProviderMapping,
  getAllAuthoritativeProviderMappings,
  AUTHORITATIVE_PROVIDER_MAPPING_COUNT,
  KNOWN_PROVIDER_CAPABILITIES,
  getMarketReadiness,
  getAllMarketReadinessProfiles,
  AUTHORITATIVE_READINESS_PROFILE_COUNT,
  getMarketReadinessBlockers,
  getProviderGaps,
  canProceedToLocalAcceptance,
  generateBookingReceipt,
  generateRefundCreditNote,
  type GlobalBookingRecord,
  type PaymentAttemptRecord,
  type RefundInstruction,
  MANNYPAY_STATUS,
  MANNYPAY_IS_MODIFIED_IN_GM6A,
  getCommerciallyActiveCountries,
} from '../../../src/lib/global-market';

describe('RENTipid GLOBAL-MKT / v2.0 — GM-8A Compliance & Market Readiness Suite', () => {
  const sampleBooking: GlobalBookingRecord = Object.freeze({
    id: 'book_gm8a_test_001',
    bookingReference: 'RENT-PH-999001',
    participants: Object.freeze({
      renterId: 'renter_elena',
      providerId: 'provider_marco',
      listingId: 'list_generator_201',
      jurisdictionCode: 'PH',
    }),
    listingSnapshot: Object.freeze({
      listingId: 'list_generator_201',
      providerId: 'provider_marco',
      jurisdictionCode: 'PH',
      title: 'Silent Diesel Generator 5kVA',
      pricingUnit: 'DAILY',
      basePriceMinorUnits: 300000,
      currency: 'PHP',
      securityDepositMinorUnits: 50000,
      snapshotTimestamp: new Date().toISOString(),
    }),
    moneySnapshot: Object.freeze({
      listingPriceCurrency: 'PHP',
      bookingPriceCurrency: 'PHP',
      displayCurrency: 'PHP',
      baseRentalAmountMinorUnits: 300000,
      securityDepositAmountMinorUnits: 50000,
      deliveryFeeMinorUnits: 0,
      platformFeeMinorUnits: 30000, // 300.00 PHP fee
      estimatedTotalAmountMinorUnits: 380000,
      isFxGuaranteed: true,
      transactionCurrencyRequired: 'PHP',
      settlementCurrencyRequired: 'PHP',
      snapshotTimestamp: new Date().toISOString(),
    }),
    rentalPeriod: Object.freeze({
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      duration: 4,
      durationUnit: 'DAILY',
      jurisdictionTimezone: 'Asia/Manila',
      startUtcTimestamp: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      endUtcTimestamp: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    status: 'CONFIRMED',
    paymentStatus: 'SETTLED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const samplePayment: PaymentAttemptRecord = Object.freeze({
    id: 'pay_att_gm8a_001',
    payableContext: Object.freeze({
      bookingId: sampleBooking.id,
      bookingReference: sampleBooking.bookingReference,
      payerId: sampleBooking.participants.renterId,
      payeeProviderId: sampleBooking.participants.providerId,
      jurisdictionCode: sampleBooking.participants.jurisdictionCode,
      authoritativeAmountMinorUnits: 380000,
      depositAmountMinorUnits: 50000,
      requiredTransactionCurrency: 'PHP',
    }),
    paymentProviderId: 'paymongo_global',
    transactionCurrency: 'PHP',
    settlementCurrency: 'PHP',
    authoritativeAmountMinorUnits: 380000,
    normalizedStatus: 'SUCCEEDED',
    providerReference: 'pay_mock_ref_8a',
    idempotencyKey: 'idemp_pay_8a_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // --------------------------------------------------------------------------
  // 1. 46-Country Tax Profile Resolution & Suppression of Fake Tax
  // --------------------------------------------------------------------------
  describe('1. 46-Country Tax Profile Resolution & Suppression of Fake Tax', () => {
    it('resolves exactly 46 authoritative tax profiles with zero duplicates', () => {
      const profiles = getAllAuthoritativeTaxProfiles();
      expect(profiles.length).toBe(46);
      expect(AUTHORITATIVE_TAX_PROFILE_COUNT).toBe(46);

      const uniqueCodes = new Set(profiles.map((p) => p.jurisdictionCode));
      expect(uniqueCodes.size).toBe(46);
    });

    it('fails closed for unknown country codes', () => {
      expect(resolveJurisdictionTaxProfile('ZZ')).toBeNull();
      expect(resolveJurisdictionTaxProfile('')).toBeNull();
      expect(resolveJurisdictionTaxProfile(null)).toBeNull();
    });

    it('resolves verified domestic tax profile for the Philippines', () => {
      const phTax = resolveJurisdictionTaxProfile('PH');
      expect(phTax).toBeDefined();
      expect(phTax?.taxPolicyStatus).toBe('VERIFIED');
      expect(phTax?.taxSystemType).toBe('VAT');
      expect(phTax?.digitalPlatformReportingRequired).toBe(true);
      expect(isTaxConfigurationReady('PH')).toBe(true);
    });

    it('strictly suppresses fake tax for international jurisdictions without configured engines', () => {
      const usTax = calculateAuthoritativeTax({
        jurisdictionCode: 'US',
        baseRentalAmountMinorUnits: 100000,
        platformFeeMinorUnits: 10000,
        isBusinessProvider: false,
        transactionCurrency: 'USD',
      });

      expect(usTax.isCalculated).toBe(false);
      expect(usTax.status).toBe('VALIDATION_REQUIRED');
      expect(usTax.taxAmountMinorUnits).toBe(0); // Zero fake tax!
      expect(usTax.error).toContain('LEGAL_VALIDATION_REQUIRED');
    });

    it('calculates verified VAT on domestic Philippine platform fees', () => {
      const phTaxCalc = calculateAuthoritativeTax({
        jurisdictionCode: 'PH',
        baseRentalAmountMinorUnits: 300000,
        platformFeeMinorUnits: 30000, // 300.00 PHP platform fee
        isBusinessProvider: false,
        transactionCurrency: 'PHP',
      });

      expect(phTaxCalc.isCalculated).toBe(true);
      expect(phTaxCalc.status).toBe('CALCULATED');
      expect(phTaxCalc.taxAmountMinorUnits).toBe(3600); // 12% of 30,000 = 3,600 centavos (36.00 PHP)
      expect(phTaxCalc.effectiveRateBasisPoints).toBe(1200);
    });
  });

  // --------------------------------------------------------------------------
  // 2. 46-Country Invoice & Receipt Framework
  // --------------------------------------------------------------------------
  describe('2. Invoice & Receipt Framework', () => {
    it('generates authoritative receipt with amounts derived from booking and payment records', async () => {
      const receiptRes = await generateBookingReceipt({
        booking: sampleBooking,
        paymentRecord: samplePayment,
        providerTaxId: 'TIN-123-456-789',
        renterTaxId: 'TIN-987-654-321',
        idempotencyKey: `idemp_rec_${Date.now()}`,
      });

      expect(receiptRes.success).toBe(true);
      expect(receiptRes.invoice).toBeDefined();
      expect(receiptRes.invoice?.documentType).toBe('RECEIPT');
      expect(receiptRes.invoice?.totalAmountMinorUnits).toBe(380000);
      expect(receiptRes.invoice?.currency).toBe('PHP');
      expect(receiptRes.invoice?.bookingId).toBe(sampleBooking.id);
    });

    it('generates authoritative credit note for approved refund', async () => {
      const sampleRefund: RefundInstruction = Object.freeze({
        id: 'ref_inst_credit_test',
        refundNumber: 'REF-PH-999001',
        bookingId: sampleBooking.id,
        paymentAttemptId: samplePayment.id,
        refundType: 'FULL_CANCELLATION',
        maximumRefundableAmountMinorUnits: 380000,
        approvedAmountMinorUnits: 380000,
        currency: 'PHP',
        recipientUserId: sampleBooking.participants.renterId,
        reason: 'Authorized cancellation refund',
        policyReference: 'POLICY_MODERATE',
        approvalAuthority: 'SYSTEM_POLICY',
        approvedByUserId: 'system',
        providerExecutionRequired: true,
        status: 'REFUNDED',
        idempotencyKey: 'idemp_ref_8a',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const originalInvoiceRes = await generateBookingReceipt({
        booking: sampleBooking,
        paymentRecord: samplePayment,
        idempotencyKey: `idemp_orig_inv_${Date.now()}`,
      });

      const creditNoteRes = await generateRefundCreditNote({
        booking: sampleBooking,
        originalInvoiceId: originalInvoiceRes.invoice!.invoiceId,
        refundInstruction: sampleRefund,
        reason: 'Booking cancelled prior to start date',
        idempotencyKey: `idemp_cn_${Date.now()}`,
      });

      expect(creditNoteRes.success).toBe(true);
      expect(creditNoteRes.invoice?.documentType).toBe('CREDIT_NOTE');
      expect(creditNoteRes.invoice?.totalAmountMinorUnits).toBe(380000);
      expect(creditNoteRes.invoice?.refundInstructionId).toBe(sampleRefund.id);
    });
  });

  // --------------------------------------------------------------------------
  // 3. 46-Country Compliance Profile Resolution & Governance Invariants
  // --------------------------------------------------------------------------
  describe('3. Compliance Profile Resolution & Governance Invariants', () => {
    it('resolves exactly 46 authoritative compliance profiles with zero duplicates', () => {
      const profiles = getAllAuthoritativeComplianceProfiles();
      expect(profiles.length).toBe(46);
      expect(AUTHORITATIVE_COMPLIANCE_PROFILE_COUNT).toBe(46);

      const uniqueCodes = new Set(profiles.map((p) => p.jurisdictionCode));
      expect(uniqueCodes.size).toBe(46);
    });

    it('fails closed for unknown jurisdiction code', () => {
      expect(resolveJurisdictionComplianceProfile('XX')).toBeNull();
      expect(canRegister('XX').allowed).toBe(false);
      expect(canBook('XX').allowed).toBe(false);
    });

    it('preserves China 2 deferred blockers and non-claimed public network operability', () => {
      const cnProfile = resolveJurisdictionComplianceProfile('CN');
      expect(cnProfile).toBeDefined();
      expect(cnProfile?.knownBlockers.length).toBe(2);
      expect(cnProfile?.knownBlockers).toContain('ICP_LICENSE_REQUIRED');
      expect(cnProfile?.knownBlockers).toContain('PIPL_DATA_LOCALIZATION_COMPLIANCE');
      expect(cnProfile?.publicNetworkStatus).toBe('NOT_CLAIMED');
      expect(cnProfile?.dataResidencyStatus).toBe('LOCALIZATION_MANDATORY');

      const regCheck = canRegister('CN');
      expect(regCheck.allowed).toBe(false);
      expect(regCheck.reasonCode).toBe('JURISDICTION_REGISTRATION_RESTRICTED');
    });

    it('verifies domestic Philippine compliance profile permits local operations', () => {
      const phProfile = resolveJurisdictionComplianceProfile('PH');
      expect(phProfile?.consumerProtectionStatus).toBe('VERIFIED');
      expect(phProfile?.eCommerceStatus).toBe('ALLOWED');
      expect(phProfile?.rentalMarketplaceStatus).toBe('ALLOWED');

      expect(canRegister('PH').allowed).toBe(true);
      expect(canOnboardProvider('PH', false).allowed).toBe(true);
      expect(canBook('PH').allowed).toBe(true);
      expect(canCollectPayment('PH').allowed).toBe(true);
    });

    it('prohibits commercial activation across all 46 markets in GM-8A', () => {
      const activeCountries = getCommerciallyActiveCountries();
      expect(activeCountries.length).toBe(0);

      // Verify canActivateCommercially returns false for PH, TH, CN, US
      expect(canActivateCommercially('PH').allowed).toBe(false);
      expect(canActivateCommercially('TH').allowed).toBe(false);
      expect(canActivateCommercially('CN').allowed).toBe(false);
      expect(canActivateCommercially('US').allowed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. 46-Country Category Policy Engine & Prohibited Items Enforcement
  // --------------------------------------------------------------------------
  describe('4. Category Policy Engine & Prohibited Items Enforcement', () => {
    it('resolves category policy bundles for all 46 authoritative countries', () => {
      const bundles = getAllAuthoritativeCategoryBundles();
      expect(bundles.length).toBe(46);
    });

    it('prohibits weapons, explosives, and illegal substances globally in all jurisdictions', () => {
      const testMarkets = ['PH', 'TH', 'CN', 'SG', 'JP', 'US', 'DE', 'GB'];

      for (const market of testMarkets) {
        for (const prohibited of PROHIBITED_CATEGORIES) {
          const outcome = resolveCategoryPolicy(market, prohibited);
          expect(outcome.status).toBe('PROHIBITED');
          expect(outcome.isAllowedForListing).toBe(false);
          expect(outcome.isAllowedForSearch).toBe(false);
          expect(outcome.isAllowedForBooking).toBe(false);

          expect(isListingAllowed(market, prohibited)).toBe(false);
          expect(isSearchAllowed(market, prohibited)).toBe(false);
          expect(isBookingAllowed(market, prohibited)).toBe(false);
        }
      }
    });

    it('fails closed for unknown or unrecognized category slugs', () => {
      const outcome = resolveCategoryPolicy('PH', 'unrecognized-flying-saucer');
      expect(outcome.status).toBe('UNKNOWN');
      expect(outcome.isAllowedForListing).toBe(false);
      expect(outcome.isAllowedForBooking).toBe(false);
      expect(isListingAllowed('PH', 'unrecognized-flying-saucer')).toBe(false);
    });

    it('enforces licensing for specialized asset categories in the Philippines', () => {
      const boatPolicy = evaluateCategoryPolicy('PH', 'boats');
      expect(boatPolicy.outcome.status).toBe('LICENSE_REQUIRED');
      expect(boatPolicy.outcome.requiresPermitOrLicense).toBe(true);

      const aircraftPolicy = evaluateCategoryPolicy('PH', 'aircraft-charter');
      expect(aircraftPolicy.outcome.status).toBe('LICENSE_REQUIRED');
      expect(aircraftPolicy.outcome.requiresPermitOrLicense).toBe(true);
    });

    it('permits standard tools and equipment in domestic Philippines', () => {
      const toolPolicy = evaluateCategoryPolicy('PH', 'tools');
      expect(toolPolicy.canList).toBe(true);
      expect(toolPolicy.canSearch).toBe(true);
      expect(toolPolicy.canBook).toBe(true);
      expect(toolPolicy.outcome.status).toBe('ALLOWED');
    });
  });

  // --------------------------------------------------------------------------
  // 5. 46-Country Provider Mapping Resolution & Strict Workstream Boundaries
  // --------------------------------------------------------------------------
  describe('5. Provider Mapping Resolution & Strict Workstream Boundaries', () => {
    it('resolves provider mappings for all 46 authoritative countries', () => {
      const mappings = getAllAuthoritativeProviderMappings();
      expect(mappings.length).toBe(46);
      expect(AUTHORITATIVE_PROVIDER_MAPPING_COUNT).toBe(46);
    });

    it('preserves PayMongo verified status strictly for domestic PH', () => {
      const phMapping = resolveJurisdictionProviderMapping('PH');
      expect(phMapping?.paymentProviderId).toBe('paymongo_global');
      expect(phMapping?.paymentStatus).toBe('VERIFIED');

      const thMapping = resolveJurisdictionProviderMapping('TH');
      expect(thMapping?.paymentProviderId).toBeNull();
      expect(thMapping?.paymentStatus).toBe('NOT_CONFIGURED');
    });

    it('preserves MannyPay separate workstream boundary and unverified state', () => {
      expect(MANNYPAY_STATUS).toBe('SEPARATE_WORKSTREAM_PENDING');
      expect(MANNYPAY_IS_MODIFIED_IN_GM6A).toBe(false);

      const mannypayRecord = KNOWN_PROVIDER_CAPABILITIES.find((p) => p.providerId === 'mannypay');
      expect(mannypayRecord?.verificationStatus).toBe('NOT_CONFIGURED');
      expect(mannypayRecord?.supportedCountries.length).toBe(0);
    });

    it('classifies external automated KYC providers strictly as NOT_CONFIGURED (0 external providers)', () => {
      const usMapping = resolveJurisdictionProviderMapping('US');
      expect(usMapping?.kycProviderId).toBeNull();
      expect(usMapping?.kycStatus).toBe('NOT_CONFIGURED');
      expect(usMapping?.explicitProviderGaps).toContain('KYC_PROVIDER_MISSING');
    });
  });

  // --------------------------------------------------------------------------
  // 6. 46-Country Market Readiness Ladder & Fail-Closed Resolution
  // --------------------------------------------------------------------------
  describe('6. Market Readiness Ladder & Fail-Closed Resolution', () => {
    it('resolves market readiness profiles for all 46 authoritative countries', () => {
      const profiles = getAllMarketReadinessProfiles();
      expect(profiles.length).toBe(46);
      expect(AUTHORITATIVE_READINESS_PROFILE_COUNT).toBe(46);
    });

    it('designates Philippines as FOUNDATION_READY and eligible for GM-9A local acceptance', () => {
      const phReadiness = getMarketReadiness('PH');
      expect(phReadiness).toBeDefined();
      expect(phReadiness?.currentStage).toBe('FOUNDATION_READY');
      expect(phReadiness?.highestProvenStage).toBe('FOUNDATION_READY');
      expect(phReadiness?.isEligibleForLocalAcceptance).toBe(true);
      expect(phReadiness?.commerciallyActive).toBe(false);
      expect(canProceedToLocalAcceptance('PH')).toBe(true);
    });

    it('designates Thailand and China as REGISTERED with commercial activation strictly false', () => {
      const thReadiness = getMarketReadiness('TH');
      expect(thReadiness?.currentStage).toBe('REGISTERED');
      expect(thReadiness?.isEligibleForLocalAcceptance).toBe(false);
      expect(thReadiness?.commerciallyActive).toBe(false);

      const cnReadiness = getMarketReadiness('CN');
      expect(cnReadiness?.currentStage).toBe('REGISTERED');
      expect(cnReadiness?.isEligibleForLocalAcceptance).toBe(false);
      expect(cnReadiness?.commerciallyActive).toBe(false);
      expect(cnReadiness?.blockers.length).toBe(2);
    });

    it('fails closed for unknown country codes across readiness functions', () => {
      expect(getMarketReadiness('ZZ')).toBeNull();
      expect(getMarketReadinessBlockers('ZZ')).toEqual([]);
      expect(getProviderGaps('ZZ')).toEqual(['UNKNOWN_JURISDICTION']);
      expect(canProceedToLocalAcceptance('ZZ')).toBe(false);
    });
  });
});
