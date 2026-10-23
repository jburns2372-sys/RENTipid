import crypto from 'node:crypto';
import type { SumsubConfig } from '../../../src/lib/global-market/trust/adapters/sumsub-kyc-adapter';
import type { CreateVerificationInput } from '../../../src/lib/global-market/trust/adapters/kyc-provider-adapter.interface';
export const applicantId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
export const individualDocuments = ['NATIONAL_ID','PASSPORT','DRIVER_LICENSE','SELFIE_LIVENESS','ADDRESS_PROOF'] as const;
export const kycInput = (country = 'TH',subjectType:'INDIVIDUAL' | 'BUSINESS' = 'INDIVIDUAL'):CreateVerificationInput => ({
  accountId:'account-testonly',jurisdictionCode:country,subjectType,
  requiredDocuments:subjectType === 'BUSINESS' ? ['BUSINESS_REGISTRATION','ADDRESS_PROOF']:['NATIONAL_ID','SELFIE_LIVENESS','ADDRESS_PROOF']
});
export const kycConfig = (statePath:string):SumsubConfig => ({
  appToken:'sbx:testonly',secretKey:'testonly-api-secret',webhookSecret:'testonly-webhook-secret',environment:'sandbox',tenantId:'tenant-testonly',statePath,
  authorizeAccountOperation:async () => true,
  levels:{ INDIVIDUAL:{ name:'sandbox-individual',documents:individualDocuments },BUSINESS:{ name:'sandbox-business',documents:['BUSINESS_REGISTRATION','ADDRESS_PROOF','TAX_REGISTRATION'] } }
});
export function signEvent(data:unknown,algorithm = 'sha256') {
  const raw = Buffer.from(JSON.stringify({ sandboxMode:true,...data as Record<string,unknown> },null,2));
  return { raw,headers:{ 'X-Payload-Digest-Alg':algorithm === 'sha512' ? 'HMAC_SHA512_HEX':'HMAC_SHA256_HEX',
    'X-Payload-Digest':crypto.createHmac(algorithm,'testonly-webhook-secret').update(raw).digest('hex') } };
}
