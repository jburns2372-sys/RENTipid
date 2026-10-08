/** RENTipid payout authority. Payment success never dispatches a payout automatically. */
import { createHash } from 'node:crypto';
import type { EligiblePayoutContext } from '@/lib/global-market/booking/contracts/payment-handoff';
import type { GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';
import { createEligiblePayoutContext } from '@/lib/global-market/booking/services/booking-service';
import { evaluatePayoutHoldStatus } from '@/lib/global-market/post-transaction/services/post-transaction-orchestrator';
import { getClaimsByBookingId } from '@/lib/global-market/post-transaction/services/claim-engine';
import { getDisputesByBookingId } from '@/lib/global-market/post-transaction/services/dispute-engine';
import { canTransitionPayoutStatus, isPayoutTerminalStatus, type PayoutLifecycleState } from '../contracts/payout-lifecycle';
import type { PayoutInstructionRecord, PayoutReconciliationStatus } from '../contracts/payout-record';
import { resolveApprovedSettlementCurrency } from '../contracts/currency-policy';
import { resolveJurisdictionPayoutProfile } from '../registry/jurisdiction-payout-registry';
import { financialProviderRegistry } from '../registry/payment-provider-registry';
import type { PaymentAttemptRecord } from '../contracts/payment-record';
import type { CreatePayoutInput, NormalizedPayoutWebhookEvent } from '../contracts/payout-provider';
import type { PayoutWebhookResult } from '../contracts/payout-execution-store';

const byId = new Map<string,PayoutInstructionRecord>();
const byBooking = new Map<string,PayoutInstructionRecord>();
const byKey = new Map<string,PayoutInstructionRecord>();
const fingerprints = new Map<string,string>();
const pending = new Map<string,Promise<CreatePayoutInstructionResult>>();
const receipts = new Map<string,string>();
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function cache(record: PayoutInstructionRecord) {
  byId.set(record.id,record); byBooking.set(record.bookingId,record); byKey.set(record.idempotencyKey,record);
}
function held(bookingId: string): boolean {
  // Conservative unresolved-liability guard, including escalated claims/disputes.
  return evaluatePayoutHoldStatus(bookingId).isHeld ||
    getClaimsByBookingId(bookingId).some(claim => !['CLOSED','CANCELLED','REJECTED','RESOLVED'].includes(claim.status)) ||
    getDisputesByBookingId(bookingId).some(dispute => dispute.status !== 'CLOSED');
}
export interface PayoutEligibilityParams {
  readonly booking: GlobalBookingRecord;
  readonly paymentRecord?: PaymentAttemptRecord | null;
  readonly providerKycApproved: boolean;
  readonly hasOpenDispute?: boolean;
  readonly hasOpenClaim?: boolean;
  readonly holdReason?: string;
}
export interface PayoutEligibilityResult { readonly eligible: boolean; readonly reason?: string; }
export function evaluatePayoutEligibility(params: PayoutEligibilityParams): PayoutEligibilityResult {
  const { booking,paymentRecord,providerKycApproved } = params;
  if (!paymentRecord || paymentRecord.normalizedStatus !== 'SUCCEEDED') return { eligible:false,reason:'PAYMENT_NOT_SETTLED' };
  if (paymentRecord.bookingId !== booking.id || paymentRecord.providerId !== booking.participants.providerId ||
      paymentRecord.payerId !== booking.participants.renterId || paymentRecord.jurisdictionCode !== booking.participants.jurisdictionCode ||
      paymentRecord.transactionCurrency !== booking.moneySnapshot.transactionCurrencyRequired ||
      paymentRecord.authoritativeAmountMinorUnits !== booking.moneySnapshot.estimatedTotalAmountMinorUnits ||
      paymentRecord.reconciliationStatus === 'MISMATCH' || paymentRecord.reconciliationStatus === 'MANUAL_REVIEW_REQUIRED') return { eligible:false,reason:'PAYMENT_BOOKING_AUTHORITY_MISMATCH' };
  if (booking.status !== 'COMPLETED') return { eligible:false,reason:'BOOKING_NOT_COMPLETED' };
  if (providerKycApproved !== true) return { eligible:false,reason:'PROVIDER_KYC_REQUIRED' };
  if (params.hasOpenClaim || params.hasOpenDispute || params.holdReason || held(booking.id)) return { eligible:false,reason:'CLAIM_DISPUTE_OR_OTHER_HOLD' };
  return { eligible:true };
}
export interface CreatePayoutInstructionInput {
  readonly eligibleContext: EligiblePayoutContext;
  readonly booking: GlobalBookingRecord;
  readonly paymentRecord: PaymentAttemptRecord;
  readonly providerKycApproved: boolean;
  readonly authoritativeBeneficiaryReference: string;
  readonly clientSubmittedBeneficiary?: string;
  readonly clientSubmittedAmount?: number;
  readonly clientSubmittedCurrency?: string;
  readonly idempotencyKey: string;
  readonly payoutProviderId?: string;
  readonly beneficiaryAccountType?: 'BANK' | 'WALLET';
  readonly hasOpenDispute?: boolean;
  readonly hasOpenClaim?: boolean;
  readonly holdReason?: string;
}
export interface CreatePayoutInstructionResult {
  readonly success: boolean;
  readonly payoutInstruction?: PayoutInstructionRecord;
  readonly isIdempotentReplay?: boolean;
  readonly reason?: string;
}
export async function createPayoutInstruction(input: CreatePayoutInstructionInput): Promise<CreatePayoutInstructionResult> {
  const { eligibleContext: context, booking, paymentRecord, authoritativeBeneficiaryReference: beneficiary, idempotencyKey } = input;
  if (!idempotencyKey.trim() || !beneficiary.trim() || !Number.isSafeInteger(context.payoutAmountMinorUnits) || context.payoutAmountMinorUnits <= 0) throw new Error('INVALID_PAYOUT_IDENTITY_OR_AMOUNT');
  const authoritative = createEligiblePayoutContext(booking);
  if (context.bookingId !== authoritative.bookingId || context.bookingReference !== authoritative.bookingReference ||
      context.providerId !== authoritative.providerId || context.jurisdictionCode !== authoritative.jurisdictionCode ||
      context.payoutAmountMinorUnits !== authoritative.payoutAmountMinorUnits || context.settlementCurrency !== authoritative.settlementCurrency ||
      context.amountAuthorityReference !== authoritative.amountAuthorityReference || context.eligibleSettlementTrigger !== authoritative.eligibleSettlementTrigger ||
      context.isSettled !== false || context.payoutAmountMinorUnits > paymentRecord.authoritativeAmountMinorUnits) throw new Error('PAYOUT_CONTEXT_AUTHORITY_MISMATCH');
  if (input.clientSubmittedBeneficiary !== undefined && input.clientSubmittedBeneficiary !== beneficiary) throw new Error('BENEFICIARY_TAMPERING_BLOCKED');
  if (input.clientSubmittedAmount !== undefined && input.clientSubmittedAmount !== context.payoutAmountMinorUnits) throw new Error('PAYOUT_AMOUNT_TAMPERING_BLOCKED');
  if (input.clientSubmittedCurrency !== undefined && input.clientSubmittedCurrency !== context.settlementCurrency) throw new Error('PAYOUT_CURRENCY_TAMPERING_BLOCKED');
  const eligibility = evaluatePayoutEligibility(input);
  if (!eligibility.eligible) throw new Error(`PAYOUT_INELIGIBLE: ${eligibility.reason}`);
  const profile = resolveJurisdictionPayoutProfile(context.jurisdictionCode);
  if (!profile) throw new Error('UNKNOWN_PAYOUT_JURISDICTION');
  const currency = resolveApprovedSettlementCurrency({ jurisdictionCode:profile.jurisdictionCode,
    allowedSettlementCurrencies:profile.supportedSettlementCurrencies,defaultSettlementCurrency:profile.defaultSettlementCurrency,
    supportsCrossBorderSettlement:false }, context.settlementCurrency);
  if (!currency.isValid || currency.settlementCurrency !== context.settlementCurrency) throw new Error('SETTLEMENT_CURRENCY_ERROR');
  const providerId = (input.payoutProviderId ?? profile.approvedProviderIds[0] ?? '').trim().toLowerCase();
  const explicitPhMock = input.payoutProviderId === 'mock_payout_rail' && profile.jurisdictionCode === 'PH' &&
    ['test','development'].includes(process.env.NODE_ENV ?? '');
  if (!providerId || (!profile.approvedProviderIds.includes(providerId) && !explicitPhMock)) throw new Error('JURISDICTION_PAYOUT_PROVIDER_MISMATCH');
  const adapter = financialProviderRegistry.getPayoutAdapter(providerId);
  if (!adapter || !adapter.capabilities.includes('CREATE_PAYOUT') || !adapter.supportedCurrencies.includes(context.settlementCurrency)) throw new Error('PAYOUT_PROVIDER_UNAVAILABLE');
  if (adapter.providerType === 'MOCK' && !['test','development'].includes(process.env.NODE_ENV ?? '')) throw new Error('MOCK_PAYOUT_PROHIBITED');
  const payoutId = `payout_${hash([booking.id,providerId]).slice(0,32)}`;
  const accountType = input.beneficiaryAccountType ?? 'BANK';
  const providerInput: CreatePayoutInput = { payoutId, bookingId:booking.id, providerId:context.providerId,
    jurisdictionCode:profile.jurisdictionCode,amountMinorUnits:context.payoutAmountMinorUnits,currency:context.settlementCurrency,
    beneficiaryReference:beneficiary,description:'RENTipid rental provider settlement',idempotencyKey,
    metadata:{ hasActiveClaim:input.hasOpenClaim === true,hasActiveDispute:input.hasOpenDispute === true,holdReason:input.holdReason,accountType } };
  const store = adapter.executionStore;
  if (providerId === 'xendit_payout' && (!store || !adapter.authorizePayout || paymentRecord.reconciliationStatus !== 'MATCHED')) throw new Error('XENDIT_PAYOUT_NOT_CONFIGURED_OR_PAYMENT_UNRECONCILED');
  await adapter.authorizePayout?.(providerInput);
  const checked = await adapter.validateBeneficiary({ providerId:context.providerId,beneficiaryReference:beneficiary,accountType,
    jurisdictionCode:profile.jurisdictionCode,currency:context.settlementCurrency });
  if (!checked.isValid || checked.normalizedAccountReference !== beneficiary) throw new Error('INVALID_AUTHORITATIVE_BENEFICIARY');
  if (!evaluatePayoutEligibility(input).eligible) throw new Error('PAYOUT_HELD_AFTER_BENEFICIARY_CHECK');
  const fingerprint = hash([booking.id,context.providerId,profile.jurisdictionCode,beneficiary,context.payoutAmountMinorUnits,
    context.settlementCurrency,providerId,accountType,context.amountAuthorityReference]);
  const localKey = store ? store.getByKey(idempotencyKey) : byKey.get(idempotencyKey);
  if (localKey && localKey.bookingId !== booking.id) throw new Error('PAYOUT_IDEMPOTENCY_CONFLICT');
  if (fingerprints.has(booking.id) && fingerprints.get(booking.id) !== fingerprint) throw new Error('PAYOUT_AUTHORITY_CONFLICT');
  const existing = store ? store.getByBooking(booking.id,fingerprint) : byBooking.get(booking.id);
  if (existing) return { success:true,payoutInstruction:existing,isIdempotentReplay:true };
  if (pending.has(booking.id)) return pending.get(booking.id)!;
  fingerprints.set(booking.id,fingerprint);
  const execution = (async () => {
    const output = await adapter.createPayout(providerInput);
    const now = new Date().toISOString();
    const record: PayoutInstructionRecord = Object.freeze({ id:payoutId,bookingId:booking.id,providerId:context.providerId,
      jurisdictionCode:profile.jurisdictionCode,beneficiaryReference:beneficiary,payoutAmountMinorUnits:context.payoutAmountMinorUnits,
      settlementCurrency:context.settlementCurrency,payoutProviderId:adapter.providerId,payoutMethod:accountType === 'BANK' ? 'BANK_TRANSFER':'WALLET_TRANSFER',
      idempotencyKey,providerReference:output.providerReference,normalizedStatus:output.initialStatus,reconciliationStatus:'PENDING',createdAt:now,updatedAt:now });
    const persisted = store ? store.attach(record,fingerprint) : record; cache(persisted);
    return { success:true,payoutInstruction:persisted };
  })();
  pending.set(booking.id,execution); return execution;
}
export function getPayoutInstructionById(payoutId: string): PayoutInstructionRecord | null {
  for (const adapter of financialProviderRegistry.getAllPayoutAdapters()) {
    const record = adapter.executionStore?.getById(payoutId); if (record) return record;
  }
  return byId.get(payoutId) ?? null;
}
function canObserve(current: PayoutLifecycleState,target: PayoutLifecycleState): boolean {
  return canTransitionPayoutStatus(current,target) || (target === 'REVERSED' &&
    canTransitionPayoutStatus(current,'SUCCEEDED') && canTransitionPayoutStatus('SUCCEEDED','REVERSED'));
}
function decideEvent(record: PayoutInstructionRecord,event: NormalizedPayoutWebhookEvent,providerId: string): PayoutWebhookResult {
  if (record.payoutProviderId !== providerId || event.providerReference !== record.providerReference ||
      (event.payoutId !== undefined && event.payoutId !== record.id)) return { success:false,error:'PAYOUT_WEBHOOK_IDENTITY_MISMATCH' };
  if (event.amountMinorUnits !== record.payoutAmountMinorUnits || event.currency !== record.settlementCurrency) return { success:false,error:'PAYOUT_WEBHOOK_MONEY_MISMATCH' };
  const stale = (isPayoutTerminalStatus(record.normalizedStatus) || record.normalizedStatus === 'FAILED') &&
    event.normalizedStatus !== record.normalizedStatus && !canObserve(record.normalizedStatus,event.normalizedStatus);
  const retryRegression = record.normalizedStatus === 'FAILED' && ['PENDING','PROCESSING'].includes(event.normalizedStatus);
  if (stale || retryRegression) return { success:true,outOfOrderIgnored:true,payoutInstruction:record };
  if (!canObserve(record.normalizedStatus,event.normalizedStatus)) return { success:false,error:'ILLEGAL_PAYOUT_TRANSITION' };
  return { success:true,payoutInstruction:Object.freeze({ ...record,normalizedStatus:event.normalizedStatus,updatedAt:new Date().toISOString() }) };
}
export async function processPayoutWebhook(providerId: string,payload: unknown,signature: string,headers?: Record<string,string>): Promise<PayoutWebhookResult> {
  const adapter = financialProviderRegistry.getPayoutAdapter(providerId);
  if (!adapter?.verifyWebhookSignature || !adapter.normalizeWebhookPayload || !adapter.verifyWebhookSignature(payload,signature,headers)) return { success:false,error:'INVALID_PAYOUT_WEBHOOK_SIGNATURE' };
  let event: NormalizedPayoutWebhookEvent;
  try { event = adapter.normalizeWebhookPayload(payload); } catch { return { success:false,error:'INVALID_PAYOUT_WEBHOOK_PAYLOAD' }; }
  if (!event.eventId || !event.providerReference) return { success:false,error:'INVALID_PAYOUT_WEBHOOK_IDENTITY' };
  const key = hash([adapter.providerId,event.providerReference,event.eventId]);
  const fingerprint = hash([event.eventType,event.normalizedStatus,event.amountMinorUnits,event.currency,event.payoutId]);
  const store = adapter.executionStore;
  if (adapter.providerId === 'xendit_payout' && !store) return { success:false,error:'DURABLE_PAYOUT_STORAGE_REQUIRED' };
  let result: PayoutWebhookResult;
  if (store) result = store.applyWebhook(event.providerReference,key,fingerprint,record => decideEvent(record,event,adapter.providerId));
  else {
    const record = Array.from(byId.values()).find(r => r.payoutProviderId === adapter.providerId && r.providerReference === event.providerReference);
    if (!record) return { success:false,error:'PAYOUT_RECORD_NOT_FOUND' };
    const previous = receipts.get(key);
    result = previous !== undefined ? previous === fingerprint ? { success:true,isDuplicateReplay:true,payoutInstruction:record } :
      { success:false,error:'PAYOUT_WEBHOOK_EVENT_CONFLICT' } : decideEvent(record,event,adapter.providerId);
    if (result.success) receipts.set(key,fingerprint);
  }
  if (result.payoutInstruction) cache(result.payoutInstruction);
  return result;
}
export interface PayoutReconciliationResult {
  readonly status:PayoutReconciliationStatus;
  readonly matched:boolean;
  readonly expectedAmountMinorUnits:number;
  readonly providerAmountMinorUnits?:number;
  readonly expectedCurrency:string;
  readonly providerCurrency?:string;
  readonly updatedRecord:PayoutInstructionRecord;
}
export async function reconcilePayoutWithProvider(payoutId: string): Promise<PayoutReconciliationResult> {
  const record = getPayoutInstructionById(payoutId);
  if (!record?.providerReference) throw new Error('PAYOUT_RECONCILIATION_RECORD_NOT_FOUND');
  const adapter = financialProviderRegistry.getPayoutAdapter(record.payoutProviderId);
  if (!adapter) throw new Error('PAYOUT_RECONCILIATION_PROVIDER_NOT_FOUND');
  const truth = await adapter.retrievePayoutStatus(record.providerReference);
  const matched = truth.providerReference === record.providerReference && truth.amountMinorUnits === record.payoutAmountMinorUnits &&
    truth.currency === record.settlementCurrency && canObserve(record.normalizedStatus,truth.normalizedStatus) &&
    !(record.normalizedStatus === 'FAILED' && ['PENDING','PROCESSING'].includes(truth.normalizedStatus));
  const status: PayoutReconciliationStatus = matched ? 'MATCHED':'MISMATCH';
  const updatedRecord: PayoutInstructionRecord = Object.freeze({ ...record,normalizedStatus:matched ? truth.normalizedStatus:record.normalizedStatus,
    reconciliationStatus:status,failureReason:matched ? truth.failureReason:'PAYOUT_RECONCILIATION_MISMATCH',updatedAt:new Date().toISOString() });
  adapter.executionStore?.replace(updatedRecord,record); cache(updatedRecord);
  return { status,matched,expectedAmountMinorUnits:record.payoutAmountMinorUnits,providerAmountMinorUnits:truth.amountMinorUnits,
    expectedCurrency:record.settlementCurrency,providerCurrency:truth.currency,updatedRecord };
}
