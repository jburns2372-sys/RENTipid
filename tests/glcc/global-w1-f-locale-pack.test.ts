/**
 * RENTipid GLCC v1.1 — GLOBAL-W1-F Locale Pack Generation & Validation Test Suite
 *
 * Controlling Master: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 * Work Package: GLOBAL-W1-F Batch Locale Pack Generation & Validation
 *
 * Verifies:
 * 1. Canonical source integrity & zero drift (2208 keys, exact key & message hashes).
 * 2. Frozen locale-pack factory self-test (24/24 scenarios PASS).
 * 3. All 32 compiled full locale packs validate with 0 errors, 100% coverage, sealed checksums.
 * 4. Global locale pack manifest integrity.
 * 5. Arabic RTL architecture & layout direction.
 * 6. Shared English model & regional shared aliases.
 * 7. QA candidate runtime loader & representative key resolution across 9 domains (0 load failures, 0 raw key render failures).
 * 8. Production selectability firewall (only en-PH and fil-PH selectable).
 * 9. Currency invariant preservation (23 supported currencies, PHP transaction/settlement authority).
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  GLOBAL_LANGUAGE_CATALOG,
  getLanguageDefinition,
  isLanguageProductionSelectable,
} from '../../src/lib/glcc/language/language-registry';
import {
  GLOBAL_SUPPORTED_CURRENCY_CODES,
  resolveMonetaryAuthority,
} from '../../src/lib/glcc/currency/currency-registry';
import { resolveDocumentAttributes } from '../../src/lib/glcc/layout-direction';
import { validateLocalePack } from '../../scripts/glcc-v1.1/locale-pack-validate';
import { runLocalePackFactorySelfTest } from '../../scripts/glcc-v1.1/locale-pack-factory-self-test';
import {
  calculateCanonicalKeyChecksum,
  calculateSourceMessageChecksum,
} from '../../scripts/glcc-v1.1/translation-source-export';
import {
  GLCC_CANONICAL_KEYS,
  CANONICAL_EN_PH_MESSAGES,
} from '../../src/lib/glcc/i18n/contracts/index';
import {
  getQaCandidateBundle,
  getQaCandidateLocalePack,
  verifyRepresentativeKeysResolution,
} from '../../src/lib/glcc/i18n/qa-candidate-loader';
import { TranslationEngine } from '../../src/lib/glcc/i18n/engine';

const REPO_ROOT = path.resolve(__dirname, '../..');
const LANG_DIR = path.join(REPO_ROOT, 'docs/governance/glcc-v1.1/languages');
const MANIFEST_JSON_PATH = path.join(
  REPO_ROOT,
  'docs/governance/glcc-v1.1/global/GLOBAL_W1_LOCALE_PACK_MANIFEST.json'
);

const FULL_LOCALES = [
  'en-US',
  'ar-AE', 'de-DE', 'es-ES', 'fr-FR', 'hi-IN', 'id-ID', 'it-IT', 'ja-JP',
  'ko-KR', 'ms-MY', 'nl-NL', 'pl-PL', 'pt-BR', 'sv-SE', 'vi-VN', 'zh-Hans',
  'bg-BG', 'hr-HR', 'cs-CZ', 'da-DK', 'et-EE', 'fi-FI', 'el-GR', 'hu-HU',
  'is-IS', 'lv-LV', 'lt-LT', 'nb-NO', 'ro-RO', 'sk-SK', 'sl-SI'
].sort();

describe('GLCC GLOBAL-W1-F: Batch Locale Pack Generation & Validation Test Suite', () => {
  describe('1. Canonical Source Integrity & Zero Drift', () => {
    test('canonical key count is exactly 2208', () => {
      expect(GLCC_CANONICAL_KEYS.length).toBe(2208);
    });

    test('canonical key checksum matches authoritative hash with zero drift', () => {
      const keys = [...GLCC_CANONICAL_KEYS].sort();
      const hash = calculateCanonicalKeyChecksum(keys);
      expect(hash).toBe('a682064cf1f532c26884104887b012b27be830be39b41e27d0c1d58f77b36fdf');
    });

    test('source message checksum matches authoritative hash with zero drift', () => {
      const keys = [...GLCC_CANONICAL_KEYS].sort();
      const hash = calculateSourceMessageChecksum(keys, CANONICAL_EN_PH_MESSAGES);
      expect(hash).toBe('0566572080c895732e61ef62108403a283f6abf12e762eb29ba77a1460c2cbb8');
    });
  });

  describe('2. Frozen Factory Self-Test', () => {
    test('locale pack factory self-test passes all 24 scenarios', () => {
      const res = runLocalePackFactorySelfTest();
      expect(res.allPassed).toBe(true);
      expect(res.passedCount).toBe(24);
      expect(res.totalScenarios).toBe(24);
      expect(res.failedCount).toBe(0);
    });
  });

  describe('3. Batch Full Locale Packs Validation', () => {
    for (const tag of FULL_LOCALES) {
      test(`locale pack ${tag} passes zero-tolerance validation with 100% coverage`, () => {
        const pack = getQaCandidateLocalePack(tag);
        expect(pack).not.toBeNull();
        if (!pack) return;

        expect(pack.canonicalKeyCount).toBe(2208);
        expect(pack.releaseCandidateState).toBe('CANDIDATE_FOR_QA');
        expect(pack.workflowState).toBe('APPROVED_FOR_QA');
        expect(Object.keys(pack.messages).length).toBe(2208);

        const val = validateLocalePack(pack);
        expect(val.isValid).toBe(true);
        expect(val.status).toBe('VALID');
        expect(val.errorCount).toBe(0);
        expect(val.errors).toEqual([]);
      });
    }
  });

  describe('4. Global Locale Pack Manifest Integrity', () => {
    test('manifest exists and records all 32 full locale packs as valid candidates', () => {
      expect(fs.existsSync(MANIFEST_JSON_PATH)).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(MANIFEST_JSON_PATH, 'utf-8'));
      expect(manifest.totalFullLocalePacks).toBe(32);
      expect(manifest.allPacksValid).toBe(true);
      expect(manifest.releaseCandidateState).toBe('CANDIDATE_FOR_QA');
      expect(manifest.productionSelectable).toBe(false);
      expect(manifest.entries.length).toBe(32);

      for (const entry of manifest.entries) {
        expect(entry.canonicalCount).toBe(2208);
        expect(entry.coverage).toBe('100.0%');
        expect(entry.fallbackCount).toBe(0);
        expect(entry.missingCount).toBe(0);
        expect(entry.placeholderMismatch).toBe(0);
        expect(entry.formatErrors).toBe(0);
        expect(entry.UnicodeErrors).toBe(0);
        expect(entry.validationStatus).toBe('VALID');
        expect(entry.releaseCandidateState).toBe('CANDIDATE_FOR_QA');
      }
    });
  });

  describe('5. Arabic RTL Architecture & Metadata', () => {
    test('ar-AE locale pack specifies RTL direction and Arab script', () => {
      const pack = getQaCandidateLocalePack('ar-AE');
      expect(pack).not.toBeNull();
      expect(pack?.localeMetadata.direction).toBe('rtl');
      expect(pack?.localeMetadata.script).toBe('Arab');

      const docAttr = resolveDocumentAttributes('ar-AE');
      expect(docAttr.dir).toBe('rtl');
    });
  });

  describe('6. Shared English Model & Regional Shared Aliases', () => {
    test('English variants reuse English baseline without duplicate translation projects', () => {
      const variants = ['en-GB', 'en-CA', 'en-AU', 'en-SG', 'en-IN', 'en-MY', 'en-ID'];
      for (const tag of variants) {
        const def = getLanguageDefinition(tag);
        expect(def).not.toBeNull();
        expect(def?.isEnglishVariant).toBe(true);
        expect(def?.sharedLanguagePackId).toBe('en-PH');
      }
    });

    test('regional shared aliases resolve to parent pack', () => {
      const aliases = [
        { tag: 'pt-PT', parent: 'pt-BR' },
        { tag: 'fr-CA', parent: 'fr-FR' },
        { tag: 'ga-IE', parent: 'en-GB' },
        { tag: 'mt-MT', parent: 'en-GB' },
        { tag: 'ta-SG', parent: 'en-SG' },
      ];
      for (const a of aliases) {
        const def = getLanguageDefinition(a.tag);
        expect(def).not.toBeNull();
        expect(def?.sharedLanguagePackId).toBe(a.parent);
      }
    });
  });

  describe('7. QA Candidate Runtime Integration & Representative Key Resolution', () => {
    test('all 32 candidate bundles load and resolve representative keys across 9 domains with 0 failures', () => {
      let totalPacksTested = 0;
      let totalKeysTested = 0;

      for (const tag of FULL_LOCALES) {
        const bundle = getQaCandidateBundle(tag);
        expect(bundle).not.toBeNull();
        if (!bundle) continue;

        const res = verifyRepresentativeKeysResolution(tag, bundle);
        expect(res.success).toBe(true);
        expect(res.failedKeys.length).toBe(0);
        expect(res.testedKeysCount).toBe(9);

        totalPacksTested++;
        totalKeysTested += res.testedKeysCount;
      }

      expect(totalPacksTested).toBe(32);
      expect(totalKeysTested).toBe(32 * 9);
    });

    test('TranslationEngine successfully accepts candidate bundle registration', () => {
      const engine = new TranslationEngine();
      const deBundle = getQaCandidateBundle('de-DE');
      expect(deBundle).not.toBeNull();
      if (!deBundle) return;

      engine.registerBundle(deBundle);
      expect(engine.hasBundle('de-DE')).toBe(true);

      const msg = engine.translate('common.save', undefined, 'de-DE');
      expect(msg).toBe('Speichern');
    });
  });

  describe('8. Production Selectability Firewall', () => {
    test('only en-PH and fil-PH are production selectable', () => {
      for (const def of GLOBAL_LANGUAGE_CATALOG) {
        const selectable = isLanguageProductionSelectable(def.tag);
        if (def.tag === 'en-PH' || def.tag === 'fil-PH') {
          expect(selectable).toBe(true);
        } else {
          expect(selectable).toBe(false);
        }
      }
    });

    test('all 30 candidate languages are registered and not selectable in production', () => {
      for (const tag of FULL_LOCALES) {
        if (tag !== 'en-PH' && tag !== 'fil-PH') {
          const def = getLanguageDefinition(tag);
          expect(def).not.toBeNull();
          expect(isLanguageProductionSelectable(tag)).toBe(false);
        }
      }
    });
  });

  describe('9. Multi-Currency Foundation & Dimension Independence', () => {
    test('preserves 23 supported ISO currencies', () => {
      expect(GLOBAL_SUPPORTED_CURRENCY_CODES.length).toBe(23);
    });

    test('transaction and settlement currencies strictly locked to PHP', () => {
      for (const code of ['USD', 'EUR', 'JPY', 'GBP', 'PHP', 'AUD', 'SGD']) {
        const authority = resolveMonetaryAuthority(code);
        expect(authority.transactionCurrency).toBe('PHP');
        expect(authority.settlementCurrency).toBe('PHP');
      }
    });
  });
});
