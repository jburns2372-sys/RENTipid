import { SumsubKycProviderAdapter } from '@/lib/global-market/trust/adapters/sumsub-kyc-adapter';

export const runtime = 'nodejs';
const MAX_WEBHOOK_BYTES = 1024 * 1024;
const reply = (status:number,body:Record<string,boolean | string>) => Response.json(body,{
  status,headers:{ 'Cache-Control':'no-store' }
});

/** Sandbox-only callback; exact bytes go directly to the one authoritative adapter.
 * Durable bindings/receipts live in SUMSUB_SANDBOX_STATE_PATH, shared with applicant creation.
 * Do not set up this callback on ephemeral/serverless storage or a Production tenant. */
export async function POST(request:Request):Promise<Response> {
  const adapter = new SumsubKycProviderAdapter();
  try {
    if (!adapter.isWebhookConfigured) return reply(503,{ received:false,error:'SUMSUB_SANDBOX_NOT_CONFIGURED' });
    const length = request.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_WEBHOOK_BYTES)) return reply(413,{ received:false,error:'PAYLOAD_TOO_LARGE' });
    if (!request.body) return reply(400,{ received:false,error:'EMPTY_PAYLOAD' });
    const reader = request.body.getReader(); const chunks:Buffer[] = []; let total = 0;
    try {
      while (true) {
        const { value,done } = await reader.read(); if (done) break;
        total += value.byteLength;
        if (total > MAX_WEBHOOK_BYTES) { await reader.cancel(); return reply(413,{ received:false,error:'PAYLOAD_TOO_LARGE' }); }
        chunks.push(Buffer.from(value));
      }
    } finally { reader.releaseLock(); }
    const headers:Record<string,string> = {};
    request.headers.forEach((value,key) => headers[key] = value);
    const result = await adapter.handleWebhook(Buffer.concat(chunks,total),headers);
    if (result.handled) return reply(200,{ received:true,duplicate:result.eventType === 'DUPLICATE_EVENT_IGNORED' });
    if (result.eventType === 'INVALID_SIGNATURE') return reply(401,{ received:false,error:'INVALID_SIGNATURE' });
    if (result.eventType === 'INVALID_PAYLOAD' || result.eventType === 'INVALID_EVENT_MODE') return reply(400,{ received:false,error:'INVALID_SANDBOX_EVENT' });
    // Reconciliation/storage/transient failures must remain retryable; no false 2xx ACK.
    return reply(503,{ received:false,error:'SUMSUB_EVENT_NOT_RECONCILED' });
  } catch {
    // Never echo errors, secrets, applicant IDs, review data or request bodies.
    return reply(503,{ received:false,error:'SUMSUB_EVENT_NOT_RECONCILED' });
  } finally { adapter.close(); }
}
