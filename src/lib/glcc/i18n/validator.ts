/**
 * RENTipid GLCC v1.0 — Translation Bundle Validator (P3A)
 *
 * Provides deterministic static translation bundle validation:
 * - Checks missing canonical keys against reference bundle
 * - Detects placeholder mismatches between source and target templates
 * - Verifies bundle structure, locale tag, and text direction
 * - Detects invalid or empty translation values
 */

import {
  GLCC_CANONICAL_KEYS,
  type BundleValidationResult,
  type TranslationBundle,
} from './contracts';
import { EN_PH_BUNDLE } from './locales/en-PH';

/**
 * Extracts named placeholder tokens from a template string (e.g. '{count}' -> ['count']).
 */
export function extractPlaceholders(template: string): string[] {
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
 */
export function validateTranslationBundle(
  bundle: TranslationBundle,
  referenceBundle: TranslationBundle = EN_PH_BUNDLE
): BundleValidationResult {
  const missingKeys: string[] = [];
  const extraKeys: string[] = [];
  const placeholderMismatches: Array<{
    key: string;
    expected: string[];
    actual: string[];
  }> = [];

  if (!bundle || typeof bundle !== 'object') {
    return {
      isValid: false,
      locale: 'unknown',
      missingKeys: ['[BUNDLE_MALFORMED]'],
      extraKeys: [],
      placeholderMismatches: [],
    };
  }

  // 1. Check for missing required canonical keys from the reference bundle
  for (const key of Object.keys(referenceBundle.messages)) {
    if (!Object.prototype.hasOwnProperty.call(bundle.messages, key)) {
      missingKeys.push(key);
    } else {
      const val = bundle.messages[key as keyof typeof bundle.messages];
      if (typeof val !== 'string' || val.trim() === '') {
        missingKeys.push(key);
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

  // 3. Check placeholder parity
  for (const [key, refMessage] of Object.entries(referenceBundle.messages)) {
    if (Object.prototype.hasOwnProperty.call(bundle.messages, key)) {
      const targetMessage = bundle.messages[key as keyof typeof bundle.messages];
      if (typeof targetMessage === 'string') {
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

  const isValid =
    missingKeys.length === 0 &&
    extraKeys.length === 0 &&
    placeholderMismatches.length === 0 &&
    (bundle.direction === 'ltr' || bundle.direction === 'rtl') &&
    typeof bundle.locale === 'string' &&
    bundle.locale.length > 0;

  return {
    isValid,
    locale: bundle.locale,
    missingKeys,
    extraKeys,
    placeholderMismatches,
  };
}

/**
 * Validates that the canonical source bundle en-PH has zero missing keys against GLCC_CANONICAL_KEYS.
 */
export function validateCanonicalSourceCompleteness(
  sourceBundle: TranslationBundle = EN_PH_BUNDLE
): { isValid: boolean; missingCanonicalKeys: string[] } {
  const missingCanonicalKeys: string[] = [];

  for (const key of GLCC_CANONICAL_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(sourceBundle.messages, key)) {
      missingCanonicalKeys.push(key);
    } else {
      const val = sourceBundle.messages[key];
      if (typeof val !== 'string' || val.trim() === '') {
        missingCanonicalKeys.push(key);
      }
    }
  }

  return {
    isValid: missingCanonicalKeys.length === 0,
    missingCanonicalKeys,
  };
}
