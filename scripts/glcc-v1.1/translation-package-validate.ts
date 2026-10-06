/**
 * RENTipid GLCC v1.1 — Translation Package Validator
 *
 * Enforces zero-tolerance validation rules on Translation Work Packages:
 * - Canonical key completeness, exact key parity, zero extra or duplicate keys
 * - Source-drift detection via cryptographic checksum verification
 * - Placeholder / ICU message-format variable integrity
 * - Unicode replacement character (\uFFFD) detection
 * - Controlled legal & compliance Class C approval guard
 * - AI draft boundary enforcement
 */

import {
  GLCC_CANONICAL_KEYS,
  CANONICAL_EN_PH_MESSAGES,
} from '../../src/lib/glcc/i18n/contracts/index';
import {
  calculateCanonicalKeyChecksum,
  calculateSourceMessageChecksum,
  extractPlaceholderSignature,
} from './translation-source-export';
import {
  TranslationValidationResult,
  TranslationWorkPackage,
} from './translation-work-package-schema';

/**
 * Checks for syntax errors in message templates (unbalanced braces, etc.).
 */
export function checkMessageFormatSyntax(template: string): string | null {
  if (!template) return null;
  let depth = 0;
  for (let i = 0; i < template.length; i++) {
    const char = template[i];
    if (char === '{') {
      depth++;
      if (depth > 2) {
        return `Excessive nesting of braces at position ${i}`;
      }
    } else if (char === '}') {
      depth--;
      if (depth < 0) {
        return `Unmatched closing brace at position ${i}`;
      }
    }
  }
  if (depth !== 0) {
    return `Unclosed opening brace detected in template`;
  }
  return null;
}

/**
 * Validates a Translation Work Package against the live canonical reference.
 */
export function validateTranslationWorkPackage(
  pkg: TranslationWorkPackage,
  options?: {
    allowIncompleteDraft?: boolean;
  }
): TranslationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const currentKeys = [...GLCC_CANONICAL_KEYS].sort();
  const currentKeyChecksum = calculateCanonicalKeyChecksum(currentKeys);
  const currentMessageChecksum = calculateSourceMessageChecksum(
    currentKeys,
    CANONICAL_EN_PH_MESSAGES
  );

  let hasSourceDrift = false;
  let formatErrorCount = 0;
  let unicodeErrorCount = 0;
  let placeholderMismatchCount = 0;
  let controlledContentPendingCount = 0;
  let translatedRequiredCount = 0;
  let missingRequiredCount = 0;

  // 1. Package Structure & Metadata Check
  if (!pkg || typeof pkg !== 'object') {
    return {
      status: 'INVALID',
      isValid: false,
      hasSourceDrift: false,
      errorCount: 1,
      warningCount: 0,
      canonicalKeyCount: currentKeys.length,
      translatedRequiredCount: 0,
      missingRequiredCount: currentKeys.length,
      extraKeyCount: 0,
      placeholderMismatchCount: 0,
      formatErrorCount: 0,
      unicodeErrorCount: 0,
      controlledContentPendingCount: 0,
      errors: ['Work package is null or malformed.'],
      warnings: [],
    };
  }

  // 2. Source-Drift Protection
  if (pkg.canonicalKeyChecksum !== currentKeyChecksum) {
    hasSourceDrift = true;
    errors.push(
      `SOURCE_DRIFT: Canonical key checksum mismatch (expected: ${currentKeyChecksum.slice(0, 12)}..., found: ${pkg.canonicalKeyChecksum?.slice(0, 12)}...).`
    );
  }

  if (pkg.sourceMessageChecksum !== currentMessageChecksum) {
    hasSourceDrift = true;
    errors.push(
      `SOURCE_DRIFT: Source message checksum mismatch (expected: ${currentMessageChecksum.slice(0, 12)}..., found: ${pkg.sourceMessageChecksum?.slice(0, 12)}...).`
    );
  }

  // 3. Key Count & Key Set Integrity
  const pkgMessageKeys = Object.keys(pkg.messages || {}).sort();
  const pkgKeySet = new Set(pkgMessageKeys);
  const canonicalKeySet = new Set(currentKeys);

  const missingKeys: string[] = [];
  for (const k of currentKeys) {
    if (!pkgKeySet.has(k)) {
      missingKeys.push(k);
    }
  }

  const extraKeys: string[] = [];
  for (const k of pkgMessageKeys) {
    if (!canonicalKeySet.has(k)) {
      extraKeys.push(k);
    }
  }

  if (missingKeys.length > 0) {
    errors.push(
      `Missing ${missingKeys.length} canonical keys (e.g. ${missingKeys.slice(0, 3).join(', ')}).`
    );
  }

  if (extraKeys.length > 0) {
    errors.push(
      `Detected ${extraKeys.length} unknown extra keys (e.g. ${extraKeys.slice(0, 3).join(', ')}).`
    );
  }

  if (pkg.canonicalKeyCount !== currentKeys.length) {
    errors.push(
      `Canonical key count mismatch: package specifies ${pkg.canonicalKeyCount}, expected ${currentKeys.length}.`
    );
  }

  // 4. Message-by-Message Verification
  for (const key of currentKeys) {
    const msg = pkg.messages?.[key];
    if (!msg) continue;

    const targetText = msg.targetText ?? '';
    const hasTranslation = targetText.trim().length > 0;

    if (hasTranslation) {
      translatedRequiredCount++;

      // Unicode replacement char check (U+FFFD)
      if (targetText.includes('\uFFFD') || targetText.includes('\\uFFFD')) {
        unicodeErrorCount++;
        errors.push(`Key "${key}": contains invalid Unicode replacement character (U+FFFD).`);
      }

      // Format syntax check
      const syntaxError = checkMessageFormatSyntax(targetText);
      if (syntaxError) {
        formatErrorCount++;
        errors.push(`Key "${key}": invalid message format - ${syntaxError}.`);
      }

      // Placeholder / interpolation signature check
      const expectedPlaceholders = msg.placeholderSignature || [];
      const actualPlaceholders = extractPlaceholderSignature(targetText);
      const isPlaceholderMatch =
        expectedPlaceholders.length === actualPlaceholders.length &&
        expectedPlaceholders.every((p, idx) => p === actualPlaceholders[idx]);

      if (!isPlaceholderMatch) {
        placeholderMismatchCount++;
        errors.push(
          `Key "${key}": placeholder mismatch. Expected: [${expectedPlaceholders.join(', ')}], found: [${actualPlaceholders.join(', ')}].`
        );
      }
    } else {
      missingRequiredCount++;
      if (!options?.allowIncompleteDraft && pkg.workflowState !== 'DRAFT') {
        errors.push(`Key "${key}": missing required translation text.`);
      }
    }

    // 5. Controlled Legal / Compliance Guard (Class C)
    if (msg.contentClass === 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE') {
      if (msg.legalApprovalStatus !== 'APPROVED') {
        controlledContentPendingCount++;
        if (pkg.workflowState === 'APPROVED_FOR_QA') {
          errors.push(
            `Key "${key}": Class C legal/compliance content cannot enter APPROVED_FOR_QA without approved status (current: ${msg.legalApprovalStatus}).`
          );
        }
      } else {
        // Must have approval reference and reviewer
        if (!msg.legalApprovalReference || !msg.reviewerReference) {
          errors.push(
            `Key "${key}": Class C approved content missing required legalApprovalReference or reviewerReference.`
          );
        }
      }

      // AI Draft boundary: AI draft cannot self-approve legal content
      if (msg.isAiDraft && msg.legalApprovalStatus === 'APPROVED' && (!msg.reviewerReference || msg.reviewerReference.includes('AI'))) {
        errors.push(
          `Key "${key}": AI draft cannot self-approve legal/compliance content without accredited human reviewer.`
        );
      }
    }
  }

  // 6. Workflow State Transition Rules
  if (pkg.workflowState === 'APPROVED_FOR_QA') {
    if (missingRequiredCount > 0) {
      errors.push(
        `Cannot enter APPROVED_FOR_QA with ${missingRequiredCount} untranslated keys.`
      );
    }
    if (controlledContentPendingCount > 0) {
      errors.push(
        `Cannot enter APPROVED_FOR_QA with ${controlledContentPendingCount} unapproved Class C legal keys.`
      );
    }
  }

  const errorCount = errors.length;
  const warningCount = warnings.length;
  const isValid = errorCount === 0;
  const status = hasSourceDrift ? 'SOURCE_DRIFT' : isValid ? 'VALID' : 'INVALID';

  return {
    status,
    isValid,
    hasSourceDrift,
    errorCount,
    warningCount,
    canonicalKeyCount: currentKeys.length,
    translatedRequiredCount,
    missingRequiredCount,
    extraKeyCount: extraKeys.length,
    placeholderMismatchCount,
    formatErrorCount,
    unicodeErrorCount,
    controlledContentPendingCount,
    errors,
    warnings,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('translation-package-validate.ts')) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: tsx translation-package-validate.ts <packagePath>');
    process.exit(1);
  }
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const res = validateTranslationWorkPackage(pkg);
  console.log(`Validation Status: ${res.status}`);
  console.log(`Valid: ${res.isValid} | Errors: ${res.errorCount} | Warnings: ${res.warningCount}`);
  if (res.errors.length > 0) {
    console.error('Errors:\n' + res.errors.slice(0, 10).map((e: string) => ` - ${e}`).join('\n'));
  }
  process.exit(res.isValid ? 0 : 1);
}

