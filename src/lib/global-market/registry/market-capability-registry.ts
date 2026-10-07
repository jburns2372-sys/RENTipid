/**
 * RENTipid GLOBAL-MKT / v2.0 — Market Capability Registry
 *
 * Implements the centralized commercial capability and jurisdiction profile registry.
 * Reuses and derives strictly from the authoritative GLCC country catalog (46 countries).
 * ZERO duplicated country catalog lists.
 */

import {
  GLOBAL_COUNTRY_CATALOG,
  getCountryProfile as getGlccCountryProfile,
  type GlobalCountryProfile,
} from '@/lib/glcc/country/country-registry';

import {
  ALL_MARKET_CAPABILITIES,
  MANDATORY_MARKET_CAPABILITIES,
  type MarketCapability,
  type MarketCapabilityRecord,
  type MarketCapabilityStatus,
} from '../contracts/market-capability';

import type { MarketActivationState } from '../contracts/market-activation-state';
import type {
  JurisdictionProfile,
  OperationalRegion,
  PolicyReference,
  ProviderReference,
} from '../contracts/jurisdiction-profile';

import {
  evaluateJurisdictionActivation,
  canActivateJurisdiction,
  explainJurisdictionBlockers,
  type MarketActivationBlocker,
  type MarketActivationEvaluation,
  type OwnerActivationGate,
} from '../activation/market-activation-gate';

/**
 * Validates the mandatory architectural invariant:
 * GLOBAL-MKT COUNTRY COUNT == GLCC AUTHORITATIVE COUNTRY COUNT (46)
 */
export const AUTHORITATIVE_COUNTRY_COUNT = GLOBAL_COUNTRY_CATALOG.length;
if (AUTHORITATIVE_COUNTRY_COUNT !== 46) {
  throw new Error(
    `FATAL: Authoritative country registry invariant failed. Expected 46 countries, received ${AUTHORITATIVE_COUNTRY_COUNT}.`
  );
}

/**
 * Creates default conservative capability records for a jurisdiction
 */
function createDefaultCapabilities(
  countryCode: string,
  glccProfile: GlobalCountryProfile
): Record<MarketCapability, MarketCapabilityRecord> {
  const records: Partial<Record<MarketCapability, MarketCapabilityRecord>> = {};

  for (const cap of ALL_MARKET_CAPABILITIES) {
    let status: MarketCapabilityStatus = 'VALIDATION_REQUIRED';
    let notes = `Commercial validation required under GLOBAL-MKT v2.0 for ${countryCode}.`;
    let blockers: string[] | undefined = undefined;

    switch (cap) {
      case 'ACCOUNT_REGISTRATION':
      case 'RENTER_ONBOARDING':
      case 'PROVIDER_ONBOARDING':
        status = 'VALIDATION_REQUIRED';
        notes = 'Cross-border account terms and consumer disclosures unvalidated.';
        break;

      case 'KYC_VERIFICATION':
        status = 'NOT_CONFIGURED';
        notes = 'No approved domestic KYC provider adapter configured.';
        break;

      case 'LISTING_CREATE':
      case 'LISTING_PUBLISH':
        status = 'VALIDATION_REQUIRED';
        notes = 'Address hierarchy & domestic rental listing terms unvalidated.';
        break;

      case 'PRICING':
        status = 'NOT_CONFIGURED';
        notes = 'Domestic transaction currency authority and rounding rules unvalidated.';
        break;

      case 'SEARCH_DISCOVERY':
        status = 'VALIDATION_REQUIRED';
        notes = 'Geographic radius and postal search unverified for this jurisdiction.';
        break;

      case 'BOOKING_RENTAL':
        status = 'VALIDATION_REQUIRED';
        notes = 'Jurisdiction-specific rental contract and handover protocol unvalidated.';
        break;

      case 'MESSAGING':
        status = 'VALIDATION_REQUIRED';
        notes = 'Telecom regulatory compliance and transactional notifications unvalidated.';
        break;

      case 'PAYMENT_COLLECTION':
        status = 'NOT_CONFIGURED';
        notes = 'Authorized domestic payment gateway not configured.';
        break;

      case 'PROVIDER_PAYOUT':
        status = 'NOT_CONFIGURED';
        notes = 'Automated domestic provider payout rail not configured.';
        break;

      case 'DEPOSIT':
      case 'REFUND':
        status = 'NOT_CONFIGURED';
        notes = 'Domestic deposit escrow and automated refund processing unconfigured.';
        break;

      case 'CANCELLATION':
      case 'CLAIM':
      case 'DISPUTE':
      case 'REVIEW':
        status = 'VALIDATION_REQUIRED';
        notes = 'Domestic dispute resolution and consumer protection terms unvalidated.';
        break;

      case 'LOCALIZATION':
        // UI localization exists in GLCC, but this alone does NOT commercially activate the market
        status = 'READY';
        notes = `GLCC multilingual UI catalog available with default language ${glccProfile.defaultLanguageTag}.`;
        break;

      case 'DISPLAY_CURRENCY':
        // Quoting exists in GLCC, but this is NOT transaction or settlement authority
        status = 'READY';
        notes = `GLCC display currency quoting available in ${glccProfile.defaultDisplayCurrency}. (Not settlement authority)`;
        break;

      case 'TAX_INVOICE':
        status = 'NOT_CONFIGURED';
        notes = 'Domestic VAT/sales tax calculation and invoicing unconfigured.';
        break;

      case 'RESTRICTED_CATEGORY_POLICY':
        status = 'VALIDATION_REQUIRED';
        notes = 'Jurisdiction-specific prohibited rental items pending legal verification.';
        break;

      case 'COMPLIANCE':
        status = 'PARTIAL';
        notes = `GLCC baseline compliance mapped (${glccProfile.complianceGroup}). Commercial statutory verification required.`;
        break;

      case 'ADDRESS_LOCATION':
        status = 'VALIDATION_REQUIRED';
        notes = 'Postal code schema and domestic address verification rules pending validation.';
        break;
    }

    records[cap] = {
      capability: cap,
      status,
      isMandatory: MANDATORY_MARKET_CAPABILITIES.includes(cap),
      notes,
      blockers,
    };
  }

  return records as Record<MarketCapability, MarketCapabilityRecord>;
}

/**
 * Builds conservative JurisdictionProfile instances derived directly from GLOBAL_COUNTRY_CATALOG.
 * No secondary list of countries is created.
 */
function buildJurisdictionProfiles(): Map<string, JurisdictionProfile> {
  const profileMap = new Map<string, JurisdictionProfile>();

  for (const country of GLOBAL_COUNTRY_CATALOG) {
    const countryCode = country.code;
    const capabilities = createDefaultCapabilities(countryCode, country);

    let activationState: MarketActivationState = 'FOUNDATION_READY';
    let knownBlockers: string[] = [];
    let operationalRestrictions: string[] = [];

    // Jurisdiction-specific baseline states based on GM-0 architectural audit
    if (countryCode === 'PH') {
      // Philippines has established legacy core functionality, but is NOT commercially active
      // under v2.0 pending automated provider payout integration and formal KYC provider audit.
      capabilities.ACCOUNT_REGISTRATION = {
        capability: 'ACCOUNT_REGISTRATION',
        status: 'READY',
        isMandatory: true,
        notes: 'Verified local Philippine auth & registration.',
      };
      capabilities.RENTER_ONBOARDING = {
        capability: 'RENTER_ONBOARDING',
        status: 'READY',
        isMandatory: true,
        notes: 'Philippine renter profile onboarding active.',
      };
      capabilities.PROVIDER_ONBOARDING = {
        capability: 'PROVIDER_ONBOARDING',
        status: 'READY',
        isMandatory: true,
        notes: 'Philippine provider profile onboarding active.',
      };
      capabilities.KYC_VERIFICATION = {
        capability: 'KYC_VERIFICATION',
        status: 'VALIDATION_REQUIRED',
        isMandatory: true,
        notes: 'Formal KYC provider audit required for GLOBAL-MKT v2.0 (Auth != KYC).',
      };
      capabilities.LISTING_CREATE = {
        capability: 'LISTING_CREATE',
        status: 'READY',
        isMandatory: true,
        notes: 'PSGC address integration active.',
      };
      capabilities.LISTING_PUBLISH = {
        capability: 'LISTING_PUBLISH',
        status: 'READY',
        isMandatory: true,
        notes: 'Philippine listing publication active.',
      };
      capabilities.PRICING = {
        capability: 'PRICING',
        status: 'READY',
        isMandatory: true,
        notes: 'PHP domestic pricing authority active.',
      };
      capabilities.SEARCH_DISCOVERY = {
        capability: 'SEARCH_DISCOVERY',
        status: 'READY',
        isMandatory: true,
        notes: 'PSGC geographic search operational.',
      };
      capabilities.BOOKING_RENTAL = {
        capability: 'BOOKING_RENTAL',
        status: 'READY',
        isMandatory: true,
        notes: 'Core rental booking lifecycle operational.',
      };
      capabilities.MESSAGING = {
        capability: 'MESSAGING',
        status: 'READY',
        isMandatory: true,
        notes: 'In-app notifications and messaging active.',
      };
      capabilities.PAYMENT_COLLECTION = {
        capability: 'PAYMENT_COLLECTION',
        status: 'READY',
        isMandatory: true,
        notes: 'PayMongo domestic payment collection active.',
      };
      capabilities.PROVIDER_PAYOUT = {
        capability: 'PROVIDER_PAYOUT',
        status: 'NOT_CONFIGURED',
        isMandatory: true,
        notes: 'Automated domestic provider payout rail not yet integrated under GLOBAL-MKT v2.0.',
        blockers: ['PH-BLK-001: Automated domestic provider payout rail integration required for GLOBAL-MKT v2.0'],
      };
      capabilities.DEPOSIT = {
        capability: 'DEPOSIT',
        status: 'READY',
        isMandatory: true,
        notes: 'Security deposit hold mechanism operational.',
      };
      capabilities.CANCELLATION = {
        capability: 'CANCELLATION',
        status: 'READY',
        isMandatory: true,
        notes: 'Cancellation workflow operational.',
      };
      capabilities.REFUND = {
        capability: 'REFUND',
        status: 'PARTIAL',
        isMandatory: true,
        notes: 'Manual refund operational; automated payment-gateway refund integration pending.',
      };
      capabilities.CLAIM = {
        capability: 'CLAIM',
        status: 'READY',
        isMandatory: true,
        notes: 'Damage claims workflow operational.',
      };
      capabilities.DISPUTE = {
        capability: 'DISPUTE',
        status: 'READY',
        isMandatory: true,
        notes: 'Dispute arbitration workflow operational.',
      };
      capabilities.REVIEW = {
        capability: 'REVIEW',
        status: 'READY',
        isMandatory: true,
        notes: 'Renter/provider review system operational.',
      };
      capabilities.RESTRICTED_CATEGORY_POLICY = {
        capability: 'RESTRICTED_CATEGORY_POLICY',
        status: 'READY',
        isMandatory: true,
        notes: 'Philippine prohibited items and restricted category rules active.',
      };
      capabilities.COMPLIANCE = {
        capability: 'COMPLIANCE',
        status: 'READY',
        isMandatory: true,
        notes: 'Philippine regulatory compliance active (DTI/SEC/NPC).',
      };
      capabilities.ADDRESS_LOCATION = {
        capability: 'ADDRESS_LOCATION',
        status: 'READY',
        isMandatory: true,
        notes: 'PSGC 82 provinces and barangay hierarchy active.',
      };

      knownBlockers = [
        'PH-BLK-001: Automated domestic provider payout rail integration required for GLOBAL-MKT v2.0',
      ];
      // Remains strictly non-ACTIVE
      activationState = 'FOUNDATION_READY';
    } else if (countryCode === 'CN') {
      // China: GLCC Production Available: YES, Commercial Active: NO
      // Carries forward the exact two China GLOBAL-MKT deferred blockers from CNTH governance
      capabilities.COMPLIANCE = {
        capability: 'COMPLIANCE',
        status: 'BLOCKED',
        isMandatory: true,
        notes: 'Mainland China regulatory approvals (ICP & CAC) are unresolved.',
        blockers: [
          'CN-BLK-001: ICP Filing / Commercial Telecommunications License Requirement (MIIT)',
          'CN-BLK-002: Cross-Border Data Transfer / CAC Security Assessment Requirement',
        ],
      };
      knownBlockers = [
        'CN-BLK-001: ICP Filing / Commercial Telecommunications License Requirement (MIIT)',
        'CN-BLK-002: Cross-Border Data Transfer / CAC Security Assessment Requirement',
      ];
      operationalRestrictions = [
        'MAINLAND_CHINA_PUBLIC_NETWORK_OPERABILITY_NOT_CLAIMED',
      ];
      activationState = 'FOUNDATION_READY';
    } else if (countryCode === 'TH') {
      // Thailand: GLCC Production Available: YES, Commercial Active: NO
      knownBlockers = [
        'TH-BLK-001: Domestic payment gateway adapter not configured',
        'TH-BLK-002: Automated domestic payout rail not configured',
      ];
      activationState = 'FOUNDATION_READY';
    }

    const defaultPolicyRef: PolicyReference = {
      refId: `POL-${countryCode}-DEFAULT`,
      status: countryCode === 'PH' ? 'ACTIVE' : 'VALIDATION_REQUIRED',
    };

    const defaultProviderRef: ProviderReference = {
      status: 'NOT_CONFIGURED',
      notes: 'No external provider adapter configured.',
    };

    const profile: JurisdictionProfile = {
      countryCode,
      marketId: `MKT-${countryCode}`,
      glccAvailable: Boolean(country.isActive && country.enabled),
      complianceGroup: country.complianceGroup,
      operatingRegion: country.regionCategory as OperationalRegion,
      activationState,
      capabilities: Object.freeze(capabilities),
      kycProfileRef: defaultProviderRef,
      addressProfileRef: defaultPolicyRef,
      listingPolicyRef: defaultPolicyRef,
      paymentProfileRef: countryCode === 'PH'
        ? { providerId: 'paymongo', status: 'CONFIGURED', notes: 'PayMongo adapter active for PH collection' }
        : defaultProviderRef,
      payoutProfileRef: defaultProviderRef,
      taxProfileRef: defaultPolicyRef,
      categoryPolicyRef: defaultPolicyRef,
      bookingPolicyRef: defaultPolicyRef,
      refundDepositDisputePolicyRef: defaultPolicyRef,
      privacyDataPolicyRef: defaultPolicyRef,
      operationalRestrictions: Object.freeze(operationalRestrictions),
      knownBlockers: Object.freeze(knownBlockers),
      validationRequirements: Object.freeze([
        `Mandatory end-to-end 13-capability acceptance required before commercial activation of ${countryCode}.`,
      ]),
    };

    profileMap.set(countryCode, Object.freeze(profile));
  }

  return profileMap;
}

// Singleton cached map initialized strictly from GLOBAL_COUNTRY_CATALOG
const JURISDICTION_PROFILES = buildJurisdictionProfiles();

/**
 * Retrieves a JurisdictionProfile by ISO 3166-1 alpha-2 country code.
 * Fails closed (returns null) if country code is unknown or missing.
 */
export function getJurisdictionProfile(countryCode: string | null | undefined): JurisdictionProfile | null {
  if (!countryCode || typeof countryCode !== 'string') return null;
  const upper = countryCode.trim().toUpperCase();
  return JURISDICTION_PROFILES.get(upper) ?? null;
}

/**
 * Returns all 46 registered JurisdictionProfiles.
 */
export function getAllJurisdictionProfiles(): readonly JurisdictionProfile[] {
  return Object.freeze(Array.from(JURISDICTION_PROFILES.values()));
}

/**
 * Retrieves a specific capability record for a given country.
 * Fails closed (returns null) if country or capability is unknown.
 */
export function getMarketCapability(
  countryCode: string,
  capability: MarketCapability
): MarketCapabilityRecord | null {
  const profile = getJurisdictionProfile(countryCode);
  if (!profile) return null;
  return profile.capabilities[capability] ?? null;
}

/**
 * Returns all capability records for a given country.
 * Fails closed (returns null) if country is unknown.
 */
export function getMarketCapabilities(
  countryCode: string
): Readonly<Record<MarketCapability, MarketCapabilityRecord>> | null {
  const profile = getJurisdictionProfile(countryCode);
  return profile ? profile.capabilities : null;
}

/**
 * Retrieves the commercial activation state of a country.
 * Fails closed (returns null) if country is unknown.
 */
export function getMarketActivationState(countryCode: string): MarketActivationState | null {
  const profile = getJurisdictionProfile(countryCode);
  return profile ? profile.activationState : null;
}

/**
 * Checks if a specific capability is in 'READY' status.
 */
export function isCapabilityReady(countryCode: string, capability: MarketCapability): boolean {
  const cap = getMarketCapability(countryCode, capability);
  return cap?.status === 'READY';
}

/**
 * Returns all capability records that are BLOCKED or NOT_CONFIGURED for a country.
 */
export function getBlockingCapabilities(countryCode: string): readonly MarketCapabilityRecord[] {
  const profile = getJurisdictionProfile(countryCode);
  if (!profile) return Object.freeze([]);
  const result: MarketCapabilityRecord[] = [];
  for (const cap of ALL_MARKET_CAPABILITIES) {
    const rec = profile.capabilities[cap];
    if (rec && (rec.status === 'BLOCKED' || rec.status === 'NOT_CONFIGURED')) {
      result.push(rec);
    }
  }
  return Object.freeze(result);
}

/**
 * Returns all capability records that are VALIDATION_REQUIRED or UNKNOWN for a country.
 */
export function getValidationRequiredCapabilities(countryCode: string): readonly MarketCapabilityRecord[] {
  const profile = getJurisdictionProfile(countryCode);
  if (!profile) return Object.freeze([]);
  const result: MarketCapabilityRecord[] = [];
  for (const cap of ALL_MARKET_CAPABILITIES) {
    const rec = profile.capabilities[cap];
    if (rec && (rec.status === 'VALIDATION_REQUIRED' || rec.status === 'UNKNOWN' || rec.status === 'PARTIAL')) {
      result.push(rec);
    }
  }
  return Object.freeze(result);
}

/**
 * Returns full commercial activation evaluation for a given country.
 * Fails closed if country is unknown or missing.
 */
export function evaluateMarketActivation(
  countryCode: string,
  ownerGate?: OwnerActivationGate
): MarketActivationEvaluation {
  const profile = getJurisdictionProfile(countryCode);
  return evaluateJurisdictionActivation(profile, ownerGate);
}

/**
 * Gating function: Determines if a market can legally/technically be declared ACTIVE.
 * Fails closed for unknown countries, missing profiles, non-ready capabilities, and missing owner signoff.
 */
export function canActivateMarket(countryCode: string, ownerGate?: OwnerActivationGate): boolean {
  const profile = getJurisdictionProfile(countryCode);
  if (!profile) return false;
  return canActivateJurisdiction(profile, ownerGate);
}

/**
 * Returns human-readable blockers explaining why a jurisdiction cannot be activated.
 */
export function explainMarketActivationBlockers(
  countryCode: string
): readonly MarketActivationBlocker[] {
  const profile = getJurisdictionProfile(countryCode);
  return explainJurisdictionBlockers(profile);
}

/**
 * Returns the count of authoritative countries in the system.
 * Guaranteed to equal 46.
 */
export function getAuthoritativeCountryCount(): number {
  return JURISDICTION_PROFILES.size;
}

/**
 * Returns list of country codes that are currently commercially active.
 * Guaranteed to return an empty array (count = 0) in GM-1.
 */
export function getCommerciallyActiveCountries(): readonly string[] {
  const active: string[] = [];
  for (const [code, profile] of JURISDICTION_PROFILES.entries()) {
    const evalResult = evaluateJurisdictionActivation(profile);
    if (evalResult.isCommerciallyActive) {
      active.push(code);
    }
  }
  return Object.freeze(active);
}
