/**
 * RENTipid GLOBAL-MKT / v2.0 — Payout Provider Adapter Contract
 *
 * Defines the provider-neutral payout interface isolating settlement rails
 * from RENTipid payout eligibility and marketplace state.
 */

import { type PayoutLifecycleState } from './payout-lifecycle';
import { type ProviderVerificationStatus } from './payment-provider';
import type { PayoutExecutionStore } from './payout-execution-store';

export const PAYOUT_PROVIDER_CAPABILITIES = [
  'CREATE_PAYOUT',
  'BENEFICIARY_VALIDATION',
  'CANCEL',
  'WEBHOOK',
  'RECONCILIATION',
  'BANK_TRANSFER',
  'WALLET_TRANSFER',
] as const;

export type PayoutProviderCapability = (typeof PAYOUT_PROVIDER_CAPABILITIES)[number];

export interface BeneficiaryValidationInput {
  readonly providerId: string;
  readonly beneficiaryReference: string;
  readonly accountType: 'BANK' | 'WALLET';
  readonly jurisdictionCode: string;
  readonly currency: string;
}

export interface BeneficiaryValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly normalizedAccountReference?: string;
}

export interface CreatePayoutInput {
  readonly jurisdictionCode?: string;
  readonly payoutId: string;
  readonly bookingId: string;
  readonly providerId: string;
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly beneficiaryReference: string;
  readonly description: string;
  readonly idempotencyKey: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CreatePayoutOutput {
  readonly providerReference: string;
  readonly initialStatus: PayoutLifecycleState;
  readonly rawProviderResponse?: unknown;
}

export interface ProviderPayoutStatusResult {
  readonly providerReference: string;
  readonly normalizedStatus: PayoutLifecycleState;
  readonly amountMinorUnits?: number;
  readonly currency?: string;
  readonly failureReason?: string;
}

export interface NormalizedPayoutWebhookEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly providerReference: string;
  readonly payoutId?: string;
  readonly normalizedStatus: PayoutLifecycleState;
  readonly amountMinorUnits?: number;
  readonly currency?: string;
  readonly rawPayload: unknown;
}

export interface PayoutProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly providerType: 'PAYOUT_RAIL' | 'MOCK' | 'MANUAL';
  readonly verificationStatus: ProviderVerificationStatus;
  readonly capabilities: readonly PayoutProviderCapability[];
  readonly supportedCurrencies: readonly string[];
  readonly executionStore?: PayoutExecutionStore;
  authorizePayout?(input: CreatePayoutInput): Promise<void>;

  validateBeneficiary(input: BeneficiaryValidationInput): Promise<BeneficiaryValidationResult>;
  createPayout(input: CreatePayoutInput): Promise<CreatePayoutOutput>;
  retrievePayoutStatus(providerReference: string): Promise<ProviderPayoutStatusResult>;
  cancelPayout?(providerReference: string): Promise<boolean>;
  verifyWebhookSignature?(payload: string | unknown, signature: string, headers?: Record<string, string>): boolean;
  normalizeWebhookPayload?(payload: unknown): NormalizedPayoutWebhookEvent;
}
