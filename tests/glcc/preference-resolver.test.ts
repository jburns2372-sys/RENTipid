/**
 * RENTipid GLCC v1.0 — Global Preference Resolver Unit Tests
 *
 * Verifies:
 * - 5-level precedence hierarchy (Explicit > Account > Guest > Suggestion > Default).
 * - Independence of language, country, display currency, and charge currency.
 * - Country change resets display currency override to new country default.
 * - Charge currency strictly locked to platform default (charge conversion disabled).
 * - Sign-in reconciliation policies (guest override vs account saved).
 * - Fail-closed handling for unsupported/inactive/expired values.
 * - Provenance tracking per field.
 * - Input immutability and frozen return object.
 */

import {
  type CurrencyMetadata,
  type CountryProfile,
  type LocaleMetadata,
  createInMemoryRegistryContext,
} from '../../src/lib/glcc/registry-contracts';
import {
  type GlobalPreferenceResolutionInput,
  type PlatformDefaultPreference,
} from '../../src/lib/glcc/contracts';
import { resolveGlobalPreference } from '../../src/lib/glcc/preference-resolver';

describe('GLCC v1.0 — Preference Resolver', () => {
  const sampleCurrencies: CurrencyMetadata[] = [
    { code: 'PHP', minorUnitExponent: 2, name: 'Philippine Peso', symbol: '₱', isActive: true },
    { code: 'USD', minorUnitExponent: 2, name: 'US Dollar', symbol: '$', isActive: true },
    { code: 'JPY', minorUnitExponent: 0, name: 'Japanese Yen', symbol: '¥', isActive: true },
    { code: 'SGD', minorUnitExponent: 2, name: 'Singapore Dollar', symbol: 'S$', isActive: true },
    {
      code: 'EXPIRED',
      minorUnitExponent: 2,
      name: 'Expired Currency',
      symbol: 'X',
      isActive: true,
      effectiveTo: '2020-01-01T00:00:00Z',
    },
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
      supportedLanguageTags: ['en-US'],
      defaultTimezone: 'America/New_York',
      isActive: true,
    },
    {
      code: 'SG',
      name: 'Singapore',
      defaultDisplayCurrency: 'SGD',
      allowedDisplayCurrencies: ['SGD', 'USD'],
      defaultLanguageTag: 'en-SG',
      supportedLanguageTags: ['en-SG'],
      defaultTimezone: 'Asia/Singapore',
      isActive: true,
    },
    {
      code: 'JP',
      name: 'Japan',
      defaultDisplayCurrency: 'JPY',
      allowedDisplayCurrencies: ['JPY', 'USD'],
      defaultLanguageTag: 'ja-JP',
      supportedLanguageTags: ['ja-JP', 'en'],
      defaultTimezone: 'Asia/Tokyo',
      isActive: true,
    },
  ];

  const sampleLocales: LocaleMetadata[] = [
    { tag: 'en-PH', language: 'en', region: 'PH', direction: 'ltr', name: 'English (Philippines)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
    { tag: 'fil-PH', language: 'fil', region: 'PH', direction: 'ltr', name: 'Filipino', nativeName: 'Wikang Filipino', isActive: true, fallbackTag: 'en-PH' },
    { tag: 'en-US', language: 'en', region: 'US', direction: 'ltr', name: 'English (United States)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
    { tag: 'ja-JP', language: 'ja', region: 'JP', direction: 'ltr', name: 'Japanese', nativeName: '日本語', isActive: true },
    { tag: 'en', language: 'en', direction: 'ltr', name: 'English', nativeName: 'English', isActive: true },
  ];

  const registries = createInMemoryRegistryContext({
    currencies: sampleCurrencies,
    countries: sampleCountries,
    locales: sampleLocales,
    version: '1.0.0-test',
  });

  const platformDefault: PlatformDefaultPreference = {
    languageTag: 'en-PH',
    countryCode: 'PH',
    displayCurrency: 'PHP',
    chargeCurrency: 'PHP',
    timezone: 'Asia/Manila',
  };

  describe('5-Level Precedence Hierarchy', () => {
    it('Tier 1: explicitChoice overrides all lower tiers', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          countryCode: 'US',
          displayCurrency: 'USD',
          languageTag: 'en-US',
        },
        accountSaved: {
          countryCode: 'SG',
          displayCurrency: 'SGD',
          languageTag: 'en-SG',
        },
        guestSession: {
          countryCode: 'JP',
          displayCurrency: 'JPY',
          languageTag: 'ja-JP',
        },
        firstRunSuggestion: {
          countryCode: 'PH',
          displayCurrency: 'PHP',
          languageTag: 'fil-PH',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.countryCode).toBe('US');
      expect(result.displayCurrency).toBe('USD');
      expect(result.languageTag).toBe('en-US');
      expect(result.provenance.country.source).toBe('EXPLICIT_CHOICE');
      expect(result.provenance.displayCurrency.source).toBe('EXPLICIT_CHOICE');
      expect(result.provenance.language.source).toBe('EXPLICIT_CHOICE');
    });

    it('Tier 2: accountSaved overrides guest, suggestion, and platform default when explicitChoice is absent', () => {
      const input: GlobalPreferenceResolutionInput = {
        accountSaved: {
          countryCode: 'SG',
          displayCurrency: 'SGD',
          languageTag: 'en',
        },
        guestSession: {
          countryCode: 'PH',
          displayCurrency: 'PHP',
          languageTag: 'fil-PH',
        },
        firstRunSuggestion: {
          countryCode: 'US',
          displayCurrency: 'USD',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.countryCode).toBe('SG');
      expect(result.displayCurrency).toBe('SGD');
      expect(result.languageTag).toBe('en');
      expect(result.provenance.country.source).toBe('ACCOUNT_SAVED');
      expect(result.provenance.displayCurrency.source).toBe('ACCOUNT_SAVED');
      expect(result.provenance.language.source).toBe('ACCOUNT_SAVED');
    });

    it('Tier 3: guestSession overrides suggestion and platform default when explicit and account are absent', () => {
      const input: GlobalPreferenceResolutionInput = {
        guestSession: {
          countryCode: 'JP',
          displayCurrency: 'JPY',
          languageTag: 'ja-JP',
        },
        firstRunSuggestion: {
          countryCode: 'US',
          displayCurrency: 'USD',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.countryCode).toBe('JP');
      expect(result.displayCurrency).toBe('JPY');
      expect(result.languageTag).toBe('ja-JP');
      expect(result.provenance.country.source).toBe('GUEST_SESSION');
      expect(result.provenance.displayCurrency.source).toBe('GUEST_SESSION');
    });

    it('Tier 4: firstRunSuggestion overrides platform default when higher tiers are absent', () => {
      const input: GlobalPreferenceResolutionInput = {
        firstRunSuggestion: {
          countryCode: 'US',
          displayCurrency: 'USD',
          languageTag: 'en-US',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.countryCode).toBe('US');
      expect(result.displayCurrency).toBe('USD');
      expect(result.languageTag).toBe('en-US');
      expect(result.provenance.country.source).toBe('FIRST_RUN_SUGGESTION');
    });

    it('Tier 5: platformDefault applies when all higher tiers are empty or absent', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: null,
        accountSaved: null,
        guestSession: null,
        firstRunSuggestion: null,
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.countryCode).toBe('PH');
      expect(result.displayCurrency).toBe('PHP');
      expect(result.languageTag).toBe('en-PH');
      expect(result.chargeCurrency).toBe('PHP');
      expect(result.provenance.country.source).toBe('PLATFORM_DEFAULT');
      expect(result.provenance.displayCurrency.source).toBe('PLATFORM_DEFAULT');
      expect(result.provenance.language.source).toBe('PLATFORM_DEFAULT');
      expect(result.provenance.chargeCurrency.source).toBe('PLATFORM_DEFAULT');
    });
  });

  describe('Independence of Language, Country, Display Currency, and Charge Currency', () => {
    it('changing language tag does not alter country, display currency, or charge currency', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          languageTag: 'fil-PH', // Only language changed
        },
        accountSaved: {
          countryCode: 'PH',
          displayCurrency: 'USD', // Allowed override
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.languageTag).toBe('fil-PH');
      expect(result.countryCode).toBe('PH');
      expect(result.displayCurrency).toBe('USD');
      expect(result.chargeCurrency).toBe('PHP');
      expect(result.provenance.language.source).toBe('EXPLICIT_CHOICE');
      expect(result.provenance.country.source).toBe('ACCOUNT_SAVED');
      expect(result.provenance.displayCurrency.source).toBe('ACCOUNT_SAVED');
    });

    it('display currency selection never alters charge currency (charge conversion strictly disabled)', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          displayCurrency: 'USD',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.displayCurrency).toBe('USD');
      expect(result.chargeCurrency).toBe('PHP'); // Invariant: Charge is strictly PHP
      expect(result.provenance.displayCurrency.source).toBe('EXPLICIT_CHOICE');
      expect(result.provenance.chargeCurrency.source).toBe('PLATFORM_DEFAULT');
    });
  });

  describe('Country Change Display Currency Policy', () => {
    it('resets manual display override to new country default when country changes under RESET_TO_COUNTRY_DEFAULT policy', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          countryCode: 'SG', // Changed from PH to SG, no display currency specified
        },
        accountSaved: {
          countryCode: 'PH',
          displayCurrency: 'JPY', // Prior manual override in PH
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries, {
        countryChangePolicy: 'RESET_TO_COUNTRY_DEFAULT',
      });

      expect(result.countryCode).toBe('SG');
      // Resets to SG's default display currency (SGD) rather than carrying JPY
      expect(result.displayCurrency).toBe('SGD');
    });

    it('honors explicit display currency specified alongside country change if allowed in new country', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          countryCode: 'SG',
          displayCurrency: 'USD', // USD is allowed in SG
        },
        accountSaved: {
          countryCode: 'PH',
          displayCurrency: 'PHP',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.countryCode).toBe('SG');
      expect(result.displayCurrency).toBe('USD');
      expect(result.provenance.displayCurrency.source).toBe('EXPLICIT_CHOICE');
    });
  });

  describe('Sign-in Reconciliation Policy', () => {
    it('EXPLICIT_GUEST_CHOICE_WINS: guest manual override takes precedence over account saved', () => {
      const input: GlobalPreferenceResolutionInput = {
        guestSession: {
          displayCurrency: 'USD',
          isManualDisplayOverride: true,
        },
        accountSaved: {
          countryCode: 'PH',
          displayCurrency: 'PHP',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries, {
        signInReconciliationPolicy: 'EXPLICIT_GUEST_CHOICE_WINS',
      });

      expect(result.displayCurrency).toBe('USD');
      expect(result.provenance.displayCurrency.source).toBe('GUEST_SESSION');
    });

    it('ACCOUNT_SAVED_WINS: saved account preferences take precedence over guest session', () => {
      const input: GlobalPreferenceResolutionInput = {
        guestSession: {
          displayCurrency: 'USD',
          isManualDisplayOverride: true,
        },
        accountSaved: {
          countryCode: 'PH',
          displayCurrency: 'PHP',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries, {
        signInReconciliationPolicy: 'ACCOUNT_SAVED_WINS',
      });

      expect(result.displayCurrency).toBe('PHP');
      expect(result.provenance.displayCurrency.source).toBe('ACCOUNT_SAVED');
    });
  });

  describe('Fail-Closed & Fallback Handling', () => {
    it('skips unsupported country in explicit tier and falls closed to next tier', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          countryCode: 'INVALID_COUNTRY',
        },
        accountSaved: {
          countryCode: 'US',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.countryCode).toBe('US');
      expect(result.provenance.country.source).toBe('ACCOUNT_SAVED');
    });

    it('skips expired currency in tier and falls closed to country default', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          displayCurrency: 'EXPIRED',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.displayCurrency).toBe('PHP');
      expect(result.provenance.displayCurrency.source).toBe('PLATFORM_DEFAULT');
    });

    it('falls back to locale base if specific region is unsupported', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          languageTag: 'en-XX', // en-XX is unsupported, but base 'en' is supported
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.languageTag).toBe('en');
    });
  });

  describe('Immutability and Frozen Return Value', () => {
    it('does not mutate input objects and returns a deep frozen result', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          countryCode: 'PH',
          displayCurrency: 'USD',
        },
        platformDefault,
      };

      const inputSnapshot = JSON.stringify(input);
      const result = resolveGlobalPreference(input, registries);

      // Verify input unchanged
      expect(JSON.stringify(input)).toBe(inputSnapshot);

      // Verify result and all nested provenance structures are frozen
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.provenance)).toBe(true);
      expect(Object.isFrozen(result.provenance.country)).toBe(true);
      expect(Object.isFrozen(result.provenance.language)).toBe(true);
      expect(Object.isFrozen(result.provenance.displayCurrency)).toBe(true);
      expect(Object.isFrozen(result.provenance.chargeCurrency)).toBe(true);

      // Attempting to modify frozen object throws in strict mode
      expect(() => {
        // @ts-expect-error Testing runtime freeze
        result.countryCode = 'US';
      }).toThrow();
    });

    it('preserves caller-owned objects as unfrozen and isolates result from post-resolution input mutation', () => {
      const explicitChoice = {
        countryCode: 'US',
        displayCurrency: 'USD',
        languageTag: 'en-US',
      };
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice,
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);

      // Invariant: Caller-owned input objects are NOT inadvertently frozen
      expect(Object.isFrozen(input)).toBe(false);
      expect(Object.isFrozen(explicitChoice)).toBe(false);

      // Mutate caller-owned input after resolution
      explicitChoice.countryCode = 'JP';
      explicitChoice.displayCurrency = 'JPY';

      // Invariant: Returned result is completely isolated and unchanged
      expect(result.countryCode).toBe('US');
      expect(result.displayCurrency).toBe('USD');
      expect(result.provenance.country.source).toBe('EXPLICIT_CHOICE');
    });
  });

  describe('Partial Explicit Selections & Preserved Context', () => {
    it('display-currency-only explicit choice preserves account-saved country and language', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          displayCurrency: 'USD', // Only display currency explicitly chosen
        },
        accountSaved: {
          countryCode: 'PH',
          displayCurrency: 'PHP',
          languageTag: 'fil-PH',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries);
      expect(result.displayCurrency).toBe('USD');
      expect(result.countryCode).toBe('PH');
      expect(result.languageTag).toBe('fil-PH');
      expect(result.provenance.displayCurrency.source).toBe('EXPLICIT_CHOICE');
      expect(result.provenance.country.source).toBe('ACCOUNT_SAVED');
      expect(result.provenance.language.source).toBe('ACCOUNT_SAVED');
    });

    it('country-only explicit choice resets display currency to new country default while preserving account language', () => {
      const input: GlobalPreferenceResolutionInput = {
        explicitChoice: {
          countryCode: 'JP', // Only country explicitly chosen
        },
        accountSaved: {
          countryCode: 'PH',
          displayCurrency: 'USD', // Prior manual override in PH
          languageTag: 'en-PH',
        },
        platformDefault,
      };

      const result = resolveGlobalPreference(input, registries, {
        countryChangePolicy: 'RESET_TO_COUNTRY_DEFAULT',
      });

      expect(result.countryCode).toBe('JP');
      expect(result.displayCurrency).toBe('JPY'); // Resets to JP default
      expect(result.languageTag).toBe('en-PH'); // Preserves account language
      expect(result.provenance.country.source).toBe('EXPLICIT_CHOICE');
      expect(result.provenance.displayCurrency.source).toBe('EXPLICIT_CHOICE');
      expect(result.provenance.language.source).toBe('ACCOUNT_SAVED');
    });
  });

  describe('Invalid Platform Default Rejection', () => {
    it('throws error immediately if platform default country is unsupported in registry', () => {
      const invalidDefault: PlatformDefaultPreference = {
        ...platformDefault,
        countryCode: 'INVALID_COUNTRY',
      };
      expect(() => {
        resolveGlobalPreference({ platformDefault: invalidDefault }, registries);
      }).toThrow("Platform default country 'INVALID_COUNTRY' is not supported in registry");
    });

    it('throws error immediately if platform default display currency is unsupported', () => {
      const invalidDefault: PlatformDefaultPreference = {
        ...platformDefault,
        displayCurrency: 'INVALID_CURRENCY',
      };
      expect(() => {
        resolveGlobalPreference({ platformDefault: invalidDefault }, registries);
      }).toThrow("Platform default display currency 'INVALID_CURRENCY' is not supported in registry");
    });
  });
});

