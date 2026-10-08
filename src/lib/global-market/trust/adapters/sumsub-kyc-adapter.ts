/** Single authoritative Sumsub sandbox adapter. Raw evidence and SDK tokens are never persisted. */
import crypto from 'node:crypto';
import type { IKycProviderAdapter,CreateVerificationInput,SubmitDocumentsInput,KycVerificationResult,WebhookProcessingResult } from './kyc-provider-adapter.interface';
import type { ProviderEnvironmentStatus } from '../contracts/provider-environment-status';
import type { DocumentCategory } from '../contracts/document-requirement';
import { DOCUMENT_CATEGORIES } from '../contracts/document-requirement';
import type { VerificationState } from '../contracts/verification-state';
import { getJurisdictionKycProfile } from '../registry/jurisdiction-kyc-registry';
import { SandboxKycExecutionStore,isSandboxKycStatePath,type KycBinding } from '../services/sandbox-kyc-execution-store';

type Data = Record<string,unknown>;
export interface SumsubLevelPolicy { readonly name:string; readonly documents:readonly DocumentCategory[]; }
export interface SumsubConfig {
  readonly appToken?:string;
  readonly secretKey?:string;
  readonly webhookSecret?:string;
  readonly baseUrl?:string;
  readonly environment?:'sandbox' | 'production';
  readonly tenantId?:string;
  readonly statePath?:string;
  readonly levels?:Partial<Readonly<Record<'INDIVIDUAL' | 'BUSINESS',SumsubLevelPolicy>>>;
  /** Must authorize the authenticated server caller, not a client-supplied boolean. */
  readonly authorizeAccountOperation?:(accountId:string,operation:'CREATE' | 'SESSION' | 'SUBMIT' | 'REVERIFY')=>Promise<boolean>;
  /** Resolves an account-owned private upload; the adapter never fetches file URLs. */
  readonly resolveDocument?:(accountId:string,fileReference:string)=>Promise<{
    readonly bytes:Buffer; readonly mimeType:string; readonly category:DocumentCategory;
    readonly country:string; readonly idDocType:string; readonly idDocSubType?:string;
  } | null>;
}
export const SUMSUB_SUPPORTED_JURISDICTIONS:readonly string[] = Object.freeze(['TH','SG','MY','VN','ID']);
const identityDocuments:readonly DocumentCategory[] = Object.freeze(['NATIONAL_ID','PASSPORT','DRIVER_LICENSE','SELFIE_LIVENESS','ADDRESS_PROOF']);
export const SUMSUB_COUNTRY_DOCUMENT_MAPPING:Readonly<Record<string,readonly DocumentCategory[]>> = Object.freeze(
  Object.fromEntries(SUMSUB_SUPPORTED_JURISDICTIONS.map(country => [country,identityDocuments])));
const hash = (value:unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const COUNTRY_ISO3:Readonly<Record<string,string>> = { TH:'THA',SG:'SGP',MY:'MYS',VN:'VNM',ID:'IDN' };
const DOC_TYPES:Partial<Record<DocumentCategory,string>> = { PASSPORT:'PASSPORT',NATIONAL_ID:'ID_CARD',DRIVER_LICENSE:'DRIVERS',ADDRESS_PROOF:'UTILITY_BILL',
  BUSINESS_REGISTRATION:'COMPANY_DOC',TAX_REGISTRATION:'COMPANY_DOC',AUTHORIZED_REPRESENTATIVE_DOCUMENT:'POWER_OF_ATTORNEY' };

export class SumsubKycProviderAdapter implements IKycProviderAdapter {
  readonly providerId = 'SUMSUB'; readonly providerName = 'Sumsub Global Verification';
  private readonly appToken:string; private readonly secretKey:string; private readonly webhookSecret:string;
  private readonly baseUrl:string; private readonly environment:string; private readonly tenantId:string; private readonly statePath:string;
  private readonly levels:SumsubConfig['levels']; private readonly authorize:SumsubConfig['authorizeAccountOperation'];
  private readonly documentResolver:SumsubConfig['resolveDocument']; private store?:SandboxKycExecutionStore;
  constructor(config?:SumsubConfig) {
    if (typeof window !== 'undefined') throw new Error('SUMSUB_SERVER_ONLY');
    this.appToken = config?.appToken ?? process.env.SUMSUB_SANDBOX_APP_TOKEN ?? process.env.SUMSUB_APP_TOKEN ?? '';
    this.secretKey = config?.secretKey ?? process.env.SUMSUB_SANDBOX_SECRET_KEY ?? process.env.SUMSUB_SECRET_KEY ?? '';
    this.webhookSecret = config?.webhookSecret ?? process.env.SUMSUB_SANDBOX_WEBHOOK_SECRET ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.SUMSUB_BASE_URL ?? 'https://api.sumsub.com';
    this.environment = config?.environment ?? process.env.SUMSUB_ENVIRONMENT ?? '';
    this.tenantId = config?.tenantId ?? process.env.SUMSUB_SANDBOX_TENANT_ID ?? '';
    this.statePath = config?.statePath ?? process.env.SUMSUB_SANDBOX_STATE_PATH ?? '';
    this.levels = config?.levels ? JSON.parse(JSON.stringify(config.levels)) as SumsubConfig['levels'] : undefined;
    this.authorize = config?.authorizeAccountOperation; this.documentResolver = config?.resolveDocument;
  }
  get isConfigured():boolean {
    try {
      const url = new URL(this.baseUrl);
      return this.environment === 'sandbox' && /^sbx:[A-Za-z0-9_.:-]+$/.test(this.appToken) &&
        !!this.secretKey.trim() && this.secretKey.trim() === this.secretKey && !!this.webhookSecret.trim() &&
        this.webhookSecret.trim() === this.webhookSecret && this.webhookSecret !== this.secretKey &&
        /^[A-Za-z0-9_-]+$/.test(this.tenantId) && isSandboxKycStatePath(this.statePath) && typeof this.authorize === 'function' &&
        Object.values(this.levels ?? {}).some(level => !!level?.name && Array.isArray(level.documents) && level.documents.every(doc => DOCUMENT_CATEGORIES.includes(doc))) &&
        url.protocol === 'https:' && url.hostname === 'api.sumsub.com' && !url.port && !url.username && !url.password &&
        url.pathname === '/' && !url.search && !url.hash;
    } catch { return false; }
  }
  getEnvironmentStatus():ProviderEnvironmentStatus {
    if (this.environment === 'production') return 'PRODUCTION_ONBOARDING_REQUIRED';
    if (!this.appToken || !this.secretKey || !this.webhookSecret) return 'SANDBOX_CREDENTIALS_REQUIRED';
    return this.isConfigured ? 'SANDBOX_CONFIGURED':'NOT_CONFIGURED';
  }
  get executionStore():SandboxKycExecutionStore | undefined {
    if (!this.isConfigured) return undefined;
    return this.store ??= new SandboxKycExecutionStore(this.statePath,this.tenantId);
  }
  close() { this.store?.close(); this.store = undefined; }
  toJSON() { return { providerId:this.providerId,environmentStatus:this.getEnvironmentStatus() }; }
  private requireStore():SandboxKycExecutionStore {
    const store = this.executionStore; if (!store) throw new Error('SUMSUB_NOT_CONFIGURED'); return store;
  }
  private object(value:unknown):Data {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_SUMSUB_RESPONSE'); return value as Data;
  }
  private async authorizeOperation(accountId:string,operation:'CREATE' | 'SESSION' | 'SUBMIT' | 'REVERIFY'):Promise<void> {
    this.requireStore();
    try { if (await this.authorize!(accountId,operation) === true) return; } catch { /* sanitized */ }
    throw new Error('SUMSUB_ACCOUNT_OPERATION_UNAUTHORIZED');
  }
  private binding(id:string):KycBinding {
    const binding = this.requireStore().get(id); if (!binding) throw new Error('UNKNOWN_SUMSUB_APPLICANT'); return binding;
  }
  private async request(path:string,method:'GET' | 'POST',body?:Buffer,contentType = 'application/json'):Promise<Data> {
    this.requireStore();
    const timestamp = String(Math.floor(Date.now()/1000));
    const signature = crypto.createHmac('sha256',this.secretKey).update(timestamp + method + path).update(body ?? Buffer.alloc(0)).digest('hex');
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/,'')}${path}`,{ method,redirect:'error',signal:AbortSignal.timeout(10000),
        headers:{ 'X-App-Token':this.appToken,'X-App-Access-Ts':timestamp,'X-App-Access-Sig':signature,'Content-Type':contentType },
        ...(body ? { body:body as unknown as BodyInit }:{} ) });
      if (!response.ok) throw new Error(`SUMSUB_HTTP_${response.status}`);
      return this.object(await response.json());
    } catch(error) { throw new Error(error instanceof Error && /^SUMSUB_HTTP_\d{3}$/.test(error.message) ? error.message:'SUMSUB_TRANSPORT_FAILURE'); }
  }
  isDocumentSupported(country:string,category:DocumentCategory):boolean {
    return !!SUMSUB_COUNTRY_DOCUMENT_MAPPING[country]?.includes(category);
  }
  async createVerification(input:CreateVerificationInput):Promise<KycVerificationResult> {
    const store = this.requireStore();
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(input.accountId)) throw new Error('INVALID_OPAQUE_KYC_ACCOUNT_ID');
    const profile = getJurisdictionKycProfile(input.jurisdictionCode);
    if (!profile || profile.countryCode !== input.jurisdictionCode || profile.providerAdapter !== this.providerId || !SUMSUB_SUPPORTED_JURISDICTIONS.includes(input.jurisdictionCode)) throw new Error('SUMSUB_JURISDICTION_PROVIDER_MISMATCH');
    await this.authorizeOperation(input.accountId,'CREATE');
    const level = this.levels?.[input.subjectType];
    if (!level || !level.name.trim() || !Array.isArray(input.requiredDocuments) || !input.requiredDocuments.length ||
        input.requiredDocuments.some(doc => !level.documents.includes(doc)) ||
        (input.subjectType === 'INDIVIDUAL' && !profile.identityDocumentsRequired.every(doc => level.documents.includes(doc))) ||
        (profile.addressProofRequired && !level.documents.includes('ADDRESS_PROOF')) ||
        (input.subjectType === 'BUSINESS' && !level.documents.includes('BUSINESS_REGISTRATION'))) throw new Error('SUMSUB_LEVEL_POLICY_NOT_CONFIGURED');
    const externalUserId = `rentipid_sbx_${hash([this.tenantId,input.accountId,input.jurisdictionCode,input.subjectType])}`;
    const fingerprint = hash([externalUserId,level.name,[...level.documents].sort(),[...input.requiredDocuments].sort()]);
    const created = await store.runOperation<KycBinding>(`create:${externalUserId}`,fingerprint,async () => {
      const data = await this.request(`/resources/applicants?levelName=${encodeURIComponent(level.name)}`,'POST',Buffer.from(JSON.stringify({ externalUserId,type:input.subjectType === 'BUSINESS' ? 'company':'individual' })));
      if (typeof data.id !== 'string' || !/^[a-z0-9]{24}$/.test(data.id) || data.externalUserId !== externalUserId ||
          data.type !== (input.subjectType === 'BUSINESS' ? 'company':'individual')) throw new Error('SUMSUB_APPLICANT_BINDING_MISMATCH');
      // Creation cannot establish approval. Unexpected pre-existing review state requires reconciliation.
      if (data.review && this.object(data.review).reviewStatus !== 'init') throw new Error('SUMSUB_APPLICANT_RECONCILIATION_REQUIRED');
      return { accountId:input.accountId,jurisdictionCode:input.jurisdictionCode,subjectType:input.subjectType,requiredDocuments:[...input.requiredDocuments],
        verificationId:data.id,externalUserId,levelName:level.name,version:0,
        result:{ verificationId:data.id,accountId:input.accountId,providerName:this.providerName,status:'DOCUMENTS_REQUIRED',rawProviderStatus:'init' } };
    });
    return store.attach(created).result;
  }
  async createVerificationSession(id:string,accountId:string):Promise<{ verificationId:string;sessionToken:string;expiresAt:string }> {
    const binding = this.binding(id);
    if (binding.accountId !== accountId) throw new Error('SUMSUB_ACCOUNT_BINDING_MISMATCH');
    await this.authorizeOperation(accountId,'SESSION');
    const issuedAt = Date.now();
    const data = await this.request('/resources/accessTokens/sdk','POST',Buffer.from(JSON.stringify({ userId:binding.externalUserId,levelName:binding.levelName,ttlInSecs:600 })));
    if (typeof data.token !== 'string' || !data.token.startsWith('_act-') || data.userId !== binding.externalUserId) throw new Error('SUMSUB_SDK_SESSION_MISMATCH');
    return { verificationId:id,sessionToken:data.token,expiresAt:new Date(issuedAt + 600000).toISOString() };
  }
  private async currentResult(binding:KycBinding):Promise<KycVerificationResult> {
    const data = await this.request(`/resources/applicants/${encodeURIComponent(binding.verificationId)}/status`,'GET');
    if (data.levelName !== binding.levelName) throw new Error('SUMSUB_LEVEL_BINDING_MISMATCH');
    return this.normalizeResult({ ...data,applicantId:binding.verificationId,externalUserId:binding.externalUserId });
  }
  async getVerification(id:string):Promise<KycVerificationResult> {
    const binding = this.binding(id); await this.authorizeOperation(binding.accountId,'SESSION');
    return this.requireStore().observe(binding,await this.currentResult(binding));
  }
  async checkStatus(id:string):Promise<KycVerificationResult> { return this.getVerification(id); }
  async submitDocuments(input:SubmitDocumentsInput):Promise<KycVerificationResult> {
    const binding = this.binding(input.verificationId);
    if (binding.accountId !== input.accountId) throw new Error('SUMSUB_ACCOUNT_BINDING_MISMATCH');
    await this.authorizeOperation(input.accountId,'SUBMIT');
    if (!this.documentResolver || !input.documents.length || input.documents.length > 10) throw new Error('SUMSUB_SECURE_DOCUMENT_RESOLVER_REQUIRED');
    for (const doc of input.documents) {
      let upload:Awaited<ReturnType<NonNullable<SumsubConfig['resolveDocument']>>>;
      try { upload = await this.documentResolver(input.accountId,doc.fileUrl); } catch { throw new Error('SUMSUB_DOCUMENT_AUTHORITY_UNAVAILABLE'); }
      const policy = this.levels?.[binding.subjectType];
      if (!upload || upload.category !== doc.category || !policy?.documents.includes(doc.category) || upload.mimeType !== doc.mimeType ||
          !['image/jpeg','image/png','application/pdf'].includes(upload.mimeType) || !Buffer.isBuffer(upload.bytes) || !upload.bytes.length || upload.bytes.length > 10*1024*1024 ||
          upload.country !== COUNTRY_ISO3[binding.jurisdictionCode] || upload.idDocType !== DOC_TYPES[doc.category] ||
          (binding.subjectType === 'BUSINESS' && !['COMPANY_DOC','POWER_OF_ATTORNEY'].includes(upload.idDocType))) throw new Error('SUMSUB_DOCUMENT_AUTHORITY_MISMATCH');
      const content = Buffer.from(upload.bytes);
      const operation = hash([binding.verificationId,doc.category,upload.country,upload.idDocType,upload.idDocSubType ?? '',crypto.createHash('sha256').update(content).digest('hex')]);
      await this.requireStore().runOperation(`upload:${operation}`,operation,async () => {
        const form = new FormData(); form.append('metadata',JSON.stringify({ country:upload!.country,idDocType:upload!.idDocType,...(upload!.idDocSubType ? { idDocSubType:upload!.idDocSubType }:{} ) }));
        form.append('content',new Blob([new Uint8Array(content)],{ type:upload!.mimeType }),'verification-document');
        const serialized = new Request('https://api.sumsub.com',{ method:'POST',body:form });
        const body = Buffer.from(await serialized.arrayBuffer());
        const result = await this.request(`/resources/applicants/${binding.verificationId}/info/idDoc`,'POST',body,serialized.headers.get('Content-Type')!);
        if (result.country !== upload!.country || result.idDocType !== upload!.idDocType || (Array.isArray(result.errors) && result.errors.length)) throw new Error('SUMSUB_DOCUMENT_NOT_ACCEPTED');
        return true;
      });
    }
    // Upload acknowledgement is not submission/approval: return the real provider review state.
    return this.checkStatus(input.verificationId);
  }
  async cancelVerification(id:string):Promise<boolean> { this.binding(id); return false; /* Deactivation is not cancellation; never fabricate it. */ }
  verifyWebhook(payload:string | Buffer,signature:string,secret?:string):boolean {
    if (!this.isConfigured || (secret !== undefined && secret !== this.webhookSecret) || !/^[a-fA-F0-9]{64}$/.test(signature)) return false;
    const expected = crypto.createHmac('sha256',this.webhookSecret).update(payload).digest();
    const actual = Buffer.from(signature,'hex'); return expected.length === actual.length && crypto.timingSafeEqual(expected,actual);
  }
  async handleWebhook(payload:unknown,headers:Record<string,string>):Promise<WebhookProcessingResult> {
    if (!this.isConfigured || (!Buffer.isBuffer(payload) && typeof payload !== 'string')) return { handled:false,eventType:'INVALID_SIGNATURE',error:'Raw bytes and configured sandbox credentials required.' };
    const getHeader = (name:string) => {
      const found = Object.entries(headers).filter(([key]) => key.toLowerCase() === name); return found.length === 1 ? found[0][1]:'';
    };
    const alg = getHeader('x-payload-digest-alg'); const signature = getHeader('x-payload-digest');
    const digestAlg = alg === 'HMAC_SHA256_HEX' ? 'sha256':alg === 'HMAC_SHA512_HEX' ? 'sha512':null;
    if (!digestAlg || !new RegExp(`^[a-fA-F0-9]{${digestAlg === 'sha256' ? 64:128}}$`).test(signature)) return { handled:false,eventType:'INVALID_SIGNATURE' };
    const raw = Buffer.isBuffer(payload) ? payload:Buffer.from(payload);
    if (raw.length > 1024*1024) return { handled:false,eventType:'INVALID_PAYLOAD' };
    const expected = crypto.createHmac(digestAlg,this.webhookSecret).update(raw).digest();
    if (!crypto.timingSafeEqual(expected,Buffer.from(signature,'hex'))) return { handled:false,eventType:'INVALID_SIGNATURE' };
    try {
      const data = this.object(JSON.parse(raw.toString('utf8')));
      const binding = typeof data.applicantId === 'string' ? this.binding(data.applicantId):null;
      if (!binding || data.externalUserId !== binding.externalUserId || typeof data.type !== 'string' ||
          !['applicantCreated','applicantPending','applicantReviewed','applicantOnHold','applicantReset','applicantActivated','applicantDeactivated','applicantPersonalInfoChanged'].includes(data.type) || data.testMode === true) throw new Error('INVALID_SUMSUB_EVENT_BINDING');
      const correlation = typeof data.correlationId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(data.correlationId) ? data.correlationId:null;
      const timestamp = typeof data.createdAtMs === 'number' && Number.isSafeInteger(data.createdAtMs) && data.createdAtMs > 0 ? String(data.createdAtMs):
        typeof data.createdAtMs === 'string' && /^\d{10,17}$/.test(data.createdAtMs) ? data.createdAtMs:
        typeof data.createdAt === 'string' && Number.isFinite(Date.parse(data.createdAt.replace(' ','T').replace(/\+0000$/,'Z'))) ? data.createdAt:null;
      if (!correlation && !timestamp) throw new Error('MISSING_STABLE_SUMSUB_EVENT_IDENTITY');
      const key = hash([binding.verificationId,data.type,correlation ?? timestamp]);
      const fingerprint = hash([data.applicantId,data.externalUserId,data.type,data.reviewStatus,data.reviewResult,data.attemptId,data.createdAtMs ?? data.createdAt]);
      const replay = this.requireStore().replay(key,fingerprint,binding.verificationId);
      if (replay) return { handled:true,eventType:'DUPLICATE_EVENT_IGNORED',verificationResult:replay };
      // Never trust delivery ordering or an old approval: reconcile the current signed API state.
      const result = await this.currentResult(binding);
      return { handled:true,eventType:data.type,verificationResult:this.requireStore().observe(binding,result,key,fingerprint) };
    } catch { return { handled:false,eventType:'INVALID_OR_UNRECONCILED_EVENT',error:'KYC event could not be safely reconciled.' }; }
  }
  normalizeResult(rawResult:unknown):KycVerificationResult {
    const raw = this.object(rawResult); const id = raw.applicantId ?? raw.id;
    if (typeof id !== 'string') throw new Error('INVALID_SUMSUB_APPLICANT');
    const binding = this.binding(id);
    if (raw.externalUserId !== undefined && raw.externalUserId !== binding.externalUserId) throw new Error('SUMSUB_ACCOUNT_BINDING_MISMATCH');
    const review = raw.review ? this.object(raw.review):raw; const result = review.reviewResult ? this.object(review.reviewResult):{};
    const labels = Array.isArray(result.rejectLabels) ? result.rejectLabels.filter((label):label is string => typeof label === 'string'):[];
    let status:VerificationState; const flags:string[] = [];
    switch (review.reviewStatus) {
      case 'init': status = 'DOCUMENTS_REQUIRED'; break;
      case 'pending': case 'queued': case 'prechecked': case 'awaitingService': status = 'UNDER_REVIEW'; break;
      case 'onHold': status = 'UNDER_REVIEW'; flags.push('MANUAL_REVIEW_REQUIRED'); break;
      case 'awaitingUser': status = 'IN_PROGRESS'; flags.push('ASSOCIATED_PARTY_VERIFICATION_REQUIRED'); break;
      case 'completed':
        if (result.reviewAnswer === 'GREEN') status = 'APPROVED';
        else if (result.reviewAnswer === 'RED') status = result.reviewRejectType === 'RETRY' ? 'DOCUMENTS_REQUIRED':'REJECTED';
        else throw new Error('INCOMPLETE_SUMSUB_REVIEW_RESULT');
        break;
      default: throw new Error('UNKNOWN_SUMSUB_REVIEW_STATUS');
    }
    if (labels.some(label => ['SANCTIONS','SANCTIONS_LIST','AML','COMPROMISED_PERSONS'].includes(label))) flags.push('AML_SCREENING_FLAG');
    if (labels.some(label => ['PEP','PEP_WATCHLIST'].includes(label))) flags.push('PEP_MATCH');
    if (labels.includes('FORGERY')) flags.push('DOCUMENT_FORGERY_DETECTED');
    if (status === 'APPROVED' && (flags.length || labels.length)) { status = 'UNDER_REVIEW'; flags.push('MANUAL_REVIEW_REQUIRED'); }
    let verifiedAt:string | null = null;
    if (status === 'APPROVED' && typeof review.reviewDate === 'string') {
      const time = Date.parse(review.reviewDate.replace(' ','T').replace(/\+0000$/,'Z'));
      if (Number.isFinite(time)) verifiedAt = new Date(time).toISOString();
    }
    return { verificationId:id,accountId:binding.accountId,providerName:this.providerName,status,
      rawProviderStatus:`${review.reviewStatus}:${result.reviewAnswer === 'GREEN' || result.reviewAnswer === 'RED' ? result.reviewAnswer:'pending'}`,
      verifiedAt,rejectionReason:status === 'REJECTED' ? 'Verification rejected by provider.':null,flags:flags.length ? flags:undefined };
  }
  async reverify(accountId:string):Promise<KycVerificationResult> {
    const binding = this.requireStore().byAccount(accountId); await this.authorizeOperation(accountId,'REVERIFY');
    // No silent evidence reset, discarded SDK token, invented restart or duplicate applicant.
    const current = await this.checkStatus(binding.verificationId);
    if (current.status === 'REJECTED' || current.status === 'APPROVED') throw new Error('SUMSUB_REVERIFICATION_REQUIRES_AUTHORIZED_PROVIDER_RESET');
    return current; // Caller can explicitly request an account-bound SDK session to resume.
  }
}
