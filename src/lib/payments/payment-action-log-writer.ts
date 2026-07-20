import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { parseToDecimal } from '@/lib/security/financial';

export const PAYMENT_ACTION_CODES = ['PAYMENT_INITIALIZED'] as const;
export const PAYMENT_ACTOR_TYPES = ['RENTER'] as const;
export const PAYMENT_ACTION_OUTCOMES = ['SUCCESS'] as const;

export type PaymentActionCode = typeof PAYMENT_ACTION_CODES[number];
export type PaymentActorType = typeof PAYMENT_ACTOR_TYPES[number];
export type PaymentActionOutcome = typeof PAYMENT_ACTION_OUTCOMES[number];

export function validatePaymentVocabulary(actionCode: string, actorType: string, outcome: string) {
  if (!PAYMENT_ACTION_CODES.includes(actionCode as PaymentActionCode)) {
    throw new Error(`GATE4B4_SLICE_B1C_VOCABULARY_VIOLATION: Invalid action_code ${actionCode}`);
  }
  if (!PAYMENT_ACTOR_TYPES.includes(actorType as PaymentActorType)) {
    throw new Error(`GATE4B4_SLICE_B1C_VOCABULARY_VIOLATION: Invalid actor_type ${actorType}`);
  }
  if (!PAYMENT_ACTION_OUTCOMES.includes(outcome as PaymentActionOutcome)) {
    throw new Error(`GATE4B4_SLICE_B1C_VOCABULARY_VIOLATION: Invalid outcome ${outcome}`);
  }
}

export async function writePaymentActionLog(
  tx: Prisma.TransactionClient,
  data: {
    gateway_transaction_id: string;
    booking_id: string;
    action_code: string;
    actor_type: string;
    actor_user_id: string;
    amount: number | string | Prisma.Decimal;
    currency: string;
    outcome: string;
    source_workflow: string;
    source_operation_id: string;
  }
) {
  validatePaymentVocabulary(data.action_code, data.actor_type, data.outcome);

  // Financial Precision Contract
  const canonicalAmount = parseToDecimal(data.amount);
  if (!canonicalAmount || canonicalAmount.isNegative() || canonicalAmount.isZero()) {
    throw new Error('GATE4B4_SLICE_B1C_FINANCIAL_SOURCE_UNPROVEN: Invalid amount');
  }

  const currency = data.currency.toUpperCase();
  if (!currency) {
    throw new Error('GATE4B4_SLICE_B1C_FINANCIAL_SOURCE_UNPROVEN: Missing currency');
  }

  // Business Action Idempotency Contract
  const idempotencyRaw = `${data.source_workflow}|${data.action_code}|${data.source_operation_id}`;
  const idempotencyKey = createHash('sha256').update(idempotencyRaw).digest('hex');

  // Insert the immutable PaymentActionLog row using the atomic transaction client
  const log = await tx.paymentActionLog.create({
    data: {
      gateway_transaction_id: data.gateway_transaction_id,
      booking_id: data.booking_id,
      action_code: data.action_code,
      actor_type: data.actor_type,
      actor_user_id: data.actor_user_id,
      amount: canonicalAmount,
      currency,
      outcome: data.outcome,
      source_workflow: data.source_workflow,
      source_operation_id: data.source_operation_id,
      idempotency_key: idempotencyKey,
      occurred_at: new Date(),
    }
  });

  return log;
}

export async function recordPaymentInitializedAction(
  tx: Prisma.TransactionClient,
  gatewayTransaction: { id: string, amount: number, currency: string },
  booking: { id: string },
  actorUserId: string,
  sourceOperationId?: string
) {
  return writePaymentActionLog(tx, {
    gateway_transaction_id: gatewayTransaction.id,
    booking_id: booking.id,
    action_code: 'PAYMENT_INITIALIZED',
    actor_type: 'RENTER',
    actor_user_id: actorUserId,
    amount: gatewayTransaction.amount,
    currency: gatewayTransaction.currency,
    outcome: 'SUCCESS',
    source_workflow: 'CHECKOUT_INITIALIZATION',
    source_operation_id: sourceOperationId || gatewayTransaction.id
  });
}
