/**
 * RENTipid GLCC v1.1 — Controlled Legal Translation Validator & Resolver
 *
 * Implements strict zero-tolerance validation of Class C controlled legal content,
 * version consistency guards, jurisdiction matching, AI draft boundaries,
 * tamper detection, and authoritative fallback resolution.
 */

import {
  ControlledTranslationRecord,
  ControlledTranslationValidationResult,
  LegalResolutionInput,
  LegalResolutionOutput,
  LegalSourceRecord,
} from './legal-control-schema';
import {
  calculateLegalContentChecksum,
  LegalSourceRegistry,
} from './legal-source-registry';

/**
 * Validates a ControlledTranslationRecord against its authoritative source document.
 */
export function validateControlledTranslation(
  translation: ControlledTranslationRecord,
  source: LegalSourceRecord,
  options?: {
    jurisdiction?: string;
    asOfDate?: string;
  }
): ControlledTranslationValidationResult {
  const errors: string[] = [];
  let isOutdated = false;
  let classification: ControlledTranslationValidationResult['classification'] = 'APPROVED';

  if (!translation || typeof translation !== 'object') {
    return {
      isValid: false,
      isOutdated: false,
      errorCount: 1,
      errors: ['Controlled translation record is null or malformed.'],
      classification: 'INVALID',
    };
  }

  if (!source || typeof source !== 'object') {
    return {
      isValid: false,
      isOutdated: false,
      errorCount: 1,
      errors: ['Authoritative source record is missing or null.'],
      classification: 'INVALID',
    };
  }

  // 1. Source Identity Match
  if (translation.sourceId !== source.sourceId) {
    errors.push(
      `SOURCE_MISMATCH: Translation sourceId "${translation.sourceId}" does not match authoritative source "${source.sourceId}".`
    );
  }

  // 2. Source Version Consistency & Source-Drift Guard
  if (translation.sourceVersion !== source.sourceVersion) {
    isOutdated = true;
    classification = 'SOURCE_OUTDATED';
    errors.push(
      `SOURCE_OUTDATED: Translation references sourceVersion "${translation.sourceVersion}" but current authoritative version is "${source.sourceVersion}".`
    );
  }

  if (translation.sourceChecksum !== source.sourceChecksum) {
    isOutdated = true;
    classification = 'SOURCE_OUTDATED';
    errors.push(
      `SOURCE_OUTDATED: Translation references sourceChecksum "${translation.sourceChecksum?.slice(0, 16)}..." which differs from active source "${source.sourceChecksum?.slice(0, 16)}...".`
    );
  }

  // 3. Translation Checksum / Tamper Detection
  if (translation.translatedContent && translation.translationChecksum) {
    const computedChecksum = calculateLegalContentChecksum(translation.translatedContent);
    if (computedChecksum !== translation.translationChecksum) {
      classification = 'INVALID';
      errors.push(
        `TAMPER_DETECTED: Translated content was modified after approval. Computed checksum "${computedChecksum.slice(0, 16)}..." does not match approved translationChecksum "${translation.translationChecksum.slice(0, 16)}...".`
      );
    }
  } else {
    errors.push('Missing translatedContent or translationChecksum.');
  }

  // 4. Approval Status Lifecycle Guard
  if (translation.approvalStatus === 'PENDING') {
    classification = 'UNAPPROVED_DRAFT';
    errors.push('APPROVAL_PENDING: Translation is pending legal approval and cannot be used as authoritative content.');
  } else if (translation.approvalStatus === 'REJECTED') {
    classification = 'INVALID';
    errors.push('APPROVAL_REJECTED: Translation was rejected by legal counsel.');
  } else if (translation.approvalStatus === 'REVOKED') {
    classification = 'INVALID';
    errors.push('APPROVAL_REVOKED: Translation approval was revoked.');
  } else if (translation.approvalStatus === 'SUPERSEDED') {
    classification = 'INVALID';
    errors.push('APPROVAL_SUPERSEDED: Translation was superseded by a newer version.');
  } else if (translation.approvalStatus !== 'APPROVED') {
    classification = 'INVALID';
    errors.push(`INVALID_APPROVAL_STATUS: Status "${translation.approvalStatus}" is not approved.`);
  }

  // 5. Reviewer and Approval Reference Integrity
  if (!translation.legalReviewerReference || translation.legalReviewerReference.trim() === '') {
    errors.push('Missing required legalReviewerReference.');
  }

  if (!translation.approvalReference || translation.approvalReference.trim() === '') {
    errors.push('Missing required approvalReference.');
  }

  // 6. AI Draft Authority Boundary Guard
  if (
    translation.isAiDraft &&
    (!translation.legalReviewerReference || translation.legalReviewerReference.toUpperCase().includes('AI'))
  ) {
    classification = 'UNAPPROVED_DRAFT';
    errors.push(
      'AI_AUTHORITY_VIOLATION: AI-generated translations cannot self-approve or become authoritative without human legal counsel review.'
    );
  }

  // 7. Jurisdiction Guard
  if (options?.jurisdiction) {
    const requestedJur = options.jurisdiction.toUpperCase();
    const hasJurMatch =
      translation.jurisdictions.includes(requestedJur) ||
      translation.jurisdictions.includes('GLOBAL');
    if (!hasJurMatch) {
      classification = 'INVALID';
      errors.push(
        `JURISDICTION_MISMATCH: Translation approved for [${translation.jurisdictions.join(', ')}] does not cover requested jurisdiction "${requestedJur}".`
      );
    }
  }

  // 8. Effective Date and Expiry Evaluation
  const checkDate = options?.asOfDate ? new Date(options.asOfDate) : new Date();
  if (translation.effectiveDate) {
    const effDate = new Date(translation.effectiveDate);
    if (effDate > checkDate) {
      errors.push(`FUTURE_EFFECTIVE_DATE: Translation effectiveDate "${translation.effectiveDate}" is in the future.`);
    }
  }

  if (translation.expiryDate) {
    const expDate = new Date(translation.expiryDate);
    if (checkDate > expDate) {
      errors.push(`TRANSLATION_EXPIRED: Translation expired on "${translation.expiryDate}".`);
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    isOutdated,
    errorCount: errors.length,
    errors,
    classification,
  };
}

/**
 * Resolves authoritative legal content for a user, failing closed to authoritative source.
 */
export function resolveAuthoritativeLegalContent(
  input: LegalResolutionInput,
  registry: LegalSourceRegistry,
  translations: ControlledTranslationRecord[] = []
): LegalResolutionOutput {
  const asOf = input.asOfDate ?? new Date().toISOString();

  // 1. Locate authoritative source document
  const source = registry.get(input.sourceId);
  if (!source) {
    return {
      sourceId: input.sourceId,
      resolvedLocale: 'none',
      resolvedContent: '',
      authorityLevel: 'DRAFT_TRANSLATION',
      isAuthoritative: false,
      isFallback: false,
      sourceRecord: null as any,
      status: 'BLOCKED',
      reason: `Authoritative source "${input.sourceId}" not found in legal registry.`,
    };
  }

  // 2. If target locale is already authoritative source locale
  if (input.targetLocale.toLowerCase() === source.authoritativeLocale.toLowerCase()) {
    return {
      sourceId: source.sourceId,
      resolvedLocale: source.authoritativeLocale,
      resolvedContent: source.content,
      authorityLevel: 'AUTHORITATIVE_SOURCE',
      isAuthoritative: true,
      isFallback: false,
      sourceRecord: source,
      status: 'RESOLVED_LOCALIZED',
      reason: 'Authoritative source language directly requested.',
    };
  }

  // 3. Search for approved translation in target locale
  const candidateTranslations = translations.filter(
    (t) =>
      t.sourceId === source.sourceId &&
      t.targetLocale.toLowerCase() === input.targetLocale.toLowerCase() &&
      t.approvalStatus === 'APPROVED'
  );

  for (const trans of candidateTranslations) {
    const valResult = validateControlledTranslation(trans, source, {
      jurisdiction: input.jurisdiction,
      asOfDate: asOf,
    });

    if (valResult.isValid) {
      return {
        sourceId: source.sourceId,
        resolvedLocale: trans.targetLocale,
        resolvedContent: trans.translatedContent,
        authorityLevel: 'APPROVED_TRANSLATION',
        isAuthoritative: true,
        isFallback: false,
        sourceRecord: source,
        translationRecord: trans,
        status: 'RESOLVED_LOCALIZED',
        reason: 'Valid approved localized legal translation resolved.',
      };
    }
  }

  // 4. Fail-closed fallback: Preserve authoritative source
  return {
    sourceId: source.sourceId,
    resolvedLocale: source.authoritativeLocale,
    resolvedContent: source.content,
    authorityLevel: 'AUTHORITATIVE_SOURCE',
    isAuthoritative: true,
    isFallback: true,
    fallbackReason: `Approved translation for "${input.targetLocale}" in jurisdiction "${input.jurisdiction}" is unavailable or unapproved. Authoritative source preserved.`,
    sourceRecord: source,
    status: 'RESOLVED_FALLBACK',
    reason: 'Authoritative source fallback engaged per fail-closed policy.',
  };
}
