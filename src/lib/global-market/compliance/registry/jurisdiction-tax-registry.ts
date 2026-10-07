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
