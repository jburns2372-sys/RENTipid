import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { parseToDecimal } from '@/lib/security/financial';

export async function recordPaymentInitializedAction(
  tx: Prisma.TransactionClient,
  gatewayTransaction: { id: string, amount: number, currency: string },
  booking: { id: string },
  actorUserId: string
) {
  // Financial Precision Contract
  const canonicalAmount = parseToDecimal(gatewayTransaction.amount);
  if (!canonicalAmount || canonicalAmount.isNegative() || canonicalAmount.isZero()) {
    throw new Error('GATE4B4_SLICE_B1C_FINANCIAL_SOURCE_UNPROVEN: Invalid amount');
  }

  const currency = gatewayTransaction.currency.toUpperCase();
  if (!currency) {
    throw new Error('GATE4B4_SLICE_B1C_FINANCIAL_SOURCE_UNPROVEN: Missing currency');
  }

  // Business Action Idempotency Contract
  // SHA256(source_workflow | action_code | source_operation_id)
  const sourceWorkflow = 'CHECKOUT_INITIALIZATION';
  const actionCode = 'PAYMENT_INITIALIZED';
  const sourceOperationId = gatewayTransaction.id;

  const idempotencyRaw = `${sourceWorkflow}|${actionCode}|${sourceOperationId}`;
  const idempotencyKey = createHash('sha256').update(idempotencyRaw).digest('hex');

  // Insert the immutable PaymentActionLog row using the atomic transaction client
  const log = await tx.paymentActionLog.create({
    data: {
      gateway_transaction_id: gatewayTransaction.id,
      booking_id: booking.id,
      action_code: actionCode,
      actor_type: 'RENTER',
      actor_user_id: actorUserId,
      amount: canonicalAmount,
      currency: currency,
      outcome: 'SUCCESS',
      source_workflow: sourceWorkflow,
      source_operation_id: sourceOperationId,
      idempotency_key: idempotencyKey,
      occurred_at: new Date(),
    }
  });

  return log;
}
