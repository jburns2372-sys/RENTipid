/**
 * RENTipid GLOBAL-MKT / v2.0 — 46-Country Compliance Registry
 *
 * Dynamically resolves conservative JurisdictionComplianceProfiles for all 46 countries.
 *
 * PERMANENT INVARIANTS:
 * - CHINA DEFERRED BLOCKERS: 2 PRESERVED (ICP_LICENSE_REQUIRED, PIPL_DATA_LOCALIZATION_COMPLIANCE)
 * - MAINLAND CHINA PUBLIC NETWORK OPERABILITY: NOT_CLAIMED
 * - UNKNOWN JURISDICTION FAILS CLOSED (returns null).
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import { type JurisdictionComplianceProfile } from '../contracts/compliance-profile';

export const AUTHORITATIVE_COMPLIANCE_PROFILE_COUNT = GLOBAL_COUNTRY_CATALOG.length; // 46

function buildComplianceProfile(countryCode: string, countryName: string): JurisdictionComplianceProfile {
  const isDomesticPH = countryCode === 'PH';
  const isChina = countryCode === 'CN';
  const isThailand = countryCode === 'TH';

  if (isDomesticPH) {
    return Object.freeze({
      jurisdictionCode: 'PH',
      countryName,
      consumerProtectionStatus: 'VERIFIED',
      privacyDataProtectionStatus: 'VERIFIED',
      rentalMarketplaceStatus: 'ALLOWED',
      eCommerceStatus: 'ALLOWED',
      identityKycStatus: 'VERIFIED',
      paymentRegulatoryStatus: 'VERIFIED',
      payoutRegulatoryStatus: 'VERIFIED',
      taxStatus: 'CONFIGURED',
      invoiceStatus: 'CONFIGURED',
      categoryPolicyStatus: 'CONFIGURED',
      crossBorderStatus: 'ALLOWED',
      dataResidencyStatus: 'STANDARD',
      publicNetworkStatus: 'OPERABLE',
      ageRestrictionMinAge: 18,
      requiresLocalEntity: true,
      knownBlockers: Object.freeze([]),
      validationRequiredItems: Object.freeze([
        'INTERNET_TRANSACTIONS_ACT_EVALUATION',
      ]),
      legalSourceReferences: Object.freeze([
        'Republic Act No. 7394 (Consumer Act of the Philippines)',
        'Republic Act No. 10173 (Data Privacy Act of 2012)',
        'Republic Act No. 11967 (Internet Transactions Act of 2023)',
      ]),
    });
  }

  if (isChina) {
    return Object.freeze({
      jurisdictionCode: 'CN',
      countryName,
      consumerProtectionStatus: 'VALIDATION_REQUIRED',
      privacyDataProtectionStatus: 'BLOCKED',
      rentalMarketplaceStatus: 'RESTRICTED',
      eCommerceStatus: 'VALIDATION_REQUIRED',
      identityKycStatus: 'VALIDATION_REQUIRED',
      paymentRegulatoryStatus: 'VALIDATION_REQUIRED',
      payoutRegulatoryStatus: 'VALIDATION_REQUIRED',
      taxStatus: 'VALIDATION_REQUIRED',
      invoiceStatus: 'VALIDATION_REQUIRED',
      categoryPolicyStatus: 'VALIDATION_REQUIRED',
      crossBorderStatus: 'RESTRICTED',
      dataResidencyStatus: 'LOCALIZATION_MANDATORY',
      publicNetworkStatus: 'NOT_CLAIMED',
      ageRestrictionMinAge: 18,
      requiresLocalEntity: true,
      knownBlockers: Object.freeze([
        'ICP_LICENSE_REQUIRED',
        'PIPL_DATA_LOCALIZATION_COMPLIANCE',
      ]),
      validationRequiredItems: Object.freeze([
        'ICP_COMMERCIAL_LICENSE_APPLICATION',
        'PIPL_IN_COUNTRY_SERVER_LOCALIZATION',
        'CROSS_BORDER_DATA_TRANSFER_SECURITY_ASSESSMENT',
      ]),
      legalSourceReferences: Object.freeze([
        'Personal Information Protection Law (PIPL)',
        'Telecommunications Regulations of the People\'s Republic of China (ICP Framework)',
      ]),
    });
  }

  if (isThailand) {
    return Object.freeze({
      jurisdictionCode: 'TH',
      countryName,
      consumerProtectionStatus: 'VALIDATION_REQUIRED',
      privacyDataProtectionStatus: 'VALIDATION_REQUIRED',
      rentalMarketplaceStatus: 'ALLOWED',
      eCommerceStatus: 'VALIDATION_REQUIRED',
      identityKycStatus: 'VALIDATION_REQUIRED',
      paymentRegulatoryStatus: 'VALIDATION_REQUIRED',
      payoutRegulatoryStatus: 'VALIDATION_REQUIRED',
      taxStatus: 'VALIDATION_REQUIRED',
      invoiceStatus: 'VALIDATION_REQUIRED',
      categoryPolicyStatus: 'VALIDATION_REQUIRED',
      crossBorderStatus: 'ALLOWED',
      dataResidencyStatus: 'STANDARD',
      publicNetworkStatus: 'OPERABLE',
      ageRestrictionMinAge: 20, // Legal age of majority in Thailand
      requiresLocalEntity: false,
      knownBlockers: Object.freeze([]),
      validationRequiredItems: Object.freeze([
        'PDPA_COMPLIANCE_EVALUATION',
        'DBD_ECOMMERCE_REGISTRATION_VERIFICATION',
        'THAI_CONSUMER_PROTECTION_ACT_REVIEW',
      ]),
      legalSourceReferences: Object.freeze([
        'Personal Data Protection Act B.E. 2562 (PDPA)',
        'Consumer Protection Act B.E. 2522',
      ]),
    });
  }

  if (countryCode === 'SG') {
    return Object.freeze({
      jurisdictionCode: 'SG',
      countryName,
      consumerProtectionStatus: 'VALIDATION_REQUIRED',
      privacyDataProtectionStatus: 'VALIDATION_REQUIRED',
      rentalMarketplaceStatus: 'ALLOWED',
      eCommerceStatus: 'VALIDATION_REQUIRED',
      identityKycStatus: 'VALIDATION_REQUIRED',
      paymentRegulatoryStatus: 'VALIDATION_REQUIRED',
      payoutRegulatoryStatus: 'VALIDATION_REQUIRED',
      taxStatus: 'VALIDATION_REQUIRED',
      invoiceStatus: 'VALIDATION_REQUIRED',
      categoryPolicyStatus: 'VALIDATION_REQUIRED',
      crossBorderStatus: 'ALLOWED',
      dataResidencyStatus: 'STANDARD',
      publicNetworkStatus: 'OPERABLE',
      ageRestrictionMinAge: 18,
      requiresLocalEntity: false,
      knownBlockers: Object.freeze([]),
      validationRequiredItems: Object.freeze([
        'SG_PDPA_CROSS_BORDER_TRANSFER_COMPLIANCE',
        'SG_CPFTA_MARKETPLACE_TERMS_REVIEW',
        'SG_MAS_PAYMENT_SERVICES_ACT_EXEMPTION_CONFIRMATION',
      ]),
      legalSourceReferences: Object.freeze([
        'Personal Data Protection Act 2012 (PDPA)',
        'Consumer Protection (Fair Trading) Act (CPFTA)',
        'Payment Services Act 2019 (PSA)',
      ]),
    });
  }

  if (countryCode === 'MY') {
    return Object.freeze({
      jurisdictionCode: 'MY',
      countryName,
      consumerProtectionStatus: 'VALIDATION_REQUIRED',
      privacyDataProtectionStatus: 'VALIDATION_REQUIRED',
      rentalMarketplaceStatus: 'ALLOWED',
      eCommerceStatus: 'VALIDATION_REQUIRED',
      identityKycStatus: 'VALIDATION_REQUIRED',
      paymentRegulatoryStatus: 'VALIDATION_REQUIRED',
      payoutRegulatoryStatus: 'VALIDATION_REQUIRED',
      taxStatus: 'VALIDATION_REQUIRED',
      invoiceStatus: 'VALIDATION_REQUIRED',
      categoryPolicyStatus: 'VALIDATION_REQUIRED',
      crossBorderStatus: 'ALLOWED',
      dataResidencyStatus: 'STANDARD',
      publicNetworkStatus: 'OPERABLE',
      ageRestrictionMinAge: 18,
      requiresLocalEntity: false,
      knownBlockers: Object.freeze([]),
      validationRequiredItems: Object.freeze([
        'MY_PDPA_DATA_PROCESSOR_OBLIGATION_AUDIT',
        'MY_CONSUMER_PROTECTION_ACT_DISCLOSURE_REVIEW',
        'MY_BNM_FOREIGN_EXCHANGE_NOTICES_CLEARANCE',
      ]),
      legalSourceReferences: Object.freeze([
        'Personal Data Protection Act 2010 (Act 709)',
        'Consumer Protection Act 1999 (Act 599)',
        'Electronic Commerce Act 2006 (Act 658)',
      ]),
    });
  }

  if (countryCode === 'VN') {
    return Object.freeze({
      jurisdictionCode: 'VN',
      countryName,
      consumerProtectionStatus: 'VALIDATION_REQUIRED',
      privacyDataProtectionStatus: 'VALIDATION_REQUIRED',
      rentalMarketplaceStatus: 'ALLOWED',
      eCommerceStatus: 'VALIDATION_REQUIRED',
      identityKycStatus: 'VALIDATION_REQUIRED',
      paymentRegulatoryStatus: 'VALIDATION_REQUIRED',
      payoutRegulatoryStatus: 'VALIDATION_REQUIRED',
      taxStatus: 'VALIDATION_REQUIRED',
      invoiceStatus: 'VALIDATION_REQUIRED',
      categoryPolicyStatus: 'VALIDATION_REQUIRED',
      crossBorderStatus: 'ALLOWED',
      dataResidencyStatus: 'STANDARD',
      publicNetworkStatus: 'OPERABLE',
      ageRestrictionMinAge: 18,
      requiresLocalEntity: false,
      knownBlockers: Object.freeze([]),
      validationRequiredItems: Object.freeze([
        'VN_DECREE_13_CROSS_BORDER_DATA_FILING',
        'VN_MOIT_ECOMMERCE_PORTAL_NOTIFICATION',
        'VN_CONSUMER_RIGHTS_ARBITRATION_TERMS',
      ]),
      legalSourceReferences: Object.freeze([
        'Decree 13/2023/ND-CP on Personal Data Protection',
        'Law on Protection of Consumers\' Rights No. 19/2023/QH15',
        'Decree 52/2013/ND-CP on E-Commerce',
      ]),
    });
  }

  if (countryCode === 'ID') {
    return Object.freeze({
      jurisdictionCode: 'ID',
      countryName,
      consumerProtectionStatus: 'VALIDATION_REQUIRED',
      privacyDataProtectionStatus: 'VALIDATION_REQUIRED',
      rentalMarketplaceStatus: 'ALLOWED',
      eCommerceStatus: 'VALIDATION_REQUIRED',
      identityKycStatus: 'VALIDATION_REQUIRED',
      paymentRegulatoryStatus: 'VALIDATION_REQUIRED',
      payoutRegulatoryStatus: 'VALIDATION_REQUIRED',
      taxStatus: 'VALIDATION_REQUIRED',
      invoiceStatus: 'VALIDATION_REQUIRED',
      categoryPolicyStatus: 'VALIDATION_REQUIRED',
      crossBorderStatus: 'ALLOWED',
      dataResidencyStatus: 'STANDARD',
      publicNetworkStatus: 'OPERABLE',
      ageRestrictionMinAge: 18,
      requiresLocalEntity: false,
      knownBlockers: Object.freeze([]),
      validationRequiredItems: Object.freeze([
        'ID_KOMINFO_PSE_REGISTRATION_VERIFICATION',
        'ID_PDP_LAW_CONSENT_AUDIT',
        'ID_BANK_INDONESIA_QRIS_PAYMENT_LICENSING_CLEARANCE',
      ]),
      legalSourceReferences: Object.freeze([
        'Law No. 27 of 2022 on Personal Data Protection (UU PDP)',
        'Law No. 8 of 1999 on Consumer Protection',
        'Government Regulation No. 71 of 2019 (PSTE)',
      ]),
    });
  }


  // All other international jurisdictions (Conservative Profile)
  return Object.freeze({
    jurisdictionCode: countryCode,
    countryName,
    consumerProtectionStatus: 'VALIDATION_REQUIRED',
    privacyDataProtectionStatus: 'VALIDATION_REQUIRED',
    rentalMarketplaceStatus: 'RESTRICTED',
    eCommerceStatus: 'VALIDATION_REQUIRED',
    identityKycStatus: 'VALIDATION_REQUIRED',
    paymentRegulatoryStatus: 'VALIDATION_REQUIRED',
    payoutRegulatoryStatus: 'VALIDATION_REQUIRED',
    taxStatus: 'VALIDATION_REQUIRED',
    invoiceStatus: 'VALIDATION_REQUIRED',
    categoryPolicyStatus: 'VALIDATION_REQUIRED',
    crossBorderStatus: 'RESTRICTED',
    dataResidencyStatus: 'STANDARD',
    publicNetworkStatus: 'OPERABLE',
    ageRestrictionMinAge: 18,
    requiresLocalEntity: false,
    knownBlockers: Object.freeze([]),
    validationRequiredItems: Object.freeze([
      'LOCAL_CONSUMER_RIGHTS_RECONCILIATION',
      'MARKETPLACE_LIABILITY_LEGAL_OPINION',
      'LOCAL_CROSS_BORDER_PAYMENT_CLEARANCE',
    ]),
    legalSourceReferences: Object.freeze([]),
  });
}

const complianceProfilesByCode = new Map<string, JurisdictionComplianceProfile>();
for (const country of GLOBAL_COUNTRY_CATALOG) {
  complianceProfilesByCode.set(country.code, buildComplianceProfile(country.code, country.name));
}

/**
 * Resolves JurisdictionComplianceProfile for a country code.
 * Fails closed (returns null) for unknown country codes.
 */
export function resolveJurisdictionComplianceProfile(
  jurisdictionCode: string | null | undefined
): JurisdictionComplianceProfile | null {
  if (!jurisdictionCode) return null;
  const upper = jurisdictionCode.trim().toUpperCase();
  return complianceProfilesByCode.get(upper) || null;
}

/**
 * Returns all 46 authoritative compliance profiles.
 */
export function getAllAuthoritativeComplianceProfiles(): readonly JurisdictionComplianceProfile[] {
  return Array.from(complianceProfilesByCode.values());
}
