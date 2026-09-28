/**
 * RENTipid GLCC v1.0.1 — Filipino Language Bundle: fil-PH (Wikang Filipino)
 *
 * RELEASE STATUS: QA_REQUIRED
 *
 * In accordance with Master Plan P6 (Filipino Proof Pack):
 * Complete Filipino Dictionary Bundle with 2,208 / 2,208 canonical keys.
 * Zero missing keys, zero empty keys, zero required English fallback.
 * Governed under controlling document RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0.
 */

import type { TranslationBundle } from '../contracts';
import { CANONICAL_EN_PH_MESSAGES } from '../contracts';
import { CANONICAL_FIL_PH_MESSAGES } from './filipino';

export const FIL_PH_BUNDLE: TranslationBundle = Object.freeze({
  locale: 'fil-PH',
  direction: 'ltr',
  version: '1.0.1',
  isFixture: false,
  releaseStatus: 'QA_REQUIRED',
  messages: Object.freeze(CANONICAL_FIL_PH_MESSAGES),
});

// Backward-compatibility alias for test fixtures
export const FIL_PH_FIXTURE_BUNDLE: TranslationBundle = {
  ...FIL_PH_BUNDLE,
  isFixture: true,
  messages: {
    ...CANONICAL_EN_PH_MESSAGES,
    ...FIL_PH_BUNDLE.messages,
  },
};
