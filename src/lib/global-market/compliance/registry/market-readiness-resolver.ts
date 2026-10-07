/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Market Readiness Resolver
 *
 * Evaluates the readiness stage, blockers, and prerequisites across all 46 markets.
 *
 * PERMANENT INVARIANTS:
 * - COMMERCIALLY ACTIVE COUNT = 0.
 * - LOCAL_ACCEPTED = 0, PREVIEW_ACCEPTED = 0, PRODUCTION_ACCEPTED = 0, OWNER_ACCEPTED = 0.
 * - CHINA 2 DEFERRED BLOCKERS PRESERVED.
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

  if (isDomesticPH) {
    currentStage = 'FOUNDATION_READY';
    highestProvenStage = 'FOUNDATION_READY';
    isEligibleForLocalAcceptance = true; // PH has working local payment, listing, booking, KYC, and post-transaction

    blockers.push({
      code: 'AUTOMATED_PAYOUT_RAIL_MISSING',
      title: 'Automated Provider Payout Rail Missing',
      severity: 'REQUIRED_BEFORE_PREVIEW',
      description: 'Payouts currently require manual batch reconciliation rather than automated direct disbursement.',
      remediationAction: 'Integrate and test automated disbursement rail prior to Preview deployment.',
    });
    blockers.push({
      code: 'LOCAL_TAX_CLEARANCE_REQUIRED',
      title: 'Local Withholding and E-Invoicing Reconciliation',
      severity: 'REQUIRED_BEFORE_PRODUCTION',
      description: 'BIR regulations on marketplace withholding and digital reporting require formal tax audit.',
      remediationAction: 'Complete tax opinion review under GM-8A / GM-11A.',
    });
  } else if (isChina) {
    currentStage = 'REGISTERED';
    highestProvenStage = 'REGISTERED';
    isEligibleForLocalAcceptance = false;

    // Preserve the 2 exact deferred blockers
    blockers.push({
      code: 'ICP_LICENSE_REQUIRED',
      title: 'Commercial ICP License Required',
      severity: 'BLOCKER',
      description: 'Operating commercial web services in mainland China requires an in-country business entity and MIIT ICP license.',
      remediationAction: 'Establish qualified domestic joint venture or partner entity to apply for ICP license.',
    });
    blockers.push({
      code: 'PIPL_DATA_LOCALIZATION_COMPLIANCE',
      title: 'Personal Information Protection Law (PIPL) Localization',
      severity: 'BLOCKER',
      description: 'User personal identifiable information must be stored locally within mainland China servers.',
      remediationAction: 'Deploy dedicated China-region server infrastructure and pass CAC cross-border transfer assessment.',
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
    });
    blockers.push({
      code: 'TH_PAYOUT_PROVIDER_MISSING',
      title: 'Thailand Local Payout Provider Missing',
      severity: 'BLOCKER',
      description: 'Direct Thai bank transfer payout rail is unconfigured.',
      remediationAction: 'Onboard regional payout rail provider for direct promptpay/bank transfer.',
    });
    blockers.push({
      code: 'TH_LEGAL_VALIDATION_REQUIRED',
      title: 'Thai Consumer Protection & DBD Registration Required',
      severity: 'REQUIRED_BEFORE_PRODUCTION',
      description: 'Department of Business Development (DBD) e-commerce registration must be secured.',
      remediationAction: 'Execute statutory DBD registration filing.',
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
    });
    blockers.push({
      code: 'INTERNATIONAL_PAYOUT_PROVIDER_MISSING',
      title: `Payout Rail Missing for ${countryCode}`,
      severity: 'BLOCKER',
      description: `No provider payout disbursement rail is mapped for ${countryCode}.`,
      remediationAction: 'Map and verify cross-border or local disbursement provider.',
    });
    blockers.push({
      code: 'INTERNATIONAL_LEGAL_VALIDATION_REQUIRED',
      title: `Statutory Legal & Tax Audit Required for ${countryCode}`,
      severity: 'REQUIRED_BEFORE_PRODUCTION',
      description: 'Local consumer protection, platform liability, and tax rules require legal validation.',
      remediationAction: 'Engage local legal counsel or compliance partner prior to commercial launch.',
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
