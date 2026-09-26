/**
 * RENTipid GLCC v1.0 — Registry Contracts & Types
 *
 * Defines pure, dependency-free contracts for:
 * - CurrencyRegistry (ISO 4217, exponents, active windows)
 * - CountryProfileRegistry (ISO 3166-1 alpha-2, default display currencies, allowed overrides)
 * - LocaleRegistry (BCP 47, direction, language families, fallback)
 * - Composite RegistryContext and in-memory test doubles
 *
 * Invariant: Does not depend on Prisma, Next.js request runtime, or external services.
 */

export interface CurrencyMetadata {
  readonly code: string;
  readonly minorUnitExponent: number; // 0 for JPY, 2 for PHP/USD/EUR, 3 for BHD/KWD
  readonly numericCode?: string;
  readonly name: string;
  readonly symbol: string;
  readonly isActive: boolean;
  readonly effectiveFrom?: string; // ISO-8601 date string
  readonly effectiveTo?: string;   // ISO-8601 date string
}

export interface CountryProfile {
  readonly code: string; // ISO 3166-1 alpha-2 (e.g. 'PH', 'US', 'JP')
  readonly countryCode?: string; // Standard alias for code
  readonly name: string;
  readonly defaultDisplayCurrency: string;
  readonly defaultCurrency?: string; // Standard alias for defaultDisplayCurrency
  readonly allowedDisplayCurrencies: readonly string[];
  readonly allowedChargeCurrencies?: readonly string[]; // Foreign charge capability strictly disabled; defaults to ['PHP']
  readonly defaultLanguageTag: string;
  readonly supportedLanguageTags: readonly string[];
  readonly defaultTimezone?: string;
  readonly timezoneDefault?: string; // Standard alias for defaultTimezone
  readonly unitSystem?: 'metric' | 'imperial';
  readonly isActive: boolean;
  readonly enabled?: boolean; // Standard alias for isActive
  readonly effectiveFrom?: string; // ISO-8601 date string
  readonly effectiveTo?: string;   // ISO-8601 date string
  readonly configVersion?: string; // Version of the country configuration
  readonly isTestFixture?: boolean; // When true, excluded from live production options metadata
}

export interface LocaleMetadata {
  readonly tag: string; // BCP 47 (e.g. 'en-PH', 'fil-PH', 'en-US', 'ar-SA')
  readonly language: string; // ISO 639-1/2 (e.g. 'en', 'fil', 'ar')
  readonly region?: string;  // ISO 3166-1 (e.g. 'PH', 'US', 'SA')
  readonly script?: string;  // e.g. 'Latn', 'Arab'
  readonly direction: 'ltr' | 'rtl';
  readonly name: string;
  readonly nativeName: string;
  readonly isActive: boolean;
  readonly fallbackTag?: string; // Approved fallback tag in same language family
  readonly effectiveFrom?: string; // ISO-8601 date string
  readonly effectiveTo?: string;   // ISO-8601 date string
}

export interface CurrencyRegistry {
  get(code: string, asOf?: Date | string): CurrencyMetadata | null;
  getRaw?(code: string): CurrencyMetadata | null;
  isSupported(code: string, asOf?: Date | string): boolean;
  getVersion(): string;
  listActive(asOf?: Date | string): readonly CurrencyMetadata[];
  listAll?(): readonly CurrencyMetadata[];
}

export interface CountryProfileRegistry {
  get(code: string, asOf?: Date | string): CountryProfile | null;
  getRaw?(code: string): CountryProfile | null;
  isSupported(code: string, asOf?: Date | string): boolean;
  getAllowedDisplayCurrencies(code: string, asOf?: Date | string): readonly string[];
  getAllowedChargeCurrencies?(code: string, asOf?: Date | string): readonly string[];
  getVersion(): string;
  listActive(asOf?: Date | string): readonly CountryProfile[];
  listAll?(): readonly CountryProfile[];
}

export interface LocaleRegistry {
  get(tag: string, asOf?: Date | string): LocaleMetadata | null;
  getRaw?(tag: string): LocaleMetadata | null;
  isSupported(tag: string, asOf?: Date | string): boolean;
  resolveFallback(tag: string): string | null;
  getVersion(): string;
  listActive(asOf?: Date | string): readonly LocaleMetadata[];
  listAll?(): readonly LocaleMetadata[];
}

export interface RegistryContext {
  readonly currencies: CurrencyRegistry;
  readonly countries: CountryProfileRegistry;
  readonly locales: LocaleRegistry;
  getCompositeVersion(): string;
}

/**
 * Helper to check effective date window
 */
export function isDateInEffectiveWindow(
  asOf: Date | string | undefined,
  effectiveFrom?: string,
  effectiveTo?: string
): boolean {
  if (!effectiveFrom && !effectiveTo) return true;
  const targetDate = asOf ? new Date(asOf).getTime() : Date.now();
  if (isNaN(targetDate)) return false;
  if (effectiveFrom) {
    const fromTime = new Date(effectiveFrom).getTime();
    if (!isNaN(fromTime) && targetDate < fromTime) {
      return false;
    }
  }
  if (effectiveTo) {
    const toTime = new Date(effectiveTo).getTime();
    if (!isNaN(toTime) && targetDate > toTime) {
      return false;
    }
  }
  return true;
}

/**
 * Creates an in-memory, deterministic RegistryContext for tests and isolated contract resolution.
 */
export function createInMemoryRegistryContext(options: {
  currencies?: readonly CurrencyMetadata[];
  countries?: readonly CountryProfile[];
  locales?: readonly LocaleMetadata[];
  version?: string;
}): RegistryContext {
  const version = options.version ?? '1.0.0-inmemory';
  const currencyMap = new Map<string, CurrencyMetadata>();
  const countryMap = new Map<string, CountryProfile>();
  const localeMap = new Map<string, LocaleMetadata>();

  for (const c of options.currencies ?? []) {
    currencyMap.set(c.code.toUpperCase(), Object.freeze({ ...c, code: c.code.toUpperCase() }));
  }

  for (const c of options.countries ?? []) {
    const code = (c.code || c.countryCode || '').trim().toUpperCase();
    const defaultDisplay = (c.defaultDisplayCurrency || c.defaultCurrency || '').trim().toUpperCase();
    const allowedDisplay = (c.allowedDisplayCurrencies ?? []).map(x => x.trim().toUpperCase());
    const allowedCharge = (c.allowedChargeCurrencies ?? ['PHP']).map(x => x.trim().toUpperCase());
    const tz = c.defaultTimezone || c.timezoneDefault;
    const active = c.isActive ?? c.enabled ?? true;

    countryMap.set(code, Object.freeze({
      ...c,
      code,
      countryCode: code,
      defaultDisplayCurrency: defaultDisplay,
      defaultCurrency: defaultDisplay,
      allowedDisplayCurrencies: Object.freeze(allowedDisplay),
      allowedChargeCurrencies: Object.freeze(allowedCharge),
      supportedLanguageTags: Object.freeze([...(c.supportedLanguageTags ?? [])]),
      defaultTimezone: tz,
      timezoneDefault: tz,
      unitSystem: c.unitSystem ?? 'metric',
      isActive: active,
      enabled: active,
      configVersion: c.configVersion ?? '1.0.0',
      isTestFixture: c.isTestFixture ?? false,
    }));
  }

  for (const l of options.locales ?? []) {
    localeMap.set(l.tag, Object.freeze({ ...l }));
  }

  const currencies: CurrencyRegistry = {
    get(code: string, asOf?: Date | string) {
      if (!code) return null;
      const found = currencyMap.get(code.trim().toUpperCase());
      if (!found || !found.isActive) return null;
      if (!isDateInEffectiveWindow(asOf, found.effectiveFrom, found.effectiveTo)) return null;
      return found;
    },
    getRaw(code: string) {
      if (!code) return null;
      return currencyMap.get(code.trim().toUpperCase()) ?? null;
    },
    isSupported(code: string, asOf?: Date | string) {
      return this.get(code, asOf) !== null;
    },
    getVersion() {
      return `${version}-currencies`;
    },
    listActive(asOf?: Date | string) {
      return Array.from(currencyMap.values()).filter(c =>
        c.isActive && isDateInEffectiveWindow(asOf, c.effectiveFrom, c.effectiveTo)
      );
    },
    listAll() {
      return Array.from(currencyMap.values());
    },
  };

  const countries: CountryProfileRegistry = {
    get(code: string, asOf?: Date | string) {
      if (!code) return null;
      const found = countryMap.get(code.trim().toUpperCase());
      if (!found || !found.isActive) return null;
      if (!isDateInEffectiveWindow(asOf, found.effectiveFrom, found.effectiveTo)) return null;
      return found;
    },
    getRaw(code: string) {
      if (!code) return null;
      return countryMap.get(code.trim().toUpperCase()) ?? null;
    },
    isSupported(code: string, asOf?: Date | string) {
      return this.get(code, asOf) !== null;
    },
    getAllowedDisplayCurrencies(code: string, asOf?: Date | string) {
      const profile = this.get(code, asOf);
      if (!profile) return Object.freeze([]);
      const allowed = new Set<string>([profile.defaultDisplayCurrency, ...profile.allowedDisplayCurrencies]);
      return Object.freeze(Array.from(allowed));
    },
    getAllowedChargeCurrencies(code: string, asOf?: Date | string) {
      const profile = this.get(code, asOf);
      if (!profile) return Object.freeze([]);
      return profile.allowedChargeCurrencies ?? Object.freeze(['PHP']);
    },
    getVersion() {
      return `${version}-countries`;
    },
    listActive(asOf?: Date | string) {
      return Array.from(countryMap.values()).filter(c =>
        c.isActive && isDateInEffectiveWindow(asOf, c.effectiveFrom, c.effectiveTo)
      );
    },
    listAll() {
      return Array.from(countryMap.values());
    },
  };

  const locales: LocaleRegistry = {
    get(tag: string, asOf?: Date | string) {
      if (!tag) return null;
      const found = localeMap.get(tag.trim());
      if (!found || !found.isActive) return null;
      if (!isDateInEffectiveWindow(asOf, found.effectiveFrom, found.effectiveTo)) return null;
      return found;
    },
    isSupported(tag: string, asOf?: Date | string) {
      return this.get(tag, asOf) !== null;
    },
    resolveFallback(tag: string) {
      if (!tag) return null;
      const found = localeMap.get(tag.trim());
      if (found?.fallbackTag && this.isSupported(found.fallbackTag)) {
        return found.fallbackTag;
      }
      // Try language family base (e.g. 'en-PH' -> 'en')
      const baseLang = tag.split('-')[0];
      if (baseLang && baseLang !== tag && this.isSupported(baseLang)) {
        return baseLang;
      }
      return null;
    },
    getVersion() {
      return `${version}-locales`;
    },
    listActive(asOf?: Date | string) {
      return Array.from(localeMap.values()).filter(l =>
        l.isActive && isDateInEffectiveWindow(asOf, l.effectiveFrom, l.effectiveTo)
      );
    },
  };

  return Object.freeze({
    currencies: Object.freeze(currencies),
    countries: Object.freeze(countries),
    locales: Object.freeze(locales),
    getCompositeVersion() {
      return `glcc-registry-composite@${version}`;
    },
  });
}
