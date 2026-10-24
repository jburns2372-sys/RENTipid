/**
 * RENTipid GLCC v1.1 — Locale Pack Schema
 *
 * Defines machine-readable structures, metadata interfaces, and integrity
 * guarantees for generated Locale Pack release candidates.
 */

import {
  TranslationContentClass,
  TranslationReviewStatus,
  TranslationWorkflowState,
} from './translation-work-package-schema';

export type LocaleDirection = 'ltr' | 'rtl';

export type ReleaseCandidateState = 'CANDIDATE_FOR_QA';

export interface LocalePackMetadata {
  tag: string;
  languageCode: string;
  regionCode?: string;
  displayName: string;
  nativeDisplayName: string;
  script: string;
  direction: LocaleDirection;
  fallbackLocale: string;
  unicodeNormalizationRule: 'NFC';
  pluralizationMetadata: {
    categories: string[];
  };
  dateTimeFormattingMetadata: {
    calendar: string;
    dateFormat: string;
    timeFormat: string;
  };
  numberingMetadata: {
    numberingSystem: string;
    decimal: string;
    grouping: string;
  };
}

export interface LocalePackMessageItem {
  key: string;
  value: string;
  contentClass: TranslationContentClass;
  placeholderSignature: string[];
  sourceChecksum: string;
  targetChecksum: string;
  reviewStatus: TranslationReviewStatus;
  authoritativeSourceId?: string;
  authoritativeSourceVersion?: string;
  legalApprovalReference?: string;
}

export interface LocalePackValidationSummary {
  requiredKeyCount: number;
  translatedRequiredCount: number;
  missingRequiredCount: number;
  extraKeyCount: number;
  placeholderMismatchCount: number;
  formatErrorCount: number;
  unicodeErrorCount: number;
  controlledContentPendingCount: number;
}

export interface LocalePack {
  packVersion: string;
  localeTag: string;
  sourceLocale: string;
  workflowPackageVersion: string;
  canonicalKeyCount: number;
  canonicalKeyChecksum: string;
  sourceMessageChecksum: string;
  targetMessageChecksum: string;
  packChecksum: string;
  generatedAt: string;
  workflowState: TranslationWorkflowState;
  releaseCandidateState: ReleaseCandidateState;
  localeMetadata: LocalePackMetadata;
  messages: Record<string, LocalePackMessageItem>;
  validationSummary: LocalePackValidationSummary;
  approvalReferences: Record<string, string>;
}

export interface LocalePackValidationResult {
  status: 'VALID' | 'INVALID' | 'TAMPER_DETECTED' | 'SOURCE_DRIFT';
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  errors: string[];
  warnings: string[];
}
