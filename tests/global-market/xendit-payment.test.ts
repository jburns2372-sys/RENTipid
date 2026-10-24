import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { XenditPaymentProviderAdapter, type XenditConfig } from '../../src/lib/global-market/financial/adapters/xendit-payment-adapter';
import { SandboxPaymentExecutionStore } from '../../src/lib/global-market/financial/services/sandbox-payment-execution-store';
import { financialProviderRegistry } from '../../src/lib/global-market/financial/registry/payment-provider-registry';
import { initiatePaymentAttempt, processPaymentWebhook, reconcilePaymentWithProvider } from '../../src/lib/global-market/financial/services/payment-orchestrator';
import { resolveJurisdictionPaymentProfile } from '../../src/lib/global-market/financial/registry/jurisdiction-payment-registry';
import type { CreatePaymentSessionInput } from '../../src/lib/global-market/financial/contracts/payment-provider';

const state = () => join(mkdtempSync(join(tmpdir(), 'rentipid-xendit-test-')), '.rentipid-sandbox', 'xendit-payment-sandbox.sqlite');
const config = (statePath = state()): XenditConfig => ({ environment: 'sandbox', secretKey: 'xnd_development_testonly', webhookToken: 'testonly_callback', businessId: 'testbusiness', statePath });
const input = (key: string, country = 'TH', currency = 'THB'): CreatePaymentSessionInput => ({ jurisdictionCode: country,
  bookingId: key, bookingReference: key, amountMinorUnits: 12345, currency, payerEmail: 'private@example.com', payerName: 'Private Name',
  description: 'Test booking', successUrl: 'https://example.com/success', cancelUrl: 'https://example.com/cancel', idempotencyKey: key });
const request = (key: string, country = 'TH', currency = 'THB', providerId?: string) => ({ requestingPayerId: 'payer', idempotencyKey: key, providerId,
  successUrl: 'https://example.com/success', cancelUrl: 'https://example.com/cancel', payerEmail: 'private@example.com', payerName: 'Private Name',
  payableContext: { bookingId: key, bookingReference: key, payerId: 'payer', payeeProviderId: 'owner', jurisdictionCode: country,
    authoritativeAmountMinorUnits: 12345, depositAmountMinorUnits: 0, deliveryFeeMinorUnits: 0, sourceListingCurrency: currency,
    requiredTransactionCurrency: currency, paymentStateRequirement: 'FULL_PREPAYMENT' as const, idempotencyReference: key, paymentStatus: 'UNPAID' } });
const fixture = join(process.cwd(), 'tests/global-market/fixtures/xendit-payment-restart.ts');
function worker(action: string, path: string, key: string, counter: string) {
  const child = spawnSync(process.execPath, ['--import', 'tsx', fixture, action, path, key, counter], { cwd: process.cwd(), encoding: 'utf8', timeout: 30000 });
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout.trim()) as Record<string, any>;
}

test('Xendit payment execution safety (mocked HTTP only)', async t => {
  const originalFetch = globalThis.fetch;
  try {
    await t.test('sandbox config, live key, API host and durable-path fail closed; no false verification', async () => {
      let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('unexpected HTTP'); };
      const valid = config();
      for (const change of [{ secretKey: '' }, { webhookToken: '' }, { secretKey: 'xnd_production_live' }, { environment: 'production' as const },
        { businessId: '' }, { statePath: '' }, { statePath: join(tmpdir(), 'production.sqlite') }, { baseUrl: 'https://evil.example' },
        { baseUrl: 'https://api.xendit.co@evil.example' }, { webhookToken: valid.secretKey }]) {
        const adapter = new XenditPaymentProviderAdapter({ ...valid, ...change });
        assert.equal(adapter.isConfigured, false);
        await assert.rejects(adapter.createPaymentSession(input('blocked')), /NOT_CONFIGURED/);
        assert.equal(adapter.verifyWebhookSignature({}, '', { 'x-callback-token': 'testonly_callback' }), false);
      }
      const adapter = new XenditPaymentProviderAdapter(valid);
      assert.equal(adapter.verificationStatus, 'VALIDATION_REQUIRED');
      assert.equal(adapter.getEnvironmentStatus(), 'SANDBOX_CONFIGURED');
      assert.equal(existsSync(valid.statePath!), false, 'constructor is side-effect free');
      assert.equal(calls, 0);
    });
    await t.test('actual POST/GET/cancel contract; integer money; all five country/currency pairs', async () => {
      const adapter = new XenditPaymentProviderAdapter(config());
      let data: Record<string, any> = {}; let calls = 0;
      globalThis.fetch = async (url, init) => {
        calls++;
        assert.equal(init?.redirect, 'error'); assert.ok(init?.signal);
        assert.equal((init?.headers as Record<string, string>).Authorization, `Basic ${Buffer.from('xnd_development_testonly:').toString('base64')}`);
        assert.equal(new URL(String(url)).hostname, 'api.xendit.co');
        if (String(url).endsWith('/sessions')) {
          assert.equal(init?.method, 'POST');
          const body = JSON.parse(String(init?.body));
          assert.equal(body.session_type, 'PAY'); assert.equal(body.capture_method, 'AUTOMATIC'); assert.equal(body.mode, 'PAYMENT_LINK');
          assert.equal(body.reference_id.length, 64);
          const expected = body.currency === 'VND' ? 12345 : 123.45;
          assert.equal(body.amount, expected);
          data = { ...body, business_id: 'testbusiness', payment_session_id: `ps-${body.country}`, status: 'ACTIVE', payment_link_url: 'https://xen.to/testonly' };
        } else if (String(url).endsWith('/cancel')) { assert.equal(init?.method, 'POST'); data = { ...data, status: 'CANCELED' }; }
        else assert.equal(init?.method, 'GET');
        return new Response(JSON.stringify(data), { status: 200 });
      };
      try {
        for (const [country, currency] of [['TH', 'THB'], ['SG', 'SGD'], ['MY', 'MYR'], ['VN', 'VND'], ['ID', 'IDR']]) {
          const session = await adapter.createPaymentSession(input(`contract-${country}`, country, currency));
          assert.equal(session.providerReference, `ps-${country}`);
          assert.equal(session.rawProviderResponse, undefined);
          const status = await adapter.retrievePaymentStatus(session.providerReference);
          assert.equal(status.amountMinorUnits, 12345); assert.equal(status.currency, currency);
          assert.equal(await adapter.cancelPaymentSession!(session.providerReference), true);
          assert.equal(await adapter.cancelPaymentSession!(session.providerReference), true);
        }
        assert.equal(calls, 15, 'repeated cancellations do not issue another POST');
        assert.equal(adapter.capabilities.includes('REFUND'), false);
        assert.equal(adapter.refundPayment, undefined);
        await assert.rejects(adapter.retrievePaymentStatus('ps-unknown'), /UNKNOWN/);
      } finally { adapter.close(); }
    });
    await t.test('successful payment and webhook receipts survive independent process restarts', () => {
      const path = state(); const counter = join(path, '..', '..', 'calls.txt');
      const first = worker('complete', path, 'restart-payment', counter);
      assert.equal(first.paymentAttempt.normalizedStatus, 'SUCCEEDED');
      const replay = worker('duplicate', path, 'restart-payment', counter);
      assert.equal(replay.isDuplicateReplay, true); assert.equal(replay.paymentAttempt.id, first.paymentAttempt.id);
      const stale = worker('stale', path, 'restart-payment', counter);
      assert.equal(stale.outOfOrderIgnored, true); assert.equal(stale.paymentAttempt.normalizedStatus, 'SUCCEEDED');
      assert.equal(worker('stale', path, 'restart-payment', counter).isDuplicateReplay, true);
      assert.equal(readFileSync(counter, 'utf8'), 'POST\n');
      const bytes = readFileSync(path).toString('utf8');
      for (const secret of ['xnd_development_testonly', 'testonly_callback', 'private@example.com', 'Private Name']) assert.equal(bytes.includes(secret), false);
    });
    await t.test('ambiguous transport failure is sanitized and cannot re-POST after process restart', () => {
      const path = state(); const counter = join(path, '..', '..', 'calls.txt');
      assert.equal(worker('ambiguous', path, 'restart-ambiguous', counter).error, 'XENDIT_TRANSPORT_FAILURE');
      assert.match(worker('retry', path, 'restart-ambiguous', counter).error, /RECONCILIATION_REQUIRED/);
      assert.equal(readFileSync(counter, 'utf8'), 'POST\n');
    });
    await t.test('concurrent durable reservations, key conflicts and stale reconciliation compare-and-swap', async () => {
      const path = state(); const first = new SandboxPaymentExecutionStore(path, 'test'); const second = new SandboxPaymentExecutionStore(path, 'test');
      let finish!: (value: object) => void; let calls = 0;
      try {
        const pending = first.runOperation('create:race', 'same', async () => { calls++; return new Promise(resolve => { finish = resolve; }); });
        await assert.rejects(second.runOperation('create:race', 'same', async () => { calls++; return {}; }), /RECONCILIATION_REQUIRED/);
        finish({ providerReference: 'ps-race' }); await pending;
        assert.deepEqual(await second.runOperation('create:race', 'same', async () => { calls++; return {}; }), { providerReference: 'ps-race' });
        await assert.rejects(second.runOperation('create:race', 'different', async () => ({})), /CONFLICT/); assert.equal(calls, 1);
      } finally { first.close(); second.close(); }
    });
    await t.test('webhook token, business, amount, currency, event-ID conflict and reconciliation are fail closed', async () => {
      const adapter = new XenditPaymentProviderAdapter(config()); financialProviderRegistry.registerPaymentAdapter(adapter);
      let data: Record<string, any> = {};
      globalThis.fetch = async (_url, init) => {
        if (init?.method === 'POST') data = { ...JSON.parse(String(init.body)), business_id: 'testbusiness', payment_session_id: 'ps-webhook', status: 'ACTIVE', payment_link_url: 'https://xen.to/testonly' };
        return new Response(JSON.stringify(data), { status: 200 });
      };
      try {
        const payment = await initiatePaymentAttempt(request('webhook-safety'));
        const payload = { event_id: 'stable-event', event: 'payment_session.completed', business_id: 'testbusiness', data: { ...data, status: 'COMPLETED', payment_id: 'py-testonly' } };
        const headers = { 'x-callback-token': 'testonly_callback' };
        assert.equal((await processPaymentWebhook('xendit', payload, '', { 'x-callback-token': 'wrong' })).success, false);
        assert.equal(adapter.verifyWebhookSignature(payload, '', { ...headers, 'X-Callback-Token': 'testonly_callback' }), false);
        assert.equal((await processPaymentWebhook('xendit', { ...payload, business_id: 'wrong' }, '', headers)).success, false);
        for (const change of [{ amount: 999 }, { currency: 'SGD', country: 'SG' }, { reference_id: 'foreign' }]) {
          assert.equal((await processPaymentWebhook('xendit', { ...payload, data: { ...payload.data, ...change } }, '', headers)).success, false);
        }
        assert.equal((await processPaymentWebhook('xendit', payload, '', headers)).paymentAttempt?.normalizedStatus, 'SUCCEEDED');
        assert.equal((await processPaymentWebhook('xendit', { ...payload, created: '2099-01-01' }, '', headers)).isDuplicateReplay, true);
        assert.match((await processPaymentWebhook('xendit', { ...payload, data: { ...payload.data, payment_id: 'py-conflicting' } }, '', headers)).error!, /CONFLICT/);
        const conflict = { ...payload, event: 'payment_session.expired', data: { ...payload.data, status: 'EXPIRED' } };
        assert.match((await processPaymentWebhook('xendit', conflict, '', headers)).error!, /CONFLICT/);
        data = { ...data, status: 'COMPLETED', payment_id: 'py-testonly' };
        assert.equal((await reconcilePaymentWithProvider(payment.paymentAttempt!.id)).matched, true);
        const old = adapter.executionStore!.getAttemptById(payment.paymentAttempt!.id)!;
        adapter.executionStore!.replaceAttempt({ ...old, reconciliationStatus: 'PENDING' }, old);
        assert.throws(() => adapter.executionStore!.replaceAttempt(old, old), /STATE_CONFLICT/);
      } finally { adapter.close(); }
    });
    await t.test('HTTP/config failures and malformed provider success cannot be resubmitted', async () => {
      for (const failure of ['unauthorized', 'invalid-json', 'wrong-money', 'wrong-business', 'wrong-checkout']) {
        const cfg = config(); let calls = 0;
        const adapter = new XenditPaymentProviderAdapter(cfg);
        globalThis.fetch = async (_url, init) => {
          calls++;
          if (failure === 'unauthorized') return new Response('secret echoed by provider', { status: 401 });
          if (failure === 'invalid-json') return new Response('secret echoed by provider', { status: 200 });
          const body = JSON.parse(String(init?.body));
          return new Response(JSON.stringify({ ...body, business_id: failure === 'wrong-business' ? 'foreign' : 'testbusiness',
            payment_session_id: 'ps-malformed', status: 'ACTIVE', amount: failure === 'wrong-money' ? 1 : body.amount,
            payment_link_url: failure === 'wrong-checkout' ? 'https://evil.example' : 'https://xen.to/testonly' }), { status: 200 });
        };
        await assert.rejects(adapter.createPaymentSession(input(`http-${failure}`)));
        adapter.close();
        const retry = new XenditPaymentProviderAdapter(cfg);
        try { await assert.rejects(retry.createPaymentSession(input(`http-${failure}`)), /RECONCILIATION_REQUIRED/); }
        finally { retry.close(); }
        assert.equal(calls, 1);
      }
    });
    await t.test('TH/SG/MY/VN/ID cannot fall back; authoritative money tampering blocked; PH route unchanged', async () => {
      let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('unexpected HTTP'); };
      financialProviderRegistry.registerPaymentAdapter(new XenditPaymentProviderAdapter({ ...config(), secretKey: '' }));
      for (const [country, currency] of [['TH', 'THB'], ['SG', 'SGD'], ['MY', 'MYR'], ['VN', 'VND'], ['ID', 'IDR']]) {
        assert.deepEqual(resolveJurisdictionPaymentProfile(country)!.approvedProviderIds, ['xendit']);
        for (const provider of ['paymongo', 'mannypay', 'mock_gateway']) await assert.rejects(initiatePaymentAttempt(request(`route-${country}-${provider}`, country, currency, provider)), /PROVIDER_MISMATCH/);
        await assert.rejects(initiatePaymentAttempt(request(`route-${country}`, country, currency)), /NOT_CONFIGURED/);
      }
      assert.ok(resolveJurisdictionPaymentProfile('PH')!.approvedProviderIds.includes('paymongo'));
      await assert.rejects(initiatePaymentAttempt({ ...request('tamper'), clientSubmittedAmount: 1 }), /TAMPERING/);
      await assert.rejects(initiatePaymentAttempt({ ...request('currency-tamper'), clientSubmittedCurrency: 'SGD' }), /TAMPERING/);
      assert.equal(calls, 0);
    });
  } finally { globalThis.fetch = originalFetch; }
});
