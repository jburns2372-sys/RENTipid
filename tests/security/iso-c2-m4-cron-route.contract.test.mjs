import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../../src/app/api/cron/backup-freshness/route.ts';

const SECRET = 'test-cron-secret-1234567890abcdef';
const TOKEN = 'ghp_testdispatchtoken1234567890abcdef';

function mockRequest(method = 'GET', authHeader) {
  const headers = new Headers();
  if (authHeader) {
    headers.set('authorization', authHeader);
  }
  return new Request('https://www.rentipid.com.ph/api/cron/backup-freshness', {
    method,
    headers,
  });
}

test('cron route rejects requests without authorization header', async () => {
  process.env.CRON_SECRET = SECRET;
  const req = mockRequest('GET');
  const res = await GET(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, 'UNAUTHORIZED');
});

test('cron route rejects invalid bearer token', async () => {
  process.env.CRON_SECRET = SECRET;
  const req = mockRequest('GET', 'Bearer wrong-secret');
  const res = await GET(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, 'UNAUTHORIZED');
});

test('cron route returns 500 if GITHUB_DISPATCH_TOKEN is missing', async () => {
  process.env.CRON_SECRET = SECRET;
  delete process.env.GITHUB_DISPATCH_TOKEN;
  delete process.env.GITHUB_TOKEN;
  const req = mockRequest('GET', `Bearer ${SECRET}`);
  const res = await GET(req);
  assert.equal(res.status, 500);
  const data = await res.json();
  assert.equal(data.error, 'DISPATCH_CONFIG_MISSING');
});

test('cron route successfully dispatches workflow with correct payload and headers', async () => {
  process.env.CRON_SECRET = SECRET;
  process.env.GITHUB_DISPATCH_TOKEN = TOKEN;
  process.env.GITHUB_REPOSITORY = 'jburns2372-sys/RENTipid';

  let capturedUrl = null;
  let capturedOptions = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return new Response(null, { status: 204 });
  };

  try {
    const req = mockRequest('GET', `Bearer ${SECRET}`);
    const res = await GET(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'DISPATCHED');
    assert.equal(data.trigger_source, 'vercel_cron');
    assert.equal(data.ref, 'main');
    assert.equal(data.workflow, 'backup-freshness-monitor.yml');

    assert.equal(capturedUrl, 'https://api.github.com/repos/jburns2372-sys/RENTipid/actions/workflows/backup-freshness-monitor.yml/dispatches');
    assert.equal(capturedOptions.method, 'POST');
    assert.equal(capturedOptions.headers.Authorization, `Bearer ${TOKEN}`);
    const body = JSON.parse(capturedOptions.body);
    assert.equal(body.ref, 'main');
    assert.equal(body.inputs.trigger_source, 'vercel_cron');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cron route POST method behaves identically to GET', async () => {
  process.env.CRON_SECRET = SECRET;
  process.env.GITHUB_DISPATCH_TOKEN = TOKEN;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });

  try {
    const req = mockRequest('POST', `Bearer ${SECRET}`);
    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'DISPATCHED');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cron route handles GitHub API 502 response safely', async () => {
  process.env.CRON_SECRET = SECRET;
  process.env.GITHUB_DISPATCH_TOKEN = TOKEN;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('Internal Server Error', { status: 500 });

  try {
    const req = mockRequest('GET', `Bearer ${SECRET}`);
    const res = await GET(req);
    assert.equal(res.status, 502);
    const data = await res.json();
    assert.equal(data.error, 'GITHUB_DISPATCH_FAILED');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
