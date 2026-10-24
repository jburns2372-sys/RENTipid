/**
 * RENTipid GLOBAL-MKT / v2.0 — Server-Authoritative Listing Publication Gate
 *
 * Implements strict publication security combining:
 * - GM-1: Jurisdiction Capability & Operational Status
 * - GM-2: Global Account Marketplace Role & Provider Authorization
 * - GM-3A: Global Trust & KYC Verification State
 * - GM-4A: Location Completeness, Pricing Validity & Category Policy
 */

import { type GlobalAccountContext } from '@/lib/global-market/account/contracts/global-account-context';
import { type GlobalTrustProfile } from '@/lib/global-market/trust/contracts/trust-profile';
import { getJurisdictionProfile } from '@/lib/global-market/registry/market-capability-registry';
import { resolveOperatingJurisdiction } from '@/lib/global-market/account/services/account-service';
import { getJurisdictionKycProfile } from '@/lib/global-market/trust/registry/jurisdiction-kyc-registry';
import { validateLocation } from '@/lib/global-market/location/services/location-service';
import { validateListingPricing } from '@/lib/global-market/pricing/services/pricing-service';
import { type GlobalListingRecord } from '../contracts/listing-record';
import { type CategoryJurisdictionPolicy } from '../contracts/category-policy';

export interface PublicationGateInput {
  readonly userContext?: GlobalAccountContext | null;
  readonly account?: GlobalAccountContext | null; // Section 14 alias
  readonly trustProfile?: GlobalTrustProfile | null;
  readonly trust?: GlobalTrustProfile | null; // Section 14 alias
  readonly listing: GlobalListingRecord | any | null | undefined;
  readonly categoryPolicy?: CategoryJurisdictionPolicy | any | null;
  readonly policy?: CategoryJurisdictionPolicy | any | null; // Section 14 alias
  readonly jurisdiction?: string | null;
}

export interface PublicationGateResult {
  readonly allowed: boolean;
  readonly reasonCode: string;
  readonly reason?: string;
  readonly blockingGates: readonly string[];
}

export function canPublishListing(input: PublicationGateInput): PublicationGateResult {
  const blocking: string[] = [];
  const user = input.account || input.userContext;
  const trust = input.trust || input.trustProfile;
  const policy = input.policy || input.categoryPolicy;
  const listing = input.listing;

  // 1. Account Authentication & Status
  if (!user) {
    return {
      allowed: false,
      reasonCode: 'UNAUTHENTICATED',
      reason: 'Valid user account context required.',
      blockingGates: ['AUTHENTICATION'],
    };
  }

  if (['Suspended', 'Blacklisted', 'Disabled'].includes(user.accountStatus)) {
    return {
      allowed: false,
      reasonCode: 'ACCOUNT_NOT_ACTIVE',
      reason: `Account status is '${user.accountStatus}'.`,
      blockingGates: ['ACCOUNT_SUSPENDED'],
    };
  }

  // 2. Marketplace Role Authorization (GM-2)
  if (!user.marketplaceRoles || !user.marketplaceRoles.includes('PROVIDER')) {
    return {
      allowed: false,
      reasonCode: 'PROVIDER_ROLE_REQUIRED',
      reason: 'Account lacks the PROVIDER marketplace role.',
      blockingGates: ['ROLE_NOT_AUTHORIZED'],
    };
  }

  if (user.providerOnboardingState !== 'APPROVED') {
    return {
      allowed: false,
      reasonCode: 'PROVIDER_ONBOARDING_INCOMPLETE',
      reason: `Current onboarding state is '${user.providerOnboardingState}'.`,
      blockingGates: ['PROVIDER_ONBOARDING_INCOMPLETE'],
    };
  }

  // 3. Listing Object & Ownership (Section 13)
  if (!listing) {
    return {
      allowed: false,
      reasonCode: 'MISSING_LISTING',
      reason: 'Listing record required.',
      blockingGates: ['LISTING_PAYLOAD'],
    };
  }

  if (listing.providerId !== user.userId) {
    return {
      allowed: false,
      reasonCode: 'OWNERSHIP_VIOLATION',
      reason: 'User is not the owner of this listing.',
      blockingGates: ['OWNERSHIP_VIOLATION'],
    };
  }

  // 4. Jurisdiction Resolution & Activation Status (GM-1)
  const rawCountry = input.jurisdiction || listing.jurisdictionCode || listing.countryCode;
  const jurisdictionCode = resolveOperatingJurisdiction(rawCountry);
  if (!jurisdictionCode) {
    return {
      allowed: false,
      reasonCode: 'UNKNOWN_JURISDICTION',
      reason: `Invalid or unverified jurisdiction '${rawCountry}'.`,
      blockingGates: ['UNKNOWN_JURISDICTION'],
    };
  }

  const marketProfile = getJurisdictionProfile(jurisdictionCode);
  if (!marketProfile || marketProfile.activationState === 'BLOCKED' || marketProfile.activationState === 'SUSPENDED') {
    return {
      allowed: false,
      reasonCode: 'JURISDICTION_BLOCKED',
      reason: `Market '${jurisdictionCode}' is not authorized for listings.`,
      blockingGates: ['JURISDICTION_BLOCKED'],
    };
  }

  // 5. Trust / KYC Gating (GM-3A)
  const kycProfile = getJurisdictionKycProfile(jurisdictionCode);
  if (kycProfile && kycProfile.publicationVerificationRequirement === 'APPROVED') {
    const isKycApproved =
      user.kycState === 'KYC_APPROVED' ||
      trust?.kycState === 'APPROVED';

    if (!isKycApproved) {
      return {
        allowed: false,
        reasonCode: 'KYC_VERIFICATION_REQUIRED',
        reason: `Jurisdiction '${jurisdictionCode}' requires approved KYC verification prior to publishing.`,
        blockingGates: ['KYC_NOT_APPROVED'],
      };
    }
  }

  // Business verification check
  if (user.accountType === 'Business' && kycProfile?.businessVerificationRequired) {
    const isBizApproved = trust?.businessVerificationState === 'APPROVED';
    if (!isBizApproved) {
      return {
        allowed: false,
        reasonCode: 'BUSINESS_VERIFICATION_REQUIRED',
        reason: `Business providers in '${jurisdictionCode}' mandate verified business profile.`,
        blockingGates: ['BUSINESS_VERIFICATION_REQUIRED'],
      };
    }
  }

  // 6. Category Clearance & Policy (Section 16)
  const policyStatus = policy?.policyStatus || policy?.status;
  if (policy && (policyStatus === 'PROHIBITED' || policyStatus === 'BLOCKED')) {
    return {
      allowed: false,
      reasonCode: 'CATEGORY_PROHIBITED',
      reason: `Category '${policy.categoryId || policy.categorySlug}' is prohibited in this jurisdiction.`,
      blockingGates: ['CATEGORY_PROHIBITED'],
    };
  }

  // 7. Location Completeness & Validation
  const locVal = validateLocation(listing.location);
  if (!locVal.valid) {
    return {
      allowed: false,
      reasonCode: 'LOCATION_INVALID',
      reason: `Location validation failed: ${locVal.errors.join('; ')}`,
      blockingGates: ['LOCATION_INVALID'],
    };
  }

  // 8. Pricing Completeness & Validation
  const priceVal = validateListingPricing(listing.pricing);
  if (!priceVal.valid) {
    return {
      allowed: false,
      reasonCode: 'PRICING_INVALID',
      reason: `Pricing validation failed: ${priceVal.errors.join('; ')}`,
      blockingGates: ['PRICING_INVALID'],
    };
  }

  // 9. Basic Title / Description Completeness
  if (!listing.title || listing.title.trim().length === 0) {
    return {
      allowed: false,
      reasonCode: 'TITLE_REQUIRED',
      reason: 'Listing must have a non-empty title.',
      blockingGates: ['TITLE_REQUIRED'],
    };
  }

  return {
    allowed: true,
    reasonCode: 'GATE_PASSED',
    reason: 'All publication criteria satisfied.',
    blockingGates: Object.freeze([]),
  };
}
