const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateLiveWebhook() {
  console.log("Setting up Live Pilot Test Data...");

  // 1. Create a dummy test booking to simulate checkout
  const renter = await prisma.user.findFirst({ where: { role: 'Renter' } });
  const provider = await prisma.user.findFirst({ where: { role: 'Individual Provider' } });
  const category = await prisma.category.findFirst({ where: { slug: 'tools' } });
  
  if (!renter || !provider || !category) {
    console.error("Missing test data");
    process.exit(1);
  }

  const listing = await prisma.listing.findFirst({ where: { provider_id: provider.id, category_id: category.id } });
  if (!listing) {
      console.error("Missing tools listing");
      process.exit(1);
  }

  const booking = await prisma.booking.create({
    data: {
      listing_id: listing.id,
      renter_id: renter.id,
      provider_id: provider.id,
      start_date: new Date(),
      end_date: new Date(Date.now() + 86400000),
      rental_duration: 1,
      rental_duration_unit: 'Days',
      selected_rate_type: 'Daily',
      base_rental_amount: 1000,
      deposit_amount: 500,
      estimated_total_amount: 1500,
      pickup_option: 'Pickup',
      status: 'Approved',
      payment_status: 'Pending Payment'
    }
  });

  const transaction = await prisma.gatewayTransaction.create({
    data: {
      booking_id: booking.id,
      provider: 'PayMongo',
      provider_mode: 'Live Pilot',
      gateway_reference: 'cs_live_test_pilot123',
      gateway_status: 'Checkout Pending',
      amount: 1500,
      currency: 'PHP',
      verification_status: 'Not Verified',
      reconciliation_status: 'Pending'
    }
  });

  console.log("Mock Live Transaction Created:", transaction.id);
  console.log("Sending Webhook Payload to API...");

  const payload = {
    data: {
      attributes: {
        type: 'checkout_session.payment.paid',
        data: {
          id: 'cs_live_test_pilot123',
          attributes: {
             metadata: {
                 mode: 'Live Pilot'
             }
          }
        }
      }
    }
  };

  const response = await fetch('http://localhost:3000/api/webhooks/paymongo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'paymongo-signature': 'test-sig'
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    console.log("Webhook Received Successfully by API. Waiting for processing...");
    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const updatedTx = await prisma.gatewayTransaction.findUnique({ where: { id: transaction.id } });
    const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
    const webhookLog = await prisma.paymentWebhookLog.findFirst({ where: { gateway_reference: 'cs_live_test_pilot123' }, orderBy: { received_at: 'desc' } });

    console.log("\n--- Verification Results ---");
    console.log("Webhook Processing Status:", webhookLog?.processing_status);
    console.log("Webhook Verification Status:", webhookLog?.verification_status);
    console.log("Gateway Transaction Status:", updatedTx?.gateway_status);
    console.log("Reconciliation Status:", updatedTx?.reconciliation_status);
    console.log("Booking Payment Status:", updatedBooking?.payment_status);

    if (updatedBooking?.payment_status === 'Pending Finance Review' && updatedTx?.reconciliation_status === 'Matched Pending Finance Review') {
        console.log("✅ SUCCESS: Live Pilot correctly held for mandatory finance review! Booking is NOT auto-confirmed.");
    } else {
        console.log("❌ FAILED: Security check failed. The live pilot must not bypass finance review.");
    }
  } else {
    console.error("Webhook endpoint failed:", response.status);
  }
}

simulateLiveWebhook()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
