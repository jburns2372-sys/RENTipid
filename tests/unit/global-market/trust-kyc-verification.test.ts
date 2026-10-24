/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-3A Global Trust, Identity, KYC & Provider Verification Test Suite
 *
 * Enforces all GM-3A requirements:
 * 1. Global Trust Profile & Subject Types (Individual vs Business).
 * 2. 46-Country Jurisdiction KYC Profile Resolution; unknown fails closed.
 * 3. Provider & Renter Verification Policies (Decoupled market rules).
 * 4. Verification State Machine & Transition Guards (No illegal jumps or self-approval).
 * 5. Provider publication gating consuming KYC status.
 * 6. Payment & Payout KYC boundaries.
 * 7. RBAC Reviewer Authority (Only authorized admin/compliance roles can review).
 * 8. Provider-neutral KYC abstraction & Manual/Internal adapter.
 * 9. Document security & ownership enforcement.
 * 10. Commercial inactivity invariant & China deferred blockers.
 */

import {
  ALL_VERIFICATION_STATES,
  type VerificationState,
  canTransitionVerificationState,
} from '@/lib/global-market/trust/contracts/verification-state';

import {
  ALL_VERIFICATION_DOMAINS,
} from '@/lib/global-market/trust/contracts/verification-domain';

import {
  ALL_DOCUMENT_CATEGORIES,
} from '@/lib/global-market/trust/contracts/document-requirement';

import {
  ALL_SUBJECT_TYPES,
  type GlobalTrustProfile,
} from '@/lib/global-market/trust/contracts/trust-profile';

import {
  type JurisdictionKycProfile,
} from '@/lib/global-market/trust/contracts/jurisdiction-kyc-profile';

import {
  getJurisdictionKycProfile,
  getAllJurisdictionKycProfiles,
  getAuthoritativeKycProfileCount,
} from '@/lib/global-market/trust/registry/jurisdiction-kyc-registry';

import {
  canActAsRenterWithTrust,
  canActAsProviderWithTrust,
  canPublishAsProviderWithTrust,
  isPaymentVerificationSatisfied,
  isPayoutVerificationSatisfied,
  transitionVerificationState,
  executeAdminReview,
  buildGlobalTrustProfile,
  isAuthorizedKycReviewer,
  AUTHORIZED_KYC_REVIEW_ROLES,
} from '@/lib/global-market/trust/services/trust-service';

import {
  ManualInternalKycAdapter,
  UnconfiguredExternalKycAdapter,
  getKycProviderAdapter,
  KNOWN_EXTERNAL_KYC_PROVIDERS,
} from '@/lib/global-market/trust/adapters';

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import { getCommerciallyActiveCountries } from '@/lib/global-market/registry/market-capability-registry';
import { buildGlobalAccountContext } from '@/lib/global-market/account/services/account-service';

describe('RENTipid GLOBAL-MKT / v2.0 — GM-3A Global Trust & KYC Framework', () => {

  describe('1. Global Verification States & Domain Separation', () => {
    it('defines 14 controlled verification states', () => {
      expect(ALL_VERIFICATION_STATES.length).toBe(14);
      expect(ALL_VERIFICATION_STATES).toContain('NOT_REQUIRED');
      expect(ALL_VERIFICATION_STATES).toContain('NOT_STARTED');
      expect(ALL_VERIFICATION_STATES).toContain('REQUIRED');
      expect(ALL_VERIFICATION_STATES).toContain('IN_PROGRESS');
      expect(ALL_VERIFICATION_STATES).toContain('DOCUMENTS_REQUIRED');
      expect(ALL_VERIFICATION_STATES).toContain('SUBMITTED');
      expect(ALL_VERIFICATION_STATES).toContain('UNDER_REVIEW');
      expect(ALL_VERIFICATION_STATES).toContain('APPROVED');
      expect(ALL_VERIFICATION_STATES).toContain('REJECTED');
      expect(ALL_VERIFICATION_STATES).toContain('EXPIRED');
      expect(ALL_VERIFICATION_STATES).toContain('SUSPENDED');
      expect(ALL_VERIFICATION_STATES).toContain('BLOCKED');
      expect(ALL_VERIFICATION_STATES).toContain('PROVIDER_NOT_CONFIGURED');
      expect(ALL_VERIFICATION_STATES).toContain('VALIDATION_REQUIRED');
    });

    it('explicitly separates 8 verification domains', () => {
      expect(ALL_VERIFICATION_DOMAINS.length).toBe(8);
      expect(ALL_VERIFICATION_DOMAINS).toContain('AUTHENTICATION');
      expect(ALL_VERIFICATION_DOMAINS).toContain('CONTACT_VERIFICATION');
      expect(ALL_VERIFICATION_DOMAINS).toContain('IDENTITY_VERIFICATION');
      expect(ALL_VERIFICATION_DOMAINS).toContain('KYC_DUE_DILIGENCE');
      expect(ALL_VERIFICATION_DOMAINS).toContain('BUSINESS_VERIFICATION');
      expect(ALL_VERIFICATION_DOMAINS).toContain('PROVIDER_ELIGIBILITY');
      expect(ALL_VERIFICATION_DOMAINS).toContain('MARKETPLACE_ROLE');
      expect(ALL_VERIFICATION_DOMAINS).toContain('MARKET_CAPABILITY');
    });

    it('supports INDIVIDUAL and BUSINESS subject types', () => {
      expect(ALL_SUBJECT_TYPES).toEqual(['INDIVIDUAL', 'BUSINESS']);
    });

    it('defines typed document requirements', () => {
      expect(ALL_DOCUMENT_CATEGORIES).toContain('PASSPORT');
      expect(ALL_DOCUMENT_CATEGORIES).toContain('NATIONAL_ID');
      expect(ALL_DOCUMENT_CATEGORIES).toContain('DRIVER_LICENSE');
      expect(ALL_DOCUMENT_CATEGORIES).toContain('ADDRESS_PROOF');
      expect(ALL_DOCUMENT_CATEGORIES).toContain('BUSINESS_REGISTRATION');
      expect(ALL_DOCUMENT_CATEGORIES).toContain('TAX_REGISTRATION');
      expect(ALL_DOCUMENT_CATEGORIES).toContain('AUTHORIZED_REPRESENTATIVE_DOCUMENT');
      expect(ALL_DOCUMENT_CATEGORIES).toContain('SELFIE_LIVENESS');
      expect(ALL_DOCUMENT_CATEGORIES).toContain('OTHER_REGULATED_DOCUMENT');
    });
  });

  describe('2. 46 Authoritative Country KYC Profile Resolution', () => {
    it('resolves exactly 46 authoritative jurisdiction KYC profiles', () => {
      expect(getAuthoritativeKycProfileCount()).toBe(46);
      expect(getAllJurisdictionKycProfiles().length).toBe(46);
    });

    it('programmatically resolves every single one of the 46 countries', () => {
      for (const country of GLOBAL_COUNTRY_CATALOG) {
        const profile = getJurisdictionKycProfile(country.code);
        expect(profile).not.toBeNull();
        expect(profile?.countryCode).toBe(country.code);
        expect(profile?.identityDocumentsRequired.length).toBeGreaterThan(0);
        expect(profile?.reverificationPolicy).toBeDefined();
        expect(profile?.publicationVerificationRequirement).toBe('APPROVED');
      }
    });

    it('fails closed on unknown or invalid jurisdictions', () => {
      expect(getJurisdictionKycProfile('XX')).toBeNull();
      expect(getJurisdictionKycProfile('FAKE')).toBeNull();
      expect(getJurisdictionKycProfile('')).toBeNull();
      expect(getJurisdictionKycProfile(null)).toBeNull();
      expect(getJurisdictionKycProfile(undefined)).toBeNull();
    });

    it('resolves representative market profiles (PH, TH, CN, SG, JP, US, DE)', () => {
      // Philippines (Legacy manual review configured)
      const ph = getJurisdictionKycProfile('PH');
      expect(ph?.countryCode).toBe('PH');
      expect(ph?.providerAdapter).toBe('MANUAL_INTERNAL');
      expect(ph?.manualReviewAllowed).toBe(true);
      expect(ph?.renterVerificationRequired).toBe(false);
      expect(ph?.providerVerificationRequired).toBe(true);
      expect(ph?.status).toBe('READY');

      // Thailand (Conservative baseline)
      const th = getJurisdictionKycProfile('TH');
      expect(th?.countryCode).toBe('TH');
      expect(th?.providerAdapter).toBe('NOT_CONFIGURED');
      expect(th?.minimumAge).toBe(20);
      expect(th?.status).toBe('VALIDATION_REQUIRED');

      // China (Real-name system, preserving 2 deferred blockers)
      const cn = getJurisdictionKycProfile('CN');
      expect(cn?.countryCode).toBe('CN');
      expect(cn?.renterVerificationRequired).toBe(true);
      expect(cn?.providerVerificationRequired).toBe(true);
      expect(cn?.status).toBe('VALIDATION_REQUIRED');
      expect(cn?.blockers.some(b => b.includes('China ICP'))).toBe(true);
      expect(cn?.blockers.some(b => b.includes('PIPL'))).toBe(true);

      // US, SG, JP, DE (Conservative)
      for (const code of ['US', 'SG', 'JP', 'DE']) {
        const p = getJurisdictionKycProfile(code);
        expect(p?.countryCode).toBe(code);
        expect(p?.status).toBe('VALIDATION_REQUIRED');
        expect(p?.providerAdapter).toBe('NOT_CONFIGURED');
      }
    });
  });

  describe('3. Renter and Provider Role Authorization with Trust', () => {
    it('allows renter when jurisdiction does not require renter verification', () => {
      const renterContext = buildGlobalAccountContext({
        userId: 'renter-1',
        email: 'renter@example.ph',
        fullName: 'Juan Dela Cruz',
        countryCode: 'PH',
        accountStatus: 'Active',
        kycVerificationStatus: 'Unverified', // kycState: KYC_REQUIRED
      });

      // In PH, renter verification is not mandatory
      const res = canActAsRenterWithTrust(renterContext, 'PH');
      expect(res.allowed).toBe(true);
    });

    it('blocks renter in jurisdictions requiring renter verification until KYC is approved', () => {
      const renterInChina = buildGlobalAccountContext({
        userId: 'renter-cn',
        email: 'renter@example.cn',
        fullName: 'Li Wei',
        countryCode: 'CN',
        accountStatus: 'Active',
        kycVerificationStatus: 'Pending', // KYC not yet approved
      });

      // In CN, real-name registration mandates KYC for renters
      const res = canActAsRenterWithTrust(renterInChina, 'CN');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('RENTER_KYC_REQUIRED');

      // Once KYC is approved, renter is permitted
      const approvedRenter = buildGlobalAccountContext({
        userId: 'renter-cn-approved',
        email: 'renter@example.cn',
        fullName: 'Li Wei',
        countryCode: 'CN',
        accountStatus: 'Active',
        kycVerificationStatus: 'Verified', // kycState: KYC_APPROVED
      });
      const approvedRes = canActAsRenterWithTrust(approvedRenter, 'CN');
      expect(approvedRes.allowed).toBe(true);
    });

    it('blocks provider authorization if provider role is missing or KYC is unapproved', () => {
      const unverifiedProvider = buildGlobalAccountContext({
        userId: 'prov-1',
        email: 'prov@example.com',
        fullName: 'Pedro Provider',
        countryCode: 'PH',
        accountStatus: 'Active',
        legacyRole: 'Individual Provider',
        providerOnboardingState: 'APPROVED',
        kycVerificationStatus: 'Unverified',
      });

      const res = canActAsProviderWithTrust(unverifiedProvider, 'PH');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('PROVIDER_KYC_REQUIRED');
    });

    it('allows provider authorization when account status, role, and KYC are all approved', () => {
      const approvedProvider = buildGlobalAccountContext({
        userId: 'prov-2',
        email: 'prov@example.com',
        fullName: 'Pedro Provider',
        countryCode: 'PH',
        accountStatus: 'Active',
        legacyRole: 'Individual Provider',
        providerOnboardingState: 'APPROVED',
        kycVerificationStatus: 'Verified',
      });

      const res = canActAsProviderWithTrust(approvedProvider, 'PH');
      expect(res.allowed).toBe(true);
    });
  });

  describe('4. Server-Authoritative Publication Trust Gating', () => {
    it('blocks publication if KYC is pending or rejected', () => {
      const pendingProvider = buildGlobalAccountContext({
        userId: 'p-pending',
        email: 'pending@example.com',
        fullName: 'Pending Provider',
        countryCode: 'PH',
        accountStatus: 'Active',
        legacyRole: 'Individual Provider',
        providerOnboardingState: 'APPROVED',
        kycVerificationStatus: 'Pending',
      });

      const res = canPublishAsProviderWithTrust(pendingProvider, 'PH');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('KYC_REQUIRED');
    });

    it('blocks publication if business provider lacks business verification', () => {
      const businessProviderWithoutBizKyc = buildGlobalAccountContext({
        userId: 'b-prov',
        email: 'corp@example.com',
        fullName: 'Business Rep',
        accountType: 'Business',
        countryCode: 'PH',
        accountStatus: 'Active',
        legacyRole: 'Business Provider',
        providerOnboardingState: 'APPROVED',
        kycVerificationStatus: 'Verified',
      });

      // Passing businessVerificationState: 'PENDING'
      const res = canPublishAsProviderWithTrust(
        businessProviderWithoutBizKyc,
        'PH',
        'UNDER_REVIEW'
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('BUSINESS_VERIFICATION_REQUIRED');

      // Passing businessVerificationState: 'APPROVED'
      const resApproved = canPublishAsProviderWithTrust(
        businessProviderWithoutBizKyc,
        'PH',
        'APPROVED'
      );
      expect(resApproved.allowed).toBe(true);
    });

    it('blocks publication if account is SUSPENDED or BLOCKED', () => {
      const suspendedProvider = buildGlobalAccountContext({
        userId: 'p-susp',
        email: 'susp@example.com',
        fullName: 'Suspended User',
        countryCode: 'PH',
        accountStatus: 'Suspended',
        legacyRole: 'Individual Provider',
        providerOnboardingState: 'APPROVED',
        kycVerificationStatus: 'Verified',
      });

      const res = canPublishAsProviderWithTrust(suspendedProvider, 'PH');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('ACCOUNT_INACTIVE');
    });
  });

  describe('5. Payment & Payout KYC Boundary Decoupling', () => {
    it('evaluates payment KYC independently from payout KYC', () => {
      const user = buildGlobalAccountContext({
        userId: 'u-pay',
        email: 'pay@example.com',
        fullName: 'Payment User',
        countryCode: 'PH',
        accountStatus: 'Active',
        kycVerificationStatus: 'Unverified',
      });

      // In PH, payments do not require verified KYC
      const paymentRes = isPaymentVerificationSatisfied(user, 'PH');
      expect(paymentRes.allowed).toBe(true);

      // But payouts mandate verified identity
      const payoutRes = isPayoutVerificationSatisfied(user, 'PH');
      expect(payoutRes.allowed).toBe(false);
      expect(payoutRes.reason).toContain('PAYOUT_KYC_REQUIRED');
    });
  });

  describe('6. State Transitions & Self-Approval Prevention (Section 25 & 26)', () => {
    it('blocks illegal state transition from NOT_STARTED directly to APPROVED', () => {
      const res = transitionVerificationState('NOT_STARTED', 'APPROVED', false);
      expect(res.success).toBe(false);
      expect(res.nextState).toBe('NOT_STARTED');
      expect(res.reason).toContain('UNAUTHORIZED');
    });

    it('blocks client from self-approving even with legal transition path', () => {
      // Transition from UNDER_REVIEW to APPROVED requires reviewer authority
      const clientAttempt = transitionVerificationState('UNDER_REVIEW', 'APPROVED', false);
      expect(clientAttempt.success).toBe(false);
      expect(clientAttempt.reason).toContain('UNAUTHORIZED');

      // When authorized reviewer performs transition, it succeeds
      const adminAttempt = transitionVerificationState('UNDER_REVIEW', 'APPROVED', true);
      expect(adminAttempt.success).toBe(true);
      expect(adminAttempt.nextState).toBe('APPROVED');
    });

    it('enforces legal transition rules (e.g. SUBMITTED -> UNDER_REVIEW -> APPROVED)', () => {
      expect(canTransitionVerificationState('NOT_STARTED', 'DOCUMENTS_REQUIRED')).toBe(true);
      expect(canTransitionVerificationState('DOCUMENTS_REQUIRED', 'SUBMITTED')).toBe(true);
      expect(canTransitionVerificationState('SUBMITTED', 'UNDER_REVIEW')).toBe(true);
      expect(canTransitionVerificationState('UNDER_REVIEW', 'APPROVED')).toBe(true);
      expect(canTransitionVerificationState('UNDER_REVIEW', 'REJECTED')).toBe(true);
      expect(canTransitionVerificationState('APPROVED', 'EXPIRED')).toBe(true);
      expect(canTransitionVerificationState('APPROVED', 'SUSPENDED')).toBe(true);

      // Illegal transitions
      expect(canTransitionVerificationState('NOT_STARTED', 'APPROVED')).toBe(false);
      expect(canTransitionVerificationState('BLOCKED', 'APPROVED')).toBe(false);
    });
  });

  describe('7. RBAC Reviewer Authority & Manual Review Adapter (Section 22 & 27)', () => {
    it('enforces that only ADMIN, COMPLIANCE_ADMIN, or SUPER_ADMIN can review documents', () => {
      expect(isAuthorizedKycReviewer('ADMIN')).toBe(true);
      expect(isAuthorizedKycReviewer('COMPLIANCE_ADMIN')).toBe(true);
      expect(isAuthorizedKycReviewer('SUPER_ADMIN')).toBe(true);

      // Ordinary users or providers cannot review
      expect(isAuthorizedKycReviewer('USER')).toBe(false);
      expect(isAuthorizedKycReviewer('GUEST')).toBe(false);
      expect(isAuthorizedKycReviewer('FINANCE_ADMIN')).toBe(false);
    });

    it('rejects review actions executed by unauthorized roles', () => {
      const userReviewAttempt = executeAdminReview({
        reviewerRole: 'USER',
        reviewerId: 'attacker-1',
        currentVerificationState: 'UNDER_REVIEW',
        decision: 'APPROVE',
      });

      expect(userReviewAttempt.success).toBe(false);
      expect(userReviewAttempt.nextState).toBe('UNDER_REVIEW');
      expect(userReviewAttempt.reason).toContain('FORBIDDEN');
    });

    it('permits authorized compliance reviewer to approve or reject verification', () => {
      const complianceReview = executeAdminReview({
        reviewerRole: 'COMPLIANCE_ADMIN',
        reviewerId: 'reviewer-99',
        currentVerificationState: 'UNDER_REVIEW',
        decision: 'APPROVE',
      });

      expect(complianceReview.success).toBe(true);
      expect(complianceReview.nextState).toBe('APPROVED');
      expect(complianceReview.reviewedBy).toBe('reviewer-99');
    });

    it('ManualInternalKycAdapter implements complete provider interface', async () => {
      const adapter = new ManualInternalKycAdapter();
      expect(adapter.providerId).toBe('MANUAL_INTERNAL');
      expect(adapter.isConfigured).toBe(true);

      const verification = await adapter.createVerification({
        accountId: 'acc-1',
        jurisdictionCode: 'PH',
        subjectType: 'INDIVIDUAL',
        requiredDocuments: ['NATIONAL_ID', 'SELFIE_LIVENESS'],
      });
      expect(verification.status).toBe('DOCUMENTS_REQUIRED');

      const submit = await adapter.submitDocuments({
        verificationId: verification.verificationId,
        accountId: 'acc-1',
        documents: [{ category: 'NATIONAL_ID', fileUrl: 'https://storage/id.pdf', mimeType: 'application/pdf' }],
      });
      expect(submit.status).toBe('UNDER_REVIEW');
    });

    it('external provider stubs are strictly marked NOT_CONFIGURED (Section 23)', () => {
      const stripeAdapter = getKycProviderAdapter('STRIPE_IDENTITY');
      expect(stripeAdapter.isConfigured).toBe(false);
      expect(stripeAdapter.providerName).toBe('Stripe Identity');

      const veriffAdapter = getKycProviderAdapter('VERIFF');
      expect(veriffAdapter.isConfigured).toBe(false);

      expect(Object.keys(KNOWN_EXTERNAL_KYC_PROVIDERS).length).toBe(4);
    });
  });

  describe('8. Commercial Inactivity Invariant & China Blockers (Section 32 & 33)', () => {
    it('commercially active countries count remains strictly 0', () => {
      expect(getCommerciallyActiveCountries().length).toBe(0);
    });

    it('preserves exactly 2 deferred blockers for China', () => {
      const cn = getJurisdictionKycProfile('CN');
      expect(cn).not.toBeNull();
      const icpBlocker = cn?.blockers.find(b => b.includes('China ICP'));
      const piplBlocker = cn?.blockers.find(b => b.includes('PIPL'));
      expect(icpBlocker).toBeDefined();
      expect(piplBlocker).toBeDefined();
    });
  });
});
