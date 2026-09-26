/**
 * RENTipid GLCC v1.0 — Default Registry Context
 *
 * Provides the baseline registry context conforming to the Architecture Lock:
 * - Currencies: PHP (exponent 2), USD (exponent 2), JPY (exponent 0)
 * - Countries: PH, US, JP
 * - Locales: en-PH, fil-PH, en-US, ja-JP
 * - Fallbacks: fil-PH -> en-PH
 */

import { createInMemoryRegistryContext, type RegistryContext } from './registry-contracts';
import type { PlatformDefaultPreference } from './contracts';

export const DEFAULT_PLATFORM_PREFERENCE: PlatformDefaultPreference = Object.freeze({
  languageTag: 'en-PH',
  countryCode: 'PH',
  displayCurrency: 'PHP',
  chargeCurrency: 'PHP',
  timezone: 'Asia/Manila',
});

let cachedRegistryContext: RegistryContext | null = null;

export function getDefaultRegistryContext(): RegistryContext {
  if (cachedRegistryContext) {
    return cachedRegistryContext;
  }

  cachedRegistryContext = createInMemoryRegistryContext({
    currencies: [
      { code: 'PHP', minorUnitExponent: 2, name: 'Philippine Peso', symbol: '₱', isActive: true },
      { code: 'USD', minorUnitExponent: 2, name: 'US Dollar', symbol: '$', isActive: true },
      { code: 'JPY', minorUnitExponent: 0, name: 'Japanese Yen', symbol: '¥', isActive: true },
    ],
    countries: [
      {
        code: 'PH',
        countryCode: 'PH',
        name: 'Philippines',
        defaultDisplayCurrency: 'PHP',
        defaultCurrency: 'PHP',
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
        isTestFixture: false, // Production-configured market profile
      },
      {
        code: 'US',
        countryCode: 'US',
        name: 'United States',
        defaultDisplayCurrency: 'USD',
        defaultCurrency: 'USD',
        allowedDisplayCurrencies: ['USD'],
        allowedChargeCurrencies: ['PHP'], // Charge currency remains strictly PHP; no foreign charges
        defaultLanguageTag: 'en-US',
        supportedLanguageTags: ['en-US'],
        defaultTimezone: 'America/New_York',
        timezoneDefault: 'America/New_York',
        unitSystem: 'imperial',
        isActive: true,
        enabled: true,
        effectiveFrom: '2026-01-01T00:00:00.000Z',
        configVersion: '1.0.0',
        isTestFixture: true, // TEST ONLY — NOT PRODUCTION ENABLED
      },
      {
        code: 'JP',
        countryCode: 'JP',
        name: 'Japan',
        defaultDisplayCurrency: 'JPY',
        defaultCurrency: 'JPY',
        allowedDisplayCurrencies: ['JPY', 'USD'],
        allowedChargeCurrencies: ['PHP'], // Charge currency remains strictly PHP; no foreign charges
        defaultLanguageTag: 'ja-JP',
        supportedLanguageTags: ['ja-JP', 'en-US'],
        defaultTimezone: 'Asia/Tokyo',
        timezoneDefault: 'Asia/Tokyo',
        unitSystem: 'metric',
        isActive: true,
        enabled: true,
        effectiveFrom: '2026-01-01T00:00:00.000Z',
        configVersion: '1.0.0',
        isTestFixture: true, // TEST ONLY — NOT PRODUCTION ENABLED
      },
    ],
    locales: [
      {
        tag: 'en-PH',
        language: 'en',
        region: 'PH',
        direction: 'ltr',
        name: 'English (Philippines)',
        nativeName: 'English (Philippines)',
        isActive: true,
      },
      {
        tag: 'fil-PH',
        language: 'fil',
        region: 'PH',
        direction: 'ltr',
        name: 'Filipino (Philippines)',
        nativeName: 'Wikang Filipino',
        isActive: true,
        fallbackTag: 'en-PH',
      },
      {
        tag: 'en-US',
        language: 'en',
        region: 'US',
        direction: 'ltr',
        name: 'English (United States)',
        nativeName: 'English (United States)',
        isActive: true,
      },
      {
        tag: 'ja-JP',
        language: 'ja',
        region: 'JP',
        direction: 'ltr',
        name: 'Japanese',
        nativeName: '日本語',
        isActive: true,
      },
    ],
    version: '1.0.0-canonical',
  });

  return cachedRegistryContext;
}
