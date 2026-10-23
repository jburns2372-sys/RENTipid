import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtempSync,readFileSync,readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { SumsubKycProviderAdapter } from '../../src/lib/global-market/trust/adapters/sumsub-kyc-adapter';
import { SandboxKycExecutionStore } from '../../src/lib/global-market/trust/services/sandbox-kyc-execution-store';
import { applicantId,kycConfig,kycInput,signEvent } from './fixtures/sumsub-kyc-data';
const state = () => join(mkdtempSync(join(tmpdir(),'rentipid-sumsub-test-')),'.rentipid-sandbox','sumsub-kyc-sandbox.sqlite');
function worker(action:string,path:string,counter:string):Record<string,any> {
  const child = spawnSync(process.execPath,['--import','tsx','tests/global-market/fixtures/sumsub-kyc-restart.ts',action,path,counter],{ cwd:process.cwd(),encoding:'utf8',timeout:30000 });
  assert.equal(child.status,0,child.stderr); return JSON.parse(child.stdout.trim());
}
test('Sumsub sandbox safety (mocked HTTP, real dedicated SQLite)',async t => {
  const originalFetch = globalThis.fetch;
  try {
    await t.test('missing/live/invalid configuration, authority and wrong country fail closed',async () => {
      let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('unexpected live request'); };
      const cfg = kycConfig(state());
      for (const changes of [{ appToken:'' },{ secretKey:'' },{ webhookSecret:'' },{ appToken:'production-token' },{ environment:'production' as const },
        { webhookSecret:cfg.secretKey },{ statePath:join(tmpdir(),'production.sqlite') },{ tenantId:'' },{ authorizeAccountOperation:undefined },{ baseUrl:'https://evil.example' },{ levels:{} }]) {
        const adapter = new SumsubKycProviderAdapter({ ...cfg,...changes });
        assert.equal(adapter.isConfigured,false); assert.equal(adapter.verifyWebhook('data','a'.repeat(64)),false);
        await assert.rejects(adapter.createVerification(kycInput()),/NOT_CONFIGURED/);
        assert.equal((await adapter.handleWebhook('{}',{})).handled,false);
      }
      const denied = new SumsubKycProviderAdapter({ ...cfg,authorizeAccountOperation:async () => false });
      await assert.rejects(denied.createVerification(kycInput()),/UNAUTHORIZED/); denied.close();
      const configured = new SumsubKycProviderAdapter(cfg);
      for (const country of ['PH','US','ZZ','th']) await assert.rejects(configured.createVerification(kycInput(country)),/JURISDICTION/);
      await assert.rejects(configured.createVerification({ ...kycInput(),accountId:'private@example.com' }),/OPAQUE/);
      assert.equal(configured.getEnvironmentStatus(),'SANDBOX_CONFIGURED'); assert.equal(calls,0); configured.close();
    });
    await t.test('signed applicant/session/status transport, individual/company binding and original-jurisdiction reverify',async () => {
      for (const country of ['TH','SG','MY','VN','ID']) for (const subject of ['INDIVIDUAL','BUSINESS'] as const) {
        const cfg = kycConfig(state()); const adapter = new SumsubKycProviderAdapter(cfg); let alias = ''; let posts = 0;
        globalThis.fetch = async (url,init) => {
          const parsed = new URL(String(url)); assert.equal(parsed.hostname,'api.sumsub.com'); assert.equal(init?.redirect,'error'); assert.ok(init?.signal);
          const headers = init!.headers as Record<string,string>;
          const expected = crypto.createHmac('sha256',cfg.secretKey!).update(headers['X-App-Access-Ts'] + init!.method + parsed.pathname + parsed.search).update(init!.body ? Buffer.from(init!.body as any):Buffer.alloc(0)).digest('hex');
          assert.equal(headers['X-App-Access-Sig'],expected); assert.equal(headers['X-App-Token'],'sbx:testonly');
          if (parsed.pathname === '/resources/applicants') {
            posts++; const body = JSON.parse(String(init!.body)); alias = body.externalUserId; assert.ok(alias.startsWith('rentipid_sbx_')); assert.ok(!alias.includes('account-testonly'));
            assert.deepEqual(Object.keys(body).sort(),['externalUserId','type']); assert.equal(body.type,subject === 'BUSINESS' ? 'company':'individual');
            return new Response(JSON.stringify({ id:applicantId,...body,review:{ reviewStatus:'init' } }));
          }
          if (parsed.pathname === '/resources/accessTokens/sdk') {
            const body = JSON.parse(String(init!.body)); assert.equal(body.userId,alias); assert.equal(body.ttlInSecs,600);
            return new Response(JSON.stringify({ token:'_act-private-sdk-token',userId:alias }));
          }
          return new Response(JSON.stringify({ levelName:subject === 'BUSINESS' ? 'sandbox-business':'sandbox-individual',reviewStatus:'onHold' }));
        };
        try {
          const created = await adapter.createVerification(kycInput(country,subject)); assert.equal(created.verificationId,applicantId);
          assert.equal((await adapter.createVerification(kycInput(country,subject))).verificationId,applicantId); assert.equal(posts,1);
          await assert.rejects(adapter.createVerificationSession(applicantId,'other-account'),/BINDING/);
          const session = await adapter.createVerificationSession(applicantId,'account-testonly'); assert.equal(session.sessionToken,'_act-private-sdk-token');
          assert.equal((await adapter.checkStatus(applicantId)).status,'UNDER_REVIEW');
          assert.equal((await adapter.reverify('account-testonly')).status,'UNDER_REVIEW'); assert.equal(posts,1);
          assert.equal(await adapter.cancelVerification(applicantId),false);
          assert.equal(adapter.executionStore!.get(applicantId)!.jurisdictionCode,country);
          assert.ok(!JSON.stringify(adapter).includes('secret'));
          adapter.close(); const bytes = readFileSync(cfg.statePath!); assert.ok(!bytes.includes(Buffer.from('_act-private-sdk-token')));
        } finally { adapter.close(); }
      }
    });
    await t.test('raw signatures, binding, normalized manual/AML/PEP/rejection and delayed/duplicate reconciliation',async () => {
      const adapter = new SumsubKycProviderAdapter(kycConfig(state())); let alias = ''; let reads = 0;
      let review:any = { reviewStatus:'completed',reviewResult:{ reviewAnswer:'GREEN' },reviewDate:'2026-10-08 10:00:00+0000' };
      globalThis.fetch = async (_url,init) => {
        if (init?.method === 'POST') { const body = JSON.parse(String(init.body)); alias = body.externalUserId; return new Response(JSON.stringify({ id:applicantId,...body })); }
        reads++; return new Response(JSON.stringify({ levelName:'sandbox-individual',...review }));
      };
      try {
        await adapter.createVerification(kycInput());
        const event = { applicantId,externalUserId:alias,type:'applicantReviewed',correlationId:'approval-event',createdAtMs:'1791453600000',reviewStatus:'completed',reviewResult:{ reviewAnswer:'GREEN' } };
        const signed = signEvent(event);
        assert.equal(adapter.verifyWebhook(signed.raw,signed.headers['X-Payload-Digest']),true);
        assert.equal(adapter.verifyWebhook(signed.raw,signed.headers['X-Payload-Digest'],'attacker-secret'),false);
        for (const [raw,headers] of [[event,signed.headers],[signed.raw,{ ...signed.headers,'X-Payload-Digest':'bad' }],[Buffer.from('{}'),signed.headers],
          [signed.raw,{ ...signed.headers,'X-Payload-Digest-Alg':'HMAC_SHA1_HEX' }],[signed.raw,{ ...signed.headers,'x-payload-digest':signed.headers['X-Payload-Digest'] }]] as any[]) assert.equal((await adapter.handleWebhook(raw,headers)).handled,false);
        for (const changes of [{ externalUserId:'wrong' },{ applicantId:'bbbbbbbbbbbbbbbbbbbbbbbb' },{ testMode:true },{ correlationId:'',createdAtMs:'' }]) {
          const wrong = signEvent({ ...event,...changes }); assert.equal((await adapter.handleWebhook(wrong.raw,wrong.headers)).handled,false);
        }
        assert.equal(reads,0);
        assert.equal((await adapter.handleWebhook(signed.raw,signed.headers)).verificationResult?.status,'APPROVED');
        review = { reviewStatus:'completed',reviewResult:{ reviewAnswer:'RED',reviewRejectType:'FINAL',moderationComment:'PII-name-address',rejectLabels:['PEP','SANCTIONS','FORGERY'] } };
        const stale = signEvent({ ...event,correlationId:'delayed-old-green' },'sha512');
        const rejected = await adapter.handleWebhook(stale.raw,stale.headers); assert.equal(rejected.verificationResult?.status,'REJECTED');
        assert.deepEqual(rejected.verificationResult?.flags,['AML_SCREENING_FLAG','PEP_MATCH','DOCUMENT_FORGERY_DETECTED']);
        assert.ok(!JSON.stringify(rejected).includes('PII-name-address'));
        const duplicate = await adapter.handleWebhook(signed.raw,signed.headers); assert.equal(duplicate.eventType,'DUPLICATE_EVENT_IGNORED');
        assert.equal(duplicate.verificationResult?.status,'REJECTED'); assert.equal(reads,2);
        const conflict = signEvent({ ...event,reviewResult:{ reviewAnswer:'RED' } }); assert.equal((await adapter.handleWebhook(conflict.raw,conflict.headers)).handled,false);
        for (const [state,result,expected] of [['init',{},'DOCUMENTS_REQUIRED'],['pending',{},'UNDER_REVIEW'],['onHold',{},'UNDER_REVIEW'],['awaitingUser',{},'IN_PROGRESS'],
          ['completed',{ reviewAnswer:'RED',reviewRejectType:'RETRY' },'DOCUMENTS_REQUIRED'],['completed',{ reviewAnswer:'GREEN',rejectLabels:['PEP'] },'UNDER_REVIEW']] as const) {
          assert.equal(adapter.normalizeResult({ applicantId,reviewStatus:state,reviewResult:result }).status,expected);
        }
        assert.throws(() => adapter.normalizeResult({ applicantId,reviewStatus:'future-status' }),/UNKNOWN/);
        await assert.rejects(adapter.reverify('account-testonly'),/AUTHORIZED_PROVIDER_RESET/);
        const binding = adapter.executionStore!.get(applicantId)!; const newer = { ...binding.result,status:'UNDER_REVIEW' as const };
        adapter.executionStore!.observe(binding,newer); assert.throws(() => adapter.executionStore!.observe(binding,{ ...newer,status:'APPROVED' }),/STATE_OR_AUTHORITY/);
      } finally { adapter.close(); }
    });
    await t.test('secure account-owned multipart document upload is signed and durably deduplicated without evidence persistence',async () => {
      const path = state(); let uploads = 0; const evidence = Buffer.from('private-document-evidence-testonly');
      const adapter = new SumsubKycProviderAdapter({ ...kycConfig(path),resolveDocument:async (account,ref) => account === 'account-testonly' && ref === 'private-owned-ref' ?
        { bytes:evidence,mimeType:'image/png',category:'NATIONAL_ID',country:'THA',idDocType:'ID_CARD' }:null });
      globalThis.fetch = async (url,init) => {
        const parsed = new URL(String(url)); const headers = init!.headers as Record<string,string>;
        const body = init!.body ? Buffer.from(init!.body as any):Buffer.alloc(0);
        assert.equal(headers['X-App-Access-Sig'],crypto.createHmac('sha256','testonly-api-secret').update(headers['X-App-Access-Ts'] + init!.method + parsed.pathname + parsed.search).update(body).digest('hex'));
        if (parsed.pathname.endsWith('/info/idDoc')) { uploads++; assert.ok(body.includes(evidence)); assert.ok(headers['Content-Type'].startsWith('multipart/form-data; boundary=')); return new Response(JSON.stringify({ country:'THA',idDocType:'ID_CARD' })); }
        if (init?.method === 'POST') return new Response(JSON.stringify({ id:applicantId,...JSON.parse(body.toString()) }));
        return new Response(JSON.stringify({ levelName:'sandbox-individual',reviewStatus:'init' }));
      };
      try {
        await adapter.createVerification(kycInput()); const input = { verificationId:applicantId,accountId:'account-testonly',documents:[{ category:'NATIONAL_ID' as const,fileUrl:'private-owned-ref',mimeType:'image/png' }] };
        assert.equal((await adapter.submitDocuments(input)).status,'DOCUMENTS_REQUIRED'); await adapter.submitDocuments(input); assert.equal(uploads,1);
        await assert.rejects(adapter.submitDocuments({ ...input,documents:[{ ...input.documents[0],fileUrl:'https://169.254.169.254/credentials' }] }),/AUTHORITY/);
      } finally { adapter.close(); }
      for (const file of readdirSync(dirname(path))) { const bytes = readFileSync(join(dirname(path),file)); for (const secret of [evidence.toString(),'testonly-api-secret','testonly-webhook-secret','private-owned-ref']) assert.ok(!bytes.includes(Buffer.from(secret))); }
    });
    await t.test('concurrent reservations, tenant isolation and failed reconciliation do not consume webhook retries',async () => {
      const path = state(); const first = new SandboxKycExecutionStore(path,'tenant-testonly'); const second = new SandboxKycExecutionStore(path,'tenant-testonly');
      let release!:()=>void; let calls = 0; const wait = new Promise<void>(resolve => release = resolve);
      try {
        const started = first.runOperation('create-concurrent','same-fingerprint',async () => { calls++; await wait; return { safe:true }; });
        await assert.rejects(second.runOperation('create-concurrent','same-fingerprint',async () => { calls++; return {}; }),/RECONCILIATION/);
        await assert.rejects(second.runOperation('create-concurrent','changed-fingerprint',async () => ({})),/CONFLICT/);
        release(); await started; assert.deepEqual(await second.runOperation('create-concurrent','same-fingerprint',async () => { calls++; return {}; }),{ safe:true }); assert.equal(calls,1);
        assert.throws(() => new SandboxKycExecutionStore(path,'another-tenant'),/TENANT_MISMATCH/);
      } finally { first.close(); second.close(); }
      const adapter = new SumsubKycProviderAdapter(kycConfig(path)); let alias = ''; let failed = true;
      globalThis.fetch = async (_url,init) => {
        if (init?.method === 'POST') { const body = JSON.parse(String(init.body)); alias = body.externalUserId; return new Response(JSON.stringify({ id:applicantId,...body })); }
        if (failed) throw new Error('private-name-and-api-key');
        return new Response(JSON.stringify({ levelName:'sandbox-individual',reviewStatus:'pending' }));
      };
      try {
        await adapter.createVerification(kycInput()); const event = signEvent({ applicantId,externalUserId:alias,type:'applicantPending',correlationId:'retry-after-api-failure' });
        const failure = await adapter.handleWebhook(event.raw,event.headers); assert.equal(failure.handled,false); assert.ok(!JSON.stringify(failure).includes('private-name'));
        failed = false; assert.equal((await adapter.handleWebhook(event.raw,event.headers)).verificationResult?.status,'UNDER_REVIEW');
        assert.equal((await adapter.handleWebhook(event.raw,event.headers)).eventType,'DUPLICATE_EVENT_IGNORED');
      } finally { adapter.close(); }
    });
    await t.test('actual process restarts preserve applicant idempotency and replay latest state rather than old approval',() => {
      const path = state(); const counter = join(dirname(dirname(path)),'calls.txt');
      assert.equal(worker('create',path,counter).status,'DOCUMENTS_REQUIRED'); assert.equal(worker('create',path,counter).status,'DOCUMENTS_REQUIRED');
      assert.equal(worker('approve',path,counter).status,'APPROVED'); assert.equal(worker('approve',path,counter).eventType,'DUPLICATE_EVENT_IGNORED');
      assert.equal(worker('reject',path,counter).status,'REJECTED'); const replay = worker('approve',path,counter);
      assert.equal(replay.status,'REJECTED'); assert.equal(replay.eventType,'DUPLICATE_EVENT_IGNORED');
      const calls = readFileSync(counter,'utf8'); assert.equal(calls.match(/POST/g)?.length,1); assert.equal(calls.match(/GET/g)?.length,2);
      const ambiguous = state(); const counter2 = join(dirname(dirname(ambiguous)),'calls.txt');
      assert.equal(worker('ambiguous',ambiguous,counter2).error,'SUMSUB_TRANSPORT_FAILURE'); assert.match(worker('create',ambiguous,counter2).error,/RECONCILIATION_REQUIRED/);
      assert.equal(readFileSync(counter2,'utf8').match(/POST/g)?.length,1);
    });
  } finally { globalThis.fetch = originalFetch; }
});
