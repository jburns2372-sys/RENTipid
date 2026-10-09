import { XenditPaymentProviderAdapter } from '../adapters/xendit-payment-adapter';
import { XenditPayoutProviderAdapter } from '../adapters/xendit-payout-adapter';
import { financialProviderRegistry } from '../registry/payment-provider-registry';
import { processPaymentWebhook } from './payment-orchestrator';
import { processPayoutWebhook } from './payout-orchestrator';

const MAX_BYTES = 1024 * 1024;
const reply = (status:number,body:Record<string,boolean | string>) => Response.json(body,{ status,headers:{ 'Cache-Control':'no-store' } });

/** Existing global orchestrators own state and durable receipts. No fallback or payout initiation. */
export function xenditSandboxWebhook(kind:'payment' | 'payout') {
  return async (request:Request):Promise<Response> => {
    try {
      const adapter = kind === 'payment' ? financialProviderRegistry.getPaymentAdapter('xendit') : financialProviderRegistry.getPayoutAdapter('xendit_payout');
      const configured = kind === 'payment' ? adapter instanceof XenditPaymentProviderAdapter && adapter.isConfigured :
        adapter instanceof XenditPayoutProviderAdapter && adapter.isWebhookConfigured;
      if (!adapter || !configured) return reply(503,{ received:false,error:'XENDIT_SANDBOX_NOT_CONFIGURED' });
      const headers:Record<string,string> = {};
      request.headers.forEach((value,key) => headers[key] = value);
      // Xendit authenticates these products with x-callback-token, not a Sumsub-style HMAC.
      if (!adapter.verifyWebhookSignature?.('', '',headers)) return reply(401,{ received:false,error:'INVALID_SIGNATURE' });
      const length = request.headers.get('content-length');
      if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) return reply(413,{ received:false,error:'PAYLOAD_TOO_LARGE' });
      if (!request.body) return reply(400,{ received:false,error:'EMPTY_PAYLOAD' });
      const reader = request.body.getReader(); const chunks:Buffer[] = []; let total = 0;
      try {
        while (true) {
          const { value,done } = await reader.read(); if (done) break;
          total += value.byteLength;
          if (total > MAX_BYTES) { await reader.cancel(); return reply(413,{ received:false,error:'PAYLOAD_TOO_LARGE' }); }
          chunks.push(Buffer.from(value));
        }
      } finally { reader.releaseLock(); }
      if (!total) return reply(400,{ received:false,error:'EMPTY_PAYLOAD' });
      const raw = Buffer.concat(chunks,total);
      const result = kind === 'payment' ? await processPaymentWebhook('xendit',raw,'',headers) : await processPayoutWebhook('xendit_payout',raw,'',headers);
      if (result.success) return reply(200,{ received:true,duplicate:result.isDuplicateReplay === true,outOfOrderIgnored:result.outOfOrderIgnored === true });
      if (result.error?.startsWith('INVALID_WEBHOOK_PAYLOAD') || result.error?.startsWith('INVALID_PAYOUT_WEBHOOK_PAYLOAD')) return reply(400,{ received:false,error:'INVALID_PAYLOAD' });
      return reply(503,{ received:false,error:'XENDIT_EVENT_NOT_RECONCILED' });
    } catch {
      // Never echo bank details, token headers, payloads or provider errors. No false ACK.
      return reply(503,{ received:false,error:'XENDIT_EVENT_NOT_RECONCILED' });
    }
  };
}
