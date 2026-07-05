import { PaymentGatewayAdapter, CreateCheckoutSessionRequest, CreateCheckoutSessionResponse } from '../payment-gateway-registry';

export class MockPaymentAdapter implements PaymentGatewayAdapter {
  async createCheckoutSession(req: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    return {
      gatewayReference: `mock_ref_${Date.now()}`,
      checkoutUrl: `${req.successUrl}?mock_ref=mock_ref_${Date.now()}`,
      status: 'Paid Sandbox' // Fast track to paid for mock
    };
  }

  verifyWebhook(signature: string, payload: any): boolean {
    return true; // Mock always verifies
  }

  async handleWebhookEvent(payload: any): Promise<void> {
    console.log("[MockPaymentAdapter] Webhook event received:", payload);
  }

  async getPaymentStatus(gatewayReference: string): Promise<string> {
    return 'Paid Sandbox';
  }

  async createRefundPlaceholder(gatewayReference: string, amount: number): Promise<boolean> {
    return true;
  }

  getProviderName(): string {
    return 'Mock';
  }

  isSandbox(): boolean {
    return true;
  }

  isLiveModeEnabled(): boolean {
    return false;
  }
}
