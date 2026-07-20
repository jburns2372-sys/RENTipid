'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { gatewayRegistry } from '@/lib/payments/payment-gateway-registry';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function processCheckout(formData: FormData) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) throw new Error("Unauthorized");

  const bookingId = formData.get('booking_id') as string;
  const paymentMode = formData.get('payment_mode') as string;
  const idempotencyKey = formData.get('checkout_request_id') as string;

  if (!idempotencyKey) throw new Error("Missing checkout operation identity");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true }
  });

  if (!booking || booking.renter_id !== user.id) throw new Error("Invalid booking");
  if (booking.status !== 'Approved' || booking.payment_status !== 'Pending Payment') throw new Error("Booking not ready for payment");

  if (paymentMode === 'paymongo_live_pilot') {
    const settingsKeys = [
      'PAYMENT_LIVE_PILOT_ENABLED',
      'PAYMENT_EMERGENCY_FREEZE',
      'PILOT_RENTER_ID',
      'PILOT_LISTING_ID',
      'PILOT_MAX_AMOUNT',
      'PAYMONGO_VERIFICATION_APPROVED',
      'PAYMONGO_GCASH_ACTIVE',
      'PAYMONGO_CARD_ACTIVE'
    ];
    
    const settingsRaw = await prisma.systemSetting.findMany({ where: { setting_key: { in: settingsKeys } }});
    const s = settingsRaw.reduce((acc: Record<string, string>, curr: any) => ({ ...acc, [curr.setting_key]: curr.setting_value }), {});

    const pilotMaxAmount = parseFloat(s['PILOT_MAX_AMOUNT'] || '5000');
    
    const appBaseUrl = process.env.APP_BASE_URL || '';
    const isHttps = appBaseUrl.startsWith('https://') && !appBaseUrl.includes('localhost') && !appBaseUrl.includes('127.0.0.1') && !appBaseUrl.includes('0.0.0.0');

    if (s['PAYMENT_EMERGENCY_FREEZE'] === 'true') {
      await prisma.auditLog.create({
        data: {
          actor_user_id: user.id,
          action: 'LIVE_CHECKOUT_BLOCKED_BY_FREEZE',
          module: 'Checkout',
          details: 'Emergency freeze prevented live checkout.'
        }
      });
      redirect(`/checkout/${booking.id}?error=frozen`);
    }

    if (
      s['PAYMENT_LIVE_PILOT_ENABLED'] !== 'true' ||
      user.id !== s['PILOT_RENTER_ID'] ||
      booking.listing_id !== s['PILOT_LISTING_ID'] ||
      booking.estimated_total_amount > pilotMaxAmount ||
      s['PAYMONGO_VERIFICATION_APPROVED'] !== 'Approved' ||
      (s['PAYMONGO_GCASH_ACTIVE'] !== 'Approved' && s['PAYMONGO_CARD_ACTIVE'] !== 'Approved') ||
      !isHttps
    ) {
      throw new Error("Live pilot checkout strictly blocked by pre-flight readiness lock.");
    }
  }

  let transaction;
  let isNewTransaction = false;

  try {
    transaction = await prisma.$transaction(async (tx) => {
      const existing = await tx.gatewayTransaction.findUnique({
        where: { idempotency_key: idempotencyKey }
      });

      if (existing) {
        return existing;
      }

      isNewTransaction = true;
      const newTx = await tx.gatewayTransaction.create({
        data: {
          booking_id: booking.id,
          idempotency_key: idempotencyKey,
          provider: paymentMode.startsWith('paymongo') ? 'PayMongo' : 'Mock',
          provider_mode: paymentMode === 'paymongo_live_pilot' ? 'Live Pilot' : 'Sandbox',
          gateway_status: 'Created',
          amount: booking.estimated_total_amount,
          currency: 'PHP',
          verification_status: 'Not Verified',
          reconciliation_status: 'Pending'
        }
      });

      const { recordPaymentInitializedAction } = await import('@/lib/payments/payment-action-log-writer');
      
      await recordPaymentInitializedAction(
        tx,
        { id: newTx.id, amount: newTx.amount, currency: newTx.currency },
        { id: booking.id },
        user.id,
        idempotencyKey
      );

      return newTx;
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const existing = await prisma.gatewayTransaction.findUnique({
        where: { idempotency_key: idempotencyKey }
      });
      if (!existing) throw new Error("Concurrency resolution failed");
      transaction = existing;
      isNewTransaction = false;
    } else {
      throw error;
    }
  }

  if (!isNewTransaction) {
    if (transaction.gateway_checkout_url) {
      redirect(transaction.gateway_checkout_url);
    }
    // If it's a mock payment, it will redirect below.
    // If it's PayMongo and still 'Created', another thread is handling it.
    if (transaction.gateway_status === 'Created' && paymentMode.startsWith('paymongo')) {
      redirect(`/checkout/${booking.id}?info=processing`);
    }
  }

  if (paymentMode === 'mock' || paymentMode === 'manual') {
    // Legacy / Mock Flow
    redirect(`/api/payments?booking_id=${booking.id}`);
  }

  if (paymentMode === 'paymongo' || paymentMode === 'paymongo_live_pilot') {
    const isLivePilot = paymentMode === 'paymongo_live_pilot';
    const adapter = gatewayRegistry.getAdapter('PayMongo');
    
    // Ensure APP_BASE_URL is set, fallback to localhost for dev
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    
    const checkoutReq = {
      bookingId: booking.id,
      amount: booking.estimated_total_amount,
      currency: 'PHP',
      renterEmail: user.email,
      renterName: user.name,
      description: `Payment for ${booking.listing.title}`,
      successUrl: `${baseUrl}/dashboard/renter/bookings/${booking.id}?checkout=success`,
      cancelUrl: `${baseUrl}/checkout/${booking.id}?checkout=cancel`,
      metadata: { mode: isLivePilot ? 'Live Pilot' : 'Sandbox' }
    };

    let response;
    let activationError = false;

    try {
      response = await adapter.createCheckoutSession(checkoutReq);
    } catch (e: any) {
      const msg = e.message || '';
      
      if (msg.includes('No payment methods') || msg.includes('404')) {
        await prisma.gatewayTransaction.update({
          where: { id: transaction.id },
          data: { gateway_status: 'Blocked by Provider Activation', raw_event_summary: msg }
        });
        activationError = true;
      } else {
        await prisma.gatewayTransaction.update({
          where: { id: transaction.id },
          data: { gateway_status: 'Error', raw_event_summary: msg }
        });
        throw e;
      }
    }

    if (activationError) {
      redirect(`/checkout/${booking.id}?error=provider_activation_pending`);
    }

    if (!response) {
      throw new Error("Failed to initialize checkout session");
    }

    await prisma.gatewayTransaction.update({
      where: { id: transaction.id },
      data: { 
        gateway_reference: response.gatewayReference,
        gateway_checkout_url: response.checkoutUrl,
        gateway_status: response.status
      }
    });

    // Redirect to PayMongo Hosted Checkout
    redirect(response.checkoutUrl);
  }

  throw new Error("Invalid payment mode");
}
