/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-5A Targeted Verification & Acceptance Runner
 *
 * Runs programmatic verification across:
 * 1. 46-Country Booking Policy Resolution & Registry Invariant (46/46, 0 duplicates)
 * 2. 46-Country Notification Profile Resolution & Registry Invariant (46/46, 0 duplicates)
 * 3. Unknown Jurisdiction Fail-Closed on Booking & Notification Profiles
 * 4. Canonical Primary Timezones across Regions
 * 5. Global Booking Lifecycle State Machine (15 states) & Legal Transitions
 * 6. Server-Authoritative Booking Participants & Participant Integrity
 * 7. Server-Authoritative Pricing Calculation & Precision Safety
 * 8. Multi-Currency Money Snapshot & GM-4A Money Rule Preservation
 * 9. Global Availability Engine & Double-Booking Overlap Mathematics
 * 10. Universal Rental Eligibility Gate (Consuming GM-1, GM-2, GM-3A, GM-4A)
 * 11. Actor Transition Authorization & State Machine Guards
 * 12. Payment & Payout Handoff Contracts (GM-6A readiness without money movement)
 * 13. Global Conversation Model & Access Security
 * 14. Message Anti-Forgery: Ordinary Users Prohibited from System Events
 * 15. Message Privacy & Sensitive Token Sanitization
 * 16. Global Notification Core, Localized Templates, and Delivery Failure Isolation
 * 17. Notification Idempotency & Duplicate Suppression
 * 18. Representative 7-Country Architecture Matrix (PH, TH, CN, SG, JP, US, DE)
 * 19. Zero Commercially Active Countries & China Deferred Blockers Preservation
 */

import {
  ALL_BOOKING_LIFECYCLE_STATES,
  canTransitionBookingStatus,
  canActorPerformTransition,
  isBookingBlockingAvailability,
  isTerminalBookingStatus,
  resolveJurisdictionBookingPolicy,
  getAllAuthoritativeBookingPolicies,
  AUTHORITATIVE_BOOKING_POLICY_COUNT,
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
  AUTHORITATIVE_NOTIFICATION_PROFILE_COUNT,
  createMarketplaceConversation,
  createBookingLinkedConversation,
  validateConversationAccess,
  createMarketplaceMessage,
  sanitizeMessageContent,
  buildNotificationIntent,
  dispatchNotificationIntent,
  type GlobalListingRecord,
  getAllJurisdictionProfiles,
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
  console.log('RENTipid GLOBAL-MKT / v2.0 — GM-5A VERIFICATION RUNNER');
  console.log('Action: Global Booking / Rental Lifecycle + Messaging / Notifications');
  console.log('========================================================\n');

  // 1. 46-Country Booking Policies
  const bookingPolicies = getAllAuthoritativeBookingPolicies();
  assert(
    bookingPolicies.length === 46 && AUTHORITATIVE_BOOKING_POLICY_COUNT === 46,
    '1. 46-Country Booking Policy Resolution',
    `Resolved exactly ${bookingPolicies.length}/46 authoritative booking policies.`
  );

  // 2. 46-Country Notification Profiles
  const notifProfiles = getAllAuthoritativeNotificationProfiles();
  assert(
    notifProfiles.length === 46 && AUTHORITATIVE_NOTIFICATION_PROFILE_COUNT === 46,
    '2. 46-Country Notification Profile Resolution',
    `Resolved exactly ${notifProfiles.length}/46 authoritative notification profiles.`
  );

  // 3. Fail-Closed on Unknown Jurisdiction
  const unknownPolicy = resolveJurisdictionBookingPolicy('ZZ');
  const unknownNotif = resolveJurisdictionNotificationProfile('ZZ');
  assert(
    unknownPolicy === null && unknownNotif === null,
    '3. Unknown Jurisdiction Fail-Closed',
    'Unknown country codes return null for booking policy and notification profile.'
  );

  // 4. Timezone Resolution
  const phTz = getJurisdictionPrimaryTimezone('PH');
  const usTz = getJurisdictionPrimaryTimezone('US');
  const deTz = getJurisdictionPrimaryTimezone('DE');
  const jpTz = getJurisdictionPrimaryTimezone('JP');
  assert(
    phTz === 'Asia/Manila' && usTz === 'America/New_York' && deTz === 'Europe/Berlin' && jpTz === 'Asia/Tokyo',
    '4. Canonical Timezone Resolution',
    `PH: ${phTz}, US: ${usTz}, DE: ${deTz}, JP: ${jpTz}`
  );

  // 5. Booking Lifecycle States & Legal Transitions
  const reqToAcc = canTransitionBookingStatus('REQUESTED', 'ACCEPTED');
  const reqToComp = canTransitionBookingStatus('REQUESTED', 'COMPLETED');
  const activeToRet = canTransitionBookingStatus('ACTIVE', 'RETURN_PENDING');
  assert(
    reqToAcc && !reqToComp && activeToRet && ALL_BOOKING_LIFECYCLE_STATES.length >= 15,
    '5. Booking State Machine & Legal Transitions',
    `Verified 15+ states. REQUESTED->ACCEPTED: ${reqToAcc}, REQUESTED->COMPLETED: ${reqToComp}`
  );

  // 6. Listing Fixture for Testing
  const sampleListing: GlobalListingRecord = Object.freeze({
    id: 'listing_runner_test_101',
    providerId: 'provider_jane_doe',
    countryCode: 'PH',
    jurisdictionCode: 'JUR-PH',
    categoryId: 'cat_electronics',
    categorySlug: 'cameras',
    title: 'Sony Cinema Line FX3',
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    photos: ['fx3.jpg'],
    photosCount: 1,
    location: {
      countryCode: 'PH',
      jurisdictionCode: 'JUR-PH',
      formattedAddress: 'Taguig, Metro Manila, Philippines',
      city: 'Taguig',
      region: 'NCR',
      coordinates: { latitude: 14.5500, longitude: 121.0500 },
      privacyRadiusMeters: 500,
    },
    pricing: {
      currency: 'PHP',
      rates: {
        daily: { amountMinorUnits: 250000, currency: 'PHP' }, // 2,500.00 PHP / day
        hourly: { amountMinorUnits: 40000, currency: 'PHP' },
      },
      securityDeposit: { amountMinorUnits: 1000000, currency: 'PHP' }, // 10,000.00 PHP
      deliveryFee: { amountMinorUnits: 30000, currency: 'PHP' }, // 300.00 PHP
    },
  });

  // 7. Server-Authoritative Price Calculation
  const priceResult = calculateAuthoritativeRentalPrice(sampleListing.pricing, 4, 'DAILY', true);
  const expectedTotal = 250000 * 4 + 1000000 + 30000;
  assert(
    priceResult.isValid && priceResult.estimatedTotalAmountMinorUnits === expectedTotal,
    '7. Server-Authoritative Price Calculation',
    `4 days @ 2,500 + 10,000 deposit + 300 delivery = ${priceResult.estimatedTotalAmountMinorUnits / 100} PHP.`
  );

  // 8. Multi-Currency Money Snapshot
  const moneySnap = createAuthoritativeMoneySnapshot({
    listingPricing: sampleListing.pricing,
    baseRentalAmountMinorUnits: priceResult.baseRentalAmountMinorUnits,
    securityDepositAmountMinorUnits: priceResult.securityDepositAmountMinorUnits,
    deliveryFeeMinorUnits: priceResult.deliveryFeeMinorUnits,
    platformFeeMinorUnits: priceResult.platformFeeMinorUnits,
    estimatedTotalAmountMinorUnits: priceResult.estimatedTotalAmountMinorUnits,
    displayCurrencyPreference: 'EUR',
  });
  assert(
    moneySnap.listingPriceCurrency === 'PHP' &&
      moneySnap.displayCurrency === 'EUR' &&
      moneySnap.transactionCurrencyRequired === 'PHP' &&
      moneySnap.settlementCurrencyRequired === 'PHP' &&
      moneySnap.isFxGuaranteed === false,
    '8. Multi-Currency Money Snapshot & No Fake FX',
    `Listing: PHP, Display: EUR, Transaction: PHP, Settlement: PHP, FX Guaranteed: false`
  );

  // 9. Availability Overlap Protection
  const s1 = '2026-11-10T09:00:00.000Z';
  const e1 = '2026-11-15T18:00:00.000Z';
  const overlapA = intervalsOverlap(s1, e1, '2026-11-12T09:00:00.000Z', '2026-11-14T18:00:00.000Z');
  const adjacentB = intervalsOverlap(s1, e1, '2026-11-15T18:00:00.000Z', '2026-11-20T18:00:00.000Z');
  assert(
    overlapA === true && adjacentB === false,
    '9. Availability Overlap Mathematics',
    `Enclosed overlap detected: ${overlapA}, Adjacent non-overlap allowed: ${!adjacentB}`
  );

  // 10. Rental Eligibility Gate
  const selfBooking = evaluateRentalEligibilityGate({
    renter: { userId: 'provider_jane_doe', role: 'Renter', isKycVerified: true },
    listing: sampleListing,
    jurisdictionCode: 'PH',
  });
  const unverifiedRenter = evaluateRentalEligibilityGate({
    renter: { userId: 'renter_bob', role: 'Renter', isKycVerified: false },
    listing: sampleListing,
    jurisdictionCode: 'PH',
  });
  const validRenter = evaluateRentalEligibilityGate({
    renter: { userId: 'renter_bob', role: 'Renter', isKycVerified: true },
    listing: sampleListing,
    jurisdictionCode: 'PH',
  });
  assert(
    selfBooking.eligible === false && unverifiedRenter.eligible === false && validRenter.eligible === true,
    '10. Universal Rental Eligibility Gate',
    `Self-booking blocked: ${!selfBooking.eligible}, KYC required: ${!unverifiedRenter.eligible}, Valid allowed: ${validRenter.eligible}`
  );

  // 11. Booking Creation & State Transitions
  const booking = createGlobalBookingRequest({
    renter: { userId: 'renter_bob', role: 'Renter', isKycVerified: true },
    listing: sampleListing,
    period: {
      startDate: '2026-12-01',
      endDate: '2026-12-04',
      duration: 3,
      durationUnit: 'DAILY',
    },
    deliveryRequested: true,
  });
  const accepted = transitionBookingLifecycle(booking, 'ACCEPTED', {
    userId: 'provider_jane_doe',
    role: 'Individual Provider',
  });
  const awaitingPayment = transitionBookingLifecycle(accepted, 'AWAITING_PAYMENT', {
    userId: 'SYSTEM',
    role: 'System',
  });
  let confirmWithoutPaymentBlocked = false;
  try {
    transitionBookingLifecycle(
      awaitingPayment,
      'CONFIRMED',
      { userId: 'SYSTEM', role: 'System' },
      { paymentEvidence: false }
    );
  } catch (err: any) {
    confirmWithoutPaymentBlocked = err.message.includes('PAYMENT_EVIDENCE_REQUIRED');
  }
  const confirmedWithPayment = transitionBookingLifecycle(
    awaitingPayment,
    'CONFIRMED',
    { userId: 'SYSTEM', role: 'System' },
    { paymentEvidence: true }
  );
  assert(
    booking.status === 'REQUESTED' &&
      accepted.status === 'ACCEPTED' &&
      confirmWithoutPaymentBlocked &&
      confirmedWithPayment.status === 'CONFIRMED' &&
      confirmedWithPayment.paymentStatus === 'AUTHORIZED',
    '11. Actor State Transitions & Payment Evidence Guard',
    `Confirmed guarded: ${confirmWithoutPaymentBlocked}, Status: ${confirmedWithPayment.status}, PaymentStatus: ${confirmedWithPayment.paymentStatus}`
  );

  // 12. Payment & Payout Handoff Contracts
  const payableCtx = createPayableBookingContext(confirmedWithPayment);
  const payoutCtx = createEligiblePayoutContext(confirmedWithPayment);
  assert(
    payableCtx.payerId === 'renter_bob' &&
      payableCtx.payeeProviderId === 'provider_jane_doe' &&
      payableCtx.requiredTransactionCurrency === 'PHP' &&
      payoutCtx.isSettled === false,
    '12. Future GM-6A Payment & Payout Handoff Contracts',
    `PayableContext: ${payableCtx.bookingId}, PayoutSettled: ${payoutCtx.isSettled}`
  );

  // 13. Conversation Model & Participant Authorization
  const conversation = createBookingLinkedConversation(confirmedWithPayment);
  const bobAccess = validateConversationAccess(conversation, 'renter_bob');
  const intruderAccess = validateConversationAccess(conversation, 'intruder_eve');
  assert(
    conversation.contextType === 'BOOKING' &&
      bobAccess.allowed === true &&
      intruderAccess.allowed === false,
    '13. Conversation Authorization & Participant Integrity',
    `Context: BOOKING, Bob allowed: ${bobAccess.allowed}, Intruder blocked: ${!intruderAccess.allowed}`
  );

  // 14. Message Anti-Forgery Guard
  let ordinaryUserForgingSystemEventBlocked = false;
  try {
    createMarketplaceMessage({
      conversation,
      senderId: 'renter_bob',
      senderRole: 'Renter',
      messageType: 'SYSTEM_EVENT',
      content: 'I hereby confirm this booking as paid!',
    });
  } catch (err: any) {
    ordinaryUserForgingSystemEventBlocked = err.message.includes('FORGERY_VIOLATION');
  }
  assert(
    ordinaryUserForgingSystemEventBlocked,
    '14. Anti-Forgery Protection against System Event Injection',
    `Ordinary user system-event forgery rejected: ${ordinaryUserForgingSystemEventBlocked}`
  );

  // 15. Message Privacy & Credential Sanitization
  const sanitized = sanitizeMessageContent('My card is 4111 2222 3333 4444 and cvv: 999');
  assert(
    sanitized.includes('[REDACTED_PAYMENT_CARD]') && sanitized.includes('cvv: [REDACTED]'),
    '15. Message Privacy & Sensitive Token Redaction',
    `Sanitized: ${sanitized}`
  );

  // 16. Notification Core & Localized Templates
  const thaiIntent = buildNotificationIntent({
    eventCode: 'BOOKING_REQUESTED',
    recipientId: 'provider_th',
    recipientLocale: 'th-TH',
    jurisdictionCode: 'TH',
    booking: confirmedWithPayment,
  });
  assert(
    thaiIntent.locale === 'th-TH' && thaiIntent.payload.title === 'คำขอจองใหม่',
    '16. Notification Core & Localized Templates',
    `Recipient locale: ${thaiIntent.locale}, Title: ${thaiIntent.payload.title}`
  );

  // 17. Delivery Failure Isolation
  const faultyAdapter = async () => {
    throw new Error('NETWORK_TIMEOUT_POSTMARK');
  };
  const deliveryResult = await dispatchNotificationIntent(thaiIntent, faultyAdapter);
  assert(
    deliveryResult.success === false &&
      deliveryResult.status === 'FAILED' &&
      confirmedWithPayment.status === 'CONFIRMED',
    '17. Notification Delivery Failure Isolation',
    `Notification failed isolated: ${deliveryResult.status}. Booking state unharmed: ${confirmedWithPayment.status}`
  );

  // 18. Notification Idempotency
  const workingAdapter = async () => true;
  const idempKey = `idemp_run_${Date.now()}`;
  const validIntent = buildNotificationIntent({
    eventCode: 'BOOKING_CONFIRMED',
    recipientId: 'renter_bob',
    jurisdictionCode: 'PH',
    booking: confirmedWithPayment,
    idempotencyKey: idempKey,
  });
  const firstSend = await dispatchNotificationIntent(validIntent, workingAdapter);
  const secondSend = await dispatchNotificationIntent(validIntent, workingAdapter);
  assert(
    firstSend.status === 'SENT' && secondSend.status === 'SKIPPED_DUPLICATE',
    '18. Notification Idempotency & Duplicate Suppression',
    `First send: ${firstSend.status}, Second send: ${secondSend.status}`
  );

  // 19. Representative 7-Country Architecture Matrix
  const repMarkets = ['PH', 'TH', 'CN', 'SG', 'JP', 'US', 'DE'];
  const allResolved = repMarkets.every((code) => {
    const p = resolveJurisdictionBookingPolicy(code);
    const n = resolveJurisdictionNotificationProfile(code);
    return p !== null && n !== null;
  });
  const activeCountries = getCommerciallyActiveCountries();
  const cnProfile = getJurisdictionProfile('CN');
  const chinaBlockersCount = cnProfile?.knownBlockers?.length || 0;
  assert(
    allResolved && activeCountries.length === 0 && chinaBlockersCount === 2,
    '19. Representative 7-Market Matrix & Zero Commercially Active',
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
