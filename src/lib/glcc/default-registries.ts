/**
 * RENTipid GLCC v1.1 — Default Registry Context
 *
 * Work Package: GLOBAL-W1
 *
 * Provides the global registry context conforming to the Architecture Lock:
 * - Currencies: Full ISO 4217 Global Currency Catalog (23 currencies, including PHP, USD, JPY, EUR, GBP, etc.)
 * - Countries: Full Global Country Catalog (44 individual country records across 15 compliance jurisdictions/groups)
 * - Locales: Full Global Language Catalog (25 languages, preserving en-PH, fil-PH, en-US, ja-JP + English reuse + global targets)
 * - Platform Anchor: en-PH / PH / PHP / PHP (Immutable financial boundary: chargeCurrency is ALWAYS PHP)
 */

import { createInMemoryRegistryContext, type RegistryContext, type LocaleRegistry } from './registry-contracts';
import type { PlatformDefaultPreference } from './contracts';
import { GLOBAL_CURRENCY_CATALOG } from './currency/currency-registry';
import { GLOBAL_COUNTRY_CATALOG } from './country/country-registry';
import { GLOBAL_LANGUAGE_CATALOG } from './language/language-registry';

export const DEFAULT_PLATFORM_PREFERENCE: PlatformDefaultPreference = Object.freeze({
  languageTag: 'en-PH',
  countryCode: 'PH',
  displayCurrency: 'PHP',
  chargeCurrency: 'PHP',
  timezone: 'Asia/Manila',
});

let cachedRegistryContext: RegistryContext | null = null;

export function clearCachedRegistryContext(): void {
  cachedRegistryContext = null;
}

export function getDefaultRegistryContext(): RegistryContext {
  if (cachedRegistryContext) {
    return cachedRegistryContext;
  }

  cachedRegistryContext = createInMemoryRegistryContext({
    currencies: [...GLOBAL_CURRENCY_CATALOG],
    countries: [...GLOBAL_COUNTRY_CATALOG],
    locales: [...GLOBAL_LANGUAGE_CATALOG],
    version: '1.1.0-global-w1',
  });

  return cachedRegistryContext;
}

export function getDefaultLocaleRegistry(): LocaleRegistry {
  return getDefaultRegistryContext().locales;
}
