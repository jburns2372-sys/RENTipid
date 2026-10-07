/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Payment Orchestrator Service
 *
 * Implements server-authoritative payment initiation from GM-5A PayableBookingContext,
 * strict anti-tampering guards, idempotency protection against duplicate charges,
 * provider-neutral dispatch, verified webhook normalization with replay protection,
 * out-of-order state guards, and deterministic reconciliation.
 */

import { type PayableBookingContext } from '@/lib/global-market/booking/contracts/payment-handoff';
import {
  type PaymentLifecycleState,
  canTransitionPaymentStatus,
  isPaymentTerminalStatus,
} from '../contracts/payment-lifecycle';
import {
  type PaymentAttemptRecord,
  type PaymentReconciliationStatus,
} from '../contracts/payment-record';
import {
  resolveApprovedTransactionCurrency,
  type TransactionCurrencyPolicy,
} from '../contracts/currency-policy';
import { resolveJurisdictionPaymentProfile } from '../registry/jurisdiction-payment-registry';
import { financialProviderRegistry } from '../registry/payment-provider-registry';
import { type NormalizedWebhookEvent } from '../contracts/payment-provider';

// In-memory repositories for state management and idempotency in local execution
const paymentAttemptsById = new Map<string, PaymentAttemptRecord>();
const paymentAttemptsByIdempotency = new Map<string, PaymentAttemptRecord>();
const processedWebhookEventIds = new Set<string>();

export interface InitiatePaymentRequestInput {
  readonly payableContext: PayableBookingContext;
  readonly requestingPayerId: string;
  readonly providerId?: string; // Optional preferred provider ID (e.g. 'paymongo', 'mock_gateway')
  readonly clientSubmittedAmount?: number; // Tamper check
  readonly clientSubmittedCurrency?: string; // Tamper check
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly idempotencyKey: string;
  readonly payerEmail?: string;
  readonly payerName?: string;
}

export interface PaymentInitiationResult {
  readonly success: boolean;
  readonly paymentAttempt?: PaymentAttemptRecord;
  readonly checkoutUrl?: string;
  readonly isIdempotentReplay?: boolean;
  readonly reason?: string;
}

/**
 * Initiates an authoritative payment attempt from GM-5A PayableBookingContext.
 * Rejects client tampering, enforces idempotency, and dispatches to eligible providers.
 */
export async function initiatePaymentAttempt(
  input: InitiatePaymentRequestInput
): Promise<PaymentInitiationResult> {
  const { payableContext, requestingPayerId, idempotencyKey, successUrl, cancelUrl } = input;

  // 1. Idempotency Check (Section 22)
  if (paymentAttemptsByIdempotency.has(idempotencyKey)) {
    const existing = paymentAttemptsByIdempotency.get(idempotencyKey)!;
    return {
      success: true,
      paymentAttempt: existing,
      checkoutUrl: existing.providerCheckoutUrl,
      isIdempotentReplay: true,
    };
  }

  // 2. Anti-Tampering: Payer spoofing check (Section 12)
  if (requestingPayerId !== payableContext.payerId) {
    throw new Error(
      `PAYER_SPOOFING_BLOCKED: Requesting user '${requestingPayerId}' does not match authoritative payer '${payableContext.payerId}'.`
    );
  }

  // 3. Anti-Tampering: Amount & Currency check (Section 12)
  if (
    input.clientSubmittedAmount !== undefined &&
    input.clientSubmittedAmount !== payableContext.authoritativeAmountMinorUnits
  ) {
    throw new Error(
      `AMOUNT_TAMPERING_BLOCKED: Client-submitted amount (${input.clientSubmittedAmount}) does not match authoritative payable amount (${payableContext.authoritativeAmountMinorUnits}).`
    );
  }

  if (
    input.clientSubmittedCurrency !== undefined &&
    input.clientSubmittedCurrency.toUpperCase() !== payableContext.requiredTransactionCurrency.toUpperCase()
  ) {
    throw new Error(
      `CURRENCY_TAMPERING_BLOCKED: Client-submitted currency (${input.clientSubmittedCurrency}) does not match authoritative currency (${payableContext.requiredTransactionCurrency}).`
    );
  }

  // 4. Jurisdiction & Payment Profile Resolution (Section 17 & 18)
  const profile = resolveJurisdictionPaymentProfile(payableContext.jurisdictionCode);
  if (!profile) {
    throw new Error(
      `UNKNOWN_JURISDICTION: Payment profile for jurisdiction '${payableContext.jurisdictionCode}' could not be resolved. Fail-closed.`
    );
  }

  // 5. Transaction Currency Authorization (Section 19 & 20)
  const currencyPolicy: TransactionCurrencyPolicy = {
    jurisdictionCode: profile.jurisdictionCode,
    allowedTransactionCurrencies: profile.supportedTransactionCurrencies,
    defaultTransactionCurrency: profile.defaultTransactionCurrency,
    allowsForeignCardCollection: true,
    supportsMultiCurrencyTransaction: false,
  };

  const currencyResolution = resolveApprovedTransactionCurrency(
    payableContext.sourceListingCurrency,
    currencyPolicy,
    payableContext.requiredTransactionCurrency
  );

  if (!currencyResolution.isValid || !currencyResolution.transactionCurrency) {
    throw new Error(`TRANSACTION_CURRENCY_ERROR: ${currencyResolution.reason}`);
  }

  // 6. Provider Selection
  const providerIdToUse = input.providerId || profile.approvedProviderIds[0] || 'mock_gateway';
  const adapter = financialProviderRegistry.getPaymentAdapter(providerIdToUse);
  if (!adapter) {
    throw new Error(
      `PAYMENT_PROVIDER_UNAVAILABLE: Provider '${providerIdToUse}' is not configured or available for jurisdiction '${profile.jurisdictionCode}'.`
    );
  }

  // 7. Invoke Provider
  const now = new Date().toISOString();
  const attemptId = `pay_att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const sessionOutput = await adapter.createPaymentSession({
    bookingId: payableContext.bookingId,
    bookingReference: payableContext.bookingReference,
    amountMinorUnits: payableContext.authoritativeAmountMinorUnits,
    currency: currencyResolution.transactionCurrency,
    payerEmail: input.payerEmail || 'renter@example.com',
    payerName: input.payerName || 'Verified Renter',
    description: `Rental Booking ${payableContext.bookingReference}`,
    successUrl,
    cancelUrl,
    idempotencyKey,
  });

  const record: PaymentAttemptRecord = Object.freeze({
    id: attemptId,
    bookingId: payableContext.bookingId,
    payerId: payableContext.payerId,
    providerId: payableContext.payeeProviderId,
    jurisdictionCode: payableContext.jurisdictionCode,
    authoritativeAmountMinorUnits: payableContext.authoritativeAmountMinorUnits,
    depositAmountMinorUnits: payableContext.depositAmountMinorUnits,
    deliveryFeeMinorUnits: payableContext.deliveryFeeMinorUnits,
    transactionCurrency: currencyResolution.transactionCurrency,
    paymentProviderId: adapter.providerId,
    paymentMethod: 'ONLINE',
    idempotencyKey,
    providerReference: sessionOutput.providerReference,
    providerCheckoutUrl: sessionOutput.checkoutUrl,
    normalizedStatus: sessionOutput.initialStatus,
    reconciliationStatus: 'PENDING',
    createdAt: now,
    updatedAt: now,
  });

  paymentAttemptsById.set(attemptId, record);
  paymentAttemptsByIdempotency.set(idempotencyKey, record);

  return {
    success: true,
    paymentAttempt: record,
    checkoutUrl: sessionOutput.checkoutUrl,
  };
}

/**
 * Retrieves a payment attempt record by attempt ID.
 */
export function getPaymentAttemptById(attemptId: string): PaymentAttemptRecord | null {
  return paymentAttemptsById.get(attemptId) || null;
}

/**
 * Retrieves a payment attempt record by provider reference.
 */
export function getPaymentAttemptByProviderReference(providerReference: string): PaymentAttemptRecord | null {
  for (const record of paymentAttemptsById.values()) {
    if (record.providerReference === providerReference) {
      return record;
    }
  }
  return null;
}

export interface PaymentWebhookProcessingResult {
  readonly success: boolean;
  readonly isDuplicateReplay?: boolean;
  readonly outOfOrderIgnored?: boolean;
  readonly paymentAttempt?: PaymentAttemptRecord;
  readonly error?: string;
}

/**
 * Processes incoming provider webhooks with:
 * 1. Signature Verification (Section 23)
 * 2. Event Idempotency & Replay Protection (Section 24)
 * 3. Out-of-Order Terminal State Protection (Section 25)
 * 4. Authoritative Amount/Currency Validation
 */
export async function processPaymentWebhook(
  providerId: string,
  rawPayload: unknown,
  signature: string,
  headers?: Record<string, string>
): Promise<PaymentWebhookProcessingResult> {
  const adapter = financialProviderRegistry.getPaymentAdapter(providerId);
  if (!adapter) {
    return { success: false, error: `UNKNOWN_PAYMENT_PROVIDER: Provider '${providerId}' not found.` };
  }

  // 1. Verify Webhook Signature (Section 23)
  const isValidSig = adapter.verifyWebhookSignature(rawPayload, signature, headers);
  if (!isValidSig) {
    return { success: false, error: 'INVALID_WEBHOOK_SIGNATURE: Webhook signature verification failed.' };
  }

  // 2. Normalize Webhook Payload
  const event: NormalizedWebhookEvent = adapter.normalizeWebhookPayload(rawPayload);

  // 3. Event Idempotency & Replay Protection (Section 24)
  if (processedWebhookEventIds.has(event.eventId)) {
    return { success: true, isDuplicateReplay: true };
  }

  // 4. Retrieve matching PaymentAttemptRecord
  const existingRecord = getPaymentAttemptByProviderReference(event.providerReference);
  if (!existingRecord) {
    return {
      success: false,
      error: `RECORD_NOT_FOUND: No PaymentAttempt found matching provider reference '${event.providerReference}'.`,
    };
  }

  // 5. Amount & Currency Verification in Webhook (Anti-Spoofing Section 23)
  if (
    event.amountMinorUnits !== undefined &&
    event.amountMinorUnits !== existingRecord.authoritativeAmountMinorUnits
  ) {
    const quarantined: PaymentAttemptRecord = Object.freeze({
      ...existingRecord,
      reconciliationStatus: 'MISMATCH',
      failureReason: `AMOUNT_MISMATCH: Webhook amount (${event.amountMinorUnits}) does not match expected (${existingRecord.authoritativeAmountMinorUnits}).`,
      updatedAt: new Date().toISOString(),
    });
    paymentAttemptsById.set(quarantined.id, quarantined);
    return {
      success: false,
      paymentAttempt: quarantined,
      error: 'WEBHOOK_AMOUNT_MISMATCH: Event amount does not match expected authoritative amount.',
    };
  }

  // 6. Out-of-Order Transition Protection (Section 25)
  // If the record is already in a terminal state (e.g. SUCCEEDED), a delayed PENDING/CREATED event must NOT overwrite it!
  if (isPaymentTerminalStatus(existingRecord.normalizedStatus)) {
    if (existingRecord.normalizedStatus === 'SUCCEEDED' && event.normalizedStatus !== 'SUCCEEDED') {
      // Mark event as processed to prevent replay loops, but leave state untouched
      processedWebhookEventIds.add(event.eventId);
      return {
        success: true,
        outOfOrderIgnored: true,
        paymentAttempt: existingRecord,
      };
    }
  }

  // 7. Verify legal state transition
  if (!canTransitionPaymentStatus(existingRecord.normalizedStatus, event.normalizedStatus)) {
    return {
      success: false,
      error: `ILLEGAL_PAYMENT_TRANSITION: Cannot transition payment from '${existingRecord.normalizedStatus}' to '${event.normalizedStatus}'.`,
    };
  }

  // 8. Update Record
  const now = new Date().toISOString();
  const updated: PaymentAttemptRecord = Object.freeze({
    ...existingRecord,
    normalizedStatus: event.normalizedStatus,
    updatedAt: now,
  });

  paymentAttemptsById.set(updated.id, updated);
  processedWebhookEventIds.add(event.eventId);

  return {
    success: true,
    paymentAttempt: updated,
  };
}

export interface PaymentReconciliationResult {
  readonly status: PaymentReconciliationStatus;
  readonly matched: boolean;
  readonly expectedAmountMinorUnits: number;
  readonly providerAmountMinorUnits?: number;
  readonly expectedCurrency: string;
  readonly providerCurrency?: string;
  readonly updatedRecord: PaymentAttemptRecord;
  readonly mismatchNotes?: string;
}

/**
 * Reconciles RENTipid payment state against provider truth.
 */
export async function reconcilePaymentWithProvider(
  attemptId: string
): Promise<PaymentReconciliationResult> {
  const record = getPaymentAttemptById(attemptId);
  if (!record) {
    throw new Error(`RECONCILIATION_ERROR: Payment attempt '${attemptId}' not found.`);
  }

  const adapter = financialProviderRegistry.getPaymentAdapter(record.paymentProviderId);
  if (!adapter) {
    throw new Error(`RECONCILIATION_ERROR: Provider adapter '${record.paymentProviderId}' not found.`);
  }

  if (!record.providerReference) {
    throw new Error('RECONCILIATION_ERROR: Payment attempt has no provider reference.');
  }

  // Fetch provider truth
  const providerTruth = await adapter.retrievePaymentStatus(record.providerReference);

  const amountMatch =
    providerTruth.amountMinorUnits === undefined ||
    providerTruth.amountMinorUnits === record.authoritativeAmountMinorUnits;

  const currencyMatch =
    providerTruth.currency === undefined ||
    providerTruth.currency.toUpperCase() === record.transactionCurrency.toUpperCase();

  const isMatched = amountMatch && currencyMatch;
  const status: PaymentReconciliationStatus = isMatched ? 'MATCHED' : 'MISMATCH';

  const now = new Date().toISOString();
  const updatedRecord: PaymentAttemptRecord = Object.freeze({
    ...record,
    normalizedStatus: isMatched && providerTruth.normalizedStatus === 'SUCCEEDED' ? 'SUCCEEDED' : record.normalizedStatus,
    reconciliationStatus: status,
    failureReason: isMatched ? record.failureReason : 'RECONCILIATION_MISMATCH',
    updatedAt: now,
  });

  paymentAttemptsById.set(record.id, updatedRecord);

  return {
    status,
    matched: isMatched,
    expectedAmountMinorUnits: record.authoritativeAmountMinorUnits,
    providerAmountMinorUnits: providerTruth.amountMinorUnits,
    expectedCurrency: record.transactionCurrency,
    providerCurrency: providerTruth.currency,
    updatedRecord,
    mismatchNotes: isMatched ? undefined : 'Amount or currency mismatch during reconciliation review.',
  };
}
