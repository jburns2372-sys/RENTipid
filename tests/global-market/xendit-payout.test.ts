import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { XenditPayoutProviderAdapter } from '../../src/lib/global-market/financial/adapters/xendit-payout-adapter';
import { SandboxPayoutExecutionStore } from '../../src/lib/global-market/financial/services/sandbox-payout-execution-store';
import { financialProviderRegistry } from '../../src/lib/global-market/financial/registry/payment-provider-registry';
import { createPayoutInstruction,processPayoutWebhook,reconcilePayoutWithProvider } from '../../src/lib/global-market/financial/services/payout-orchestrator';
import { resolveJurisdictionPayoutProfile,AUTHORITATIVE_PAYOUT_PROFILE_COUNT } from '../../src/lib/global-market/financial/registry/jurisdiction-payout-registry';
import type { CreatePayoutInput } from '../../src/lib/global-market/financial/contracts/payout-provider';
import { createDamageClaim } from '../../src/lib/global-market/post-transaction/services/claim-engine';
import { openDispute } from '../../src/lib/global-market/post-transaction/services/dispute-engine';
import { payoutRequest,payoutConfig,payoutAuthority,payoutBeneficiary,providerPayout } from './fixtures/xendit-payout-data';

const state = () => join(mkdtempSync(join(tmpdir(),'rentipid-xendit-payout-test-')),'.rentipid-sandbox','xendit-payout-sandbox.sqlite');
const headers = { 'x-callback-token':'payout_testonly_callback' };
const directInput = (id:string):CreatePayoutInput => ({ payoutId:`payout-${id}`,bookingId:id,providerId:'owner',jurisdictionCode:'TH',
  amountMinorUnits:50000,currency:'THB',beneficiaryReference:'beneficiary-owner',description:'Test',idempotencyKey:`key-${id}` });
function worker(action:string,path:string,id:string,counter:string):Record<string,any> {
  const child = spawnSync(process.execPath,['--import','tsx','tests/global-market/fixtures/xendit-payout-restart.ts',action,path,id,counter],{ cwd:process.cwd(),encoding:'utf8',timeout:30000 });
  assert.equal(child.status,0,child.stderr); return JSON.parse(child.stdout.trim());
}
test('Xendit payout safety (mocked HTTP; separate sandbox SQLite)',async t => {
  const originalFetch = globalThis.fetch;
  try {
    await t.test('configuration, live credentials, unavailable authority and readiness fail closed',async () => {
      let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('unexpected live HTTP'); };
      const cfg = payoutConfig(state());
      for (const changes of [{ secretKey:'' },{ webhookToken:'' },{ businessId:'' },{ environment:'production' as const },{ secretKey:'xnd_production_live' },
        { baseUrl:'https://evil.example' },{ statePath:'' },{ statePath:join(tmpdir(),'production.sqlite') },{ resolveBeneficiary:undefined },{ resolvePayoutAuthority:undefined },{ webhookToken:cfg.secretKey }]) {
        const adapter = new XenditPayoutProviderAdapter({ ...cfg,...changes });
        assert.equal(adapter.isConfigured,false); assert.equal(adapter.verifyWebhookSignature({},'',headers),false);
        await assert.rejects(adapter.createPayout({ payoutId:'payout',bookingId:'booking',providerId:'owner',jurisdictionCode:'TH',amountMinorUnits:50000,currency:'THB',
          beneficiaryReference:'beneficiary-owner',description:'Test',idempotencyKey:'key' }),/NOT_CONFIGURED/);
      }
      const configured = new XenditPayoutProviderAdapter(cfg);
      assert.equal(configured.verificationStatus,'VALIDATION_REQUIRED'); assert.equal(configured.getEnvironmentStatus(),'SANDBOX_CONFIGURED');
      assert.equal(configured.capabilities.includes('CANCEL'),false); assert.equal(calls,0);
    });
    await t.test('actual v3 transport, registry/orchestrator and settlement units across five countries',async () => {
      for (const [country,currency] of [['TH','THB'],['SG','SGD'],['MY','MYR'],['VN','VND'],['ID','IDR']]) {
        const adapter = new XenditPayoutProviderAdapter(payoutConfig(state(),country,currency)); financialProviderRegistry.registerPayoutAdapter(adapter);
        let data:Record<string,any> = {}; let posts = 0;
        globalThis.fetch = async (url,init) => {
          assert.equal(new URL(String(url)).hostname,'api.xendit.co'); assert.equal(init?.redirect,'error'); assert.ok(init?.signal);
          const sent = init?.headers as Record<string,string>;
          assert.equal(sent['api-version'],'2025-09-01');
          if (init?.method === 'POST') {
            posts++; assert.equal(new URL(String(url)).pathname,'/v3/payouts'); assert.equal(sent['idempotency-key'].length,64);
            const body = JSON.parse(String(init.body)); assert.equal(body.payout_details.destination_currency,currency);
            assert.equal(body.payout_details.source_currency,currency); assert.equal(body.payout_details.destination_amount,currency === 'IDR' ? 500:50000);
            data = providerPayout(body);
          } else assert.equal(new URL(String(url)).pathname,'/v3/payouts/po-testonly');
          return new Response(JSON.stringify(data),{ status:200 });
        };
        try {
          const request = payoutRequest(`transport-${country}`,country,currency);
          const created = await createPayoutInstruction(request); assert.equal(created.payoutInstruction?.providerReference,'po-testonly');
          assert.equal(created.payoutInstruction?.normalizedStatus,'PENDING'); assert.equal(created.payoutInstruction?.settlementCurrency,currency);
          assert.equal((await createPayoutInstruction({ ...request,idempotencyKey:'new-client-key' })).isIdempotentReplay,true);
          const status = await adapter.retrievePayoutStatus('po-testonly'); assert.equal(status.amountMinorUnits,50000);
          assert.equal((await reconcilePayoutWithProvider(created.payoutInstruction!.id)).matched,true); assert.equal(posts,1);
          assert.equal(resolveJurisdictionPayoutProfile(country)!.payoutStatus,'NOT_CONFIGURED');
        } finally { adapter.close(); }
      }
    });
    await t.test('payout, webhook receipts, duplicate and stale events survive fresh processes',() => {
      const path = state(); const counter = join(path,'..','..','calls.txt');
      const success = worker('success',path,'restart-payout',counter); assert.equal(success.payoutInstruction.normalizedStatus,'SUCCEEDED');
      const duplicate = worker('success',path,'restart-payout',counter); assert.equal(duplicate.isDuplicateReplay,true);
      assert.equal(duplicate.payoutInstruction.id,success.payoutInstruction.id);
      assert.equal(worker('new-key',path,'restart-payout',counter).isIdempotentReplay,true);
      assert.equal(worker('stale',path,'restart-payout',counter).outOfOrderIgnored,true);
      assert.equal(worker('stale',path,'restart-payout',counter).isDuplicateReplay,true);
      assert.equal(worker('reverse',path,'restart-payout',counter).payoutInstruction.normalizedStatus,'REVERSED');
      assert.equal(worker('success',path,'restart-payout',counter).payoutInstruction.normalizedStatus,'REVERSED');
      assert.match(worker('held',path,'restart-payout',counter).error,/HELD/);
      assert.equal(readFileSync(counter,'utf8'),'POST\n');
      const bytes = readFileSync(path).toString('utf8');
      for (const privateValue of ['xnd_development_payout_testonly','payout_testonly_callback','Private Beneficiary','123456789012']) assert.equal(bytes.includes(privateValue),false);
    });
    await t.test('ambiguous create cannot issue another payout after restart or new key',() => {
      const path = state(); const counter = join(path,'..','..','calls.txt');
      assert.equal(worker('ambiguous',path,'ambiguous-payout',counter).error,'XENDIT_PAYOUT_TRANSPORT_FAILURE');
      assert.match(worker('retry',path,'ambiguous-payout',counter).error,/RECONCILIATION_REQUIRED/);
      assert.match(worker('new-key',path,'ambiguous-payout',counter).error,/RECONCILIATION_REQUIRED/);
      assert.equal(readFileSync(counter,'utf8'),'POST\n');
    });
    await t.test('concurrent durable booking reservation and cross-booking key conflict',async () => {
      const path = state(); const a = new SandboxPayoutExecutionStore(path); const b = new SandboxPayoutExecutionStore(path);
      let finish!:(value:any)=>void; let calls = 0;
      try {
        const inflight = a.runCreate('booking','key','facts',async () => { calls++; return new Promise(resolve => { finish = resolve; }); });
        await assert.rejects(b.runCreate('booking','other-key','facts',async () => { calls++; return { providerReference:'bad',initialStatus:'PENDING' }; }),/RECONCILIATION_REQUIRED/);
        await assert.rejects(b.runCreate('other-booking','key','facts',async () => ({ providerReference:'bad',initialStatus:'PENDING' })),/CONFLICT/);
        finish({ providerReference:'po-testonly',initialStatus:'PENDING' }); await inflight;
        assert.equal((await b.runCreate('booking','third-key','facts',async () => ({ providerReference:'bad',initialStatus:'PENDING' }))).providerReference,'po-testonly');
        await assert.rejects(b.runCreate('booking','key','changed',async () => ({ providerReference:'bad',initialStatus:'PENDING' })),/CONFLICT/);
        assert.equal(calls,1);
      } finally { a.close(); b.close(); }
    });
    await t.test('beneficiary, settlement, payment binding and eligibility cannot be tampered or replay-bypassed',async () => {
      const adapter = new XenditPayoutProviderAdapter(payoutConfig(state())); financialProviderRegistry.registerPayoutAdapter(adapter);
      let posts = 0; globalThis.fetch = async (_url,init) => { posts++; return new Response(JSON.stringify(providerPayout(JSON.parse(String(init?.body)))),{ status:200 }); };
      try {
        const request = payoutRequest('authority-guards'); await createPayoutInstruction(request);
        for (const bad of [{ ...request,clientSubmittedBeneficiary:'foreign-account' },{ ...request,clientSubmittedAmount:1 },{ ...request,clientSubmittedCurrency:'SGD' },
          { ...request,providerKycApproved:false },{ ...request,hasOpenDispute:true },{ ...request,hasOpenClaim:true },{ ...request,holdReason:'held' },
          { ...request,paymentRecord:{ ...request.paymentRecord,bookingId:'foreign' } },{ ...request,eligibleContext:{ ...request.eligibleContext,payoutAmountMinorUnits:1 } },
          { ...request,booking:{ ...request.booking,status:'CONFIRMED' as const } }]) await assert.rejects(createPayoutInstruction(bad));
        assert.equal(posts,1);
      } finally { adapter.close(); }
    });
    await t.test('active claims/disputes in authoritative marketplace engines hold payout',async () => {
      const adapter = new XenditPayoutProviderAdapter(payoutConfig(state())); financialProviderRegistry.registerPayoutAdapter(adapter);
      globalThis.fetch = async () => { throw new Error('held payout must not dispatch'); };
      try {
        const claimRequest = payoutRequest('claim-hold');
        const claim = await createDamageClaim({ booking:claimRequest.booking,claimantUserId:'renter',category:'DAMAGE',description:'Test claim',claimedAmountMinorUnits:1,idempotencyKey:'claim-test' });
        assert.equal(claim.success,true); await assert.rejects(createPayoutInstruction(claimRequest),/HOLD/);
        const disputeRequest = payoutRequest('dispute-hold');
        const dispute = await openDispute({ booking:disputeRequest.booking,openedByUserId:'renter',origin:'BOOKING_DISAGREEMENT',summary:'Test dispute',idempotencyKey:'dispute-test' });
        assert.equal(dispute.success,true); await assert.rejects(createPayoutInstruction(disputeRequest),/HOLD/);
      } finally { adapter.close(); }
    });
    await t.test('fresh server authority holds, unavailable authority and beneficiary ownership block transport',async () => {
      for (const flag of ['hasActiveClaim','hasActiveDispute','isHeld','paymentReconciled','providerKycApproved','bookingCompleted']) {
        const cfg = payoutConfig(state()); const adapter = new XenditPayoutProviderAdapter({ ...cfg,resolvePayoutAuthority:async id => ({ ...payoutAuthority(id),[flag]:['hasActiveClaim','hasActiveDispute','isHeld'].includes(flag) }) });
        financialProviderRegistry.registerPayoutAdapter(adapter);
        try { await assert.rejects(createPayoutInstruction(payoutRequest(`fresh-hold-${flag}`)),/HELD/); } finally { adapter.close(); }
      }
      const cfg = payoutConfig(state()); const adapter = new XenditPayoutProviderAdapter({ ...cfg,resolveBeneficiary:async () => ({ ...payoutBeneficiary(),providerId:'foreign' }) });
      financialProviderRegistry.registerPayoutAdapter(adapter);
      try { await assert.rejects(createPayoutInstruction(payoutRequest('foreign-beneficiary')),/BENEFICIARY/); } finally { adapter.close(); }
    });
    await t.test('webhook signature, business, beneficiary, amount, duplicate ID and reversal ordering',async () => {
      const adapter = new XenditPayoutProviderAdapter(payoutConfig(state())); financialProviderRegistry.registerPayoutAdapter(adapter);
      let data:Record<string,any> = {};
      globalThis.fetch = async (_url,init) => { if (init?.method === 'POST') data = providerPayout(JSON.parse(String(init.body))); return new Response(JSON.stringify(data),{ status:200 }); };
      try {
        const request = payoutRequest('webhook-payout'); const created = await createPayoutInstruction(request);
        const payload = { event_id:'same-event',event:'v3_payout.succeeded',business_id:'payouttestbusiness',data:{ ...data,status:'SUCCEEDED' } };
        assert.equal((await processPayoutWebhook('xendit_payout',payload,'',{ 'x-callback-token':'wrong' })).success,false);
        assert.equal(adapter.verifyWebhookSignature(payload,'',{ ...headers,'X-Callback-Token':'payout_testonly_callback' }),false);
        assert.equal((await processPayoutWebhook('xendit_payout',{ ...payload,business_id:'foreign' },'',headers)).success,false);
        for (const changed of [{ destination_amount:1 },{ destination_currency:'SGD' },{ recipient:{ ...data.recipient,account_details:{ ...data.recipient.account_details,account_number:'99999999' } } },{ status:'MADE_UP' }]) {
          assert.equal((await processPayoutWebhook('xendit_payout',{ ...payload,data:{ ...payload.data,...changed } },'',headers)).success,false);
        }
        assert.equal((await processPayoutWebhook('xendit_payout',payload,'',headers)).payoutInstruction?.normalizedStatus,'SUCCEEDED');
        assert.equal((await processPayoutWebhook('xendit_payout',{ ...payload,created:'2099-01-01' },'',headers)).isDuplicateReplay,true);
        assert.match((await processPayoutWebhook('xendit_payout',{ ...payload,event:'v3_payout.reversed',data:{ ...payload.data,status:'REVERSED' } },'',headers)).error!,/CONFLICT/);
        data = { ...data,status:'SUCCEEDED' }; assert.equal((await reconcilePayoutWithProvider(created.payoutInstruction!.id)).matched,true);
        const current = adapter.executionStore!.getById(created.payoutInstruction!.id)!;
        adapter.executionStore!.replace({ ...current,reconciliationStatus:'PENDING' },current);
        assert.throws(() => adapter.executionStore!.replace(current,current),/STATE_CONFLICT/);
      } finally { adapter.close(); }
      const reverseAdapter = new XenditPayoutProviderAdapter(payoutConfig(state())); financialProviderRegistry.registerPayoutAdapter(reverseAdapter);
      try {
        await createPayoutInstruction(payoutRequest('reversed-first'));
        assert.equal((await processPayoutWebhook('xendit_payout',{ event:'v3_payout.reversed',business_id:'payouttestbusiness',data:{ ...data,status:'REVERSED' } },'',headers)).payoutInstruction?.normalizedStatus,'REVERSED');
        assert.equal((await processPayoutWebhook('xendit_payout',{ event:'v3_payout.succeeded',business_id:'payouttestbusiness',data:{ ...data,status:'SUCCEEDED' } },'',headers)).outOfOrderIgnored,true);
      } finally { reverseAdapter.close(); }
    });
    await t.test('HTTP and malformed responses fail closed without repeat dispatch',async () => {
      for (const failure of ['unauthorized','invalid-json','wrong-money','wrong-currency','wrong-account','unknown-status']) {
        const cfg = payoutConfig(state()); let calls = 0;
        const adapter = new XenditPayoutProviderAdapter(cfg);
        globalThis.fetch = async (_url,init) => {
          calls++;
          if (failure === 'unauthorized') return new Response('private provider error',{ status:401 });
          if (failure === 'invalid-json') return new Response('private provider error',{ status:200 });
          const data = providerPayout(JSON.parse(String(init?.body)));
          if (failure === 'wrong-money') data.destination_amount = 1;
          if (failure === 'wrong-currency') data.destination_currency = 'SGD';
          if (failure === 'wrong-account') data.recipient.account_details.account_number = 'foreign';
          if (failure === 'unknown-status') data.status = 'MADE_UP';
          return new Response(JSON.stringify(data),{ status:200 });
        };
        await assert.rejects(adapter.createPayout(directInput(failure)));
        adapter.close();
        const retry = new XenditPayoutProviderAdapter(cfg);
        try { await assert.rejects(retry.createPayout(directInput(failure)),/RECONCILIATION_REQUIRED/); }
        finally { retry.close(); }
        assert.equal(calls,1);
      }
    });
    await t.test('fresh authority change before dispatch, unavailable authority and fractional IDR are blocked',async () => {
      let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('unexpected payout'); };
      const cfg = payoutConfig(state()); let authorityReads = 0;
      const changing = new XenditPayoutProviderAdapter({ ...cfg,resolvePayoutAuthority:async id => ({ ...payoutAuthority(id),hasActiveDispute:++authorityReads > 1 }) });
      try { await assert.rejects(changing.createPayout(directInput('late-hold')),/HELD/); } finally { changing.close(); }
      const unavailable = new XenditPayoutProviderAdapter({ ...payoutConfig(state()),resolvePayoutAuthority:async () => { throw new Error('private backend details'); } });
      try { await assert.rejects(unavailable.createPayout(directInput('unavailable')),/^Error: PAYOUT_AUTHORITY_UNAVAILABLE$/); } finally { unavailable.close(); }
      const idr = new XenditPayoutProviderAdapter({ ...payoutConfig(state(),'ID','IDR'),resolvePayoutAuthority:async id => ({ ...payoutAuthority(id,'ID','IDR'),amountMinorUnits:125 }) });
      try {
        await assert.rejects(idr.createPayout({ ...directInput('fractional-idr'),jurisdictionCode:'ID',currency:'IDR',amountMinorUnits:125 }),/UNREPRESENTABLE/);
        await assert.rejects(idr.createPayout({ ...directInput('wrong-country'),jurisdictionCode:'PH',currency:'PHP' }),/CURRENCY_MISMATCH/);
        await assert.rejects(idr.createPayout({ ...directInput('unsafe-amount'),amountMinorUnits:Number.MAX_SAFE_INTEGER + 1 }),/INVALID/);
      } finally { idr.close(); }
      assert.equal(calls,0);
    });
    await t.test('PH approved local payout route remains separate and operational in test mode',async () => {
      const previous = process.env.NODE_ENV; process.env.NODE_ENV = 'test';
      globalThis.fetch = async () => { throw new Error('local PH test must not invoke HTTP'); };
      try {
        const request = payoutRequest('ph-local-regression','PH','PHP');
        const result = await createPayoutInstruction({ ...request,paymentRecord:{ ...request.paymentRecord,paymentProviderId:'paymongo' } });
        assert.equal(result.payoutInstruction?.payoutProviderId,'manual_ph_bank');
        assert.equal((await reconcilePayoutWithProvider(result.payoutInstruction!.id)).matched,true);
      } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
    });
    await t.test('wrong country/currency and alternate-provider routing never fall back; denominator remains 46',async () => {
      let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('unexpected HTTP'); };
      financialProviderRegistry.registerPayoutAdapter(new XenditPayoutProviderAdapter());
      for (const [country,currency] of [['TH','THB'],['SG','SGD'],['MY','MYR'],['VN','VND'],['ID','IDR']]) {
        assert.deepEqual(resolveJurisdictionPayoutProfile(country)!.approvedProviderIds,['xendit_payout']);
        for (const provider of ['manual_ph_bank','mock_payout_rail','paymongo','mannypay']) await assert.rejects(createPayoutInstruction({ ...payoutRequest(`route-${country}-${provider}`,country,currency),payoutProviderId:provider }),/PROVIDER_MISMATCH/);
        await assert.rejects(createPayoutInstruction(payoutRequest(`route-${country}`,country,currency)),/NOT_CONFIGURED/);
      }
      assert.equal(AUTHORITATIVE_PAYOUT_PROFILE_COUNT,46); assert.ok(resolveJurisdictionPayoutProfile('PH')!.approvedProviderIds.includes('manual_ph_bank')); assert.equal(calls,0);
    });
  } finally { globalThis.fetch = originalFetch; }
});
