/**
 * RENTipid GLOBAL-MKT / v2.0 — Manual / Internal KYC Provider Adapter
 *
 * Implements the concrete KYC provider adapter for platform-internal manual review.
 * Preserves existing Philippine administrative document review workflows.
 */

import {
  type IKycProviderAdapter,
  type CreateVerificationInput,
  type SubmitDocumentsInput,
  type KycVerificationResult,
  type WebhookProcessingResult,
} from './kyc-provider-adapter.interface';

export class ManualInternalKycAdapter implements IKycProviderAdapter {
  readonly providerId = 'MANUAL_INTERNAL';
  readonly providerName = 'RENTipid Internal Compliance Review';
  readonly isConfigured = true;

  async createVerification(input: CreateVerificationInput): Promise<KycVerificationResult> {
    const verificationId = `manual_kyc_${input.accountId}_${Date.now()}`;
    return {
      verificationId,
      accountId: input.accountId,
      providerName: this.providerName,
      status: 'DOCUMENTS_REQUIRED',
      rawProviderStatus: 'PENDING_DOCUMENT_SUBMISSION',
    };
  }

  async getVerification(verificationId: string): Promise<KycVerificationResult> {
    return {
      verificationId,
      accountId: 'unknown',
      providerName: this.providerName,
      status: 'UNDER_REVIEW',
      rawProviderStatus: 'PENDING_MANUAL_REVIEW',
    };
  }

  async submitDocuments(input: SubmitDocumentsInput): Promise<KycVerificationResult> {
    return {
      verificationId: input.verificationId,
      accountId: input.accountId,
      providerName: this.providerName,
      status: 'UNDER_REVIEW',
      rawProviderStatus: 'SUBMITTED_FOR_REVIEW',
    };
  }

  async checkStatus(verificationId: string): Promise<KycVerificationResult> {
    return {
      verificationId,
      accountId: 'unknown',
      providerName: this.providerName,
      status: 'UNDER_REVIEW',
    };
  }

  async cancelVerification(_verificationId: string): Promise<boolean> {
    return true;
  }

  async handleWebhook(_payload: unknown, _headers: Record<string, string>): Promise<WebhookProcessingResult> {
    return {
      handled: false,
      eventType: 'UNSUPPORTED_MANUAL_WEBHOOK',
      error: 'Manual internal adapter does not receive external inbound webhooks.',
    };
  }

  normalizeResult(rawResult: any): KycVerificationResult {
    const status = rawResult?.status || 'UNDER_REVIEW';
    return {
      verificationId: rawResult?.verificationId || 'unknown',
      accountId: rawResult?.accountId || 'unknown',
      providerName: this.providerName,
      status,
      verifiedAt: rawResult?.verifiedAt,
      expiresAt: rawResult?.expiresAt,
      rejectionReason: rawResult?.rejectionReason,
    };
  }

  verifyWebhook(_payload: string | Buffer, _signature: string, _secret: string): boolean {
    // Internal adapter has no external signature verification
    return false;
  }

  async reverify(accountId: string): Promise<KycVerificationResult> {
    return this.createVerification({
      accountId,
      jurisdictionCode: 'PH',
      subjectType: 'INDIVIDUAL',
      requiredDocuments: ['NATIONAL_ID', 'SELFIE_LIVENESS'],
    });
  }
}
