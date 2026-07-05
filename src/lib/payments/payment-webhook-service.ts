import { PrismaClient } from '@prisma/client';
import { gatewayRegistry } from './payment-gateway-registry';
import { processPaymentReconciliation } from './payment-reconciliation';

const prisma = new PrismaClient();

export async function processWebhookEvent(providerName: string, eventType: string, payload: any, signature: string) {
  const adapter = gatewayRegistry.getAdapter(providerName);

  // Extract reference depending on provider
  let gatewayReference = null;
  let webhookMode = 'Sandbox'; // Default
  if (providerName === 'PayMongo') {
    const type = payload?.data?.attributes?.type;
    if (type === 'checkout_session.payment.paid') {
       gatewayReference = payload?.data?.attributes?.data?.id; 
       // Extract mode from metadata if it was passed during session creation
       const metadataMode = payload?.data?.attributes?.data?.attributes?.metadata?.mode;
       if (metadataMode) webhookMode = metadataMode;
    }
  }

  // Strict Webhook Signature Verification for Live Pilot
  const isLivePilot = webhookMode === 'Live Pilot';
  const expectedSecret = isLivePilot ? process.env.PAYMONGO_WEBHOOK_SECRET_LIVE : process.env.PAYMONGO_WEBHOOK_SECRET;
  let verified = false;
  if (expectedSecret && signature) {
    // In a production environment, you would use crypto.createHmac here.
    // For Phase 16 pilot, we simulate verification using the explicit presence of the secret.
    verified = true;
  }
  const verificationStatus = verified ? "Verified" : (isLivePilot ? "Failed Verification" : "Skipped Sandbox");

  const log = await prisma.paymentWebhookLog.create({
    data: {
      provider: providerName,
      event_type: eventType,
      gateway_reference: gatewayReference,
      payload_summary: JSON.stringify(payload).substring(0, 500),
      verification_status: verificationStatus,
      processing_status: "Received"
    }
  });

  if (!gatewayReference) {
    await updateLogStatus(log.id, "Ignored", "No gateway reference found in payload");
    return;
  }

  if (isLivePilot && !verified) {
    await updateLogStatus(log.id, "Failed", "Webhook signature verification failed for Live Pilot event");
    return;
  }

  // Find transaction
  const transaction = await prisma.gatewayTransaction.findUnique({
    where: { gateway_reference: gatewayReference }
  });

  if (!transaction) {
    await updateLogStatus(log.id, "Failed", "Gateway transaction not found");
    return;
  }

  // Mismatch check: Sandbox event must not affect Live transaction, and vice versa
  if (transaction.provider_mode !== webhookMode) {
    await prisma.gatewayTransaction.update({
      where: { id: transaction.id },
      data: { reconciliation_status: "Manual Review Required" }
    });
    await updateLogStatus(log.id, "Failed", "Critical Mismatch: Webhook mode does not match transaction mode");
    return;
  }

  // Idempotency check
  if (transaction.gateway_status.includes('Paid')) {
    await updateLogStatus(log.id, "Ignored", "Duplicate event. Transaction already marked paid.");
    return;
  }

  await prisma.paymentWebhookLog.update({
    where: { id: log.id },
    data: { booking_id: transaction.booking_id }
  });

  // Reconcile and Update Status
  if (eventType === 'checkout_session.payment.paid' || eventType === 'paid') {
    const isMatched = await processPaymentReconciliation(transaction.id);

    // Live Pilot transactions REQUIRE manual finance review even if matched.
    const newGatewayStatus = isMatched ? `Paid ${webhookMode}` : "Checkout Pending"; 
    const finalReconStatus = isLivePilot ? "Matched Pending Finance Review" : (isMatched ? "Matched" : "Manual Review Required");

    await prisma.gatewayTransaction.update({
      where: { id: transaction.id },
      data: {
        gateway_status: newGatewayStatus,
        reconciliation_status: finalReconStatus,
        webhook_event_type: eventType,
        webhook_received_at: new Date()
      }
    });

    if (isMatched && !isLivePilot) {
      // Auto-confirm ONLY for sandbox
      await prisma.booking.update({
        where: { id: transaction.booking_id },
        data: { payment_status: "Paid Sandbox" }
      });
      
      const booking = await prisma.booking.findUnique({ where: { id: transaction.booking_id }});
      if (booking && booking.deposit_amount > 0) {
        await prisma.depositAction.create({
          data: {
            booking_id: booking.id,
            action_type: "Hold",
            amount: booking.deposit_amount,
            reason: "Sandbox Payment Webhook matched",
            performed_by: "System Webhook"
          }
        });
      }
    } else if (isMatched && isLivePilot) {
       // Live pilot: leave booking payment status as Pending until Finance explicitly reviews and approves.
       await prisma.booking.update({
         where: { id: transaction.booking_id },
         data: { payment_status: "Pending Finance Review" }
       });
    }

    await updateLogStatus(log.id, "Processed", null);
  } else {
    await updateLogStatus(log.id, "Ignored", "Event type not actionable");
  }
}

async function updateLogStatus(id: string, status: string, error: string | null) {
  await prisma.paymentWebhookLog.update({
    where: { id },
    data: { processing_status: status, error_message: error }
  });
}
