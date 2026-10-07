/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Payment Profile Contract
 *
 * Defines collection capabilities, supported transaction currencies,
 * approved providers, and compliance requirements per jurisdiction.
 */

export interface JurisdictionPaymentProfile {
  readonly jurisdictionCode: string;
  readonly jurisdictionName: string;
  readonly collectionStatus: 'READY' | 'PARTIAL' | 'NOT_CONFIGURED' | 'VALIDATION_REQUIRED';
  readonly approvedProviderIds: readonly string[];
  readonly supportedTransactionCurrencies: readonly string[];
  readonly defaultTransactionCurrency: string;
  readonly supportedPaymentMethods: readonly string[];
  readonly requiresPayerKyc: boolean;
  readonly webhookRequired: boolean;
  readonly reconciliationRequired: boolean;
  readonly knownBlockers: readonly string[];
}
