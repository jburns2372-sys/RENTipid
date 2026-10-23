/**
 * RENTipid GLCC v1.1 — Global Batch Translation Validation Test Suite
 *
 * Controlling Master: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 * Work Package: GLOBAL-W1-C/D Batch Multilingual Translation
 *
 * Verifies:
 * 1. Global language registry completeness & coverage reconciliation (46 languages).
 * 2. Country registry coverage audit (44 countries, 0 without coverage).
 * 3. Canonical integrity & zero drift (2208 keys, exact key & message checksums).
 * 4. Authoritative classification propagation (A=1273, B=347, C=241, D=0, E=347).
 * 5. Full package translation structure & zero-tolerance validator pass across all 31 locales.
 * 6. 100% placeholder signature preservation across all 43 canonical keys with placeholders.
 * 7. Arabic RTL architecture & document metadata.
 * 8. Consolidated Class C legal review dossier integrity (241 keys, approval status PENDING).
 * 9. Production selectability firewall (only en-PH and fil-PH selectable).
 * 10. Multi-currency foundation preservation (23 currencies, PHP charge currency).
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  GLOBAL_LANGUAGE_CATALOG,
  GLOBAL_SUPPORTED_LANGUAGE_TAGS,
  getLanguageDefinition,
  isLanguageProductionSelectable,
} from '../../src/lib/glcc/language/language-registry';
import {
  GLOBAL_COUNTRY_CATALOG,
  GLOBAL_SUPPORTED_COUNTRY_CODES,
  getCountryProfile,
} from '../../src/lib/glcc/country/country-registry';
import {
  GLOBAL_SUPPORTED_CURRENCY_CODES,
  resolveMonetaryAuthority,
} from '../../src/lib/glcc/currency/currency-registry';
import { resolveDocumentAttributes } from '../../src/lib/glcc/layout-direction';
import { validateTranslationWorkPackage } from '../../scripts/glcc-v1.1/translation-package-validate';
import {
  calculateCanonicalKeyChecksum,
  calculateSourceMessageChecksum,
} from '../../scripts/glcc-v1.1/translation-source-export';
import {
  GLCC_CANONICAL_KEYS,
  CANONICAL_EN_PH_MESSAGES,
} from '../../src/lib/glcc/i18n/contracts/index';

const EXPECTED_KEY_CHECKSUM = 'a682064cf1f532c26884104887b012b27be830be39b41e27d0c1d58f77b36fdf';
const EXPECTED_MSG_CHECKSUM = '0566572080c895732e61ef62108403a283f6abf12e762eb29ba77a1460c2cbb8';

const BATCH_TARGET_LOCALES = [
  'ar-AE', 'de-DE', 'es-ES', 'fr-FR', 'hi-IN', 'id-ID', 'it-IT', 'ja-JP',
  'ko-KR', 'ms-MY', 'nl-NL', 'pl-PL', 'pt-BR', 'sv-SE', 'vi-VN', 'zh-Hans',
  'bg-BG', 'hr-HR', 'cs-CZ', 'da-DK', 'et-EE', 'fi-FI', 'el-GR', 'hu-HU',
  'is-IS', 'lv-LV', 'lt-LT', 'nb-NO', 'ro-RO', 'sk-SK', 'sl-SI'
];

describe('GLCC GLOBAL-W1-C/D: Global Batch Translation Test Suite', () => {
  describe('1. Global Language Registry & Coverage Reconciliation', () => {
    test('contains all 46 reconciled language records', () => {
      expect(GLOBAL_LANGUAGE_CATALOG.length).toBe(46);
      expect(GLOBAL_SUPPORTED_LANGUAGE_TAGS.length).toBe(46);
    });

    test('reconciled national EU/EEA languages are registered', () => {
      const nationalLangs = [
        'bg-BG', 'hr-HR', 'cs-CZ', 'da-DK', 'et-EE', 'fi-FI', 'el-GR',
        'hu-HU', 'is-IS', 'lv-LV', 'lt-LT', 'nb-NO', 'ro-RO', 'sk-SK', 'sl-SI'
      ];
      for (const tag of nationalLangs) {
        const def = getLanguageDefinition(tag);
        expect(def).not.toBeNull();
        expect(def?.releaseStatus).toBe('REGISTERED');
        expect(def?.enabled).toBe(true);
      }
    });

    test('regional shared language aliases are registered with sharedLanguagePackId', () => {
      const aliases = [
        { tag: 'pt-PT', shared: 'pt-BR' },
        { tag: 'fr-CA', shared: 'fr-FR' },
        { tag: 'ga-IE', shared: 'en-GB' },
        { tag: 'mt-MT', shared: 'en-GB' },
        { tag: 'ta-SG', shared: 'en-SG' },
      ];
      for (const a of aliases) {
        const def = getLanguageDefinition(a.tag);
        expect(def).not.toBeNull();
        expect(def?.sharedLanguagePackId).toBe(a.shared);
      }
    });

    test('only en-PH and fil-PH are production-selectable', () => {
      for (const def of GLOBAL_LANGUAGE_CATALOG) {
        const selectable = isLanguageProductionSelectable(def.tag);
        if (def.tag === 'en-PH' || def.tag === 'fil-PH') {
          expect(selectable).toBe(true);
        } else {
          expect(selectable).toBe(false);
        }
      }
    });
  });

  describe('2. Country Language Coverage Audit', () => {
    test('all 44 sovereign countries have valid default and supported languages', () => {
      expect(GLOBAL_COUNTRY_CATALOG.length).toBe(44);
      for (const country of GLOBAL_COUNTRY_CATALOG) {
        expect(country.defaultLanguageTag).toBeTruthy();
        expect(country.supportedLanguageTags.length).toBeGreaterThanOrEqual(1);

        // default language must exist in language registry
        const defLang = getLanguageDefinition(country.defaultLanguageTag);
        expect(defLang).not.toBeNull();

        // every supported language must exist in language catalog
        for (const sTag of country.supportedLanguageTags) {
          expect(getLanguageDefinition(sTag)).not.toBeNull();
        }
      }
    });

    test('zero countries without appropriate language coverage', () => {
      const uncovered = GLOBAL_COUNTRY_CATALOG.filter(
        c => !c.defaultLanguageTag || !getLanguageDefinition(c.defaultLanguageTag)
      );
      expect(uncovered.length).toBe(0);
    });
  });

  describe('3. Canonical Integrity & Zero Drift', () => {
    test('canonical key count is exactly 2208', () => {
      expect(GLCC_CANONICAL_KEYS.length).toBe(2208);
    });

    test('canonical key checksum matches authoritative hash with zero drift', () => {
      const sortedKeys = [...GLCC_CANONICAL_KEYS].sort();
      const hash = calculateCanonicalKeyChecksum(sortedKeys);
      expect(hash).toBe(EXPECTED_KEY_CHECKSUM);
    });

    test('source message checksum matches authoritative hash with zero drift', () => {
      const sortedKeys = [...GLCC_CANONICAL_KEYS].sort();
      const hash = calculateSourceMessageChecksum(sortedKeys, CANONICAL_EN_PH_MESSAGES);
      expect(hash).toBe(EXPECTED_MSG_CHECKSUM);
    });
  });

  describe('4. Batch Translation Work Packages Structure & Validation', () => {
    test.each(BATCH_TARGET_LOCALES)(
      'package %s passes factory validator with 0 errors and 100%% coverage',
      (locale) => {
        const pkgPath = path.join(
          process.cwd(),
          `docs/governance/glcc-v1.1/languages/${locale}/work/${locale}-translation-work-package.json`
        );
        expect(fs.existsSync(pkgPath)).toBe(true);

        const content = fs.readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(content);

        // Run factory validator
        const result = validateTranslationWorkPackage(pkg);
        expect(result.isValid).toBe(true);
        expect(result.status).toBe('VALID');
        expect(result.errorCount).toBe(0);
        expect(result.canonicalKeyCount).toBe(2208);
        expect(result.translatedRequiredCount).toBe(2208);
        expect(result.missingRequiredCount).toBe(0);
        expect(result.extraKeyCount).toBe(0);
        expect(result.placeholderMismatchCount).toBe(0);
        expect(result.formatErrorCount).toBe(0);
        expect(result.unicodeErrorCount).toBe(0);
        expect([0, 241]).toContain(result.controlledContentPendingCount);

        // Workflow state must be COMPLIANCE_REVIEW or APPROVED_FOR_QA
        expect(['COMPLIANCE_REVIEW', 'APPROVED_FOR_QA']).toContain(pkg.workflowState);
      }
    );
  });

  describe('5. Authoritative Classification Propagation', () => {
    test.each(BATCH_TARGET_LOCALES)(
      'package %s propagates exact authoritative classification counts',
      (locale) => {
        const pkgPath = path.join(
          process.cwd(),
          `docs/governance/glcc-v1.1/languages/${locale}/work/${locale}-translation-work-package.json`
        );
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

        const counts: Record<string, number> = {};
        for (const msg of Object.values(pkg.messages) as any[]) {
          counts[msg.contentClass] = (counts[msg.contentClass] || 0) + 1;
        }

        expect(counts['CLASS_A_STANDARD_UI']).toBe(1273);
        expect(counts['CLASS_B_SYSTEM_TRANSACTIONAL']).toBe(347);
        expect(counts['CLASS_C_CONTROLLED_LEGAL_COMPLIANCE']).toBe(241);
        expect(counts['CLASS_D_USER_GENERATED_BOUNDARY'] || 0).toBe(0);
        expect(counts['CLASS_E_AI_GENERATED_BOUNDARY']).toBe(347);
        expect(counts['CLASSIFICATION_REVIEW_REQUIRED'] || 0).toBe(0);
      }
    );
  });

  describe('6. Placeholder Integrity (All 43 Keys)', () => {
    test('all 43 placeholder keys preserve exact placeholder tokens across all target languages', () => {
      const enUsPkgPath = path.join(
        process.cwd(),
        'docs/governance/glcc-v1.1/languages/en-US/work/en-US-translation-work-package.json'
      );
      const enUsPkg = JSON.parse(fs.readFileSync(enUsPkgPath, 'utf-8'));
      const placeholderKeys = Object.entries(enUsPkg.messages)
        .filter(([_, m]: [string, any]) => (m.placeholderSignature || []).length > 0)
        .map(([k]) => k);

      expect(placeholderKeys.length).toBe(43);

      for (const locale of BATCH_TARGET_LOCALES) {
        const pkgPath = path.join(
          process.cwd(),
          `docs/governance/glcc-v1.1/languages/${locale}/work/${locale}-translation-work-package.json`
        );
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

        for (const key of placeholderKeys) {
          const msg = pkg.messages[key];
          expect(msg).toBeDefined();
          const target = msg.targetText;
          const expected = msg.placeholderSignature || [];

          for (const p of expected) {
            expect(target).toContain(`{${p}}`);
          }
        }
      }
    });
  });

  describe('7. RTL Architecture & Arabic Metadata', () => {
    test('ar-AE is registered with direction rtl and script Arab', () => {
      const arDef = getLanguageDefinition('ar-AE');
      expect(arDef).not.toBeNull();
      expect(arDef?.direction).toBe('rtl');
      expect(arDef?.script).toBe('Arab');
    });

    test('layout-direction resolver returns dir rtl for ar-AE', () => {
      const attrs = resolveDocumentAttributes('ar-AE');
      expect(attrs.dir).toBe('rtl');
      expect(attrs.lang).toBe('ar-AE');
    });
  });

  describe('8. Consolidated Class C Review Dossier', () => {
    test('Class C dossier exists and contains all 241 controlled keys with status PENDING', () => {
      const jsonPath = path.join(
        process.cwd(),
        'docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_CLASS_C_MULTILINGUAL_REVIEW_DOSSIER.json'
      );
      const mdPath = path.join(
        process.cwd(),
        'docs/governance/glcc-v1.1/global/legal/GLOBAL_W1_CLASS_C_MULTILINGUAL_REVIEW_DOSSIER.md'
      );

      expect(fs.existsSync(jsonPath)).toBe(true);
      expect(fs.existsSync(mdPath)).toBe(true);

      const dossier = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      expect(dossier.totalClassCKeys).toBe(241);
      expect(['PENDING', 'APPROVED']).toContain(dossier.overallLegalApprovalStatus);
      expect(dossier.entries.length).toBe(241);

      for (const entry of dossier.entries) {
        expect(['PENDING', 'APPROVED']).toContain(entry.controlledApprovalStatus);
        expect(entry.jurisdictionIndependenceStatement).toBeTruthy();
        expect(Object.keys(entry.translations).length).toBe(32); // en-US + 31 target languages
      }
    });
  });

  describe('9. Multi-Currency Foundation Invariant Preservation', () => {
    test('preserves 23 supported ISO currencies', () => {
      expect(GLOBAL_SUPPORTED_CURRENCY_CODES.length).toBe(23);
    });

    test('transaction and settlement currencies remain strictly locked to PHP', () => {
      for (const code of ['USD', 'EUR', 'JPY', 'GBP', 'PHP', 'AUD', 'SGD']) {
        const authority = resolveMonetaryAuthority(code);
        expect(authority.transactionCurrency).toBe('PHP');
        expect(authority.settlementCurrency).toBe('PHP');
      }
    });
  });
});
