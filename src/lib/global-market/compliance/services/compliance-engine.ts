/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Compliance Policy Engine
 *
 * Evaluates regulatory eligibility across the full marketplace lifecycle.
 *
 * PERMANENT INVARIANTS:
 * - UNKNOWN JURISDICTION FAILS CLOSED.
 * - CANNOT OVERRIDE GM-1 ACTIVATION GOVERNANCE.
 * - COMMERCIAL ACTIVATION ELIGIBILITY STRICTLY REQUIRES ZERO UNRESOLVED BLOCKERS.
 */

import {
  resolveJurisdictionComplianceProfile,
} from '../registry/jurisdiction-compliance-registry';
import {
  resolveCategoryPolicy,
} from '../registry/jurisdiction-category-policy-registry';
import {
  getMarketReadinessBlockers,
} from '../registry/market-readiness-resolver';

export interface ComplianceCheckResult {
  readonly allowed: boolean;
  readonly reasonCode: string;
  readonly details?: string;
  readonly blockers?: readonly string[];
}

/**
 * Checks whether user registration is permitted in a jurisdiction.
 */
export function canRegister(jurisdictionCode: string): ComplianceCheckResult {
  const profile = resolveJurisdictionComplianceProfile(jurisdictionCode);
  if (!profile) {
    return {
      allowed: false,
      reasonCode: 'UNKNOWN_JURISDICTION_REGISTRATION_BLOCKED',
      details: `Jurisdiction '${jurisdictionCode}' is not recognized in the authoritative catalog.`,
    };
  }

  if (profile.publicNetworkStatus === 'NOT_CLAIMED' || profile.privacyDataProtectionStatus === 'BLOCKED') {
    return {
      allowed: false,
      reasonCode: 'JURISDICTION_REGISTRATION_RESTRICTED',
      details: 'Public registration is restricted in this jurisdiction pending local compliance.',
      blockers: profile.knownBlockers,
    };
  }

  return {
    allowed: true,
    reasonCode: 'REGISTRATION_ALLOWED',
  };
}

/**
 * Checks whether provider onboarding is permitted in a jurisdiction.
 */
export function canOnboardProvider(
  jurisdictionCode: string,
  isBusiness: boolean
): ComplianceCheckResult {
  const profile = resolveJurisdictionComplianceProfile(jurisdictionCode);
  if (!profile) {
    return {
      allowed: false,
      reasonCode: 'UNKNOWN_JURISDICTION_PROVIDER_ONBOARDING_BLOCKED',
    };
  }

  if (profile.knownBlockers.length > 0) {
    return {
      allowed: false,
      reasonCode: 'PROVIDER_ONBOARDING_BLOCKED_BY_JURISDICTION_BLOCKERS',
      blockers: profile.knownBlockers,
    };
  }

  return {
    allowed: true,
    reasonCode: 'PROVIDER_ONBOARDING_PERMITTED',
  };
}

/**
 * Checks whether listing creation/publication is permitted for a category in a jurisdiction under compliance.
 */
export function canCompliancePublishListing(
  jurisdictionCode: string,
  categorySlug: string
): ComplianceCheckResult {
  const outcome = resolveCategoryPolicy(jurisdictionCode, categorySlug);

  if (!outcome.isAllowedForListing) {
    return {
      allowed: false,
      reasonCode: outcome.reasonCode,
      details: outcome.userGuidance,
    };
  }

  return {
    allowed: true,
    reasonCode: 'LISTING_PUBLICATION_PERMITTED',
  };
}

/**
 * Checks whether booking is permitted in a jurisdiction.
 */
export function canBook(jurisdictionCode: string): ComplianceCheckResult {
  const profile = resolveJurisdictionComplianceProfile(jurisdictionCode);
  if (!profile) {
    return {
      allowed: false,
      reasonCode: 'UNKNOWN_JURISDICTION_BOOKING_BLOCKED',
    };
  }

  if (profile.knownBlockers.length > 0) {
    return {
      allowed: false,
      reasonCode: 'BOOKING_BLOCKED_BY_JURISDICTION_BLOCKERS',
      blockers: profile.knownBlockers,
    };
  }

  return {
    allowed: true,
    reasonCode: 'BOOKING_PERMITTED',
  };
}

/**
 * Checks whether payment collection is permitted in a jurisdiction.
 */
export function canCollectPayment(jurisdictionCode: string): ComplianceCheckResult {
  const profile = resolveJurisdictionComplianceProfile(jurisdictionCode);
  if (!profile) {
    return {
      allowed: false,
      reasonCode: 'UNKNOWN_JURISDICTION_PAYMENT_BLOCKED',
    };
  }

  const isDomesticPH = profile.jurisdictionCode === 'PH';
  if (isDomesticPH) {
    return {
      allowed: true,
      reasonCode: 'DOMESTIC_PAYMENT_COLLECTION_PERMITTED',
    };
  }

  // International 45: Sandbox mock permitted, live production unconfigured
  return {
    allowed: false,
    reasonCode: 'PAYMENT_RAIL_VALIDATION_REQUIRED',
    details: 'International live payment collection rail requires provider configuration and compliance sign-off.',
  };
}

/**
 * Checks whether provider payout is permitted in a jurisdiction.
 */
export function canPayoutProvider(jurisdictionCode: string): ComplianceCheckResult {
  const profile = resolveJurisdictionComplianceProfile(jurisdictionCode);
  if (!profile) {
    return {
      allowed: false,
      reasonCode: 'UNKNOWN_JURISDICTION_PAYOUT_BLOCKED',
    };
  }

  const isDomesticPH = profile.jurisdictionCode === 'PH';
  if (isDomesticPH) {
    return {
      allowed: true,
      reasonCode: 'DOMESTIC_MANUAL_BATCH_PAYOUT_PERMITTED',
    };
  }

  return {
    allowed: false,
    reasonCode: 'PAYOUT_RAIL_NOT_CONFIGURED',
  };
}

/**
 * Checks whether cross-border transactions are permitted between two jurisdictions.
 */
export function canOperateCrossBorder(
  fromJurisdiction: string,
  toJurisdiction: string
): ComplianceCheckResult {
  const fromProfile = resolveJurisdictionComplianceProfile(fromJurisdiction);
  const toProfile = resolveJurisdictionComplianceProfile(toJurisdiction);

  if (!fromProfile || !toProfile) {
    return {
      allowed: false,
      reasonCode: 'CROSS_BORDER_UNKNOWN_JURISDICTION',
    };
  }

  if (fromProfile.crossBorderStatus === 'RESTRICTED' || toProfile.crossBorderStatus === 'RESTRICTED') {
    return {
      allowed: false,
      reasonCode: 'CROSS_BORDER_RESTRICTED',
      details: 'Cross-border rental transactions are currently restricted between these jurisdictions.',
    };
  }

  return {
    allowed: true,
    reasonCode: 'CROSS_BORDER_PERMITTED',
  };
}

/**
 * Checks whether a market can be activated commercially.
 * Invariant: GM-8A commerciallyActive count is strictly 0.
 */
export function canActivateCommercially(jurisdictionCode: string): ComplianceCheckResult {
  const blockers = getMarketReadinessBlockers(jurisdictionCode);

  if (blockers.length > 0) {
    return {
      allowed: false,
      reasonCode: 'COMMERCIAL_ACTIVATION_BLOCKED_BY_UNRESOLVED_BLOCKERS',
      blockers: blockers.map((b) => b.code),
    };
  }

  return {
    allowed: false,
    reasonCode: 'COMMERCIAL_ACTIVATION_GOVERNANCE_GATE_REQUIRED',
    details: 'Commercial activation requires explicit Project Owner approval and GM-11A sign-off.',
  };
}
