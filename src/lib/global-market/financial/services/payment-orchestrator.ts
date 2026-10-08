/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Payment Orchestrator Service
 *
 * Implements server-authoritative payment initiation from GM-5A PayableBookingContext,
 * strict anti-tampering guards, idempotency protection against duplicate charges,
 * provider-neutral dispatch, verified webhook normalization with replay protection,
 * out-of-order state guards, and deterministic reconciliation.
 */

import { createHash } from 'node:crypto';
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
const processedWebhookEventIds = new Map<string, string>();
const paymentRequestFingerprints = new Map<string, string>();
const pendingPaymentInitiations = new Map<string, Promise<PaymentInitiationResult>>();

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

  // Authorization and money validation must precede even an idempotent replay.
  if (!idempotencyKey.trim() || !payableContext.bookingId.trim()) {
    throw new Error('INVALID_PAYMENT_IDENTITY: Booking ID and idempotency key are required.');
  }
  if (!Number.isSafeInteger(payableContext.authoritativeAmountMinorUnits) ||
      payableContext.authoritativeAmountMinorUnits <= 0) {
    throw new Error('INVALID_PAYMENT_AMOUNT: Authoritative amount must be a positive safe integer in minor units.');
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

  if (!currencyResolution.isValid || !currencyResolution.transactionCurrency || currencyResolution.conversionRequired) {
    throw new Error(`TRANSACTION_CURRENCY_ERROR: ${currencyResolution.reason}`);
  }
  const transactionCurrency = currencyResolution.transactionCurrency;

  // 6. Provider Selection
  const providerIdToUse = (input.providerId ?? profile.approvedProviderIds[0] ?? '').trim().toLowerCase();
  // Explicit mock selection remains a local-test facility only. There is no fallback.
  const explicitLocalMock = input.providerId === 'mock_gateway' &&
    (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') &&
    profile.jurisdictionCode === 'PH';
  if (!providerIdToUse || (!profile.approvedProviderIds.includes(providerIdToUse) && !explicitLocalMock)) {
    throw new Error(
      `JURISDICTION_PROVIDER_MISMATCH: Provider '${providerIdToUse}' is prohibited for jurisdiction '${profile.jurisdictionCode}'. Fail-closed.`
    );
  }

  const adapter = financialProviderRegistry.getPaymentAdapter(providerIdToUse);
  if (!adapter) {
    throw new Error(
      `PAYMENT_PROVIDER_UNAVAILABLE: Provider '${providerIdToUse}' is not configured or available for jurisdiction '${profile.jurisdictionCode}'.`
    );
  }

  if (!adapter.supportedCurrencies.includes(currencyResolution.transactionCurrency)) {
    throw new Error('JURISDICTION_CURRENCY_MISMATCH: Selected provider does not support the authoritative currency.');
  }
  if (!adapter.capabilities.includes('CREATE_PAYMENT')) {
    throw new Error('PAYMENT_PROVIDER_NOT_READY: Selected provider has no implemented payment-creation capability.');
  }

  const fingerprint = createHash('sha256').update(JSON.stringify([
    payableContext.bookingId, payableContext.bookingReference, requestingPayerId,
    payableContext.payeeProviderId, profile.jurisdictionCode, providerIdToUse,
    payableContext.authoritativeAmountMinorUnits, payableContext.depositAmountMinorUnits,
    payableContext.deliveryFeeMinorUnits, currencyResolution.transactionCurrency,
    payableContext.idempotencyReference, successUrl, cancelUrl,
  ])).digest('hex');
  const store = adapter.executionStore;
  if (adapter.providerId === 'xendit' && payableContext.paymentStateRequirement !== 'FULL_PREPAYMENT') {
    throw new Error('XENDIT_PAYMENT_MODE_UNSUPPORTED: Authorization and escrow cannot be substituted by immediate collection.');
  }
  const priorFingerprint = paymentRequestFingerprints.get(idempotencyKey);
  if (priorFingerprint !== undefined && priorFingerprint !== fingerprint) {
    throw new Error('PAYMENT_IDEMPOTENCY_CONFLICT: Key is already bound to a different authoritative payment request.');
  }
  const existing = store ? store.getAttemptByIdempotency(idempotencyKey, fingerprint) : paymentAttemptsByIdempotency.get(idempotencyKey);
  if (existing) {
    return { success: true, paymentAttempt: existing, checkoutUrl: existing.providerCheckoutUrl, isIdempotentReplay: true };
  }
  const pending = pendingPaymentInitiations.get(idempotencyKey);
  if (pending) return pending;
  paymentRequestFingerprints.set(idempotencyKey, fingerprint);
  const initiation = (async (): Promise<PaymentInitiationResult> => {

  // 7. Invoke Provider
  const now = new Date().toISOString();
  const attemptId = `pay_att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const sessionOutput = await adapter.createPaymentSession({
    jurisdictionCode: profile.jurisdictionCode,
    bookingId: payableContext.bookingId,
    bookingReference: payableContext.bookingReference,
    amountMinorUnits: payableContext.authoritativeAmountMinorUnits,
    currency: transactionCurrency,
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
    transactionCurrency,
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

  const persisted = store ? store.attachAttempt(record, fingerprint) : record;
  paymentAttemptsById.set(persisted.id, persisted);
  paymentAttemptsByIdempotency.set(idempotencyKey, persisted);

  return {
    success: true,
    paymentAttempt: persisted,
    checkoutUrl: sessionOutput.checkoutUrl,
  };
  })();
  // Retain rejected requests too: ambiguous remote failures must be reconciled
  // before issuing another charge. Durable providers also persist the operation intent.
  pendingPaymentInitiations.set(idempotencyKey, initiation);
  return initiation;
}

/**
 * Retrieves a payment attempt record by attempt ID.
 */
export function getPaymentAttemptById(attemptId: string): PaymentAttemptRecord | null {
  for (const adapter of financialProviderRegistry.getAllPaymentAdapters()) {
    const persisted = adapter.executionStore?.getAttemptById(attemptId);
    if (persisted) return persisted;
  }
  return paymentAttemptsById.get(attemptId) || null;
}

/**
 * Retrieves a payment attempt record by provider reference.
 */
export function getPaymentAttemptByProviderReference(providerReference: string, providerId?: string): PaymentAttemptRecord | null {
  for (const adapter of financialProviderRegistry.getAllPaymentAdapters()) {
    if (providerId && adapter.providerId !== providerId) continue;
    const persisted = adapter.executionStore?.getAttemptByReference(providerReference);
    if (persisted) return persisted;
  }
  for (const record of paymentAttemptsById.values()) {
    if (record.providerReference === providerReference && (!providerId || record.paymentProviderId === providerId)) {
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
  let event: NormalizedWebhookEvent;
  try {
    event = adapter.normalizeWebhookPayload(rawPayload);
  } catch {
    return { success: false, error: 'INVALID_WEBHOOK_PAYLOAD: Provider payload could not be normalized.' };
  }

  // 4. Retrieve matching PaymentAttemptRecord
  const store = adapter.executionStore;
  const eventKey = JSON.stringify([adapter.providerId.toLowerCase(), event.providerReference, event.eventId]);
  const eventFingerprint = createHash('sha256').update(JSON.stringify([event.eventType, event.providerTransactionId, event.normalizedStatus, event.amountMinorUnits, event.currency, event.bookingId])).digest('hex');
  const decide = (existingRecord: PaymentAttemptRecord): PaymentWebhookProcessingResult => {
  if (!existingRecord || existingRecord.paymentProviderId.toLowerCase() !== adapter.providerId.toLowerCase()) {
    return {
      success: false,
      error: `RECORD_NOT_FOUND: No PaymentAttempt found matching provider reference '${event.providerReference}'.`,
    };
  }

  if (event.bookingId !== undefined && event.bookingId !== existingRecord.bookingId) {
    return { success: false, error: 'WEBHOOK_BOOKING_MISMATCH: Event is not bound to this booking.' };
  }
  const strictMoney = adapter.providerId.toLowerCase() === 'xendit';
  const invalidMoney = strictMoney && (event.amountMinorUnits === undefined || event.currency === undefined);
  const currencyMismatch = event.currency !== undefined && event.currency !== existingRecord.transactionCurrency;

  // 5. Amount & Currency Verification in Webhook (Anti-Spoofing Section 23)
  if (
    invalidMoney || currencyMismatch || (event.amountMinorUnits !== undefined &&
    (!Number.isSafeInteger(event.amountMinorUnits) || event.amountMinorUnits <= 0 ||
      event.amountMinorUnits !== existingRecord.authoritativeAmountMinorUnits))
  ) {
    const quarantined: PaymentAttemptRecord = Object.freeze({
      ...existingRecord,
      reconciliationStatus: 'MISMATCH',
      failureReason: `AMOUNT_MISMATCH: Webhook amount (${event.amountMinorUnits}) does not match expected (${existingRecord.authoritativeAmountMinorUnits}).`,
      updatedAt: new Date().toISOString(),
    });
    return {
      success: false,
      paymentAttempt: quarantined,
      error: 'WEBHOOK_MONEY_MISMATCH: Event amount/currency is missing, unsafe, or inconsistent with server authority.',
    };
  }

  if (!event.eventId || !event.providerReference) {
    return { success: false, error: 'INVALID_WEBHOOK_IDENTITY: Stable event and provider references are required.' };
  }
  const priorEvent = store ? undefined : processedWebhookEventIds.get(eventKey);
  if (priorEvent !== undefined) {
    return priorEvent === eventFingerprint ? { success: true, isDuplicateReplay: true } :
      { success: false, error: 'WEBHOOK_EVENT_CONFLICT: Event ID reused with different payment facts.' };
  }

  // 6. Out-of-Order Transition Protection (Section 25)
  // If the record is already in a terminal state (e.g. SUCCEEDED), a delayed PENDING/CREATED event must NOT overwrite it!
  if (isPaymentTerminalStatus(existingRecord.normalizedStatus)) {
    if (event.normalizedStatus !== existingRecord.normalizedStatus &&
        (['CREATED', 'PENDING', 'REQUIRES_ACTION', 'PROCESSING'].includes(event.normalizedStatus) ||
          !canTransitionPaymentStatus(existingRecord.normalizedStatus, event.normalizedStatus))) {
      // Mark event as processed to prevent replay loops, but leave state untouched
      if (!store) processedWebhookEventIds.set(eventKey, eventFingerprint);
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

  if (!store) processedWebhookEventIds.set(eventKey, eventFingerprint);

  return {
    success: true,
    paymentAttempt: updated,
  };
  };
  const existingRecord = store ? null : getPaymentAttemptByProviderReference(event.providerReference, adapter.providerId);
  const result = store ? store.applyWebhook(event.providerReference, eventKey, eventFingerprint, decide) :
    existingRecord ? decide(existingRecord) : { success: false, error: 'RECORD_NOT_FOUND' };
  if (result.paymentAttempt) {
    paymentAttemptsById.set(result.paymentAttempt.id, result.paymentAttempt);
    paymentAttemptsByIdempotency.set(result.paymentAttempt.idempotencyKey, result.paymentAttempt);
  }
  return result;
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

  const strictMoney = adapter.providerId.toLowerCase() === 'xendit';
  const amountMatch = providerTruth.amountMinorUnits === undefined ? !strictMoney :
    Number.isSafeInteger(providerTruth.amountMinorUnits) &&
    providerTruth.amountMinorUnits === record.authoritativeAmountMinorUnits;

  const currencyMatch =
    providerTruth.currency === undefined ? !strictMoney :
    providerTruth.currency === record.transactionCurrency;

  const stateMatch = canTransitionPaymentStatus(record.normalizedStatus, providerTruth.normalizedStatus);
  const isMatched = amountMatch && currencyMatch && stateMatch && providerTruth.providerReference === record.providerReference;
  const status: PaymentReconciliationStatus = isMatched ? 'MATCHED' : 'MISMATCH';

  const now = new Date().toISOString();
  const updatedRecord: PaymentAttemptRecord = Object.freeze({
    ...record,
    normalizedStatus: isMatched && providerTruth.normalizedStatus === 'SUCCEEDED' ? 'SUCCEEDED' : record.normalizedStatus,
    reconciliationStatus: status,
    failureReason: isMatched ? record.failureReason : 'RECONCILIATION_MISMATCH',
    updatedAt: now,
  });

  adapter.executionStore?.replaceAttempt(updatedRecord, record);
  paymentAttemptsById.set(record.id, updatedRecord);
  paymentAttemptsByIdempotency.set(updatedRecord.idempotencyKey, updatedRecord);

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
