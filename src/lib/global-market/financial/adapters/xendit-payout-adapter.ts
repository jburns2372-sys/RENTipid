/** Sandbox-only Xendit v3 payout rail. No payment, funding or marketplace authority. */
import crypto from 'node:crypto';
import { getCurrencyDefinition } from '@/lib/glcc/currency/currency-registry';
import type { PayoutProviderAdapter, PayoutProviderCapability, BeneficiaryValidationInput, BeneficiaryValidationResult,
  CreatePayoutInput, CreatePayoutOutput, ProviderPayoutStatusResult, NormalizedPayoutWebhookEvent } from '../contracts/payout-provider';
import type { ProviderVerificationStatus } from '../contracts/payment-provider';
import type { ProviderEnvironmentStatus } from '../../trust/contracts/provider-environment-status';
import type { PayoutLifecycleState } from '../contracts/payout-lifecycle';
import { SandboxPayoutExecutionStore, isSandboxPayoutStatePath } from '../services/sandbox-payout-execution-store';

type Data = Record<string, unknown>;
export interface XenditPayoutBeneficiary {
  readonly providerId: string;
  readonly reference: string; // Opaque server-side beneficiary ID, never a client bank account.
  readonly jurisdictionCode: string;
  readonly currency: string;
  readonly accountType: 'BANK' | 'WALLET';
  readonly verified: boolean;
  readonly recipient: {
    readonly type: 'INDIVIDUAL' | 'BUSINESS';
    readonly given_name?: string;
    readonly surname?: string;
    readonly business_name?: string;
    readonly relationship: 'SUPPLIER';
    readonly address: Readonly<Record<string, string>> & { readonly country: string };
    readonly account_details: {
      readonly currency: string;
      readonly account_country: string;
      readonly account_holder_name: string;
      readonly account_number: string;
      readonly routing_type_1: string;
      readonly routing_value_1: string;
    };
  };
}
export interface XenditPayoutAuthority {
  readonly bookingId: string;
  readonly providerId: string;
  readonly jurisdictionCode: string;
  readonly beneficiaryReference: string;
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly authorityReference: string;
  readonly bookingCompleted: boolean;
  readonly paymentSucceeded: boolean;
  readonly paymentReconciled: boolean;
  readonly providerKycApproved: boolean;
  readonly hasActiveClaim: boolean;
  readonly hasActiveDispute: boolean;
  readonly isHeld: boolean;
}
export interface XenditPayoutConfig {
  readonly secretKey?: string;
  readonly webhookToken?: string;
  readonly baseUrl?: string;
  readonly environment?: 'sandbox' | 'production';
  readonly businessId?: string;
  readonly statePath?: string;
  /** Server repositories only; absence or unavailable authority fails closed. */
  readonly resolveBeneficiary?: (providerId: string, reference: string) => Promise<XenditPayoutBeneficiary | null>;
  readonly resolvePayoutAuthority?: (bookingId: string) => Promise<XenditPayoutAuthority | null>;
}
export const XENDIT_PAYOUT_CAPABILITIES: readonly PayoutProviderCapability[] = Object.freeze([
  'CREATE_PAYOUT', 'BENEFICIARY_VALIDATION', 'WEBHOOK', 'RECONCILIATION', 'BANK_TRANSFER', 'WALLET_TRANSFER',
]);
export const XENDIT_PAYOUT_SUPPORTED_CURRENCIES: readonly string[] = Object.freeze(['THB', 'SGD', 'MYR', 'VND', 'IDR']);
const COUNTRY_CURRENCY: Readonly<Record<string, string>> = Object.freeze({ TH: 'THB', SG: 'SGD', MY: 'MYR', VN: 'VND', ID: 'IDR' });
const hash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const accountDigest = (account: Data) => hash([account.currency,account.account_country,account.account_holder_name,
  account.account_number,account.routing_type_1,account.routing_value_1]);
interface OwnedPayout extends CreatePayoutOutput {
  readonly payoutId: string;
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly jurisdictionCode: string;
  readonly referenceId: string;
  readonly businessId: string;
  readonly accountHash: string;
}

export class XenditPayoutProviderAdapter implements PayoutProviderAdapter {
  readonly providerId = 'xendit_payout';
  readonly providerName = 'Xendit Sandbox Payouts';
  readonly providerType = 'PAYOUT_RAIL' as const;
  readonly capabilities = XENDIT_PAYOUT_CAPABILITIES;
  readonly supportedCurrencies = XENDIT_PAYOUT_SUPPORTED_CURRENCIES;
  private readonly secretKey: string;
  private readonly webhookToken: string;
  private readonly baseUrl: string;
  private readonly environment: string;
  private readonly businessId: string;
  private readonly statePath: string;
  private store?: SandboxPayoutExecutionStore;
  private readonly beneficiaryResolver?: XenditPayoutConfig['resolveBeneficiary'];
  private readonly authorityResolver?: XenditPayoutConfig['resolvePayoutAuthority'];
  constructor(config?: XenditPayoutConfig) {
    if (typeof window !== 'undefined') throw new Error('XENDIT_PAYOUT_SERVER_ONLY');
    this.secretKey = config?.secretKey ?? process.env.XENDIT_PAYOUT_SANDBOX_SECRET_KEY ?? '';
    this.webhookToken = config?.webhookToken ?? process.env.XENDIT_PAYOUT_SANDBOX_WEBHOOK_TOKEN ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.XENDIT_PAYOUT_BASE_URL ?? 'https://api.xendit.co';
    this.environment = config?.environment ?? process.env.XENDIT_PAYOUT_ENVIRONMENT ?? '';
    this.businessId = config?.businessId ?? process.env.XENDIT_PAYOUT_SANDBOX_BUSINESS_ID ?? '';
    this.statePath = config?.statePath ?? process.env.XENDIT_PAYOUT_SANDBOX_STATE_PATH ?? '';
    this.beneficiaryResolver = config?.resolveBeneficiary; this.authorityResolver = config?.resolvePayoutAuthority;
  }
  get isConfigured(): boolean {
    try {
      const url = new URL(this.baseUrl);
      return this.environment === 'sandbox' && /^xnd_development_[A-Za-z0-9_-]+$/.test(this.secretKey) &&
        !!this.webhookToken.trim() && this.webhookToken.trim() === this.webhookToken && this.webhookToken !== this.secretKey &&
        /^[A-Za-z0-9_-]+$/.test(this.businessId) && isSandboxPayoutStatePath(this.statePath) &&
        typeof this.beneficiaryResolver === 'function' && typeof this.authorityResolver === 'function' &&
        url.protocol === 'https:' && url.hostname === 'api.xendit.co' && !url.port && !url.username && !url.password &&
        url.pathname === '/' && !url.search && !url.hash;
    } catch { return false; }
  }
  get verificationStatus(): ProviderVerificationStatus { return this.isConfigured ? 'VALIDATION_REQUIRED' : 'NOT_CONFIGURED'; }
  getEnvironmentStatus(): ProviderEnvironmentStatus {
    if (this.environment === 'production') return 'PRODUCTION_ONBOARDING_REQUIRED';
    if (!this.secretKey || !this.webhookToken) return 'SANDBOX_CREDENTIALS_REQUIRED';
    return this.isConfigured ? 'SANDBOX_CONFIGURED' : 'NOT_CONFIGURED';
  }
  get executionStore(): SandboxPayoutExecutionStore | undefined {
    if (!this.isConfigured) return undefined;
    return this.store ??= new SandboxPayoutExecutionStore(this.statePath);
  }
  close() { this.store?.close(); this.store = undefined; }
  private requireStore() {
    const store = this.executionStore;
    if (!store) throw new Error('XENDIT_PAYOUT_NOT_CONFIGURED');
    return store;
  }
  private object(value: unknown): Data {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_XENDIT_PAYOUT_RESPONSE');
    return value as Data;
  }
  private async beneficiary(input: BeneficiaryValidationInput): Promise<XenditPayoutBeneficiary> {
    this.requireStore();
    if (!COUNTRY_CURRENCY[input.jurisdictionCode] || COUNTRY_CURRENCY[input.jurisdictionCode] !== input.currency ||
        !input.providerId.trim() || !input.beneficiaryReference.trim()) throw new Error('INVALID_PAYOUT_BENEFICIARY_AUTHORITY');
    let found: XenditPayoutBeneficiary | null;
    try { found = await this.beneficiaryResolver!(input.providerId, input.beneficiaryReference); }
    catch { throw new Error('PAYOUT_BENEFICIARY_AUTHORITY_UNAVAILABLE'); }
    if (!found || found.verified !== true || found.providerId !== input.providerId || found.reference !== input.beneficiaryReference ||
        found.jurisdictionCode !== input.jurisdictionCode || found.currency !== input.currency || found.accountType !== input.accountType) throw new Error('PAYOUT_BENEFICIARY_AUTHORITY_MISMATCH');
    const recipient = found.recipient; const account = recipient.account_details;
    const validText = (value: unknown, max = 255) => typeof value === 'string' && !!value.trim() && value === value.trim() && value.length <= max;
    if (recipient.relationship !== 'SUPPLIER' || recipient.address.country !== input.jurisdictionCode ||
        (recipient.type === 'INDIVIDUAL' ? !validText(recipient.given_name,50) || !validText(recipient.surname,50) :
          recipient.type !== 'BUSINESS' || !validText(recipient.business_name,50)) ||
        account.account_country !== input.jurisdictionCode || account.currency !== input.currency ||
        !validText(account.account_number) || !validText(account.account_holder_name) || !validText(account.routing_value_1) ||
        !['SWIFT','IBAN','SORT_CODE','ABA','BSB','WALLET','CLABE','MOBILE_NO','BUSINESS_REG_NO','NATIONAL_ID'].includes(account.routing_type_1) ||
        (input.accountType === 'BANK' && ['WALLET','MOBILE_NO','BUSINESS_REG_NO','NATIONAL_ID'].includes(account.routing_type_1)) ||
        (input.accountType === 'WALLET' && !['WALLET','MOBILE_NO','BUSINESS_REG_NO','NATIONAL_ID'].includes(account.routing_type_1))) throw new Error('INVALID_PAYOUT_BENEFICIARY_CONFIGURATION');
    // Snapshot the trusted mapping so mutable resolver objects cannot redirect dispatch.
    return JSON.parse(JSON.stringify(found)) as XenditPayoutBeneficiary;
  }
  async validateBeneficiary(input: BeneficiaryValidationInput): Promise<BeneficiaryValidationResult> {
    try { await this.beneficiary(input); return { isValid: true, normalizedAccountReference: input.beneficiaryReference }; }
    catch { return { isValid: false, reason: 'PAYOUT_BENEFICIARY_NOT_AUTHORIZED_OR_CONFIGURED' }; }
  }
  async authorizePayout(input: CreatePayoutInput): Promise<void> {
    const store = this.requireStore();
    const existing = store.getByBooking(input.bookingId);
    if (existing?.providerReference && (store.getOperationByReference(existing.providerReference) as OwnedPayout | null)?.businessId !== this.businessId) {
      throw new Error('PAYOUT_BUSINESS_AUTHORITY_MISMATCH');
    }
    if (!input.bookingId.trim() || !input.payoutId.trim() || !input.idempotencyKey.trim() ||
        !Number.isSafeInteger(input.amountMinorUnits) || input.amountMinorUnits <= 0) throw new Error('INVALID_PAYOUT_IDENTITY_OR_AMOUNT');
    if (!input.jurisdictionCode || COUNTRY_CURRENCY[input.jurisdictionCode] !== input.currency) throw new Error('PAYOUT_SETTLEMENT_CURRENCY_MISMATCH');
    if (input.metadata?.hasActiveClaim === true || input.metadata?.hasActiveDispute === true || input.metadata?.holdReason) throw new Error('PAYOUT_HELD');
    let authority: XenditPayoutAuthority | null;
    try { authority = await this.authorityResolver!(input.bookingId); } catch { throw new Error('PAYOUT_AUTHORITY_UNAVAILABLE'); }
    if (!authority || !authority.authorityReference || authority.bookingId !== input.bookingId || authority.providerId !== input.providerId ||
        authority.jurisdictionCode !== input.jurisdictionCode || authority.beneficiaryReference !== input.beneficiaryReference ||
        authority.amountMinorUnits !== input.amountMinorUnits || authority.currency !== input.currency) throw new Error('PAYOUT_AUTHORITY_MISMATCH');
    if (authority.bookingCompleted !== true || authority.paymentSucceeded !== true || authority.paymentReconciled !== true ||
        authority.providerKycApproved !== true || authority.hasActiveClaim !== false || authority.hasActiveDispute !== false || authority.isHeld !== false) throw new Error('PAYOUT_HELD_OR_INELIGIBLE');
  }
  private providerUnits(amount: number, currency: string): number {
    // Xendit v3 defines IDR as zero-decimal, while GLCC uses exponent 2.
    const exponent = getCurrencyDefinition(currency)?.minorUnitExponent;
    if (exponent === undefined) throw new Error('UNSUPPORTED_PAYOUT_CURRENCY');
    const factor = 10 ** (exponent - (currency === 'IDR' || currency === 'VND' ? 0 : 2));
    if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(amount / factor)) throw new Error('UNREPRESENTABLE_PAYOUT_AMOUNT');
    return amount / factor;
  }
  private async request(path: string, method: 'GET' | 'POST', body?: unknown, key?: string): Promise<Data> {
    this.requireStore();
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/,'')}${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`, 'api-version': '2025-09-01',
          'Content-Type': 'application/json', ...(key ? { 'idempotency-key': key } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      if (!response.ok) throw new Error(`XENDIT_PAYOUT_HTTP_${response.status}`);
      return this.object(await response.json());
    } catch (error) {
      throw new Error(error instanceof Error && /^XENDIT_PAYOUT_HTTP_\d{3}$/.test(error.message) ? error.message : 'XENDIT_PAYOUT_TRANSPORT_FAILURE');
    }
  }
  async createPayout(input: CreatePayoutInput): Promise<CreatePayoutOutput> {
    input = Object.freeze({ ...input,metadata:Object.freeze({ ...input.metadata }) });
    await this.authorizePayout(input);
    const beneficiary = await this.beneficiary({ providerId: input.providerId, beneficiaryReference: input.beneficiaryReference,
      accountType: (input.metadata?.accountType === 'WALLET' ? 'WALLET' : 'BANK'), jurisdictionCode: input.jurisdictionCode!, currency: input.currency });
    const referenceId = hash([this.businessId,input.bookingId]);
    const accountHash = accountDigest(beneficiary.recipient.account_details);
    const amount = this.providerUnits(input.amountMinorUnits,input.currency);
    const expected = { payoutId: input.payoutId, amountMinorUnits: input.amountMinorUnits, currency: input.currency,
      jurisdictionCode: input.jurisdictionCode!, referenceId, businessId: this.businessId, accountHash };
    const fingerprint = hash([this.businessId,input.bookingId,input.providerId,input.currency,input.amountMinorUnits,input.beneficiaryReference,beneficiary.recipient]);
    const output = await this.requireStore().runCreate(input.bookingId,input.idempotencyKey,fingerprint, async () => {
      // Fresh authority after beneficiary lookup and durable reservation, immediately before dispatch.
      await this.authorizePayout(input);
      const latest = await this.beneficiary({ providerId: input.providerId, beneficiaryReference: input.beneficiaryReference,
        accountType: beneficiary.accountType, jurisdictionCode: input.jurisdictionCode!, currency: input.currency });
      if (hash(latest.recipient) !== hash(beneficiary.recipient)) throw new Error('PAYOUT_BENEFICIARY_CHANGED');
      await this.authorizePayout(input);
      const data = await this.request('/v3/payouts','POST', { reference_id: referenceId, recipient: beneficiary.recipient,
        payout_details: { source_currency: input.currency, destination_currency: input.currency, destination_amount: amount },
        source_of_fund: 'BUSINESS_REVENUE', purpose_code: 'OTHER', description: 'RENTipid rental provider settlement' }, hash([this.businessId,input.bookingId]));
      const status = this.validateResponse(data, expected);
      return { ...expected, providerReference: status.providerReference, initialStatus: status.normalizedStatus } as OwnedPayout;
    });
    return { providerReference: output.providerReference, initialStatus: output.initialStatus };
  }
  private validateResponse(data: Data, expected: Omit<OwnedPayout,'providerReference' | 'initialStatus'>): ProviderPayoutStatusResult {
    const account = this.object(this.object(data.recipient).account_details);
    const amount = this.providerUnits(expected.amountMinorUnits,expected.currency);
    if (typeof data.payout_id !== 'string' || !/^po-[A-Za-z0-9_-]+$/.test(data.payout_id) || data.business_id !== expected.businessId ||
        data.reference_id !== expected.referenceId || data.source_currency !== expected.currency || data.destination_currency !== expected.currency ||
        data.source_amount !== amount || data.destination_amount !== amount || accountDigest(account) !== expected.accountHash ||
        (account.routing_type_2 !== undefined && account.routing_type_2 !== null && account.routing_type_2 !== '') ||
        account.account_country !== expected.jurisdictionCode || account.currency !== expected.currency) throw new Error('XENDIT_PAYOUT_AUTHORITY_MISMATCH');
    return { providerReference: data.payout_id, normalizedStatus: this.mapStatus(data.status), amountMinorUnits: expected.amountMinorUnits,
      currency: expected.currency, ...(typeof data.failure_code === 'string' ? { failureReason: 'XENDIT_PAYOUT_FAILED' } : {}) };
  }
  async retrievePayoutStatus(reference: string): Promise<ProviderPayoutStatusResult> {
    const expected = this.requireStore().getOperationByReference(reference) as OwnedPayout | null;
    if (!expected || expected.businessId !== this.businessId) throw new Error('UNKNOWN_XENDIT_PAYOUT');
    const result = this.validateResponse(await this.request(`/v3/payouts/${encodeURIComponent(reference)}`,'GET'),expected);
    if (result.providerReference !== reference) throw new Error('XENDIT_PAYOUT_REFERENCE_MISMATCH');
    return result;
  }
  verifyWebhookSignature(_payload: unknown, signature: string, headers?: Record<string,string>): boolean {
    if (!this.isConfigured) return false;
    const tokens = Object.entries(headers ?? {}).filter(([key]) => key.toLowerCase() === 'x-callback-token');
    if (tokens.length !== 1 || !tokens[0][1] || (signature && signature !== tokens[0][1])) return false;
    const expected = Buffer.from(this.webhookToken); const actual = Buffer.from(tokens[0][1]);
    return expected.length === actual.length && crypto.timingSafeEqual(expected,actual);
  }
  normalizeWebhookPayload(payload: unknown): NormalizedPayoutWebhookEvent {
    const envelope = this.object(Buffer.isBuffer(payload) ? JSON.parse(payload.toString('utf8')) : typeof payload === 'string' ? JSON.parse(payload) : payload);
    const statuses: Readonly<Record<string,string>> = { 'v3_payout.succeeded':'SUCCEEDED','v3_payout.failed':'FAILED',
      'v3_payout.reversed':'REVERSED','v3_payout.rejected':'REJECTED','v3_payout.pending_compliance':'PENDING_COMPLIANCE_ASSESSMENT' };
    const data = this.object(envelope.data);
    if (envelope.business_id !== this.businessId || typeof envelope.event !== 'string' || !statuses[envelope.event] || data.status !== statuses[envelope.event]) throw new Error('INVALID_XENDIT_PAYOUT_WEBHOOK');
    const expected = typeof data.payout_id === 'string' ? this.requireStore().getOperationByReference(data.payout_id) as OwnedPayout | null : null;
    if (!expected || expected.businessId !== this.businessId) throw new Error('UNKNOWN_XENDIT_PAYOUT');
    const result = this.validateResponse(data,expected);
    return { eventId: typeof envelope.event_id === 'string' && envelope.event_id ? envelope.event_id : hash([data.payout_id,envelope.event,data.status]),
      eventType: envelope.event, ...result, payoutId: expected.payoutId, rawPayload: payload };
  }
  private mapStatus(status: unknown): PayoutLifecycleState {
    switch (status) {
      case 'ACCEPTED': case 'PENDING_COMPLIANCE_ASSESSMENT': return 'PENDING';
      case 'ROUTING': case 'REQUESTED': case 'READY': case 'LOCKED': return 'PROCESSING';
      case 'SUCCEEDED': return 'SUCCEEDED';
      case 'FAILED': case 'REJECTED': case 'EXPIRED': return 'FAILED';
      case 'CANCELLED': return 'CANCELLED';
      case 'REVERSED': return 'REVERSED';
      default: throw new Error('INVALID_XENDIT_PAYOUT_STATUS');
    }
  }
}
