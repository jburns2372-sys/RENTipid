import { MockPaymentAdapter } from './adapters/mock-payment-adapter';
import { PayMongoAdapter } from './adapters/paymongo-adapter';

export interface CreateCheckoutSessionRequest {
  bookingId: string;
  amount: number;
  currency: string;
  renterEmail: string;
  renterName: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionResponse {
  gatewayReference: string;
  checkoutUrl: string;
  status: string;
}

export interface PaymentGatewayAdapter {
  createCheckoutSession(req: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse>;
  verifyWebhook(signature: string, payload: any): boolean;
  handleWebhookEvent(payload: any): Promise<void>;
  getPaymentStatus(gatewayReference: string): Promise<string>;
  createRefundPlaceholder(gatewayReference: string, amount: number): Promise<boolean>;
  getProviderName(): string;
  isSandbox(): boolean;
  isLiveModeEnabled(): boolean;
}

class PaymentGatewayRegistry {
  private adapters: Map<string, PaymentGatewayAdapter> = new Map();

  register(providerName: string, adapter: PaymentGatewayAdapter) {
    this.adapters.set(providerName.toLowerCase(), adapter);
  }

  getAdapter(providerName: string): PaymentGatewayAdapter {
    const adapter = this.adapters.get(providerName.toLowerCase());
    if (!adapter) {
      throw new Error(`Payment Gateway Adapter for '${providerName}' not found.`);
    }
    return adapter;
  }
}

export const gatewayRegistry = new PaymentGatewayRegistry();

// Auto-register default adapters
gatewayRegistry.register('Mock', new MockPaymentAdapter());
gatewayRegistry.register('PayMongo', new PayMongoAdapter());
