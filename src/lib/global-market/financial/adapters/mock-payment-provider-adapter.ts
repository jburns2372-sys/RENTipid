/**
 * RENTipid GLOBAL-MKT / v2.0 — Mock Payment Provider Adapter (TEST ONLY)
 *
 * Deterministic test adapter for local financial lifecycle, failure simulation,
 * webhook simulation, and reconciliation testing.
 *
 * INVARIANT: This adapter is strictly for tests and NEVER confers commercial market readiness.
 */

import {
  type PaymentProviderAdapter,
  type PaymentProviderCapability,
  type CreatePaymentSessionInput,
  type CreatePaymentSessionOutput,
  type ProviderPaymentStatusResult,
  type NormalizedWebhookEvent,
} from '../contracts/payment-provider';

export class MockPaymentProviderAdapter implements PaymentProviderAdapter {
  readonly providerId = 'mock_gateway';
  readonly providerName = 'Mock Gateway (TEST ONLY)';
  readonly providerType = 'MOCK' as const;
  readonly verificationStatus = 'NOT_CONFIGURED' as const; // Explicit: Test adapter
  readonly capabilities: readonly PaymentProviderCapability[] = Object.freeze([
    'CREATE_PAYMENT',
    'AUTHORIZATION',
    'CAPTURE',
    'CANCEL',
    'REFUND',
    'WEBHOOK',
    'RECONCILIATION',
    'CARD',
  ]);
  readonly supportedCurrencies: readonly string[] = Object.freeze([
    'PHP', 'USD', 'EUR', 'THB', 'SGD', 'MYR', 'VND', 'IDR',
  ]);

  private simulatedOutcome: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' = 'SUCCESS';
  private attemptAmounts = new Map<string, number>();
  private attemptCurrencies = new Map<string, string>();

  setSimulatedOutcome(outcome: 'SUCCESS' | 'FAILURE' | 'TIMEOUT') {
    this.simulatedOutcome = outcome;
  }

  async createPaymentSession(input: CreatePaymentSessionInput): Promise<CreatePaymentSessionOutput> {
    if (this.simulatedOutcome === 'TIMEOUT') {
      throw new Error('PROVIDER_TIMEOUT: Mock payment provider connection timed out.');
    }

    const providerReference = `mock_pay_ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const checkoutUrl = `${input.successUrl}?provider=mock&ref=${providerReference}`;

    this.attemptAmounts.set(providerReference, input.amountMinorUnits);
    this.attemptCurrencies.set(providerReference, input.currency);

    return {
      providerReference,
      checkoutUrl,
      initialStatus: this.simulatedOutcome === 'FAILURE' ? 'FAILED' : 'CREATED',
    };
  }

  async retrievePaymentStatus(providerReference: string): Promise<ProviderPaymentStatusResult> {
    if (this.simulatedOutcome === 'FAILURE') {
      return {
        providerReference,
        normalizedStatus: 'FAILED',
        failureReason: 'SIMULATED_CARD_DECLINE',
      };
    }

    return {
      providerReference,
      normalizedStatus: 'SUCCEEDED',
      amountMinorUnits: this.attemptAmounts.get(providerReference) ?? 550000,
      currency: this.attemptCurrencies.get(providerReference) ?? 'PHP',
    };
  }

  async cancelPaymentSession(providerReference: string): Promise<boolean> {
    return true;
  }

  async refundPayment(providerReference: string, amountMinorUnits: number): Promise<boolean> {
    return true;
  }

  verifyWebhookSignature(payload: string | unknown, signature: string): boolean {
    // Only accept valid signature token in test
    return signature === 'valid_mock_signature';
  }

  normalizeWebhookPayload(payload: any): NormalizedWebhookEvent {
    return Object.freeze({
      eventId: payload.eventId || `mock_evt_${Date.now()}`,
      eventType: payload.eventType || 'payment.succeeded',
      providerReference: payload.providerReference || 'mock_pay_ref_default',
      bookingId: payload.bookingId,
      normalizedStatus: payload.status === 'succeeded' ? 'SUCCEEDED' : 'FAILED',
      amountMinorUnits: payload.amountMinorUnits,
      currency: payload.currency || 'PHP',
      rawPayload: payload,
    });
  }
}
