import { NextRequest, NextResponse } from 'next/server';
import { processWebhookEvent } from '@/lib/payments/payment-webhook-service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('paymongo-signature') || '';

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventType = payload?.data?.attributes?.type;
    
    if (!eventType) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 });
    }

    // Process async to avoid timeout
    processWebhookEvent('PayMongo', eventType, payload, signature).catch((err) => {
      console.error("[PayMongo Webhook Error]:", err);
    });

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error("[PayMongo Webhook Route Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
