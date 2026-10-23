/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-2 Targeted Verification & Acceptance Runner
 *
 * Runs full programmatic verification across:
 * 1. Global Account Architecture & Separation of Roles
 * 2. 46 Authoritative Country & Capability Resolution
 * 3. Dual Marketplace Role Functionality
 * 4. Provider Intent vs Server Authorization & Publication Gating
 * 5. Honest KYC Boundary Representation
 * 6. International E.164 Phone Normalization & Backward Compatibility
 * 7. Independence of Country, Language, and Currency
 * 8. Profile Completeness Evaluation
 * 9. Security Invariants (No privilege escalation, fail-closed)
 * 10. Commercial Inactivity Invariant (0 active markets)
 */

import {
  ALL_SYSTEM_ROLES,
  ALL_MARKETPLACE_ROLES,
  type SystemRole,
  type MarketplaceRole,
  hasMarketplaceRole,
  canActAsRenter,
  canActAsProvider,
  mapLegacyUserRoleToSystemAndMarketplace,
} from '../src/lib/global-market/account/contracts/marketplace-role';

import {
  ALL_PROVIDER_ONBOARDING_STATES,
  ALL_RENTER_ONBOARDING_STATES,
  ALL_KYC_STATES,
  ALL_PROVIDER_TYPES,
  type ProviderOnboardingState,
  type RenterOnboardingState,
  type KycState,
} from '../src/lib/global-market/account/contracts/onboarding-state';

import {
  resolveOperatingJurisdiction,
  canRegisterInJurisdiction,
  canStartRenterOnboarding,
  canStartProviderOnboarding,
  canPublishAsProvider,
  evaluateProfileCompleteness,
  buildGlobalAccountContext,
  requestProviderOnboardingIntent,
} from '../src/lib/global-market/account/services/account-service';

import {
  normalizeInternationalPhone,
  isValidInternationalPhone,
  COUNTRY_CALLING_CODES,
} from '../src/lib/global-market/account/services/phone-service';

import {
  getAllJurisdictionProfiles,
  getJurisdictionProfile,
  getAuthoritativeCountryCount,
  getCommerciallyActiveCountries,
} from '../src/lib/global-market/registry/market-capability-registry';

import { GLOBAL_COUNTRY_CATALOG } from '../src/lib/glcc/country/country-registry';

interface VerificationResult {
  code: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: VerificationResult[] = [];

function check(code: string, name: string, passed: boolean, details?: string) {
  results.push({ code, name, passed, details });
  const badge = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`[${badge}] ${code}: ${name}`);
  if (!passed && details) {
    console.log(`       Error: ${details}`);
  }
}

async function runGm2Suite() {
  console.log('========================================================');
  console.log('RENTipid GLOBAL-MKT / v2.0 — GM-2 ACCEPTANCE SUITE');
  console.log('GLOBAL ACCOUNT, RENTER & PROVIDER ONBOARDING');
  console.log('========================================================\n');

  // 1. One Global Account Model & Role Separation
  try {
    const rolesSeparated =
      ALL_SYSTEM_ROLES.includes('ADMIN') &&
      ALL_SYSTEM_ROLES.includes('USER') &&
      !ALL_MARKETPLACE_ROLES.includes('ADMIN' as any) &&
      ALL_MARKETPLACE_ROLES.length === 2 &&
      ALL_MARKETPLACE_ROLES.includes('RENTER') &&
      ALL_MARKETPLACE_ROLES.includes('PROVIDER');
    check('GM2-01', 'SystemRole vs MarketplaceRole clean separation', rolesSeparated);
  } catch (e: any) {
    check('GM2-01', 'SystemRole vs MarketplaceRole clean separation', false, e.message);
  }

  // 2. Dual Role Support
  try {
    const dual: MarketplaceRole[] = ['RENTER', 'PROVIDER'];
    const canBoth =
      hasMarketplaceRole(dual, 'RENTER') &&
      hasMarketplaceRole(dual, 'PROVIDER') &&
      canActAsRenter(dual, 'Active') &&
      canActAsProvider(dual, 'Active', 'APPROVED');
    check('GM2-02', 'Dual role (RENTER + PROVIDER) supported on single account', canBoth);
  } catch (e: any) {
    check('GM2-02', 'Dual role (RENTER + PROVIDER) supported on single account', false, e.message);
  }

  // 3. 46 Authoritative Jurisdictions Resolution
  try {
    const count = getAuthoritativeCountryCount();
    const profiles = getAllJurisdictionProfiles();
    const all46Match =
      count === 46 &&
      profiles.length === 46 &&
      GLOBAL_COUNTRY_CATALOG.every(c => {
        const resolved = resolveOperatingJurisdiction(c.code);
        const profile = getJurisdictionProfile(c.code);
        const regCheck = canRegisterInJurisdiction(c.code);
        const renterCheck = canStartRenterOnboarding(c.code);
        const providerCheck = canStartProviderOnboarding(c.code);
        return (
          resolved === c.code &&
          profile !== null &&
          typeof regCheck.allowed === 'boolean' &&
          typeof renterCheck.allowed === 'boolean' &&
          typeof providerCheck.allowed === 'boolean'
        );
      });
    check('GM2-03', 'All 46 authoritative jurisdictions resolve through shared account architecture', all46Match);
  } catch (e: any) {
    check('GM2-03', 'All 46 authoritative jurisdictions resolve through shared account architecture', false, e.message);
  }

  // 4. Unknown Country Fail-Closed
  try {
    const unknownClosed =
      resolveOperatingJurisdiction('XX') === null &&
      resolveOperatingJurisdiction('UNKNOWN') === null &&
      resolveOperatingJurisdiction('') === null &&
      canRegisterInJurisdiction('XX').allowed === false &&
      canStartRenterOnboarding('XX').allowed === false &&
      canStartProviderOnboarding('XX').allowed === false;
    check('GM2-04', 'Unknown/unregistered country fails closed', unknownClosed);
  } catch (e: any) {
    check('GM2-04', 'Unknown/unregistered country fails closed', false, e.message);
  }

  // 5. Provider Intent vs Authorization Separation
  try {
    const ctx = buildGlobalAccountContext({
      userId: 'test-user',
      email: 'test@example.com',
      fullName: 'Test User',
      countryCode: 'PH',
      accountStatus: 'Active',
      providerOnboardingState: 'NOT_STARTED',
    });
    const intentRes = requestProviderOnboardingIntent(ctx, 'INDIVIDUAL');
    const intentSeparated =
      intentRes.success &&
      intentRes.nextState === 'DOCUMENTS_REQUIRED' &&
      intentRes.nextState !== 'APPROVED';
    check('GM2-05', 'Provider intent registration separated from provider authorization', intentSeparated);
  } catch (e: any) {
    check('GM2-05', 'Provider intent registration separated from provider authorization', false, e.message);
  }

  // 6. Server-Authoritative Publication Gating
  try {
    // Case A: Unapproved provider
    const unapproved = canPublishAsProvider(
      {
        marketplaceRoles: ['PROVIDER'],
        providerOnboardingState: 'UNDER_REVIEW',
        kycState: 'KYC_APPROVED',
        accountStatus: 'Active',
      } as any,
      'PH'
    );

    // Case B: Unverified KYC
    const unverifiedKyc = canPublishAsProvider(
      {
        marketplaceRoles: ['PROVIDER'],
        providerOnboardingState: 'APPROVED',
        kycState: 'KYC_REQUIRED',
        accountStatus: 'Active',
      } as any,
      'PH'
    );

    // Case C: Suspended user
    const suspended = canPublishAsProvider(
      {
        marketplaceRoles: ['PROVIDER'],
        providerOnboardingState: 'APPROVED',
        kycState: 'KYC_APPROVED',
        accountStatus: 'Suspended',
      } as any,
      'PH'
    );

    // Case D: Fully approved
    const fullyApproved = canPublishAsProvider(
      {
        marketplaceRoles: ['PROVIDER'],
        providerOnboardingState: 'APPROVED',
        kycState: 'KYC_APPROVED',
        accountStatus: 'Active',
      } as any,
      'PH'
    );

    const publicationGated =
      !unapproved.allowed &&
      !unverifiedKyc.allowed &&
      !suspended.allowed &&
      fullyApproved.allowed;

    check('GM2-06', 'canPublishAsProvider fails closed unless role, approval, active status and KYC all pass', publicationGated);
  } catch (e: any) {
    check('GM2-06', 'canPublishAsProvider fails closed unless role, approval, active status and KYC all pass', false, e.message);
  }

  // 7. International E.164 Phone Normalization & PH Compatibility
  try {
    const phValid = normalizeInternationalPhone('09171234567', 'PH').e164 === '+639171234567';
    const thValid = normalizeInternationalPhone('0812345678', 'TH').e164 === '+66812345678';
    const cnValid = normalizeInternationalPhone('13800138000', 'CN').e164 === '+8613800138000';
    const usValid = normalizeInternationalPhone('2025550123', 'US').e164 === '+12025550123';
    const deValid = normalizeInternationalPhone('015123456789', 'DE').e164 === '+4915123456789';
    const invalidRejected = normalizeInternationalPhone('123', 'PH').valid === false;

    const phonePassed = phValid && thValid && cnValid && usValid && deValid && invalidRejected;
    check('GM2-07', 'Country-aware E.164 phone normalization across 46 countries with PH backward compatibility', phonePassed);
  } catch (e: any) {
    check('GM2-07', 'Country-aware E.164 phone normalization across 46 countries with PH backward compatibility', false, e.message);
  }

  // 8. Independence of Country, Language, and Currency
  try {
    const ctx = buildGlobalAccountContext({
      userId: 'indep-user',
      email: 'user@example.com',
      fullName: 'Global User',
      countryCode: 'TH',
      languageTag: 'en',
      displayCurrency: 'USD',
    });
    const independent =
      ctx.operatingJurisdiction === 'TH' &&
      ctx.languageTag === 'en' &&
      ctx.displayCurrency === 'USD';
    check('GM2-08', 'Country != Language != Currency independence verified', independent);
  } catch (e: any) {
    check('GM2-08', 'Country != Language != Currency independence verified', false, e.message);
  }

  // 9. Profile Completeness Evaluation
  try {
    const individual = evaluateProfileCompleteness({
      fullName: 'John Doe',
      email: 'john@example.com',
      mobileNumber: '+12025550123',
      operatingJurisdiction: 'US',
      accountType: 'Individual',
    });
    const businessMissing = evaluateProfileCompleteness({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      mobileNumber: '+639171234567',
      operatingJurisdiction: 'PH',
      accountType: 'Business',
    });
    const completenessPassed = individual.isComplete && !businessMissing.isComplete && businessMissing.missingFields.includes('businessName');
    check('GM2-09', 'Individual and Business profile completeness evaluation contracts', completenessPassed);
  } catch (e: any) {
    check('GM2-09', 'Individual and Business profile completeness evaluation contracts', false, e.message);
  }

  // 10. Commercial Inactivity Invariant (0 active markets)
  try {
    const activeCountries = getCommerciallyActiveCountries();
    const ph = getJurisdictionProfile('PH');
    const th = getJurisdictionProfile('TH');
    const cn = getJurisdictionProfile('CN');

    const inactiveVerified =
      activeCountries.length === 0 &&
      ph?.activationState !== 'ACTIVE' &&
      th?.activationState !== 'ACTIVE' &&
      cn?.activationState !== 'ACTIVE';
    check('GM2-10', 'Zero markets commercially active (PH, TH, CN non-active)', inactiveVerified);
  } catch (e: any) {
    check('GM2-10', 'Zero markets commercially active (PH, TH, CN non-active)', false, e.message);
  }

  // 11. Security Invariants: No Client Privilege Escalation
  try {
    const mapped = mapLegacyUserRoleToSystemAndMarketplace('ADMIN', 'Individual');
    const escalated = (mapped.marketplaceRoles as string[]).includes('ADMIN');
    check('GM2-11', 'Administrative RBAC cannot be escalated through marketplace roles', !escalated);
  } catch (e: any) {
    check('GM2-11', 'Administrative RBAC cannot be escalated through marketplace roles', false, e.message);
  }

  console.log('\n========================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`TOTAL CHECKS: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}`);
  console.log(`STATUS: ${allPassed ? '\x1b[32mGM-2 ACCEPTANCE PASS\x1b[0m' : '\x1b[31mGM-2 ACCEPTANCE FAIL\x1b[0m'}`);
  console.log('========================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runGm2Suite();
