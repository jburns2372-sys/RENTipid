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

describe('RENTipid GLCC v1.0.1 — Dictionary Parity & Completeness Test Suite', () => {
  it('en-PH canonical dictionary satisfies 100% of canonical contract keys', () => {
    const completeness = validateCanonicalSourceCompleteness(EN_PH_BUNDLE);
    expect(completeness.isValid).toBe(true);
    expect(completeness.missingCanonicalKeys).toHaveLength(0);
    expect(completeness.emptyKeys).toHaveLength(0);
  });

  it('fil-PH non-production bundle enforces truthful partial coverage under P4 policy', () => {
    // Under Master Plan P4: fil-PH has releaseStatus = QA_REQUIRED.
    // Missing keys are measured and reported honestly; full completion is deferred to P6.
    const validation = validateTranslationBundle(FIL_PH_BUNDLE, EN_PH_BUNDLE, { allowPartial: true });

    const canonicalTotal = GLCC_CANONICAL_KEYS.length;
    const filPresent = Object.keys(FIL_PH_BUNDLE.messages).length;
    const filMissing = validation.missingKeys.length;
    const coverage = (filPresent / canonicalTotal) * 100;

    console.log(`CANONICAL_REQUIRED_KEYS: ${canonicalTotal}`);
    console.log(`FIL_PH_REQUIRED_KEYS_PRESENT: ${filPresent}`);
    console.log(`FIL_PH_REQUIRED_KEYS_MISSING: ${filMissing}`);
    console.log(`REQUIRED_COVERAGE: ${coverage.toFixed(2)}%`);

    expect(validation.isValid).toBe(true);
    expect(validation.presentKeysCount).toBe(filPresent);
    expect(validation.missingKeys.length).toBe(canonicalTotal - filPresent);
    expect(validation.extraKeys).toHaveLength(0);
    expect(validation.placeholderMismatches).toHaveLength(0);
    expect(coverage).toBeGreaterThan(20); // 445 / 2114 ~= 21.05%
  });

  it('no message present in en-PH or fil-PH is empty or whitespace-only', () => {
    for (const msg of Object.values(EN_PH_BUNDLE.messages)) {
      expect(typeof msg).toBe('string');
      expect(msg.trim().length).toBeGreaterThan(0);
    }

    for (const msg of Object.values(FIL_PH_BUNDLE.messages)) {
      expect(typeof msg).toBe('string');
      expect(msg.trim().length).toBeGreaterThan(0);
    }
  });

  it('all interpolated variables in en-PH exist identically in fil-PH for present keys', () => {
    for (const [key, filMsg] of Object.entries(FIL_PH_BUNDLE.messages)) {
      const enMsg = EN_PH_BUNDLE.messages[key as keyof typeof EN_PH_BUNDLE.messages];
      if (enMsg) {
        const enPlaceholders = extractPlaceholders(enMsg).sort();
        const filPlaceholders = extractPlaceholders(filMsg).sort();

        expect(filPlaceholders).toEqual(enPlaceholders);
      }
    }
  });

  it('fil-PH bundle metadata is valid for QA mode', () => {
    expect(FIL_PH_BUNDLE.locale).toBe('fil-PH');
    expect(FIL_PH_BUNDLE.direction).toBe('ltr');
    expect(FIL_PH_BUNDLE.version).toBe('1.0.1');
    expect(FIL_PH_BUNDLE.isFixture).toBeFalsy();
    expect(FIL_PH_BUNDLE.releaseStatus).toBe('QA_REQUIRED');
  });
});

