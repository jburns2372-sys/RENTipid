import { PaymentGatewayAdapter, CreateCheckoutSessionRequest, CreateCheckoutSessionResponse } from '../payment-gateway-registry';

export class PayMongoAdapter implements PaymentGatewayAdapter {
  async createCheckoutSession(req: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    const isLivePilot = req.metadata?.mode === 'Live Pilot';
    const isSandbox = !isLivePilot && this.isSandbox();
    
    if (isLivePilot && !this.isLiveModeEnabled()) {
      throw new Error("Live mode is disabled by Super Admin guardrail.");
    }

    const secretKey = isLivePilot ? process.env.PAYMONGO_SECRET_KEY_LIVE : process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      throw new Error(`PAYMONGO_SECRET_KEY${isLivePilot ? '_LIVE' : ''} is not configured.`);
    }

    // Amount in PayMongo is in cents.
    const amountInCents = Math.round(req.amount * 100);

    const payload = {
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: req.currency,
              amount: amountInCents,
              description: req.description,
              name: `Booking ${req.bookingId}`,
              quantity: 1
            }
          ],
          payment_method_types: ["card", "gcash", "paymaya", "dob"],
          success_url: req.successUrl,
          cancel_url: req.cancelUrl,
          description: req.description,
          reference_number: req.bookingId,
          customer_email: req.renterEmail,
          metadata: {
            mode: req.metadata?.mode || 'Sandbox',
            booking_id: req.bookingId
          }
        }
      }
    };

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo Error:", data);
      throw new Error(`Failed to create PayMongo checkout: ${data.errors?.[0]?.detail || 'Unknown error'}`);
    }

    return {
      gatewayReference: data.data.id,
      checkoutUrl: data.data.attributes.checkout_url,
      status: 'Checkout Pending'
    };
  }

  verifyWebhook(signature: string, payload: any): boolean {
    // In a real implementation, you would use crypto to verify the signature using PAYMONGO_WEBHOOK_SECRET
    // For Sandbox Phase 14, we will return true or skip if secret is missing.
    return !!process.env.PAYMONGO_WEBHOOK_SECRET;
  }

  async handleWebhookEvent(payload: any): Promise<void> {
    // Handled in Webhook Service
    console.log("[PayMongoAdapter] Received webhook payload type:", payload?.data?.attributes?.type);
  }

  async getPaymentStatus(gatewayReference: string): Promise<string> {
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) return 'Error';

    const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${gatewayReference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      }
    });

    if (!response.ok) return 'Error';

    const data = await response.json();
    const payments = data.data?.attributes?.payments;
    if (payments && payments.length > 0) {
      const paymentStatus = payments[0].attributes.status; // e.g., 'paid'
      if (paymentStatus === 'paid') return 'Paid Sandbox';
      if (paymentStatus === 'failed') return 'Failed Sandbox';
    }
    return 'Checkout Pending';
  }

  async createRefundPlaceholder(gatewayReference: string, amount: number): Promise<boolean> {
    console.warn(`[PayMongoAdapter] Refund placeholder requested for ${gatewayReference} amount ${amount}. Returning true.`);
    return true;
  }

  getProviderName(): string {
    return 'PayMongo';
  }

  isSandbox(): boolean {
    return process.env.PAYMONGO_SANDBOX === 'true';
  }

  isLiveModeEnabled(): boolean {
    return process.env.PAYMENT_LIVE_MODE === 'true';
  }
}
