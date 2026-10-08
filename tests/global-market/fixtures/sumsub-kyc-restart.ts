import { appendFileSync } from 'node:fs';
import { SumsubKycProviderAdapter } from '../../../src/lib/global-market/trust/adapters/sumsub-kyc-adapter';
import { applicantId,kycConfig,kycInput,signEvent } from './sumsub-kyc-data';
const [action,path,counter] = process.argv.slice(2);
const adapter = new SumsubKycProviderAdapter(kycConfig(path));
globalThis.fetch = async (url,init) => {
  if (init?.method === 'POST') {
    appendFileSync(counter,'POST\n');
    if (action === 'ambiguous') throw new Error('private provider error');
    const body = JSON.parse(String(init.body));
    return new Response(JSON.stringify({ id:applicantId,externalUserId:body.externalUserId,type:body.type,review:{ reviewStatus:'init' } }),{ status:200 });
  }
  appendFileSync(counter,'GET\n');
  return new Response(JSON.stringify({ levelName:'sandbox-individual',reviewStatus:'completed',reviewResult:{ reviewAnswer:action === 'reject' ? 'RED':'GREEN',reviewRejectType:'FINAL' },reviewDate:'2026-10-08 10:00:00+0000' }),{ status:200 });
};
async function run() {
  try {
    const created = await adapter.createVerification(kycInput());
    if (action === 'create') return { status:created.status };
    const binding = adapter.executionStore!.get(applicantId)!;
    const event = signEvent({ applicantId,externalUserId:binding.externalUserId,type:'applicantReviewed',correlationId:action === 'reject' ? 'rejection-event':'approval-event',createdAtMs:'1791453600000',reviewStatus:'completed',reviewResult:{ reviewAnswer:'GREEN' } });
    const result = await adapter.handleWebhook(event.raw,event.headers);
    return { handled:result.handled,eventType:result.eventType,status:result.verificationResult?.status };
  } catch(error) { return { error:(error as Error).message }; }
  finally { adapter.close(); }
}
run().then(result => process.stdout.write(JSON.stringify(result))).catch(() => process.exitCode = 1);
