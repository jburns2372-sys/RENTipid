const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateFinanceReview() {
  console.log("=== Phase 17 Simulated Finance Review Execution ===");
  
  // Find the live pilot transaction
  const transaction = await prisma.gatewayTransaction.findFirst({
    where: { provider_mode: 'Live Pilot', reconciliation_status: 'Matched Pending Finance Review' },
    include: { booking: true }
  });

  if (!transaction) {
    console.log("No pending finance review transactions found.");
    process.exit(1);
  }

  const booking = transaction.booking;
  console.log(`[1] Found Transaction ${transaction.gateway_reference} for Booking ${booking.id}`);

  // Finance Action: Approve
  console.log("\n[2] Executing Finance Approval...");
  
  // Update transaction status
  await prisma.gatewayTransaction.update({
    where: { id: transaction.id },
    data: { reconciliation_status: 'Matched Confirmed' }
  });

  // Update booking status
  await prisma.booking.update({
    where: { id: booking.id },
    data: { 
      payment_status: 'Paid Live Pilot',
      status: 'Confirmed'
    }
  });

  // Create Finance Ledger entry
  const platformFee = booking.estimated_total_amount * 0.10; // Mock 10% fee
  const providerPayout = booking.base_rental_amount - platformFee;

  await prisma.financeLedger.create({
    data: {
      user_id: booking.provider_id,
      booking_id: booking.id,
      transaction_type: 'Provider Payout',
      amount: providerPayout,
      balance_type: 'Credit',
      description: 'Pending payout for live pilot booking'
    }
  });

  // Record Deposit hold
  if (booking.deposit_amount > 0) {
    await prisma.depositAction.create({
      data: {
        booking_id: booking.id,
        action_type: "Hold",
        amount: booking.deposit_amount,
        reason: "Finance Review Completed. Deposit Held in Escrow.",
        performed_by: "Finance Admin"
      }
    });
  }

  console.log(`[PASS] Finance Review Completed. Booking status is Confirmed. Deposit held. Provider payout recorded but not released.`);

  console.log("\n=== Phase 17 Simulated Finance Review Complete ===");
}

simulateFinanceReview()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
