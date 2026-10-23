import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { POST,runtime } from '../../src/app/api/webhooks/sumsub/route';
import { SumsubKycProviderAdapter } from '../../src/lib/global-market/trust/adapters/sumsub-kyc-adapter';
import { applicantId,kycConfig,kycInput,signEvent } from './fixtures/sumsub-kyc-data';

const vars = ['SUMSUB_SANDBOX_APP_TOKEN','SUMSUB_SANDBOX_SECRET_KEY','SUMSUB_SANDBOX_WEBHOOK_SECRET','SUMSUB_ENVIRONMENT','SUMSUB_BASE_URL',
  'SUMSUB_SANDBOX_TENANT_ID','SUMSUB_SANDBOX_STATE_PATH','SUMSUB_INDIVIDUAL_LEVEL_NAME'];
const request = (raw:Buffer,headers:Record<string,string>) => new Request('http://localhost/api/webhooks/sumsub',{
  method:'POST',headers,body:new Uint8Array(raw)
});
test('Sumsub HTTP sandbox callback and environment level wiring (mocked transport)',async t => {
  const saved = Object.fromEntries(vars.map(name => [name,process.env[name]])); const originalFetch = globalThis.fetch;
  const path = join(mkdtempSync(join(tmpdir(),'rentipid-sumsub-route-')),'.rentipid-sandbox','sumsub-kyc-sandbox.sqlite');
  const cfg = kycConfig(path); let creator:SumsubKycProviderAdapter | undefined;
  try {
    process.env.SUMSUB_SANDBOX_APP_TOKEN = cfg.appToken!; process.env.SUMSUB_SANDBOX_SECRET_KEY = cfg.secretKey!;
    process.env.SUMSUB_SANDBOX_WEBHOOK_SECRET = cfg.webhookSecret!; process.env.SUMSUB_ENVIRONMENT = 'sandbox';
    process.env.SUMSUB_BASE_URL = 'https://api.sumsub.com'; process.env.SUMSUB_SANDBOX_TENANT_ID = cfg.tenantId!;
    process.env.SUMSUB_SANDBOX_STATE_PATH = path; process.env.SUMSUB_INDIVIDUAL_LEVEL_NAME = 'RENTipid-SEA-Provider-KYC';
    let alias = ''; let reads = 0; let failed = false; let level = 'RENTipid-SEA-Provider-KYC';
    let review:any = { reviewStatus:'completed',reviewResult:{ reviewAnswer:'GREEN' } };
    globalThis.fetch = async (url,init) => {
      const parsed = new URL(String(url)); assert.equal(parsed.hostname,'api.sumsub.com');
      if (parsed.pathname === '/resources/applicants') {
        assert.equal(parsed.searchParams.get('levelName'),level);
        const body = JSON.parse(String(init?.body)); alias = body.externalUserId; return new Response(JSON.stringify({ id:applicantId,...body }));
      }
      if (parsed.pathname === '/resources/accessTokens/sdk') {
        assert.equal(JSON.parse(String(init?.body)).levelName,level); return new Response(JSON.stringify({ token:'_act-testonly-session',userId:alias }));
      }
      reads++; if (failed) throw new Error('sensitive-provider-body-or-secret');
      return new Response(JSON.stringify({ levelName:level,...review }));
    };
    creator = new SumsubKycProviderAdapter({ authorizeAccountOperation:async () => true });
    await t.test('individual level resolves from env/default; account authority is not bypassed',async () => {
      assert.equal(creator!.isConfigured,true); await creator!.createVerification(kycInput());
      assert.equal(creator!.executionStore!.get(applicantId)!.levelName,'RENTipid-SEA-Provider-KYC');
      await creator!.createVerificationSession(applicantId,'account-testonly');
      const callbackOnly = new SumsubKycProviderAdapter(); assert.equal(callbackOnly.isConfigured,false); assert.equal(callbackOnly.isWebhookConfigured,true);
      await assert.rejects(callbackOnly.createVerification(kycInput()),/NOT_CONFIGURED/); callbackOnly.close();
      const otherPath = join(mkdtempSync(join(tmpdir(),'rentipid-sumsub-env-level-')),'.rentipid-sandbox','sumsub-kyc-sandbox.sqlite');
      process.env.SUMSUB_INDIVIDUAL_LEVEL_NAME = 'owner-configured-sandbox-level'; level = 'owner-configured-sandbox-level';
      const override = new SumsubKycProviderAdapter({ statePath:otherPath,authorizeAccountOperation:async () => true });
      try { await override.createVerification(kycInput()); assert.equal(override.executionStore!.get(applicantId)!.levelName,level); } finally { override.close(); }
      process.env.SUMSUB_INDIVIDUAL_LEVEL_NAME = ''; const blank = new SumsubKycProviderAdapter(); assert.equal(blank.isWebhookConfigured,false);
      delete process.env.SUMSUB_INDIVIDUAL_LEVEL_NAME; level = 'RENTipid-SEA-Provider-KYC';
      assert.equal(new SumsubKycProviderAdapter().isWebhookConfigured,true); process.env.SUMSUB_INDIVIDUAL_LEVEL_NAME = level;
      alias = creator!.executionStore!.get(applicantId)!.externalUserId;
    });
    const event = { applicantId,externalUserId:alias,type:'applicantReviewed',correlationId:'route-reviewed',createdAtMs:'2026-10-08 10:00:00.032',sandboxMode:true,reviewStatus:'completed',reviewResult:{ reviewAnswer:'GREEN' } };
    await t.test('signed sandboxMode true accepted; response contains only generic ACK; fresh connection duplicates persisted',async () => {
      assert.equal(runtime,'nodejs'); const signed = signEvent(event); const before = reads;
      const response = await POST(request(signed.raw,signed.headers)); assert.equal(response.status,200); assert.equal(response.headers.get('Cache-Control'),'no-store');
      assert.deepEqual(await response.json(),{ received:true,duplicate:false });
      const replay = await POST(request(signed.raw,signed.headers)); assert.equal(replay.status,200);
      assert.deepEqual(await replay.json(),{ received:true,duplicate:true }); assert.equal(reads,before + 1);
      assert.equal(creator!.executionStore!.get(applicantId)!.result.status,'APPROVED');
    });
    await t.test('testMode true and production events rejected; testMode false is legitimate sandbox',async () => {
      const before = reads;
      for (const changes of [{ testMode:true },{ testMode:'true' },{ sandboxMode:false },{ sandboxMode:'true' },{ sandboxMode:undefined }]) {
        const signed = signEvent({ ...event,...changes }); assert.equal((await POST(request(signed.raw,signed.headers))).status,400);
      }
      assert.equal(reads,before); const signed = signEvent({ ...event,testMode:false,correlationId:'valid-testMode-false' });
      assert.equal((await POST(request(signed.raw,signed.headers))).status,200);
    });
    await t.test('wrong raw-body digest, wrong signing secret and unsupported algorithms rejected',async () => {
      const signed = signEvent(event); const before = reads;
      for (const headers of [{ ...signed.headers,'X-Payload-Digest':'0'.repeat(64) },{ ...signed.headers,'X-Payload-Digest-Alg':'HMAC_SHA1_HEX' },
        { ...signed.headers,'X-Payload-Digest':signed.headers['X-Payload-Digest'] + ',duplicate' }]) assert.equal((await POST(request(signed.raw,headers))).status,401);
      assert.equal((await POST(request(Buffer.from('{}'),signed.headers))).status,401);
      process.env.SUMSUB_SANDBOX_WEBHOOK_SECRET = 'different-testonly-webhook-secret'; assert.equal((await POST(request(signed.raw,signed.headers))).status,401);
      process.env.SUMSUB_SANDBOX_WEBHOOK_SECRET = cfg.webhookSecret!; assert.equal(reads,before);
    });
    await t.test('same correlation distinct timestamps, delayed approval, transient retry and PII-safe response',async () => {
      review = { reviewStatus:'completed',reviewResult:{ reviewAnswer:'RED',reviewRejectType:'FINAL',moderationComment:'private-user-name' } };
      const delayed = signEvent({ ...event,createdAtMs:'2026-10-08 10:00:01.032' });
      assert.equal((await POST(request(delayed.raw,delayed.headers))).status,200); assert.equal(creator!.executionStore!.get(applicantId)!.result.status,'REJECTED');
      const approval = signEvent(event); await POST(request(approval.raw,approval.headers)); assert.equal(creator!.executionStore!.get(applicantId)!.result.status,'REJECTED');
      const retry = signEvent({ ...event,correlationId:'retry-failed-api',createdAtMs:'2026-10-08 10:00:02.032' }); failed = true;
      const failure = await POST(request(retry.raw,retry.headers)); assert.equal(failure.status,503); assert.deepEqual(await failure.json(),{ received:false,error:'SUMSUB_EVENT_NOT_RECONCILED' });
      failed = false; assert.equal((await POST(request(retry.raw,retry.headers))).status,200);
      assert.equal(creator!.getEnvironmentStatus(),'SANDBOX_CONFIGURED');
    });
    await t.test('missing secret/tenant/state, unsafe storage, unknown binding and oversized raw body fail closed',async () => {
      const signed = signEvent(event); const before = reads;
      for (const name of ['SUMSUB_SANDBOX_WEBHOOK_SECRET','SUMSUB_SANDBOX_TENANT_ID','SUMSUB_SANDBOX_STATE_PATH']) {
        const prior = process.env[name]; process.env[name] = ''; assert.equal((await POST(request(signed.raw,signed.headers))).status,503); process.env[name] = prior;
      }
      process.env.SUMSUB_SANDBOX_TENANT_ID = 'wrong-owner-namespace'; assert.equal((await POST(request(signed.raw,signed.headers))).status,503); process.env.SUMSUB_SANDBOX_TENANT_ID = cfg.tenantId!;
      const unknown = signEvent({ ...event,applicantId:'bbbbbbbbbbbbbbbbbbbbbbbb' }); assert.equal((await POST(request(unknown.raw,unknown.headers))).status,503);
      assert.equal((await POST(request(Buffer.alloc(1024*1024 + 1),signed.headers))).status,413);
      assert.equal((await POST(request(signed.raw,{ ...signed.headers,'content-length':String(1024*1024 + 1) }))).status,413);
      assert.equal(reads,before);
    });
  } finally {
    creator?.close(); globalThis.fetch = originalFetch;
    for (const name of vars) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name]; }
  }
});
