/**
 * RENTipid GLCC v1.1 — Translation Work Package Schema
 *
 * Defines machine-readable types, workflow states, content classification,
 * and data structures for the language-neutral translation factory.
 */

export type TranslationContentClass =
  | 'CLASS_A_STANDARD_UI'
  | 'CLASS_B_SYSTEM_TRANSACTIONAL'
  | 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE'
  | 'CLASS_D_USER_GENERATED_BOUNDARY'
  | 'CLASS_E_AI_GENERATED_BOUNDARY'
  | 'CLASSIFICATION_REVIEW_REQUIRED';

export type TranslationWorkflowState =
  | 'SOURCE_LOCKED'
  | 'DRAFT'
  | 'LINGUISTIC_REVIEW'
  | 'COMPLIANCE_REVIEW'
  | 'APPROVED_FOR_QA';

export type TranslationReviewStatus =
  | 'UNTRANSLATED'
  | 'DRAFT'
  | 'LINGUISTIC_REVIEW_PENDING'
  | 'LINGUISTIC_REVIEW_PASSED'
  | 'COMPLIANCE_REVIEW_PENDING'
  | 'COMPLIANCE_REVIEW_PASSED'
  | 'APPROVED';

export type LegalApprovalStatus =
  | 'NOT_APPLICABLE'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface TranslationWorkPackageMessage {
  key: string;
  sourceText: string;
  targetText: string;
  contentClass: TranslationContentClass;
  required: boolean;
  placeholderSignature: string[];
  reviewStatus: TranslationReviewStatus;
  translatorReference: string;
  reviewerReference: string;
  notes: string;
  authoritativeSourceId?: string;
  authoritativeSourceVersion?: string;
  jurisdiction?: string;
  legalApprovalRequired: boolean;
  legalApprovalStatus: LegalApprovalStatus;
  legalApprovalReference?: string;
  isAiDraft?: boolean;
}

export interface TranslationWorkPackage {
  packageVersion: string;
  targetLocale: string;
  sourceLocale: string;
  canonicalKeyCount: number;
  canonicalKeyChecksum: string;
  sourceMessageChecksum: string;
  generatedAt: string;
  workflowState: TranslationWorkflowState;
  messages: Record<string, TranslationWorkPackageMessage>;
}

export interface TranslationValidationResult {
  status: 'VALID' | 'INVALID' | 'SOURCE_DRIFT';
  isValid: boolean;
  hasSourceDrift: boolean;
  errorCount: number;
  warningCount: number;
  canonicalKeyCount: number;
  translatedRequiredCount: number;
  missingRequiredCount: number;
  extraKeyCount: number;
  placeholderMismatchCount: number;
  formatErrorCount: number;
  unicodeErrorCount: number;
  controlledContentPendingCount: number;
  errors: string[];
  warnings: string[];
}
