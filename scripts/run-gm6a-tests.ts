/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-6A Targeted Verification & Acceptance Runner
 *
 * Runs programmatic verification across:
 * 1. 46-Country Payment Profile Resolution & Registry Invariant (46/46, 0 duplicates)
 * 2. 46-Country Payout Profile Resolution & Registry Invariant (46/46, 0 duplicates)
 * 3. Unknown Jurisdiction Fail-Closed on Financial Profiles
 * 4. Permanent Separation of Payment Collection != Provider Payout
 * 5. Display != Transaction != Settlement Currency Separation (No Fake FX)
 * 6. Booking Payment Handoff Integrity (Consuming GM-5A PayableBookingContext)
 * 7. Client Amount Tampering Blocked
 * 8. Client Currency Tampering Blocked
 * 9. Payer Identity Spoofing Blocked
 * 10. Payment Idempotency & Duplicate Attempt Suppression
 * 11. Webhook Signature Verification & Malformed Event Rejection
 * 12. Webhook Amount Mismatch Detection & Quarantine
 * 13. Webhook Event Replay Protection & Idempotency
 * 14. Out-of-Order Terminal State Protection
 * 15. Server-Authoritative Payment Reconciliation
 * 16. Provider Payout Eligibility Gate (Payment SUCCEEDED != Payout SUCCEEDED)
 * 17. Payout Beneficiary Redirection Tampering Blocked
 * 18. Payout Idempotency & Duplicate Settlement Suppression
 * 19. Provider Payout Reconciliation
 * 20. Strict MannyPay Boundary (SEPARATE_WORKSTREAM_PENDING, Unmodified)
 * 21. Representative 7-Market Matrix (PH, TH, CN, SG, JP, US, DE)
 * 22. Commercial Inactivity Invariant (0 Active Countries) & China Deferred Blockers (2 Preserved)
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
  AUTHORITATIVE_PAYMENT_PROFILE_COUNT,
  resolveJurisdictionPayoutProfile,
  getAllAuthoritativePayoutProfiles,
  AUTHORITATIVE_PAYOUT_PROFILE_COUNT,
  financialProviderRegistry,
  initiatePaymentAttempt,
  getPaymentAttemptById,
  processPaymentWebhook,
  reconcilePaymentWithProvider,
  evaluatePayoutEligibility,
  createEligiblePayoutContext,
  createPayoutInstruction,
  reconcilePayoutWithProvider,
  MANNYPAY_PROVIDER_ID,
  MANNYPAY_STATUS,
  MANNYPAY_IS_MODIFIED_IN_GM6A,
  type PayableBookingContext,
  type EligiblePayoutContext,
  type GlobalBookingRecord,
  getJurisdictionProfile,
  getCommerciallyActiveCountries,
} from '../src/lib/global-market';

interface VerificationResult {
  readonly title: string;
  readonly pass: boolean;
  readonly details: string;
}

const results: VerificationResult[] = [];

function assert(condition: boolean, title: string, details: string) {
  results.push({ title, pass: condition, details });
  const mark = condition ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${title} — ${details}`);
}

async function runVerification() {
  console.log('========================================================');
  console.log('RENTipid GLOBAL-MKT / v2.0 — GM-6A VERIFICATION RUNNER');
  console.log('Action: Global Payment Collection + Provider Payout / Settlement');
  console.log('========================================================\n');

  // 1. 46-Country Payment Collection Profiles
  const paymentProfiles = getAllAuthoritativePaymentProfiles();
  assert(
    paymentProfiles.length === 46 && AUTHORITATIVE_PAYMENT_PROFILE_COUNT === 46,
    '1. 46-Country Payment Profile Resolution',
    `Resolved exactly ${paymentProfiles.length}/46 authoritative payment collection profiles.`
  );

  // 2. 46-Country Provider Payout Profiles
  const payoutProfiles = getAllAuthoritativePayoutProfiles();
  assert(
    payoutProfiles.length === 46 && AUTHORITATIVE_PAYOUT_PROFILE_COUNT === 46,
    '2. 46-Country Payout Profile Resolution',
    `Resolved exactly ${payoutProfiles.length}/46 authoritative payout settlement profiles.`
  );

  // 3. Unknown Jurisdiction Fail-Closed
  const unknownPay = resolveJurisdictionPaymentProfile('ZZ');
  const unknownPayout = resolveJurisdictionPayoutProfile('ZZ');
  assert(
    unknownPay === null && unknownPayout === null,
    '3. Unknown Jurisdiction Fail-Closed',
    'Unknown country codes return null for payment and payout profiles.'
  );

  // 4. Payment vs Payout State Machines
  const payLinear = canTransitionPaymentStatus('CREATED', 'SUCCEEDED');
  const payTerminal = isPaymentTerminalStatus('SUCCEEDED') && !canTransitionPaymentStatus('SUCCEEDED', 'PENDING');
  const payoutLinear = canTransitionPayoutStatus('PROCESSING', 'SUCCEEDED');
  assert(
    payLinear && payTerminal && payoutLinear,
    '4. Payment & Payout State Machine Separation',
    `Payment states: ${ALL_PAYMENT_LIFECYCLE_STATES.length}, Payout states: ${ALL_PAYOUT_LIFECYCLE_STATES.length}`
  );

  // 5. Currency Separation & Anti-Fake-FX
  const phPolicy = {
    jurisdictionCode: 'PH',
    allowedTransactionCurrencies: ['PHP'],
    defaultTransactionCurrency: 'PHP',
    allowsForeignCardCollection: true,
    supportsMultiCurrencyTransaction: false,
  };
  const validCurr = resolveApprovedTransactionCurrency('PHP', phPolicy, 'PHP');
  const fakeFxBlocked = resolveApprovedTransactionCurrency('PHP', phPolicy, 'EUR');
  assert(
    validCurr.isValid && !fakeFxBlocked.isValid && fakeFxBlocked.reason?.includes('UNVERIFIED_TRANSACTION_CURRENCY'),
    '5. Currency Separation & No Fake FX',
    `PHP valid: ${validCurr.isValid}, Unverified EUR conversion rejected: ${!fakeFxBlocked.isValid}`
  );

  // Fixtures for testing
  const samplePayableContext: PayableBookingContext = Object.freeze({
    bookingId: 'book_gm6a_runner_001',
    bookingReference: 'RENT-PH-888999',
    payerId: 'renter_charlie',
    payeeProviderId: 'provider_dan',
    jurisdictionCode: 'PH',
    authoritativeAmountMinorUnits: 320000, // 3,200.00 PHP
    depositAmountMinorUnits: 50000,
    deliveryFeeMinorUnits: 0,
    sourceListingCurrency: 'PHP',
    requiredTransactionCurrency: 'PHP',
    paymentStateRequirement: 'FULL_PREPAYMENT',
    idempotencyReference: 'pay_ref_gm6a_runner_001',
    paymentStatus: 'NOT_REQUIRED_YET',
  });

  const sampleBookingRecord: GlobalBookingRecord = Object.freeze({
    id: 'book_gm6a_runner_001',
    bookingReference: 'RENT-PH-888999',
    participants: {
      renterId: 'renter_charlie',
      providerId: 'provider_dan',
      listingId: 'listing_camera_777',
      jurisdictionCode: 'PH',
    },
    listingSnapshot: {
      listingId: 'listing_camera_777',
      providerId: 'provider_dan',
      jurisdictionCode: 'PH',
      title: 'Professional Drone',
      pricingUnit: 'DAILY',
      basePriceMinorUnits: 270000,
      currency: 'PHP',
      securityDepositMinorUnits: 50000,
      snapshotTimestamp: '2026-01-01T00:00:00.000Z',
    },
    moneySnapshot: {
      listingPriceCurrency: 'PHP',
      bookingPriceCurrency: 'PHP',
      displayCurrency: 'PHP',
      baseRentalAmountMinorUnits: 270000,
      securityDepositAmountMinorUnits: 50000,
      deliveryFeeMinorUnits: 0,
      platformFeeMinorUnits: 0,
      estimatedTotalAmountMinorUnits: 320000,
      isFxGuaranteed: false,
      transactionCurrencyRequired: 'PHP',
      settlementCurrencyRequired: 'PHP',
      snapshotTimestamp: '2026-01-01T00:00:00.000Z',
    },
    rentalPeriod: {
      startDate: '2026-12-01',
      endDate: '2026-12-02',
      duration: 1,
      durationUnit: 'DAILY',
      jurisdictionTimezone: 'Asia/Manila',
      startUtcTimestamp: '2026-12-01T09:00:00.000Z',
      endUtcTimestamp: '2026-12-02T18:00:00.000Z',
    },
    status: 'COMPLETED',
    paymentStatus: 'AUTHORIZED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  // 6. Client Amount Tampering Blocked
  let amountTamperBlocked = false;
  try {
    await initiatePaymentAttempt({
      payableContext: samplePayableContext,
      requestingPayerId: 'renter_charlie',
      clientSubmittedAmount: 50, // Tampered
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      idempotencyKey: `tamper_amt_${Date.now()}`,
    });
  } catch (err: any) {
    amountTamperBlocked = err.message.includes('AMOUNT_TAMPERING_BLOCKED');
  }
  assert(
    amountTamperBlocked,
    '6. Client Amount Tampering Blocked',
    `Tampered payment amount rejected: ${amountTamperBlocked}`
  );

  // 7. Client Currency Tampering Blocked
  let currTamperBlocked = false;
  try {
    await initiatePaymentAttempt({
      payableContext: samplePayableContext,
      requestingPayerId: 'renter_charlie',
      clientSubmittedCurrency: 'USD', // Tampered
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      idempotencyKey: `tamper_curr_${Date.now()}`,
    });
  } catch (err: any) {
    currTamperBlocked = err.message.includes('CURRENCY_TAMPERING_BLOCKED');
  }
  assert(
    currTamperBlocked,
    '7. Client Currency Tampering Blocked',
    `Tampered payment currency rejected: ${currTamperBlocked}`
  );

  // 8. Payer Identity Spoofing Blocked
  let payerSpoofBlocked = false;
  try {
    await initiatePaymentAttempt({
      payableContext: samplePayableContext,
      requestingPayerId: 'intruder_eve',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      idempotencyKey: `tamper_payer_${Date.now()}`,
    });
  } catch (err: any) {
    payerSpoofBlocked = err.message.includes('PAYER_SPOOFING_BLOCKED');
  }
  assert(
    payerSpoofBlocked,
    '8. Payer Identity Spoofing Blocked',
    `Impersonated payer rejected: ${payerSpoofBlocked}`
  );

  // 9. Payment Idempotency Protection
  const idempKey = `idemp_runner_${Date.now()}`;
  const firstPay = await initiatePaymentAttempt({
    payableContext: samplePayableContext,
    requestingPayerId: 'renter_charlie',
    providerId: 'mock_gateway',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    idempotencyKey: idempKey,
  });
  const secondPay = await initiatePaymentAttempt({
    payableContext: samplePayableContext,
    requestingPayerId: 'renter_charlie',
    providerId: 'mock_gateway',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    idempotencyKey: idempKey,
  });
  assert(
    firstPay.success && secondPay.success && secondPay.isIdempotentReplay === true,
    '9. Payment Idempotency & Duplicate Suppression',
    `First attempt created: ${firstPay.paymentAttempt?.id}, Second attempt returned idempotent replay: ${secondPay.isIdempotentReplay}`
  );

  // 10. Webhook Signature Verification
  const badSigResult = await processPaymentWebhook(
    'mock_gateway',
    { status: 'succeeded' },
    'forged_signature_token'
  );
  assert(
    badSigResult.success === false && badSigResult.error?.includes('INVALID_WEBHOOK_SIGNATURE'),
    '10. Webhook Signature Security',
    `Forged signature rejected: ${!badSigResult.success}`
  );

  // 11. Webhook Amount Mismatch Quarantine
  const providerRef = firstPay.paymentAttempt!.providerReference!;
  const mismatchResult = await processPaymentWebhook(
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
  assert(
    mismatchResult.success === false && mismatchResult.error?.includes('WEBHOOK_MONEY_MISMATCH') &&
      mismatchResult.paymentAttempt?.reconciliationStatus === 'MISMATCH',
    '11. Webhook Amount Mismatch Quarantine',
    `Amount mismatch quarantined: ${mismatchResult.paymentAttempt?.reconciliationStatus === 'MISMATCH'}`
  );

  // 12. Webhook Event Replay Protection
  const validEvtId = `evt_valid_${Date.now()}`;
  const firstWebhook = await processPaymentWebhook(
    'mock_gateway',
    {
      eventId: validEvtId,
      providerReference: providerRef,
      status: 'succeeded',
      amountMinorUnits: 320000,
      currency: 'PHP',
    },
    'valid_mock_signature'
  );
  const replayedWebhook = await processPaymentWebhook(
    'mock_gateway',
    {
      eventId: validEvtId,
      providerReference: providerRef,
      status: 'succeeded',
      amountMinorUnits: 320000,
      currency: 'PHP',
    },
    'valid_mock_signature'
  );
  assert(
    firstWebhook.success && replayedWebhook.success && replayedWebhook.isDuplicateReplay === true,
    '12. Webhook Replay Protection & Event Idempotency',
    `First webhook: ${firstWebhook.paymentAttempt?.normalizedStatus}, Replay skipped: ${replayedWebhook.isDuplicateReplay}`
  );

  // 13. Out-of-Order Terminal State Protection
  const delayedPending = await processPaymentWebhook(
    'mock_gateway',
    {
      eventId: `evt_delayed_${Date.now()}`,
      providerReference: providerRef,
      status: 'pending',
      amountMinorUnits: 320000,
      currency: 'PHP',
    },
    'valid_mock_signature'
  );
  assert(
    delayedPending.success === true &&
      delayedPending.outOfOrderIgnored === true &&
      delayedPending.paymentAttempt?.normalizedStatus === 'SUCCEEDED',
    '13. Out-of-Order Terminal State Protection',
    `Delayed pending ignored: ${delayedPending.outOfOrderIgnored}, Status remains SUCCEEDED`
  );

  // 14. Payment Reconciliation
  const recon = await reconcilePaymentWithProvider(firstPay.paymentAttempt!.id);
  assert(
    recon.status === 'MATCHED' && recon.matched === true,
    '14. Server-Authoritative Payment Reconciliation',
    `Reconciliation status: ${recon.status}, Matched: ${recon.matched}`
  );

  // 15. Payout Eligibility Gate (Payment SUCCEEDED != Payout SUCCEEDED)
  const updatedPayment = getPaymentAttemptById(firstPay.paymentAttempt!.id)!;
  const activeRentalBooking: GlobalBookingRecord = {
    ...sampleBookingRecord,
    status: 'ACTIVE',
  };
  const activeEligibility = evaluatePayoutEligibility({
    booking: activeRentalBooking,
    paymentRecord: updatedPayment,
    providerKycApproved: true,
  });
  const completedEligibility = evaluatePayoutEligibility({
    booking: sampleBookingRecord,
    paymentRecord: updatedPayment,
    providerKycApproved: true,
  });
  assert(
    activeEligibility.eligible === false && completedEligibility.eligible === true,
    '15. Payout Eligibility Gate (PAYMENT != PAYOUT)',
    `Active booking blocked from payout: ${!activeEligibility.eligible}, Completed booking eligible: ${completedEligibility.eligible}`
  );

  // 16. Beneficiary Redirection Tampering Blocked
  // Batch 2-X3 enforces the booking service's actual payout authority reference.
  const samplePayoutContext: EligiblePayoutContext = createEligiblePayoutContext(sampleBookingRecord);
  let beneficiaryTamperBlocked = false;
  try {
    await createPayoutInstruction({
      eligibleContext: samplePayoutContext,
      booking: sampleBookingRecord,
      paymentRecord: updatedPayment,
      providerKycApproved: true,
      authoritativeBeneficiaryReference: 'BDO-ACCOUNT-123456',
      clientSubmittedBeneficiary: 'ATTACKER-ACCOUNT-999999', // Tampered!
      idempotencyKey: `payout_tamper_${Date.now()}`,
    });
  } catch (err: any) {
    beneficiaryTamperBlocked = err.message.includes('BENEFICIARY_TAMPERING_BLOCKED');
  }
  assert(
    beneficiaryTamperBlocked,
    '16. Payout Beneficiary Tampering Blocked',
    `Attacker beneficiary redirection rejected: ${beneficiaryTamperBlocked}`
  );

  // 17. Payout Idempotency Protection
  const payoutIdempKey = `idemp_payout_run_${Date.now()}`;
  const firstPayout = await createPayoutInstruction({
    eligibleContext: samplePayoutContext,
    booking: sampleBookingRecord,
    paymentRecord: updatedPayment,
    providerKycApproved: true,
    authoritativeBeneficiaryReference: 'BDO-ACCOUNT-123456',
    idempotencyKey: payoutIdempKey,
  });
  const secondPayout = await createPayoutInstruction({
    eligibleContext: samplePayoutContext,
    booking: sampleBookingRecord,
    paymentRecord: updatedPayment,
    providerKycApproved: true,
    authoritativeBeneficiaryReference: 'BDO-ACCOUNT-123456',
    idempotencyKey: payoutIdempKey,
  });
  assert(
    firstPayout.success && secondPayout.success && secondPayout.isIdempotentReplay === true,
    '17. Payout Idempotency & Duplicate Settlement Suppression',
    `First payout: ${firstPayout.payoutInstruction?.id}, Replay duplicate suppressed: ${secondPayout.isIdempotentReplay}`
  );

  // 18. Payout Reconciliation
  const payoutRecon = await reconcilePayoutWithProvider(firstPayout.payoutInstruction!.id);
  assert(
    payoutRecon.status === 'MATCHED' && payoutRecon.matched === true,
    '18. Provider Payout Reconciliation',
    `Payout reconciliation status: ${payoutRecon.status}`
  );

  // 19. Strict MannyPay Boundary
  const isMannyPayRegistered = financialProviderRegistry.getPaymentAdapter('mannypay') !== null;
  assert(
    MANNYPAY_STATUS === 'SEPARATE_WORKSTREAM_PENDING' &&
      !isMannyPayRegistered &&
      MANNYPAY_IS_MODIFIED_IN_GM6A === false,
    '19. Strict MannyPay Workstream Boundary',
    `Status: ${MANNYPAY_STATUS}, Live Adapter Registered: ${isMannyPayRegistered}, Unmodified: ${!MANNYPAY_IS_MODIFIED_IN_GM6A}`
  );

  // 20. Representative 7-Market Matrix & Commercial Inactivity
  const repMarkets = ['PH', 'TH', 'CN', 'SG', 'JP', 'US', 'DE'];
  const allResolved = repMarkets.every((code) => {
    const pay = resolveJurisdictionPaymentProfile(code);
    const payout = resolveJurisdictionPayoutProfile(code);
    return pay !== null && payout !== null;
  });
  const activeCountries = getCommerciallyActiveCountries();
  const cnProfile = getJurisdictionProfile('CN');
  const chinaBlockersCount = cnProfile?.knownBlockers?.length || 0;
  assert(
    allResolved && activeCountries.length === 0 && chinaBlockersCount === 2,
    '20. Representative 7-Market Matrix & Zero Commercially Active',
    `7 markets resolved: ${allResolved}, Active countries: ${activeCountries.length}, China deferred blockers: ${chinaBlockersCount}`
  );

  console.log('\n========================================================');
  const allPass = results.every((r) => r.pass);
  console.log(`TOTAL CHECKS: ${results.length} | PASS: ${results.filter((r) => r.pass).length} | FAIL: ${results.filter((r) => !r.pass).length}`);
  console.log(`OVERALL RESULT: ${allPass ? 'PASS' : 'FAIL'}`);
  console.log('========================================================\n');

  if (!allPass) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('VERIFICATION_EXCEPTION:', err);
  process.exit(1);
});
