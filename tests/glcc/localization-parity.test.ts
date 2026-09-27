/**
 * @jest-environment node
 */

import {
  EN_PH_BUNDLE,
  FIL_PH_BUNDLE,
  GLCC_CANONICAL_KEYS,
  validateTranslationBundle,
  validateCanonicalSourceCompleteness,
  extractPlaceholders,
} from '@/lib/glcc/i18n';

describe('RENTipid GLCC v1.0.1 — Dictionary Parity Test Suite', () => {
  it('en-PH canonical dictionary satisfies 100% of canonical contract keys', () => {
    const completeness = validateCanonicalSourceCompleteness(EN_PH_BUNDLE);
    expect(completeness.isValid).toBe(true);
    expect(completeness.missingCanonicalKeys).toHaveLength(0);
  });

  it('fil-PH production bundle satisfies 100% parity with en-PH canonical dictionary', () => {
    const validation = validateTranslationBundle(FIL_PH_BUNDLE, EN_PH_BUNDLE);

    const canonicalTotal = GLCC_CANONICAL_KEYS.length;
    const filPresent = Object.keys(FIL_PH_BUNDLE.messages).length;
    const filMissing = validation.missingKeys.length;
    const coverage = ((filPresent - filMissing) / canonicalTotal) * 100;

    console.log(`CANONICAL_REQUIRED_KEYS: ${canonicalTotal}`);
    console.log(`FIL_PH_REQUIRED_KEYS_PRESENT: ${filPresent}`);
    console.log(`FIL_PH_REQUIRED_KEYS_MISSING: ${filMissing}`);
    console.log(`REQUIRED_COVERAGE: ${coverage.toFixed(2)}%`);

    expect(validation.isValid).toBe(true);
    expect(validation.missingKeys).toHaveLength(0);
    expect(validation.extraKeys).toHaveLength(0);
    expect(validation.placeholderMismatches).toHaveLength(0);
    expect(coverage).toBe(100);
  });

  it('no message in en-PH or fil-PH is empty or whitespace-only', () => {
    for (const msg of Object.values(EN_PH_BUNDLE.messages)) {
      expect(typeof msg).toBe('string');
      expect(msg.trim().length).toBeGreaterThan(0);
    }

    for (const msg of Object.values(FIL_PH_BUNDLE.messages)) {
      expect(typeof msg).toBe('string');
      expect(msg.trim().length).toBeGreaterThan(0);
    }
  });

  it('all interpolated variables in en-PH exist identically in fil-PH', () => {
    for (const key of GLCC_CANONICAL_KEYS) {
      const enMsg = EN_PH_BUNDLE.messages[key];
      const filMsg = FIL_PH_BUNDLE.messages[key];

      const enPlaceholders = extractPlaceholders(enMsg).sort();
      const filPlaceholders = extractPlaceholders(filMsg).sort();

      expect(filPlaceholders).toEqual(enPlaceholders);
    }
  });

  it('fil-PH bundle metadata is valid for production', () => {
    expect(FIL_PH_BUNDLE.locale).toBe('fil-PH');
    expect(FIL_PH_BUNDLE.direction).toBe('ltr');
    expect(FIL_PH_BUNDLE.version).toBe('1.0.1');
    expect(FIL_PH_BUNDLE.isFixture).toBeFalsy();
  });
});
