/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Account & Onboarding Domain Service
 *
 * Implements the server-authoritative global account model, jurisdiction resolution,
 * role separation, provider publication gating, and profile completeness.
 */

import {
  getJurisdictionProfile,
  getMarketCapability,
  getMarketActivationState,
  isCapabilityReady,
} from '@/lib/global-market/registry/market-capability-registry';

import {
  GLOBAL_COUNTRY_CATALOG,
} from '@/lib/glcc/country/country-registry';

import {
  type SystemRole,
  type MarketplaceRole,
  hasMarketplaceRole,
  canActAsRenter,
  canActAsProvider,
  mapLegacyUserRoleToSystemAndMarketplace,
} from '../contracts/marketplace-role';

import {
  type ProviderOnboardingState,
  type RenterOnboardingState,
  type KycState,
  type ProviderType,
  type ProfileCompletenessReport,
} from '../contracts/onboarding-state';

import type { GlobalAccountContext } from '../contracts/global-account-context';

export interface CanActionResponse {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly jurisdictionCode?: string;
}

/**
 * Resolves an operating jurisdiction strictly against the authoritative 46-country catalog.
 * Accepts ISO 3166-1 alpha-2 code or official country name.
 * Fails closed (returns null) for any unknown or invalid country.
 */
export function resolveOperatingJurisdiction(countryInput: string | null | undefined): string | null {
  if (!countryInput || typeof countryInput !== 'string') return null;
  const trimmed = countryInput.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();

  // 1. Direct ISO 3166-1 alpha-2 check against GM-1
  const directProfile = getJurisdictionProfile(upper);
  if (directProfile) {
    return directProfile.countryCode;
  }

  // 2. Case-insensitive match against GLCC official names
  const lowerName = trimmed.toLowerCase();
  const countryByName = GLOBAL_COUNTRY_CATALOG.find(
    c => c.name.toLowerCase() === lowerName || c.code.toLowerCase() === lowerName
  );

  if (countryByName && getJurisdictionProfile(countryByName.code)) {
    return countryByName.code;
  }

  // Fail closed
  return null;
}

/**
 * Verifies whether account registration is permitted in a given jurisdiction.
 * Consumes GM-1 capability registry.
 */
export function canRegisterInJurisdiction(countryInput: string | null | undefined): CanActionResponse {
  const jurisdictionCode = resolveOperatingJurisdiction(countryInput);
  if (!jurisdictionCode) {
    return {
      allowed: false,
      reason: `UNKNOWN_JURISDICTION: The jurisdiction '${countryInput ?? 'null'}' is not registered in the authoritative catalog.`,
    };
  }

  const profile = getJurisdictionProfile(jurisdictionCode);
  if (!profile) {
    return { allowed: false, reason: `MISSING_PROFILE: Jurisdiction ${jurisdictionCode} has no registered profile.`, jurisdictionCode };
  }

  if (profile.activationState === 'BLOCKED' || profile.activationState === 'SUSPENDED') {
    return { allowed: false, reason: `JURISDICTION_${profile.activationState}: Market is currently not accepting new accounts.`, jurisdictionCode };
  }

  const regCap = profile.capabilities.ACCOUNT_REGISTRATION;
  if (regCap.status === 'BLOCKED') {
    return { allowed: false, reason: 'CAPABILITY_BLOCKED: Account registration is blocked in this jurisdiction.', jurisdictionCode };
  }

  return { allowed: true, jurisdictionCode };
}

/**
 * Verifies whether renter onboarding can be initiated in a given jurisdiction.
 */
export function canStartRenterOnboarding(countryInput: string | null | undefined): CanActionResponse {
  const regCheck = canRegisterInJurisdiction(countryInput);
  if (!regCheck.allowed) return regCheck;

  const jurisdictionCode = regCheck.jurisdictionCode!;
  const profile = getJurisdictionProfile(jurisdictionCode)!;

  const renterCap = profile.capabilities.RENTER_ONBOARDING;
  if (renterCap.status === 'BLOCKED') {
    return { allowed: false, reason: 'CAPABILITY_BLOCKED: Renter onboarding is blocked in this jurisdiction.', jurisdictionCode };
  }

  return { allowed: true, jurisdictionCode };
}

/**
 * Verifies whether provider onboarding can be initiated in a given jurisdiction.
 */
export function canStartProviderOnboarding(countryInput: string | null | undefined): CanActionResponse {
  const regCheck = canRegisterInJurisdiction(countryInput);
  if (!regCheck.allowed) return regCheck;

  const jurisdictionCode = regCheck.jurisdictionCode!;
  const profile = getJurisdictionProfile(jurisdictionCode)!;

  const providerCap = profile.capabilities.PROVIDER_ONBOARDING;
  if (providerCap.status === 'BLOCKED') {
    return { allowed: false, reason: 'CAPABILITY_BLOCKED: Provider onboarding is blocked in this jurisdiction.', jurisdictionCode };
  }

  return { allowed: true, jurisdictionCode };
}

/**
 * Server-authoritative publication gate: Determines if a user can publish rental listings.
 * Fails closed if user has not been granted PROVIDER role, onboarding is incomplete,
 * KYC is missing when required, or jurisdiction is blocked.
 */
export function canPublishAsProvider(
  userContext: GlobalAccountContext | null | undefined,
  targetJurisdictionInput?: string | null
): CanActionResponse {
  if (!userContext) {
    return { allowed: false, reason: 'UNAUTHENTICATED: No valid account context provided.' };
  }

  if (['Suspended', 'Blacklisted', 'Disabled'].includes(userContext.accountStatus)) {
    return { allowed: false, reason: 'ACCOUNT_INACTIVE: Account is suspended or disabled.' };
  }

  if (!hasMarketplaceRole(userContext.marketplaceRoles, 'PROVIDER')) {
    return { allowed: false, reason: 'ROLE_REQUIRED: Account does not possess the PROVIDER marketplace role.' };
  }

  if (userContext.providerOnboardingState !== 'APPROVED') {
    return {
      allowed: false,
      reason: `ONBOARDING_INCOMPLETE: Provider onboarding state is '${userContext.providerOnboardingState}'. Full approval required prior to publishing.`,
    };
  }

  // Resolve target jurisdiction (defaults to user's operating jurisdiction)
  const jurisdictionCode = resolveOperatingJurisdiction(targetJurisdictionInput || userContext.operatingJurisdiction);
  if (!jurisdictionCode) {
    return { allowed: false, reason: 'UNKNOWN_JURISDICTION: Invalid or missing publishing jurisdiction.' };
  }

  const profile = getJurisdictionProfile(jurisdictionCode);
  if (!profile) {
    return { allowed: false, reason: `MISSING_PROFILE: No profile found for jurisdiction ${jurisdictionCode}.`, jurisdictionCode };
  }

  if (profile.activationState === 'BLOCKED' || profile.activationState === 'SUSPENDED') {
    return { allowed: false, reason: `JURISDICTION_${profile.activationState}: Market is not operational for listing publication.`, jurisdictionCode };
  }

  // If KYC verification is mandatory and active in this jurisdiction, require approved KYC
  const kycCap = profile.capabilities.KYC_VERIFICATION;
  if (kycCap.isMandatory && userContext.kycState !== 'KYC_APPROVED') {
    return {
      allowed: false,
      reason: `KYC_REQUIRED: Jurisdiction ${jurisdictionCode} mandates verified identity prior to listing publication (current: ${userContext.kycState}).`,
      jurisdictionCode,
    };
  }

  return { allowed: true, jurisdictionCode };
}

/**
 * Evaluates profile completeness for an account.
 */
export function evaluateProfileCompleteness(input: {
  fullName?: string | null;
  email?: string | null;
  mobileNumber?: string | null;
  operatingJurisdiction?: string | null;
  accountType?: 'Individual' | 'Business';
  businessName?: string | null;
  address?: string | null;
  city?: string | null;
}): ProfileCompletenessReport {
  const missing: string[] = [];
  const completed: string[] = [];

  const check = (fieldName: string, value: unknown) => {
    if (value && typeof value === 'string' && value.trim().length > 0) {
      completed.push(fieldName);
    } else {
      missing.push(fieldName);
    }
  };

  // Global baseline required fields
  check('fullName', input.fullName);
  check('email', input.email);
  check('mobileNumber', input.mobileNumber);
  check('operatingJurisdiction', input.operatingJurisdiction);

  // Business provider required fields
  if (input.accountType === 'Business') {
    check('businessName', input.businessName);
  }

  const totalFields = missing.length + completed.length;
  const percentage = totalFields > 0 ? Math.round((completed.length / totalFields) * 100) : 0;

  return {
    isComplete: missing.length === 0,
    missingFields: Object.freeze(missing),
    completedFields: Object.freeze(completed),
    completionPercentage: percentage,
  };
}

/**
 * Builds a strongly typed GlobalAccountContext from user database entities.
 */
export function buildGlobalAccountContext(input: {
  userId: string;
  email: string;
  fullName: string;
  mobileNumber?: string | null;
  accountType?: string | null;
  legacyRole?: string | null;
  accountStatus?: string | null;
  countryCode?: string | null;
  providerOnboardingState?: ProviderOnboardingState | null;
  renterOnboardingState?: RenterOnboardingState | null;
  kycVerificationStatus?: string | null;
  languageTag?: string | null;
  displayCurrency?: string | null;
  businessName?: string | null;
  address?: string | null;
  city?: string | null;
}): GlobalAccountContext {
  const accountType: 'Individual' | 'Business' = input.accountType === 'Business' ? 'Business' : 'Individual';
  const accountStatus = input.accountStatus || 'Pending';

  const { systemRole, marketplaceRoles } = mapLegacyUserRoleToSystemAndMarketplace(
    input.legacyRole,
    accountType
  );

  const operatingJurisdiction = resolveOperatingJurisdiction(input.countryCode) || 'PH';

  // Map legacy verification status to typed KycState
  let kycState: KycState = 'KYC_NOT_REQUIRED';
  switch (input.kycVerificationStatus) {
    case 'Verified':
      kycState = 'KYC_APPROVED';
      break;
    case 'Pending':
      kycState = 'KYC_PENDING';
      break;
    case 'Rejected':
      kycState = 'KYC_REJECTED';
      break;
    case 'Unverified':
    default:
      kycState = 'KYC_REQUIRED';
      break;
  }

  // Determine provider onboarding state
  let providerState: ProviderOnboardingState = input.providerOnboardingState || 'NOT_STARTED';
  if (!input.providerOnboardingState) {
    if (hasMarketplaceRole(marketplaceRoles, 'PROVIDER')) {
      // Legacy provider accounts that are Verified default to APPROVED, Pending to UNDER_REVIEW
      providerState = accountStatus === 'Verified' ? 'APPROVED' : 'UNDER_REVIEW';
    } else {
      providerState = 'NOT_STARTED';
    }
  }

  // Determine renter onboarding state
  let renterState: RenterOnboardingState = input.renterOnboardingState || 'READY';
  if (!input.renterOnboardingState) {
    renterState = accountStatus === 'Verified' ? 'READY' : 'PROFILE_PENDING';
  }

  const profileCompleteness = evaluateProfileCompleteness({
    fullName: input.fullName,
    email: input.email,
    mobileNumber: input.mobileNumber,
    operatingJurisdiction,
    accountType,
    businessName: input.businessName,
    address: input.address,
    city: input.city,
  });

  const context: GlobalAccountContext = {
    userId: input.userId,
    email: input.email,
    fullName: input.fullName,
    mobileNumber: input.mobileNumber ?? null,
    accountType,
    accountStatus,
    systemRole,
    marketplaceRoles: Object.freeze(marketplaceRoles),
    operatingJurisdiction,
    providerOnboardingState: providerState,
    renterOnboardingState: renterState,
    kycState,
    canActAsRenter: canActAsRenter(marketplaceRoles, accountStatus),
    canActAsProvider: canActAsProvider(marketplaceRoles, accountStatus, providerState),
    canPublishAsProvider: false, // Calculated next
    profileCompleteness,
    languageTag: input.languageTag || 'en-PH',
    displayCurrency: input.displayCurrency || 'PHP',
  };

  const publishCheck = canPublishAsProvider(context, operatingJurisdiction);

  return Object.freeze({
    ...context,
    canPublishAsProvider: publishCheck.allowed,
  });
}

/**
 * Handles provider onboarding request (intent).
 * Safe and idempotent: registering intent does NOT auto-approve provider authorization.
 */
export function requestProviderOnboardingIntent(
  currentContext: GlobalAccountContext,
  providerType: ProviderType
): { success: boolean; nextState: ProviderOnboardingState; message: string } {
  if (['Suspended', 'Blacklisted', 'Disabled'].includes(currentContext.accountStatus)) {
    return {
      success: false,
      nextState: currentContext.providerOnboardingState,
      message: 'Account is suspended or disabled. Cannot request provider onboarding.',
    };
  }

  const jurisdictionCheck = canStartProviderOnboarding(currentContext.operatingJurisdiction);
  if (!jurisdictionCheck.allowed) {
    return {
      success: false,
      nextState: currentContext.providerOnboardingState,
      message: jurisdictionCheck.reason || 'Provider onboarding is not permitted in this jurisdiction.',
    };
  }

  // If already approved, remain approved (idempotent)
  if (currentContext.providerOnboardingState === 'APPROVED') {
    return {
      success: true,
      nextState: 'APPROVED',
      message: 'Provider is already approved in this jurisdiction.',
    };
  }

  // Transitions from NOT_STARTED to STARTED / DOCUMENTS_REQUIRED
  return {
    success: true,
    nextState: 'DOCUMENTS_REQUIRED',
    message: `Provider onboarding intent registered for ${providerType}. Verification documents required.`,
  };
}
