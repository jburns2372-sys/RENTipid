/**
 * RENTipid GLCC v1.0 — Global Language, Country & Currency Contracts
 *
 * Defines the immutable EffectiveGlobalPreference tuple, 5-level precedence tiers,
 * provenance metadata, resolution policy contracts, and non-negotiable invariant validators.
 *
 * Invariant: Pure contract layer. Zero dependencies on Prisma, Next.js request headers,
 * payment providers, or external persistence.
 */

import type { RegistryContext } from './registry-contracts';

export type PreferenceSource =
  | 'EXPLICIT_CHOICE'
  | 'ACCOUNT_SAVED'
  | 'GUEST_SESSION'
  | 'FIRST_RUN_SUGGESTION'
  | 'PLATFORM_DEFAULT';

export const PREFERENCE_PRECEDENCE_ORDER: readonly PreferenceSource[] = Object.freeze([
  'EXPLICIT_CHOICE',
  'ACCOUNT_SAVED',
  'GUEST_SESSION',
  'FIRST_RUN_SUGGESTION',
  'PLATFORM_DEFAULT',
]);

export interface FieldProvenance {
  readonly source: PreferenceSource;
  readonly isManualOverride: boolean;
  readonly sourceTimestamp?: string;
}

export interface EffectiveGlobalPreference {
  /** Canonical BCP 47 language tag (e.g. 'en-PH', 'fil-PH'). Maps to colloquial 'languageLocale' in plan references. */
  readonly languageTag: string;
  /** ISO 3166-1 alpha-2 country preference code. Not proof of residence, tax domicile, or legal eligibility. */
  readonly countryCode: string;
  /** Display currency for localized presentation (ISO 4217). Display capability is NOT charge capability. */
  readonly displayCurrency: string;
  /**
   * Informative representation of the platform charge currency (strictly PHP).
   * Preference resolution is NOT a financial authority, does NOT recompute transaction truth,
   * and does NOT authorize multi-currency payment charging or settlement.
   */
  readonly chargeCurrency: string;
  readonly timezone?: string;
  readonly provenance: {
    readonly language: FieldProvenance;
    readonly country: FieldProvenance;
    readonly displayCurrency: FieldProvenance;
    readonly chargeCurrency: FieldProvenance;
    readonly timezone?: FieldProvenance;
  };
  readonly registryVersion: string;
  readonly policyVersion: string;
  readonly resolvedAt: string;
}

export interface PreferenceInputTier {
  readonly languageTag?: string | null;
  readonly countryCode?: string | null;
  readonly displayCurrency?: string | null;
  readonly timezone?: string | null;
  readonly isManualDisplayOverride?: boolean;
  readonly timestamp?: string;
}

export interface PlatformDefaultPreference {
  readonly languageTag: string;
  readonly countryCode: string;
  readonly displayCurrency: string;
  readonly chargeCurrency: string;
  readonly timezone?: string;
}

export interface GlobalPreferenceResolutionInput {
  readonly explicitChoice?: PreferenceInputTier | null;
  readonly accountSaved?: PreferenceInputTier | null;
  readonly guestSession?: PreferenceInputTier | null;
  readonly firstRunSuggestion?: PreferenceInputTier | null;
  readonly platformDefault: PlatformDefaultPreference;
}

export type CountryChangeOverridePolicy =
  | 'RESET_TO_COUNTRY_DEFAULT'
  | 'PRESERVE_MANUAL_OVERRIDE_IF_ALLOWED';

export type SignInReconciliationPolicy =
  | 'EXPLICIT_GUEST_CHOICE_WINS'
  | 'ACCOUNT_SAVED_WINS';

export interface PreferenceResolutionPolicy {
  readonly policyVersion: string;
  readonly countryChangePolicy: CountryChangeOverridePolicy;
  readonly signInReconciliationPolicy: SignInReconciliationPolicy;
  readonly allowDisplayCurrencyOverride: boolean;
  readonly strictChargeCurrencyFixedToDefault: boolean;
}

/**
 * PROVISIONAL POLICY DEFAULTS:
 * Configurable policy inputs for P1A contracts. These provide safe defaults for testing and
 * standalone resolution, but do NOT represent binding owner approval of production business policy.
 */
export const DEFAULT_PREFERENCE_RESOLUTION_POLICY: PreferenceResolutionPolicy = Object.freeze({
  policyVersion: '1.0.0',
  countryChangePolicy: 'RESET_TO_COUNTRY_DEFAULT',
  signInReconciliationPolicy: 'EXPLICIT_GUEST_CHOICE_WINS',
  allowDisplayCurrencyOverride: true,
  strictChargeCurrencyFixedToDefault: true,
});

export class GlccInvariantViolationError extends Error {
  readonly violations: readonly string[];

  constructor(message: string, violations: readonly string[]) {
    super(`${message}: ${violations.join('; ')}`);
    this.name = 'GlccInvariantViolationError';
    this.violations = Object.freeze([...violations]);
  }
}

export interface PreferenceValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validates an EffectiveGlobalPreference against GLCC non-negotiable architectural invariants:
 * 1. Language, country, display currency, and charge currency must be non-empty valid strings.
 * 2. Country must be active and supported in the CountryProfileRegistry.
 * 3. Display currency must be active, supported, and permitted for the resolved country.
 * 4. Charge currency must be active and supported.
 * 5. Language tag must be active and supported in the LocaleRegistry.
 * 6. Provenance must be fully populated with valid PreferenceSource values.
 * 7. When strict charge policy is active, charge currency must equal platform default (charge conversion disabled).
 */
export function validateEffectivePreference(
  preference: EffectiveGlobalPreference,
  registries: RegistryContext,
  platformDefaultChargeCurrency = 'PHP'
): PreferenceValidationResult {
  const errors: string[] = [];

  if (!preference) {
    return { isValid: false, errors: ['Effective preference object is missing or null'] };
  }

  // 1. Structural checks
  if (!preference.languageTag || typeof preference.languageTag !== 'string') {
    errors.push('Language tag is missing or not a string');
  }
  if (!preference.countryCode || typeof preference.countryCode !== 'string') {
    errors.push('Country code is missing or not a string');
  }
  if (!preference.displayCurrency || typeof preference.displayCurrency !== 'string') {
    errors.push('Display currency is missing or not a string');
  }
  if (!preference.chargeCurrency || typeof preference.chargeCurrency !== 'string') {
    errors.push('Charge currency is missing or not a string');
  }
  if (!preference.provenance) {
    errors.push('Provenance metadata is missing');
  }

  // 2. Registry validations
  if (preference.countryCode) {
    const country = registries.countries.get(preference.countryCode, preference.resolvedAt);
    if (!country) {
      errors.push(`Country '${preference.countryCode}' is not supported or inactive in registry`);
    } else if (preference.displayCurrency) {
      const allowed = registries.countries.getAllowedDisplayCurrencies(preference.countryCode, preference.resolvedAt);
      if (!allowed.includes(preference.displayCurrency.toUpperCase())) {
        errors.push(
          `Display currency '${preference.displayCurrency}' is not allowed for country '${preference.countryCode}'. Allowed: [${allowed.join(', ')}]`
        );
      }
    }
  }

  if (preference.displayCurrency) {
    const currency = registries.currencies.get(preference.displayCurrency, preference.resolvedAt);
    if (!currency) {
      errors.push(`Display currency '${preference.displayCurrency}' is not supported or inactive in registry`);
    }
  }

  if (preference.chargeCurrency) {
    const chargeCurr = registries.currencies.get(preference.chargeCurrency, preference.resolvedAt);
    if (!chargeCurr) {
      errors.push(`Charge currency '${preference.chargeCurrency}' is not supported or inactive in registry`);
    }
    // Invariant: Charge conversion disabled; charge currency must be platform default
    if (preference.chargeCurrency.toUpperCase() !== platformDefaultChargeCurrency.toUpperCase()) {
      errors.push(
        `Charge currency '${preference.chargeCurrency}' violates charge invariant; must match default '${platformDefaultChargeCurrency}'`
      );
    }
  }

  if (preference.languageTag) {
    const locale = registries.locales.get(preference.languageTag, preference.resolvedAt);
    if (!locale) {
      errors.push(`Language tag '${preference.languageTag}' is not supported or inactive in registry`);
    }
  }

  // 3. Provenance checks
  if (preference.provenance) {
    for (const field of ['language', 'country', 'displayCurrency', 'chargeCurrency'] as const) {
      const prov = preference.provenance[field];
      if (!prov || !PREFERENCE_PRECEDENCE_ORDER.includes(prov.source)) {
        errors.push(`Invalid or missing provenance for field '${field}'`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: Object.freeze(errors),
  };
}

/**
 * Asserts all invariants, throwing GlccInvariantViolationError if any check fails.
 */
export function assertPreferenceInvariants(
  preference: EffectiveGlobalPreference,
  registries: RegistryContext,
  platformDefaultChargeCurrency = 'PHP'
): void {
  const result = validateEffectivePreference(preference, registries, platformDefaultChargeCurrency);
  if (!result.isValid) {
    throw new GlccInvariantViolationError('GLCC architectural invariant assertion failed', result.errors);
  }
}
