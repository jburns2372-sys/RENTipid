import { appendFileSync } from 'node:fs';
import { XenditPaymentProviderAdapter } from '../../../src/lib/global-market/financial/adapters/xendit-payment-adapter';
import { financialProviderRegistry } from '../../../src/lib/global-market/financial/registry/payment-provider-registry';
import { initiatePaymentAttempt, processPaymentWebhook } from '../../../src/lib/global-market/financial/services/payment-orchestrator';

async function main() {
  const [action, statePath, key, counter] = process.argv.slice(2);
  const adapter = new XenditPaymentProviderAdapter({ environment: 'sandbox', secretKey: 'xnd_development_testonly',
    webhookToken: 'testonly_callback', businessId: 'testbusiness', statePath });
  financialProviderRegistry.registerPaymentAdapter(adapter);
  let data: Record<string, unknown> = {};
  globalThis.fetch = async (_url, init) => {
    appendFileSync(counter, 'POST\n');
    if (action === 'ambiguous') throw new Error('sensitive transport error');
    const body = JSON.parse(String(init?.body));
    data = { ...body, business_id: 'testbusiness', payment_session_id: 'ps-testrestart', status: 'ACTIVE', payment_link_url: 'https://xen.to/testonly' };
    return new Response(JSON.stringify(data), { status: 200 });
  };
  try {
    const result = await initiatePaymentAttempt({ requestingPayerId: 'payer', idempotencyKey: key,
      successUrl: 'https://example.com/success', cancelUrl: 'https://example.com/cancel', payerEmail: 'private@example.com', payerName: 'Private Name',
      payableContext: { bookingId: key, bookingReference: key, payerId: 'payer', payeeProviderId: 'owner', jurisdictionCode: 'TH',
        authoritativeAmountMinorUnits: 12345, depositAmountMinorUnits: 0, deliveryFeeMinorUnits: 0, sourceListingCurrency: 'THB',
        requiredTransactionCurrency: 'THB', paymentStateRequirement: 'FULL_PREPAYMENT', idempotencyReference: key, paymentStatus: 'UNPAID' } });
    if (action === 'complete' || action === 'duplicate' || action === 'stale') {
      const saved = adapter.executionStore!.getOperationByReference<Record<string, unknown>>('ps-testrestart')!;
      const expired = action === 'stale';
      const webhook = { event: expired ? 'payment_session.expired' : 'payment_session.completed', business_id: 'testbusiness', created: new Date().toISOString(),
        data: { payment_session_id: 'ps-testrestart', session_type: 'PAY', mode: 'PAYMENT_LINK', reference_id: saved.referenceId, currency: 'THB', country: 'TH', amount: 123.45,
          status: expired ? 'EXPIRED' : 'COMPLETED', payment_id: expired ? undefined : 'py-testonly' } };
      console.log(JSON.stringify(await processPaymentWebhook('xendit', webhook, '', { 'x-callback-token': 'testonly_callback' })));
    } else console.log(JSON.stringify(result));
  } catch (error) { console.log(JSON.stringify({ error: error instanceof Error ? error.message : 'FAILED' })); }
  finally { adapter.close(); }
}
void main();
