import { PrismaClient } from '@prisma/client';

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

  const isMatched = expectedAmount === receivedAmount && transaction.currency === "PHP";
  const status = isMatched ? "Matched" : "Mismatch";

  await prisma.paymentReconciliationLog.create({
    data: {
      booking_id: booking.id,
      gateway_transaction_id: transaction.id,
      expected_amount: expectedAmount,
      received_amount: receivedAmount,
      expected_currency: "PHP",
      received_currency: transaction.currency,
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
    return false;
  }
}
