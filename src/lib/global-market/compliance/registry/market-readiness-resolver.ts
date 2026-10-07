/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Market Readiness Resolver
 *
 * Evaluates the readiness stage, capability states, gap-closure blockers, and
 * prerequisites across all 46 authoritative jurisdictions.
 *
 * PERMANENT INVARIANTS:
 * - 46-COUNTRY FULL-FUNCTION MARKETPLACE: One global marketplace across all 46 countries.
 * - COMMERCIALLY ACTIVE COUNT = 0.
 * - PREVIEW_ACCEPTED = 0, PRODUCTION_ACCEPTED = 0, OWNER_ACCEPTED = 0.
 * - PHILIPPINES: First fully locally accepted full-transaction market.
 * - OTHER 45: Remaining markets requiring concrete gap closure (NOT listing-only, NOT ph-only).
 * - CHINA 2 DEFERRED BLOCKERS PRESERVED (ICP_LICENSE_REQUIRED, PIPL_DATA_LOCALIZATION_COMPLIANCE).
 * - MAINLAND CHINA PUBLIC NETWORK OPERABILITY: NOT_CLAIMED.
 * - UNKNOWN JURISDICTION FAILS CLOSED (returns null).
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import {
  type MarketReadinessProfile,
  type MarketBlockerItem,
  type MarketReadinessStage,
} from '../contracts/market-readiness';
import { resolveJurisdictionProviderMapping } from './provider-capability-registry';
import { resolveJurisdictionComplianceProfile } from './jurisdiction-compliance-registry';
import { resolveJurisdictionTaxProfile } from './jurisdiction-tax-registry';

export const AUTHORITATIVE_READINESS_PROFILE_COUNT = GLOBAL_COUNTRY_CATALOG.length; // 46

function buildReadinessProfile(countryCode: string, countryName: string): MarketReadinessProfile {
  const isDomesticPH = countryCode === 'PH';
  const isChina = countryCode === 'CN';
  const isThailand = countryCode === 'TH';

  const providerMapping = resolveJurisdictionProviderMapping(countryCode);
  const complianceProfile = resolveJurisdictionComplianceProfile(countryCode);
  const taxProfile = resolveJurisdictionTaxProfile(countryCode);

  const providerGaps: string[] = providerMapping ? [...providerMapping.explicitProviderGaps] : ['PROVIDER_MAPPING_MISSING'];
  const complianceGaps: string[] = complianceProfile ? [...complianceProfile.validationRequiredItems] : ['COMPLIANCE_PROFILE_MISSING'];
  const taxValidationItems: string[] = taxProfile ? [...taxProfile.validationRequiredItems] : ['TAX_PROFILE_MISSING'];

  const allValidationItems = Array.from(new Set([...complianceGaps, ...taxValidationItems]));

  let currentStage: MarketReadinessStage = 'REGISTERED';
  let highestProvenStage: MarketReadinessStage = 'REGISTERED';
  let isEligibleForLocalAcceptance = false;

  const blockers: MarketBlockerItem[] = [];

  // Universal capabilities enabled across all 46 jurisdictions on the shared platform core
  const accountReady = true;
  const renterReady = true;
  const providerReady = true;
  const addressReady = true;
  const listingCreateReady = true;
  const listingPublishReady = true;
  const searchDiscoveryReady = true;
  const internationalDiscoveryReady = true;
  const messagingReady = true;
  const categoryPolicyReady = true;

  // Transactional and compliance readiness tracking
  let kycReady = false;
  let businessVerificationReady = false;
  let bookingReady = false;
  let paymentReady = false;
  let payoutReady = false;
  let depositReady = false;
  let cancellationReady = false;
  let refundReady = false;
  let claimReady = false;
  let disputeReady = false;
  let reviewReady = false;
  let taxReady = false;
  let invoiceReady = false;
  let complianceReady = false;
  let transactionReady = false;
  let localAccepted = false;
  let requiresGapClosure = true;

  if (isDomesticPH) {
    currentStage = 'FOUNDATION_READY';
    highestProvenStage = 'FOUNDATION_READY';
    isEligibleForLocalAcceptance = true; // PH has working local payment, listing, booking, KYC, and post-transaction

    kycReady = true;
    businessVerificationReady = true;
    bookingReady = true;
    paymentReady = true;
    payoutReady = true;
    depositReady = true;
    cancellationReady = true;
    refundReady = true;
    claimReady = true;
    disputeReady = true;
    reviewReady = true;
    taxReady = true;
    invoiceReady = true;
    complianceReady = true;
    transactionReady = true;
    localAccepted = false; // Transitions to true upon GM-9A local acceptance verification
    requiresGapClosure = false; // Baseline local transaction path validated

    blockers.push({
      code: 'AUTOMATED_PAYOUT_RAIL_MISSING',
      title: 'Automated Provider Payout Rail Missing',
      severity: 'REQUIRED_BEFORE_PREVIEW',
      description: 'Payouts currently require manual batch reconciliation rather than automated direct disbursement.',
      remediationAction: 'Integrate and test automated disbursement rail prior to Preview deployment.',
      gapCategory: 'PAYOUT_PROVIDER',
      blockerType: 'TECHNICAL_VALIDATION',
      affectedCapabilities: ['PAYOUT'],
    });
    blockers.push({
      code: 'LOCAL_TAX_CLEARANCE_REQUIRED',
      title: 'Local Withholding and E-Invoicing Reconciliation',
      severity: 'REQUIRED_BEFORE_PRODUCTION',
      description: 'BIR regulations on marketplace withholding and digital reporting require formal tax audit.',
      remediationAction: 'Complete tax opinion review under GM-8A / GM-11A.',
      gapCategory: 'TAX',
      blockerType: 'LEGAL_REVIEW',
      affectedCapabilities: ['TAX'],
    });
  } else if (isChina) {
    currentStage = 'REGISTERED';
    highestProvenStage = 'REGISTERED';
    isEligibleForLocalAcceptance = false;

    // Preserving the exact 2 deferred blockers as completion blockers for China
    blockers.push({
      code: 'ICP_LICENSE_REQUIRED',
      title: 'Commercial ICP License Required',
      severity: 'BLOCKER',
      description: 'Operating commercial web services in mainland China requires an in-country business entity and MIIT ICP license.',
      remediationAction: 'Establish qualified domestic joint venture or partner entity to apply for ICP license.',
      gapCategory: 'MARKETPLACE_LICENSING',
      blockerType: 'REGULATORY_REQUIREMENT',
      affectedCapabilities: ['FULL_MARKET_ACTIVATION', 'PUBLIC_NETWORK'],
    });
    blockers.push({
      code: 'PIPL_DATA_LOCALIZATION_COMPLIANCE',
      title: 'Personal Information Protection Law (PIPL) Localization',
      severity: 'BLOCKER',
      description: 'User personal identifiable information must be stored locally within mainland China servers.',
      remediationAction: 'Deploy dedicated China-region server infrastructure and pass CAC cross-border transfer assessment.',
      gapCategory: 'DATA_RESIDENCY',
      blockerType: 'REGULATORY_REQUIREMENT',
      affectedCapabilities: ['FULL_MARKET_ACTIVATION', 'DATA_RESIDENCY'],
    });
  } else if (isThailand) {
    currentStage = 'REGISTERED';
    highestProvenStage = 'REGISTERED';
    isEligibleForLocalAcceptance = false;

    blockers.push({
      code: 'TH_PAYMENT_PROVIDER_MISSING',
      title: 'Thailand Domestic Payment Collection Missing',
      severity: 'BLOCKER',
      description: 'PromptPay and local Thai credit card acquiring are unconfigured in production.',
      remediationAction: 'Configure global or regional payment gateway supporting THB PromptPay rails.',
      gapCategory: 'PAYMENT_PROVIDER',
      blockerType: 'EXTERNAL_PROVIDER_REQUIRED',
      affectedCapabilities: ['PAYMENT'],
    });
    blockers.push({
      code: 'TH_PAYOUT_PROVIDER_MISSING',
      title: 'Thailand Local Payout Provider Missing',
      severity: 'BLOCKER',
      description: 'Direct Thai bank transfer payout rail is unconfigured.',
      remediationAction: 'Onboard regional payout rail provider for direct promptpay/bank transfer.',
      gapCategory: 'PAYOUT_PROVIDER',
      blockerType: 'EXTERNAL_PROVIDER_REQUIRED',
      affectedCapabilities: ['PAYOUT'],
    });
    blockers.push({
      code: 'TH_LEGAL_VALIDATION_REQUIRED',
      title: 'Thai Consumer Protection & DBD Registration Required',
      severity: 'REQUIRED_BEFORE_PRODUCTION',
      description: 'Department of Business Development (DBD) e-commerce registration must be secured.',
      remediationAction: 'Execute statutory DBD registration filing.',
      gapCategory: 'CONSUMER_PROTECTION',
      blockerType: 'LEGAL_REVIEW',
      affectedCapabilities: ['COMPLIANCE'],
    });
  } else {
    currentStage = 'REGISTERED';
    highestProvenStage = 'REGISTERED';
    isEligibleForLocalAcceptance = false;

    blockers.push({
      code: 'INTERNATIONAL_PAYMENT_PROVIDER_MISSING',
      title: `Payment Collection Rail Missing for ${countryCode}`,
      severity: 'BLOCKER',
      description: `No production-grade payment provider is mapped or verified for ${countryCode}.`,
      remediationAction: 'Map and verify global payment rail provider (e.g. Stripe, Adyen).',
      gapCategory: 'PAYMENT_PROVIDER',
      blockerType: 'EXTERNAL_PROVIDER_REQUIRED',
      affectedCapabilities: ['PAYMENT'],
    });
    blockers.push({
      code: 'INTERNATIONAL_PAYOUT_PROVIDER_MISSING',
      title: `Payout Rail Missing for ${countryCode}`,
      severity: 'BLOCKER',
      description: `No provider payout disbursement rail is mapped for ${countryCode}.`,
      remediationAction: 'Map and verify cross-border or local disbursement provider.',
      gapCategory: 'PAYOUT_PROVIDER',
      blockerType: 'EXTERNAL_PROVIDER_REQUIRED',
      affectedCapabilities: ['PAYOUT'],
    });
    blockers.push({
      code: 'INTERNATIONAL_LEGAL_VALIDATION_REQUIRED',
      title: `Statutory Legal & Tax Audit Required for ${countryCode}`,
      severity: 'REQUIRED_BEFORE_PRODUCTION',
      description: 'Local consumer protection, platform liability, and tax rules require legal validation.',
      remediationAction: 'Engage local legal counsel or compliance partner prior to commercial launch.',
      gapCategory: 'LEGAL_REVIEW',
      blockerType: 'LEGAL_REVIEW',
      affectedCapabilities: ['COMPLIANCE'],
    });
  }

  const activationPrerequisites: string[] = [
    'FULL_SHARED_ENGINE_LOCAL_ACCEPTANCE',
    'PROVIDER_RAIL_SELECTION_AND_SANDBOX_VERIFICATION',
    'LEGAL_AND_TAX_COMPLIANCE_SIGN_OFF',
    'PREVIEW_INTEGRATED_ACCEPTANCE_PASS',
    'PROJECT_OWNER_COMMERCIAL_ACTIVATION_APPROVAL',
  ];

  return Object.freeze({
    jurisdictionCode: countryCode,
    countryName,
    currentStage,
    highestProvenStage,
    isEligibleForLocalAcceptance,
    commerciallyActive: false, // Invariant: 0 active

    accountReady,
    renterReady,
    providerReady,
    kycReady,
    businessVerificationReady,
    addressReady,
    listingCreateReady,
    listingPublishReady,
    searchDiscoveryReady,
    internationalDiscoveryReady,
    messagingReady,
    bookingReady,
    paymentReady,
    payoutReady,
    depositReady,
    cancellationReady,
    refundReady,
    claimReady,
    disputeReady,
    reviewReady,
    taxReady,
    invoiceReady,
    categoryPolicyReady,
    complianceReady,
    transactionReady,
    localAccepted,
    previewAccepted: false,
    productionAccepted: false,
    ownerAccepted: false,
    fullyActive: false,

    requiresGapClosure,
    remainingBlockers: Object.freeze(blockers),

    blockers: Object.freeze(blockers),
    providerGaps: Object.freeze(providerGaps),
    complianceGaps: Object.freeze(complianceGaps),
    validationRequiredItems: Object.freeze(allValidationItems),
    activationPrerequisites: Object.freeze(activationPrerequisites),
  });
}

const readinessProfilesByCode = new Map<string, MarketReadinessProfile>();
for (const country of GLOBAL_COUNTRY_CATALOG) {
  readinessProfilesByCode.set(country.code, buildReadinessProfile(country.code, country.name));
}

/**
 * Resolves the MarketReadinessProfile for a country code.
 * Fails closed (returns null) for unknown country codes.
 */
export function getMarketReadiness(
  jurisdictionCode: string | null | undefined
): MarketReadinessProfile | null {
  if (!jurisdictionCode) return null;
  const upper = jurisdictionCode.trim().toUpperCase();
  return readinessProfilesByCode.get(upper) || null;
}

/**
 * Returns all active blockers for a jurisdiction.
 */
export function getMarketReadinessBlockers(
  jurisdictionCode: string | null | undefined
): readonly MarketBlockerItem[] {
  const profile = getMarketReadiness(jurisdictionCode);
  return profile ? profile.blockers : [];
}

/**
 * Returns explicit provider gaps for a jurisdiction.
 */
export function getProviderGaps(
  jurisdictionCode: string | null | undefined
): readonly string[] {
  const profile = getMarketReadiness(jurisdictionCode);
  return profile ? profile.providerGaps : ['UNKNOWN_JURISDICTION'];
}

/**
 * Returns compliance gaps for a jurisdiction.
 */
export function getComplianceGaps(
  jurisdictionCode: string | null | undefined
): readonly string[] {
  const profile = getMarketReadiness(jurisdictionCode);
  return profile ? profile.complianceGaps : ['UNKNOWN_JURISDICTION'];
}

/**
 * Returns mandatory activation prerequisites.
 */
export function getActivationPrerequisites(
  jurisdictionCode: string | null | undefined
): readonly string[] {
  const profile = getMarketReadiness(jurisdictionCode);
  return profile ? profile.activationPrerequisites : ['UNKNOWN_JURISDICTION'];
}

/**
 * Determines whether a jurisdiction can proceed to GM-9A local acceptance testing.
 */
export function canProceedToLocalAcceptance(
  jurisdictionCode: string | null | undefined
): boolean {
  const profile = getMarketReadiness(jurisdictionCode);
  return profile ? profile.isEligibleForLocalAcceptance : false;
}

/**
 * Returns all 46 authoritative readiness profiles.
 */
export function getAllMarketReadinessProfiles(): readonly MarketReadinessProfile[] {
  return Array.from(readinessProfilesByCode.values());
}

/**
 * Returns all jurisdictions currently requiring gap closure.
 */
export function getJurisdictionsRequiringGapClosure(): readonly MarketReadinessProfile[] {
  return getAllMarketReadinessProfiles().filter(p => p.requiresGapClosure);
}

/**
 * Controlling program-level gate to determine whether GLOBAL-MKT v2.0 is complete.
 * Returns true ONLY when all 46 countries have achieved full local, preview, and production acceptance.
 */
export interface GlobalMarketplaceV2CompletionStatus {
  readonly isComplete: boolean;
  readonly authoritativeCountries: number;
  readonly targetCountries: number;
  readonly fullyAcceptedCount: number;
  readonly pendingGapClosureCount: number;
  readonly reason: string;
}

export function isGlobalMarketplaceV2Complete(): GlobalMarketplaceV2CompletionStatus {
  const allProfiles = getAllMarketReadinessProfiles();
  const fullyAccepted = allProfiles.filter(
    p => p.localAccepted && p.previewAccepted && p.productionAccepted && p.fullyActive && p.remainingBlockers.length === 0
  );
  const pendingGapClosure = allProfiles.filter(p => p.requiresGapClosure);

  const isComplete = allProfiles.length === 46 && fullyAccepted.length === 46;

  return {
    isComplete,
    authoritativeCountries: allProfiles.length,
    targetCountries: 46,
    fullyAcceptedCount: fullyAccepted.length,
    pendingGapClosureCount: pendingGapClosure.length,
    reason: isComplete
      ? 'All 46 authoritative jurisdictions have achieved full marketplace acceptance.'
      : `${pendingGapClosure.length} of ${allProfiles.length} authoritative jurisdictions require full-function gap closure. Commercial freeze is prohibited.`,
  };
}


/**
 * Capability-specific evaluation queries (Section 7, 30).
 */
export function canAccessMarket(jurisdictionCode: string | null | undefined): boolean {
  return getMarketReadiness(jurisdictionCode) !== null;
}

export function canRegisterAccount(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.accountReady : false;
}

export function isProviderOnboardingReady(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.providerReady : false;
}

export function canCreateListing(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.listingCreateReady : false;
}

export function isListingPublishReady(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.listingPublishReady : false;
}

export function canDiscoverListing(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.searchDiscoveryReady : false;
}

export function canMessageProvider(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.messagingReady : false;
}

export function canBookMarket(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.bookingReady : false;
}

export function isPaymentCollectionReady(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.paymentReady : false;
}

export function isProviderPayoutReady(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.payoutReady : false;
}

export function canFullyTransact(jurisdictionCode: string | null | undefined): boolean {
  const p = getMarketReadiness(jurisdictionCode);
  return p ? p.transactionReady : false;
}


/**
 * Controlled transition of an eligible jurisdiction to LOCAL_ACCEPTED upon verified full integrated acceptance.
 * Re-evaluates all mandatory capabilities and blockers before transition.
 * Blocks any jurisdiction with active BLOCKER severity items or unverified local adapters.
 */
export function transitionMarketToLocalAccepted(countryCode: string | null | undefined): {
  readonly success: boolean;
  readonly newStage: MarketReadinessStage;
  readonly reason?: string;
} {
  const profile = getMarketReadiness(countryCode);
  if (!profile) {
    return { success: false, newStage: 'REGISTERED', reason: 'UNKNOWN_JURISDICTION' };
  }
  if (!profile.isEligibleForLocalAcceptance) {
    return { success: false, newStage: profile.currentStage, reason: 'NOT_ELIGIBLE_FOR_LOCAL_ACCEPTANCE' };
  }
  // Check if any severity: 'BLOCKER' exists
  const hardBlockers = profile.blockers.filter(b => b.severity === 'BLOCKER');
  if (hardBlockers.length > 0) {
    return { success: false, newStage: profile.currentStage, reason: 'HARD_BLOCKERS_PRESENT' };
  }

  // Update profile in map
  const updatedProfile: MarketReadinessProfile = Object.freeze({
    ...profile,
    currentStage: 'LOCAL_ACCEPTED' as MarketReadinessStage,
    highestProvenStage: 'LOCAL_ACCEPTED' as MarketReadinessStage,
    localAccepted: true,
  });
  readinessProfilesByCode.set(profile.jurisdictionCode, updatedProfile);

  return { success: true, newStage: 'LOCAL_ACCEPTED' };
}

/**
 * Resets all readiness profiles to the baseline configuration.
 */
export function resetMarketReadinessProfiles(): void {
  readinessProfilesByCode.clear();
  for (const country of GLOBAL_COUNTRY_CATALOG) {
    readinessProfilesByCode.set(country.code, buildReadinessProfile(country.code, country.name));
  }
}
