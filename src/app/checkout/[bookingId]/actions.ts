/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { gatewayRegistry } from '../../../lib/payments/payment-gateway-registry';
import { redirect } from 'next/navigation';
import { resolvePaymentContractCurrency } from '../../../lib/payments/payment-currency-policy';

import { validateCheckoutRequestId, deriveCheckoutIdempotencyKey } from './checkout-helpers';
const prisma = new PrismaClient();


export async function processCheckout(formData: FormData) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) throw new Error("Unauthorized");

  const bookingId = formData.get('booking_id') as string;
  const paymentMode = formData.get('payment_mode') as string;
  const rawIdempotencyKey = formData.get('checkout_request_id');

  const idempotencyKey = validateCheckoutRequestId(rawIdempotencyKey);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true }
  });

  if (!booking || booking.renter_id !== user.id) throw new Error("Invalid booking");
  if (booking.status !== 'Approved' || booking.payment_status !== 'Pending Payment') throw new Error("Booking not ready for payment");

  let serverScopedIdempotencyKey: string;

  if (paymentMode === 'paymongo_live_pilot') {
    const pilotPaymentMethod = formData.get('pilot_payment_method') as string;
    if (pilotPaymentMethod !== 'gcash' && pilotPaymentMethod !== 'card') {
      throw new Error("Only standard GCash or standard credit cards are permitted for the live pilot.");
    }

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

    const pilotMaxAmount = parseFloat(s['PILOT_MAX_AMOUNT'] || '100');
    
    const appBaseUrl = process.env.APP_BASE_URL || '';
    const isHttps = appBaseUrl.startsWith('https://') && !appBaseUrl.includes('localhost') && !appBaseUrl.includes('127.0.0.1') && !appBaseUrl.includes('0.0.0.0');

    // P19-004: Hard limit of 5 total pilot transactions, max 100 PHP each
    if (booking.estimated_total_amount > 100) {
      throw new Error("Live pilot transaction amount exceeds 100 PHP limit.");
    }

    const livePilotTxnCount = await prisma.gatewayTransaction.count({
      where: { provider_mode: 'Live Pilot' }
    });
    if (livePilotTxnCount >= 5) {
      throw new Error("Live pilot transaction limit reached (max 5).");
    }

    // Derive server-scoped idempotency digest early for authoritative telemetry tracking
    serverScopedIdempotencyKey = deriveCheckoutIdempotencyKey(user.id, booking.id, idempotencyKey);

    if (s['PAYMENT_EMERGENCY_FREEZE'] === 'true') {
      type CheckoutTransactionResult = {
        kind: 'PAYMENT_FREEZE_BLOCKED';
        paymentActionLogId: string;
      };

      let freezeResult: CheckoutTransactionResult | null = null;

      try {
        freezeResult = await prisma.$transaction(async (tx) => {
          const { recordPaymentFreezeBlockedAction } = await import('../../../lib/payments/payment-action-log-writer');
          const log = await recordPaymentFreezeBlockedAction(tx, { id: booking.id }, user.id, serverScopedIdempotencyKey!);
          return {
            kind: 'PAYMENT_FREEZE_BLOCKED' as const,
            paymentActionLogId: log.id
          };
        });
      } catch (error: any) {
        if (error.code !== 'P2002') {
          throw error;
        }
        // P2002 implies duplicate immutable record; handled gracefully by allowing the redirect
        const existingLog = await prisma.paymentActionLog.findUnique({
          where: { idempotency_key: serverScopedIdempotencyKey }
        });
        if (existingLog) {
          freezeResult = {
            kind: 'PAYMENT_FREEZE_BLOCKED' as const,
            paymentActionLogId: existingLog.id
          };
        }
      }

      if (freezeResult?.kind === 'PAYMENT_FREEZE_BLOCKED') {
        const _handoffTarget = freezeResult.paymentActionLogId;
        
        try {
          const { processSecurityEvent } = await import('../../../lib/security/events/event-ingestion');
          const logRecord = await prisma.paymentActionLog.findUnique({
            where: { id: _handoffTarget }
          });
          if (logRecord) {
            processSecurityEvent(logRecord).catch(() => {});
          }
        } catch {
          // best-effort, suppress failure
        }
        
        return redirect(`/checkout/${booking.id}?error=frozen`);
      }
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
  } else {
    // For non-paymongo_live_pilot modes, we still need idempotency key
    serverScopedIdempotencyKey = deriveCheckoutIdempotencyKey(user.id, booking.id, idempotencyKey);
  }

  let transaction;
  let isNewTransaction = false;

  try {
    transaction = await prisma.$transaction(async (tx) => {
      const existing = await tx.gatewayTransaction.findUnique({
        where: { idempotency_key: serverScopedIdempotencyKey }
      });

      if (existing) {
        if (existing.booking_id !== booking.id) throw new Error("Cross-scope idempotency collision rejected");
        return existing;
      }

      isNewTransaction = true;
      const newTx = await tx.gatewayTransaction.create({
        data: {
          booking_id: booking.id,
          idempotency_key: serverScopedIdempotencyKey,
          provider: paymentMode.startsWith('paymongo') ? 'PayMongo' : 'Mock',
          provider_mode: paymentMode === 'paymongo_live_pilot' ? 'Live Pilot' : 'Sandbox',
          gateway_status: 'Created',
          amount: booking.estimated_total_amount,
          currency: resolvePaymentContractCurrency(),
          verification_status: 'Not Verified',
          reconciliation_status: 'Pending'
        }
      });

      const { recordPaymentInitializedAction } = await import('../../../lib/payments/payment-action-log-writer');
      
      await recordPaymentInitializedAction(
        tx,
        { id: newTx.id, amount: newTx.amount, currency: newTx.currency },
        { id: booking.id },
        user.id,
        serverScopedIdempotencyKey
      );

      return newTx;
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const existing = await prisma.gatewayTransaction.findUnique({
        where: { idempotency_key: serverScopedIdempotencyKey }
      });
      if (!existing) throw new Error("Concurrency resolution failed");
      if (existing.booking_id !== booking.id) throw new Error("Cross-scope idempotency collision rejected");
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
      currency: resolvePaymentContractCurrency(),
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

        if (
          msg.includes('500') || msg.includes('502') || msg.includes('503') || 
          msg.includes('504') || msg.includes('5xx') || msg.toLowerCase().includes('timeout')
        ) {
          await prisma.systemSetting.updateMany({
            where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' },
            data: { setting_value: 'true' }
          });
        }

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
    return redirect(response.checkoutUrl);
  }

  throw new Error("Invalid payment mode");
}
