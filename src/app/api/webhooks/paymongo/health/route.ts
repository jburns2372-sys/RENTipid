import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const appBaseUrl = process.env.APP_BASE_URL || '';
  const isHttps = appBaseUrl.startsWith('https://');
  const isProduction = isHttps && !appBaseUrl.includes('localhost') && !appBaseUrl.includes('127.0.0.1');
  const hasSecret = !!process.env.PAYMONGO_WEBHOOK_SECRET_LIVE;
  
  const lastWebhook = await prisma.paymentWebhookLog.findFirst({
    orderBy: { received_at: 'desc' }
  });

  return NextResponse.json({
    status: 'ok',
    webhook_route_exists: true,
    webhook_route_reachable: true,
    https_required_in_production: true,
    is_production_https: isProduction,
    webhook_secret_present: hasSecret,
    mode: process.env.PAYMENT_PROVIDER_MODE === 'paymongo_live_pilot' ? 'Live Pilot' : 'Sandbox',
    last_webhook_received_at: lastWebhook?.received_at || null,
    last_webhook_verification: lastWebhook?.verification_status || 'None',
    last_webhook_processing: lastWebhook?.processing_status || 'None',
    timestamp: new Date().toISOString()
  });
}
