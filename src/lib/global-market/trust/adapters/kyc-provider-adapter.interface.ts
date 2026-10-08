/**
 * RENTipid GLOBAL-MKT / v2.0 — KYC Provider Adapter Interface
 *
 * Implements the provider-neutral abstraction layer for identity verification,
 * document analysis, and biometric checks.
 */

import { type VerificationState } from '../contracts/verification-state';
import { type DocumentCategory } from '../contracts/document-requirement';

export interface CreateVerificationInput {
  readonly accountId: string;
  readonly jurisdictionCode: string;
  readonly subjectType: 'INDIVIDUAL' | 'BUSINESS';
  readonly requiredDocuments: readonly DocumentCategory[];
  readonly redirectUrl?: string;
}

export interface SubmitDocumentsInput {
  readonly verificationId: string;
  readonly accountId: string;
  readonly documents: readonly {
    readonly category: DocumentCategory;
    readonly fileUrl: string;
    readonly mimeType: string;
  }[];
}

export interface KycVerificationResult {
  readonly verificationId: string;
  readonly accountId: string;
  readonly providerName: string;
  readonly status: VerificationState;
  readonly rawProviderStatus?: string;
  readonly verifiedAt?: string | null;
  readonly expiresAt?: string | null;
  readonly rejectionReason?: string | null;
  readonly flags?: readonly string[];
}

export interface WebhookProcessingResult {
  readonly handled: boolean;
  readonly eventType: string;
  readonly verificationResult?: KycVerificationResult;
  readonly error?: string;
}

export interface IKycProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly isConfigured: boolean;
  createVerificationSession?(verificationId: string, accountId: string): Promise<{
    readonly verificationId: string;
    readonly sessionToken: string;
    readonly expiresAt: string;
  }>;

  createVerification(input: CreateVerificationInput): Promise<KycVerificationResult>;
  getVerification(verificationId: string): Promise<KycVerificationResult>;
  submitDocuments(input: SubmitDocumentsInput): Promise<KycVerificationResult>;
  checkStatus(verificationId: string): Promise<KycVerificationResult>;
  cancelVerification(verificationId: string): Promise<boolean>;
  handleWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookProcessingResult>;
  normalizeResult(rawResult: unknown): KycVerificationResult;
  verifyWebhook(payload: string | Buffer, signature: string, secret: string): boolean;
  reverify(accountId: string): Promise<KycVerificationResult>;
}
