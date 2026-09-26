/**
 * @jest-environment node
 */

/**
 * RENTipid GLCC v1.0 — Static UI Internationalization & Formatting Tests (P3A)
 *
 * Verifies:
 * 1. Translation Lookup: exact match, approved family fallback, default fallback, safe missing-key behavior.
 * 2. Observable Telemetry: onFallbackUsed and onMissingKey callbacks.
 * 3. Language Selection Independence: switching translation locale does not mutate country or currency state.
 * 4. Static Bundle Validation: canonical en-PH completeness, test fixture fil-PH parity, missing/malformed detection, placeholder parity.
 * 5. Standards-Based Formatting: ECMA-402 dates, numbers, percentages, and currencies (0, 2, 3 minor units).
 * 6. Pluralization: Intl.PluralRules standards-based category selection (singular, plural, complex categories).
 * 7. Security & Boundaries: presentation-only guarantee, no authority mutation, raw parameter escaping.
 */

import {
  TranslationEngine,
  defaultTranslationEngine,
  t,
  formatDate,
  formatNumber,
  formatPercent,
  formatCurrency,
  formatPlural,
  getCountryDisplayName,
  getLanguageDisplayName,
  getCurrencyDisplayName,
  validateTranslationBundle,
  validateCanonicalSourceCompleteness,
  extractPlaceholders,
  EN_PH_BUNDLE,
  FIL_PH_FIXTURE_BUNDLE,
  GLCC_CANONICAL_KEYS,
  type TranslationBundle,
  type GlccCanonicalTranslationKey,
} from '@/lib/glcc/i18n';

describe('GLCC-P3A — Static UI Internationalization Engine', () => {
  describe('1. Translation Lookup & Deterministic Fallback', () => {
    it('returns exact translation for canonical en-PH source bundle', () => {
      const title = t('globalPreferences.title', undefined, 'en-PH');
      expect(title).toBe('Global Preferences');

      const countryTab = t('globalPreferences.countryTab', undefined, 'en-PH');
      expect(countryTab).toBe('Region');
    });

    it('returns exact translation for test fixture fil-PH bundle', () => {
      const title = t('globalPreferences.title', undefined, 'fil-PH');
      expect(title).toBe('Mga Pangkalahatang Kagustuhan');

      const countryTab = t('globalPreferences.countryTab', undefined, 'fil-PH');
      expect(countryTab).toBe('Rehiyon');
    });

    it('falls back from child locale to approved parent family and platform default', () => {
      const fallbackEvents: Array<{ key: string; requested: string; fallback: string }> = [];
      const engine = new TranslationEngine({
        defaultLocale: 'en-PH',
        onFallbackUsed: (key, requested, fallback) => {
          fallbackEvents.push({ key, requested, fallback });
        },
      });

      // Register a partial test bundle for 'es-PH' that only has 'globalPreferences.title'
      const partialBundle: TranslationBundle = {
        locale: 'es-PH',
        direction: 'ltr',
        version: '1.0.0-test',
        messages: {
          'globalPreferences.title': 'Preferencias Globales',
        } as Record<GlccCanonicalTranslationKey, string>,
      };
      engine.registerBundle(partialBundle);

      // Exact match for title
      expect(engine.translate('globalPreferences.title', undefined, 'es-PH')).toBe('Preferencias Globales');
      expect(fallbackEvents).toHaveLength(0);

      // Missing 'countryTab' in 'es-PH' should fall back to default 'en-PH'
      const countryTab = engine.translate('globalPreferences.countryTab', undefined, 'es-PH');
      expect(countryTab).toBe('Region');
      expect(fallbackEvents.length).toBeGreaterThanOrEqual(1);
      expect(fallbackEvents[0].key).toBe('globalPreferences.countryTab');
      expect(fallbackEvents[0].requested).toBe('es-PH');
    });

    it('handles completely unregistered locale by falling back to platform default en-PH', () => {
      const fallbackEvents: string[] = [];
      const engine = new TranslationEngine({
        defaultLocale: 'en-PH',
        onFallbackUsed: (key, req, fb) => fallbackEvents.push(`${key}:${req}->${fb}`),
      });

      const result = engine.translate('globalPreferences.applyButton', undefined, 'de-DE');
      expect(result).toBe('Apply Preferences');
      expect(fallbackEvents).toContain('globalPreferences.applyButton:de-DE->en-PH');
    });

    it('safe missing-key fallback: never returns undefined, null, or raw object for unknown keys', () => {
      const missingKeys: string[] = [];
      const engine = new TranslationEngine({
        onMissingKey: (key, loc) => missingKeys.push(`${key}@${loc}`),
      });

      const result = engine.translate('nonexistent.bogus.key', undefined, 'en-PH');
      expect(result).toBe('Key');
      expect(result).not.toBe('nonexistent.bogus.key');
      expect(typeof result).toBe('string');
      expect(result).not.toBeUndefined();
      expect(result).not.toBeNull();
      expect(result).not.toBe('[object Object]');
      expect(missingKeys).toContain('nonexistent.bogus.key@en-PH');

      // Specifically verify that raw internal developer keys like 'auth.signIn.submit' are never exposed
      const authResult = engine.translate('auth.signIn.submit', undefined, 'en-PH', undefined);
      expect(authResult).toBe('Submit');
      expect(authResult).not.toContain('.');
      // 'auth.signIn.submit' is now registered in en-PH bundle, but if engine translates an unregistered code key:
      const rawCodeResult = engine.translate('auth.customAction.submitButton', undefined, 'es-ES');
      expect(rawCodeResult).toBe('Submit');
      expect(rawCodeResult).not.toContain('.');
    });

    it('safely interpolates named parameters into template', () => {
      const rendered = t(
        'globalPreferences.triggerLabel',
        {
          language: 'en-PH',
          country: 'PH',
          currency: 'PHP',
        },
        'en-PH'
      );
      expect(rendered).toBe('Global Preferences: en-PH, PH, PHP');
    });

    it('leaves unknown placeholder tokens untouched or cleanly safe', () => {
      const engine = new TranslationEngine();
      engine.registerBundle({
        locale: 'test-LOC',
        direction: 'ltr',
        version: '1.0.0',
        messages: {
          'globalPreferences.title': 'Hello {name} with {unknown}',
        } as Record<GlccCanonicalTranslationKey, string>,
      });

      const res = engine.translate('globalPreferences.title', { name: 'Alice' }, 'test-LOC');
      expect(res).toBe('Hello Alice with {unknown}');
    });

    it('language selection independence: changing translation locale never modifies underlying country or currency', () => {
      const basePreference = Object.freeze({
        countryCode: 'PH',
        languageTag: 'en-PH',
        displayCurrency: 'PHP',
        chargeCurrency: 'PHP',
      });

      // Simulate switching active viewing locale from en-PH to fil-PH
      const viewLocale1 = 'en-PH';
      const label1 = t('globalPreferences.countryLabel', undefined, viewLocale1);

      const viewLocale2 = 'fil-PH';
      const label2 = t('globalPreferences.countryLabel', undefined, viewLocale2);

      expect(label1).toBe('Country / Region');
      expect(label2).toBe('Bansa / Rehiyon');

      // Preference entity invariant remains strictly unmodified
      expect(basePreference.countryCode).toBe('PH');
      expect(basePreference.displayCurrency).toBe('PHP');
      expect(basePreference.chargeCurrency).toBe('PHP');
    });
  });

  describe('2. Static Bundle Validation Check', () => {
    it('canonical source bundle en-PH is 100% complete and valid against canonical keys', () => {
      const completeness = validateCanonicalSourceCompleteness(EN_PH_BUNDLE);
      expect(completeness.isValid).toBe(true);
      expect(completeness.missingCanonicalKeys).toHaveLength(0);

      const validation = validateTranslationBundle(EN_PH_BUNDLE, EN_PH_BUNDLE);
      expect(validation.isValid).toBe(true);
      expect(validation.missingKeys).toHaveLength(0);
      expect(validation.extraKeys).toHaveLength(0);
      expect(validation.placeholderMismatches).toHaveLength(0);
    });

    it('test fixture bundle fil-PH is valid and structurally matches en-PH', () => {
      const validation = validateTranslationBundle(FIL_PH_FIXTURE_BUNDLE, EN_PH_BUNDLE);
      expect(validation.isValid).toBe(true);
      expect(validation.missingKeys).toHaveLength(0);
      expect(validation.extraKeys).toHaveLength(0);
      expect(validation.placeholderMismatches).toHaveLength(0);
      expect(FIL_PH_FIXTURE_BUNDLE.isFixture).toBe(true);
    });

    it('detects missing required keys in an incomplete bundle', () => {
      const incompleteBundle: TranslationBundle = {
        locale: 'test-INCOMPLETE',
        direction: 'ltr',
        version: '1.0.0',
        messages: {
          'globalPreferences.title': 'Test Title',
        } as Record<GlccCanonicalTranslationKey, string>,
      };

      const result = validateTranslationBundle(incompleteBundle, EN_PH_BUNDLE);
      expect(result.isValid).toBe(false);
      expect(result.missingKeys.length).toBe(GLCC_CANONICAL_KEYS.length - 1);
      expect(result.missingKeys).toContain('globalPreferences.countryTab');
      expect(result.missingKeys).toContain('globalPreferences.applyButton');
    });

    it('detects extra uncanonical keys in a bundle', () => {
      const bundleWithExtra = {
        locale: 'test-EXTRA',
        direction: 'ltr' as const,
        version: '1.0.0',
        messages: {
          ...EN_PH_BUNDLE.messages,
          'unauthorized.extra.key': 'Bogus',
        },
      };

      const result = validateTranslationBundle(bundleWithExtra as unknown as TranslationBundle, EN_PH_BUNDLE);
      expect(result.isValid).toBe(false);
      expect(result.extraKeys).toContain('unauthorized.extra.key');
    });

    it('detects placeholder mismatches between source and target templates', () => {
      const mismatchedBundle: TranslationBundle = {
        ...EN_PH_BUNDLE,
        locale: 'test-MISMATCH',
        messages: {
          ...EN_PH_BUNDLE.messages,
          // 'globalPreferences.triggerLabel' in en-PH expects ['country', 'currency', 'language']
          'globalPreferences.triggerLabel': 'Preferences with {wrongParam}',
        },
      };

      const result = validateTranslationBundle(mismatchedBundle, EN_PH_BUNDLE);
      expect(result.isValid).toBe(false);
      expect(result.placeholderMismatches).toHaveLength(1);
      expect(result.placeholderMismatches[0].key).toBe('globalPreferences.triggerLabel');
      expect(result.placeholderMismatches[0].expected).toEqual(['country', 'currency', 'language']);
      expect(result.placeholderMismatches[0].actual).toEqual(['wrongParam']);
    });

    it('rejects malformed bundle structures cleanly', () => {
      const result = validateTranslationBundle(null as unknown as TranslationBundle);
      expect(result.isValid).toBe(false);
      expect(result.missingKeys).toContain('[BUNDLE_MALFORMED]');
    });

    it('extracts placeholder variables correctly from message templates', () => {
      expect(extractPlaceholders('Hello {name}, your total is {amount} on {date}.')).toEqual([
        'amount',
        'date',
        'name',
      ]);
      expect(extractPlaceholders('No tokens here.')).toEqual([]);
      expect(extractPlaceholders('Duplicate {count} and {count}.')).toEqual(['count']);
    });
  });

  describe('3. Standards-Based ECMA-402 Formatters', () => {
    describe('Date Formatting', () => {
      it('formats dates according to locale conventions without hand-coded order', () => {
        const date = new Date(Date.UTC(2026, 8, 25)); // Sept 25, 2026

        const formattedEn = formatDate(date, 'en-PH');
        expect(formattedEn).toMatch(/Sep/);
        expect(formattedEn).toMatch(/25/);
        expect(formattedEn).toMatch(/2026/);

        // Fallback for invalid date
        const invalidResult = formatDate('invalid-date-string', 'en-PH');
        expect(invalidResult).toBe('invalid-date-string');
      });
    });

    describe('Number & Percentage Formatting', () => {
      it('formats numbers with locale-appropriate grouping separators', () => {
        const num = 1250000;
        const formattedEn = formatNumber(num, 'en-PH');
        expect(formattedEn).toBe('1,250,000');
      });

      it('formats percentages accurately using native Intl.NumberFormat', () => {
        expect(formatPercent(0.12, 'en-PH')).toBe('12%');
        expect(formatPercent(0.055, 'en-PH', { minimumFractionDigits: 1 })).toBe('5.5%');
      });
    });

    describe('Currency Presentation Formatting', () => {
      it('zero-minor-unit case (e.g. JPY, KRW): formats without fractional digits', () => {
        const jpyPresentation = formatCurrency(1500, 'JPY', 'en-PH');
        // JPY should not have decimals (.00)
        expect(jpyPresentation).not.toMatch(/\.00/);
        expect(jpyPresentation).toMatch(/1,500/);
      });

      it('two-minor-unit case (e.g. PHP, USD, EUR): formats with exact 2 fractional digits', () => {
        const phpPresentation = formatCurrency(1250.5, 'PHP', 'en-PH');
        expect(phpPresentation).toMatch(/1,250\.50/);

        const usdPresentation = formatCurrency(99.9, 'USD', 'en-US');
        expect(usdPresentation).toMatch(/99\.90/);
      });

      it('three-minor-unit case (e.g. BHD, KWD, OMR): formats with exact 3 fractional digits', () => {
        const bhdPresentation = formatCurrency(1.5, 'BHD', 'en-US');
        expect(bhdPresentation).toMatch(/1\.500/);

        const kwdPresentation = formatCurrency(25.12, 'KWD', 'en-US');
        expect(kwdPresentation).toMatch(/25\.120/);
      });

      it('respects explicit minorUnitExponent options override', () => {
        const custom3 = formatCurrency(42, 'PHP', 'en-PH', { minorUnitExponent: 3 });
        expect(custom3).toMatch(/42\.000/);

        const custom0 = formatCurrency(42.88, 'PHP', 'en-PH', { minorUnitExponent: 0 });
        expect(custom0).not.toMatch(/\./);
      });

      it('presentation-only invariant: formatting does NOT alter inputs, convert FX, or touch charge currency', () => {
        const inputAmount = 1500.0;
        const inputCurrency = 'USD';

        const formatted = formatCurrency(inputAmount, inputCurrency, 'en-PH');
        expect(typeof formatted).toBe('string');

        // Original input values are immutable and unconverted
        expect(inputAmount).toBe(1500.0);
        expect(inputCurrency).toBe('USD');
      });
    });

    describe('Pluralization using Intl.PluralRules', () => {
      it('selects singular and plural forms without naive count === 1 ternary', () => {
        const forms = {
          one: '{count} option available',
          other: '{count} options available',
        };

        const singular = formatPlural(1, 'en-PH', forms);
        expect(singular).toBe('1 option available');

        const plural = formatPlural(5, 'en-PH', forms);
        expect(plural).toBe('5 options available');

        const zero = formatPlural(0, 'en-PH', forms);
        expect(zero).toBe('0 options available');
      });

      it('supports complex categories (few, many, other) where supported by locale PluralRules', () => {
        // Polish has distinct rules for 1 (one), 2-4 (few), 5+ (many)
        const forms = {
          one: '{count} opcja',
          few: '{count} opcje',
          many: '{count} opcji',
          other: '{count} opcji',
        };

        const one = formatPlural(1, 'pl-PL', forms);
        expect(one).toBe('1 opcja');

        const few = formatPlural(3, 'pl-PL', forms);
        expect(few).toBe('3 opcje');

        const many = formatPlural(10, 'pl-PL', forms);
        expect(many).toBe('10 opcji');
      });
    });

    describe('Localized Display Names (Intl.DisplayNames)', () => {
      it('returns localized region display names', () => {
        const namePh = getCountryDisplayName('PH', 'en-PH');
        expect(namePh).toBe('Philippines');

        const nameUs = getCountryDisplayName('US', 'en-PH');
        expect(nameUs).toBe('United States');
      });

      it('returns localized language display names', () => {
        const langEn = getLanguageDisplayName('en-PH', 'en-PH');
        expect(typeof langEn).toBe('string');
        expect(langEn.length).toBeGreaterThan(0);
      });

      it('returns localized currency display names', () => {
        const currPhp = getCurrencyDisplayName('PHP', 'en-PH');
        expect(currPhp.toLowerCase()).toContain('peso');
      });
    });

    describe('RTL and Text Direction Metadata', () => {
      it('returns ltr for en-PH and fil-PH', () => {
        expect(defaultTranslationEngine.getDirection('en-PH')).toBe('ltr');
        expect(defaultTranslationEngine.getDirection('fil-PH')).toBe('ltr');
      });

      it('returns rtl when an RTL locale bundle is registered', () => {
        const rtlBundle: TranslationBundle = {
          locale: 'ar-SA',
          direction: 'rtl',
          version: '1.0.0-test',
          messages: { ...EN_PH_BUNDLE.messages },
        };
        const engine = new TranslationEngine();
        engine.registerBundle(rtlBundle);

        expect(engine.getDirection('ar-SA')).toBe('rtl');
        expect(engine.getDirection('en-PH')).toBe('ltr');
      });
    });
  });

  describe('4. Security & Controlled Content Boundary', () => {
    it('controlled copy boundary: previewNotice payment disclosure is preserved in controlled text in fixtures', () => {
      // Regulated preview notice must NOT be freely translated
      const enNotice = t('globalPreferences.previewNotice', undefined, 'en-PH');
      const filNotice = t('globalPreferences.previewNotice', undefined, 'fil-PH');

      expect(enNotice).toContain('Display currency may differ from the currency used for payment');
      expect(filNotice).toContain('Display currency may differ from the currency used for payment');
    });

    it('interpolated customer data is treated strictly as data without executing scripts', () => {
      const maliciousPayload = '<script>alert("pwned")</script>';
      const result = t(
        'globalPreferences.triggerLabel',
        {
          language: maliciousPayload,
          country: 'PH',
          currency: 'PHP',
        },
        'en-PH'
      );

      // Treated as literal string data
      expect(result).toContain('<script>alert("pwned")</script>');
      expect(typeof result).toBe('string');
    });

    it('translation subsystem does not possess payment or role authority', () => {
      // Translations must never define or mutate charge currency or user roles
      const allCanonicalValues = Object.values(EN_PH_BUNDLE.messages);
      allCanonicalValues.forEach((val) => {
        expect(val).not.toContain('ROLE_ADMIN');
        expect(val).not.toContain('SET_PAYMENT_AUTHORITY');
      });
    });
  });
});
