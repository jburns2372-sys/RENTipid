/**
 * RENTipid GLOBAL-MKT / v2.0 — Financial Provider Registry
 *
 * Manages registered payment and payout provider adapters.
 * Strictly maintains evidence-based provider readiness.
 */

import { type PaymentProviderAdapter } from '../contracts/payment-provider';
import { type PayoutProviderAdapter } from '../contracts/payout-provider';
import { PayMongoGlobalAdapter } from '../adapters/paymongo-global-adapter';
import { XenditPaymentProviderAdapter } from '../adapters/xendit-payment-adapter';
import { XenditPayoutProviderAdapter } from '../adapters/xendit-payout-adapter';
import { MockPaymentProviderAdapter } from '../adapters/mock-payment-provider-adapter';
import { MockPayoutProviderAdapter } from '../adapters/mock-payout-provider-adapter';
import { MANNYPAY_PROVIDER_ID, MANNYPAY_STATUS } from '../adapters/mannypay-boundary';

class GlobalFinancialProviderRegistry {
  private paymentAdapters = new Map<string, PaymentProviderAdapter>();
  private payoutAdapters = new Map<string, PayoutProviderAdapter>();

  constructor() {
    // Register verified / partial production adapters
    this.registerPaymentAdapter(new PayMongoGlobalAdapter());
    this.registerPaymentAdapter(new XenditPaymentProviderAdapter());

    // Register payout adapters
    this.registerPayoutAdapter(new XenditPayoutProviderAdapter());

    // Register test adapters (clearly identified as MOCK)
    this.registerPaymentAdapter(new MockPaymentProviderAdapter());
    this.registerPayoutAdapter(new MockPayoutProviderAdapter('mock_payout_rail', 'Mock Payout Rail (TEST ONLY)'));
    this.registerPayoutAdapter(new MockPayoutProviderAdapter('manual_ph_bank', 'Manual Philippine Bank Settlement (TEST ONLY)'));
  }

  registerPaymentAdapter(adapter: PaymentProviderAdapter) {
    this.paymentAdapters.set(adapter.providerId.toLowerCase(), adapter);
  }

  registerPayoutAdapter(adapter: PayoutProviderAdapter) {
    this.payoutAdapters.set(adapter.providerId.toLowerCase(), adapter);
  }

  getPaymentAdapter(providerId: string): PaymentProviderAdapter | null {
    if (providerId.toLowerCase() === MANNYPAY_PROVIDER_ID) {
      // MannyPay boundary: not registered as live adapter
      return null;
    }
    return this.paymentAdapters.get(providerId.toLowerCase()) || null;
  }

  getPayoutAdapter(providerId: string): PayoutProviderAdapter | null {
    return this.payoutAdapters.get(providerId.toLowerCase()) || null;
  }

  getAllPaymentAdapters(): readonly PaymentProviderAdapter[] {
    return Array.from(this.paymentAdapters.values());
  }

  getAllPayoutAdapters(): readonly PayoutProviderAdapter[] {
    return Array.from(this.payoutAdapters.values());
  }
}

export const financialProviderRegistry = new GlobalFinancialProviderRegistry();
