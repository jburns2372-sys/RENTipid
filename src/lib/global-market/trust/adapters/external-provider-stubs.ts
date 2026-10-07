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

  const knownName = KNOWN_EXTERNAL_KYC_PROVIDERS[normalized] || `External Provider (${providerId})`;
  return new UnconfiguredExternalKycAdapter(normalized, knownName);
}
