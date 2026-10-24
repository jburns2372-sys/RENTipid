/**
 * RENTipid GLCC v1.0 — Public Guest Global Preferences API
 *
 * Endpoint: /api/preferences
 * Methods: GET, PATCH, PUT
 *
 * Implements:
 * 1. Public, unauthenticated endpoint for guest visitors.
 * 2. Does NOT weaken or alter /api/me/preferences.
 * 3. Enforces fail-closed feature flags (glcc_v1_enabled, glcc_currency_override_enabled, glcc_country_autodetect_enabled).
 * 4. GET: Resolves preference from (1) valid guest cookie (rentipid_pref), (2) first-run header suggestions if enabled, (3) platform default. Zero DB access.
 * 5. PATCH/PUT: Validates input tuple against GLCC registries, enforces currency override flag, serializes signed tamper-evident cookie, and returns Set-Cookie header. Zero DB records created.
 * 6. Financial boundary preservation: chargeCurrency is locked to PHP and cannot be altered or injected.
 * 7. Security: Rejects prohibited identity/auth keys (userId, role, permissions, chargeCurrency).
 */

import { NextResponse } from 'next/server';
import {
  evaluateGlccFeatureFlags,
  type GlccSystemSettingReader,
  type GlccFeatureFlagEvaluation,
} from '@/lib/glcc/feature-flags';
import {
  adaptRequestToCandidateTiers,
  serializeGuestPreferenceCookie,
  GUEST_PREFERENCE_COOKIE_NAME,
} from '@/lib/glcc/server-adapter';
import {
  resolveGlobalPreference,
} from '@/lib/glcc/preference-resolver';
import {
  getDefaultRegistryContext,
  DEFAULT_PLATFORM_PREFERENCE,
} from '@/lib/glcc/default-registries';
import {
  validateExplicitCountryRequest,
  buildAuthoritativeCountryOptions,
  resolveCountryCurrencyPolicy,
} from '@/lib/glcc/country-policy';
import {
  resolveEffectiveResolverMode,
  isLocaleEligibleForMode,
} from '@/lib/glcc/locale-resolver';
import type { RegistryContext } from '@/lib/glcc/registry-contracts';
import type { EffectiveGlobalPreference } from '@/lib/glcc/contracts';

export interface GuestPreferencesRouteDependencies {
  readonly flagReader?: GlccSystemSettingReader;
  readonly registries?: RegistryContext;
  readonly cookieSecret?: string;
  readonly asOf?: Date | string | (() => Date | string);
}

const PROHIBITED_GUEST_UPDATE_KEYS = Object.freeze([
  'chargeCurrency',
  'charge_currency',
  'user_id',
  'userId',
  'role',
  'permissions',
  'token',
  'password',
  'id',
  'created_at',
  'updated_at',
  'email',
  'session',
  'resolverMode',
  'resolver_mode',
  'localeMode',
  'locale_mode',
  'qaMode',
  'qa_mode',
]);

export function createGuestPreferencesRouteHandlers(deps: GuestPreferencesRouteDependencies = {}) {
  const getRegistries = () => deps.registries ?? getDefaultRegistryContext();
  const getSecret = () =>
    deps.cookieSecret ??
    process.env.SECURITY_TELEMETRY_HMAC_KEY ??
    process.env.GLCC_COOKIE_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    'rentipid-glcc-dev-secret-do-not-use-in-production';

  async function handleGet(req: Request) {
    try {
      // 1. Evaluate feature flags
      const flags: GlccFeatureFlagEvaluation = await evaluateGlccFeatureFlags(deps.flagReader);
      if (!flags.v1Enabled) {
        return NextResponse.json(
          { error: 'Global preferences v1 is disabled' },
          { status: 503 }
        );
      }

      const registries = getRegistries();
      const secret = getSecret();

      // 2. Extract candidate tiers from request (cookie and headers)
      const cookieHeader = req.headers.get('cookie');
      const acceptLanguage = req.headers.get('accept-language');
      const geoIpCountry =
        req.headers.get('cf-ipcountry') ||
        req.headers.get('x-vercel-ip-country') ||
        req.headers.get('x-country-code');

      const { guestSession, firstRunSuggestion } = adaptRequestToCandidateTiers(
        {
          cookieHeader,
          acceptLanguage: flags.countryAutodetectEnabled ? acceptLanguage : null,
          geoIpCountry: flags.countryAutodetectEnabled ? geoIpCountry : null,
        },
        registries,
        secret
      );

      // 3. Resolve effective preference across available tiers
      const effectivePreference: EffectiveGlobalPreference = resolveGlobalPreference(
        {
          guestSession: guestSession ?? undefined,
          firstRunSuggestion: flags.countryAutodetectEnabled ? firstRunSuggestion : undefined,
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
        },
        registries
      );

      const asOf = deps.asOf
        ? (typeof deps.asOf === 'function' ? deps.asOf() : deps.asOf)
        : new Date().toISOString();

      const countryProfile = registries.countries.get(effectivePreference.countryCode, asOf);

      // 4. Return effective preference, capability flags, active registry options, and provenance
      const effectiveMode = resolveEffectiveResolverMode();

      return NextResponse.json({
        effectivePreference,
        capabilities: {
          v1Enabled: flags.v1Enabled,
          currencyOverrideEnabled: flags.currencyOverrideEnabled,
          countryAutodetectEnabled: flags.countryAutodetectEnabled,
          canEdit: true,
          canOverrideCurrency: flags.currencyOverrideEnabled,
          chargeCurrency: 'PHP',
          isGuest: true,
          requiresReconciliation: false,
          resolverMode: effectiveMode,
        },
        options: {
          locales: registries.locales.listActive(asOf).map(l => ({
            tag: l.tag,
            name: l.name,
            nativeName: l.nativeName,
          })),
          countries: buildAuthoritativeCountryOptions(registries.countries, asOf),
          currencies: registries.currencies.listActive(asOf).map(cu => ({
            code: cu.code,
            name: cu.name,
            symbol: cu.symbol,
            minorUnitExponent: cu.minorUnitExponent,
          })),
        },
        provenance: {
          configVersion: countryProfile?.configVersion ?? '1.0.0',
          evaluationTime: asOf,
          defaultCurrencyApplied: effectivePreference.displayCurrency === countryProfile?.defaultDisplayCurrency,
          isManualOverride: effectivePreference.provenance.displayCurrency.isManualOverride,
          fallbackUsed: !guestSession,
          policyOutcome: guestSession ? 'GUEST_COOKIE_USED' : 'PLATFORM_FALLBACK_USED',
        },
      });
    } catch (error) {
      console.error('[GLCC API] Error in GET /api/preferences:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  async function handleUpdate(req: Request) {
    try {
      // 1. Evaluate feature flags
      const flags: GlccFeatureFlagEvaluation = await evaluateGlccFeatureFlags(deps.flagReader);
      if (!flags.v1Enabled) {
        return NextResponse.json(
          { error: 'Global preferences v1 is disabled' },
          { status: 503 }
        );
      }

      // 2. Parse and validate JSON body
      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
      }

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ error: 'Expected JSON object in request body' }, { status: 400 });
      }

      // 3. Reject forbidden keys
      for (const key of PROHIBITED_GUEST_UPDATE_KEYS) {
        if (key in body) {
          return NextResponse.json(
            { error: `Prohibited field in preference update: ${key}` },
            { status: 400 }
          );
        }
      }

      const registries = getRegistries();
      const secret = getSecret();

      const { languageTag, countryCode, displayCurrency, isManualDisplayOverride } = body as {
        languageTag?: unknown;
        countryCode?: unknown;
        displayCurrency?: unknown;
        isManualDisplayOverride?: unknown;
      };

      if (!languageTag || typeof languageTag !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid languageTag' }, { status: 400 });
      }
      if (!countryCode || typeof countryCode !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid countryCode' }, { status: 400 });
      }
      if (!displayCurrency || typeof displayCurrency !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid displayCurrency' }, { status: 400 });
      }

      const normalizedLang = languageTag.trim();
      const normalizedCountry = countryCode.trim().toUpperCase();
      const normalizedCur = displayCurrency.trim().toUpperCase();

      const asOf = deps.asOf
        ? (typeof deps.asOf === 'function' ? deps.asOf() : deps.asOf)
        : new Date().toISOString();

      // 4. Explicit country validation via P4A country-policy authority
      const explicitCountryVal = validateExplicitCountryRequest(
        normalizedCountry,
        registries.countries,
        registries.currencies,
        asOf
      );
      if (!explicitCountryVal.isValid) {
        return NextResponse.json(
          {
            error: explicitCountryVal.errorCode === 'UNSUPPORTED_COUNTRY'
              ? `Unsupported country code: ${normalizedCountry}`
              : explicitCountryVal.errorMessage || 'Invalid explicit country',
            code: explicitCountryVal.errorCode || 'UNSUPPORTED_COUNTRY',
          },
          { status: 400 }
        );
      }

      // 5. Language validation
      if (!registries.locales.isSupported(normalizedLang, asOf)) {
        return NextResponse.json(
          { error: `Unsupported language tag: ${normalizedLang}`, code: 'UNSUPPORTED_LOCALE' },
          { status: 400 }
        );
      }

      // 6. Extract prior guest state to evaluate country change and retention policy
      const cookieHeader = req.headers.get('cookie');
      const { guestSession } = adaptRequestToCandidateTiers(
        { cookieHeader, acceptLanguage: null, geoIpCountry: null },
        registries,
        secret
      );
      const currentCountry = guestSession?.countryCode ?? normalizedCountry;
      const currentCurrency = guestSession?.displayCurrency ?? 'PHP';
      const currentIsManual = guestSession?.isManualDisplayOverride ?? false;

      // 7. Run authoritative Country-Currency Policy Engine
      const policyResult = resolveCountryCurrencyPolicy({
        currentCountry,
        currentDisplayCurrency: currentCurrency,
        currentIsManualDisplayOverride: currentIsManual,
        requestedCountry: normalizedCountry,
        requestedDisplayCurrency: normalizedCur,
        currencyOverrideFeatureEnabled: flags.currencyOverrideEnabled,
        retentionPolicy: 'RESET_TO_COUNTRY_DEFAULT',
        asOf,
        registries,
      });

      // 8. Rejection of disallowed/disabled override
      if (policyResult.rejectionReason === 'OVERRIDE_FEATURE_DISABLED') {
        return NextResponse.json(
          {
            error: policyResult.reason || 'Currency override is disabled',
            code: 'CURRENCY_OVERRIDE_DISABLED',
          },
          { status: 400 }
        );
      }
      if (policyResult.rejectionReason === 'CURRENCY_NOT_ALLOWED_FOR_COUNTRY') {
        return NextResponse.json(
          {
            error: policyResult.reason || `Currency ${normalizedCur} is not allowed for country ${normalizedCountry}`,
            code: 'DISALLOWED_CURRENCY',
          },
          { status: 400 }
        );
      }
      if (policyResult.rejectionReason === 'CURRENCY_INACTIVE_OR_UNSUPPORTED') {
        return NextResponse.json(
          {
            error: policyResult.reason || `Currency ${normalizedCur} is unsupported`,
            code: 'UNSUPPORTED_CURRENCY',
          },
          { status: 400 }
        );
      }

      if (isManualDisplayOverride === true && !flags.currencyOverrideEnabled) {
        return NextResponse.json(
          { error: 'Currency override is disabled', code: 'CURRENCY_OVERRIDE_DISABLED' },
          { status: 400 }
        );
      }

      // 9. Serialize tamper-evident bounded guest cookie
      const serializedCookie = serializeGuestPreferenceCookie(
        {
          languageTag: normalizedLang,
          countryCode: policyResult.countryCode,
          displayCurrency: policyResult.displayCurrency,
          isManualDisplayOverride: policyResult.isManualDisplayOverride,
        },
        secret
      );

      // 10. Resolve updated effective preference
      const effectivePreference: EffectiveGlobalPreference = resolveGlobalPreference(
        {
          guestSession: {
            languageTag: normalizedLang,
            countryCode: policyResult.countryCode,
            displayCurrency: policyResult.displayCurrency,
            isManualDisplayOverride: policyResult.isManualDisplayOverride,
            timestamp: typeof asOf === 'string' ? asOf : asOf.toISOString(),
          },
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
        },
        registries
      );

      // 11. Prepare response with Set-Cookie header and provenance
      const effectiveMode = resolveEffectiveResolverMode();
      const response = NextResponse.json({
        status: 'SUCCESS',
        effectivePreference,
        capabilities: {
          v1Enabled: flags.v1Enabled,
          currencyOverrideEnabled: flags.currencyOverrideEnabled,
          countryAutodetectEnabled: flags.countryAutodetectEnabled,
          canEdit: true,
          canOverrideCurrency: flags.currencyOverrideEnabled,
          chargeCurrency: 'PHP',
          isGuest: true,
          requiresReconciliation: false,
          resolverMode: effectiveMode,
        },
        provenance: {
          configVersion: policyResult.provenance.configVersion,
          evaluationTime: asOf,
          defaultCurrencyApplied: policyResult.appliedCountryDefault,
          overrideAccepted: policyResult.outcome === 'ACCEPTED_EXPLICIT_OVERRIDE',
          fallbackUsed: false,
          policyOutcome: policyResult.outcome,
          reason: policyResult.reason,
        },
      });

      response.cookies.set({
        name: GUEST_PREFERENCE_COOKIE_NAME,
        value: serializedCookie,
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });

      response.cookies.set({
        name: 'rentipid_locale',
        value: effectivePreference.languageTag,
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
      });

      return response;
    } catch (error) {
      console.error('[GLCC API] Error in PATCH/PUT /api/preferences:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  return {
    GET: handleGet,
    PATCH: handleUpdate,
    PUT: handleUpdate,
  };
}
