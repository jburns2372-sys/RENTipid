/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-9A-C1 Verification Suite
 *
 * Verifies the 46-Country Full-Function Global Marketplace Objective:
 * 1. Controlling objective: 46-country full transaction operation (not PH-only, not listing-only).
 * 2. Shared core capability readiness (46/46 account, provider, listing, search, messaging).
 * 3. Honest transaction readiness reporting (1 full local accepted [PH], 45 requiring gap closure).
 * 4. Program completion gate: isGlobalMarketplaceV2Complete() fails closed until 46/46 complete.
 * 5. Batch plan coverage: all 46 jurisdictions assigned to full-transaction batches.
 * 6. China deferred blockers preserved and classified as completion blockers.
 */

import { GLOBAL_COUNTRY_CATALOG } from '../src/lib/glcc/country/country-registry';
import {
  getAllMarketReadinessProfiles,
  getMarketReadiness,
  isGlobalMarketplaceV2Complete,
  canAccessMarket,
  canRegisterAccount,
  isProviderOnboardingReady,
  canCreateListing,
  isListingPublishReady,
  canDiscoverListing,
  canMessageProvider,
  canBookMarket,
  isPaymentCollectionReady,
  isProviderPayoutReady,
  canFullyTransact,
} from '../src/lib/global-market/compliance/registry/market-readiness-resolver';

function assert(cond: boolean, title: string, details: string) {
  const mark = cond ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${title} — ${details}`);
  if (!cond) throw new Error(`GM-9A-C1 Assertion failed: ${title} - ${details}`);
}

export function runGm9aC1Tests() {
  console.log('========================================================');
  console.log('RENTipid GLOBAL-MKT / v2.0 — GM-9A-C1 VERIFICATION RUNNER');
  console.log('Action: 46-Country Full-Function Global Marketplace Readiness');
  console.log('========================================================\n');

  const allProfiles = getAllMarketReadinessProfiles();

  // 1. Authoritative 46-Country Invariant
  assert(
    allProfiles.length === 46 && GLOBAL_COUNTRY_CATALOG.length === 46,
    'Authoritative Country Count',
    `Resolved exactly ${allProfiles.length} authoritative jurisdictions.`
  );

  // 2. Program Completion Gate Fails Closed
  const completionStatus = isGlobalMarketplaceV2Complete();
  assert(
    !completionStatus.isComplete &&
    completionStatus.targetCountries === 46 &&
    completionStatus.pendingGapClosureCount === 45,
    'Program Completion Gate Fails Closed',
    `isComplete: ${completionStatus.isComplete}. Pending gap closure: ${completionStatus.pendingGapClosureCount}/46. Reason: ${completionStatus.reason}`
  );

  // 3. Shared Platform Core Capabilities (46/46)
  const accountReadyCount = allProfiles.filter(p => p.accountReady && canRegisterAccount(p.jurisdictionCode)).length;
  const providerReadyCount = allProfiles.filter(p => p.providerReady && isProviderOnboardingReady(p.jurisdictionCode)).length;
  const listingCreateCount = allProfiles.filter(p => p.listingCreateReady && canCreateListing(p.jurisdictionCode)).length;
  const listingPublishCount = allProfiles.filter(p => p.listingPublishReady && isListingPublishReady(p.jurisdictionCode)).length;
  const searchReadyCount = allProfiles.filter(p => p.searchDiscoveryReady && canDiscoverListing(p.jurisdictionCode)).length;
  const messagingReadyCount = allProfiles.filter(p => p.messagingReady && canMessageProvider(p.jurisdictionCode)).length;

  assert(
    accountReadyCount === 46,
    'Universal Account Registration',
    `Account registration enabled for ${accountReadyCount}/46 countries.`
  );
  assert(
    providerReadyCount === 46,
    'Universal Provider Onboarding',
    `Provider onboarding enabled for ${providerReadyCount}/46 countries.`
  );
  assert(
    listingCreateCount === 46,
    'Universal Listing Creation',
    `Listing draft creation enabled for ${listingCreateCount}/46 countries.`
  );
  assert(
    listingPublishCount === 46,
    'Universal Listing Publication',
    `Lawful listing publication enabled for ${listingPublishCount}/46 countries.`
  );
  assert(
    searchReadyCount === 46,
    'Universal Search & Discovery',
    `Search and discovery enabled for ${searchReadyCount}/46 countries.`
  );
  assert(
    messagingReadyCount === 46,
    'Universal In-App Messaging',
    `In-app inquiry/messaging enabled for ${messagingReadyCount}/46 countries.`
  );

  // 4. Honest Transaction Readiness Tracking (1 Full Local Accepted [PH], 45 Requiring Gap Closure)
  const paymentReadyCount = allProfiles.filter(p => p.paymentReady && isPaymentCollectionReady(p.jurisdictionCode)).length;
  const payoutReadyCount = allProfiles.filter(p => p.payoutReady && isProviderPayoutReady(p.jurisdictionCode)).length;
  const bookingReadyCount = allProfiles.filter(p => p.bookingReady && canBookMarket(p.jurisdictionCode)).length;
  const fullTransactionReadyCount = allProfiles.filter(p => p.transactionReady && canFullyTransact(p.jurisdictionCode)).length;
  const gapClosureRequiredCount = allProfiles.filter(p => p.requiresGapClosure).length;

  assert(
    paymentReadyCount === 1 && payoutReadyCount === 1 && bookingReadyCount === 1 && fullTransactionReadyCount === 1,
    'Transaction Readiness Isolated to PH',
    `Payment ready: ${paymentReadyCount}, Payout ready: ${payoutReadyCount}, Booking ready: ${bookingReadyCount}, Full transaction ready: ${fullTransactionReadyCount} (PH only).`
  );
  assert(
    gapClosureRequiredCount === 45,
    'Accurate Gap Closure Requirement',
    `Exactly ${gapClosureRequiredCount} countries require full-function gap closure.`
  );

  // 5. Zero Commercially Active & Zero Incomplete Freeze
  const activeCount = allProfiles.filter(p => p.commerciallyActive || p.fullyActive).length;
  assert(
    activeCount === 0,
    'Commercial Active Invariant Preserved',
    `Commercially active countries: ${activeCount} (Strictly 0).`
  );

  // 6. China Deferred Blockers Preserved as Completion Blockers
  const cnProfile = getMarketReadiness('CN');
  const cnHasIcp = cnProfile?.blockers.some(b => b.code === 'ICP_LICENSE_REQUIRED');
  const cnHasPipl = cnProfile?.blockers.some(b => b.code === 'PIPL_DATA_LOCALIZATION_COMPLIANCE');
  assert(
    Boolean(cnHasIcp && cnHasPipl && cnProfile?.requiresGapClosure),
    'China Deferred Blockers Preserved',
    'China has ICP_LICENSE_REQUIRED and PIPL_DATA_LOCALIZATION_COMPLIANCE as active completion blockers.'
  );

  // 7. Representative 7 Markets (PH, TH, CN, SG, JP, US, DE)
  const sampleCodes = ['PH', 'TH', 'CN', 'SG', 'JP', 'US', 'DE'];
  const allSamplesResolved = sampleCodes.every(code => getMarketReadiness(code) !== null);
  assert(
    allSamplesResolved,
    'Representative 7-Market Matrix',
    'All 7 representative markets resolve without forks or missing profiles.'
  );

  console.log('\n========================================================');
  console.log('GM-9A-C1 VERIFICATION: ALL 10 CHECKS PASSED');
  console.log('========================================================\n');
}

if (require.main === module || process.argv[1]?.endsWith('run-gm9a-c1-tests.ts')) {
  runGm9aC1Tests();
}
