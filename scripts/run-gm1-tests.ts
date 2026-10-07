/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-1 Targeted Verification & Acceptance Runner
 *
 * Runs verification across:
 * 1. GM-1 Criteria A through S (Section 28)
 * 2. GLCC Compatibility & Invariant Checks (Section 30)
 * 3. Security / Fail-Closed Checks (Section 35)
 * 4. Generates execution evidence summary
 */

import {
  ALL_MARKET_CAPABILITIES,
  ALL_CAPABILITY_STATUSES,
  ALL_ACTIVATION_STATES,
  MANDATORY_MARKET_CAPABILITIES,
  OWNER_LIFECYCLE_MAPPING,
  type MarketCapability,
  type MarketCapabilityRecord,
  type JurisdictionProfile,
  evaluateJurisdictionActivation,
  canActivateJurisdiction,
  getJurisdictionProfile,
  getAllJurisdictionProfiles,
  getMarketCapability,
  getMarketCapabilities,
  getMarketActivationState,
  isCapabilityReady,
  getBlockingCapabilities,
  getValidationRequiredCapabilities,
  evaluateMarketActivation,
  canActivateMarket,
  explainMarketActivationBlockers,
  getAuthoritativeCountryCount,
  getCommerciallyActiveCountries,
  AUTHORITATIVE_COUNTRY_COUNT,
} from '../src/lib/global-market';

import { GLOBAL_COUNTRY_CATALOG } from '../src/lib/glcc/country/country-registry';
import { GLOBAL_LANGUAGE_CATALOG } from '../src/lib/glcc/language/language-registry';
import { GLOBAL_CURRENCY_CATALOG } from '../src/lib/glcc/currency/currency-registry';

interface TestResult {
  criterion: string;
  description: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(criterion: string, description: string, passed: boolean, details?: string) {
  results.push({ criterion, description, passed, details });
  const status = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`[${status}] ${criterion}: ${description}`);
  if (details && !passed) {
    console.log(`       Details: ${details}`);
  }
}

async function runGm1Suite() {
  console.log('========================================================');
  console.log('RENTipid GLOBAL-MKT / v2.0 — GM-1 VERIFICATION SUITE');
  console.log('========================================================\n');

  // A. 46 authoritative jurisdictions resolve
  try {
    const count = getAuthoritativeCountryCount();
    const profiles = getAllJurisdictionProfiles();
    const allResolved =
      count === 46 &&
      profiles.length === 46 &&
      GLOBAL_COUNTRY_CATALOG.every(c => getJurisdictionProfile(c.code) !== null);
    record('Criterion A', '46 authoritative jurisdictions resolve', allResolved);
  } catch (err: any) {
    record('Criterion A', '46 authoritative jurisdictions resolve', false, err.message);
  }

  // B. No 47th invented jurisdiction appears
  try {
    const profiles = getAllJurisdictionProfiles();
    const noUnknown =
      profiles.length === 46 &&
      getJurisdictionProfile('XX') === null &&
      getJurisdictionProfile('FAKE') === null;
    record('Criterion B', 'No 47th invented jurisdiction appears', noUnknown);
  } catch (err: any) {
    record('Criterion B', 'No 47th invented jurisdiction appears', false, err.message);
  }

  // C. All current jurisdictions are initially non-ACTIVE
  try {
    const active = getCommerciallyActiveCountries();
    const profiles = getAllJurisdictionProfiles();
    const allNonActive =
      active.length === 0 &&
      profiles.every(
        p => p.activationState !== 'ACTIVE' && canActivateMarket(p.countryCode) === false
      );
    record('Criterion C', 'All current jurisdictions are initially non-ACTIVE', allNonActive);
  } catch (err: any) {
    record('Criterion C', 'All current jurisdictions are initially non-ACTIVE', false, err.message);
  }

  // D. Language availability alone cannot activate a market
  try {
    const th = getJurisdictionProfile('TH')!;
    const cn = getJurisdictionProfile('CN')!;
    const langAlone =
      th.capabilities.LOCALIZATION.status === 'READY' &&
      canActivateMarket('TH') === false &&
      cn.capabilities.LOCALIZATION.status === 'READY' &&
      canActivateMarket('CN') === false;
    record('Criterion D', 'Language availability alone cannot activate a market', langAlone);
  } catch (err: any) {
    record('Criterion D', 'Language availability alone cannot activate a market', false, err.message);
  }

  // E. Display-currency availability alone cannot activate a market
  try {
    const us = getJurisdictionProfile('US')!;
    const evalResult = evaluateJurisdictionActivation(us);
    const currAlone =
      us.capabilities.DISPLAY_CURRENCY.status === 'READY' &&
      us.capabilities.PRICING.status === 'NOT_CONFIGURED' &&
      canActivateMarket('US') === false &&
      evalResult.blockers.some(b => b.code === 'DISPLAY_CURRENCY_WITHOUT_PRICING');
    record('Criterion E', 'Display-currency availability alone cannot activate a market', currAlone);
  } catch (err: any) {
    record('Criterion E', 'Display-currency availability alone cannot activate a market', false, err.message);
  }

  // F. GLCC Production availability alone cannot activate a market
  try {
    const cn = getJurisdictionProfile('CN')!;
    const th = getJurisdictionProfile('TH')!;
    const glccProd =
      cn.glccAvailable === true &&
      canActivateMarket('CN') === false &&
      th.glccAvailable === true &&
      canActivateMarket('TH') === false;
    record('Criterion F', 'GLCC Production availability alone cannot activate a market', glccProd);
  } catch (err: any) {
    record('Criterion F', 'GLCC Production availability alone cannot activate a market', false, err.message);
  }

  // G. Payment READY + payout BLOCKED cannot activate
  try {
    const ph = getJurisdictionProfile('PH')!;
    const mockProfile: JurisdictionProfile = {
      ...ph,
      capabilities: {
        ...ph.capabilities,
        PAYMENT_COLLECTION: { capability: 'PAYMENT_COLLECTION', status: 'READY', isMandatory: true },
        PROVIDER_PAYOUT: { capability: 'PROVIDER_PAYOUT', status: 'BLOCKED', isMandatory: true },
      },
    };
    const evalResult = evaluateJurisdictionActivation(mockProfile);
    const passed =
      canActivateJurisdiction(mockProfile) === false &&
      evalResult.blockers.some(b => b.code === 'PAYMENT_WITHOUT_PAYOUT') &&
      evalResult.blockers.some(b => b.code === 'CAPABILITY_BLOCKED');
    record('Criterion G', 'Payment READY + payout BLOCKED cannot activate', passed);
  } catch (err: any) {
    record('Criterion G', 'Payment READY + payout BLOCKED cannot activate', false, err.message);
  }

  // H. Payment READY + payout NOT_CONFIGURED cannot activate
  try {
    const ph = getJurisdictionProfile('PH')!;
    const evalResult = evaluateJurisdictionActivation(ph);
    const passed =
      ph.capabilities.PAYMENT_COLLECTION.status === 'READY' &&
      ph.capabilities.PROVIDER_PAYOUT.status === 'NOT_CONFIGURED' &&
      canActivateMarket('PH') === false &&
      evalResult.blockers.some(b => b.code === 'PAYMENT_WITHOUT_PAYOUT');
    record('Criterion H', 'Payment READY + payout NOT_CONFIGURED cannot activate', passed);
  } catch (err: any) {
    record('Criterion H', 'Payment READY + payout NOT_CONFIGURED cannot activate', false, err.message);
  }

  // I. KYC VALIDATION_REQUIRED prevents activation where mandatory
  try {
    const ph = getJurisdictionProfile('PH')!;
    const evalResult = evaluateJurisdictionActivation(ph);
    const passed =
      ph.capabilities.KYC_VERIFICATION.status === 'VALIDATION_REQUIRED' &&
      evalResult.blockers.some(
        b => b.code === 'CAPABILITY_VALIDATION_REQUIRED' && b.capability === 'KYC_VERIFICATION'
      ) &&
      evalResult.blockers.some(b => b.code === 'AUTH_WITHOUT_KYC');
    record('Criterion I', 'KYC VALIDATION_REQUIRED prevents activation where mandatory', passed);
  } catch (err: any) {
    record('Criterion I', 'KYC VALIDATION_REQUIRED prevents activation where mandatory', false, err.message);
  }

  // J. Compliance BLOCKED prevents activation
  try {
    const cn = getJurisdictionProfile('CN')!;
    const evalResult = evaluateJurisdictionActivation(cn);
    const passed =
      cn.capabilities.COMPLIANCE.status === 'BLOCKED' &&
      evalResult.blockers.some(
        b => b.code === 'CAPABILITY_BLOCKED' && b.capability === 'COMPLIANCE'
      );
    record('Criterion J', 'Compliance BLOCKED prevents activation', passed);
  } catch (err: any) {
    record('Criterion J', 'Compliance BLOCKED prevents activation', false, err.message);
  }

  // K. Restricted-category policy missing prevents activation if mandatory
  try {
    const us = getJurisdictionProfile('US')!;
    const evalResult = evaluateJurisdictionActivation(us);
    const passed =
      us.capabilities.RESTRICTED_CATEGORY_POLICY.status !== 'READY' &&
      evalResult.blockers.some(b => b.capability === 'RESTRICTED_CATEGORY_POLICY');
    record('Criterion K', 'Restricted-category policy missing prevents activation if mandatory', passed);
  } catch (err: any) {
    record('Criterion K', 'Restricted-category policy missing prevents activation if mandatory', false, err.message);
  }

  // L. All mandatory capabilities READY may make activation technically eligible, but must still obey required acceptance state/owner gate
  try {
    const allReadyCaps = Object.fromEntries(
      ALL_MARKET_CAPABILITIES.map(cap => [
        cap,
        { capability: cap, status: 'READY', isMandatory: true } as MarketCapabilityRecord,
      ])
    ) as Record<MarketCapability, MarketCapabilityRecord>;

    const syntheticReady: JurisdictionProfile = {
      countryCode: 'SG',
      marketId: 'MKT-SG',
      glccAvailable: true,
      complianceGroup: 'Singapore',
      operatingRegion: 'APAC',
      activationState: 'PRODUCTION_ACCEPTED',
      capabilities: allReadyCaps,
      kycProfileRef: { status: 'CONFIGURED' },
      addressProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      listingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      paymentProfileRef: { status: 'CONFIGURED' },
      payoutProfileRef: { status: 'CONFIGURED' },
      taxProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      categoryPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      bookingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      refundDepositDisputePolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      privacyDataPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      operationalRestrictions: [],
      knownBlockers: [],
      validationRequirements: [],
    };

    const withoutOwner = evaluateJurisdictionActivation(syntheticReady);
    const withOwner = evaluateJurisdictionActivation(syntheticReady, { ownerApproved: true });
    const passed =
      withoutOwner.eligibleForActivation === true &&
      canActivateJurisdiction(syntheticReady) === false &&
      withoutOwner.blockers.some(b => b.code === 'OWNER_ACCEPTANCE_REQUIRED') &&
      canActivateJurisdiction(syntheticReady, { ownerApproved: true }) === true;
    record('Criterion L', 'All mandatory capabilities READY requires explicit owner gate', passed);
  } catch (err: any) {
    record('Criterion L', 'All mandatory capabilities READY requires explicit owner gate', false, err.message);
  }

  // M. SUSPENDED market cannot be ACTIVE
  try {
    const allReadyCaps = Object.fromEntries(
      ALL_MARKET_CAPABILITIES.map(cap => [
        cap,
        { capability: cap, status: 'READY', isMandatory: true } as MarketCapabilityRecord,
      ])
    ) as Record<MarketCapability, MarketCapabilityRecord>;

    const suspended: JurisdictionProfile = {
      countryCode: 'SG',
      marketId: 'MKT-SG',
      glccAvailable: true,
      complianceGroup: 'Singapore',
      operatingRegion: 'APAC',
      activationState: 'SUSPENDED',
      capabilities: allReadyCaps,
      kycProfileRef: { status: 'CONFIGURED' },
      addressProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      listingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      paymentProfileRef: { status: 'CONFIGURED' },
      payoutProfileRef: { status: 'CONFIGURED' },
      taxProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      categoryPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      bookingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      refundDepositDisputePolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      privacyDataPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      operationalRestrictions: [],
      knownBlockers: [],
      validationRequirements: [],
    };

    const evalResult = evaluateJurisdictionActivation(suspended, { ownerApproved: true });
    const passed =
      canActivateJurisdiction(suspended, { ownerApproved: true }) === false &&
      evalResult.blockers.some(b => b.code === 'STATE_SUSPENDED');
    record('Criterion M', 'SUSPENDED market cannot be ACTIVE', passed);
  } catch (err: any) {
    record('Criterion M', 'SUSPENDED market cannot be ACTIVE', false, err.message);
  }

  // N. BLOCKED market cannot be ACTIVE
  try {
    const allReadyCaps = Object.fromEntries(
      ALL_MARKET_CAPABILITIES.map(cap => [
        cap,
        { capability: cap, status: 'READY', isMandatory: true } as MarketCapabilityRecord,
      ])
    ) as Record<MarketCapability, MarketCapabilityRecord>;

    const blocked: JurisdictionProfile = {
      countryCode: 'SG',
      marketId: 'MKT-SG',
      glccAvailable: true,
      complianceGroup: 'Singapore',
      operatingRegion: 'APAC',
      activationState: 'BLOCKED',
      capabilities: allReadyCaps,
      kycProfileRef: { status: 'CONFIGURED' },
      addressProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      listingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      paymentProfileRef: { status: 'CONFIGURED' },
      payoutProfileRef: { status: 'CONFIGURED' },
      taxProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      categoryPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      bookingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      refundDepositDisputePolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      privacyDataPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      operationalRestrictions: [],
      knownBlockers: [],
      validationRequirements: [],
    };

    const evalResult = evaluateJurisdictionActivation(blocked, { ownerApproved: true });
    const passed =
      canActivateJurisdiction(blocked, { ownerApproved: true }) === false &&
      evalResult.blockers.some(b => b.code === 'STATE_BLOCKED');
    record('Criterion N', 'BLOCKED market cannot be ACTIVE', passed);
  } catch (err: any) {
    record('Criterion N', 'BLOCKED market cannot be ACTIVE', false, err.message);
  }

  // O. Unknown country fails closed
  try {
    const passed =
      getJurisdictionProfile('ZZ') === null &&
      canActivateMarket('ZZ') === false &&
      evaluateMarketActivation('ZZ').eligibleForActivation === false &&
      evaluateMarketActivation('ZZ').failClosedReason === 'MISSING_OR_INVALID_PROFILE';
    record('Criterion O', 'Unknown country fails closed', passed);
  } catch (err: any) {
    record('Criterion O', 'Unknown country fails closed', false, err.message);
  }

  // P. Missing profile fails closed
  try {
    const passed =
      canActivateJurisdiction(null) === false &&
      canActivateJurisdiction(undefined) === false &&
      evaluateJurisdictionActivation(null).failClosedReason === 'MISSING_OR_INVALID_PROFILE';
    record('Criterion P', 'Missing profile fails closed', passed);
  } catch (err: any) {
    record('Criterion P', 'Missing profile fails closed', false, err.message);
  }

  // Q. China remains not commercially active
  try {
    const cn = getJurisdictionProfile('CN')!;
    const passed =
      cn.glccAvailable === true &&
      canActivateMarket('CN') === false &&
      cn.activationState === 'FOUNDATION_READY' &&
      cn.knownBlockers.includes('CN-BLK-001: ICP Filing / Commercial Telecommunications License Requirement (MIIT)') &&
      cn.knownBlockers.includes('CN-BLK-002: Cross-Border Data Transfer / CAC Security Assessment Requirement') &&
      cn.operationalRestrictions.includes('MAINLAND_CHINA_PUBLIC_NETWORK_OPERABILITY_NOT_CLAIMED');
    record('Criterion Q', 'China remains not commercially active with 2 deferred blockers', passed);
  } catch (err: any) {
    record('Criterion Q', 'China remains not commercially active', false, err.message);
  }

  // R. Thailand remains not commercially active
  try {
    const th = getJurisdictionProfile('TH')!;
    const passed =
      th.glccAvailable === true &&
      canActivateMarket('TH') === false &&
      th.activationState === 'FOUNDATION_READY' &&
      th.capabilities.PAYMENT_COLLECTION.status === 'NOT_CONFIGURED' &&
      th.capabilities.PROVIDER_PAYOUT.status === 'NOT_CONFIGURED';
    record('Criterion R', 'Thailand remains not commercially active', passed);
  } catch (err: any) {
    record('Criterion R', 'Thailand remains not commercially active', false, err.message);
  }

  // S. Philippines remains not commercially active
  try {
    const ph = getJurisdictionProfile('PH')!;
    const passed =
      canActivateMarket('PH') === false &&
      ph.activationState !== 'ACTIVE' &&
      ph.capabilities.PROVIDER_PAYOUT.status === 'NOT_CONFIGURED' &&
      ph.capabilities.KYC_VERIFICATION.status === 'VALIDATION_REQUIRED';
    record('Criterion S', 'Philippines remains not commercially active', passed);
  } catch (err: any) {
    record('Criterion S', 'Philippines remains not commercially active', false, err.message);
  }

  // Regression: GLCC Catalog Invariants
  try {
    const countriesCount = GLOBAL_COUNTRY_CATALOG.length;
    const languagesCount = GLOBAL_LANGUAGE_CATALOG.length;
    const currenciesCount = GLOBAL_CURRENCY_CATALOG.length;
    const glccIntact =
      countriesCount === 46 &&
      languagesCount === 47 &&
      currenciesCount === 25 &&
      GLOBAL_COUNTRY_CATALOG.some(c => c.code === 'CN') &&
      GLOBAL_COUNTRY_CATALOG.some(c => c.code === 'TH') &&
      GLOBAL_LANGUAGE_CATALOG.some(l => l.tag === 'zh-Hans') &&
      GLOBAL_LANGUAGE_CATALOG.some(l => l.tag === 'th-TH') &&
      GLOBAL_CURRENCY_CATALOG.some(cur => cur.code === 'CNY') &&
      GLOBAL_CURRENCY_CATALOG.some(cur => cur.code === 'THB');
    record('GLCC Regression', 'GLCC 46 countries, 47 languages, 25 currencies intact', glccIntact);
  } catch (err: any) {
    record('GLCC Regression', 'GLCC compatibility check', false, err.message);
  }

  console.log('\n========================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
  console.log(`FINAL GM-1 TEST RESULT: ${allPassed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
  console.log('========================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runGm1Suite().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
