/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-3A Targeted Verification & Acceptance Runner
 *
 * Runs comprehensive programmatic verification across:
 * 1. Global Trust & Identity Model
 * 2. 46-Country KYC Profile Resolution & Unknown Fail-Closed
 * 3. Domain & Role Verification Decoupling
 * 4. State Transition Machine & Client Self-Approval Prevention
 * 5. Provider & Renter Trust Gating
 * 6. Payment & Payout KYC Boundaries
 * 7. RBAC Reviewer Authority Enforcement
 * 8. Provider-Neutral Abstraction & Manual Internal Adapter
 * 9. External Provider Classification (0 external vendors active)
 * 10. Commercial Inactivity (0 active markets) & China Deferred Blockers
 */

import {
  ALL_VERIFICATION_STATES,
  type VerificationState,
  canTransitionVerificationState,
} from '../src/lib/global-market/trust/contracts/verification-state';

import {
  ALL_VERIFICATION_DOMAINS,
} from '../src/lib/global-market/trust/contracts/verification-domain';

import {
  ALL_DOCUMENT_CATEGORIES,
} from '../src/lib/global-market/trust/contracts/document-requirement';

import {
  ALL_SUBJECT_TYPES,
} from '../src/lib/global-market/trust/contracts/trust-profile';

import {
  getJurisdictionKycProfile,
  getAllJurisdictionKycProfiles,
  getAuthoritativeKycProfileCount,
} from '../src/lib/global-market/trust/registry/jurisdiction-kyc-registry';

import {
  canActAsRenterWithTrust,
  canActAsProviderWithTrust,
  canPublishAsProviderWithTrust,
  isPaymentVerificationSatisfied,
  isPayoutVerificationSatisfied,
  transitionVerificationState,
  executeAdminReview,
  isAuthorizedKycReviewer,
} from '../src/lib/global-market/trust/services/trust-service';

import {
  ManualInternalKycAdapter,
  getKycProviderAdapter,
  KNOWN_EXTERNAL_KYC_PROVIDERS,
} from '../src/lib/global-market/trust/adapters';

import { GLOBAL_COUNTRY_CATALOG } from '../src/lib/glcc/country/country-registry';
import { getCommerciallyActiveCountries } from '../src/lib/global-market/registry/market-capability-registry';
import { buildGlobalAccountContext } from '../src/lib/global-market/account/services/account-service';

interface TestRecord {
  code: string;
  name: string;
  passed: boolean;
  details?: string;
}

const records: TestRecord[] = [];

function check(code: string, name: string, passed: boolean, details?: string) {
  records.push({ code, name, passed, details });
  const badge = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`[${badge}] ${code}: ${name}`);
  if (!passed && details) {
    console.log(`       Error: ${details}`);
  }
}

async function runGm3aSuite() {
  console.log('========================================================');
  console.log('RENTipid GLOBAL-MKT / v2.0 — GM-3A ACCEPTANCE SUITE');
  console.log('GLOBAL TRUST, IDENTITY, KYC & PROVIDER VERIFICATION');
  console.log('========================================================\n');

  // 1. Domain Separation & Controlled States
  try {
    const statesOk = ALL_VERIFICATION_STATES.length === 14;
    const domainsOk = ALL_VERIFICATION_DOMAINS.length === 8;
    const subjectsOk = ALL_SUBJECT_TYPES.length === 2;
    const docsOk = ALL_DOCUMENT_CATEGORIES.length === 9;
    check('GM3A-01', 'Controlled verification states, domains, subjects, and document types defined', statesOk && domainsOk && subjectsOk && docsOk);
  } catch (e: any) {
    check('GM3A-01', 'Controlled verification states, domains, subjects, and document types defined', false, e.message);
  }

  // 2. 46 Authoritative Country Resolution
  try {
    const count = getAuthoritativeKycProfileCount();
    const all46 = GLOBAL_COUNTRY_CATALOG.every(c => {
      const p = getJurisdictionKycProfile(c.code);
      return p !== null && p.countryCode === c.code && p.publicationVerificationRequirement === 'APPROVED';
    });
    check('GM3A-02', 'All 46 authoritative jurisdictions resolve conservative KYC profiles', count === 46 && all46);
  } catch (e: any) {
    check('GM3A-02', 'All 46 authoritative jurisdictions resolve conservative KYC profiles', false, e.message);
  }

  // 3. Unknown Jurisdiction Fail-Closed
  try {
    const closed =
      getJurisdictionKycProfile('XX') === null &&
      getJurisdictionKycProfile('FAKE') === null &&
      getJurisdictionKycProfile('') === null &&
      canActAsRenterWithTrust({} as any, 'XX').allowed === false &&
      canActAsProviderWithTrust({} as any, 'XX').allowed === false &&
      canPublishAsProviderWithTrust({} as any, 'XX').allowed === false;
    check('GM3A-03', 'Unknown jurisdiction fails closed across all verification gates', closed);
  } catch (e: any) {
    check('GM3A-03', 'Unknown jurisdiction fails closed across all verification gates', false, e.message);
  }

  // 4. State Transitions & Self-Approval Prevention
  try {
    const illegalJumpBlocked = !transitionVerificationState('NOT_STARTED', 'APPROVED', false).success;
    const clientSelfApproveBlocked = !transitionVerificationState('UNDER_REVIEW', 'APPROVED', false).success;
    const reviewerApproved = transitionVerificationState('UNDER_REVIEW', 'APPROVED', true).success;
    check('GM3A-04', 'State-transition guards block illegal transitions and client self-approval', illegalJumpBlocked && clientSelfApproveBlocked && reviewerApproved);
  } catch (e: any) {
    check('GM3A-04', 'State-transition guards block illegal transitions and client self-approval', false, e.message);
  }

  // 5. Renter Authorization Decoupled by Jurisdiction
  try {
    const unverifiedUser = buildGlobalAccountContext({
      userId: 'u1',
      email: 'u1@example.com',
      fullName: 'User One',
      countryCode: 'PH',
      accountStatus: 'Active',
      kycVerificationStatus: 'Unverified',
    });
    const allowedInPh = canActAsRenterWithTrust(unverifiedUser, 'PH').allowed === true;
    const blockedInCn = canActAsRenterWithTrust(unverifiedUser, 'CN').allowed === false;
    check('GM3A-05', 'Renter verification policy decoupled by jurisdiction (PH basic vs CN real-name mandate)', allowedInPh && blockedInCn);
  } catch (e: any) {
    check('GM3A-05', 'Renter verification policy decoupled by jurisdiction', false, e.message);
  }

  // 6. Provider Publication Trust Gate
  try {
    const unverifiedProvider = buildGlobalAccountContext({
      userId: 'prov1',
      email: 'prov1@example.com',
      fullName: 'Provider One',
      countryCode: 'PH',
      accountStatus: 'Active',
      legacyRole: 'Individual Provider',
      providerOnboardingState: 'APPROVED',
      kycVerificationStatus: 'Pending',
    });
    const verifiedProvider = buildGlobalAccountContext({
      userId: 'prov2',
      email: 'prov2@example.com',
      fullName: 'Provider Two',
      countryCode: 'PH',
      accountStatus: 'Active',
      legacyRole: 'Individual Provider',
      providerOnboardingState: 'APPROVED',
      kycVerificationStatus: 'Verified',
    });
    const publicationGated =
      !canPublishAsProviderWithTrust(unverifiedProvider, 'PH').allowed &&
      canPublishAsProviderWithTrust(verifiedProvider, 'PH').allowed;
    check('GM3A-06', 'Provider publication gate enforces approved identity verification', publicationGated);
  } catch (e: any) {
    check('GM3A-06', 'Provider publication gate enforces approved identity verification', false, e.message);
  }

  // 7. Payment vs Payout KYC Boundaries
  try {
    const user = buildGlobalAccountContext({
      userId: 'u2',
      email: 'u2@example.com',
      fullName: 'User Two',
      countryCode: 'PH',
      accountStatus: 'Active',
      kycVerificationStatus: 'Unverified',
    });
    const paymentOk = isPaymentVerificationSatisfied(user, 'PH').allowed;
    const payoutBlocked = !isPayoutVerificationSatisfied(user, 'PH').allowed;
    check('GM3A-07', 'Decoupled payment vs payout verification requirements', paymentOk && payoutBlocked);
  } catch (e: any) {
    check('GM3A-07', 'Decoupled payment vs payout verification requirements', false, e.message);
  }

  // 8. RBAC Reviewer Authority Enforcement
  try {
    const adminOk = isAuthorizedKycReviewer('ADMIN');
    const compOk = isAuthorizedKycReviewer('COMPLIANCE_ADMIN');
    const superOk = isAuthorizedKycReviewer('SUPER_ADMIN');
    const userForbidden = !isAuthorizedKycReviewer('USER');
    const guestForbidden = !isAuthorizedKycReviewer('GUEST');
    const executeDenied = !executeAdminReview({
      reviewerRole: 'USER',
      reviewerId: 'user-id',
      currentVerificationState: 'UNDER_REVIEW',
      decision: 'APPROVE',
    }).success;
    check('GM3A-08', 'RBAC controls manual review actions (ADMIN, COMPLIANCE_ADMIN, SUPER_ADMIN)', adminOk && compOk && superOk && userForbidden && guestForbidden && executeDenied);
  } catch (e: any) {
    check('GM3A-08', 'RBAC controls manual review actions', false, e.message);
  }

  // 9. Provider-Neutral Abstraction & Manual Internal Adapter
  try {
    const adapter = new ManualInternalKycAdapter();
    const created = await adapter.createVerification({
      accountId: 'test-acc',
      jurisdictionCode: 'PH',
      subjectType: 'INDIVIDUAL',
      requiredDocuments: ['NATIONAL_ID'],
    });
    check('GM3A-09', 'Manual internal KYC adapter implements complete provider interface', adapter.isConfigured && created.status === 'DOCUMENTS_REQUIRED');
  } catch (e: any) {
    check('GM3A-09', 'Manual internal KYC adapter implements complete provider interface', false, e.message);
  }

  // 10. External Provider Stubs Marked NOT_CONFIGURED
  try {
    const externalProviders = Object.keys(KNOWN_EXTERNAL_KYC_PROVIDERS);
    const allNotConfigured = externalProviders.every(id => {
      const a = getKycProviderAdapter(id);
      return a.isConfigured === false;
    });
    check('GM3A-10', 'External KYC providers strictly classified as NOT_CONFIGURED (0 false active vendors)', allNotConfigured);
  } catch (e: any) {
    check('GM3A-10', 'External KYC providers strictly classified as NOT_CONFIGURED', false, e.message);
  }

  // 11. Commercial Inactivity Invariant (0 active markets)
  try {
    const active = getCommerciallyActiveCountries();
    check('GM3A-11', 'Zero markets commercially active (PH, TH, CN non-active)', active.length === 0);
  } catch (e: any) {
    check('GM3A-11', 'Zero markets commercially active', false, e.message);
  }

  // 12. China Deferred Blockers Preserved
  try {
    const cnProfile = getJurisdictionKycProfile('CN');
    const hasIcp = cnProfile?.blockers.some(b => b.includes('China ICP'));
    const hasPipl = cnProfile?.blockers.some(b => b.includes('PIPL'));
    check('GM3A-12', 'China deferred blockers (ICP and PIPL) preserved', !!(hasIcp && hasPipl));
  } catch (e: any) {
    check('GM3A-12', 'China deferred blockers (ICP and PIPL) preserved', false, e.message);
  }

  console.log('\n========================================================');
  const allPassed = records.every(r => r.passed);
  console.log(`TOTAL CHECKS: ${records.length} | PASSED: ${records.filter(r => r.passed).length} | FAILED: ${records.filter(r => !r.passed).length}`);
  console.log(`STATUS: ${allPassed ? '\x1b[32mGM-3A ACCEPTANCE PASS\x1b[0m' : '\x1b[31mGM-3A ACCEPTANCE FAIL\x1b[0m'}`);
  console.log('========================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runGm3aSuite();
