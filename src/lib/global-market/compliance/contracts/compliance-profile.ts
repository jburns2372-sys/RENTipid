/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Compliance Profile Contract
 *
 * Captures regulatory, privacy, consumer protection, and operating standards across 46 markets.
 */

export interface JurisdictionComplianceProfile {
  readonly jurisdictionCode: string;
  readonly countryName: string;
  readonly consumerProtectionStatus: 'VERIFIED' | 'VALIDATION_REQUIRED' | 'UNSUPPORTED';
  readonly privacyDataProtectionStatus: 'VERIFIED' | 'VALIDATION_REQUIRED' | 'BLOCKED';
  readonly rentalMarketplaceStatus: 'ALLOWED' | 'RESTRICTED' | 'VALIDATION_REQUIRED';
  readonly eCommerceStatus: 'ALLOWED' | 'VALIDATION_REQUIRED';
  readonly identityKycStatus: 'VERIFIED' | 'VALIDATION_REQUIRED';
  readonly paymentRegulatoryStatus: 'VERIFIED' | 'VALIDATION_REQUIRED';
  readonly payoutRegulatoryStatus: 'VERIFIED' | 'VALIDATION_REQUIRED';
  readonly taxStatus: 'CONFIGURED' | 'VALIDATION_REQUIRED';
  readonly invoiceStatus: 'CONFIGURED' | 'VALIDATION_REQUIRED';
  readonly categoryPolicyStatus: 'CONFIGURED' | 'VALIDATION_REQUIRED';
  readonly crossBorderStatus: 'ALLOWED' | 'RESTRICTED' | 'VALIDATION_REQUIRED';
  readonly dataResidencyStatus: 'STANDARD' | 'LOCALIZATION_MANDATORY';
  readonly publicNetworkStatus: 'OPERABLE' | 'RESTRICTED_ACCESS' | 'NOT_CLAIMED';
  readonly ageRestrictionMinAge: number;
  readonly requiresLocalEntity: boolean;
  readonly knownBlockers: readonly string[];
  readonly validationRequiredItems: readonly string[];
  readonly legalSourceReferences: readonly string[];
}
