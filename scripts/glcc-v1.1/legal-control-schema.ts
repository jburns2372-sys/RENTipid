/**
 * RENTipid GLCC v1.1 — Legal & Compliance Translation Control Schema
 *
 * Defines machine-readable interfaces, authority levels, approval lifecycles,
 * and immutable evidence structures for Class C controlled legal content.
 */

export type LegalAuthorityLevel =
  | 'AUTHORITATIVE_SOURCE'
  | 'APPROVED_TRANSLATION'
  | 'REFERENCE_TRANSLATION'
  | 'DRAFT_TRANSLATION';

export type LegalApprovalStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUPERSEDED'
  | 'REVOKED';

export type LegalContentType =
  | 'TERMS_OF_SERVICE'
  | 'PRIVACY_POLICY'
  | 'KYC_DISCLOSURE'
  | 'REGULATORY_NOTICE'
  | 'JURISDICTION_NOTICE'
  | 'PAYMENT_DISCLAIMER'
  | 'SAFETY_COMPLIANCE'
  | 'MANDATORY_CONSENT'
  | 'CONTRACTUAL_NOTICE';

export interface LegalSourceRecord {
  sourceId: string;
  contentType: LegalContentType;
  title: string;
  authoritativeLocale: string;
  sourceVersion: string;
  sourceChecksum: string;
  content: string;
  effectiveDate: string;
  expiryDate?: string;
  jurisdictions: string[];
  status: 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  supersedesSourceId?: string;
  isAuthoritative: true;
  approvalAuthority: string;
  retentionReference: string;
}

export interface ControlledTranslationRecord {
  translationId: string;
  sourceId: string;
  sourceVersion: string;
  sourceChecksum: string;
  targetLocale: string;
  translationVersion: string;
  translationChecksum: string;
  translatedContent: string;
  authorityLevel: LegalAuthorityLevel;
  workflowState: string;
  translatorReference: string;
  linguisticReviewerReference: string;
  legalReviewerReference: string;
  complianceReviewerReference?: string;
  approvalStatus: LegalApprovalStatus;
  approvalReference: string;
  approvalDate: string;
  jurisdictions: string[];
  effectiveDate: string;
  expiryDate?: string;
  supersededBy?: string;
  isAiDraft?: boolean;
}

export interface LegalResolutionInput {
  sourceId: string;
  targetLocale: string;
  jurisdiction: string;
  asOfDate?: string;
}

export interface LegalResolutionOutput {
  sourceId: string;
  resolvedLocale: string;
  resolvedContent: string;
  authorityLevel: LegalAuthorityLevel;
  isAuthoritative: boolean;
  isFallback: boolean;
  fallbackReason?: string;
  sourceRecord: LegalSourceRecord;
  translationRecord?: ControlledTranslationRecord;
  status: 'RESOLVED_LOCALIZED' | 'RESOLVED_FALLBACK' | 'BLOCKED';
  reason: string;
}

export interface LegalSourceValidationResult {
  isValid: boolean;
  errorCount: number;
  errors: string[];
}

export interface ControlledTranslationValidationResult {
  isValid: boolean;
  isOutdated: boolean;
  errorCount: number;
  errors: string[];
  classification: 'APPROVED' | 'SOURCE_OUTDATED' | 'INVALID' | 'UNAPPROVED_DRAFT';
}
