/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction KYC Profile Registry
 *
 * Implements the authoritative 46-country KYC policy framework.
 * Directly references the GM-1 country baseline and GLCC country catalog
 * without duplicating master country definitions.
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import { getJurisdictionProfile } from '@/lib/global-market/registry/market-capability-registry';
import { type JurisdictionKycProfile } from '../contracts/jurisdiction-kyc-profile';
import { type DocumentCategory } from '../contracts/document-requirement';

const STANDARD_REVERIFICATION_POLICY = Object.freeze({
  expiryMonths: 24,
  triggerOnSuspiciousActivity: true,
  triggerOnBankChange: true,
  triggerOnAddressChange: true,
});

/**
 * Builds conservative baseline KYC profiles for each authoritative country.
 */
function buildAuthoritativeKycProfiles(): ReadonlyMap<string, JurisdictionKycProfile> {
  const map = new Map<string, JurisdictionKycProfile>();

  for (const country of GLOBAL_COUNTRY_CATALOG) {
    const code = country.code;
    const name = country.name;

    let profile: JurisdictionKycProfile;

    if (code === 'PH') {
      // Philippines — Active legacy manual compliance workflow
      profile = {
        countryCode: 'PH',
        countryName: name,
        renterVerificationRequired: false,
        providerVerificationRequired: true,
        businessVerificationRequired: true,
        identityDocumentsRequired: ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'SELFIE_LIVENESS'],
        addressProofRequired: true,
        minimumAge: 18,
        providerAdapter: 'MANUAL_INTERNAL',
        manualReviewAllowed: true,
        reverificationPolicy: STANDARD_REVERIFICATION_POLICY,
        publicationVerificationRequirement: 'APPROVED',
        paymentVerificationRequirement: 'NOT_REQUIRED',
        payoutVerificationRequirement: 'APPROVED',
        status: 'READY',
        blockers: ['Commercial activation not authorized'],
      };
    } else if (code === 'TH') {
      // Thailand — Conservative GLCC baseline
      profile = {
        countryCode: 'TH',
        countryName: name,
        renterVerificationRequired: false,
        providerVerificationRequired: true,
        businessVerificationRequired: true,
        identityDocumentsRequired: ['NATIONAL_ID', 'PASSPORT', 'SELFIE_LIVENESS'],
        addressProofRequired: true,
        minimumAge: 20, // Legal majority age in Thailand
        providerAdapter: 'NOT_CONFIGURED',
        manualReviewAllowed: true,
        reverificationPolicy: STANDARD_REVERIFICATION_POLICY,
        publicationVerificationRequirement: 'APPROVED',
        paymentVerificationRequirement: 'NOT_REQUIRED',
        payoutVerificationRequirement: 'APPROVED',
        status: 'VALIDATION_REQUIRED',
        blockers: [
          'Local automated identity verification provider not configured',
          'Thai DBD business registration registry integration pending',
          'Commercial activation not authorized',
        ],
      };
    } else if (code === 'CN') {
      // China — Preserving 2 deferred blockers
      profile = {
        countryCode: 'CN',
        countryName: name,
        renterVerificationRequired: true, // Real-name registration principle (中国网络实名制)
        providerVerificationRequired: true,
        businessVerificationRequired: true,
        identityDocumentsRequired: ['NATIONAL_ID', 'PASSPORT'],
        addressProofRequired: false,
        minimumAge: 18,
        providerAdapter: 'NOT_CONFIGURED',
        manualReviewAllowed: false,
        reverificationPolicy: STANDARD_REVERIFICATION_POLICY,
        publicationVerificationRequirement: 'APPROVED',
        paymentVerificationRequirement: 'APPROVED',
        payoutVerificationRequirement: 'APPROVED',
        status: 'VALIDATION_REQUIRED',
        blockers: [
          'China ICP Filing / Hosting Requirement (Deferred)',
          'Cross-Border Data Transfer PIPL Assessment (Deferred)',
          'Mainland China identity verification provider not configured',
          'Commercial activation not authorized',
        ],
      };
    } else if (code === 'SG') {
      // Singapore — Singpass / NRIC / FIN
      profile = {
        countryCode: 'SG',
        countryName: name,
        renterVerificationRequired: false,
        providerVerificationRequired: true,
        businessVerificationRequired: true,
        identityDocumentsRequired: ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'SELFIE_LIVENESS'],
        addressProofRequired: true,
        minimumAge: 18,
        providerAdapter: 'NOT_CONFIGURED',
        manualReviewAllowed: true,
        reverificationPolicy: STANDARD_REVERIFICATION_POLICY,
        publicationVerificationRequirement: 'APPROVED',
        paymentVerificationRequirement: 'NOT_REQUIRED',
        payoutVerificationRequirement: 'APPROVED',
        status: 'VALIDATION_REQUIRED',
        blockers: [
          'Singapore Singpass / automated KYC provider integration pending',
          'ACRA business registry verification pending',
          'Commercial activation not authorized',
        ],
      };
    } else if (code === 'MY') {
      // Malaysia — MyKad / Passport
      profile = {
        countryCode: 'MY',
        countryName: name,
        renterVerificationRequired: false,
        providerVerificationRequired: true,
        businessVerificationRequired: true,
        identityDocumentsRequired: ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'SELFIE_LIVENESS'],
        addressProofRequired: true,
        minimumAge: 18,
        providerAdapter: 'NOT_CONFIGURED',
        manualReviewAllowed: true,
        reverificationPolicy: STANDARD_REVERIFICATION_POLICY,
        publicationVerificationRequirement: 'APPROVED',
        paymentVerificationRequirement: 'NOT_REQUIRED',
        payoutVerificationRequirement: 'APPROVED',
        status: 'VALIDATION_REQUIRED',
        blockers: [
          'Malaysian MyKad automated verification provider pending',
          'SSM business registration integration pending',
          'Commercial activation not authorized',
        ],
      };
    } else if (code === 'VN') {
      // Vietnam — CCCD / Citizen ID / Passport
      profile = {
        countryCode: 'VN',
        countryName: name,
        renterVerificationRequired: false,
        providerVerificationRequired: true,
        businessVerificationRequired: true,
        identityDocumentsRequired: ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'SELFIE_LIVENESS'],
        addressProofRequired: true,
        minimumAge: 18,
        providerAdapter: 'NOT_CONFIGURED',
        manualReviewAllowed: true,
        reverificationPolicy: STANDARD_REVERIFICATION_POLICY,
        publicationVerificationRequirement: 'APPROVED',
        paymentVerificationRequirement: 'NOT_REQUIRED',
        payoutVerificationRequirement: 'APPROVED',
        status: 'VALIDATION_REQUIRED',
        blockers: [
          'Vietnam national CCCD chip card verification integration pending',
          'National business registration portal integration pending',
          'Commercial activation not authorized',
        ],
      };
    } else if (code === 'ID') {
      // Indonesia — KTP / Passport
      profile = {
        countryCode: 'ID',
        countryName: name,
        renterVerificationRequired: false,
        providerVerificationRequired: true,
        businessVerificationRequired: true,
        identityDocumentsRequired: ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'SELFIE_LIVENESS'],
        addressProofRequired: true,
        minimumAge: 18,
        providerAdapter: 'NOT_CONFIGURED',
        manualReviewAllowed: true,
        reverificationPolicy: STANDARD_REVERIFICATION_POLICY,
        publicationVerificationRequirement: 'APPROVED',
        paymentVerificationRequirement: 'NOT_REQUIRED',
        payoutVerificationRequirement: 'APPROVED',
        status: 'VALIDATION_REQUIRED',
        blockers: [
          'Indonesia Dukcapil identity verification gateway pending',
          'OSS NIB business registration verification pending',
          'Commercial activation not authorized',
        ],
      };
    } else {

      // Other 43 Authoritative Jurisdictions (US, SG, JP, EU, etc.)
      profile = {
        countryCode: code,
        countryName: name,
        renterVerificationRequired: false,
        providerVerificationRequired: true,
        businessVerificationRequired: true,
        identityDocumentsRequired: ['PASSPORT', 'NATIONAL_ID', 'DRIVER_LICENSE'],
        addressProofRequired: true,
        minimumAge: 18,
        providerAdapter: 'NOT_CONFIGURED',
        manualReviewAllowed: true,
        reverificationPolicy: STANDARD_REVERIFICATION_POLICY,
        publicationVerificationRequirement: 'APPROVED',
        paymentVerificationRequirement: 'NOT_REQUIRED',
        payoutVerificationRequirement: 'APPROVED',
        status: 'VALIDATION_REQUIRED',
        blockers: [
          'Local automated KYC provider adapter not configured',
          'Commercial activation not authorized',
        ],
      };
    }

    map.set(code, Object.freeze(profile));
  }

  return map;
}

const AUTHORITATIVE_KYC_PROFILES: ReadonlyMap<string, JurisdictionKycProfile> = buildAuthoritativeKycProfiles();

/**
 * Retrieves the KYC profile for an authoritative country.
 * Returns null (fail-closed) for unknown or invalid countries.
 */
export function getJurisdictionKycProfile(countryInput: string | null | undefined): JurisdictionKycProfile | null {
  if (!countryInput || typeof countryInput !== 'string') return null;
  const upper = countryInput.trim().toUpperCase();
  
  // Verify country exists in GM-1 baseline first
  if (!getJurisdictionProfile(upper)) {
    return null;
  }

  return AUTHORITATIVE_KYC_PROFILES.get(upper) || null;
}

/**
 * Returns all 46 authoritative jurisdiction KYC profiles.
 */
export function getAllJurisdictionKycProfiles(): readonly JurisdictionKycProfile[] {
  return Array.from(AUTHORITATIVE_KYC_PROFILES.values());
}

/**
 * Returns the count of authoritative jurisdiction KYC profiles (exactly 46).
 */
export function getAuthoritativeKycProfileCount(): number {
  return AUTHORITATIVE_KYC_PROFILES.size;
}
