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

export type LocaleReleaseStatus =
  | 'REGISTERED'
  | 'TRANSLATION_IN_PROGRESS'
  | 'QA_REQUIRED'
  | 'PRODUCTION_READY'
  | 'DISABLED';

export type LegalTranslationStatus =
  | 'NONE'
  | 'REVIEW_REQUIRED'
  | 'APPROVED';

export interface LocaleMetadata {
  readonly tag: string; // BCP 47 (e.g. 'en-PH', 'fil-PH', 'en-US', 'ja-JP', 'ar-SA')
  readonly localeCode?: string; // Standard alias for tag
  readonly localeTag?: string; // Standard alias for tag
  readonly language: string; // ISO 639-1/2 (e.g. 'en', 'fil', 'ja', 'ar')
  readonly languageCode?: string; // Standard alias for language
  readonly region?: string;  // ISO 3166-1 alpha-2 (e.g. 'PH', 'US', 'JP', 'SA')
  readonly regionCode?: string; // Standard alias for region
  readonly script?: string;  // ISO 15924 (e.g. 'Latn', 'Arab', 'Jpan')
  readonly direction: 'ltr' | 'rtl';
  readonly name: string; // Administrative / English display name
  readonly englishName?: string; // Standard alias for name
  readonly nativeName: string; // Name shown in the language itself
  readonly isActive: boolean; // Active in registry
  readonly enabled?: boolean; // Standard alias for isActive
  readonly releaseStatus?: LocaleReleaseStatus; // Governance lifecycle status
  readonly status?: LocaleReleaseStatus; // Standard alias for releaseStatus
  readonly fallbackTag?: string; // Approved fallback tag in same language family
  readonly fallbackLocale?: string; // Standard alias for fallbackTag
  readonly translationVersion?: string; // Versioned dictionary baseline
  readonly bundleVersion?: string; // Standard alias for translationVersion
  readonly legalTranslationStatus?: LegalTranslationStatus; // Legal/compliance translation classification
  readonly featureFlag?: string; // Optional rollout feature-flag identifier
  readonly effectiveFrom?: string; // ISO-8601 date string
  readonly effectiveTo?: string;   // ISO-8601 date string
}

/**
 * Validates BCP-47 locale tag syntax standards-compliantly.
 */
export function validateBcp47LocaleTag(tag: string): { isValid: boolean; error?: string } {
  if (!tag || typeof tag !== 'string') {
    return { isValid: false, error: 'Locale tag must be a non-empty string' };
  }
  const trimmed = tag.trim();
  // Matches primary language subtag (2-3 chars), optional script (4 chars), optional region (2 chars or 3 digits), optional variants (5-8 chars)
  const bcp47Regex = /^[a-z]{2,3}(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|\d{3}))?(?:-[A-Za-z0-9]{5,8})*$/;
  if (!bcp47Regex.test(trimmed)) {
    return { isValid: false, error: `Invalid BCP-47 locale tag format: '${tag}'` };
  }
  return { isValid: true };
}

/**
 * Determines whether a locale record meets all Master Plan criteria for Production selectability.
 * Rule: enabled === true && releaseStatus === 'PRODUCTION_READY'.
 */
export function isLocaleProductionSelectable(locale: LocaleMetadata | null | undefined): boolean {
  if (!locale) return false;
  const isEnabled = locale.enabled ?? locale.isActive;
  const status = locale.releaseStatus ?? locale.status ?? 'REGISTERED';
  return isEnabled === true && status === 'PRODUCTION_READY';
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
  getLocale?(tag: string): LocaleMetadata | null;
  isSupported(tag: string, asOf?: Date | string): boolean;
  isSupportedLocale?(tag: string): boolean;
  isLocaleProductionSelectable(tag: string, asOf?: Date | string): boolean;
  getEnabledLocales(asOf?: Date | string): readonly LocaleMetadata[];
  getProductionReadyLocales(asOf?: Date | string): readonly LocaleMetadata[];
  resolveFallback(tag: string): string | null;
  resolveFallbackLocale?(tag: string): string | null;
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

  const seenTags = new Set<string>();
  const fallbackGraph = new Map<string, string>();

  for (const l of options.locales ?? []) {
    const rawTag = (l.tag || l.localeTag || l.localeCode || '').trim();
    if (!rawTag) {
      throw new Error('Locale tag cannot be empty');
    }
    const bcpVal = validateBcp47LocaleTag(rawTag);
    if (!bcpVal.isValid) {
      throw new Error(bcpVal.error);
    }
    if (seenTags.has(rawTag)) {
      throw new Error(`Duplicate locale tag detected in registry: '${rawTag}'`);
    }
    seenTags.add(rawTag);

    if (l.direction !== 'ltr' && l.direction !== 'rtl') {
      throw new Error(`Unsupported direction '${l.direction}' for locale '${rawTag}'`);
    }
    if (!l.nativeName || typeof l.nativeName !== 'string' || l.nativeName.trim().length === 0) {
      throw new Error(`Locale '${rawTag}' must have a non-empty nativeName`);
    }
    const englishName = l.englishName || l.name;
    if (!englishName || typeof englishName !== 'string' || englishName.trim().length === 0) {
      throw new Error(`Locale '${rawTag}' must have a non-empty englishName/name`);
    }

    const active = l.isActive ?? l.enabled ?? true;
    const relStatus: LocaleReleaseStatus = l.releaseStatus ?? l.status ?? 'REGISTERED';
    const validStatuses: LocaleReleaseStatus[] = [
      'REGISTERED',
      'TRANSLATION_IN_PROGRESS',
      'QA_REQUIRED',
      'PRODUCTION_READY',
      'DISABLED',
    ];
    if (!validStatuses.includes(relStatus)) {
      throw new Error(`Invalid releaseStatus '${relStatus}' for locale '${rawTag}'`);
    }

    if (relStatus === 'PRODUCTION_READY' && !active) {
      throw new Error(`Production-ready locale '${rawTag}' cannot have isActive=false / enabled=false`);
    }

    const fallback = l.fallbackTag || l.fallbackLocale;
    if (fallback) {
      if (fallback.trim() === rawTag) {
        throw new Error(`Locale '${rawTag}' cannot have self-referential fallback`);
      }
      fallbackGraph.set(rawTag, fallback.trim());
    }

    const normalizedLocale: LocaleMetadata = Object.freeze({
      ...l,
      tag: rawTag,
      localeCode: rawTag,
      localeTag: rawTag,
      language: l.language || l.languageCode || rawTag.split('-')[0],
      languageCode: l.language || l.languageCode || rawTag.split('-')[0],
      region: l.region || l.regionCode || (rawTag.includes('-') ? rawTag.split('-')[1] : undefined),
      regionCode: l.region || l.regionCode || (rawTag.includes('-') ? rawTag.split('-')[1] : undefined),
      name: englishName,
      englishName,
      nativeName: l.nativeName.trim(),
      direction: l.direction,
      isActive: active,
      enabled: active,
      releaseStatus: relStatus,
      status: relStatus,
      fallbackTag: fallback,
      fallbackLocale: fallback,
      translationVersion: l.translationVersion || l.bundleVersion,
      bundleVersion: l.translationVersion || l.bundleVersion,
      legalTranslationStatus: l.legalTranslationStatus ?? 'NONE',
    });

    localeMap.set(rawTag, normalizedLocale);
  }

  // Validate fallback graph for cycles
  for (const [tag, fallback] of fallbackGraph.entries()) {
    const visited = new Set<string>([tag]);
    let curr: string | undefined = fallback;
    while (curr) {
      if (visited.has(curr)) {
        throw new Error(`Circular locale fallback detected in chain: ${Array.from(visited).join(' -> ')} -> ${curr}`);
      }
      visited.add(curr);
      curr = fallbackGraph.get(curr);
    }
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
    getRaw(tag: string) {
      if (!tag) return null;
      return localeMap.get(tag.trim()) ?? null;
    },
    getLocale(tag: string) {
      return this.getRaw ? this.getRaw(tag) : (localeMap.get(tag.trim()) ?? null);
    },
    isSupported(tag: string, asOf?: Date | string) {
      return this.get(tag, asOf) !== null;
    },
    isSupportedLocale(tag: string) {
      return this.isSupported(tag);
    },
    isLocaleProductionSelectable(tag: string, asOf?: Date | string): boolean {
      const loc = this.get(tag, asOf);
      return isLocaleProductionSelectable(loc);
    },
    getEnabledLocales(asOf?: Date | string): readonly LocaleMetadata[] {
      return Array.from(localeMap.values()).filter(l =>
        (l.enabled ?? l.isActive) && isDateInEffectiveWindow(asOf, l.effectiveFrom, l.effectiveTo)
      );
    },
    getProductionReadyLocales(asOf?: Date | string): readonly LocaleMetadata[] {
      return Array.from(localeMap.values()).filter(l =>
        this.isLocaleProductionSelectable(l.tag, asOf)
      );
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
    resolveFallbackLocale(tag: string) {
      return this.resolveFallback(tag);
    },
    getVersion() {
      return `${version}-locales`;
    },
    listActive(asOf?: Date | string) {
      return Array.from(localeMap.values()).filter(l =>
        l.isActive && isDateInEffectiveWindow(asOf, l.effectiveFrom, l.effectiveTo)
      );
    },
    listAll() {
      return Array.from(localeMap.values());
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
