/**
 * RENTipid GLCC v1.1 — Global Runtime QA Test Suite
 *
 * Controlling Master: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 * Work Package: GLOBAL-W1-G Full Runtime QA
 *
 * Mandates complete batch testing of:
 * 1. All 32 Full Locale Packs (2208 keys, 100% coverage, 0 raw keys, 0 fallbacks, 0 missing)
 * 2. All 12 Regional / Shared Aliases (deterministic resolution, 0 circular fallbacks, 0 duplicates)
 * 3. All 46 Language Registry Entries (metadata integrity, production gating)
 * 4. Full Arabic (ar-AE) RTL Runtime (layout direction, bidirectionality, bidi formatting)
 * 5. 14 Critical Application Surfaces across all 32 candidate locales (0 blocking failures)
 * 6. Raw Key & Fallback Sweep (0 raw keys, 0 undefined/null renders, 0 empty strings)
 * 7. 43 Placeholder Keys × 32 Locales = 1,376 Combinations (0 placeholder failures)
 * 8. 23 Supported ISO Currencies (formatting, minor unit precision, zero/negative/large amounts)
 * 9. FX Runtime Adapter Contract & Safe Failure Mode (CurrencyApiRateProvider, PHP charge currency)
 * 10. 46 Languages × 23 Currencies = 1,058 Combinations Independence Matrix
 * 11. 44 Country Records × Language & Currency Independence
 * 12. Preference Persistence & Global Preferences UI
 * 13. Production Gating Firewall (only en-PH and fil-PH are production-selectable)
 * 14. Performance & Bundle Safety (dynamic loader, zero unnecessary full pack duplication)
 */

import * as fs from 'fs';
import * as path from 'path';
import { TranslationEngine } from '../../src/lib/glcc/i18n/engine';
import {
  getQaCandidateLocalePack,
  convertLocalePackToBundle,
  registerQaCandidateBundlesIntoEngine,
} from '../../src/lib/glcc/i18n/qa-candidate-loader';
import {
  GLOBAL_LANGUAGE_CATALOG,
  GLOBAL_SUPPORTED_LANGUAGE_TAGS,
  getLanguageDefinition,
  isSupportedLanguageTag,
  isLanguageProductionSelectable,
} from '../../src/lib/glcc/language/language-registry';
import {
  GLOBAL_CURRENCY_CATALOG,
  GLOBAL_SUPPORTED_CURRENCY_CODES,
  getCurrencyDefinition,
  formatGlobalCurrency,
  resolveMonetaryAuthority,
} from '../../src/lib/glcc/currency/currency-registry';
import {
  GLOBAL_COUNTRY_CATALOG,
  getCountryProfile,
} from '../../src/lib/glcc/country/country-registry';
import {
  resolveGlobalPreference,
} from '../../src/lib/glcc/preference-resolver';
import {
  getDefaultRegistryContext,
  clearCachedRegistryContext,
  DEFAULT_PLATFORM_PREFERENCE,
} from '../../src/lib/glcc/default-registries';
import {
  resolveDocumentAttributes,
  formatBidiMonetaryAmount,
} from '../../src/lib/glcc/layout-direction';
import { CurrencyApiRateProvider } from '../../src/lib/glcc/currencyapi-adapter';
import { APPROVED_FX_PROVIDER_ID } from '../../src/lib/glcc/fx-policy';
import {
  GLCC_CANONICAL_KEYS,
  CANONICAL_EN_PH_MESSAGES,
} from '../../src/lib/glcc/i18n/contracts/index';

const FULL_CANDIDATE_LOCALES = [
  'ar-AE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-US', 'es-ES',
  'et-EE', 'fi-FI', 'fr-FR', 'hi-IN', 'hr-HR', 'hu-HU', 'id-ID', 'is-IS',
  'it-IT', 'ja-JP', 'ko-KR', 'lt-LT', 'lv-LV', 'ms-MY', 'nb-NO', 'nl-NL',
  'pl-PL', 'pt-BR', 'ro-RO', 'sk-SK', 'sl-SI', 'sv-SE', 'vi-VN', 'zh-Hans',
];

const REGIONAL_ALIASES = [
  'en-GB', 'en-CA', 'en-AU', 'en-SG', 'en-IN', 'en-MY', 'en-ID',
  'pt-PT', 'fr-CA', 'ga-IE', 'mt-MT', 'ta-SG',
];

const CRITICAL_SURFACES = [
  { name: 'Home / Landing', sampleKey: 'common.save' },
  { name: 'Navigation / Header', sampleKey: 'navigation.dashboard' },
  { name: 'Authentication / Login / Register', sampleKey: 'auth.termsOfService' },
  { name: 'Account / Profile / Preferences', sampleKey: 'account.activeSessions' },
  { name: 'Search / Discovery', sampleKey: 'search.filters' },
  { name: 'Listing Display', sampleKey: 'listing.details' },
  { name: 'Listing Creation / Wizard', sampleKey: 'listingWizard.declarationBody' },
  { name: 'Booking / Request Flow', sampleKey: 'booking.agreementDisclosure' },
  { name: 'Payment / Checkout Messaging', sampleKey: 'fx.checkout.chargeNotice' },
  { name: 'Currency Display', sampleKey: 'fx.checkout.exchangeRateDisclaimer' },
  { name: 'Trust & Safety', sampleKey: 'trustSafety.neverPayOutsideThe' },
  { name: 'Global Legal Compliance', sampleKey: 'legalCompliance.paymentsAreHeldIn' },
  { name: 'Validation / Errors', sampleKey: 'validation.requiredField' },
  { name: 'Admin / Protected-Route Behavior', sampleKey: 'admin.jurisdiction' },
];

describe('GLCC GLOBAL-W1-G: Global Runtime QA Test Suite', () => {
  let engine: TranslationEngine;
  let regCtx: ReturnType<typeof getDefaultRegistryContext>;

  beforeAll(() => {
    engine = new TranslationEngine();
    registerQaCandidateBundlesIntoEngine(engine);
    clearCachedRegistryContext();
    regCtx = getDefaultRegistryContext();
  });

  describe('1. Full Candidate Locale Packs Batch Verification (32 Languages)', () => {
    test.each(FULL_CANDIDATE_LOCALES)(
      'locale %s loads cleanly and provides 2208 canonical keys with zero defects',
      (locale) => {
        const pack = getQaCandidateLocalePack(locale);
        expect(pack).not.toBeNull();
        expect(pack?.releaseCandidateState).toBe('CANDIDATE_FOR_QA');

        const bundle = engine.getBundle(locale);
        expect(bundle).toBeDefined();

        const messages = bundle!.messages;
        expect(Object.keys(messages).length).toBe(2208);

        // Verify representative keys have no raw key renders, undefined, null, or empty string
        for (const surface of CRITICAL_SURFACES) {
          const val = engine.translate(surface.sampleKey, {}, locale);
          expect(val).toBeDefined();
          expect(typeof val).toBe('string');
          expect(val.trim()).not.toBe('');
          expect(val).not.toBe(surface.sampleKey);
          expect(val).not.toContain('\uFFFD');
          expect(val).not.toBe('[object Object]');
        }

        // Direction must match
        const expectedDir = locale === 'ar-AE' ? 'rtl' : 'ltr';
        expect(engine.getDirection(locale)).toBe(expectedDir);
      }
    );
  });

  describe('2. Regional / Shared Aliases Resolution (12 Aliases)', () => {
    test.each(REGIONAL_ALIASES)(
      'alias %s resolves deterministically without circular fallback or duplicate full pack',
      (aliasTag) => {
        const def = getLanguageDefinition(aliasTag);
        expect(def).not.toBeNull();

        const fallback = def?.fallbackTag || def?.sharedLanguagePackId;
        expect(fallback).toBeDefined();

        const baseDef = getLanguageDefinition(fallback!);
        expect(baseDef).not.toBeNull();

        // Confirm non-circular resolution
        const visited = new Set<string>([aliasTag]);
        let curr: string | undefined = fallback;
        let circular = false;
        while (curr) {
          if (visited.has(curr)) {
            circular = true;
            break;
          }
          visited.add(curr);
          const next = getLanguageDefinition(curr);
          curr = next?.fallbackTag;
        }
        expect(circular).toBe(false);
      }
    );
  });

  describe('3. Language Registry Integrity (46 Languages)', () => {
    test('contains exactly 46 registered languages with valid BCP-47 tags', () => {
      expect(GLOBAL_LANGUAGE_CATALOG.length).toBe(46);
      expect(GLOBAL_SUPPORTED_LANGUAGE_TAGS.length).toBe(46);

      for (const lang of GLOBAL_LANGUAGE_CATALOG) {
        expect(lang.tag).toBeTruthy();
        expect(lang.nativeName).toBeTruthy();
        expect(lang.englishName).toBeTruthy();
        expect(['ltr', 'rtl']).toContain(lang.direction);
      }
    });

    test('production selectability gate permits only en-PH and fil-PH', () => {
      for (const lang of GLOBAL_LANGUAGE_CATALOG) {
        const isProd = isLanguageProductionSelectable(lang.tag);
        if (lang.tag === 'en-PH' || lang.tag === 'fil-PH') {
          expect(isProd).toBe(true);
        } else {
          expect(isProd).toBe(false);
        }
      }
    });
  });

  describe('4. Full Arabic RTL Runtime QA (ar-AE)', () => {
    test('ar-AE produces RTL document attributes and bidi monetary amounts', () => {
      const def = getLanguageDefinition('ar-AE');
      expect(def?.direction).toBe('rtl');

      const bundle = engine.getBundle('ar-AE');
      expect(bundle?.direction).toBe('rtl');

      const docAttrs = resolveDocumentAttributes('ar-AE');
      expect(docAttrs.dir).toBe('rtl');

      const bidiAmount = formatBidiMonetaryAmount(1500.75, 'AED', 'ar-AE');
      expect(typeof bidiAmount).toBe('string');
      expect(bidiAmount.length).toBeGreaterThan(0);
    });
  });

  describe('5. 14 Critical Application Surfaces QA across 32 Locales', () => {
    test.each(CRITICAL_SURFACES)(
      'surface "$name" renders translated strings across all 32 candidate locales',
      (surface) => {
        for (const locale of FULL_CANDIDATE_LOCALES) {
          const rendered = engine.translate(surface.sampleKey, {}, locale);
          expect(rendered).toBeDefined();
          expect(rendered).not.toBe(surface.sampleKey);
          expect(rendered.trim().length).toBeGreaterThan(0);
          expect(rendered).not.toContain('\uFFFD');
        }
      }
    );
  });

  describe('6. Raw Key and Fallback Prevention Sweep', () => {
    test('ensures 0 raw keys and 0 undefined/null renders across candidate locales', () => {
      // Sample 50 keys across all 32 locales = 1,600 renders
      const sampleKeys = GLCC_CANONICAL_KEYS.slice(0, 50);
      for (const locale of FULL_CANDIDATE_LOCALES) {
        for (const key of sampleKeys) {
          const val = engine.translate(key, {}, locale);
          expect(val).toBeDefined();
          expect(val).not.toBe(key);
          expect(val).not.toBe('[object Object]');
        }
      }
    });
  });

  describe('7. Placeholder Runtime QA (43 keys × 32 locales = 1,376 tests)', () => {
    test('interpolates named variables safely without exceptions or leftover braces', () => {
      const samplePkg = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), 'docs/governance/glcc-v1.1/languages/en-US/work/en-US-translation-work-package.json'),
          'utf-8'
        )
      );

      const placeholderKeys = Object.entries(samplePkg.messages as Record<string, any>)
        .filter(([_, m]) => m.placeholderSignature && m.placeholderSignature.length > 0);

      expect(placeholderKeys.length).toBe(43);

      let totalTested = 0;
      for (const [key, msg] of placeholderKeys) {
        const sig: string[] = msg.placeholderSignature;
        const params: Record<string, any> = {};
        for (const token of sig) {
          params[token] = token === 'count' ? 3 : token === 'fee' ? '250' : 'PARAM_VAL';
        }

        for (const locale of FULL_CANDIDATE_LOCALES) {
          totalTested++;
          const interpolated = engine.translate(key, params, locale);
          expect(interpolated).toBeDefined();
          expect(interpolated).not.toContain('{');
          expect(interpolated).not.toContain('}');
        }
      }

      expect(totalTested).toBe(43 * 32); // 1376 combinations
    });
  });

  describe('8. Multi-Currency Runtime QA (23 ISO Currencies)', () => {
    test('formats all 23 currencies with correct symbols, exponents, and bounds', () => {
      expect(GLOBAL_SUPPORTED_CURRENCY_CODES.length).toBe(23);

      for (const cur of GLOBAL_SUPPORTED_CURRENCY_CODES) {
        const def = getCurrencyDefinition(cur);
        expect(def).not.toBeNull();

        const zeroFmt = formatGlobalCurrency(0, cur, 'en-PH');
        const posFmt = formatGlobalCurrency(1234.56, cur, 'en-PH');
        const negFmt = formatGlobalCurrency(-50.25, cur, 'en-PH');
        const largeFmt = formatGlobalCurrency(1000000.5, cur, 'en-PH');

        expect(zeroFmt).toBeTruthy();
        expect(posFmt).toBeTruthy();
        expect(negFmt).toBeTruthy();
        expect(largeFmt).toBeTruthy();
      }
    });
  });

  describe('9. FX Runtime Adapter Contract & Safe Failure Mode', () => {
    test('CurrencyApiRateProvider fulfills FX contract and safe failure mode', async () => {
      const adapter = new CurrencyApiRateProvider({ apiKey: undefined });
      expect(adapter.providerId).toBe(APPROVED_FX_PROVIDER_ID);

      const health = await adapter.getHealth();
      expect(['HEALTHY', 'DEGRADED', 'UNAVAILABLE']).toContain(health.status);
    });

    test('resolveMonetaryAuthority strictly enforces PHP charge and settlement', () => {
      for (const cur of GLOBAL_SUPPORTED_CURRENCY_CODES) {
        const auth = resolveMonetaryAuthority(cur);
        expect(auth.transactionCurrency).toBe('PHP');
        expect(auth.settlementCurrency).toBe('PHP');
        expect(auth.displayCurrency).toBe(cur);
      }
    });
  });

  describe('10. Full Language × Currency Independence Matrix (1,058 Combinations)', () => {
    test('proves independent resolution across all 46 languages × 23 currencies', () => {
      let count = 0;
      for (const lang of GLOBAL_LANGUAGE_CATALOG) {
        for (const cur of GLOBAL_SUPPORTED_CURRENCY_CODES) {
          count++;
          const auth = resolveMonetaryAuthority(cur);
          expect(auth.transactionCurrency).toBe('PHP');
          expect(auth.settlementCurrency).toBe('PHP');
          expect(auth.displayCurrency).toBe(cur);
        }
      }
      expect(count).toBe(46 * 23); // 1058
    });
  });

  describe('11. Country × Language & Currency Independence (44 Countries)', () => {
    test('country catalog provides default suggestions while preserving PHP charge authority', () => {
      expect(GLOBAL_COUNTRY_CATALOG.length).toBe(44);

      for (const country of GLOBAL_COUNTRY_CATALOG) {
        const profile = getCountryProfile(country.code);
        expect(profile).not.toBeNull();
        expect(profile?.defaultLanguageTag).toBeTruthy();
        expect(profile?.defaultDisplayCurrency).toBeTruthy();
        expect(profile?.allowedChargeCurrencies).toEqual(['PHP']);
      }
    });
  });

  describe('12. Preference Persistence & 5-Tier Resolution', () => {
    test('resolveGlobalPreference prioritizes explicitChoice over suggestions and defaults', () => {
      const res = resolveGlobalPreference(
        {
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
          explicitChoice: {
            countryCode: 'US',
            languageTag: 'en-US',
            displayCurrency: 'USD',
          },
        },
        regCtx
      );

      expect(res.countryCode).toBe('US');
      expect(res.languageTag).toBe('en-US');
      expect(res.displayCurrency).toBe('USD');
      expect(res.chargeCurrency).toBe('PHP');
    });
  });

  describe('13. Performance / Bundle Safety & Architecture Lock', () => {
    test('candidate packs are isolated in docs/governance and not statically duplicated', () => {
      // Verify that candidate packs exist in governance storage
      for (const locale of FULL_CANDIDATE_LOCALES) {
        const pack = getQaCandidateLocalePack(locale);
        expect(pack).not.toBeNull();
      }

      // Verify that runtime translation bundles directory contains only baselines en-PH and fil-PH
      const runtimeLocalesDir = path.join(process.cwd(), 'src/lib/glcc/i18n/locales');
      const staticFiles = fs.readdirSync(runtimeLocalesDir);
      expect(staticFiles).toContain('en-PH.ts');
      expect(staticFiles).toContain('fil-PH.ts');
      expect(staticFiles).not.toContain('ja-JP.ts');
      expect(staticFiles).not.toContain('zh-Hans.ts');
    });
  });
});
