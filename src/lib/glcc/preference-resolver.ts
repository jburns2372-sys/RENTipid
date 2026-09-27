/**
 * RENTipid GLCC v1.0 — Global Preference Resolver
 *
 * Implements pure, side-effect-free resolution of EffectiveGlobalPreference
 * following the strict 5-tier precedence order:
 *
 * 1. explicit current choice (explicitChoice)
 * 2. saved account preference (accountSaved)
 * 3. guest session (guestSession)
 * 4. first-run browser/coarse-country suggestion (firstRunSuggestion)
 * 5. platform default (platformDefault)
 *
 * Enforces all non-negotiable architectural invariants:
 * - Language, country, display currency, and charge currency are resolved independently.
 * - Language changes never alter country, currency, or permissions.
 * - Display currency is separate from charge currency.
 * - Charge conversion is strictly disabled; charge currency always equals platform default.
 * - Country change resets manual display override unless explicitly allowed and supported.
 * - Unsupported, inactive, or effective-window failures fail closed to next tier.
 * - Returned preference object and provenance are deeply frozen.
 * - Zero mutations on input arguments.
 */

import {
  type EffectiveGlobalPreference,
  type GlobalPreferenceResolutionInput,
  type PreferenceInputTier,
  type PreferenceResolutionPolicy,
  type PreferenceSource,
  DEFAULT_PREFERENCE_RESOLUTION_POLICY,
  assertPreferenceInvariants,
} from './contracts';
import type { RegistryContext } from './registry-contracts';
import {
  resolveEffectiveLocale,
  isLocaleEligibleForMode,
  mapLocaleSourceToPreferenceSource,
  mapPreferenceSourceToLocaleSource,
  type ResolverMode,
  type LocaleResolutionSource,
  type EffectiveLocaleResolutionInput,
  type EffectiveLocaleResult,
} from './locale-resolver';

export {
  resolveEffectiveLocale,
  isLocaleEligibleForMode,
  mapLocaleSourceToPreferenceSource,
  mapPreferenceSourceToLocaleSource,
  type ResolverMode,
  type LocaleResolutionSource,
  type EffectiveLocaleResolutionInput,
  type EffectiveLocaleResult,
};

interface CandidateResolution<T> {
  readonly value: T;
  readonly source: PreferenceSource;
  readonly isManualOverride: boolean;
  readonly sourceTimestamp?: string;
}

function sanitizeString(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Deep freezes an object to ensure runtime immutability.
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
 * Pure function resolving EffectiveGlobalPreference according to 5-level precedence and policy rules.
 */
export function resolveGlobalPreference(
  input: GlobalPreferenceResolutionInput,
  registries: RegistryContext,
  policyInput?: Partial<PreferenceResolutionPolicy>,
  asOf?: Date | string
): EffectiveGlobalPreference {
  const policy: PreferenceResolutionPolicy = {
    ...DEFAULT_PREFERENCE_RESOLUTION_POLICY,
    ...policyInput,
  };

  const resolvedAt = (asOf ? new Date(asOf) : new Date()).toISOString();

  // Validate platformDefault (Tier 5 anchor)
  const defaultLang = sanitizeString(input.platformDefault.languageTag);
  const defaultCountry = sanitizeString(input.platformDefault.countryCode)?.toUpperCase();
  const defaultDisplay = sanitizeString(input.platformDefault.displayCurrency)?.toUpperCase();
  const defaultCharge = sanitizeString(input.platformDefault.chargeCurrency)?.toUpperCase();

  if (!defaultLang || !defaultCountry || !defaultDisplay || !defaultCharge) {
    throw new Error('GLCC platformDefault must specify non-empty languageTag, countryCode, displayCurrency, and chargeCurrency');
  }

  if (!registries.countries.isSupported(defaultCountry, resolvedAt)) {
    throw new Error(`Platform default country '${defaultCountry}' is not supported in registry`);
  }
  if (!registries.currencies.isSupported(defaultDisplay, resolvedAt)) {
    throw new Error(`Platform default display currency '${defaultDisplay}' is not supported in registry`);
  }
  if (!registries.currencies.isSupported(defaultCharge, resolvedAt)) {
    throw new Error(`Platform default charge currency '${defaultCharge}' is not supported in registry`);
  }
  if (!registries.locales.isSupported(defaultLang, resolvedAt)) {
    throw new Error(`Platform default language '${defaultLang}' is not supported in registry`);
  }

  // Build ordered tiers for evaluation
  // Precedence: explicitChoice > (accountSaved vs guestSession based on reconciliation policy) > firstRunSuggestion > platformDefault
  const tiers: { source: PreferenceSource; tier: PreferenceInputTier | null | undefined }[] = [];

  tiers.push({ source: 'EXPLICIT_CHOICE', tier: input.explicitChoice });

  if (policy.signInReconciliationPolicy === 'EXPLICIT_GUEST_CHOICE_WINS') {
    // If guest had explicit manual choices during session, evaluate guest first, then account
    if (input.guestSession?.isManualDisplayOverride) {
      tiers.push({ source: 'GUEST_SESSION', tier: input.guestSession });
      tiers.push({ source: 'ACCOUNT_SAVED', tier: input.accountSaved });
    } else {
      tiers.push({ source: 'ACCOUNT_SAVED', tier: input.accountSaved });
      tiers.push({ source: 'GUEST_SESSION', tier: input.guestSession });
    }
  } else {
    // ACCOUNT_SAVED_WINS: saved account preferences always take priority over guest session
    tiers.push({ source: 'ACCOUNT_SAVED', tier: input.accountSaved });
    tiers.push({ source: 'GUEST_SESSION', tier: input.guestSession });
  }

  tiers.push({ source: 'FIRST_RUN_SUGGESTION', tier: input.firstRunSuggestion });

  // 1. Resolve Country Code
  let resolvedCountryCandidate: CandidateResolution<string> | null = null;

  for (const { source, tier } of tiers) {
    if (!tier) continue;
    const countryCandidate = sanitizeString(tier.countryCode)?.toUpperCase();
    if (countryCandidate && registries.countries.isSupported(countryCandidate, resolvedAt)) {
      resolvedCountryCandidate = {
        value: countryCandidate,
        source,
        isManualOverride: source === 'EXPLICIT_CHOICE' || Boolean(tier.isManualDisplayOverride),
        sourceTimestamp: tier.timestamp,
      };
      break;
    }
  }

  if (!resolvedCountryCandidate) {
    resolvedCountryCandidate = {
      value: defaultCountry,
      source: 'PLATFORM_DEFAULT',
      isManualOverride: false,
    };
  }

  const countryProfile = registries.countries.get(resolvedCountryCandidate.value, resolvedAt);
  if (!countryProfile) {
    throw new Error(`Resolved country '${resolvedCountryCandidate.value}' profile could not be loaded`);
  }

  const allowedDisplayCurrencies = registries.countries.getAllowedDisplayCurrencies(
    resolvedCountryCandidate.value,
    resolvedAt
  );

  // Determine if country changed relative to accountSaved or guestSession baseline
  const previousCountry =
    sanitizeString(input.accountSaved?.countryCode)?.toUpperCase() ||
    sanitizeString(input.guestSession?.countryCode)?.toUpperCase();
  const countryChanged = previousCountry && previousCountry !== resolvedCountryCandidate.value;

  // 2. Resolve Display Currency
  let resolvedDisplayCandidate: CandidateResolution<string> | null = null;

  // If explicit choice provided a display currency, check if allowed for the resolved country
  const explicitDisplay = sanitizeString(input.explicitChoice?.displayCurrency)?.toUpperCase();
  if (
    explicitDisplay &&
    allowedDisplayCurrencies.includes(explicitDisplay) &&
    registries.currencies.isSupported(explicitDisplay, resolvedAt)
  ) {
    resolvedDisplayCandidate = {
      value: explicitDisplay,
      source: 'EXPLICIT_CHOICE',
      isManualOverride: true,
      sourceTimestamp: input.explicitChoice?.timestamp,
    };
  }

  // If country changed and policy is RESET_TO_COUNTRY_DEFAULT, reset manual display override
  // to the new country default unless explicit choice specifically provided an allowed one above
  if (!resolvedDisplayCandidate && countryChanged && policy.countryChangePolicy === 'RESET_TO_COUNTRY_DEFAULT') {
    resolvedDisplayCandidate = {
      value: countryProfile.defaultDisplayCurrency,
      source: resolvedCountryCandidate.source === 'EXPLICIT_CHOICE' ? 'EXPLICIT_CHOICE' : 'PLATFORM_DEFAULT',
      isManualOverride: false,
    };
  }

  // Otherwise evaluate remaining tiers in order
  if (!resolvedDisplayCandidate) {
    for (const { source, tier } of tiers) {
      if (!tier) continue;
      const displayCandidate = sanitizeString(tier.displayCurrency)?.toUpperCase();
      if (
        displayCandidate &&
        allowedDisplayCurrencies.includes(displayCandidate) &&
        registries.currencies.isSupported(displayCandidate, resolvedAt)
      ) {
        resolvedDisplayCandidate = {
          value: displayCandidate,
          source,
          isManualOverride: source === 'EXPLICIT_CHOICE' || Boolean(tier.isManualDisplayOverride),
          sourceTimestamp: tier.timestamp,
        };
        break;
      }
    }
  }

  // Fallback to Country Profile Default Display Currency, or Platform Default
  if (!resolvedDisplayCandidate) {
    const countryDefault = countryProfile.defaultDisplayCurrency;
    if (
      allowedDisplayCurrencies.includes(countryDefault) &&
      registries.currencies.isSupported(countryDefault, resolvedAt)
    ) {
      resolvedDisplayCandidate = {
        value: countryDefault,
        source: 'PLATFORM_DEFAULT',
        isManualOverride: false,
      };
    } else {
      resolvedDisplayCandidate = {
        value: defaultDisplay,
        source: 'PLATFORM_DEFAULT',
        isManualOverride: false,
      };
    }
  }

  // 3. Resolve Language Tag (Independent of country and currency)
  let resolvedLanguageCandidate: CandidateResolution<string> | null = null;

  if (policy.resolverMode) {
    const locRes = resolveEffectiveLocale(
      {
        explicitChoice: input.explicitChoice,
        accountSaved: input.accountSaved,
        guestSession: input.guestSession,
        firstRunSuggestion: input.firstRunSuggestion,
        platformDefault: defaultLang,
        resolverMode: policy.resolverMode,
      },
      registries.locales,
      { asOf: resolvedAt }
    );
    resolvedLanguageCandidate = {
      value: locRes.effectiveLocale,
      source: locRes.preferenceSource,
      isManualOverride: locRes.source === 'EXPLICIT',
      sourceTimestamp:
        locRes.source === 'EXPLICIT'
          ? input.explicitChoice?.timestamp
          : locRes.source === 'ACCOUNT'
          ? input.accountSaved?.timestamp
          : locRes.source === 'GUEST'
          ? input.guestSession?.timestamp
          : locRes.source === 'SUGGESTION'
          ? input.firstRunSuggestion?.timestamp
          : undefined,
    };
  } else {
    for (const { source, tier } of tiers) {
      if (!tier) continue;
      const langCandidate = sanitizeString(tier.languageTag);
      if (!langCandidate) continue;

      if (registries.locales.isSupported(langCandidate, resolvedAt)) {
        resolvedLanguageCandidate = {
          value: langCandidate,
          source,
          isManualOverride: source === 'EXPLICIT_CHOICE',
          sourceTimestamp: tier.timestamp,
        };
        break;
      }

      // Try fallback locale if supported
      const fallback = registries.locales.resolveFallback(langCandidate);
      if (fallback && registries.locales.isSupported(fallback, resolvedAt)) {
        resolvedLanguageCandidate = {
          value: fallback,
          source,
          isManualOverride: source === 'EXPLICIT_CHOICE',
          sourceTimestamp: tier.timestamp,
        };
        break;
      }
    }

    if (!resolvedLanguageCandidate) {
      resolvedLanguageCandidate = {
        value: defaultLang,
        source: 'PLATFORM_DEFAULT',
        isManualOverride: false,
      };
    }
  }

  // 4. Resolve Charge Currency
  // INVARIANT #5 & MIP Section 6.4: Charge conversion is disabled.
  // Charge currency is strictly preserved / fixed to platform default charge currency (PHP).
  const resolvedChargeCandidate: CandidateResolution<string> = {
    value: defaultCharge,
    source: 'PLATFORM_DEFAULT',
    isManualOverride: false,
  };

  // 5. Resolve Timezone (Optional, resolved separately from country)
  let resolvedTimezoneCandidate: CandidateResolution<string> | null = null;
  for (const { source, tier } of tiers) {
    if (!tier) continue;
    const tzCandidate = sanitizeString(tier.timezone);
    if (tzCandidate) {
      resolvedTimezoneCandidate = {
        value: tzCandidate,
        source,
        isManualOverride: source === 'EXPLICIT_CHOICE',
        sourceTimestamp: tier.timestamp,
      };
      break;
    }
  }

  if (!resolvedTimezoneCandidate && countryProfile.defaultTimezone) {
    resolvedTimezoneCandidate = {
      value: countryProfile.defaultTimezone,
      source: 'PLATFORM_DEFAULT',
      isManualOverride: false,
    };
  } else if (!resolvedTimezoneCandidate && input.platformDefault.timezone) {
    resolvedTimezoneCandidate = {
      value: input.platformDefault.timezone,
      source: 'PLATFORM_DEFAULT',
      isManualOverride: false,
    };
  }

  // Construct provenance
  const provenance: EffectiveGlobalPreference['provenance'] = {
    language: {
      source: resolvedLanguageCandidate.source,
      isManualOverride: resolvedLanguageCandidate.isManualOverride,
      ...(resolvedLanguageCandidate.sourceTimestamp ? { sourceTimestamp: resolvedLanguageCandidate.sourceTimestamp } : {}),
    },
    country: {
      source: resolvedCountryCandidate.source,
      isManualOverride: resolvedCountryCandidate.isManualOverride,
      ...(resolvedCountryCandidate.sourceTimestamp ? { sourceTimestamp: resolvedCountryCandidate.sourceTimestamp } : {}),
    },
    displayCurrency: {
      source: resolvedDisplayCandidate.source,
      isManualOverride: resolvedDisplayCandidate.isManualOverride,
      ...(resolvedDisplayCandidate.sourceTimestamp ? { sourceTimestamp: resolvedDisplayCandidate.sourceTimestamp } : {}),
    },
    chargeCurrency: {
      source: resolvedChargeCandidate.source,
      isManualOverride: resolvedChargeCandidate.isManualOverride,
    },
    ...(resolvedTimezoneCandidate
      ? {
          timezone: {
            source: resolvedTimezoneCandidate.source,
            isManualOverride: resolvedTimezoneCandidate.isManualOverride,
            ...(resolvedTimezoneCandidate.sourceTimestamp ? { sourceTimestamp: resolvedTimezoneCandidate.sourceTimestamp } : {}),
          },
        }
      : {}),
  };

  const effectivePreference: EffectiveGlobalPreference = {
    languageTag: resolvedLanguageCandidate.value,
    countryCode: resolvedCountryCandidate.value,
    displayCurrency: resolvedDisplayCandidate.value,
    chargeCurrency: resolvedChargeCandidate.value,
    ...(resolvedTimezoneCandidate ? { timezone: resolvedTimezoneCandidate.value } : {}),
    provenance,
    registryVersion: registries.getCompositeVersion(),
    policyVersion: policy.policyVersion,
    resolvedAt,
  };

  // Assert invariants before returning
  assertPreferenceInvariants(effectivePreference, registries, defaultCharge);

  return deepFreeze(effectivePreference);
}
