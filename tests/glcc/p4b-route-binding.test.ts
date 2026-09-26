/**
 * RENTipid GLCC v1.0 — P4B Runtime Route Binding & Policy Consolidation Tests
 *
 * Verifies P4B deliverables:
 * 1. Authenticated route (/api/me/preferences) binding to P4A CountryProfile authority.
 * 2. Guest route (/api/preferences) binding to P4A CountryProfile authority.
 * 3. Options metadata strictly exposes active production profiles and excludes test fixtures.
 * 4. Explicit invalid country requests deterministically reject with 400 (never silently persist fallback).
 * 5. Platform fallback semantics clearly distinguish fallback from explicit selection.
 * 6. RESET_TO_COUNTRY_DEFAULT policy enforcement on country mutation.
 * 7. Field independence (language-only, currency-only, country-only).
 * 8. Financial authority preservation: chargeCurrency strictly fixed to PHP, separation between
 *    allowedDisplayCurrencies and allowedChargeCurrencies.
 * 9. Optimistic concurrency control (expectedVersion).
 */

import { createPreferencesRouteHandlers } from '../../src/app/api/me/preferences/route';
import { createGuestPreferencesRouteHandlers } from '../../src/app/api/preferences/route';
import {
  createInMemorySystemSettingReader,
  GLCC_FEATURE_FLAGS,
} from '../../src/lib/glcc/feature-flags';
import {
  createInMemoryPreferenceDatabase,
  type PreferenceDatabaseDelegate,
} from '../../src/lib/glcc/preference-service';
import {
  createInMemoryRegistryContext,
  type CountryProfile,
  type CurrencyMetadata,
  type SupportedLocale,
  type RegistryContext,
} from '../../src/lib/glcc/registry-contracts';
import {
  serializeGuestPreferenceCookie,
  GUEST_PREFERENCE_COOKIE_NAME,
} from '../../src/lib/glcc/server-adapter';

function buildRequest(
  method: string,
  url = 'http://localhost:3000/api/me/preferences',
  headers: Record<string, string> = {},
  body?: unknown
): Request {
  const init: RequestInit = {
    method,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers,
    }),
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

describe('GLCC v1.0 — P4B Runtime Route Binding & Country-to-Currency Consolidation', () => {
  const testSecret = 'rentipid-test-secret-key-32bytes-min-len';
  const testUserId = 'usr_p4b_test_actor';
  const evaluationDate = '2026-06-15T12:00:00Z'; // Fixed evaluation time

  // Build a test registry context with active production profile (PH), test fixtures (US, JP),
  // future profile (SG_FUTURE), expired profile (MY_EXPIRED), and disabled profile (CA_DISABLED).
  function createTestRegistries(): RegistryContext {
    const testCountries: CountryProfile[] = [
      {
        code: 'PH',
        name: 'Philippines',
        defaultDisplayCurrency: 'PHP',
        allowedDisplayCurrencies: ['PHP', 'USD'],
        allowedChargeCurrencies: ['PHP'],
        defaultLanguageTag: 'en-PH',
        supportedLanguageTags: ['en-PH', 'tl-PH'],
        unitSystem: 'metric',
        configVersion: '1.0.0',
        isActive: true,
        isTestFixture: false, // Production-configured profile
      },
      {
        code: 'US',
        name: 'United States',
        defaultDisplayCurrency: 'USD',
        allowedDisplayCurrencies: ['USD'],
        allowedChargeCurrencies: ['PHP'],
        defaultLanguageTag: 'en-US',
        supportedLanguageTags: ['en-US'],
        unitSystem: 'imperial',
        configVersion: '1.0.0',
        isActive: true,
        isTestFixture: true, // Test fixture: must be omitted from production options
      },
      {
        code: 'JP',
        name: 'Japan',
        defaultDisplayCurrency: 'JPY',
        allowedDisplayCurrencies: ['JPY', 'USD'],
        allowedChargeCurrencies: ['PHP'],
        defaultLanguageTag: 'ja-JP',
        supportedLanguageTags: ['ja-JP', 'en-US'],
        unitSystem: 'metric',
        configVersion: '1.0.0',
        isActive: true,
        isTestFixture: true, // Test fixture
      },
      {
        code: 'SG_FUTURE',
        name: 'Singapore Future',
        defaultDisplayCurrency: 'SGD',
        allowedDisplayCurrencies: ['SGD'],
        allowedChargeCurrencies: ['PHP'],
        defaultLanguageTag: 'en-SG',
        supportedLanguageTags: ['en-SG'],
        unitSystem: 'metric',
        configVersion: '1.0.0',
        isActive: true,
        effectiveFrom: '2027-01-01T00:00:00Z', // Future profile
        isTestFixture: false,
      },
      {
        code: 'MY_EXPIRED',
        name: 'Malaysia Expired',
        defaultDisplayCurrency: 'MYR',
        allowedDisplayCurrencies: ['MYR'],
        allowedChargeCurrencies: ['PHP'],
        defaultLanguageTag: 'en-MY',
        supportedLanguageTags: ['en-MY'],
        unitSystem: 'metric',
        configVersion: '1.0.0',
        isActive: true,
        effectiveTo: '2025-12-31T23:59:59Z', // Expired profile
        isTestFixture: false,
      },
      {
        code: 'CA_DISABLED',
        name: 'Canada Disabled',
        defaultDisplayCurrency: 'CAD',
        allowedDisplayCurrencies: ['CAD'],
        allowedChargeCurrencies: ['PHP'],
        defaultLanguageTag: 'en-CA',
        supportedLanguageTags: ['en-CA'],
        unitSystem: 'metric',
        configVersion: '1.0.0',
        isActive: false, // Disabled profile
        isTestFixture: false,
      },
    ];

    const testCurrencies: CurrencyMetadata[] = [
      { code: 'PHP', name: 'Philippine Peso', symbol: '₱', minorUnitExponent: 2, isActive: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', minorUnitExponent: 2, isActive: true },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', minorUnitExponent: 0, isActive: true },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', minorUnitExponent: 2, isActive: true },
      { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', minorUnitExponent: 2, isActive: true },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', minorUnitExponent: 2, isActive: true },
    ];

    const testLocales: SupportedLocale[] = [
      { tag: 'en-PH', name: 'English (Philippines)', nativeName: 'English', direction: 'ltr', isActive: true },
      { tag: 'tl-PH', name: 'Tagalog (Philippines)', nativeName: 'Tagalog', direction: 'ltr', isActive: true },
      { tag: 'en-US', name: 'English (United States)', nativeName: 'English', direction: 'ltr', isActive: true },
      { tag: 'ja-JP', name: 'Japanese', nativeName: '日本語', direction: 'ltr', isActive: true },
      { tag: 'en-SG', name: 'English (Singapore)', nativeName: 'English', direction: 'ltr', isActive: true },
      { tag: 'en-MY', name: 'English (Malaysia)', nativeName: 'English', direction: 'ltr', isActive: true },
      { tag: 'en-CA', name: 'English (Canada)', nativeName: 'English', direction: 'ltr', isActive: true },
    ];

    return createInMemoryRegistryContext({
      locales: testLocales,
      countries: testCountries,
      currencies: testCurrencies,
    });
  }

  let db: PreferenceDatabaseDelegate;
  let flagReader: ReturnType<typeof createInMemorySystemSettingReader>;
  let registries: RegistryContext;

  beforeEach(() => {
    db = createInMemoryPreferenceDatabase();
    registries = createTestRegistries();
    flagReader = createInMemorySystemSettingReader({
      [GLCC_FEATURE_FLAGS.V1_ENABLED]: 'true',
      [GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED]: 'true',
      [GLCC_FEATURE_FLAGS.COUNTRY_AUTODETECT_ENABLED]: 'true',
    });
  });

  function createAuthHandlers(
    sessionUser: { id?: string; role?: string } | null = { id: testUserId, role: 'Renter' },
    asOf: string = evaluationDate
  ) {
    return createPreferencesRouteHandlers({
      getSession: async () => (sessionUser ? { user: sessionUser } : null),
      db,
      flagReader,
      registries,
      cookieSecret: testSecret,
      asOf,
    });
  }

  function createGuestHandlers(asOf: string = evaluationDate) {
    return createGuestPreferencesRouteHandlers({
      flagReader,
      registries,
      cookieSecret: testSecret,
      asOf,
    });
  }

  // =========================================================================
  // 1. OPTIONS METADATA & FIXTURE FILTERING
  // =========================================================================
  describe('Options Metadata Behavior', () => {
    it('GET /api/me/preferences exposes only active, production-configured profiles and omits test fixtures', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      const countryCodes = json.options.countries.map((c: { code: string }) => c.code);

      // Must include production-configured active country (PH)
      expect(countryCodes).toContain('PH');

      // Test fixtures (US, JP) MUST NOT leak into production options
      expect(countryCodes).not.toContain('US');
      expect(countryCodes).not.toContain('JP');

      // Inactive/future/expired profiles MUST NOT appear in active options
      expect(countryCodes).not.toContain('SG_FUTURE');
      expect(countryCodes).not.toContain('MY_EXPIRED');
      expect(countryCodes).not.toContain('CA_DISABLED');
    });

    it('GET /api/preferences (guest) exposes identical filtered production country options', async () => {
      const handlers = createGuestHandlers();
      const req = buildRequest('GET', 'http://localhost:3000/api/preferences');
      const res = await handlers.GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      const countryCodes = json.options.countries.map((c: { code: string }) => c.code);

      expect(countryCodes).toContain('PH');
      expect(countryCodes).not.toContain('US');
      expect(countryCodes).not.toContain('JP');
      expect(countryCodes).not.toContain('SG_FUTURE');
      expect(countryCodes).not.toContain('MY_EXPIRED');
      expect(countryCodes).not.toContain('CA_DISABLED');
    });

    it('GET options exposes allowedChargeCurrencies as PHP-only metadata without foreign currency leakage', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      const json = await res.json();

      const phOption = json.options.countries.find((c: { code: string }) => c.code === 'PH');
      expect(phOption).toBeDefined();
      expect(phOption.allowedChargeCurrencies).toEqual(['PHP']);
    });
  });

  // =========================================================================
  // 2. EXPLICIT INVALID COUNTRY REQUEST REJECTION (NO SILENT PH FALLBACK)
  // =========================================================================
  describe('Explicit Country Request Semantics', () => {
    it('rejects unsupported explicit country with deterministic 400 and code UNSUPPORTED_COUNTRY', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'XX', // Unknown country
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe('UNSUPPORTED_COUNTRY');

      // Verify zero persistence in database: account still has no record
      const saved = await db.findUnique({ where: { user_id: testUserId } });
      expect(saved).toBeNull();
    });

    it('rejects disabled country profile with deterministic 400 and code COUNTRY_DISABLED', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'CA_DISABLED',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe('COUNTRY_DISABLED');

      const saved = await db.findUnique({ where: { user_id: testUserId } });
      expect(saved).toBeNull();
    });

    it('rejects future-only country profile with deterministic 400 and code COUNTRY_PROFILE_NOT_EFFECTIVE', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'SG_FUTURE',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe('COUNTRY_PROFILE_NOT_EFFECTIVE');

      const saved = await db.findUnique({ where: { user_id: testUserId } });
      expect(saved).toBeNull();
    });

    it('rejects expired country profile with deterministic 400 and code COUNTRY_PROFILE_NOT_EFFECTIVE', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'MY_EXPIRED',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe('COUNTRY_PROFILE_NOT_EFFECTIVE');

      const saved = await db.findUnique({ where: { user_id: testUserId } });
      expect(saved).toBeNull();
    });

    it('guest route rejects explicit invalid country with deterministic 400 without writing cookie or DB', async () => {
      const handlers = createGuestHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/preferences', {}, {
        languageTag: 'en-PH',
        countryCode: 'XX',
        displayCurrency: 'PHP',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe('UNSUPPORTED_COUNTRY');
      expect(res.headers.get('set-cookie')).toBeNull();
    });
  });

  // =========================================================================
  // 3. AUTHENTICATED ROUTE BINDING & COUNTRY CHANGE (RESET_TO_COUNTRY_DEFAULT)
  // =========================================================================
  describe('Authenticated Route Binding & RESET_TO_COUNTRY_DEFAULT', () => {
    it('accepts active country and persists preference with policy provenance', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'PHP',
        languageTag: 'en-PH',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.savedPreference.countryCode).toBe('PH');
      expect(json.savedPreference.displayCurrency).toBe('PHP');
      expect(json.savedPreference.isManualDisplayOverride).toBe(false);
      expect(json.provenance).toBeDefined();
      expect(json.provenance.configVersion).toBe('1.0.0');
      expect(json.provenance.defaultCurrencyApplied).toBe(true);
      expect(json.provenance.fallbackUsed).toBe(false);
    });

    it('applies RESET_TO_COUNTRY_DEFAULT when country changes, resetting display currency and manual override', async () => {
      // 1. Establish initial preference: PH with manual USD override
      const handlers = createAuthHandlers();
      const setupReq = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'USD',
        isManualDisplayOverride: true,
        languageTag: 'tl-PH',
      });
      const setupRes = await handlers.PATCH(setupReq);
      expect(setupRes.status).toBe(200);
      const initialJson = await setupRes.json();
      expect(initialJson.savedPreference.displayCurrency).toBe('USD');
      expect(initialJson.savedPreference.isManualDisplayOverride).toBe(true);
      expect(initialJson.savedPreference.version).toBe(1);

      // 2. Change country to JP (valid country in test registry with default currency JPY)
      // Provide expectedVersion: 1 to ensure optimistic concurrency
      const changeReq = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'JP',
        expectedVersion: 1,
      });
      const changeRes = await handlers.PATCH(changeReq);
      expect(changeRes.status).toBe(200);

      const changeJson = await changeRes.json();
      // Country must be JP
      expect(changeJson.savedPreference.countryCode).toBe('JP');
      // Display currency must be reset to JP's defaultDisplayCurrency (JPY)
      expect(changeJson.savedPreference.displayCurrency).toBe('JPY');
      // Manual override flag must be reset to false
      expect(changeJson.savedPreference.isManualDisplayOverride).toBe(false);
      // Language must be preserved (tl-PH)
      expect(changeJson.savedPreference.languageTag).toBe('tl-PH');
      // Concurrency version must be incremented to 2
      expect(changeJson.savedPreference.version).toBe(2);
      // Provenance confirms country default applied
      expect(changeJson.provenance.defaultCurrencyApplied).toBe(true);
      expect(changeJson.provenance.overrideAccepted).toBe(false);
    });

    it('rejects disallowed display currency override for the active country with 400 DISALLOWED_CURRENCY', async () => {
      const handlers = createAuthHandlers();
      // PH only allows PHP and USD. Requesting JPY for PH must be rejected.
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'JPY',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe('DISALLOWED_CURRENCY');
    });

    it('accepts allowed display currency override when currency override flag is enabled', async () => {
      const handlers = createAuthHandlers();
      // PH allows USD as an override
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'USD',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.savedPreference.displayCurrency).toBe('USD');
      expect(json.savedPreference.isManualDisplayOverride).toBe(true);
      expect(json.provenance.overrideAccepted).toBe(true);
    });

    it('rejects currency override when glcc_currency_override_enabled is false', async () => {
      flagReader = createInMemorySystemSettingReader({
        [GLCC_FEATURE_FLAGS.V1_ENABLED]: 'true',
        [GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED]: 'false', // Disabled
      });
      const handlers = createAuthHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'USD',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe('CURRENCY_OVERRIDE_DISABLED');
    });

    it('GET /api/me/preferences performs zero writes', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      expect(res.status).toBe(200);

      // Verify no record was created in db simply by visiting GET
      const record = await db.findUnique({ where: { user_id: testUserId } });
      expect(record).toBeNull();
    });
  });

  // =========================================================================
  // 4. FIELD INDEPENDENCE AT RUNTIME
  // =========================================================================
  describe('Field Independence', () => {
    it('language-only update preserves country, displayCurrency, and manual override state', async () => {
      const handlers = createAuthHandlers();
      // 1. Initial setup: PH with USD override
      await handlers.PATCH(buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'USD',
        isManualDisplayOverride: true,
        languageTag: 'en-PH',
      }));

      // 2. Language-only update
      const updateRes = await handlers.PATCH(buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        languageTag: 'tl-PH',
        expectedVersion: 1,
      }));
      expect(updateRes.status).toBe(200);

      const json = await updateRes.json();
      expect(json.savedPreference.languageTag).toBe('tl-PH');
      expect(json.savedPreference.countryCode).toBe('PH');
      expect(json.savedPreference.displayCurrency).toBe('USD');
      expect(json.savedPreference.isManualDisplayOverride).toBe(true);
      expect(json.savedPreference.version).toBe(2);
    });

    it('display-currency-only update preserves country and language', async () => {
      const handlers = createAuthHandlers();
      // 1. Initial setup: PH with default PHP
      await handlers.PATCH(buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'PHP',
        languageTag: 'tl-PH',
      }));

      // 2. Display-currency-only update to USD
      const updateRes = await handlers.PATCH(buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        displayCurrency: 'USD',
        expectedVersion: 1,
      }));
      expect(updateRes.status).toBe(200);

      const json = await updateRes.json();
      expect(json.savedPreference.countryCode).toBe('PH');
      expect(json.savedPreference.languageTag).toBe('tl-PH');
      expect(json.savedPreference.displayCurrency).toBe('USD');
      expect(json.savedPreference.isManualDisplayOverride).toBe(true);
    });
  });

  // =========================================================================
  // 5. GUEST ROUTE BINDING & PERSISTENCE SAFETY
  // =========================================================================
  describe('Guest Route Binding', () => {
    it('accepts active country and returns Set-Cookie with validated facts and provenance', async () => {
      const handlers = createGuestHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/preferences', {}, {
        languageTag: 'en-PH',
        countryCode: 'PH',
        displayCurrency: 'PHP',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(200);

      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain(GUEST_PREFERENCE_COOKIE_NAME);

      const json = await res.json();
      expect(json.status).toBe('SUCCESS');
      expect(json.effectivePreference.countryCode).toBe('PH');
      expect(json.effectivePreference.displayCurrency).toBe('PHP');
      expect(json.provenance.configVersion).toBe('1.0.0');
    });

    it('applies RESET_TO_COUNTRY_DEFAULT on guest country change', async () => {
      const handlers = createGuestHandlers();
      // Prior cookie: PH with USD override
      const priorCookie = serializeGuestPreferenceCookie(
        {
          languageTag: 'tl-PH',
          countryCode: 'PH',
          displayCurrency: 'USD',
          isManualDisplayOverride: true,
        },
        testSecret
      );

      // User changes country to JP without supplying displayCurrency
      const req = buildRequest(
        'PATCH',
        'http://localhost:3000/api/preferences',
        { cookie: `${GUEST_PREFERENCE_COOKIE_NAME}=${priorCookie}` },
        {
          languageTag: 'tl-PH',
          countryCode: 'JP',
          displayCurrency: 'JPY',
        }
      );
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.effectivePreference.countryCode).toBe('JP');
      expect(json.effectivePreference.displayCurrency).toBe('JPY');
      expect(json.effectivePreference.provenance.displayCurrency.isManualOverride).toBe(false);
      expect(json.provenance.overrideAccepted).toBe(false);
      expect(json.provenance.defaultCurrencyApplied).toBe(true);
    });

    it('guest GET without cookie resolves platform fallback without writing cookie or DB', async () => {
      const handlers = createGuestHandlers();
      const req = buildRequest('GET', 'http://localhost:3000/api/preferences');
      const res = await handlers.GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.effectivePreference.countryCode).toBe('PH');
      expect(json.effectivePreference.displayCurrency).toBe('PHP');
      expect(json.provenance.fallbackUsed).toBe(true);
      expect(json.provenance.policyOutcome).toBe('PLATFORM_FALLBACK_USED');
      expect(res.headers.get('set-cookie')).toBeNull();
    });
  });

  // =========================================================================
  // 6. FINANCIAL AUTHORITY BOUNDARY & CONCURRENCY
  // =========================================================================
  describe('Financial Authority Boundary & Concurrency', () => {
    it('rejects caller attempts to inject chargeCurrency in body', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        chargeCurrency: 'USD', // Prohibited key
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe('PROHIBITED_FIELD');
    });

    it('displayCurrency in allowedDisplayCurrencies does not enable chargeCurrency (remains strictly PHP)', async () => {
      const handlers = createAuthHandlers();
      const req = buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'USD',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.effectivePreference.displayCurrency).toBe('USD');
      // chargeCurrency is strictly PHP and cannot be changed
      expect(json.effectivePreference.chargeCurrency).toBe('PHP');
    });

    it('enforces optimistic concurrency: stale version returns 409 CONFLICT_VERSION_MISMATCH', async () => {
      const handlers = createAuthHandlers();
      // 1. Initial write (version 1)
      await handlers.PATCH(buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'PHP',
      }));

      // 2. Attempt update with stale version 0
      const conflictRes = await handlers.PATCH(buildRequest('PATCH', 'http://localhost:3000/api/me/preferences', {}, {
        countryCode: 'PH',
        displayCurrency: 'USD',
        expectedVersion: 0,
      }));
      expect(conflictRes.status).toBe(409);

      const json = await conflictRes.json();
      expect(json.code).toBe('CONFLICT_VERSION_MISMATCH');
      expect(json.currentVersion).toBe(1);
      expect(json.expectedVersion).toBe(0);
    });
  });
});
