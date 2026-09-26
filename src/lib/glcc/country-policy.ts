/**
 * RENTipid GLCC v1.0 — Country Profile & Country-to-Currency Policy Foundation (P4A)
 *
 * Implements pure, side-effect-free, deterministic policy resolution for:
 * 1. Effective-dated CountryProfile resolution with fail-safe boundaries.
 * 2. Country-to-currency mapping applying configured defaultDisplayCurrency.
 * 3. Manual display-currency override validation and feature-flag gating.
 * 4. Manual override retention policy (authoritative: RESET_TO_COUNTRY_DEFAULT).
 * 5. Minor-unit representation verification (0, 2, 3 digits).
 * 6. Strict financial boundary preservation: chargeCurrency is ALWAYS PHP; foreign charge strictly disabled.
 * 7. Strict language independence: language is never mutated by country/currency resolution.
 * 8. Auditable policy provenance and outcome reporting.
 *
 * Invariant: Zero direct reliance on system clock; all functions accept an optional deterministic `asOf` date.
 */

import type {
  CountryProfile,
  CountryProfileRegistry,
  CurrencyMetadata,
  CurrencyRegistry,
  RegistryContext,
} from './registry-contracts';

export type CountryProfileResolutionFailureReason =
  | 'UNSUPPORTED_COUNTRY'
  | 'DISABLED_COUNTRY'
  | 'FUTURE_COUNTRY_PROFILE'
  | 'EXPIRED_COUNTRY_PROFILE'
  | 'AMBIGUOUS_PROFILE_MAPPING';

export interface CountryProfileResolutionSuccess {
  readonly success: true;
  readonly countryProfile: Readonly<CountryProfile>;
  readonly effectiveDate: string;
}

export interface CountryProfileResolutionFailure {
  readonly success: false;
  readonly failureReason: CountryProfileResolutionFailureReason;
  readonly message: string;
  readonly requestedCountryCode: string;
  readonly effectiveDate: string;
}

export type CountryProfileResolutionResult =
  | CountryProfileResolutionSuccess
  | CountryProfileResolutionFailure;

export type CountryCurrencyPolicyOutcome =
  | 'APPLIED_COUNTRY_DEFAULT'
  | 'RETAINED_VALID_OVERRIDE'
  | 'ACCEPTED_EXPLICIT_OVERRIDE'
  | 'REJECTED_OVERRIDE_APPLIED_DEFAULT'
  | 'FAILED_CLOSED_FALLBACK';

export type CurrencyOverrideRejectionReason =
  | 'OVERRIDE_FEATURE_DISABLED'
  | 'CURRENCY_NOT_ALLOWED_FOR_COUNTRY'
  | 'CURRENCY_INACTIVE_OR_UNSUPPORTED'
  | 'COUNTRY_RESOLUTION_FAILED';

export interface CountryCurrencyPolicyInput {
  readonly requestedCountryCode?: string;
  readonly requestedCountry?: string; // Standard alias for requestedCountryCode
  readonly currentCountryCode?: string | null;
  readonly currentCountry?: string | null; // Standard alias for currentCountryCode
  readonly requestedDisplayCurrency?: string | null;
  readonly currentDisplayCurrency?: string | null;
  readonly isManualDisplayOverrideRequested?: boolean;
  readonly currentIsManualDisplayOverride?: boolean;
  readonly currencyOverrideFeatureEnabled: boolean;
  readonly registries: RegistryContext;
  readonly asOf?: Date | string; // Deterministic evaluation time
  readonly countryChangePolicy?: 'RESET_TO_COUNTRY_DEFAULT' | 'RETAIN_VALID_OVERRIDE';
  readonly retentionPolicy?: 'RESET_TO_COUNTRY_DEFAULT' | 'RETAIN_VALID_OVERRIDE'; // Standard alias for countryChangePolicy
  readonly fallbackCountryCode?: string; // Default: 'PH'
  readonly fallbackDisplayCurrency?: string; // Default: 'PHP'
}

export interface CountryCurrencyPolicyProvenance {
  readonly evaluationTime: string;
  readonly countryProfileVersion: string;
  readonly currencyRegistryVersion: string;
  readonly compositeRegistryVersion: string;
  readonly configVersion: string;
  readonly retentionPolicyApplied: 'RESET_TO_COUNTRY_DEFAULT' | 'RETAIN_VALID_OVERRIDE';
  readonly isCountryChanged: boolean;
  readonly rawRequestedCountry: string;
  readonly rawRequestedCurrency?: string | null;
}

export interface CountryCurrencyPolicyResult {
  readonly success: boolean;
  readonly countryCode: string;
  readonly displayCurrency: string;
  readonly chargeCurrency: 'PHP'; // Immutable financial authority boundary
  readonly isManualDisplayOverride: boolean;
  readonly appliedCountryDefault: boolean;
  readonly outcome: CountryCurrencyPolicyOutcome;
  readonly reason?: string;
  readonly rejectionReason?: CurrencyOverrideRejectionReason;
  readonly countryProfile?: Readonly<CountryProfile>;
  readonly provenance: CountryCurrencyPolicyProvenance;
}

/**
 * Deep freezes an object recursively to guarantee policy output immutability.
 */
function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val as object);
    }
  }
  return obj;
}

/**
 * Resolves a CountryProfile for a supplied country code and evaluation time `asOf`.
 * Fails closed deterministically with specific failure reasons for:
 * - unsupported country
 * - disabled country
 * - future (not yet active) country profile
 * - expired country profile
 */
export function resolveEffectiveCountryProfile(
  countryCode: string | undefined | null,
  countryRegistry: CountryProfileRegistry,
  asOf?: Date | string
): CountryProfileResolutionResult {
  const effectiveDate = (asOf ? new Date(asOf) : new Date()).toISOString();
  const normalizedCode = (countryCode ?? '').trim().toUpperCase();

  if (!normalizedCode) {
    return Object.freeze({
      success: false,
      failureReason: 'UNSUPPORTED_COUNTRY',
      message: 'Country code is empty or invalid',
      requestedCountryCode: '',
      effectiveDate,
    });
  }

  // 1. Attempt standard active resolution as of effectiveDate
  const activeProfile = countryRegistry.get(normalizedCode, effectiveDate);
  if (activeProfile) {
    return Object.freeze({
      success: true,
      countryProfile: activeProfile,
      effectiveDate,
    });
  }

  // 2. Profile not active as of effectiveDate: inspect registered profile to diagnose exact fail-closed reason
  const rawProfile = countryRegistry.getRaw
    ? countryRegistry.getRaw(normalizedCode)
    : (countryRegistry.listAll ? countryRegistry.listAll().find(p => p.code.toUpperCase() === normalizedCode) : null);

  if (!rawProfile) {
    // Check if the registry knows the code at all
    return Object.freeze({
      success: false,
      failureReason: 'UNSUPPORTED_COUNTRY',
      message: `Country code '${normalizedCode}' is not supported by CountryProfileRegistry`,
      requestedCountryCode: normalizedCode,
      effectiveDate,
    });
  }

  // Check disabled status
  const isEnabled = rawProfile.isActive ?? rawProfile.enabled ?? true;
  if (!isEnabled) {
    return Object.freeze({
      success: false,
      failureReason: 'DISABLED_COUNTRY',
      message: `Country profile for '${normalizedCode}' is disabled`,
      requestedCountryCode: normalizedCode,
      effectiveDate,
    });
  }

  // Check effective dates
  const targetTime = new Date(effectiveDate).getTime();
  if (rawProfile.effectiveFrom && targetTime < new Date(rawProfile.effectiveFrom).getTime()) {
    return Object.freeze({
      success: false,
      failureReason: 'FUTURE_COUNTRY_PROFILE',
      message: `Country profile for '${normalizedCode}' is effective in the future (${rawProfile.effectiveFrom})`,
      requestedCountryCode: normalizedCode,
      effectiveDate,
    });
  }

  if (rawProfile.effectiveTo && targetTime > new Date(rawProfile.effectiveTo).getTime()) {
    return Object.freeze({
      success: false,
      failureReason: 'EXPIRED_COUNTRY_PROFILE',
      message: `Country profile for '${normalizedCode}' has expired (${rawProfile.effectiveTo})`,
      requestedCountryCode: normalizedCode,
      effectiveDate,
    });
  }

  return Object.freeze({
    success: false,
    failureReason: 'UNSUPPORTED_COUNTRY',
    message: `Country profile for '${normalizedCode}' is not active as of ${effectiveDate}`,
    requestedCountryCode: normalizedCode,
    effectiveDate,
  });
}

/**
 * Validates currency minor-unit representation.
 * Explicitly validates:
 * - 0 minor digits (e.g., JPY)
 * - 2 minor digits (e.g., PHP, USD, EUR)
 * - 3 minor digits (e.g., BHD, KWD, OMR)
 */
export function validateCurrencyMinorUnits(
  currencyCode: string | undefined | null,
  currencyRegistry: CurrencyRegistry,
  asOf?: Date | string
): {
  readonly isValid: boolean;
  readonly minorUnitExponent: number | null;
  readonly metadata: CurrencyMetadata | null;
  readonly error?: string;
} {
  const normalizedCode = (currencyCode ?? '').trim().toUpperCase();
  if (!normalizedCode) {
    return { isValid: false, minorUnitExponent: null, metadata: null, error: 'Currency code is empty' };
  }

  const meta = currencyRegistry.get(normalizedCode, asOf);
  if (!meta) {
    return {
      isValid: false,
      minorUnitExponent: null,
      metadata: null,
      error: `Currency '${normalizedCode}' is not supported or not active`,
    };
  }

  const exp = meta.minorUnitExponent;
  if (typeof exp !== 'number' || !Number.isInteger(exp) || exp < 0 || exp > 4) {
    return {
      isValid: false,
      minorUnitExponent: exp ?? null,
      metadata: meta,
      error: `Currency '${normalizedCode}' has invalid minorUnitExponent: ${exp}`,
    };
  }

  return {
    isValid: true,
    minorUnitExponent: exp,
    metadata: meta,
  };
}

/**
 * Authoritative P4 Country-to-Currency Policy Engine.
 *
 * Enforces:
 * 1. Effective-dated CountryProfile resolution.
 * 2. Country selection automatically applies configured defaultDisplayCurrency.
 * 3. Gated display-currency override rules (glcc_currency_override_enabled).
 * 4. Manual override retention policy on country change (authoritative: RESET_TO_COUNTRY_DEFAULT).
 * 5. Strict fail-closed fallback to platform baseline (PH / PHP).
 * 6. Charge currency immutable anchor to PHP (no foreign charge, no FX).
 * 7. Language independence: preserves language unchanged.
 */
export function resolveCountryCurrencyPolicy(
  input: CountryCurrencyPolicyInput
): CountryCurrencyPolicyResult {
  const fallbackCountry = (input.fallbackCountryCode ?? 'PH').trim().toUpperCase();
  const fallbackCurrency = (input.fallbackDisplayCurrency ?? 'PHP').trim().toUpperCase();
  const retentionPolicy = input.countryChangePolicy ?? input.retentionPolicy ?? 'RESET_TO_COUNTRY_DEFAULT';
  const evaluationTime = (input.asOf ? new Date(input.asOf) : new Date()).toISOString();

  const rawRequestedCountry = input.requestedCountryCode ?? input.requestedCountry ?? '';
  const rawRequestedCurrency = input.requestedDisplayCurrency ?? null;

  const normalizedRequestedCountry = rawRequestedCountry.trim().toUpperCase();
  const currentCode = input.currentCountryCode ?? input.currentCountry;
  const normalizedCurrentCountry = currentCode ? currentCode.trim().toUpperCase() : null;
  const isCountryChanged = Boolean(
    normalizedCurrentCountry && normalizedCurrentCountry !== normalizedRequestedCountry
  );

  const baseProvenance: CountryCurrencyPolicyProvenance = {
    evaluationTime,
    countryProfileVersion: input.registries.countries.getVersion(),
    currencyRegistryVersion: input.registries.currencies.getVersion(),
    compositeRegistryVersion: input.registries.getCompositeVersion(),
    configVersion: '1.0.0',
    retentionPolicyApplied: retentionPolicy,
    isCountryChanged,
    rawRequestedCountry,
    rawRequestedCurrency,
  };

  // Step 1: Resolve Country Profile
  const profileResolution = resolveEffectiveCountryProfile(
    normalizedRequestedCountry,
    input.registries.countries,
    evaluationTime
  );

  if (!profileResolution.success) {
    // Fail-safe fallback to canonical platform default
    const fallbackProfile = input.registries.countries.get(fallbackCountry, evaluationTime);
    return deepFreeze({
      success: false,
      countryCode: fallbackCountry,
      displayCurrency: fallbackCurrency,
      chargeCurrency: 'PHP',
      isManualDisplayOverride: false,
      appliedCountryDefault: true,
      outcome: 'FAILED_CLOSED_FALLBACK',
      reason: profileResolution.message,
      rejectionReason: 'COUNTRY_RESOLUTION_FAILED',
      countryProfile: fallbackProfile ?? undefined,
      provenance: {
        ...baseProvenance,
        configVersion: fallbackProfile?.configVersion ?? '1.0.0',
      },
    });
  }

  const profile = profileResolution.countryProfile;
  const configVersion = profile.configVersion ?? '1.0.0';
  const updatedProvenance = { ...baseProvenance, configVersion };

  // Step 2: Validate Country Profile default display currency in CurrencyRegistry
  const defaultCurrency = (profile.defaultDisplayCurrency || profile.defaultCurrency || '').trim().toUpperCase();
  const defaultCurrencyMeta = input.registries.currencies.get(defaultCurrency, evaluationTime);

  if (!defaultCurrencyMeta || !defaultCurrencyMeta.isActive) {
    // Default currency of country profile is missing or inactive: fail closed to fallback
    return deepFreeze({
      success: false,
      countryCode: fallbackCountry,
      displayCurrency: fallbackCurrency,
      chargeCurrency: 'PHP',
      isManualDisplayOverride: false,
      appliedCountryDefault: true,
      outcome: 'FAILED_CLOSED_FALLBACK',
      reason: `Default currency '${defaultCurrency}' for country '${profile.code}' is missing or inactive in CurrencyRegistry`,
      countryProfile: profile,
      provenance: updatedProvenance,
    });
  }

  // Step 3: Handle Display Currency Resolution & Override Rules
  const allowedDisplayCurrencies = input.registries.countries.getAllowedDisplayCurrencies(
    profile.code,
    evaluationTime
  );

  // If user requested an explicit display currency in this call:
  const requestedDisplay = rawRequestedCurrency ? rawRequestedCurrency.trim().toUpperCase() : null;

  if (requestedDisplay) {
    // User requested an explicit currency.
    // If it matches country default: it is simply the default
    if (requestedDisplay === defaultCurrency) {
      return deepFreeze({
        success: true,
        countryCode: profile.code,
        displayCurrency: defaultCurrency,
        chargeCurrency: 'PHP',
        isManualDisplayOverride: false,
        appliedCountryDefault: true,
        outcome: 'APPLIED_COUNTRY_DEFAULT',
        reason: 'Requested display currency matches country default display currency',
        countryProfile: profile,
        provenance: updatedProvenance,
      });
    }

    // It is different from country default: evaluate override permissions
    if (!input.currencyOverrideFeatureEnabled) {
      // Feature flag disabled: reject override, apply country default
      return deepFreeze({
        success: true,
        countryCode: profile.code,
        displayCurrency: defaultCurrency,
        chargeCurrency: 'PHP',
        isManualDisplayOverride: false,
        appliedCountryDefault: true,
        outcome: 'REJECTED_OVERRIDE_APPLIED_DEFAULT',
        reason: 'Display currency override is disabled by system policy (glcc_currency_override_enabled=false)',
        rejectionReason: 'OVERRIDE_FEATURE_DISABLED',
        countryProfile: profile,
        provenance: updatedProvenance,
      });
    }

    if (!input.registries.currencies.isSupported(requestedDisplay, evaluationTime)) {
      // Inactive or unsupported currency in CurrencyRegistry: reject override, apply country default
      return deepFreeze({
        success: true,
        countryCode: profile.code,
        displayCurrency: defaultCurrency,
        chargeCurrency: 'PHP',
        isManualDisplayOverride: false,
        appliedCountryDefault: true,
        outcome: 'REJECTED_OVERRIDE_APPLIED_DEFAULT',
        reason: `Display currency '${requestedDisplay}' is not supported in registry`,
        rejectionReason: 'CURRENCY_INACTIVE_OR_UNSUPPORTED',
        countryProfile: profile,
        provenance: updatedProvenance,
      });
    }

    if (!allowedDisplayCurrencies.includes(requestedDisplay)) {
      // Disallowed by CountryProfile: reject override, apply country default
      return deepFreeze({
        success: true,
        countryCode: profile.code,
        displayCurrency: defaultCurrency,
        chargeCurrency: 'PHP',
        isManualDisplayOverride: false,
        appliedCountryDefault: true,
        outcome: 'REJECTED_OVERRIDE_APPLIED_DEFAULT',
        reason: `Display currency '${requestedDisplay}' is not allowed for country '${profile.code}'`,
        rejectionReason: 'CURRENCY_NOT_ALLOWED_FOR_COUNTRY',
        countryProfile: profile,
        provenance: updatedProvenance,
      });
    }

    // All conditions met: accept explicit manual override
    return deepFreeze({
      success: true,
      countryCode: profile.code,
      displayCurrency: requestedDisplay,
      chargeCurrency: 'PHP',
      isManualDisplayOverride: true,
      appliedCountryDefault: false,
      outcome: 'ACCEPTED_EXPLICIT_OVERRIDE',
      reason: `Manual display currency override to '${requestedDisplay}' accepted for country '${profile.code}'`,
      countryProfile: profile,
      provenance: updatedProvenance,
    });
  }

  // Step 4: No explicit requestedDisplayCurrency in this call.
  // Evaluate Country Change & Retention Policy.
  if (isCountryChanged) {
    if (retentionPolicy === 'RESET_TO_COUNTRY_DEFAULT') {
      // Mandated active policy: country change resets display currency to new country default
      return deepFreeze({
        success: true,
        countryCode: profile.code,
        displayCurrency: defaultCurrency,
        chargeCurrency: 'PHP',
        isManualDisplayOverride: false,
        appliedCountryDefault: true,
        outcome: 'APPLIED_COUNTRY_DEFAULT',
        reason: `Country changed from '${normalizedCurrentCountry}' to '${profile.code}'; reset to country default currency under RESET_TO_COUNTRY_DEFAULT policy`,
        countryProfile: profile,
        provenance: updatedProvenance,
      });
    }

    // If alternate retention policy RETAIN_VALID_OVERRIDE was selected:
    if (
      retentionPolicy === 'RETAIN_VALID_OVERRIDE' &&
      input.currencyOverrideFeatureEnabled &&
      input.currentDisplayCurrency &&
      input.currentIsManualDisplayOverride
    ) {
      const priorCurrency = input.currentDisplayCurrency.trim().toUpperCase();
      if (
        allowedDisplayCurrencies.includes(priorCurrency) &&
        input.registries.currencies.isSupported(priorCurrency, evaluationTime)
      ) {
        return deepFreeze({
          success: true,
          countryCode: profile.code,
          displayCurrency: priorCurrency,
          chargeCurrency: 'PHP',
          isManualDisplayOverride: priorCurrency !== defaultCurrency,
          appliedCountryDefault: priorCurrency === defaultCurrency,
          outcome: 'RETAINED_VALID_OVERRIDE',
          reason: `Country changed from '${normalizedCurrentCountry}' to '${profile.code}'; retained valid prior override '${priorCurrency}' under RETAIN_VALID_OVERRIDE policy`,
          countryProfile: profile,
          provenance: updatedProvenance,
        });
      }
    }

    // Fallback on country change if retention not applicable: apply country default
    return deepFreeze({
      success: true,
      countryCode: profile.code,
      displayCurrency: defaultCurrency,
      chargeCurrency: 'PHP',
      isManualDisplayOverride: false,
      appliedCountryDefault: true,
      outcome: 'APPLIED_COUNTRY_DEFAULT',
      reason: `Country changed from '${normalizedCurrentCountry}' to '${profile.code}'; applied country default currency`,
      countryProfile: profile,
      provenance: updatedProvenance,
    });
  }

  // Step 5: Country did not change, and no new explicit currency requested.
  // Maintain current display currency if valid, or default.
  if (
    input.currentDisplayCurrency &&
    input.currentIsManualDisplayOverride &&
    input.currencyOverrideFeatureEnabled
  ) {
    const cur = input.currentDisplayCurrency.trim().toUpperCase();
    if (
      allowedDisplayCurrencies.includes(cur) &&
      input.registries.currencies.isSupported(cur, evaluationTime)
    ) {
      return deepFreeze({
        success: true,
        countryCode: profile.code,
        displayCurrency: cur,
        chargeCurrency: 'PHP',
        isManualDisplayOverride: cur !== defaultCurrency,
        appliedCountryDefault: cur === defaultCurrency,
        outcome: 'RETAINED_VALID_OVERRIDE',
        reason: `Maintained existing manual override '${cur}'`,
        countryProfile: profile,
        provenance: updatedProvenance,
      });
    }
  }

  // Default outcome: Country default display currency
  return deepFreeze({
    success: true,
    countryCode: profile.code,
    displayCurrency: defaultCurrency,
    chargeCurrency: 'PHP',
    isManualDisplayOverride: false,
    appliedCountryDefault: true,
    outcome: 'APPLIED_COUNTRY_DEFAULT',
    reason: `Applied configured default display currency '${defaultCurrency}' for country '${profile.code}'`,
    countryProfile: profile,
    provenance: updatedProvenance,
  });
}

export interface ExplicitCountryValidationResult {
  readonly isValid: boolean;
  readonly countryProfile?: Readonly<CountryProfile>;
  readonly errorCode?:
    | 'UNSUPPORTED_COUNTRY'
    | 'COUNTRY_DISABLED'
    | 'COUNTRY_PROFILE_NOT_EFFECTIVE'
    | 'COUNTRY_DEFAULT_CURRENCY_UNAVAILABLE';
  readonly errorMessage?: string;
}

/**
 * Validates an explicit user request for a country code.
 * Rejects unsupported, disabled, future, or expired countries with deterministic error codes.
 * Ensures the country's defaultDisplayCurrency is active in CurrencyRegistry.
 */
export function validateExplicitCountryRequest(
  countryCode: string | undefined | null,
  countryRegistry: CountryProfileRegistry,
  currencyRegistry: CurrencyRegistry,
  asOf?: Date | string
): ExplicitCountryValidationResult {
  const profileRes = resolveEffectiveCountryProfile(countryCode, countryRegistry, asOf);
  if (!profileRes.success) {
    let errorCode: ExplicitCountryValidationResult['errorCode'] = 'UNSUPPORTED_COUNTRY';
    if (profileRes.failureReason === 'DISABLED_COUNTRY') {
      errorCode = 'COUNTRY_DISABLED';
    } else if (
      profileRes.failureReason === 'FUTURE_COUNTRY_PROFILE' ||
      profileRes.failureReason === 'EXPIRED_COUNTRY_PROFILE'
    ) {
      errorCode = 'COUNTRY_PROFILE_NOT_EFFECTIVE';
    }
    return {
      isValid: false,
      errorCode,
      errorMessage: profileRes.message,
    };
  }

  // Validate that defaultDisplayCurrency of this country profile is active in CurrencyRegistry
  const defaultCur = profileRes.countryProfile.defaultDisplayCurrency;
  const curMeta = currencyRegistry.get(defaultCur, asOf);
  if (!curMeta || !curMeta.isActive) {
    return {
      isValid: false,
      errorCode: 'COUNTRY_DEFAULT_CURRENCY_UNAVAILABLE',
      errorMessage: `Configured default currency '${defaultCur}' for country '${profileRes.countryProfile.code}' is missing or inactive in CurrencyRegistry`,
    };
  }

  return {
    isValid: true,
    countryProfile: profileRes.countryProfile,
  };
}

export interface AuthoritativeCountryOption {
  readonly code: string;
  readonly name: string;
  readonly defaultDisplayCurrency: string;
  readonly allowedDisplayCurrencies: readonly string[];
  readonly allowedChargeCurrencies: readonly string[];
  readonly defaultLanguageTag: string;
  readonly supportedLanguageTags: readonly string[];
  readonly timezoneDefault?: string;
  readonly unitSystem: 'metric' | 'imperial';
  readonly configVersion: string;
}

/**
 * Builds the authoritative, production-safe country options metadata for API GET endpoints.
 * Strictly excludes:
 * - Test fixture profiles (isTestFixture: true)
 * - Inactive, future, or expired profiles as of the evaluation time
 */
export function buildAuthoritativeCountryOptions(
  countryRegistry: CountryProfileRegistry,
  asOf?: Date | string
): readonly AuthoritativeCountryOption[] {
  const activeProfiles = countryRegistry.listActive(asOf);
  return Object.freeze(
    activeProfiles
      .filter(p => !p.isTestFixture)
      .map(p =>
        Object.freeze({
          code: p.code,
          name: p.name,
          defaultDisplayCurrency: p.defaultDisplayCurrency,
          allowedDisplayCurrencies: Object.freeze([...p.allowedDisplayCurrencies]),
          allowedChargeCurrencies: Object.freeze([...(p.allowedChargeCurrencies ?? ['PHP'])]),
          defaultLanguageTag: p.defaultLanguageTag,
          supportedLanguageTags: Object.freeze([...p.supportedLanguageTags]),
          timezoneDefault: p.timezoneDefault ?? p.defaultTimezone,
          unitSystem: (p.unitSystem ?? 'metric') as 'metric' | 'imperial',
          configVersion: p.configVersion ?? '1.0.0',
        })
      )
  );
}

