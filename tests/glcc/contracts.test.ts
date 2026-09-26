/**
 * RENTipid GLCC v1.0 — Contracts & Invariant Unit Tests
 *
 * Verifies:
 * - 0, 2, and 3-minor-unit exponent representations (JPY=0, PHP/USD=2, BHD/KWD=3).
 * - Registry contracts and in-memory test doubles.
 * - Effective date boundary checks.
 * - Architectural invariant validator and assertions.
 * - Non-convertible charge currency enforcement.
 */

import {
  type CurrencyMetadata,
  type CountryProfile,
  type LocaleMetadata,
  createInMemoryRegistryContext,
} from '../../src/lib/glcc/registry-contracts';
import {
  type EffectiveGlobalPreference,
  assertPreferenceInvariants,
  validateEffectivePreference,
  GlccInvariantViolationError,
} from '../../src/lib/glcc/contracts';

describe('GLCC v1.0 — Registry Contracts & Representation', () => {
  const sampleCurrencies: CurrencyMetadata[] = [
    { code: 'PHP', minorUnitExponent: 2, name: 'Philippine Peso', symbol: '₱', isActive: true },
    { code: 'USD', minorUnitExponent: 2, name: 'US Dollar', symbol: '$', isActive: true },
    { code: 'JPY', minorUnitExponent: 0, name: 'Japanese Yen', symbol: '¥', isActive: true },
    { code: 'BHD', minorUnitExponent: 3, name: 'Bahraini Dinar', symbol: 'BD', isActive: true },
    { code: 'KWD', minorUnitExponent: 3, name: 'Kuwaiti Dinar', symbol: 'KD', isActive: true },
    {
      code: 'EUR',
      minorUnitExponent: 2,
      name: 'Euro',
      symbol: '€',
      isActive: true,
      effectiveFrom: '2026-01-01T00:00:00Z',
      effectiveTo: '2026-12-31T23:59:59Z',
    },
    { code: 'OLD', minorUnitExponent: 2, name: 'Old Currency', symbol: 'O', isActive: false },
  ];

  const sampleCountries: CountryProfile[] = [
    {
      code: 'PH',
      name: 'Philippines',
      defaultDisplayCurrency: 'PHP',
      allowedDisplayCurrencies: ['PHP', 'USD', 'JPY'],
      defaultLanguageTag: 'en-PH',
      supportedLanguageTags: ['en-PH', 'fil-PH'],
      defaultTimezone: 'Asia/Manila',
      isActive: true,
    },
    {
      code: 'US',
      name: 'United States',
      defaultDisplayCurrency: 'USD',
      allowedDisplayCurrencies: ['USD'],
      defaultLanguageTag: 'en-US',
      supportedLanguageTags: ['en-US', 'es-US'],
      defaultTimezone: 'America/New_York',
      isActive: true,
    },
    {
      code: 'BH',
      name: 'Bahrain',
      defaultDisplayCurrency: 'BHD',
      allowedDisplayCurrencies: ['BHD', 'USD'],
      defaultLanguageTag: 'ar-BH',
      supportedLanguageTags: ['ar-BH', 'en'],
      defaultTimezone: 'Asia/Bahrain',
      isActive: true,
    },
  ];

  const sampleLocales: LocaleMetadata[] = [
    { tag: 'en-PH', language: 'en', region: 'PH', direction: 'ltr', name: 'English (Philippines)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
    { tag: 'fil-PH', language: 'fil', region: 'PH', direction: 'ltr', name: 'Filipino', nativeName: 'Wikang Filipino', isActive: true, fallbackTag: 'en-PH' },
    { tag: 'en', language: 'en', direction: 'ltr', name: 'English', nativeName: 'English', isActive: true },
    { tag: 'ar-BH', language: 'ar', region: 'BH', direction: 'rtl', name: 'Arabic (Bahrain)', nativeName: 'العربية', isActive: true },
  ];

  const registries = createInMemoryRegistryContext({
    currencies: sampleCurrencies,
    countries: sampleCountries,
    locales: sampleLocales,
    version: '1.0.0-test',
  });

  describe('Exponent metadata representation', () => {
    it('accurately represents 0-minor-unit currency (JPY)', () => {
      const jpy = registries.currencies.get('JPY');
      expect(jpy).not.toBeNull();
      expect(jpy?.minorUnitExponent).toBe(0);
      expect(jpy?.symbol).toBe('¥');
    });

    it('accurately represents 2-minor-unit currencies (PHP, USD)', () => {
      const php = registries.currencies.get('PHP');
      const usd = registries.currencies.get('USD');
      expect(php?.minorUnitExponent).toBe(2);
      expect(usd?.minorUnitExponent).toBe(2);
    });

    it('accurately represents 3-minor-unit currencies (BHD, KWD)', () => {
      const bhd = registries.currencies.get('BHD');
      const kwd = registries.currencies.get('KWD');
      expect(bhd).not.toBeNull();
      expect(bhd?.minorUnitExponent).toBe(3);
      expect(kwd).not.toBeNull();
      expect(kwd?.minorUnitExponent).toBe(3);
    });
  });

  describe('Effective date and active state checks', () => {
    it('rejects inactive currencies', () => {
      expect(registries.currencies.isSupported('OLD')).toBe(false);
      expect(registries.currencies.get('OLD')).toBeNull();
    });

    it('honors effective date windows', () => {
      const beforeWindow = '2025-06-01T00:00:00Z';
      const insideWindow = '2026-06-01T00:00:00Z';
      const afterWindow = '2027-01-01T00:00:00Z';

      expect(registries.currencies.isSupported('EUR', beforeWindow)).toBe(false);
      expect(registries.currencies.isSupported('EUR', insideWindow)).toBe(true);
      expect(registries.currencies.isSupported('EUR', afterWindow)).toBe(false);
    });
  });

  describe('Country and locale registry lookup', () => {
    it('returns allowed display currencies for a country', () => {
      const allowed = registries.countries.getAllowedDisplayCurrencies('PH');
      expect(allowed).toEqual(expect.arrayContaining(['PHP', 'USD', 'JPY']));
      expect(allowed).not.toContain('BHD');
    });

    it('resolves locale fallbacks to language base', () => {
      expect(registries.locales.resolveFallback('en-PH')).toBe('en');
      expect(registries.locales.resolveFallback('fil-PH')).toBe('en-PH');
    });

    it('supports RTL direction metadata for Arabic locale', () => {
      const ar = registries.locales.get('ar-BH');
      expect(ar?.direction).toBe('rtl');
    });
  });

  describe('Invariant validation & assertions', () => {
    const validPreference: EffectiveGlobalPreference = {
      languageTag: 'en-PH',
      countryCode: 'PH',
      displayCurrency: 'USD', // Allowed display currency in PH
      chargeCurrency: 'PHP',  // Standard non-converted charge
      timezone: 'Asia/Manila',
      provenance: {
        language: { source: 'PLATFORM_DEFAULT', isManualOverride: false },
        country: { source: 'EXPLICIT_CHOICE', isManualOverride: true },
        displayCurrency: { source: 'EXPLICIT_CHOICE', isManualOverride: true },
        chargeCurrency: { source: 'PLATFORM_DEFAULT', isManualOverride: false },
      },
      registryVersion: '1.0.0-test',
      policyVersion: '1.0.0',
      resolvedAt: '2026-09-25T00:00:00.000Z',
    };

    it('validates a correct preference successfully', () => {
      const result = validateEffectivePreference(validPreference, registries, 'PHP');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(() => assertPreferenceInvariants(validPreference, registries, 'PHP')).not.toThrow();
    });

    it('fails when display currency is not allowed for the country', () => {
      const invalid = {
        ...validPreference,
        displayCurrency: 'BHD', // BHD is NOT allowed for PH
      };
      const result = validateEffectivePreference(invalid, registries, 'PHP');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Display currency 'BHD' is not allowed for country 'PH'");
      expect(() => assertPreferenceInvariants(invalid, registries, 'PHP')).toThrow(GlccInvariantViolationError);
    });

    it('fails invariant check when charge currency is converted away from platform default', () => {
      const convertedCharge = {
        ...validPreference,
        chargeCurrency: 'USD', // Violation: Charge conversion is prohibited
      };
      const result = validateEffectivePreference(convertedCharge, registries, 'PHP');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("violates charge invariant; must match default 'PHP'");
      expect(() => assertPreferenceInvariants(convertedCharge, registries, 'PHP')).toThrow(GlccInvariantViolationError);
    });

    it('fails when country or language is unsupported', () => {
      const unsupported = {
        ...validPreference,
        countryCode: 'XX',
        languageTag: 'zz-ZZ',
      };
      const result = validateEffectivePreference(unsupported, registries, 'PHP');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
