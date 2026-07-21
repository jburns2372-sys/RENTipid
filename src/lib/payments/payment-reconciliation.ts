import { PrismaClient } from '@prisma/client';
import { compareFinancials } from '@/lib/security/financial';
import { writePaymentActionLog } from '@/lib/payments/payment-action-log-writer';
import { processSecurityEvent } from '@/lib/security/events/event-ingestion';
import { SecurityEnvironment, SecurityLifecycle } from '@/lib/security/events/taxonomy';

const prisma = new PrismaClient();

export async function processPaymentReconciliation(gatewayTransactionId: string): Promise<boolean> {
  const transaction = await prisma.gatewayTransaction.findUnique({
    where: { id: gatewayTransactionId },
    include: { booking: true }
  });

  if (!transaction) throw new Error("GatewayTransaction not found");

  const booking = transaction.booking;
  const expectedAmount = booking.estimated_total_amount;
  const receivedAmount = transaction.amount;

  const expectedCurrency = "PHP"; // Canonical canonical currency for bookings
  const receivedCurrency = transaction.currency;

  const comparison = compareFinancials(expectedAmount, receivedAmount, expectedCurrency, receivedCurrency);

  const isMatched = comparison === "MATCH";
  const status = isMatched ? "Matched" : "Mismatch";

  await prisma.paymentReconciliationLog.create({
    data: {
      booking_id: booking.id,
      gateway_transaction_id: transaction.id,
      expected_amount: expectedAmount,
      received_amount: receivedAmount,
      expected_currency: expectedCurrency,
      received_currency: receivedCurrency,
      status,
      notes: isMatched ? "System automatically matched amount." : `Mismatch! Expected ${expectedAmount}, received ${receivedAmount}. Manual review required.`
    }
  });

  if (isMatched) {
    await prisma.gatewayTransaction.update({
      where: { id: transaction.id },
      data: { reconciliation_status: "Matched" }
    });
    return true;
  } else {
    await prisma.gatewayTransaction.update({
      where: { id: transaction.id },
      data: { reconciliation_status: "Manual Review Required" }
    });

    if (comparison === "MISMATCH") {
      const sourceOperationId = transaction.id; // stable operation identity

      try {
        const log = await prisma.$transaction(async (tx) => {
          return writePaymentActionLog(tx, {
            gateway_transaction_id: transaction.id,
            booking_id: booking.id,
            action_code: 'PAYMENT_AMOUNT_MISMATCH',
            actor_type: 'SYSTEM',
            actor_user_id: null,
            currency: receivedCurrency,
            outcome: 'MISMATCH_DETECTED',
            source_workflow: 'PAYMENT_RECONCILIATION',
            source_operation_id: sourceOperationId,
            expected_amount: expectedAmount,
            received_amount: receivedAmount,
          });
        });

        // Best effort post-commit ingestion
        const lifecycle = process.env.NODE_ENV === 'test' ? 'TEST' : 'LIVE';
        const environment = process.env.NODE_ENV === 'test' ? 'TEST' : 'PRODUCTION';
        processSecurityEvent(log, lifecycle as SecurityLifecycle, environment as SecurityEnvironment).catch(() => {
          // Failure ingestion is best effort, must not throw
        });
      } catch (err) {
        // Do not rollback the reconciliation if log fails
        console.error("Failed to write PAYMENT_AMOUNT_MISMATCH source", err);
      }
    }

    return false;
  }
}
