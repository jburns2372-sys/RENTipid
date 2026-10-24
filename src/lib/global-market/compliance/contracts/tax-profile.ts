/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Tax Profile Contract
 *
 * Defines the tax classification, collection responsibilities, reporting mandates,
 * and invoice tax requirements across all 46 authoritative jurisdictions.
 *
 * PERMANENT INVARIANT: NO FAKE TAX. NO GUESSED TAX RATES.
 */

export type TaxPolicyStatus =
  | 'VERIFIED'
  | 'VALIDATION_REQUIRED'
  | 'NOT_CONFIGURED'
  | 'UNSUPPORTED';

export type TaxSystemType =
  | 'VAT'
  | 'GST'
  | 'SALES_TAX'
  | 'NONE'
  | 'MIXED_SUBNATIONAL';

export type MarketplaceTaxResponsibility =
  | 'COLLECT_AND_REMIT'
  | 'REPORTING_ONLY'
  | 'NONE'
  | 'LEGAL_VALIDATION_REQUIRED';

export type SellerTaxResponsibility =
  | 'SELF_REMIT'
  | 'EXEMPT_BELOW_THRESHOLD'
  | 'MANDATORY_REGISTRATION'
  | 'LEGAL_VALIDATION_REQUIRED';

export type CustomerTaxResponsibility =
  | 'STANDARD'
  | 'REVERSE_CHARGE'
  | 'ZERO_RATED'
  | 'LEGAL_VALIDATION_REQUIRED';

export interface JurisdictionTaxProfile {
  readonly jurisdictionCode: string;
  readonly countryName: string;
  readonly taxPolicyStatus: TaxPolicyStatus;
  readonly taxSystemType: TaxSystemType;
  readonly marketplaceTaxResponsibility: MarketplaceTaxResponsibility;
  readonly sellerTaxResponsibility: SellerTaxResponsibility;
  readonly customerTaxResponsibility: CustomerTaxResponsibility;
  readonly taxRegistrationRequired: boolean;
  readonly withholdingRequired: boolean;
  readonly digitalPlatformReportingRequired: boolean;
  readonly taxIdentificationRequired: boolean;
  readonly invoiceTaxFieldRequirements: readonly string[];
  readonly taxCalculationProviderReference?: string;
  readonly taxRateAuthorityReference?: string;
  readonly knownLimitations: readonly string[];
  readonly validationRequiredItems: readonly string[];
  readonly legalSourceReferences: readonly string[];
}
