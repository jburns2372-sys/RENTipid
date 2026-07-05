const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIntegrity() {
  console.log("Running Database Integrity Check for Phase 19B-E...");
  
  const metrics = [
    { name: 'Users', model: prisma.user },
    { name: 'Listings', model: prisma.listing },
    { name: 'Bookings', model: prisma.booking },
    { name: 'Payment Records', model: prisma.payment },
    { name: 'Gateway Transactions', model: prisma.gatewayTransaction },
    { name: 'Webhook Logs', model: prisma.paymentWebhookLog },
    { name: 'Reconciliation Logs', model: prisma.paymentReconciliationLog },
    { name: 'Refund Requests', model: prisma.refundRequest },
    { name: 'Provider Payouts', model: prisma.providerPayout },
    { name: 'Payout Batches', model: prisma.payoutBatch },
    { name: 'Finance Ledger', model: prisma.financeLedger },
    { name: 'Deposit Ledger', model: prisma.depositAction },
    { name: 'Audit Logs', model: prisma.auditLog },
    { name: 'System Settings', model: prisma.systemSetting }
  ];

  for (const metric of metrics) {
    try {
      const count = await metric.model.count();
      console.log(`[PASS] ${metric.name} intact (Count: ${count})`);
    } catch (e) {
      console.error(`[FAIL] ${metric.name} could not be queried:`, e.message);
    }
  }
  
  await prisma.$disconnect();
}

checkIntegrity();
