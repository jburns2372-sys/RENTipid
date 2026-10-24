/**
 * RENTipid GLOBAL-MKT / v2.0 — 46-Country Jurisdiction Tax Registry
 *
 * Dynamically resolves conservative, evidence-based JurisdictionTaxProfiles
 * for all 46 authoritative countries from GLOBAL_COUNTRY_CATALOG.
 *
 * PERMANENT INVARIANTS:
 * - NO FAKE TAX. NO GUESSED TAX RATES.
 * - UNKNOWN JURISDICTION FAILS CLOSED (returns null).
 * - ZERO DUPLICATED COUNTRY REGISTRIES.
 */

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import {
  type JurisdictionTaxProfile,
  type TaxSystemType,
  type TaxPolicyStatus,
} from '../contracts/tax-profile';

export const AUTHORITATIVE_TAX_PROFILE_COUNT = GLOBAL_COUNTRY_CATALOG.length; // 46

function determineTaxSystemType(countryCode: string): TaxSystemType {
  const gstCountries = ['SG', 'AU', 'NZ', 'MY', 'IN'];
  if (gstCountries.includes(countryCode)) return 'GST';
  if (countryCode === 'US') return 'MIXED_SUBNATIONAL';
  if (countryCode === 'CA') return 'MIXED_SUBNATIONAL';
  return 'VAT';
}

function buildTaxProfile(countryCode: string, countryName: string): JurisdictionTaxProfile {
  const isDomesticPH = countryCode === 'PH';
  const taxSystemType = determineTaxSystemType(countryCode);

  if (isDomesticPH) {
    return Object.freeze({
      jurisdictionCode: 'PH',
      countryName,
      taxPolicyStatus: 'VERIFIED' as TaxPolicyStatus,
      taxSystemType: 'VAT',
      marketplaceTaxResponsibility: 'REPORTING_ONLY',
      sellerTaxResponsibility: 'SELF_REMIT',
      customerTaxResponsibility: 'STANDARD',
      taxRegistrationRequired: true,
      withholdingRequired: false,
      digitalPlatformReportingRequired: true,
      taxIdentificationRequired: true,
      invoiceTaxFieldRequirements: Object.freeze([
        'TIN',
        'REGISTERED_BUSINESS_NAME',
        'OFFICIAL_RECEIPT_NUMBER',
        'VAT_BREAKDOWN',
      ]),
      taxCalculationProviderReference: undefined,
      taxRateAuthorityReference: 'BIR_REVENUE_REGULATIONS',
      knownLimitations: Object.freeze([
        'Sub-threshold individual peer-to-peer sellers may operate under percentage tax exemption',
      ]),
      validationRequiredItems: Object.freeze([
        'LOCAL_WITHHOLDING_TAX_ESCROW_CLARIFICATION',
      ]),
      legalSourceReferences: Object.freeze([
        'https://www.bir.gov.ph',
        'Republic Act No. 8424 (National Internal Revenue Code of 1997 as amended)',
      ]),
    });
  } else if (countryCode === 'TH') {
    return Object.freeze({
      jurisdictionCode: 'TH',
      countryName,
      taxPolicyStatus: 'VALIDATION_REQUIRED' as TaxPolicyStatus,
      taxSystemType: 'VAT',
      marketplaceTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      sellerTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      customerTaxResponsibility: 'STANDARD',
      taxRegistrationRequired: true,
      withholdingRequired: false,
      digitalPlatformReportingRequired: true,
      taxIdentificationRequired: true,
      invoiceTaxFieldRequirements: Object.freeze(['TAX_IDENTIFIER', 'LEGAL_NAME', 'TAX_INVOICE_NUMBER', 'VAT_BREAKDOWN']),
      taxCalculationProviderReference: undefined,
      taxRateAuthorityReference: 'THAI_REVENUE_DEPARTMENT_VAT_CODE',
      knownLimitations: Object.freeze([
        'Thai 7% VAT standard rate; foreign electronic service (VES) rules apply to platform commission',
      ]),
      validationRequiredItems: Object.freeze([
        'TH_VES_ELECTRONIC_SERVICE_REGISTRATION',
        'TH_WITHHOLDING_TAX_PND53_RECONCILIATION',
      ]),
      legalSourceReferences: Object.freeze([
        'Revenue Code of Thailand (Title II Chapter 4)',
        'Act Amending the Revenue Code (No. 53) B.E. 2564 (E-Service Tax)',
      ]),
    });
  } else if (countryCode === 'SG') {
    return Object.freeze({
      jurisdictionCode: 'SG',
      countryName,
      taxPolicyStatus: 'VALIDATION_REQUIRED' as TaxPolicyStatus,
      taxSystemType: 'GST',
      marketplaceTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      sellerTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      customerTaxResponsibility: 'STANDARD',
      taxRegistrationRequired: true,
      withholdingRequired: false,
      digitalPlatformReportingRequired: true,
      taxIdentificationRequired: true,
      invoiceTaxFieldRequirements: Object.freeze(['GST_REGISTRATION_NUMBER', 'LEGAL_NAME', 'TAX_INVOICE_DETAILS']),
      taxCalculationProviderReference: undefined,
      taxRateAuthorityReference: 'IRAS_GOODS_AND_SERVICES_TAX_ACT',
      knownLimitations: Object.freeze([
        'Singapore 9% GST standard rate; Overseas Vendor Registration (OVR) regime for digital platforms',
      ]),
      validationRequiredItems: Object.freeze([
        'SG_OVR_REGIME_MARKETPLACE_FACILITATOR_AUDIT',
        'SG_IRAS_DIGITAL_PLATFORM_REPORTING_RULES',
      ]),
      legalSourceReferences: Object.freeze([
        'Goods and Services Tax Act 1993 (Singapore)',
        'IRAS e-Tax Guide on Digital Payment Tokens and Remote Services',
      ]),
    });
  } else if (countryCode === 'MY') {
    return Object.freeze({
      jurisdictionCode: 'MY',
      countryName,
      taxPolicyStatus: 'VALIDATION_REQUIRED' as TaxPolicyStatus,
      taxSystemType: 'GST',
      marketplaceTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      sellerTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      customerTaxResponsibility: 'STANDARD',
      taxRegistrationRequired: true,
      withholdingRequired: false,
      digitalPlatformReportingRequired: true,
      taxIdentificationRequired: true,
      invoiceTaxFieldRequirements: Object.freeze(['SST_REGISTRATION_NUMBER', 'LEGAL_NAME', 'SERVICE_TAX_RATE']),
      taxCalculationProviderReference: undefined,
      taxRateAuthorityReference: 'ROYAL_MALAYSIAN_CUSTOMS_SERVICE_TAX_ACT',
      knownLimitations: Object.freeze([
        '8% Digital Service Tax (DST) on foreign service providers; local SST on platform brokerage',
      ]),
      validationRequiredItems: Object.freeze([
        'MY_FSDSP_FOREIGN_SPECIAL_DIGITAL_SERVICE_TAX_REVIEW',
        'MY_INLAND_REVENUE_BOARD_E_INVOICING_MYINVOIS',
      ]),
      legalSourceReferences: Object.freeze([
        'Service Tax Act 2018 (Malaysia)',
        'Service Tax (Digital Services) Regulations 2019',
      ]),
    });
  } else if (countryCode === 'VN') {
    return Object.freeze({
      jurisdictionCode: 'VN',
      countryName,
      taxPolicyStatus: 'VALIDATION_REQUIRED' as TaxPolicyStatus,
      taxSystemType: 'VAT',
      marketplaceTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      sellerTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      customerTaxResponsibility: 'STANDARD',
      taxRegistrationRequired: true,
      withholdingRequired: false,
      digitalPlatformReportingRequired: true,
      taxIdentificationRequired: true,
      invoiceTaxFieldRequirements: Object.freeze(['TAX_CODE', 'ENTERPRISE_NAME', 'E_INVOICE_CODE']),
      taxCalculationProviderReference: undefined,
      taxRateAuthorityReference: 'VIETNAM_GENERAL_DEPARTMENT_OF_TAXATION_CIRCULAR_80',
      knownLimitations: Object.freeze([
        '10% standard VAT rate (8% reduced temporary); e-commerce portal withholding and reporting rules',
      ]),
      validationRequiredItems: Object.freeze([
        'VN_CIRCULAR_80_CROSS_BORDER_PORTAL_REGISTRATION',
        'VN_DECREE_91_ECOMMERCE_PLATFORM_TAX_INFORMATION_PROVISION',
      ]),
      legalSourceReferences: Object.freeze([
        'Law on Tax Administration No. 38/2019/QH14',
        'Circular 80/2021/TT-BTC Guide to Tax Administration',
      ]),
    });
  } else if (countryCode === 'ID') {
    return Object.freeze({
      jurisdictionCode: 'ID',
      countryName,
      taxPolicyStatus: 'VALIDATION_REQUIRED' as TaxPolicyStatus,
      taxSystemType: 'VAT',
      marketplaceTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      sellerTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
      customerTaxResponsibility: 'STANDARD',
      taxRegistrationRequired: true,
      withholdingRequired: false,
      digitalPlatformReportingRequired: true,
      taxIdentificationRequired: true,
      invoiceTaxFieldRequirements: Object.freeze(['NPWP', 'LEGAL_ENTITY_NAME', 'FAKTUR_PAJAK_REFERENCE']),
      taxCalculationProviderReference: undefined,
      taxRateAuthorityReference: 'INDONESIA_DJP_PMK_60_2022',
      knownLimitations: Object.freeze([
        '11% PPN (Pajak Pertambahan Nilai) on digital goods and cross-border marketplace platforms',
      ]),
      validationRequiredItems: Object.freeze([
        'ID_DJP_PMSE_DIGITAL_TAX_COLLECTOR_APPOINTMENT',
        'ID_DOMESTIC_WITHHOLDING_PPH_23_CLARIFICATION',
      ]),
      legalSourceReferences: Object.freeze([
        'Law No. 7 of 2021 on Harmonization of Tax Regulations (UU HPP)',
        'Minister of Finance Regulation No. 60/PMK.03/2022',
      ]),
    });
  }

  // International 45 Jurisdictions (Conservative Baseline)
  const isUS = countryCode === 'US';
  const isEU = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ].includes(countryCode);

  const limitations = isUS
    ? ['Subnational state sales tax and marketplace facilitator nexus rules vary across 50 states']
    : isEU
    ? ['DAC7 reporting directive requirements apply across EU member states for digital platforms']
    : ['Cross-border digital service taxation requires local legal reconciliation'];

  const validationItems = isUS
    ? ['SUBNATIONAL_STATE_SALES_TAX_POLICY', 'MARKETPLACE_FACILITATOR_STATUTORY_AUDIT']
    : isEU
    ? ['DAC7_PLATFORM_OPERATOR_REPORTING_INTEGRATION', 'LOCAL_VAT_THRESHOLD_ASSESSMENT']
    : ['LOCAL_DIGITAL_SERVICES_TAX_REQUIREMENT', 'LOCAL_WITHHOLDING_MANDATES'];

  return Object.freeze({
    jurisdictionCode: countryCode,
    countryName,
    taxPolicyStatus: 'VALIDATION_REQUIRED' as TaxPolicyStatus,
    taxSystemType,
    marketplaceTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
    sellerTaxResponsibility: 'LEGAL_VALIDATION_REQUIRED',
    customerTaxResponsibility: 'STANDARD',
    taxRegistrationRequired: true,
    withholdingRequired: false,
    digitalPlatformReportingRequired: isEU,
    taxIdentificationRequired: true,
    invoiceTaxFieldRequirements: Object.freeze(['TAX_IDENTIFIER', 'LEGAL_NAME', 'TAX_RATE_SUMMARY']),
    taxCalculationProviderReference: undefined,
    taxRateAuthorityReference: undefined,
    knownLimitations: Object.freeze(limitations),
    validationRequiredItems: Object.freeze(validationItems),
    legalSourceReferences: Object.freeze([]),
  });
}

// Internal cache for 46 profiles
const taxProfilesByCode = new Map<string, JurisdictionTaxProfile>();
for (const country of GLOBAL_COUNTRY_CATALOG) {
  taxProfilesByCode.set(country.code, buildTaxProfile(country.code, country.name));
}

/**
 * Resolves the JurisdictionTaxProfile for a country code.
 * Fails closed (returns null) for unknown country codes.
 */
export function resolveJurisdictionTaxProfile(
  jurisdictionCode: string | null | undefined
): JurisdictionTaxProfile | null {
  if (!jurisdictionCode) return null;
  const upper = jurisdictionCode.trim().toUpperCase();
  return taxProfilesByCode.get(upper) || null;
}

/**
 * Returns all 46 authoritative tax profiles.
 */
export function getAllAuthoritativeTaxProfiles(): readonly JurisdictionTaxProfile[] {
  return Array.from(taxProfilesByCode.values());
}
