import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { POST as paymentPOST,runtime as paymentRuntime } from '../../src/app/api/webhooks/xendit/payment/route';
import { POST as payoutPOST,runtime as payoutRuntime } from '../../src/app/api/webhooks/xendit/payout/route';
import { XenditPaymentProviderAdapter } from '../../src/lib/global-market/financial/adapters/xendit-payment-adapter';
import { XenditPayoutProviderAdapter } from '../../src/lib/global-market/financial/adapters/xendit-payout-adapter';
import { financialProviderRegistry } from '../../src/lib/global-market/financial/registry/payment-provider-registry';
import { initiatePaymentAttempt } from '../../src/lib/global-market/financial/services/payment-orchestrator';
import { createPayoutInstruction } from '../../src/lib/global-market/financial/services/payout-orchestrator';
import { calculateAndCreateRefundInstruction,executeApprovedRefund } from '../../src/lib/global-market/post-transaction/services/refund-engine';
import { payoutBooking,payoutConfig,payoutRequest,providerPayout } from './fixtures/xendit-payout-data';

const state = (kind:string) => join(mkdtempSync(join(tmpdir(),'rentipid-xendit-http-')),'.rentipid-sandbox',`xendit-${kind}-sandbox.sqlite`);
const req = (payload:unknown,token?:string,headers:Record<string,string> = {}) => new Request('http://localhost/api/webhooks/xendit',{
  method:'POST',headers:{ 'Content-Type':'application/json',...(token ? { 'x-callback-token':token }:{}),...headers },
  body:typeof payload === 'string' ? payload:JSON.stringify(payload)
});
const paymentRequest = (id:string) => ({ requestingPayerId:'renter',idempotencyKey:id,
  successUrl:'https://example.com/success',cancelUrl:'https://example.com/cancel',
  payableContext:{ bookingId:id,bookingReference:id,payerId:'renter',payeeProviderId:'owner',jurisdictionCode:'TH',
    authoritativeAmountMinorUnits:60000,depositAmountMinorUnits:10000,deliveryFeeMinorUnits:0,sourceListingCurrency:'THB',
    requiredTransactionCurrency:'THB',paymentStateRequirement:'FULL_PREPAYMENT' as const,idempotencyReference:id,paymentStatus:'UNPAID' }
});

test('Xendit HTTP callback harness uses fixtures only; never loads .env or performs live HTTP',async t => {
  const originalFetch = globalThis.fetch;
  const oldPayment = financialProviderRegistry.getPaymentAdapter('xendit')!;
  const oldPayout = financialProviderRegistry.getPayoutAdapter('xendit_payout')!;
  const adapters:Array<XenditPaymentProviderAdapter | XenditPayoutProviderAdapter> = [];
  let paymentData:Record<string,any> = {}; let payoutData:Record<string,any> = {}; let posts = 0;
  globalThis.fetch = async (url,init) => {
    assert.equal(new URL(String(url)).hostname,'api.xendit.co');
    if (init?.method === 'POST') {
      posts++; const body = JSON.parse(String(init.body));
      if (String(url).endsWith('/sessions')) {
        paymentData = { ...body,business_id:'http-test-business',payment_session_id:`ps-http-${posts}`,status:'ACTIVE',payment_link_url:'https://xen.to/testonly' };
        return new Response(JSON.stringify(paymentData));
      }
      payoutData = providerPayout(body);
      return new Response(JSON.stringify(payoutData));
    }
    return new Response(JSON.stringify(String(url).includes('/v3/payouts') ? payoutData:paymentData));
  };
  try {
    await t.test('missing credentials, Production and alternate adapters cannot open either route',async () => {
      const before = posts;
      for (const environment of ['sandbox','production'] as const) {
        const payment = new XenditPaymentProviderAdapter({ environment,secretKey:'',webhookToken:'' });
        const payout = new XenditPayoutProviderAdapter({ environment,secretKey:'',webhookToken:'' });
        financialProviderRegistry.registerPaymentAdapter(payment); financialProviderRegistry.registerPayoutAdapter(payout);
        for (const handler of [paymentPOST,payoutPOST]) {
          const response = await handler(req({},'not-a-real-token')); assert.equal(response.status,503);
          assert.deepEqual(await response.json(),{ received:false,error:'XENDIT_SANDBOX_NOT_CONFIGURED' });
        }
      }
      financialProviderRegistry.registerPaymentAdapter({ ...oldPayment,providerId:'xendit' });
      financialProviderRegistry.registerPayoutAdapter({ ...oldPayout,providerId:'xendit_payout' });
      assert.equal((await paymentPOST(req({},'not-a-real-token'))).status,503);
      assert.equal((await payoutPOST(req({},'not-a-real-token'))).status,503);
      assert.equal(posts,before); assert.equal(paymentRuntime,'nodejs'); assert.equal(payoutRuntime,'nodejs');
    });
    await t.test('payment success/failure, bad token, bounded body, duplicate/replay and sanitization',async () => {
      const adapter = new XenditPaymentProviderAdapter({ environment:'sandbox',secretKey:'xnd_development_http_testonly',
        webhookToken:'payment_http_testonly',businessId:'http-test-business',statePath:state('payment') });
      adapters.push(adapter); financialProviderRegistry.registerPaymentAdapter(adapter);
      await initiatePaymentAttempt(paymentRequest('http-payment'));
      const event = { event_id:'payment-http-success',business_id:'http-test-business',event:'payment_session.completed',
        data:{ ...paymentData,status:'COMPLETED',payment_id:'py-http-testonly' } };
      assert.equal((await paymentPOST(req(event))).status,401);
      assert.equal((await paymentPOST(req(event,'wrong'))).status,401);
      assert.equal((await paymentPOST(req(event,'payment_http_testonly',{ 'content-length':'1048577' }))).status,413);
      assert.equal((await paymentPOST(req('x'.repeat(1048577),'payment_http_testonly'))).status,413);
      assert.equal((await paymentPOST(req('{','payment_http_testonly'))).status,400);
      const first = await paymentPOST(req(event,'payment_http_testonly')); assert.equal(first.status,200);
      assert.deepEqual(await first.json(),{ received:true,duplicate:false,outOfOrderIgnored:false });
      const before = posts;
      const duplicate = await paymentPOST(req(event,'payment_http_testonly'));
      assert.deepEqual(await duplicate.json(),{ received:true,duplicate:true,outOfOrderIgnored:false });
      const conflicting = await paymentPOST(req({ ...event,data:{ ...event.data,payment_id:'py-different' } },'payment_http_testonly'));
      assert.equal(conflicting.status,503); assert.equal(posts,before);
      assert.equal((await paymentPOST(req({ ...event,business_id:'wrong' },'payment_http_testonly'))).status,400);
      const failed = await initiatePaymentAttempt(paymentRequest('http-expired-payment'));
      const failure = await paymentPOST(req({ event_id:'payment-http-expired',event:'payment_session.expired',business_id:'http-test-business',
        data:{ ...paymentData,status:'EXPIRED' } },'payment_http_testonly'));
      assert.equal(failure.status,200); assert.equal(adapter.executionStore!.getAttemptById(failed.paymentAttempt!.id)!.normalizedStatus,'EXPIRED');
      assert.equal(adapter.executionStore!.getOperationByReference(event.data.payment_session_id) !== null,true);
    });
    await t.test('refund entitlement is bounded; unsupported captured/partial refund fails closed without transport',async () => {
      const paid = await initiatePaymentAttempt(paymentRequest('http-refund'));
      const event = { event_id:'payment-refund-success',event:'payment_session.completed',business_id:'http-test-business',
        data:{ ...paymentData,status:'COMPLETED',payment_id:'py-refund-testonly' } };
      assert.equal((await paymentPOST(req(event,'payment_http_testonly'))).status,200);
      const adapter = financialProviderRegistry.getPaymentAdapter('xendit') as XenditPaymentProviderAdapter;
      const paymentRecord = adapter.executionStore!.getAttemptById(paid.paymentAttempt!.id)!;
      const base = { booking:payoutBooking('http-refund'),paymentRecord,refundType:'FULL_CANCELLATION' as const,refundPercentage:100,
        reason:'Fixture only',requestingUserId:'renter',policyReference:'fixture-cancellation',idempotencyKey:'http-refund-instruction' };
      const excessive = await calculateAndCreateRefundInstruction({ ...base,idempotencyKey:'refund-too-large',requestedAmountMinorUnits:60001 });
      assert.equal(excessive.eligible,false); assert.match(excessive.error!,/TAMPERING/);
      const currency = await calculateAndCreateRefundInstruction({ ...base,idempotencyKey:'refund-wrong-currency',requestedCurrency:'SGD' });
      assert.equal(currency.eligible,false);
      const before = posts; const instruction = await calculateAndCreateRefundInstruction(base);
      assert.equal(instruction.eligible,true);
      const result = await executeApprovedRefund(instruction.refundInstruction!.id,'http-refund-execution');
      assert.equal(result.success,false); assert.match(result.error!,/PROVIDER_REFUND_UNSUPPORTED/);
      assert.equal(posts,before); assert.equal(result.refundInstruction.status,'APPROVED');
      const partial = await calculateAndCreateRefundInstruction({ ...base,idempotencyKey:'partial-refund',requestedAmountMinorUnits:15000 });
      assert.equal(partial.eligible,true);
      const partialResult = await executeApprovedRefund(partial.refundInstruction!.id,'partial-refund-execution');
      assert.equal(partialResult.success,false); assert.match(partialResult.error!,/PROVIDER_REFUND_UNSUPPORTED/);
      assert.equal(posts,before); assert.equal(partialResult.refundInstruction.status,'APPROVED');
    });
    await t.test('payout-only callbacks need no create authority; failure and durable duplicates remain isolated',async () => {
      const cfg = payoutConfig(state('payout'));
      const creator = new XenditPayoutProviderAdapter(cfg); adapters.push(creator); financialProviderRegistry.registerPayoutAdapter(creator);
      const request = payoutRequest('http-payout');
      await createPayoutInstruction(request); const before = posts;
      const callback = new XenditPayoutProviderAdapter({ ...cfg,resolveBeneficiary:undefined,resolvePayoutAuthority:undefined });
      adapters.push(callback); financialProviderRegistry.registerPayoutAdapter(callback);
      assert.equal(callback.isConfigured,false); assert.equal(callback.isWebhookConfigured,true);
      await assert.rejects(callback.createPayout({ payoutId:'blocked',bookingId:'blocked',providerId:'owner',jurisdictionCode:'TH',
        currency:'THB',amountMinorUnits:50000,beneficiaryReference:'beneficiary-owner',description:'Fixture',idempotencyKey:'blocked' }),/NOT_CONFIGURED/);
      const event = { event_id:'payout-http-failed',event:'v3_payout.failed',business_id:'payouttestbusiness',data:{ ...payoutData,status:'FAILED' } };
      assert.equal((await payoutPOST(req(event,'payment_http_testonly'))).status,401);
      assert.equal((await payoutPOST(req(event,'wrong'))).status,401);
      assert.equal((await payoutPOST(req('{','payout_testonly_callback'))).status,400);
      const first = await payoutPOST(req(event,'payout_testonly_callback')); assert.equal(first.status,200);
      assert.deepEqual(await first.json(),{ received:true,duplicate:false,outOfOrderIgnored:false });
      const duplicate = await payoutPOST(req(event,'payout_testonly_callback'));
      assert.deepEqual(await duplicate.json(),{ received:true,duplicate:true,outOfOrderIgnored:false });
      assert.equal(callback.executionStore!.getByBooking('http-payout')!.normalizedStatus,'FAILED'); assert.equal(posts,before);
      const conflicting = await payoutPOST(req({ ...event,event:'v3_payout.succeeded',data:{ ...event.data,status:'SUCCEEDED' } },'payout_testonly_callback'));
      assert.equal(conflicting.status,503); assert.equal(posts,before);
    });
  } finally {
    for (const adapter of adapters) adapter.close(); globalThis.fetch = originalFetch;
    financialProviderRegistry.registerPaymentAdapter(oldPayment); financialProviderRegistry.registerPayoutAdapter(oldPayout);
  }
});
