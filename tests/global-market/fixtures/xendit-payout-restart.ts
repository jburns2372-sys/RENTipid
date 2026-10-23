import { appendFileSync } from 'node:fs';
import { XenditPayoutProviderAdapter } from '../../../src/lib/global-market/financial/adapters/xendit-payout-adapter';
import { financialProviderRegistry } from '../../../src/lib/global-market/financial/registry/payment-provider-registry';
import { createPayoutInstruction,processPayoutWebhook,reconcilePayoutWithProvider } from '../../../src/lib/global-market/financial/services/payout-orchestrator';
import { payoutRequest,payoutConfig,payoutAuthority,payoutBeneficiary,providerPayout } from './xendit-payout-data';

async function main() {
  const [action,statePath,bookingId,counter] = process.argv.slice(2);
  const config = payoutConfig(statePath);
  const adapter = new XenditPayoutProviderAdapter({ ...config,resolvePayoutAuthority:async id => ({ ...payoutAuthority(id),hasActiveClaim:action === 'held' }) });
  financialProviderRegistry.registerPayoutAdapter(adapter);
  globalThis.fetch = async (_url,init) => {
    appendFileSync(counter,`${init?.method}\n`);
    if (action === 'ambiguous') throw new Error('private credentials must not escape');
    if (init?.method === 'GET') {
      const saved = adapter.executionStore!.getOperationByReference('po-testonly') as unknown as Record<string,unknown>;
      return new Response(JSON.stringify({ payout_id:'po-testonly',reference_id:saved.referenceId,business_id:'payouttestbusiness',status:'SUCCEEDED',recipient:payoutBeneficiary().recipient,
        source_currency:'THB',destination_currency:'THB',source_amount:50000,destination_amount:50000 }),{ status:200 });
    }
    return new Response(JSON.stringify(providerPayout(JSON.parse(String(init?.body)))),{ status:200 });
  };
  try {
    const request = payoutRequest(bookingId);
    const result = await createPayoutInstruction(action === 'new-key' ? { ...request,idempotencyKey:'different-key' } : request);
    if (['success','reverse','stale','conflict'].includes(action)) {
      const saved = adapter.executionStore!.getOperationByReference('po-testonly') as unknown as Record<string,unknown>;
      const status = action === 'reverse' ? 'REVERSED' : action === 'stale' ? 'PENDING_COMPLIANCE_ASSESSMENT':'SUCCEEDED';
      const event = action === 'reverse' ? 'v3_payout.reversed':action === 'stale' ? 'v3_payout.pending_compliance':'v3_payout.succeeded';
      const data = { payout_id:'po-testonly',reference_id:saved.referenceId,business_id:'payouttestbusiness',status,recipient:payoutBeneficiary().recipient,
        source_currency:'THB',destination_currency:'THB',source_amount:50000,destination_amount:50000 };
      console.log(JSON.stringify(await processPayoutWebhook('xendit_payout',{ event,business_id:'payouttestbusiness',created:new Date().toISOString(),data },'',{ 'x-callback-token':'payout_testonly_callback' })));
    } else if (action === 'reconcile') console.log(JSON.stringify(await reconcilePayoutWithProvider(result.payoutInstruction!.id)));
    else console.log(JSON.stringify(result));
  } catch (error) { console.log(JSON.stringify({ error:error instanceof Error ? error.message:'FAILED' })); }
  finally { adapter.close(); }
}
void main();
