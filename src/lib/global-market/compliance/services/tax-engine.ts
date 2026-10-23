/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Tax Policy Engine
 *
 * Implements server-authoritative tax policy evaluation, reporting obligation resolution,
 * and strict suppression of fake tax calculations.
 *
 * PERMANENT INVARIANTS:
 * - NO FAKE TAX. NO GUESSED TAX RATES.
 * - UNCONFIGURED TAX CALCULATIONS MUST RETURN NOT_CONFIGURED OR VALIDATION_REQUIRED.
 */

import {
  type JurisdictionTaxProfile,
} from '../contracts/tax-profile';
import {
  resolveJurisdictionTaxProfile,
} from '../registry/jurisdiction-tax-registry';

export interface TaxEvaluationContext {
  readonly jurisdictionCode: string;
  readonly baseRentalAmountMinorUnits: number;
  readonly platformFeeMinorUnits: number;
  readonly isBusinessProvider: boolean;
  readonly providerTaxId?: string;
  readonly transactionCurrency: string;
}

export interface TaxCalculationResult {
  readonly success: boolean;
  readonly isCalculated: boolean;
  readonly status: 'CALCULATED' | 'NOT_CONFIGURED' | 'VALIDATION_REQUIRED' | 'EXEMPT';
  readonly taxAmountMinorUnits: number;
  readonly effectiveRateBasisPoints: number; // e.g. 1200 for 12.00%
  readonly taxAuthorityReference?: string;
  readonly error?: string;
}

/**
 * Checks whether tax configuration is verified and ready for a jurisdiction.
 */
export function isTaxConfigurationReady(jurisdictionCode: string): boolean {
  const profile = resolveJurisdictionTaxProfile(jurisdictionCode);
  return profile ? profile.taxPolicyStatus === 'VERIFIED' : false;
}

/**
 * Returns the tax profile for a jurisdiction. Fails closed (returns null) for unknown jurisdictions.
 */
export function whatTaxProfileApplies(jurisdictionCode: string): JurisdictionTaxProfile | null {
  return resolveJurisdictionTaxProfile(jurisdictionCode);
}

/**
 * Evaluates whether tax calculation is required for a given booking context.
 */
export function isTaxCalculationRequired(context: TaxEvaluationContext): boolean {
  const profile = resolveJurisdictionTaxProfile(context.jurisdictionCode);
  if (!profile) return false;

  // Platform responsibility check
  if (profile.marketplaceTaxResponsibility === 'COLLECT_AND_REMIT') {
    return true;
  }

  // If reporting only or self-remit, platform does not collect on behalf of provider unless registered
  return false;
}

/**
 * Returns required tax authority fields for invoicing in a jurisdiction.
 */
export function whatTaxAuthorityFieldsAreRequired(jurisdictionCode: string): readonly string[] {
  const profile = resolveJurisdictionTaxProfile(jurisdictionCode);
  return profile ? profile.invoiceTaxFieldRequirements : [];
}

/**
 * Returns the configured tax provider for a jurisdiction, or null if unconfigured.
 */
export function whatTaxProviderIsConfigured(jurisdictionCode: string): string | null {
  const profile = resolveJurisdictionTaxProfile(jurisdictionCode);
  return profile?.taxCalculationProviderReference || null;
}

/**
 * Verifies whether authoritative tax can be calculated for this context.
 */
export function canCalculateAuthoritativeTax(context: TaxEvaluationContext): boolean {
  const profile = resolveJurisdictionTaxProfile(context.jurisdictionCode);
  if (!profile) return false;
  return profile.taxPolicyStatus === 'VERIFIED' && profile.taxCalculationProviderReference !== undefined;
}

/**
 * Authoritatively calculates tax. Strictly avoids fake tax and guessed tax rates.
 */
export function calculateAuthoritativeTax(context: TaxEvaluationContext): TaxCalculationResult {
  const profile = resolveJurisdictionTaxProfile(context.jurisdictionCode);
  if (!profile) {
    return {
      success: false,
      isCalculated: false,
      status: 'NOT_CONFIGURED',
      taxAmountMinorUnits: 0,
      effectiveRateBasisPoints: 0,
      error: `UNKNOWN_JURISDICTION: No tax profile for jurisdiction '${context.jurisdictionCode}'.`,
    };
  }

  if (profile.taxPolicyStatus === 'VALIDATION_REQUIRED') {
    return {
      success: true,
      isCalculated: false,
      status: 'VALIDATION_REQUIRED',
      taxAmountMinorUnits: 0,
      effectiveRateBasisPoints: 0,
      taxAuthorityReference: profile.taxRateAuthorityReference,
      error: `LEGAL_VALIDATION_REQUIRED: Tax rates for '${context.jurisdictionCode}' require statutory tax legal audit.`,
    };
  }

  if (profile.jurisdictionCode === 'PH') {
    // Domestic PH Policy:
    // Marketplace fees are subject to 12% VAT for platform services,
    // while peer-to-peer rental base is self-remitted by provider or exempt under percentage tax threshold.
    const platformFeeVat = Math.round((context.platformFeeMinorUnits * 12) / 100);
    return {
      success: true,
      isCalculated: true,
      status: 'CALCULATED',
      taxAmountMinorUnits: platformFeeVat,
      effectiveRateBasisPoints: 1200, // 12%
      taxAuthorityReference: 'BIR_REVENUE_REGULATIONS_PH',
    };
  }

  // All other jurisdictions fail closed to NOT_CONFIGURED (no fake tax)
  return {
    success: true,
    isCalculated: false,
    status: 'NOT_CONFIGURED',
    taxAmountMinorUnits: 0,
    effectiveRateBasisPoints: 0,
    error: `TAX_PROVIDER_NOT_CONFIGURED: No automated tax calculation engine configured for '${context.jurisdictionCode}'.`,
  };
}
