const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function runCheck() {
  console.log('Running Database Integrity Check...');
  
  const results: Record<string, number> = {};
  const errors: string[] = [];

  try {
    results.Users = await prisma.user.count();
    results.Listings = await prisma.listing.count();
    results.Bookings = await prisma.booking.count();
    results.Payments = await prisma.payment.count();
    results.GatewayTransactions = await prisma.gatewayTransaction.count();
    results.PaymentWebhookLogs = await prisma.paymentWebhookLog.count();
    results.PaymentReconciliationLogs = await prisma.paymentReconciliationLog.count();
    results.FinanceLedgers = await prisma.financeLedger.count();
    results.DepositActions = await prisma.depositAction.count();
    results.RentalAgreements = await prisma.rentalAgreement.count();
    results.InspectionReports = await prisma.inspectionReport.count();
    results.DisputeCases = await prisma.disputeCase.count();
    results.AuditLogs = await prisma.auditLog.count();
    results.SystemSettings = await prisma.systemSetting.count();
    
    // Check if there are any orphaned bookings
    const orphanedBookings = await prisma.booking.count({
      where: {
        listing_id: { notIn: (await prisma.listing.findMany({ select: { id: true } })).map((l: any) => l.id) }
      }
    });
    
    if (orphanedBookings > 0) {
      errors.push(`Found ${orphanedBookings} orphaned bookings without a valid listing.`);
    }

  } catch (error: any) {
    errors.push(`Database query failed: ${error.message}`);
  }

  const reportContent = `
# Phase 18 Pre-Check Report
**Date:** ${new Date().toISOString()}

## Database Integrity Check
| Model | Record Count |
|-------|--------------|
${Object.entries(results).map(([key, val]) => `| ${key} | ${val} |`).join('\n')}

## Issues Detected
${errors.length > 0 ? errors.map(e => `- ${e}`).join('\n') : "None. Database integrity verified."}

## Conclusion
${errors.length > 0 ? "**FAILED**" : "**PASSED**"}
`;

  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/phase-18-precheck.md', reportContent);
  
  console.log('Integrity check complete. Report written to docs/phase-18-precheck.md');
}

runCheck().catch(console.error).finally(() => prisma.$disconnect());
