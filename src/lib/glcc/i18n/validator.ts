/**
 * RENTipid GLCC v1.0.1 — Translation Bundle Validator (P4 Non-Production Completeness Policy)
 *
 * Provides deterministic static translation bundle validation:
 * - Checks missing canonical keys against reference bundle (en-PH)
 * - PRODUCTION_READY locales: strictly requires 100% key coverage (0 missing, 0 empty)
 * - QA_REQUIRED / TRANSLATION_IN_PROGRESS locales: allows partial coverage, reporting exact missing/present keys
 * - REGISTERED locales: may have zero translation content
 * - Detects placeholder mismatches between source and target templates for all present keys
 * - Verifies bundle structure, locale tag, and text direction
 */

import {
  GLCC_CANONICAL_KEYS,
  type BundleValidationOptions,
  type BundleValidationResult,
  type TranslationBundle,
} from './contracts';
import { EN_PH_BUNDLE } from './locales/en-PH';

/**
 * Extracts named placeholder tokens from a template string (e.g. '{count}' -> ['count']).
 */
export function extractPlaceholders(template: string): string[] {
  if (!template || typeof template !== 'string') return [];
  const matches = template.matchAll(/\{(\w+)\}/g);
  const placeholders: string[] = [];
  for (const m of matches) {
    if (m[1] && !placeholders.includes(m[1])) {
      placeholders.push(m[1]);
    }
  }
  return placeholders.sort();
}

/**
 * Validates a target translation bundle against a reference bundle (defaulting to canonical en-PH).
 *
 * Enforces:
 * 1. For PRODUCTION_READY bundles (or default): 100% required key coverage (0 missing, 0 empty).
 * 2. For QA_REQUIRED / TRANSLATION_IN_PROGRESS (or allowPartial: true): bundle structure is valid if
 *    extraKeys === 0 and placeholderMismatches === 0, while missingKeys and coverage are truthfully reported.
 */
export function validateTranslationBundle(
  bundle: TranslationBundle,
  referenceBundle: TranslationBundle = EN_PH_BUNDLE,
  options?: BundleValidationOptions
): BundleValidationResult {
  const missingKeys: string[] = [];
  const extraKeys: string[] = [];
  const emptyKeys: string[] = [];
  const placeholderMismatches: Array<{
    key: string;
    expected: string[];
    actual: string[];
  }> = [];

  if (!bundle || typeof bundle !== 'object') {
    return {
      isValid: false,
      locale: 'unknown',
      totalRequiredKeys: 0,
      presentKeysCount: 0,
      missingKeys: ['[BUNDLE_MALFORMED]'],
      extraKeys: [],
      emptyKeys: [],
      coveragePercentage: 0,
      placeholderMismatches: [],
    };
  }

  const refKeys = Object.keys(referenceBundle.messages);
  const totalRequiredKeys = refKeys.length;
  let presentKeysCount = 0;

  // 1. Check for missing required canonical keys from the reference bundle
  for (const key of refKeys) {
    if (!Object.prototype.hasOwnProperty.call(bundle.messages, key)) {
      missingKeys.push(key);
    } else {
      const val = bundle.messages[key];
      if (typeof val !== 'string' || val.trim() === '') {
        missingKeys.push(key);
        emptyKeys.push(key);
      } else {
        presentKeysCount++;
      }
    }
  }

  // 2. Check for extra keys not in canonical list
  const canonicalSet = new Set<string>(GLCC_CANONICAL_KEYS);
  for (const key of Object.keys(bundle.messages)) {
    if (!canonicalSet.has(key)) {
      extraKeys.push(key);
    }
  }

  // 3. Check placeholder parity for all PRESENT keys
  for (const [key, refMessage] of Object.entries(referenceBundle.messages)) {
    if (Object.prototype.hasOwnProperty.call(bundle.messages, key)) {
      const targetMessage = bundle.messages[key];
      if (typeof targetMessage === 'string' && targetMessage.trim() !== '') {
        const expected = extractPlaceholders(refMessage);
        const actual = extractPlaceholders(targetMessage);

        const isMatch =
          expected.length === actual.length &&
          expected.every((p, i) => p === actual[i]);

        if (!isMatch) {
          placeholderMismatches.push({
            key,
            expected,
            actual,
          });
        }
      }
    }
  }

  const coveragePercentage = totalRequiredKeys > 0
    ? Number(((presentKeysCount / totalRequiredKeys) * 100).toFixed(2))
    : 0;

  // Determine release status rule
  const isProduction =
    options?.releaseStatus === 'PRODUCTION_READY' ||
    bundle.releaseStatus === 'PRODUCTION_READY' ||
    (bundle.locale === 'en-PH' && !options?.allowPartial);

  const isPartialAllowed =
    options?.allowPartial === true ||
    bundle.releaseStatus === 'QA_REQUIRED' ||
    bundle.releaseStatus === 'TRANSLATION_IN_PROGRESS' ||
    bundle.isFixture === true;

  const isValid = isPartialAllowed && !isProduction
    ? extraKeys.length === 0 &&
      placeholderMismatches.length === 0 &&
      (bundle.direction === 'ltr' || bundle.direction === 'rtl') &&
      typeof bundle.locale === 'string' &&
      bundle.locale.length > 0
    : missingKeys.length === 0 &&
      extraKeys.length === 0 &&
      emptyKeys.length === 0 &&
      placeholderMismatches.length === 0 &&
      (bundle.direction === 'ltr' || bundle.direction === 'rtl') &&
      typeof bundle.locale === 'string' &&
      bundle.locale.length > 0;

  return {
    isValid,
    locale: bundle.locale,
    totalRequiredKeys,
    presentKeysCount,
    missingKeys,
    extraKeys,
    emptyKeys,
    coveragePercentage,
    placeholderMismatches,
  };
}

/**
 * Validates that the canonical source bundle en-PH has zero missing keys against GLCC_CANONICAL_KEYS.
 */
export function validateCanonicalSourceCompleteness(
  sourceBundle: TranslationBundle = EN_PH_BUNDLE
): { isValid: boolean; missingCanonicalKeys: string[]; emptyKeys: string[] } {
  const missingCanonicalKeys: string[] = [];
  const emptyKeys: string[] = [];

  for (const key of GLCC_CANONICAL_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(sourceBundle.messages, key)) {
      missingCanonicalKeys.push(key);
    } else {
      const val = sourceBundle.messages[key];
      if (typeof val !== 'string' || val.trim() === '') {
        missingCanonicalKeys.push(key);
        emptyKeys.push(key);
      }
    }
  }

  return {
    isValid: missingCanonicalKeys.length === 0 && emptyKeys.length === 0,
    missingCanonicalKeys,
    emptyKeys,
  };
}
