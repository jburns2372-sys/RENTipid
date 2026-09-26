/**
 * RENTipid GLCC v1.0 — Work Package P4A Test Suite
 *
 * Validates:
 * 1. Effective-dated CountryProfile resolution (active, future, expired, disabled, unsupported).
 * 2. Country selection automatically applies configured defaultDisplayCurrency.
 * 3. Language independence: country change never mutates language; language change never alters country or currency.
 * 4. Display-currency override rules (feature flag enabled vs disabled, allowed vs disallowed currency, active vs inactive currency).
 * 5. Manual override retention policy (RESET_TO_COUNTRY_DEFAULT authoritative behavior).
 * 6. Financial authority boundary: chargeCurrency remains strictly PHP (0 FX, no foreign charge, no processor mutation).
 * 7. CurrencyRegistry minor-unit metadata (0 digits: JPY, 2 digits: PHP/USD/EUR, 3 digits: BHD/KWD).
 * 8. Auditable provenance & deterministic policy outcomes.
 * 9. API & UX integration regression compatibility.
 */

import {
  resolveCountryCurrencyPolicy,
  resolveEffectiveCountryProfile,
  validateCurrencyMinorUnits,
} from '@/lib/glcc/country-policy';
import {
  createInMemoryRegistryContext,
  type RegistryContext,
} from '@/lib/glcc/registry-contracts';
import {
  getDefaultRegistryContext,
  DEFAULT_PLATFORM_PREFERENCE,
} from '@/lib/glcc/default-registries';
import { resolveGlobalPreference } from '@/lib/glcc/preference-resolver';

describe('GLCC P4A: Country Profile & Country-to-Currency Policy Foundation', () => {
  // Test Fixture Dates
  const T_PAST = '2025-06-01T00:00:00.000Z';
  const T_ACTIVE = '2026-06-01T00:00:00.000Z';
  const T_BOUNDARY_FROM = '2026-01-01T00:00:00.000Z';
  const T_BOUNDARY_TO = '2026-12-31T23:59:59.999Z';
  const T_FUTURE = '2027-06-01T00:00:00.000Z';

  // Standard Test Registries
  let testContext: RegistryContext;

  beforeEach(() => {
    testContext = createInMemoryRegistryContext({
      currencies: [
        { code: 'PHP', minorUnitExponent: 2, name: 'Philippine Peso', symbol: '₱', isActive: true },
        { code: 'USD', minorUnitExponent: 2, name: 'US Dollar', symbol: '$', isActive: true },
        { code: 'JPY', minorUnitExponent: 0, name: 'Japanese Yen', symbol: '¥', isActive: true },
        { code: 'EUR', minorUnitExponent: 2, name: 'Euro', symbol: '€', isActive: true },
        { code: 'BHD', minorUnitExponent: 3, name: 'Bahraini Dinar', symbol: 'BD', isActive: true },
        { code: 'KWD', minorUnitExponent: 3, name: 'Kuwaiti Dinar', symbol: 'KD', isActive: true },
        {
          code: 'INACTIVE_CUR',
          minorUnitExponent: 2,
          name: 'Inactive Currency',
          symbol: 'X',
          isActive: false,
        },
        {
          code: 'FUTURE_CUR',
          minorUnitExponent: 2,
          name: 'Future Currency',
          symbol: 'F',
          isActive: true,
          effectiveFrom: '2027-01-01T00:00:00.000Z',
        },
      ],
      countries: [
        {
          code: 'PH',
          countryCode: 'PH',
          name: 'Philippines',
          defaultDisplayCurrency: 'PHP',
          allowedDisplayCurrencies: ['PHP', 'USD'],
          allowedChargeCurrencies: ['PHP'],
          defaultLanguageTag: 'en-PH',
          supportedLanguageTags: ['en-PH', 'fil-PH'],
          defaultTimezone: 'Asia/Manila',
          timezoneDefault: 'Asia/Manila',
          unitSystem: 'metric',
          isActive: true,
          enabled: true,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          configVersion: '1.0.0',
        },
        {
          code: 'US',
          countryCode: 'US',
          name: 'United States',
          defaultDisplayCurrency: 'USD',
          allowedDisplayCurrencies: ['USD', 'EUR'],
          allowedChargeCurrencies: ['PHP'],
          defaultLanguageTag: 'en-US',
          supportedLanguageTags: ['en-US'],
          defaultTimezone: 'America/New_York',
          timezoneDefault: 'America/New_York',
          unitSystem: 'imperial',
          isActive: true,
          enabled: true,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          configVersion: '1.0.0',
        },
        {
          code: 'JP',
          countryCode: 'JP',
          name: 'Japan',
          defaultDisplayCurrency: 'JPY',
          allowedDisplayCurrencies: ['JPY', 'USD'],
          allowedChargeCurrencies: ['PHP'],
          defaultLanguageTag: 'ja-JP',
          supportedLanguageTags: ['ja-JP', 'en-US'],
          defaultTimezone: 'Asia/Tokyo',
          timezoneDefault: 'Asia/Tokyo',
          unitSystem: 'metric',
          isActive: true,
          enabled: true,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          configVersion: '1.0.0',
        },
        // TEST ONLY — NOT PRODUCTION ENABLED: Expired Profile
        {
          code: 'EXPIRED_CTRY',
          name: 'Expired Country',
          defaultDisplayCurrency: 'USD',
          allowedDisplayCurrencies: ['USD'],
          defaultLanguageTag: 'en-US',
          supportedLanguageTags: ['en-US'],
          isActive: true,
          effectiveFrom: '2025-01-01T00:00:00.000Z',
          effectiveTo: '2025-12-31T23:59:59.999Z',
        },
        // TEST ONLY — NOT PRODUCTION ENABLED: Future Profile
        {
          code: 'FUTURE_CTRY',
          name: 'Future Country',
          defaultDisplayCurrency: 'USD',
          allowedDisplayCurrencies: ['USD'],
          defaultLanguageTag: 'en-US',
          supportedLanguageTags: ['en-US'],
          isActive: true,
          effectiveFrom: '2027-01-01T00:00:00.000Z',
        },
        // TEST ONLY — NOT PRODUCTION ENABLED: Disabled Country
        {
          code: 'DISABLED_CTRY',
          name: 'Disabled Country',
          defaultDisplayCurrency: 'USD',
          allowedDisplayCurrencies: ['USD'],
          defaultLanguageTag: 'en-US',
          supportedLanguageTags: ['en-US'],
          isActive: false,
          enabled: false,
        },
        // TEST ONLY — NOT PRODUCTION ENABLED: Country with Inactive Default Currency
        {
          code: 'BAD_CUR_CTRY',
          name: 'Bad Currency Country',
          defaultDisplayCurrency: 'INACTIVE_CUR',
          allowedDisplayCurrencies: ['INACTIVE_CUR', 'USD'],
          defaultLanguageTag: 'en-US',
          supportedLanguageTags: ['en-US'],
          isActive: true,
        },
        // TEST ONLY — NOT PRODUCTION ENABLED: Three-digit minor unit country
        {
          code: 'BH',
          countryCode: 'BH',
          name: 'Bahrain',
          defaultDisplayCurrency: 'BHD',
          allowedDisplayCurrencies: ['BHD', 'USD'],
          allowedChargeCurrencies: ['PHP'],
          defaultLanguageTag: 'ar-BH',
          supportedLanguageTags: ['ar-BH', 'en-US'],
          unitSystem: 'metric',
          isActive: true,
        },
      ],
      locales: [
        { tag: 'en-PH', language: 'en', region: 'PH', direction: 'ltr', name: 'English (Philippines)', nativeName: 'English', isActive: true },
        { tag: 'fil-PH', language: 'fil', region: 'PH', direction: 'ltr', name: 'Filipino', nativeName: 'Filipino', isActive: true },
        { tag: 'en-US', language: 'en', region: 'US', direction: 'ltr', name: 'English (US)', nativeName: 'English (US)', isActive: true },
        { tag: 'ja-JP', language: 'ja', region: 'JP', direction: 'ltr', name: 'Japanese', nativeName: '日本語', isActive: true },
        { tag: 'ar-BH', language: 'ar', region: 'BH', direction: 'rtl', name: 'Arabic (Bahrain)', nativeName: 'العربية', isActive: true },
      ],
      version: '1.0.0-test',
    });
  });

  describe('1. Effective-Dated CountryProfile Resolution', () => {
    it('resolves active CountryProfile within effective window', () => {
      const result = resolveEffectiveCountryProfile('PH', testContext.countries, T_ACTIVE);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.countryProfile.code).toBe('PH');
        expect(result.countryProfile.defaultDisplayCurrency).toBe('PHP');
        expect(result.countryProfile.unitSystem).toBe('metric');
        expect(result.countryProfile.allowedChargeCurrencies).toEqual(['PHP']);
      }
    });

    it('rejects unsupported country code', () => {
      const result = resolveEffectiveCountryProfile('XX', testContext.countries, T_ACTIVE);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.failureReason).toBe('UNSUPPORTED_COUNTRY');
      }
    });

    it('rejects empty or whitespace country code', () => {
      const result = resolveEffectiveCountryProfile('   ', testContext.countries, T_ACTIVE);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.failureReason).toBe('UNSUPPORTED_COUNTRY');
      }
    });

    it('rejects disabled country profile', () => {
      const result = resolveEffectiveCountryProfile('DISABLED_CTRY', testContext.countries, T_ACTIVE);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.failureReason).toBe('DISABLED_COUNTRY');
      }
    });

    it('rejects future country profile before its effectiveFrom date', () => {
      const result = resolveEffectiveCountryProfile('FUTURE_CTRY', testContext.countries, T_ACTIVE);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.failureReason).toBe('FUTURE_COUNTRY_PROFILE');
      }
    });

    it('activates future country profile once effective date is reached', () => {
      const result = resolveEffectiveCountryProfile('FUTURE_CTRY', testContext.countries, T_FUTURE);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.countryProfile.code).toBe('FUTURE_CTRY');
      }
    });

    it('rejects expired country profile after its effectiveTo date', () => {
      const result = resolveEffectiveCountryProfile('EXPIRED_CTRY', testContext.countries, T_ACTIVE);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.failureReason).toBe('EXPIRED_COUNTRY_PROFILE');
      }
    });

    it('resolves expired country profile if evaluation time is in its active window', () => {
      const result = resolveEffectiveCountryProfile('EXPIRED_CTRY', testContext.countries, T_PAST);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.countryProfile.code).toBe('EXPIRED_CTRY');
      }
    });

    it('verifies exact boundary transition for CountryProfile', () => {
      // Exactly at effectiveFrom boundary
      const boundaryStart = resolveEffectiveCountryProfile('PH', testContext.countries, T_BOUNDARY_FROM);
      expect(boundaryStart.success).toBe(true);

      // 1 ms before effectiveFrom boundary
      const beforeStart = new Date(new Date(T_BOUNDARY_FROM).getTime() - 1).toISOString();
      const resultBefore = resolveEffectiveCountryProfile('PH', testContext.countries, beforeStart);
      expect(resultBefore.success).toBe(false);

      // Within boundary window
      const withinWindow = resolveEffectiveCountryProfile('PH', testContext.countries, T_BOUNDARY_TO);
      expect(withinWindow.success).toBe(true);
    });
  });

  describe('2. Country Selection Applies Configured Default Currency', () => {
    it('automatically applies PHP when selecting PH', () => {
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'PH',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.success).toBe(true);
      expect(result.countryCode).toBe('PH');
      expect(result.displayCurrency).toBe('PHP');
      expect(result.isManualDisplayOverride).toBe(false);
      expect(result.appliedCountryDefault).toBe(true);
      expect(result.outcome).toBe('APPLIED_COUNTRY_DEFAULT');
    });

    it('automatically applies USD when selecting US', () => {
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'US',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.success).toBe(true);
      expect(result.countryCode).toBe('US');
      expect(result.displayCurrency).toBe('USD');
      expect(result.isManualDisplayOverride).toBe(false);
      expect(result.appliedCountryDefault).toBe(true);
      expect(result.outcome).toBe('APPLIED_COUNTRY_DEFAULT');
    });

    it('automatically applies JPY when selecting JP', () => {
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'JP',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.success).toBe(true);
      expect(result.countryCode).toBe('JP');
      expect(result.displayCurrency).toBe('JPY');
      expect(result.outcome).toBe('APPLIED_COUNTRY_DEFAULT');
    });

    it('fails closed to platform default if country default currency is inactive in CurrencyRegistry', () => {
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'BAD_CUR_CTRY',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.success).toBe(false);
      expect(result.countryCode).toBe('PH');
      expect(result.displayCurrency).toBe('PHP');
      expect(result.outcome).toBe('FAILED_CLOSED_FALLBACK');
      expect(result.reason).toContain('missing or inactive');
    });
  });

  describe('3. Display-Currency Override Rules & Feature Flag Gating', () => {
    it('accepts allowed override when currencyOverrideFeatureEnabled is true', () => {
      // US profile allows ['USD', 'EUR']
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'US',
        requestedDisplayCurrency: 'EUR',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.success).toBe(true);
      expect(result.countryCode).toBe('US');
      expect(result.displayCurrency).toBe('EUR');
      expect(result.isManualDisplayOverride).toBe(true);
      expect(result.appliedCountryDefault).toBe(false);
      expect(result.outcome).toBe('ACCEPTED_EXPLICIT_OVERRIDE');
    });

    it('rejects override and applies country default when feature flag is false', () => {
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'US',
        requestedDisplayCurrency: 'EUR',
        currencyOverrideFeatureEnabled: false, // Flag disabled
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.success).toBe(true);
      expect(result.countryCode).toBe('US');
      expect(result.displayCurrency).toBe('USD'); // Default restored
      expect(result.isManualDisplayOverride).toBe(false);
      expect(result.appliedCountryDefault).toBe(true);
      expect(result.outcome).toBe('REJECTED_OVERRIDE_APPLIED_DEFAULT');
      expect(result.rejectionReason).toBe('OVERRIDE_FEATURE_DISABLED');
    });

    it('rejects override if requested currency is not in country allowedDisplayCurrencies', () => {
      // US profile allows only ['USD', 'EUR'], not 'JPY'
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'US',
        requestedDisplayCurrency: 'JPY',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.success).toBe(true);
      expect(result.countryCode).toBe('US');
      expect(result.displayCurrency).toBe('USD'); // Default restored
      expect(result.isManualDisplayOverride).toBe(false);
      expect(result.outcome).toBe('REJECTED_OVERRIDE_APPLIED_DEFAULT');
      expect(result.rejectionReason).toBe('CURRENCY_NOT_ALLOWED_FOR_COUNTRY');
    });

    it('rejects override if requested currency is inactive in CurrencyRegistry', () => {
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'BAD_CUR_CTRY',
        requestedDisplayCurrency: 'INACTIVE_CUR',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.outcome).toBe('FAILED_CLOSED_FALLBACK');
    });
  });

  describe('4. Manual Override Retention Policy (RESET_TO_COUNTRY_DEFAULT)', () => {
    it('resets display currency to new country default when changing country under RESET_TO_COUNTRY_DEFAULT', () => {
      // User was in US with EUR manual override. User changes country to JP.
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'JP',
        currentCountryCode: 'US',
        currentDisplayCurrency: 'EUR',
        currentIsManualDisplayOverride: true,
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
        countryChangePolicy: 'RESET_TO_COUNTRY_DEFAULT',
      });

      expect(result.success).toBe(true);
      expect(result.countryCode).toBe('JP');
      expect(result.displayCurrency).toBe('JPY'); // Reset to JP default
      expect(result.isManualDisplayOverride).toBe(false);
      expect(result.outcome).toBe('APPLIED_COUNTRY_DEFAULT');
      expect(result.provenance.isCountryChanged).toBe(true);
      expect(result.provenance.retentionPolicyApplied).toBe('RESET_TO_COUNTRY_DEFAULT');
    });

    it('allows explicit override in same country change request if valid and allowed', () => {
      // User changes country to JP AND explicitly requests USD (which JP allows: ['JPY', 'USD'])
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'JP',
        currentCountryCode: 'US',
        requestedDisplayCurrency: 'USD',
        currentDisplayCurrency: 'USD',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
        countryChangePolicy: 'RESET_TO_COUNTRY_DEFAULT',
      });

      expect(result.success).toBe(true);
      expect(result.countryCode).toBe('JP');
      expect(result.displayCurrency).toBe('USD');
      expect(result.isManualDisplayOverride).toBe(true);
      expect(result.outcome).toBe('ACCEPTED_EXPLICIT_OVERRIDE');
    });

    it('maintains existing override when country did not change', () => {
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'US',
        currentCountryCode: 'US',
        currentDisplayCurrency: 'EUR',
        currentIsManualDisplayOverride: true,
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.success).toBe(true);
      expect(result.countryCode).toBe('US');
      expect(result.displayCurrency).toBe('EUR');
      expect(result.isManualDisplayOverride).toBe(true);
      expect(result.outcome).toBe('RETAINED_VALID_OVERRIDE');
    });
  });

  describe('5. Strict Financial Boundary: Charge Currency Preservation', () => {
    it('always preserves chargeCurrency as PHP regardless of country selection', () => {
      const countries = ['PH', 'US', 'JP', 'BH'];
      for (const country of countries) {
        const result = resolveCountryCurrencyPolicy({
          requestedCountryCode: country,
          currencyOverrideFeatureEnabled: true,
          registries: testContext,
          asOf: T_ACTIVE,
        });

        expect(result.chargeCurrency).toBe('PHP');
      }
    });

    it('always preserves chargeCurrency as PHP even when display override is accepted', () => {
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'US',
        requestedDisplayCurrency: 'EUR',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(result.displayCurrency).toBe('EUR');
      expect(result.chargeCurrency).toBe('PHP'); // Strict invariant
    });

    it('verifies allowedChargeCurrencies contains only PHP in CountryProfile', () => {
      const phProfile = testContext.countries.get('PH', T_ACTIVE);
      const usProfile = testContext.countries.get('US', T_ACTIVE);
      const jpProfile = testContext.countries.get('JP', T_ACTIVE);

      expect(phProfile?.allowedChargeCurrencies).toEqual(['PHP']);
      expect(usProfile?.allowedChargeCurrencies).toEqual(['PHP']);
      expect(jpProfile?.allowedChargeCurrencies).toEqual(['PHP']);
    });
  });

  describe('6. Language Independence', () => {
    it('proves language change does not alter country or display currency in preference resolver', () => {
      const baseline = resolveGlobalPreference(
        {
          explicitChoice: {
            countryCode: 'PH',
            displayCurrency: 'PHP',
            languageTag: 'en-PH',
          },
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
        },
        testContext,
        undefined,
        T_ACTIVE
      );

      expect(baseline.countryCode).toBe('PH');
      expect(baseline.displayCurrency).toBe('PHP');
      expect(baseline.languageTag).toBe('en-PH');

      // Change language only to Filipino
      const langUpdated = resolveGlobalPreference(
        {
          explicitChoice: {
            languageTag: 'fil-PH',
          },
          accountSaved: {
            countryCode: 'PH',
            displayCurrency: 'PHP',
            languageTag: 'en-PH',
          },
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
        },
        testContext,
        undefined,
        T_ACTIVE
      );

      expect(langUpdated.languageTag).toBe('fil-PH');
      expect(langUpdated.countryCode).toBe('PH'); // Unchanged
      expect(langUpdated.displayCurrency).toBe('PHP'); // Unchanged
      expect(langUpdated.chargeCurrency).toBe('PHP'); // Unchanged
    });

    it('proves country change does not alter language in preference resolver', () => {
      // User changes country to US while language is fil-PH
      const countryUpdated = resolveGlobalPreference(
        {
          explicitChoice: {
            countryCode: 'US',
          },
          accountSaved: {
            countryCode: 'PH',
            displayCurrency: 'PHP',
            languageTag: 'fil-PH',
          },
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
        },
        testContext,
        undefined,
        T_ACTIVE
      );

      expect(countryUpdated.countryCode).toBe('US');
      expect(countryUpdated.displayCurrency).toBe('USD'); // Reset to US default
      expect(countryUpdated.languageTag).toBe('fil-PH'); // Preserved independently!
    });
  });

  describe('7. Minor-Unit Exponent Verification', () => {
    it('validates 0 minor unit digits (JPY)', () => {
      const res = validateCurrencyMinorUnits('JPY', testContext.currencies, T_ACTIVE);
      expect(res.isValid).toBe(true);
      expect(res.minorUnitExponent).toBe(0);
      expect(res.metadata?.symbol).toBe('¥');
    });

    it('validates 2 minor unit digits (PHP, USD, EUR)', () => {
      const resPhp = validateCurrencyMinorUnits('PHP', testContext.currencies, T_ACTIVE);
      expect(resPhp.isValid).toBe(true);
      expect(resPhp.minorUnitExponent).toBe(2);

      const resUsd = validateCurrencyMinorUnits('USD', testContext.currencies, T_ACTIVE);
      expect(resUsd.isValid).toBe(true);
      expect(resUsd.minorUnitExponent).toBe(2);

      const resEur = validateCurrencyMinorUnits('EUR', testContext.currencies, T_ACTIVE);
      expect(resEur.isValid).toBe(true);
      expect(resEur.minorUnitExponent).toBe(2);
    });

    it('validates 3 minor unit digits (BHD, KWD)', () => {
      const resBhd = validateCurrencyMinorUnits('BHD', testContext.currencies, T_ACTIVE);
      expect(resBhd.isValid).toBe(true);
      expect(resBhd.minorUnitExponent).toBe(3);

      const resKwd = validateCurrencyMinorUnits('KWD', testContext.currencies, T_ACTIVE);
      expect(resKwd.isValid).toBe(true);
      expect(resKwd.minorUnitExponent).toBe(3);
    });

    it('rejects unsupported currency for minor units', () => {
      const res = validateCurrencyMinorUnits('NON_EXISTENT', testContext.currencies, T_ACTIVE);
      expect(res.isValid).toBe(false);
      expect(res.minorUnitExponent).toBeNull();
    });
  });

  describe('8. Auditable Provenance & Immutability', () => {
    it('produces deep-frozen output and auditable provenance', () => {
      const result = resolveCountryCurrencyPolicy({
        requestedCountryCode: 'PH',
        currencyOverrideFeatureEnabled: true,
        registries: testContext,
        asOf: T_ACTIVE,
      });

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.provenance)).toBe(true);
      expect(result.provenance.evaluationTime).toBe(new Date(T_ACTIVE).toISOString());
      expect(result.provenance.countryProfileVersion).toContain('countries');
      expect(result.provenance.currencyRegistryVersion).toContain('currencies');
      expect(result.provenance.retentionPolicyApplied).toBe('RESET_TO_COUNTRY_DEFAULT');

      // Attempt mutation must throw or fail in strict mode
      expect(() => {
        // @ts-expect-error test mutation
        result.countryCode = 'HACKED';
      }).toThrow();
    });
  });

  describe('9. Canonical Default Context Verification', () => {
    it('verifies getDefaultRegistryContext conforms to P4 requirements', () => {
      const defaultCtx = getDefaultRegistryContext();
      const ph = defaultCtx.countries.get('PH');

      expect(ph).toBeDefined();
      expect(ph?.code).toBe('PH');
      expect(ph?.defaultDisplayCurrency).toBe('PHP');
      expect(ph?.allowedDisplayCurrencies).toContain('PHP');
      expect(ph?.allowedChargeCurrencies).toEqual(['PHP']);
      expect(ph?.unitSystem).toBe('metric');
      expect(ph?.configVersion).toBe('1.0.0');
      expect(ph?.isActive).toBe(true);
      expect(ph?.enabled).toBe(true);

      const us = defaultCtx.countries.get('US');
      expect(us?.unitSystem).toBe('imperial');
      expect(us?.allowedChargeCurrencies).toEqual(['PHP']); // Invariant preserved
    });
  });

  describe('10. API and UX Route Regression Compatibility', () => {
    it('verifies that default registries provide options metadata consumed by P2 UX and APIs', () => {
      const defaultCtx = getDefaultRegistryContext();
      const activeCountries = defaultCtx.countries.listActive();

      // Ensure every active country profile exposes required P4 contract properties
      for (const country of activeCountries) {
        expect(country.code).toBeDefined();
        expect(country.defaultDisplayCurrency).toBeDefined();
        expect(Array.isArray(country.allowedDisplayCurrencies)).toBe(true);
        expect(country.allowedDisplayCurrencies.length).toBeGreaterThan(0);
        expect(country.allowedChargeCurrencies).toEqual(['PHP']); // Invariant: charges strictly PHP
        expect(country.defaultDisplayCurrency).toBe(country.defaultCurrency);
      }
    });

    it('verifies that changing country in preference resolver applies country default without mutating language', () => {
      const defaultCtx = getDefaultRegistryContext();
      const resolved = resolveGlobalPreference(
        {
          explicitChoice: {
            countryCode: 'JP',
          },
          accountSaved: {
            countryCode: 'PH',
            displayCurrency: 'PHP',
            languageTag: 'fil-PH',
          },
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
        },
        defaultCtx,
        { countryChangePolicy: 'RESET_TO_COUNTRY_DEFAULT' }
      );

      expect(resolved.countryCode).toBe('JP');
      expect(resolved.displayCurrency).toBe('JPY');
      expect(resolved.languageTag).toBe('fil-PH');
      expect(resolved.chargeCurrency).toBe('PHP');
    });
  });
});
