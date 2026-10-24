/**
 * RENTipid GLCC v1.0 — Dynamic Content Translation Contracts & Data Models
 *
 * Work Package: GLCC-P7
 *
 * Implements:
 * 1. Content classification separating Ordinary Dynamic content from Regulated Legal content.
 * 2. Original-source retention: original provider/user text is immutable truth.
 * 3. SHA-256 source hashing to detect source edits and immediately invalidate stale derivatives (TRN-02).
 * 4. Legal translation approval provenance ensuring machine translation cannot auto-publish legal policies (TRN-03).
 * 5. Provider-neutral translation provider interface and health tracking.
 * 6. Zero persistent schema changes at this work-package stage.
 */

export type ContentClassification = 'ORDINARY_DYNAMIC' | 'REGULATED_LEGAL';

export type DynamicTranslationStatus =
  | 'ACTIVE'
  | 'STALE'
  | 'INVALIDATED'
  | 'PENDING_APPROVAL'
  | 'REJECTED';

export interface DynamicTranslationRecord {
  readonly id: string;
  readonly entityType: string; // e.g. "listing", "review", "support_message"
  readonly entityId: string;
  readonly field: string; // e.g. "title", "description"
  readonly sourceLocale: string;
  readonly targetLocale: string;
  readonly sourceText: string;
  readonly sourceHash: string; // SHA-256 of sourceText
  readonly translatedText: string;
  readonly providerRef: string;
  readonly classification: ContentClassification;
  readonly approvalActorId?: string;
  readonly approvedAt?: string;
  readonly status: DynamicTranslationStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TranslateTextInput {
  readonly text: string;
  readonly sourceLocale: string;
  readonly targetLocale: string;
  readonly classification?: ContentClassification;
  readonly contextHint?: string;
}

export interface TranslationProviderHealth {
  readonly status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  readonly latencyMs?: number;
  readonly providerId: string;
}

export interface DynamicTranslationProvider {
  readonly providerId: string;
  readonly providerName: string;
  translate(input: TranslateTextInput): Promise<{
    readonly translatedText: string;
    readonly detectedSourceLocale?: string;
    readonly modelVersion: string;
  }>;
  getHealth(): Promise<TranslationProviderHealth>;
}

export interface LegalApprovalRecord {
  readonly documentType: string; // e.g. "rental_agreement_v1", "terms_of_service"
  readonly sourceVersion: string;
  readonly targetLocale: string;
  readonly approvedByActorId: string;
  readonly approvedAt: string;
  readonly legalApprovalHash: string;
  readonly status: 'APPROVED' | 'REVOKED';
}
