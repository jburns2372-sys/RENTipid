/**
 * RENTipid GLOBAL-MKT / v2.0 — External KYC Provider Adapters (Stubs)
 *
 * Provides typed adapter shells for future third-party KYC vendor integrations.
 * Strictly marked NOT_CONFIGURED (0 verified external providers) to adhere to
 * the Truthful Acceptance Rule.
 */

import {
  type IKycProviderAdapter,
  type CreateVerificationInput,
  type SubmitDocumentsInput,
  type KycVerificationResult,
  type WebhookProcessingResult,
} from './kyc-provider-adapter.interface';
import { getJurisdictionKycProfile } from '../registry/jurisdiction-kyc-registry';

const configuredAdapters = new Map<string, IKycProviderAdapter>();
export function registerKycProviderAdapter(adapter: IKycProviderAdapter): void {
  if (adapter.providerId !== 'SUMSUB') throw new Error('KYC_PROVIDER_REGISTRATION_NOT_AUTHORIZED');
  configuredAdapters.set(adapter.providerId,adapter);
}
export function resolveJurisdictionKycAdapter(country: string,preferredProviderId?: string): IKycProviderAdapter {
  const profile = getJurisdictionKycProfile(country);
  if (!profile || profile.providerAdapter === 'NOT_CONFIGURED' ||
      (preferredProviderId !== undefined && preferredProviderId.trim().toUpperCase() !== profile.providerAdapter)) throw new Error('JURISDICTION_KYC_PROVIDER_MISMATCH');
  const adapter = getKycProviderAdapter(profile.providerAdapter);
  if (!adapter.isConfigured) throw new Error('KYC_PROVIDER_NOT_CONFIGURED');
  return adapter;
}

export class UnconfiguredExternalKycAdapter implements IKycProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly isConfigured = false;

  constructor(providerId: string, providerName: string) {
    this.providerId = providerId;
    this.providerName = providerName;
  }

  async createVerification(_input: CreateVerificationInput): Promise<KycVerificationResult> {
    throw new Error(`PROVIDER_NOT_CONFIGURED: External KYC provider '${this.providerName}' is not configured in this environment.`);
  }

  async getVerification(_verificationId: string): Promise<KycVerificationResult> {
    throw new Error(`PROVIDER_NOT_CONFIGURED: External KYC provider '${this.providerName}' is not configured in this environment.`);
  }

  async submitDocuments(_input: SubmitDocumentsInput): Promise<KycVerificationResult> {
    throw new Error(`PROVIDER_NOT_CONFIGURED: External KYC provider '${this.providerName}' is not configured in this environment.`);
  }

  async checkStatus(_verificationId: string): Promise<KycVerificationResult> {
    throw new Error(`PROVIDER_NOT_CONFIGURED: External KYC provider '${this.providerName}' is not configured in this environment.`);
  }

  async cancelVerification(_verificationId: string): Promise<boolean> {
    return false;
  }

  async handleWebhook(_payload: unknown, _headers: Record<string, string>): Promise<WebhookProcessingResult> {
    return {
      handled: false,
      eventType: 'PROVIDER_NOT_CONFIGURED',
      error: `External KYC provider '${this.providerName}' webhook rejected: provider not configured.`,
    };
  }

  normalizeResult(_rawResult: unknown): KycVerificationResult {
    return {
      verificationId: 'unconfigured',
      accountId: 'unconfigured',
      providerName: this.providerName,
      status: 'PROVIDER_NOT_CONFIGURED',
    };
  }

  verifyWebhook(_payload: string | Buffer, _signature: string, _secret: string): boolean {
    // Fail-closed on unconfigured provider webhooks
    return false;
  }

  async reverify(_accountId: string): Promise<KycVerificationResult> {
    throw new Error(`PROVIDER_NOT_CONFIGURED: External KYC provider '${this.providerName}' is not configured in this environment.`);
  }
}

export const KNOWN_EXTERNAL_KYC_PROVIDERS: Readonly<Record<string, string>> = Object.freeze({
  STRIPE_IDENTITY: 'Stripe Identity',
  VERIFF: 'Veriff Identity Verification',
  PERSONA: 'Persona Identity',
  SUMSUB: 'Sumsub Global Verification',
});

export function getKycProviderAdapter(providerId: string): IKycProviderAdapter {
  const normalized = providerId.trim().toUpperCase();
  if (normalized === 'MANUAL_INTERNAL' || normalized === 'INTERNAL') {
    // Return manual adapter
    const { ManualInternalKycAdapter } = require('./manual-internal-adapter');
    return new ManualInternalKycAdapter();
  }

  if (normalized === 'SUMSUB') {
    const configured = configuredAdapters.get(normalized);
    if (configured) return configured;
    const { SumsubKycProviderAdapter } = require('./sumsub-kyc-adapter');
    return new SumsubKycProviderAdapter();
  }

  const knownName = KNOWN_EXTERNAL_KYC_PROVIDERS[normalized] || `External Provider (${providerId})`;
  return new UnconfiguredExternalKycAdapter(normalized, knownName);
}
