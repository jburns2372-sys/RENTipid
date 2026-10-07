/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Trust & Identity Verification Service
 *
 * Implements server-authoritative trust evaluation, role authorization gates,
 * document verification review, and state-transition enforcement.
 */

import { type SystemRole } from '@/lib/global-market/account/contracts/marketplace-role';
import { type GlobalAccountContext } from '@/lib/global-market/account/contracts/global-account-context';
import { resolveOperatingJurisdiction } from '@/lib/global-market/account/services/account-service';

import {
  type VerificationState,
  canTransitionVerificationState,
} from '../contracts/verification-state';

import {
  type GlobalTrustProfile,
  type SubjectType,
} from '../contracts/trust-profile';

import {
  type DocumentCategory,
  type SubmittedDocumentReference,
} from '../contracts/document-requirement';

import { type JurisdictionKycProfile } from '../contracts/jurisdiction-kyc-profile';
import { getJurisdictionKycProfile } from '../registry/jurisdiction-kyc-registry';

export interface TrustGateResponse {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly jurisdictionCode?: string;
  readonly requiredState?: VerificationState;
  readonly currentState?: VerificationState;
}

export const AUTHORIZED_KYC_REVIEW_ROLES: readonly SystemRole[] = Object.freeze([
  'ADMIN',
  'COMPLIANCE_ADMIN',
  'SUPER_ADMIN',
]);

/**
 * Checks if a system role has authority to perform manual KYC review and approvals.
 */
export function isAuthorizedKycReviewer(role: SystemRole | null | undefined): boolean {
  if (!role) return false;
  return AUTHORIZED_KYC_REVIEW_ROLES.includes(role);
}

/**
 * Evaluates whether an account can act as a Renter in a specific jurisdiction.
 * Decoupled: Permits jurisdictions where renter KYC is optional, while enforcing
 * strict identity checks in jurisdictions mandating renter verification.
 */
export function canActAsRenterWithTrust(
  userContext: GlobalAccountContext | null | undefined,
  targetJurisdiction?: string | null
): TrustGateResponse {
  if (!userContext) {
    return { allowed: false, reason: 'UNAUTHENTICATED: No account context provided.' };
  }

  if (['Suspended', 'Blacklisted', 'Disabled'].includes(userContext.accountStatus)) {
    return { allowed: false, reason: 'ACCOUNT_INACTIVE: Account is suspended or disabled.' };
  }

  const jurisdictionCode = resolveOperatingJurisdiction(targetJurisdiction || userContext.operatingJurisdiction);
  if (!jurisdictionCode) {
    return { allowed: false, reason: 'UNKNOWN_JURISDICTION: Invalid or missing operating jurisdiction.' };
  }

  const kycProfile = getJurisdictionKycProfile(jurisdictionCode);
  if (!kycProfile) {
    return { allowed: false, reason: `MISSING_KYC_PROFILE: Jurisdiction ${jurisdictionCode} lacks an active KYC policy.` };
  }

  if (kycProfile.renterVerificationRequired) {
    if (userContext.kycState !== 'KYC_APPROVED') {
      return {
        allowed: false,
        reason: `RENTER_KYC_REQUIRED: Jurisdiction ${jurisdictionCode} mandates identity verification for renters (current: ${userContext.kycState}).`,
        jurisdictionCode,
        requiredState: 'APPROVED',
        currentState: userContext.kycState as any,
      };
    }
  }

  return { allowed: true, jurisdictionCode };
}

/**
 * Evaluates whether an account can act as a Provider in a specific jurisdiction.
 */
export function canActAsProviderWithTrust(
  userContext: GlobalAccountContext | null | undefined,
  targetJurisdiction?: string | null
): TrustGateResponse {
  if (!userContext) {
    return { allowed: false, reason: 'UNAUTHENTICATED: No account context provided.' };
  }

  const jurisdictionCode = resolveOperatingJurisdiction(targetJurisdiction || userContext.operatingJurisdiction);
  if (!jurisdictionCode) {
    return { allowed: false, reason: 'UNKNOWN_JURISDICTION: Invalid or missing operating jurisdiction.' };
  }

  const kycProfile = getJurisdictionKycProfile(jurisdictionCode);
  if (!kycProfile) {
    return { allowed: false, reason: `MISSING_KYC_PROFILE: Jurisdiction ${jurisdictionCode} lacks an active KYC policy.` };
  }

  if (['Suspended', 'Blacklisted', 'Disabled'].includes(userContext.accountStatus)) {
    return { allowed: false, reason: 'ACCOUNT_INACTIVE: Account is suspended or disabled.' };
  }

  if (!userContext.marketplaceRoles || !Array.isArray(userContext.marketplaceRoles) || !userContext.marketplaceRoles.includes('PROVIDER')) {
    return { allowed: false, reason: 'ROLE_REQUIRED: Account does not possess the PROVIDER marketplace role.' };
  }

  if (kycProfile.providerVerificationRequired) {
    if (userContext.kycState !== 'KYC_APPROVED') {
      return {
        allowed: false,
        reason: `PROVIDER_KYC_REQUIRED: Jurisdiction ${jurisdictionCode} mandates verified provider identity (current: ${userContext.kycState}).`,
        jurisdictionCode,
        requiredState: 'APPROVED',
        currentState: userContext.kycState as any,
      };
    }
  }

  return { allowed: true, jurisdictionCode };
}

/**
 * Server-authoritative publication gate combining GM-2 and GM-3A trust checks.
 * Enforces account status, provider role, onboarding state, jurisdiction policy,
 * KYC verification, and business profile if applicable.
 */
export function canPublishAsProviderWithTrust(
  userContext: GlobalAccountContext | null | undefined,
  targetJurisdiction?: string | null,
  businessVerificationState: VerificationState = 'NOT_REQUIRED'
): TrustGateResponse {
  if (!userContext) {
    return { allowed: false, reason: 'UNAUTHENTICATED: No account context provided.' };
  }

  const jurisdictionCode = resolveOperatingJurisdiction(targetJurisdiction || userContext.operatingJurisdiction);
  if (!jurisdictionCode) {
    return { allowed: false, reason: 'UNKNOWN_JURISDICTION: Invalid or missing publishing jurisdiction.' };
  }

  const kycProfile = getJurisdictionKycProfile(jurisdictionCode);
  if (!kycProfile) {
    return { allowed: false, reason: `MISSING_KYC_PROFILE: Jurisdiction ${jurisdictionCode} lacks an active KYC policy.` };
  }

  if (['Suspended', 'Blacklisted', 'Disabled'].includes(userContext.accountStatus)) {
    return { allowed: false, reason: 'ACCOUNT_INACTIVE: Account is suspended or disabled.' };
  }

  if (!userContext.marketplaceRoles || !Array.isArray(userContext.marketplaceRoles) || !userContext.marketplaceRoles.includes('PROVIDER')) {
    return { allowed: false, reason: 'ROLE_REQUIRED: Account does not possess the PROVIDER marketplace role.' };
  }

  if (userContext.providerOnboardingState !== 'APPROVED') {
    return {
      allowed: false,
      reason: `ONBOARDING_INCOMPLETE: Provider onboarding state is '${userContext.providerOnboardingState}'. Full approval required prior to publishing.`,
    };
  }

  // Publication KYC gate
  if (kycProfile.publicationVerificationRequirement === 'APPROVED') {
    if (userContext.kycState !== 'KYC_APPROVED') {
      return {
        allowed: false,
        reason: `KYC_REQUIRED: Jurisdiction ${jurisdictionCode} requires approved KYC verification prior to publishing (current: ${userContext.kycState}).`,
        jurisdictionCode,
        requiredState: 'APPROVED',
        currentState: userContext.kycState as any,
      };
    }
  }

  // Business verification gate for corporate providers
  if (userContext.accountType === 'Business' && kycProfile.businessVerificationRequired) {
    if (businessVerificationState !== 'APPROVED') {
      return {
        allowed: false,
        reason: `BUSINESS_VERIFICATION_REQUIRED: Business providers in ${jurisdictionCode} require approved business verification (current: ${businessVerificationState}).`,
        jurisdictionCode,
        requiredState: 'APPROVED',
        currentState: businessVerificationState,
      };
    }
  }

  return { allowed: true, jurisdictionCode };
}

/**
 * Evaluates whether an account satisfies KYC requirements for making payments.
 */
export function isPaymentVerificationSatisfied(
  userContext: GlobalAccountContext,
  jurisdictionCode: string
): TrustGateResponse {
  const profile = getJurisdictionKycProfile(jurisdictionCode);
  if (!profile) {
    return { allowed: false, reason: `MISSING_KYC_PROFILE: Jurisdiction ${jurisdictionCode} not found.` };
  }

  if (profile.paymentVerificationRequirement === 'NOT_REQUIRED') {
    return { allowed: true, jurisdictionCode };
  }

  if (profile.paymentVerificationRequirement === 'APPROVED' && userContext.kycState !== 'KYC_APPROVED') {
    return {
      allowed: false,
      reason: `PAYMENT_KYC_REQUIRED: Jurisdiction ${jurisdictionCode} requires verified identity for payments.`,
      jurisdictionCode,
      requiredState: 'APPROVED',
      currentState: userContext.kycState as any,
    };
  }

  return { allowed: true, jurisdictionCode };
}

/**
 * Evaluates whether an account satisfies KYC requirements for receiving provider payouts.
 */
export function isPayoutVerificationSatisfied(
  userContext: GlobalAccountContext,
  jurisdictionCode: string
): TrustGateResponse {
  const profile = getJurisdictionKycProfile(jurisdictionCode);
  if (!profile) {
    return { allowed: false, reason: `MISSING_KYC_PROFILE: Jurisdiction ${jurisdictionCode} not found.` };
  }

  if (profile.payoutVerificationRequirement === 'APPROVED' && userContext.kycState !== 'KYC_APPROVED') {
    return {
      allowed: false,
      reason: `PAYOUT_KYC_REQUIRED: Jurisdiction ${jurisdictionCode} mandates verified identity for financial payouts.`,
      jurisdictionCode,
      requiredState: 'APPROVED',
      currentState: userContext.kycState as any,
    };
  }

  return { allowed: true, jurisdictionCode };
}

/**
 * Executes a state transition for verification.
 * Enforces legal state progression and prevents client privilege escalation.
 */
export function transitionVerificationState(
  currentState: VerificationState,
  targetState: VerificationState,
  isReviewerAuthorized: boolean = false
): { success: boolean; nextState: VerificationState; reason?: string } {
  // Privileged states (APPROVED, SUSPENDED, BLOCKED) require reviewer authority
  const privilegedStates: VerificationState[] = ['APPROVED', 'SUSPENDED', 'BLOCKED'];
  if (privilegedStates.includes(targetState) && !isReviewerAuthorized) {
    return {
      success: false,
      nextState: currentState,
      reason: `UNAUTHORIZED: Transitioning to '${targetState}' requires authorized administrative review authority.`,
    };
  }

  if (!canTransitionVerificationState(currentState, targetState)) {
    return {
      success: false,
      nextState: currentState,
      reason: `ILLEGAL_TRANSITION: Cannot transition verification state from '${currentState}' to '${targetState}'.`,
    };
  }

  return { success: true, nextState: targetState };
}

/**
 * Executes an administrative manual review action.
 */
export function executeAdminReview(input: {
  reviewerRole: SystemRole;
  reviewerId: string;
  currentVerificationState: VerificationState;
  decision: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REQUEST_DOCUMENTS';
  rejectionReason?: string;
}): { success: boolean; nextState: VerificationState; reviewedAt: string; reviewedBy: string; reason?: string } {
  if (!isAuthorizedKycReviewer(input.reviewerRole)) {
    return {
      success: false,
      nextState: input.currentVerificationState,
      reviewedAt: new Date().toISOString(),
      reviewedBy: input.reviewerId,
      reason: `FORBIDDEN: Role '${input.reviewerRole}' is not authorized to review verification documents.`,
    };
  }

  let targetState: VerificationState;
  switch (input.decision) {
    case 'APPROVE':
      targetState = 'APPROVED';
      break;
    case 'REJECT':
      targetState = 'REJECTED';
      break;
    case 'SUSPEND':
      targetState = 'SUSPENDED';
      break;
    case 'REQUEST_DOCUMENTS':
      targetState = 'DOCUMENTS_REQUIRED';
      break;
    default:
      targetState = input.currentVerificationState;
  }

  const transition = transitionVerificationState(input.currentVerificationState, targetState, true);
  if (!transition.success) {
    return {
      success: false,
      nextState: input.currentVerificationState,
      reviewedAt: new Date().toISOString(),
      reviewedBy: input.reviewerId,
      reason: transition.reason,
    };
  }

  return {
    success: true,
    nextState: targetState,
    reviewedAt: new Date().toISOString(),
    reviewedBy: input.reviewerId,
  };
}

/**
 * Builds a GlobalTrustProfile representation for an account.
 */
export function buildGlobalTrustProfile(
  arg1:
    | {
        accountId: string;
        operatingJurisdiction: string;
        subjectType: SubjectType;
        identityState?: VerificationState;
        kycState?: VerificationState;
        businessVerificationState?: VerificationState;
        providerVerificationState?: VerificationState;
        contactVerificationState?: VerificationState;
        requiredDocuments?: readonly DocumentCategory[];
        submittedDocuments?: readonly SubmittedDocumentReference[];
        providerAdapter?: string;
        providerReference?: string | null;
        verifiedAt?: string | null;
        expiresAt?: string | null;
        reviewAuthority?: string | null;
        blockingReasons?: readonly string[];
      }
    | string,
  arg2?: string,
  arg3?: SubjectType,
  arg4?: VerificationState
): GlobalTrustProfile {
  let input: {
    accountId: string;
    operatingJurisdiction: string;
    subjectType: SubjectType;
    identityState?: VerificationState;
    kycState?: VerificationState;
    businessVerificationState?: VerificationState;
    providerVerificationState?: VerificationState;
    contactVerificationState?: VerificationState;
    requiredDocuments?: readonly DocumentCategory[];
    submittedDocuments?: readonly SubmittedDocumentReference[];
    providerAdapter?: string;
    providerReference?: string | null;
    verifiedAt?: string | null;
    expiresAt?: string | null;
    reviewAuthority?: string | null;
    blockingReasons?: readonly string[];
  };

  if (typeof arg1 === 'string') {
    input = {
      accountId: arg1,
      operatingJurisdiction: arg2 || 'PH',
      subjectType: arg3 || 'INDIVIDUAL',
      kycState: arg4 || 'NOT_STARTED',
    };
  } else {
    input = arg1;
  }

  const kycProfile = getJurisdictionKycProfile(input.operatingJurisdiction);
  const requiredDocs = input.requiredDocuments || kycProfile?.identityDocumentsRequired || [];
  
  const idState = input.identityState || 'NOT_STARTED';
  const kycSt = input.kycState || 'NOT_STARTED';
  const busState = input.businessVerificationState || (input.subjectType === 'BUSINESS' ? 'REQUIRED' : 'NOT_REQUIRED');
  const provState = input.providerVerificationState || 'NOT_STARTED';
  const contactState = input.contactVerificationState || 'NOT_STARTED';

  // Calculate composite aggregate state
  let aggregate: VerificationState = 'NOT_STARTED';
  if ([idState, kycSt, busState, provState].includes('BLOCKED')) {
    aggregate = 'BLOCKED';
  } else if ([idState, kycSt, busState, provState].includes('SUSPENDED')) {
    aggregate = 'SUSPENDED';
  } else if ([idState, kycSt, busState, provState].includes('REJECTED')) {
    aggregate = 'REJECTED';
  } else if (kycSt === 'APPROVED') {
    aggregate = 'APPROVED';
  } else if ([idState, kycSt, busState].includes('UNDER_REVIEW')) {
    aggregate = 'UNDER_REVIEW';
  } else if ([idState, kycSt].includes('DOCUMENTS_REQUIRED')) {
    aggregate = 'DOCUMENTS_REQUIRED';
  }

  return Object.freeze({
    accountId: input.accountId,
    operatingJurisdiction: input.operatingJurisdiction,
    subjectType: input.subjectType,
    identityState: idState,
    kycState: kycSt,
    businessVerificationState: busState,
    providerVerificationState: provState,
    contactVerificationState: contactState,
    aggregateState: aggregate,
    requiredDocuments: Object.freeze([...requiredDocs]),
    submittedDocuments: Object.freeze(input.submittedDocuments ? [...input.submittedDocuments] : []),
    providerAdapter: input.providerAdapter || kycProfile?.providerAdapter || 'NOT_CONFIGURED',
    providerReference: input.providerReference ?? null,
    verifiedAt: input.verifiedAt ?? null,
    expiresAt: input.expiresAt ?? null,
    reviewAuthority: input.reviewAuthority ?? null,
    blockingReasons: Object.freeze(input.blockingReasons ? [...input.blockingReasons] : []),
  });
}
