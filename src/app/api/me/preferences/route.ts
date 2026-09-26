/**
 * RENTipid GLCC v1.0 — Authenticated User Global Preferences API
 *
 * Endpoint: /api/me/preferences
 * Methods: GET, PATCH, PUT
 *
 * Implements:
 * 1. Derives authenticated actor exclusively from getServerSession(authOptions).
 * 2. Blocks caller-supplied user IDs and prohibited authorization/identity keys.
 * 3. Enforces fail-closed feature flags (glcc_v1_enabled, glcc_currency_override_enabled, glcc_country_autodetect_enabled).
 * 4. GET: Resolves account preference, reads valid guest cookies, applies P1A/P1B reconciliation, returns effective preference without writing to account.
 * 5. PATCH/PUT: Validates input tuple against GLCC registries, enforces currency override flag, persists atomically via AccountPreferenceService, and handles optimistic concurrency versioning.
 * 6. Financial boundary preservation: chargeCurrency is never accepted or persisted.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import {
  evaluateGlccFeatureFlags,
  type GlccSystemSettingReader,
  type GlccFeatureFlagEvaluation,
} from '../../../../lib/glcc/feature-flags';
import {
  readAccountPreference,
  saveAccountPreference,
  createPrismaPreferenceDatabase,
  type PreferenceDatabaseDelegate,
  GlccAuthorizationError,
  GlccValidationError,
  GlccConcurrencyConflictError,
  type UserGlobalPreferenceRecord,
} from '../../../../lib/glcc/preference-service';
import {
  parseGuestPreferenceCookie,
  extractHeaderSuggestions,
  GUEST_PREFERENCE_COOKIE_NAME,
} from '../../../../lib/glcc/server-adapter';
import {
  reconcilePreferencesOnSignIn,
  type GuestPreferenceState,
  type PersistedPreferenceState,
} from '../../../../lib/glcc/preference-reconciler';
import {
  resolveGlobalPreference,
} from '../../../../lib/glcc/preference-resolver';
import {
  getDefaultRegistryContext,
  DEFAULT_PLATFORM_PREFERENCE,
} from '../../../../lib/glcc/default-registries';
import {
  validateExplicitCountryRequest,
  buildAuthoritativeCountryOptions,
  resolveCountryCurrencyPolicy,
} from '../../../../lib/glcc/country-policy';
import type { RegistryContext } from '../../../../lib/glcc/registry-contracts';
import type {
  PreferenceInputTier,
  EffectiveGlobalPreference,
} from '../../../../lib/glcc/contracts';

export interface PreferencesRouteDependencies {
  readonly getSession?: () => Promise<{ user?: { id?: string; role?: string } } | null>;
  readonly db?: PreferenceDatabaseDelegate;
  readonly flagReader?: GlccSystemSettingReader;
  readonly registries?: RegistryContext;
  readonly cookieSecret?: string;
  readonly asOf?: Date | string | (() => Date | string);
}

const PROHIBITED_UPDATE_KEYS = Object.freeze([
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
]);

export function createPreferencesRouteHandlers(deps: PreferencesRouteDependencies = {}) {
  const getSession = deps.getSession ?? (() => getServerSession(authOptions));
  const getDb = () => deps.db ?? createPrismaPreferenceDatabase();
  const getRegistries = () => deps.registries ?? getDefaultRegistryContext();
  const getSecret = () =>
    deps.cookieSecret ??
    process.env.GLCC_COOKIE_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    'rentipid-glcc-default-dev-secret';

  async function handleGet(req: Request) {
    try {
      // 1. Authenticate server-side session
      const session = await getSession();
      const userId = session?.user?.id;
      if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 2. Evaluate feature flags
      const flags: GlccFeatureFlagEvaluation = await evaluateGlccFeatureFlags(deps.flagReader);
      if (!flags.v1Enabled) {
        return NextResponse.json(
          { error: 'GLCC feature is currently disabled', code: 'FEATURE_DISABLED' },
          { status: 403 }
        );
      }

      const registries = getRegistries();
      const db = getDb();
      const cookieSecret = getSecret();

      // 3. Extract request candidate inputs
      const cookieHeader = req.headers.get('cookie') ?? '';
      let guestState: GuestPreferenceState | null = null;

      const rawCookie = cookieHeader
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(`${GUEST_PREFERENCE_COOKIE_NAME}=`))
        ?.slice(GUEST_PREFERENCE_COOKIE_NAME.length + 1);

      if (rawCookie) {
        const parsed = parseGuestPreferenceCookie(rawCookie, cookieSecret);
        if (parsed.isValid && parsed.payload) {
          guestState = {
            languageTag: parsed.payload.lng,
            countryCode: parsed.payload.cnt,
            displayCurrency: parsed.payload.cur,
            isManualDisplayOverride: parsed.payload.man ?? false,
            isValid: true,
          };
        } else {
          guestState = {
            isValid: false,
          };
        }
      }

      // 4. Extract header suggestions if country autodetect is enabled
      let firstRunSuggestion: PreferenceInputTier | null = null;
      if (flags.countryAutodetectEnabled) {
        firstRunSuggestion = extractHeaderSuggestions(
          {
            acceptLanguage: req.headers.get('accept-language'),
            countryHeader:
              req.headers.get('x-vercel-ip-country') ??
              req.headers.get('x-country-code') ??
              req.headers.get('cf-ipcountry'),
          },
          registries
        );
      }

      // 5. Read saved account preference
      const savedRecord = await readAccountPreference(userId, userId, db);

      const accountSavedState: PersistedPreferenceState | null = savedRecord
        ? {
            languageTag: savedRecord.languageTag,
            countryCode: savedRecord.countryCode,
            displayCurrency: savedRecord.displayCurrency,
            isManualDisplayOverride: savedRecord.isManualDisplayOverride,
            timezone: savedRecord.timezone,
            version: savedRecord.version,
          }
        : null;

      // 6. Apply deterministic reconciliation
      const reconciliation = reconcilePreferencesOnSignIn(
        accountSavedState,
        guestState,
        registries,
        DEFAULT_PLATFORM_PREFERENCE
      );

      // If no account preference and no guest preference existed, but header suggestion is enabled,
      // allow first-run suggestion to populate effective preference at tier 4
      let effectivePreference = reconciliation.effectivePreference;
      if (!accountSavedState && (!guestState || !guestState.isValid) && firstRunSuggestion && flags.countryAutodetectEnabled) {
        effectivePreference = resolveGlobalPreference(
          {
            firstRunSuggestion,
            platformDefault: DEFAULT_PLATFORM_PREFERENCE,
          },
          registries
        );
      }

      const asOf = deps.asOf
        ? (typeof deps.asOf === 'function' ? deps.asOf() : deps.asOf)
        : new Date().toISOString();

      const activeLocales = registries.locales.listActive(asOf).map(l => ({
        tag: l.tag,
        name: l.name,
        nativeName: l.nativeName,
        direction: l.direction,
        fallbackTag: l.fallbackTag,
      }));

      const activeCountries = buildAuthoritativeCountryOptions(registries.countries, asOf);

      const activeCurrencies = registries.currencies.listActive(asOf).map(cur => ({
        code: cur.code,
        name: cur.name,
        symbol: cur.symbol,
        minorUnitExponent: cur.minorUnitExponent,
      }));

      const activeCountryProfile = registries.countries.get(effectivePreference.countryCode, asOf);

      return NextResponse.json({
        status: 'SUCCESS',
        reconciliationStatus: reconciliation.outcome,
        requiresUserConfirmation: reconciliation.accountSaveRequired ?? false,
        effectivePreference,
        accountPreference: savedRecord,
        capabilities: {
          v1Enabled: flags.v1Enabled,
          currencyOverrideEnabled: flags.currencyOverrideEnabled,
          countryAutodetectEnabled: flags.countryAutodetectEnabled,
        },
        options: {
          locales: activeLocales,
          countries: activeCountries,
          currencies: activeCurrencies,
        },
        provenance: {
          configVersion: activeCountryProfile?.configVersion ?? '1.0.0',
          evaluationTime: asOf,
          defaultCurrencyApplied: effectivePreference.displayCurrency === activeCountryProfile?.defaultDisplayCurrency,
          overrideAccepted: effectivePreference.provenance.displayCurrency.isManualOverride,
          fallbackUsed: effectivePreference.countryCode === 'PH' && (!savedRecord || !savedRecord.countryCode),
          policyOutcome: reconciliation.outcome,
        },
      });
    } catch (error) {
      console.error('[GLCC API] Error in GET /api/me/preferences:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  async function handleUpdate(req: Request) {
    try {
      // 1. Authenticate server-side session
      const session = await getSession();
      const userId = session?.user?.id;
      if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 2. Evaluate feature flags
      const flags: GlccFeatureFlagEvaluation = await evaluateGlccFeatureFlags(deps.flagReader);
      if (!flags.v1Enabled) {
        return NextResponse.json(
          { error: 'GLCC feature is currently disabled', code: 'FEATURE_DISABLED' },
          { status: 403 }
        );
      }

      // 3. Parse JSON body
      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
      }

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }

      // 4. Prohibit forbidden identity, authorization, and financial keys
      for (const key of Object.keys(body)) {
        if (PROHIBITED_UPDATE_KEYS.includes(key)) {
          return NextResponse.json(
            { error: `Prohibited field '${key}' in request body`, code: 'PROHIBITED_FIELD' },
            { status: 400 }
          );
        }
      }

      const registries = getRegistries();
      const db = getDb();

      const languageTag = typeof body.languageTag === 'string' ? body.languageTag.trim() : undefined;
      const countryCode = typeof body.countryCode === 'string' ? body.countryCode.trim().toUpperCase() : undefined;
      const displayCurrency = typeof body.displayCurrency === 'string' ? body.displayCurrency.trim().toUpperCase() : undefined;
      const isManualDisplayOverride = typeof body.isManualDisplayOverride === 'boolean' ? body.isManualDisplayOverride : undefined;
      const timezone = typeof body.timezone === 'string' ? body.timezone.trim() : body.timezone === null ? null : undefined;
      const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined;

      const asOf = deps.asOf
        ? (typeof deps.asOf === 'function' ? deps.asOf() : deps.asOf)
        : new Date().toISOString();

      // 5. Explicit country validation via P4A country-policy authority
      if (body.countryCode !== undefined) {
        if (!countryCode) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: ['Country code is empty or invalid'],
              code: 'UNSUPPORTED_COUNTRY',
            },
            { status: 400 }
          );
        }
        const countryVal = validateExplicitCountryRequest(
          countryCode,
          registries.countries,
          registries.currencies,
          asOf
        );
        if (!countryVal.isValid) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: [
                countryVal.errorCode === 'UNSUPPORTED_COUNTRY'
                  ? `Country '${countryCode}' is not supported in registry`
                  : (countryVal.errorMessage || `Country '${countryCode}' is not supported in registry`)
              ],
              code: countryVal.errorCode || 'UNSUPPORTED_COUNTRY',
            },
            { status: 400 }
          );
        }
      }

      // 6. Explicit language validation
      if (body.languageTag !== undefined) {
        if (!languageTag || !registries.locales.isSupported(languageTag, asOf)) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: [`Language '${body.languageTag}' is not supported in registry`],
              code: 'UNSUPPORTED_LOCALE',
            },
            { status: 400 }
          );
        }
      }

      // 7. Load existing saved preference to resolve context and detect country change
      const existingRecord = await readAccountPreference(userId, userId, db);
      const currentCountry = existingRecord?.countryCode ?? 'PH';
      const targetCountry = countryCode ?? currentCountry;

      // 8. Run authoritative Country-Currency Policy Engine
      const policyResult = resolveCountryCurrencyPolicy({
        currentCountry,
        currentDisplayCurrency: existingRecord?.displayCurrency ?? 'PHP',
        currentIsManualDisplayOverride: existingRecord?.isManualDisplayOverride ?? false,
        requestedCountry: targetCountry,
        requestedDisplayCurrency: displayCurrency,
        currencyOverrideFeatureEnabled: flags.currencyOverrideEnabled,
        retentionPolicy: 'RESET_TO_COUNTRY_DEFAULT',
        asOf,
        registries,
      });

      // 9. Enforce explicit display currency rejection if policy rejected override
      if (displayCurrency !== undefined) {
        if (!displayCurrency) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: ['Invalid display currency'],
              code: 'UNSUPPORTED_CURRENCY',
            },
            { status: 400 }
          );
        }
        if (policyResult.rejectionReason === 'CURRENCY_INACTIVE_OR_UNSUPPORTED') {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: [policyResult.reason || `Display currency '${displayCurrency}' is not supported in registry`],
              code: 'UNSUPPORTED_CURRENCY',
            },
            { status: 400 }
          );
        }
        if (policyResult.rejectionReason === 'CURRENCY_NOT_ALLOWED_FOR_COUNTRY') {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: [policyResult.reason || `Display currency '${displayCurrency}' is not allowed for country '${targetCountry}'`],
              code: 'DISALLOWED_CURRENCY',
            },
            { status: 400 }
          );
        }
        if (policyResult.rejectionReason === 'OVERRIDE_FEATURE_DISABLED') {
          return NextResponse.json(
            {
              error: 'Display currency override is currently disabled by system policy',
              code: 'CURRENCY_OVERRIDE_DISABLED',
            },
            { status: 400 }
          );
        }
      }

      // If user asserted isManualDisplayOverride === true without currencyOverrideFeatureEnabled
      if (isManualDisplayOverride === true && !flags.currencyOverrideEnabled) {
        return NextResponse.json(
          {
            error: 'Display currency override is currently disabled by system policy',
            code: 'CURRENCY_OVERRIDE_DISABLED',
          },
          { status: 400 }
        );
      }

      // 10. Save preference through AccountPreferenceService
      let savedRecord: UserGlobalPreferenceRecord;
      try {
        savedRecord = await saveAccountPreference(
          userId,
          userId,
          {
            languageTag: languageTag ?? existingRecord?.languageTag ?? 'en-PH',
            countryCode: policyResult.countryCode,
            displayCurrency: policyResult.displayCurrency,
            isManualDisplayOverride: policyResult.isManualDisplayOverride,
            timezone,
          },
          registries,
          db,
          expectedVersion,
          asOf
        );
      } catch (err) {
        if (err instanceof GlccAuthorizationError) {
          return NextResponse.json({ error: err.message }, { status: 403 });
        }
        if (err instanceof GlccValidationError) {
          return NextResponse.json(
            { error: 'Validation failed', details: err.validationErrors },
            { status: 400 }
          );
        }
        if (err instanceof GlccConcurrencyConflictError) {
          return NextResponse.json(
            {
              error: err.message,
              code: 'CONFLICT_VERSION_MISMATCH',
              currentVersion: err.currentVersion,
              expectedVersion: err.expectedVersion,
            },
            { status: 409 }
          );
        }
        throw err;
      }

      // 11. Resolve updated effective preference
      const effectivePreference: EffectiveGlobalPreference = resolveGlobalPreference(
        {
          accountSaved: {
            languageTag: savedRecord.languageTag,
            countryCode: savedRecord.countryCode,
            displayCurrency: savedRecord.displayCurrency,
            isManualDisplayOverride: savedRecord.isManualDisplayOverride,
            timezone: savedRecord.timezone,
            timestamp: typeof savedRecord.updatedAt === 'string' ? savedRecord.updatedAt : savedRecord.updatedAt.toISOString(),
          },
          platformDefault: DEFAULT_PLATFORM_PREFERENCE,
        },
        registries
      );

      return NextResponse.json({
        status: 'SUCCESS',
        savedPreference: savedRecord,
        effectivePreference,
        reconciliationStatus: 'ACCOUNT_PREFERENCE_USED',
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
    } catch (error) {
      console.error('[GLCC API] Error in PATCH/PUT /api/me/preferences:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  return {
    GET: handleGet,
    PATCH: handleUpdate,
    PUT: handleUpdate,
  };
}

const defaultHandlers = createPreferencesRouteHandlers();
export const GET = defaultHandlers.GET;
export const PATCH = defaultHandlers.PATCH;
export const PUT = defaultHandlers.PUT;
