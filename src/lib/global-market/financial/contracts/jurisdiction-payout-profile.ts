/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Payout Profile Contract
 *
 * Defines settlement capabilities, supported settlement currencies,
 * approved rails, and provider KYC requirements per jurisdiction.
 */

export interface JurisdictionPayoutProfile {
  readonly jurisdictionCode: string;
  readonly jurisdictionName: string;
  readonly payoutStatus: 'READY' | 'PARTIAL' | 'NOT_CONFIGURED' | 'VALIDATION_REQUIRED';
  readonly approvedProviderIds: readonly string[];
  readonly supportedSettlementCurrencies: readonly string[];
  readonly defaultSettlementCurrency: string;
  readonly supportedPayoutMethods: readonly string[];
  readonly requiresProviderPayoutKyc: boolean;
  readonly settlementHoldingDays: number;
  readonly knownBlockers: readonly string[];
}
