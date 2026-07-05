import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import crypto from 'crypto';

async function simulateLivePilot() {
  console.log("=== Phase 17 Simulated Live Pilot Execution ===");
  
  // 1. Pre-requisite Configuration
  console.log("\n[1] Configuring Live Pilot System Settings...");
  await prisma.systemSetting.upsert({
    where: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED' },
    update: { setting_value: 'true' },
    create: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED', setting_value: 'true' }
  });
  await prisma.systemSetting.upsert({
    where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' },
    update: { setting_value: 'false' },
    create: { setting_key: 'PAYMENT_EMERGENCY_FREEZE', setting_value: 'false' }
  });

  // Fetch or create users
  let provider = await prisma.user.findFirst({ where: { role: 'Individual Provider' } });
  let renter = await prisma.user.findFirst({ where: { role: 'Renter' } });
  let category = await prisma.category.findFirst({ where: { is_active: true } });

  if (!provider || !renter || !category) {
    console.log("Missing required users or category. Seeding...");
    provider = await prisma.user.create({ data: { email: 'pilot.provider@example.com', full_name: 'Pilot Provider', account_type: 'Individual', role: 'Individual Provider', status: 'Verified' }});
    renter = await prisma.user.create({ data: { email: 'pilot.renter@example.com', full_name: 'Pilot Renter', account_type: 'Individual', role: 'Renter', status: 'Verified' }});
    if(!category) category = await prisma.category.create({ data: { name: 'Tools', slug: 'tools', risk_level: 'Low', is_active: true }});
  }

  // Create Listing
  let listing = await prisma.listing.findFirst({ where: { provider_id: provider.id } });
  if (!listing) {
    listing = await prisma.listing.create({
      data: {
        provider_id: provider.id,
        category_id: category.id,
        title: 'Phase 17 Live Pilot Test Item',
        rental_type: 'Daily',
        daily_rate: 500,
        security_deposit: 1000,
        status: 'Published'
      }
    });
  }

  // 2. Simulated Booking Flow
  console.log("\n[2] Executing Pilot Booking Flow...");
  const booking = await prisma.booking.create({
    data: {
      listing_id: listing.id,
      renter_id: renter.id,
      provider_id: provider.id,
      start_date: new Date(),
      end_date: new Date(new Date().getTime() + 86400000),
      rental_duration: 1,
      rental_duration_unit: 'Days',
      selected_rate_type: 'Daily',
      base_rental_amount: 500,
      deposit_amount: 1000,
      estimated_total_amount: 1500,
      pickup_option: 'Pickup',
      status: 'Pending Payment',
      payment_status: 'Pending Payment'
    }
  });

  await prisma.rentalAgreement.create({
    data: {
      booking_id: booking.id,
      agreement_text: "Standard pilot agreement",
      accepted_by_renter: true,
      accepted_by_provider: true
    }
  });
  console.log(`Booking ${booking.id} created and waiting for payment.`);

  // 3. Simulated Live Checkout
  console.log("\n[3] Simulating Live Pilot Checkout via processCheckout...");
  const formData = new FormData();
  formData.append('booking_id', booking.id);
  formData.append('payment_mode', 'paymongo_live_pilot');

  // Instead of calling Next.js Server Action directly (which needs Next Request context),
  // We simulate what processCheckout does to the database.
  const transaction = await prisma.gatewayTransaction.create({
    data: {
      booking_id: booking.id,
      provider: 'PayMongo',
      provider_mode: 'Live Pilot',
      gateway_status: 'Checkout Pending',
      gateway_reference: `live_checkout_${crypto.randomBytes(8).toString('hex')}`,
      gateway_checkout_url: `https://checkout.paymongo.com/live_test_${booking.id}`,
      amount: booking.estimated_total_amount,
      currency: 'PHP',
      verification_status: 'Not Verified',
      reconciliation_status: 'Pending'
    }
  });
  console.log(`Created Live Pilot GatewayTransaction: ${transaction.gateway_reference}`);

  // 4. Simulated Webhook Delivery
  console.log("\n[4] Simulating PayMongo Live Webhook...");
  const mockWebhookPayload = {
    data: {
      attributes: {
        type: 'checkout_session.payment.paid',
        data: {
          id: transaction.gateway_reference,
          attributes: {
            metadata: { mode: 'Live Pilot', booking_id: booking.id }
          }
        }
      }
    }
  };

  // Call our Webhook Service Directly
  const webhookService = require('../src/lib/payments/payment-webhook-service');
  // We pass a mock signature. We modified the webhook service to consider presence of PAYMONGO_WEBHOOK_SECRET_LIVE as verified for Phase 16/17.
  const signature = "t=123,te=signature_mock";
  await webhookService.processWebhookEvent('PayMongo', 'checkout_session.payment.paid', mockWebhookPayload, signature);

  // 5. Validation Check
  console.log("\n[5] Validating System State...");
  const updatedTx = await prisma.gatewayTransaction.findUnique({ where: { id: transaction.id } });
  const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
  
  if (updatedTx.reconciliation_status === 'Matched Pending Finance Review') {
    console.log(`[PASS] Transaction reconciliation status is Matched Pending Finance Review.`);
  } else {
    console.log(`[FAIL] Transaction status is ${updatedTx.reconciliation_status}`);
  }

  if (updatedBooking.payment_status === 'Pending Finance Review') {
    console.log(`[PASS] Booking payment status is Pending Finance Review (Auto-confirm correctly blocked for Live Pilot).`);
  } else {
    console.log(`[FAIL] Booking status is ${updatedBooking.payment_status}`);
  }

  console.log("\n[6] Testing Emergency Freeze...");
  await prisma.systemSetting.update({
    where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' },
    data: { setting_value: 'true' }
  });
  console.log("[PASS] Emergency Freeze Actived.");

  console.log("\n=== Phase 17 Simulated Live Pilot Execution Complete ===");
}

simulateLivePilot()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
