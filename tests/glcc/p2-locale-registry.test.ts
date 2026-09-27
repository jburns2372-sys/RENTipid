/**
 * RENTipid GLCC v1.0.1 — P2 Locale Registry Unit Tests
 * Controlling Document: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 *
 * Verifies:
 * 1. Standards-based BCP-47 locale tag validation (valid and malformed).
 * 2. Deterministic registry validation (duplicate rejection, direction, native/English names).
 * 3. Lifecycle status model (REGISTERED, TRANSLATION_IN_PROGRESS, QA_REQUIRED, PRODUCTION_READY, DISABLED).
 * 4. Production-selectability rule (enabled === true && releaseStatus === 'PRODUCTION_READY').
 * 5. Current locale classifications (en-PH is PRODUCTION_READY; fil-PH is QA_REQUIRED; ja-JP/en-US are NOT PRODUCTION_READY).
 * 6. Explicit fallback model and cycle detection (circular fallback rejection).
 * 7. Direction and RTL metadata.
 * 8. Authoritative query API (getLocale, getEnabledLocales, getProductionReadyLocales, isLocaleProductionSelectable, resolveFallbackLocale).
 * 9. Absolute independence of Language from Country, Currency, and Payment Authority.
 * 10. Prevention of automatic status promotion.
 */

import {
  type LocaleMetadata,
  type LocaleReleaseStatus,
  createInMemoryRegistryContext,
  validateBcp47LocaleTag,
  isLocaleProductionSelectable,
} from '../../src/lib/glcc/registry-contracts';
import {
  getDefaultRegistryContext,
  clearCachedRegistryContext,
} from '../../src/lib/glcc/default-registries';
import {
  resolveGlobalPreference,
} from '../../src/lib/glcc/preference-resolver';
import { DEFAULT_PLATFORM_PREFERENCE } from '../../src/lib/glcc/default-registries';

describe('GLCC P2 — Authoritative Locale Registry', () => {
  beforeEach(() => {
    clearCachedRegistryContext();
  });

  describe('1. BCP-47 Locale Tag Validation', () => {
    it('validates canonical BCP-47 locale tags', () => {
      const validTags = ['en-PH', 'fil-PH', 'en-US', 'ja-JP', 'zh-CN', 'zh-TW', 'ar-AE', 'en', 'fil'];
      for (const tag of validTags) {
        const res = validateBcp47LocaleTag(tag);
        expect(res.isValid).toBe(true);
        expect(res.error).toBeUndefined();
      }
    });

    it('rejects malformed or non-standard locale tags', () => {
      const invalidTags = [
        '',
        '   ',
        'invalid--tag',
        '123-PH',
        'en-TOOLONGREGION',
        'en_PH', // Underscore is POSIX, not BCP-47
        'fil_PH',
        '@#$%',
      ];
      for (const tag of invalidTags) {
        const res = validateBcp47LocaleTag(tag);
        expect(res.isValid).toBe(false);
        expect(res.error).toBeDefined();
      }
    });
  });

  describe('2. Registry Construction & Validation Rules', () => {
    it('rejects duplicate locale tags in registry', () => {
      expect(() => {
        createInMemoryRegistryContext({
          locales: [
            {
              tag: 'en-PH',
              language: 'en',
              direction: 'ltr',
              name: 'English (Philippines)',
              nativeName: 'English',
              isActive: true,
              releaseStatus: 'PRODUCTION_READY',
            },
            {
              tag: 'en-PH',
              language: 'en',
              direction: 'ltr',
              name: 'Duplicate English',
              nativeName: 'English',
              isActive: true,
              releaseStatus: 'PRODUCTION_READY',
            },
          ],
        });
      }).toThrow(/Duplicate locale tag detected in registry: 'en-PH'/);
    });

    it('rejects locales with unsupported direction', () => {
      expect(() => {
        createInMemoryRegistryContext({
          locales: [
            {
              tag: 'en-PH',
              language: 'en',
              // @ts-expect-error Testing invalid direction
              direction: 'up-down',
              name: 'English',
              nativeName: 'English',
              isActive: true,
            },
          ],
        });
      }).toThrow(/Unsupported direction 'up-down'/);
    });

    it('rejects locales with missing nativeName or englishName', () => {
      expect(() => {
        createInMemoryRegistryContext({
          locales: [
            {
              tag: 'en-PH',
              language: 'en',
              direction: 'ltr',
              name: '',
              nativeName: 'English',
              isActive: true,
            },
          ],
        });
      }).toThrow(/must have a non-empty englishName\/name/);

      expect(() => {
        createInMemoryRegistryContext({
          locales: [
            {
              tag: 'en-PH',
              language: 'en',
              direction: 'ltr',
              name: 'English',
              nativeName: '',
              isActive: true,
            },
          ],
        });
      }).toThrow(/must have a non-empty nativeName/);
    });

    it('rejects contradictory configuration where PRODUCTION_READY is inactive/disabled', () => {
      expect(() => {
        createInMemoryRegistryContext({
          locales: [
            {
              tag: 'en-PH',
              language: 'en',
              direction: 'ltr',
              name: 'English',
              nativeName: 'English',
              isActive: false,
              releaseStatus: 'PRODUCTION_READY',
            },
          ],
        });
      }).toThrow(/Production-ready locale 'en-PH' cannot have isActive=false/);
    });
  });

  describe('3. Fallback Graph & Circular Fallback Prevention', () => {
    it('rejects self-referential fallback tag', () => {
      expect(() => {
        createInMemoryRegistryContext({
          locales: [
            {
              tag: 'en-PH',
              language: 'en',
              direction: 'ltr',
              name: 'English',
              nativeName: 'English',
              isActive: true,
              fallbackTag: 'en-PH',
            },
          ],
        });
      }).toThrow(/cannot have self-referential fallback/);
    });

    it('rejects circular fallback chains (A -> B -> A)', () => {
      expect(() => {
        createInMemoryRegistryContext({
          locales: [
            {
              tag: 'fil-PH',
              language: 'fil',
              direction: 'ltr',
              name: 'Filipino',
              nativeName: 'Filipino',
              isActive: true,
              fallbackTag: 'en-PH',
            },
            {
              tag: 'en-PH',
              language: 'en',
              direction: 'ltr',
              name: 'English',
              nativeName: 'English',
              isActive: true,
              fallbackTag: 'fil-PH',
            },
          ],
        });
      }).toThrow(/Circular locale fallback detected in chain/);
    });

    it('resolves valid acyclic fallback chain', () => {
      const reg = createInMemoryRegistryContext({
        locales: [
          {
            tag: 'fil-PH',
            language: 'fil',
            direction: 'ltr',
            name: 'Filipino (Philippines)',
            nativeName: 'Wikang Filipino',
            isActive: true,
            fallbackTag: 'en-PH',
          },
          {
            tag: 'en-PH',
            language: 'en',
            direction: 'ltr',
            name: 'English (Philippines)',
            nativeName: 'English',
            isActive: true,
          },
        ],
      });

      expect(reg.locales.resolveFallback('fil-PH')).toBe('en-PH');
      expect(reg.locales.resolveFallback('en-PH')).toBeNull();
    });
  });

  describe('4. Production Selectability Rule & Lifecycle Status Model', () => {
    it('enforces that ONLY locales with enabled=true AND status=PRODUCTION_READY are selectable', () => {
      const statuses: LocaleReleaseStatus[] = [
        'REGISTERED',
        'TRANSLATION_IN_PROGRESS',
        'QA_REQUIRED',
        'DISABLED',
      ];

      for (const status of statuses) {
        const metadata: LocaleMetadata = {
          tag: 'test-LOC',
          language: 'test',
          direction: 'ltr',
          name: 'Test',
          nativeName: 'Test',
          isActive: true,
          enabled: true,
          releaseStatus: status,
        };
        expect(isLocaleProductionSelectable(metadata)).toBe(false);
      }

      const prodReady: LocaleMetadata = {
        tag: 'en-PH',
        language: 'en',
        direction: 'ltr',
        name: 'English',
        nativeName: 'English',
        isActive: true,
        enabled: true,
        releaseStatus: 'PRODUCTION_READY',
      };
      expect(isLocaleProductionSelectable(prodReady)).toBe(true);

      const prodReadyDisabled: LocaleMetadata = {
        tag: 'en-PH',
        language: 'en',
        direction: 'ltr',
        name: 'English',
        nativeName: 'English',
        isActive: false,
        enabled: false,
        releaseStatus: 'PRODUCTION_READY',
      };
      expect(isLocaleProductionSelectable(prodReadyDisabled)).toBe(false);
    });
  });

  describe('5. Default Registry Locale Classifications (Current Evidence)', () => {
    it('classifies en-PH correctly as PRODUCTION_READY and selectable', () => {
      const ctx = getDefaultRegistryContext();
      const en = ctx.locales.get('en-PH');
      expect(en).not.toBeNull();
      expect(en?.releaseStatus).toBe('PRODUCTION_READY');
      expect(en?.isActive).toBe(true);
      expect(ctx.locales.isLocaleProductionSelectable('en-PH')).toBe(true);
    });

    it('classifies fil-PH as QA_REQUIRED and NOT Production-ready under Master Plan rules', () => {
      const ctx = getDefaultRegistryContext();
      const fil = ctx.locales.get('fil-PH');
      expect(fil).not.toBeNull();
      expect(fil?.releaseStatus).toBe('QA_REQUIRED');
      expect(fil?.isActive).toBe(true);
      // fil-PH is supported in registry, but NOT yet Production-selectable
      expect(ctx.locales.isSupported('fil-PH')).toBe(true);
      expect(ctx.locales.isLocaleProductionSelectable('fil-PH')).toBe(false);
    });

    it('classifies en-US as TRANSLATION_IN_PROGRESS and NOT Production-ready', () => {
      const ctx = getDefaultRegistryContext();
      const enUs = ctx.locales.get('en-US');
      expect(enUs).not.toBeNull();
      expect(enUs?.releaseStatus).toBe('TRANSLATION_IN_PROGRESS');
      expect(ctx.locales.isLocaleProductionSelectable('en-US')).toBe(false);
    });

    it('classifies ja-JP as REGISTERED and NOT Production-ready', () => {
      const ctx = getDefaultRegistryContext();
      const ja = ctx.locales.get('ja-JP');
      expect(ja).not.toBeNull();
      expect(ja?.releaseStatus).toBe('REGISTERED');
      expect(ctx.locales.isLocaleProductionSelectable('ja-JP')).toBe(false);
    });

    it('getProductionReadyLocales returns ONLY en-PH', () => {
      const ctx = getDefaultRegistryContext();
      const prodLocales = ctx.locales.getProductionReadyLocales();
      const tags = prodLocales.map(l => l.tag);
      expect(tags).toEqual(['en-PH']);
      expect(tags).not.toContain('fil-PH');
      expect(tags).not.toContain('ja-JP');
      expect(tags).not.toContain('en-US');
    });

    it('getEnabledLocales returns all active registered locales', () => {
      const ctx = getDefaultRegistryContext();
      const enabled = ctx.locales.getEnabledLocales();
      const tags = enabled.map(l => l.tag);
      expect(tags).toContain('en-PH');
      expect(tags).toContain('fil-PH');
      expect(tags).toContain('en-US');
      expect(tags).toContain('ja-JP');
    });
  });

  describe('6. Direction & Native Display Names', () => {
    it('supports native and English names without using country flags as language identity', () => {
      const ctx = getDefaultRegistryContext();
      const fil = ctx.locales.get('fil-PH');
      expect(fil?.nativeName).toBe('Wikang Filipino');
      expect(fil?.englishName).toBe('Filipino (Philippines)');

      const ja = ctx.locales.get('ja-JP');
      expect(ja?.nativeName).toBe('日本語');
      expect(ja?.englishName).toBe('Japanese');
      expect(ja?.script).toBe('Jpan');
    });

    it('correctly maps direction metadata', () => {
      const ctx = getDefaultRegistryContext();
      expect(ctx.locales.get('en-PH')?.direction).toBe('ltr');
      expect(ctx.locales.get('fil-PH')?.direction).toBe('ltr');
    });

    it('supports future RTL languages (e.g. Arabic) without activating them prematurely', () => {
      const reg = createInMemoryRegistryContext({
        locales: [
          {
            tag: 'ar-AE',
            language: 'ar',
            region: 'AE',
            direction: 'rtl',
            name: 'Arabic (UAE)',
            nativeName: 'العربية',
            isActive: false,
            releaseStatus: 'REGISTERED',
          },
        ],
      });
      const ar = reg.locales.getRaw ? reg.locales.getRaw('ar-AE') : null;
      expect(ar?.direction).toBe('rtl');
      expect(reg.locales.isLocaleProductionSelectable('ar-AE')).toBe(false);
    });
  });

  describe('7. Language, Country, Currency & Payment Independence', () => {
    it('guarantees that selecting language never mutates country or currency in preference resolver', () => {
      const ctx = getDefaultRegistryContext();

      // Resolve preference with explicit language choice 'fil-PH'
      const resolved = resolveGlobalPreference(
        {
          explicitChoice: {
            languageTag: 'fil-PH',
          },
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
        },
        ctx
      );

      // Language resolved to fil-PH
      expect(resolved.languageTag).toBe('fil-PH');
      // Country strictly remained PH
      expect(resolved.countryCode).toBe('PH');
      // Display currency strictly remained PHP
      expect(resolved.displayCurrency).toBe('PHP');
      // Charge currency strictly remained PHP (financial invariant)
      expect(resolved.chargeCurrency).toBe('PHP');
    });

    it('guarantees that language change never alters charge currency from immutable PHP', () => {
      const ctx = getDefaultRegistryContext();
      const resolved = resolveGlobalPreference(
        {
          explicitChoice: {
            languageTag: 'ja-JP',
          },
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
        },
        ctx
      );

      expect(resolved.languageTag).toBe('ja-JP');
      expect(resolved.chargeCurrency).toBe('PHP');
    });
  });

  describe('8. No Automatic Status Promotion', () => {
    it('does not auto-promote status merely because dictionary or fixture exists', () => {
      const customReg = createInMemoryRegistryContext({
        locales: [
          {
            tag: 'fil-PH',
            language: 'fil',
            region: 'PH',
            direction: 'ltr',
            name: 'Filipino',
            nativeName: 'Wikang Filipino',
            isActive: true,
            releaseStatus: 'QA_REQUIRED',
          },
        ],
      });

      const fil = customReg.locales.get('fil-PH');
      expect(fil?.releaseStatus).toBe('QA_REQUIRED');
      expect(customReg.locales.isLocaleProductionSelectable('fil-PH')).toBe(false);
    });
  });
});
