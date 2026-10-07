/**
 * RENTipid GLOBAL-MKT / v2.0 — Payment Provider Adapter Contract
 *
 * Defines the provider-neutral payment interface isolating third-party gateways
 * (PayMongo, Mock, future processors) from RENTipid core domain logic.
 */

import { type PaymentLifecycleState } from './payment-lifecycle';

export const PAYMENT_PROVIDER_CAPABILITIES = [
  'CREATE_PAYMENT',
  'AUTHORIZATION',
  'CAPTURE',
  'CANCEL',
  'REFUND',
  'PARTIAL_REFUND',
  'WEBHOOK',
  'RECONCILIATION',
  'QR',
  'CARD',
  'BANK',
  'WALLET',
  'TOKENIZED_PAYMENT',
] as const;

export type PaymentProviderCapability = (typeof PAYMENT_PROVIDER_CAPABILITIES)[number];

export type ProviderVerificationStatus =
  | 'VERIFIED'
  | 'PARTIAL'
  | 'NOT_CONFIGURED'
  | 'VALIDATION_REQUIRED'
  | 'SEPARATE_WORKSTREAM_PENDING'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

export interface CreatePaymentSessionInput {
  readonly bookingId: string;
  readonly bookingReference: string;
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly payerEmail: string;
  readonly payerName: string;
  readonly description: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly idempotencyKey: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CreatePaymentSessionOutput {
  readonly providerReference: string;
  readonly checkoutUrl: string;
  readonly initialStatus: PaymentLifecycleState;
  readonly rawProviderResponse?: unknown;
}

export interface ProviderPaymentStatusResult {
  readonly providerReference: string;
  readonly normalizedStatus: PaymentLifecycleState;
  readonly amountMinorUnits?: number;
  readonly currency?: string;
  readonly failureReason?: string;
}

export interface NormalizedWebhookEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly providerReference: string;
  readonly bookingId?: string;
  readonly normalizedStatus: PaymentLifecycleState;
  readonly amountMinorUnits?: number;
  readonly currency?: string;
  readonly rawPayload: unknown;
}

export interface PaymentProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly providerType: 'PAYMENT_GATEWAY' | 'MOCK' | 'ESCROW';
  readonly verificationStatus: ProviderVerificationStatus;
  readonly capabilities: readonly PaymentProviderCapability[];
  readonly supportedCurrencies: readonly string[];

  createPaymentSession(input: CreatePaymentSessionInput): Promise<CreatePaymentSessionOutput>;
  retrievePaymentStatus(providerReference: string): Promise<ProviderPaymentStatusResult>;
  cancelPaymentSession?(providerReference: string): Promise<boolean>;
  refundPayment?(providerReference: string, amountMinorUnits: number): Promise<boolean>;
  verifyWebhookSignature(payload: string | unknown, signature: string, headers?: Record<string, string>): boolean;
  normalizeWebhookPayload(payload: unknown): NormalizedWebhookEvent;
}
