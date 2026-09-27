/**
 * RENTipid GLCC v1.0 — Static UI Internationalization Engine (P3A + P3B)
 *
 * Implements deterministic locale fallback, parameter interpolation, and bundle resolution.
 *
 * Fallback Resolution Order:
 * 1. Exact requested locale bundle
 * 2. Approved family / parent fallback bundle (from LocaleRegistry or tag prefix)
 * 3. Platform default bundle ('en-PH')
 * 4. Deterministic generic safe fallback (never undefined, null, raw object, or raw dot-notated code keys)
 *
 * Guaranteed Invariants:
 * - Locale change never mutates country, currency, payment, or auth state.
 * - Interpolation treats parameters as raw data (never executes code or injects raw HTML).
 * - Fallback and missing keys are observable through telemetry callbacks.
 */

import type {
  GlccCanonicalTranslationKey,
  TranslationBundle,
  TranslationParams,
  TranslationEngineOptions,
} from './contracts';
import { EN_PH_BUNDLE } from './locales/en-PH';
import { FIL_PH_BUNDLE, FIL_PH_FIXTURE_BUNDLE } from './locales/fil-PH';

/**
 * Derives a clean humanized presentation fallback from a dot-notated key to prevent
 * exposing raw internal code identifiers (e.g. 'auth.signIn.submit') to customers.
 */
export function deriveSafeFallback(key: string): string {
  if (!key) return '';
  const segments = key.split('.');
  const last = segments[segments.length - 1];
  // Remove technical suffixes if present
  const cleaned = last.replace(/(Label|Button|Text|Placeholder)$/, '');
  const target = cleaned.length > 0 ? cleaned : last;
  // Convert camelCase or snake_case to Title Case
  const words = target
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export class TranslationEngine {
  private bundles: Map<string, TranslationBundle> = new Map();
  private defaultLocale: string = 'en-PH';
  private activeLocale?: string;
  private onMissingKey?: (key: string, locale: string) => void;
  private onFallbackUsed?: (key: string, requestedLocale: string, fallbackLocale: string) => void;

  constructor(options?: TranslationEngineOptions) {
    if (options?.defaultLocale) {
      this.defaultLocale = options.defaultLocale;
    }
    this.onMissingKey = options?.onMissingKey;
    this.onFallbackUsed = options?.onFallbackUsed;

    // Register baseline bundles
    this.registerBundle(EN_PH_BUNDLE);
    this.registerBundle(FIL_PH_BUNDLE || FIL_PH_FIXTURE_BUNDLE);
  }

  /**
   * Sets the global active runtime locale (client context synchronization).
   */
  public setActiveLocale(locale?: string): void {
    this.activeLocale = locale ? locale.trim() : undefined;
  }

  /**
   * Gets the active runtime locale, falling back to defaultLocale.
   */
  public getActiveLocale(): string {
    return this.activeLocale || this.defaultLocale;
  }

  /**
   * Register or replace a translation bundle in the engine.
   */
  public registerBundle(bundle: TranslationBundle): void {
    this.bundles.set(bundle.locale.toLowerCase(), bundle);
  }

  /**
   * Unregister a bundle (useful in test isolation).
   */
  public unregisterBundle(locale: string): void {
    this.bundles.delete(locale.toLowerCase());
  }

  /**
   * Check if a bundle is registered for the specified locale.
   */
  public hasBundle(locale: string): boolean {
    return this.bundles.has(locale.toLowerCase());
  }

  /**
   * Retrieve bundle for a locale.
   */
  public getBundle(locale: string): TranslationBundle | undefined {
    return this.bundles.get(locale.toLowerCase());
  }

  /**
   * Get direction ('ltr' | 'rtl') for a locale.
   */
  public getDirection(locale: string): 'ltr' | 'rtl' {
    const bundle = this.bundles.get(locale.toLowerCase());
    return bundle?.direction ?? 'ltr';
  }

  /**
   * Resolve an approved family fallback locale tag.
   */
  public getFamilyFallback(locale: string): string | null {
    const normalized = locale.toLowerCase();
    if (normalized === 'fil-ph' || normalized === 'fil') {
      return 'en-PH';
    }
    // E.g., 'en-US' -> 'en-PH' or base language
    const parts = locale.split('-');
    if (parts.length > 1) {
      const base = parts[0];
      if (base.toLowerCase() !== normalized) {
        return base;
      }
    }
    return null;
  }

  /**
   * Translate a canonical key with deterministic fallback and parameter interpolation.
   */
  public translate(
    key: GlccCanonicalTranslationKey | string,
    params?: TranslationParams,
    requestedLocale?: string,
    fallbackText?: string
  ): string {
    const targetLocale = (requestedLocale || this.activeLocale || this.defaultLocale).trim();
    const normalizedTarget = targetLocale.toLowerCase();

    // 1. Exact locale match
    const exactBundle = this.bundles.get(normalizedTarget);
    if (exactBundle && Object.prototype.hasOwnProperty.call(exactBundle.messages, key)) {
      const msg = exactBundle.messages[key as GlccCanonicalTranslationKey];
      if (typeof msg === 'string') {
        return this.interpolate(msg, params);
      }
    }

    // 2. Approved family fallback match
    const familyFallbackTag = this.getFamilyFallback(targetLocale);
    if (familyFallbackTag) {
      const familyBundle = this.bundles.get(familyFallbackTag.toLowerCase());
      if (familyBundle && Object.prototype.hasOwnProperty.call(familyBundle.messages, key)) {
        const msg = familyBundle.messages[key as GlccCanonicalTranslationKey];
        if (typeof msg === 'string') {
          this.onFallbackUsed?.(key, targetLocale, familyBundle.locale);
          return this.interpolate(msg, params);
        }
      }
    }

    // 3. Platform default match
    const defaultBundle = this.bundles.get(this.defaultLocale.toLowerCase());
    if (defaultBundle && normalizedTarget !== this.defaultLocale.toLowerCase()) {
      if (Object.prototype.hasOwnProperty.call(defaultBundle.messages, key)) {
        const msg = defaultBundle.messages[key as GlccCanonicalTranslationKey];
        if (typeof msg === 'string') {
          this.onFallbackUsed?.(key, targetLocale, defaultBundle.locale);
          return this.interpolate(msg, params);
        }
      }
    }

    // 4. Deterministic safe fallback: never return undefined, null, raw object,
    // or expose raw internal code keys (e.g. 'auth.signIn.submit') to customers
    this.onMissingKey?.(key, targetLocale);
    if (fallbackText) {
      return this.interpolate(fallbackText, params);
    }
    return deriveSafeFallback(key);
  }

  /**
   * Safely interpolate named variables into message template.
   */
  private interpolate(template: string, params?: TranslationParams): string {
    if (!params || Object.keys(params).length === 0) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (match, token: string) => {
      if (Object.prototype.hasOwnProperty.call(params, token)) {
        const val = params[token];
        return val !== undefined && val !== null ? String(val) : '';
      }
      return match;
    });
  }
}

// Global singleton instance with default platform configuration
export const defaultTranslationEngine = new TranslationEngine();

/**
 * Convenience helper to set the active platform locale.
 */
export function setActiveLocale(locale?: string): void {
  defaultTranslationEngine.setActiveLocale(locale);
}

/**
 * Convenience helper to get the active platform locale.
 */
export function getActiveLocale(): string {
  return defaultTranslationEngine.getActiveLocale();
}

/**
 * Convenience helper to translate using the default engine.
 */
export function t(
  key: GlccCanonicalTranslationKey | string,
  params?: TranslationParams,
  locale?: string,
  fallbackText?: string
): string {
  return defaultTranslationEngine.translate(key, params, locale, fallbackText);
}
