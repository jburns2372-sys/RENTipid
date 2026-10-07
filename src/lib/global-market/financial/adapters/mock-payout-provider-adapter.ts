/**
 * RENTipid GLOBAL-MKT / v2.0 — Mock Payout Provider Adapter (TEST ONLY)
 *
 * Deterministic test adapter for testing payout instruction creation,
 * beneficiary validation, and reconciliation.
 *
 * INVARIANT: This adapter is strictly for tests and NEVER confers commercial market readiness.
 */

import {
  type PayoutProviderAdapter,
  type PayoutProviderCapability,
  type BeneficiaryValidationInput,
  type BeneficiaryValidationResult,
  type CreatePayoutInput,
  type CreatePayoutOutput,
  type ProviderPayoutStatusResult,
} from '../contracts/payout-provider';

export class MockPayoutProviderAdapter implements PayoutProviderAdapter {
  constructor(
    readonly providerId: string = 'mock_payout_rail',
    readonly providerName: string = 'Mock Payout Rail (TEST ONLY)'
  ) {}
  readonly providerType = 'MOCK' as const;
  readonly verificationStatus = 'NOT_CONFIGURED' as const; // Explicit: Test adapter
  readonly capabilities: readonly PayoutProviderCapability[] = Object.freeze([
    'CREATE_PAYOUT',
    'BENEFICIARY_VALIDATION',
    'RECONCILIATION',
    'BANK_TRANSFER',
  ]);
  readonly supportedCurrencies: readonly string[] = Object.freeze(['PHP', 'USD']);

  private payoutAmounts = new Map<string, number>();
  private payoutCurrencies = new Map<string, string>();

  async validateBeneficiary(input: BeneficiaryValidationInput): Promise<BeneficiaryValidationResult> {
    if (!input.beneficiaryReference || input.beneficiaryReference.length < 5) {
      return {
        isValid: false,
        reason: 'INVALID_BENEFICIARY_FORMAT: Beneficiary reference is too short.',
      };
    }

    return {
      isValid: true,
      normalizedAccountReference: input.beneficiaryReference.trim(),
    };
  }

  async createPayout(input: CreatePayoutInput): Promise<CreatePayoutOutput> {
    const providerReference = `mock_payout_ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.payoutAmounts.set(providerReference, input.amountMinorUnits);
    this.payoutCurrencies.set(providerReference, input.currency);
    return {
      providerReference,
      initialStatus: 'PROCESSING',
    };
  }

  async retrievePayoutStatus(providerReference: string): Promise<ProviderPayoutStatusResult> {
    return {
      providerReference,
      normalizedStatus: 'SUCCEEDED',
      amountMinorUnits: this.payoutAmounts.get(providerReference) ?? 100000,
      currency: this.payoutCurrencies.get(providerReference) ?? 'PHP',
    };
  }
}
