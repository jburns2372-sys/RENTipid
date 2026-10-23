/** Sandbox-only Payment Sessions transport. No marketplace or payout authority. */
import crypto from 'node:crypto';
import { getCurrencyDefinition } from '@/lib/glcc/currency/currency-registry';
import type { PaymentProviderAdapter, PaymentProviderCapability, ProviderVerificationStatus,
  CreatePaymentSessionInput, CreatePaymentSessionOutput, ProviderPaymentStatusResult,
  NormalizedWebhookEvent } from '../contracts/payment-provider';
import type { ProviderEnvironmentStatus } from '../../trust/contracts/provider-environment-status';
import type { PaymentLifecycleState } from '../contracts/payment-lifecycle';
import { SandboxPaymentExecutionStore, isSandboxPaymentStatePath } from '../services/sandbox-payment-execution-store';

export interface XenditConfig {
  readonly secretKey?: string;
  readonly webhookToken?: string;
  readonly baseUrl?: string;
  readonly environment?: 'sandbox' | 'production';
  readonly statePath?: string;
  readonly businessId?: string;
}
export const XENDIT_PAYMENT_CAPABILITIES: readonly PaymentProviderCapability[] = Object.freeze([
  'CREATE_PAYMENT', 'CANCEL', 'WEBHOOK', 'RECONCILIATION',
]);
export const XENDIT_SUPPORTED_CURRENCIES: readonly string[] = Object.freeze(['THB', 'SGD', 'MYR', 'VND', 'IDR']);
const COUNTRY_CURRENCY: Readonly<Record<string, string>> = Object.freeze({ TH: 'THB', SG: 'SGD', MY: 'MYR', VN: 'VND', ID: 'IDR' });
type Data = Record<string, unknown>;
interface StoredSession extends CreatePaymentSessionOutput {
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly country: string;
  readonly referenceId: string;
}
const digest = (value: unknown): string => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

export class XenditPaymentProviderAdapter implements PaymentProviderAdapter {
  readonly providerId = 'xendit';
  readonly providerName = 'Xendit Southeast Asia Gateway';
  readonly providerType = 'PAYMENT_GATEWAY' as const;
  readonly capabilities = XENDIT_PAYMENT_CAPABILITIES;
  readonly supportedCurrencies = XENDIT_SUPPORTED_CURRENCIES;
  private readonly secretKey: string;
  private readonly webhookToken: string;
  private readonly baseUrl: string;
  private readonly environment: string;
  private readonly statePath: string;
  private readonly businessId: string;
  private store?: SandboxPaymentExecutionStore;

  constructor(config?: XenditConfig) {
    if (typeof window !== 'undefined') throw new Error('XENDIT_SERVER_ONLY');
    this.secretKey = config?.secretKey ?? process.env.XENDIT_SANDBOX_SECRET_KEY ?? process.env.XENDIT_SECRET_KEY ?? '';
    this.webhookToken = config?.webhookToken ?? process.env.XENDIT_SANDBOX_WEBHOOK_TOKEN ?? process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN ?? '';
    this.baseUrl = config?.baseUrl ?? process.env.XENDIT_BASE_URL ?? 'https://api.xendit.co';
    this.environment = config?.environment ?? process.env.XENDIT_ENVIRONMENT ?? '';
    this.statePath = config?.statePath ?? process.env.XENDIT_PAYMENT_SANDBOX_STATE_PATH ?? '';
    this.businessId = config?.businessId ?? process.env.XENDIT_SANDBOX_BUSINESS_ID ?? '';
  }
  get isConfigured(): boolean {
    try {
      const url = new URL(this.baseUrl);
      return this.environment === 'sandbox' && /^xnd_development_[A-Za-z0-9_-]+$/.test(this.secretKey) &&
        !!this.webhookToken.trim() && this.webhookToken === this.webhookToken.trim() && this.webhookToken !== this.secretKey &&
        /^[A-Za-z0-9_-]+$/.test(this.businessId) && isSandboxPaymentStatePath(this.statePath) &&
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
  get executionStore(): SandboxPaymentExecutionStore | undefined {
    if (!this.isConfigured) return undefined;
    return this.store ??= new SandboxPaymentExecutionStore(this.statePath, `xendit:sandbox:${this.businessId}`);
  }
  close(): void { this.store?.close(); this.store = undefined; }
  private requireStore(): SandboxPaymentExecutionStore {
    const store = this.executionStore;
    if (!store) throw new Error('XENDIT_PAYMENT_NOT_CONFIGURED: Explicit sandbox credentials, business and durable sandbox path required.');
    return store;
  }
  private object(value: unknown): Data {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_XENDIT_RESPONSE');
    return value as Data;
  }
  private async request(path: string, method: 'GET' | 'POST', body?: unknown): Promise<Data> {
    this.requireStore();
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        method, redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) throw new Error(`XENDIT_HTTP_${response.status}`);
      return this.object(await response.json());
    } catch (error) {
      // Never expose provider payloads, credentials, customer details or URLs in errors.
      const code = error instanceof Error && /^XENDIT_HTTP_\d{3}$/.test(error.message) ? error.message : 'XENDIT_TRANSPORT_FAILURE';
      throw new Error(code);
    }
  }
  private returnUrl(value: string): void {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('INVALID_PAYMENT_RETURN_URL');
  }
  async createPaymentSession(input: CreatePaymentSessionInput): Promise<CreatePaymentSessionOutput> {
    const store = this.requireStore();
    if (!Number.isSafeInteger(input.amountMinorUnits) || input.amountMinorUnits <= 0) throw new Error('INVALID_PAYMENT_AMOUNT');
    const country = input.jurisdictionCode ?? '';
    if (!COUNTRY_CURRENCY[country] || COUNTRY_CURRENCY[country] !== input.currency) throw new Error('JURISDICTION_CURRENCY_MISMATCH');
    if (!input.bookingId.trim() || !input.idempotencyKey.trim() || !input.payerName.trim() || !input.payerEmail.trim()) throw new Error('INVALID_PAYMENT_IDENTITY');
    this.returnUrl(input.successUrl); this.returnUrl(input.cancelUrl);
    const referenceId = digest([this.businessId, input.idempotencyKey]);
    const amount = input.amountMinorUnits / (10 ** getCurrencyDefinition(input.currency)!.minorUnitExponent);
    if (this.toMinorUnits(amount, input.currency) !== input.amountMinorUnits) throw new Error('UNREPRESENTABLE_PAYMENT_AMOUNT');
    const fingerprint = digest([input.bookingId, input.bookingReference, input.amountMinorUnits, input.currency, country,
      input.payerEmail, input.payerName, input.successUrl, input.cancelUrl]);
    const session = await store.runOperation<StoredSession>(`create:${input.idempotencyKey}`, fingerprint, async () => {
      const data = await this.request('/sessions', 'POST', {
        reference_id: referenceId, session_type: 'PAY', mode: 'PAYMENT_LINK', amount, currency: input.currency,
        country, capture_method: 'AUTOMATIC', allow_save_payment_method: 'DISABLED',
        success_return_url: input.successUrl, cancel_return_url: input.cancelUrl,
        customer: { type: 'INDIVIDUAL', reference_id: digest([this.businessId, input.bookingId]), email: input.payerEmail,
          individual_detail: { given_names: input.payerName } },
        metadata: { booking_id: input.bookingId },
      });
      const normalized = this.validateSession(data, { amountMinorUnits: input.amountMinorUnits, currency: input.currency, country, referenceId });
      if (typeof data.payment_link_url !== 'string') throw new Error('INVALID_XENDIT_CHECKOUT_URL');
      const checkout = new URL(data.payment_link_url);
      if (checkout.protocol !== 'https:' || checkout.username || checkout.password || checkout.port ||
          !['xen.to', 'checkout.xendit.co'].includes(checkout.hostname)) throw new Error('INVALID_XENDIT_CHECKOUT_URL');
      return { providerReference: normalized.providerReference, checkoutUrl: data.payment_link_url,
        initialStatus: normalized.normalizedStatus, amountMinorUnits: input.amountMinorUnits, currency: input.currency, country, referenceId };
    });
    return { providerReference: session.providerReference, checkoutUrl: session.checkoutUrl, initialStatus: session.initialStatus };
  }
  private validateSession(data: Data, expected?: Pick<StoredSession, 'amountMinorUnits' | 'currency' | 'country' | 'referenceId'>): ProviderPaymentStatusResult {
    if (typeof data.payment_session_id !== 'string' || !/^ps-[A-Za-z0-9_-]+$/.test(data.payment_session_id) ||
        data.business_id !== this.businessId || data.session_type !== 'PAY' || data.mode !== 'PAYMENT_LINK' || typeof data.currency !== 'string' ||
        typeof data.country !== 'string' || COUNTRY_CURRENCY[data.country] !== data.currency) throw new Error('INVALID_XENDIT_SESSION');
    const amountMinorUnits = this.toMinorUnits(data.amount, data.currency);
    if (expected && (amountMinorUnits !== expected.amountMinorUnits || data.currency !== expected.currency ||
        data.country !== expected.country || data.reference_id !== expected.referenceId)) throw new Error('XENDIT_SESSION_AUTHORITY_MISMATCH');
    const status = this.mapStatus(data.status);
    if (data.capture_method !== undefined && data.capture_method !== 'AUTOMATIC') throw new Error('INVALID_XENDIT_CAPTURE_METHOD');
    if (status === 'SUCCEEDED' && (typeof data.payment_id !== 'string' || !data.payment_id)) throw new Error('INVALID_XENDIT_COMPLETION');
    return { providerReference: data.payment_session_id, normalizedStatus: status, amountMinorUnits, currency: data.currency };
  }
  async retrievePaymentStatus(reference: string): Promise<ProviderPaymentStatusResult> {
    const expected = this.requireStore().getOperationByReference<StoredSession>(reference);
    if (!expected) throw new Error('UNKNOWN_XENDIT_PAYMENT');
    const result = this.validateSession(await this.request(`/sessions/${encodeURIComponent(reference)}`, 'GET'), expected);
    if (result.providerReference !== reference) throw new Error('XENDIT_SESSION_AUTHORITY_MISMATCH');
    return result;
  }
  async cancelPaymentSession(reference: string): Promise<boolean> {
    const store = this.requireStore();
    const expected = store.getOperationByReference<StoredSession>(reference);
    if (!expected) throw new Error('UNKNOWN_XENDIT_PAYMENT');
    return store.runOperation(`cancel:${reference}`, digest([reference]), async () => {
      const result = this.validateSession(await this.request(`/sessions/${encodeURIComponent(reference)}/cancel`, 'POST'), expected);
      if (result.providerReference !== reference || result.normalizedStatus !== 'CANCELLED') throw new Error('XENDIT_CANCELLATION_NOT_CONFIRMED');
      return true;
    });
  }
  verifyWebhookSignature(_payload: unknown, signature: string, headers?: Record<string, string>): boolean {
    if (!this.isConfigured) return false;
    const tokens = Object.entries(headers ?? {}).filter(([key]) => key.toLowerCase() === 'x-callback-token');
    if (tokens.length !== 1 || !tokens[0][1] || (signature && signature !== tokens[0][1])) return false;
    const expected = Buffer.from(this.webhookToken); const actual = Buffer.from(tokens[0][1]);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
  normalizeWebhookPayload(payload: unknown): NormalizedWebhookEvent {
    const envelope = this.object(Buffer.isBuffer(payload) ? JSON.parse(payload.toString('utf8')) : typeof payload === 'string' ? JSON.parse(payload) : payload);
    if (envelope.business_id !== this.businessId || !['payment_session.completed', 'payment_session.expired'].includes(String(envelope.event))) throw new Error('INVALID_XENDIT_WEBHOOK');
    const data = this.object(envelope.data);
    if (data.business_id !== undefined && data.business_id !== this.businessId) throw new Error('INVALID_XENDIT_WEBHOOK_BUSINESS');
    const expectedStatus = envelope.event === 'payment_session.completed' ? 'COMPLETED' : 'EXPIRED';
    if (data.status !== expectedStatus) throw new Error('INVALID_XENDIT_WEBHOOK_STATUS');
    const expected = typeof data.payment_session_id === 'string' ? this.requireStore().getOperationByReference<StoredSession>(data.payment_session_id) : null;
    if (!expected) throw new Error('UNKNOWN_XENDIT_PAYMENT');
    const result = this.validateSession({ ...data, business_id: envelope.business_id }, expected);
    const metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata as Data : {};
    // Delivery timestamps change on retry; deduplicate semantic events, not delivery time.
    const eventId = typeof envelope.event_id === 'string' && envelope.event_id ? envelope.event_id :
      digest([result.providerReference, envelope.event, result.normalizedStatus, data.payment_id ?? null]);
    return { eventId, eventType: String(envelope.event), ...result,
      ...(typeof data.payment_id === 'string' ? { providerTransactionId: data.payment_id } : {}),
      ...(typeof metadata.booking_id === 'string' ? { bookingId: metadata.booking_id } : {}), rawPayload: payload };
  }
  private toMinorUnits(amount: unknown, currency: string): number {
    const exponent = getCurrencyDefinition(currency)?.minorUnitExponent;
    if (exponent === undefined || (typeof amount !== 'number' && typeof amount !== 'string')) throw new Error('INVALID_XENDIT_AMOUNT');
    const text = String(amount);
    if (!/^\d+(\.\d+)?$/.test(text)) throw new Error('INVALID_XENDIT_AMOUNT');
    const [whole, fraction = ''] = text.split('.');
    const significant = fraction.replace(/0+$/, '');
    if (significant.length > exponent) throw new Error('INVALID_XENDIT_AMOUNT');
    const minor = BigInt(whole) * BigInt(10 ** exponent) + BigInt(significant.padEnd(exponent, '0') || '0');
    if (minor <= BigInt(0) || minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('INVALID_XENDIT_AMOUNT');
    return Number(minor);
  }
  private mapStatus(status: unknown): PaymentLifecycleState {
    switch (status) {
      case 'ACTIVE': return 'PENDING';
      case 'COMPLETED': return 'SUCCEEDED';
      case 'EXPIRED': return 'EXPIRED';
      case 'CANCELED': return 'CANCELLED';
      default: throw new Error('INVALID_XENDIT_STATUS');
    }
  }
}
