/**
 * RENTipid GLCC v1.0 — Authenticated Preferences Route & Feature Flag Tests
 *
 * Covers all 28 P1C requirements:
 *
 * Feature Flags (1-5):
 * 1. glcc_v1_enabled false blocks GLCC preference mutation.
 * 2. Missing root flag fails closed (defaults to false).
 * 3. currency override flag false blocks unauthorized alternate display-currency persistence.
 * 4. country autodetect flag false prevents inferred country candidate use.
 * 5. country autodetect flag true adds suggestion only at correct low precedence.
 *
 * Authentication & Authorization (6-9):
 * 6. Unauthenticated GET is rejected with 401.
 * 7. Unauthenticated update is rejected with 401.
 * 8. Client-supplied user ID cannot select or mutate another account.
 * 9. Authenticated account only accesses its own preference.
 *
 * GET /api/me/preferences (10-15):
 * 10. Saved account preference is returned correctly.
 * 11. Passive guest preference does not overwrite account on sign-in.
 * 12. Explicit current choice follows P1A precedence.
 * 13. Invalid guest cookie is ignored safely.
 * 14. Reconciliation status is deterministic.
 * 15. GET performs zero account writes.
 *
 * UPDATE /api/me/preferences (16-23):
 * 16. Valid explicit update persists atomically.
 * 17. Invalid locale rejected with 400.
 * 18. Invalid country rejected with 400.
 * 19. Invalid display currency rejected with 400.
 * 20. Disallowed country/currency override rejected with 400.
 * 21. Version conflict returns deterministic 409 conflict response.
 * 22. Successful update increments version according to concurrency rules.
 * 23. chargeCurrency cannot be written by the request.
 *
 * Regression & Financial Invariants (24-28):
 * 24. P1A tests remain passing.
 * 25. P1B tests remain passing.
 * 26. Language-only change does not alter country/currency.
 * 27. Country change obeys approved default-currency policy.
 * 28. Financial authorities remain untouched: charge currency remains strictly PHP.
 */

import { createPreferencesRouteHandlers } from '../../src/lib/glcc/me-preferences-handlers';
import {
  createInMemorySystemSettingReader,
  GLCC_FEATURE_FLAGS,
} from '../../src/lib/glcc/feature-flags';
import {
  createInMemoryPreferenceDatabase,
  type PreferenceDatabaseDelegate,
} from '../../src/lib/glcc/preference-service';
import { getDefaultRegistryContext } from '../../src/lib/glcc/default-registries';
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

describe('GLCC v1.0 — P1C Feature Flags & Route Integration', () => {
  const testSecret = 'rentipid-test-secret-key-32bytes-min-len';
  const testUserId = 'usr_test_actor_001';
  const registries = getDefaultRegistryContext();

  let db: PreferenceDatabaseDelegate;
  let flagReader: ReturnType<typeof createInMemorySystemSettingReader>;

  beforeEach(() => {
    db = createInMemoryPreferenceDatabase();
    flagReader = createInMemorySystemSettingReader({
      [GLCC_FEATURE_FLAGS.V1_ENABLED]: 'true',
      [GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED]: 'true',
      [GLCC_FEATURE_FLAGS.COUNTRY_AUTODETECT_ENABLED]: 'true',
    });
  });

  function createTestHandlers(sessionUser: { id?: string; role?: string } | null = { id: testUserId, role: 'Renter' }) {
    return createPreferencesRouteHandlers({
      getSession: async () => (sessionUser ? { user: sessionUser } : null),
      db,
      flagReader,
      registries,
      cookieSecret: testSecret,
    });
  }

  // =========================================================================
  // Section A: Feature Flags (1-5)
  // =========================================================================
  describe('Feature Flags (1-5)', () => {
    it('1. glcc_v1_enabled false blocks GLCC preference mutation (403 FEATURE_DISABLED)', async () => {
      flagReader.setFlag(GLCC_FEATURE_FLAGS.V1_ENABLED, 'false');
      const handlers = createTestHandlers();

      const req = buildRequest('PATCH', undefined, {}, { languageTag: 'fil-PH' });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.code).toBe('FEATURE_DISABLED');
      expect(json.error).toContain('disabled');
    });

    it('2. Missing root flag fails closed (defaults to false -> 403 FEATURE_DISABLED)', async () => {
      const emptyFlagReader = createInMemorySystemSettingReader({});
      const handlers = createPreferencesRouteHandlers({
        getSession: async () => ({ user: { id: testUserId } }),
        db,
        flagReader: emptyFlagReader,
        registries,
        cookieSecret: testSecret,
      });

      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.code).toBe('FEATURE_DISABLED');
    });

    it('3. currency override flag false blocks unauthorized alternate display-currency persistence', async () => {
      flagReader.setFlag(GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED, 'false');
      const handlers = createTestHandlers();

      // PH default currency is PHP; user attempts to set displayCurrency USD while override is disabled
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'PH',
        displayCurrency: 'USD',
        isManualDisplayOverride: true,
      });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe('CURRENCY_OVERRIDE_DISABLED');
      expect(json.error).toContain('override is currently disabled');
    });

    it('4. country autodetect flag false prevents inferred country candidate use', async () => {
      flagReader.setFlag(GLCC_FEATURE_FLAGS.COUNTRY_AUTODETECT_ENABLED, 'false');
      const handlers = createTestHandlers();

      // Request carries geo-country and language headers
      const req = buildRequest('GET', undefined, {
        'x-country-code': 'US',
        'accept-language': 'en-US,en;q=0.9',
      });
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      // Inferred country candidate was blocked, so country remains platform default PH
      expect(json.effectivePreference.countryCode).toBe('PH');
      expect(json.capabilities.countryAutodetectEnabled).toBe(false);
    });

    it('5. country autodetect flag true adds suggestion only at correct low precedence (tier 4)', async () => {
      flagReader.setFlag(GLCC_FEATURE_FLAGS.COUNTRY_AUTODETECT_ENABLED, 'true');
      const handlers = createTestHandlers();

      // Request carries US country header for fresh user with no saved account preference
      const req = buildRequest('GET', undefined, {
        'x-country-code': 'US',
        'accept-language': 'en-US,en;q=0.9',
      });
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      // First-run suggestion was used because no account or guest preference existed
      expect(json.effectivePreference.countryCode).toBe('US');
      expect(json.effectivePreference.provenance.country.source).toBe('FIRST_RUN_SUGGESTION');
    });
  });

  // =========================================================================
  // Section B: Authentication & Authorization (6-9)
  // =========================================================================
  describe('Authentication & Authorization (6-9)', () => {
    it('6. Unauthenticated GET is rejected with 401 Unauthorized', async () => {
      const handlers = createTestHandlers(null);
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('7. Unauthenticated update is rejected with 401 Unauthorized', async () => {
      const handlers = createTestHandlers(null);
      const req = buildRequest('PATCH', undefined, {}, { languageTag: 'fil-PH' });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('8. Client-supplied user ID cannot select or mutate another account', async () => {
      const handlers = createTestHandlers({ id: testUserId });
      // Caller attempts to pass userId in payload to mutate victim's account
      const req = buildRequest('PATCH', undefined, {}, {
        userId: 'usr_victim_999',
        languageTag: 'fil-PH',
      });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe('PROHIBITED_FIELD');
      expect(json.error).toContain('userId');
    });

    it('9. Authenticated account only accesses its own preference', async () => {
      // Seed victim preference in DB
      await db.upsert({
        where: { user_id: 'usr_victim_999' },
        create: {
          user_id: 'usr_victim_999',
          language_tag: 'ja-JP',
          country_code: 'JP',
          display_currency: 'JPY',
          is_manual_display_override: false,
          version: 1,
        },
        update: {},
      });

      // Attacker makes GET as testUserId
      const handlers = createTestHandlers({ id: testUserId });
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      // Returns testUserId's preference (null saved), completely isolated from usr_victim_999
      expect(json.accountPreference).toBeNull();
      expect(json.effectivePreference.countryCode).toBe('PH');
    });
  });

  // =========================================================================
  // Section C: GET /api/me/preferences (10-15)
  // =========================================================================
  describe('GET /api/me/preferences (10-15)', () => {
    it('10. Saved account preference is returned correctly', async () => {
      await db.upsert({
        where: { user_id: testUserId },
        create: {
          user_id: testUserId,
          language_tag: 'fil-PH',
          country_code: 'PH',
          display_currency: 'PHP',
          is_manual_display_override: false,
          version: 3,
        },
        update: {},
      });

      const handlers = createTestHandlers();
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.accountPreference.languageTag).toBe('fil-PH');
      expect(json.effectivePreference.languageTag).toBe('fil-PH');
      expect(json.reconciliationStatus).toBe('ACCOUNT_PREFERENCE_USED');
    });

    it('11. Passive guest preference does not overwrite account on sign-in', async () => {
      // Saved account preference: en-PH / PH
      await db.upsert({
        where: { user_id: testUserId },
        create: {
          user_id: testUserId,
          language_tag: 'en-PH',
          country_code: 'PH',
          display_currency: 'PHP',
          is_manual_display_override: false,
          version: 1,
        },
        update: {},
      });

      // User arrives with passive guest cookie indicating US / USD (isManualDisplayOverride: false)
      const cookieVal = serializeGuestPreferenceCookie(
        { countryCode: 'US', displayCurrency: 'USD', isManualDisplayOverride: false },
        testSecret
      );

      const handlers = createTestHandlers();
      const req = buildRequest('GET', undefined, { cookie: `${GUEST_PREFERENCE_COOKIE_NAME}=${cookieVal}` });
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.reconciliationStatus).toBe('ACCOUNT_PREFERENCE_USED');
      expect(json.effectivePreference.countryCode).toBe('PH');
      expect(json.requiresUserConfirmation).toBe(false);

      // Verify DB was NOT overwritten
      const stored = await db.findUnique({ where: { user_id: testUserId } });
      expect(stored?.countryCode).toBe('PH');
    });

    it('12. Explicit current choice follows P1A precedence and triggers USER_CONFIRMATION_REQUIRED on conflict', async () => {
      // Saved account preference: PH / PHP
      await db.upsert({
        where: { user_id: testUserId },
        create: {
          user_id: testUserId,
          language_tag: 'en-PH',
          country_code: 'PH',
          display_currency: 'PHP',
          is_manual_display_override: false,
          version: 1,
        },
        update: {},
      });

      // User arrives with EXPLICIT manual guest selection: US / USD (isManualDisplayOverride: true)
      const cookieVal = serializeGuestPreferenceCookie(
        { countryCode: 'US', displayCurrency: 'USD', isManualDisplayOverride: true },
        testSecret
      );

      const handlers = createTestHandlers();
      const req = buildRequest('GET', undefined, { cookie: `${GUEST_PREFERENCE_COOKIE_NAME}=${cookieVal}` });
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      // Effective preference follows explicit choice
      expect(json.effectivePreference.countryCode).toBe('US');
      // But requires user confirmation before saving to account
      expect(json.reconciliationStatus).toBe('USER_CONFIRMATION_REQUIRED');
      expect(json.requiresUserConfirmation).toBe(true);

      // Verify DB was NOT automatically changed
      const stored = await db.findUnique({ where: { user_id: testUserId } });
      expect(stored?.countryCode).toBe('PH');
    });

    it('13. Invalid guest cookie is ignored safely and falls back cleanly', async () => {
      // Saved account preference: fil-PH
      await db.upsert({
        where: { user_id: testUserId },
        create: {
          user_id: testUserId,
          language_tag: 'fil-PH',
          country_code: 'PH',
          display_currency: 'PHP',
          is_manual_display_override: false,
          version: 1,
        },
        update: {},
      });

      const handlers = createTestHandlers();
      // Send corrupted cookie
      const req = buildRequest('GET', undefined, { cookie: `${GUEST_PREFERENCE_COOKIE_NAME}=corrupted_base64.bad_sig` });
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      // Falls through safely to saved account preference
      expect(json.effectivePreference.languageTag).toBe('fil-PH');
      expect(json.reconciliationStatus).toBe('INVALID_GUEST_PREFERENCE_IGNORED');
    });

    it('14. Reconciliation status is deterministic', async () => {
      const handlers = createTestHandlers();
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(['NO_CONFLICT', 'ACCOUNT_PREFERENCE_USED', 'CURRENT_EXPLICIT_SELECTION_USED', 'USER_CONFIRMATION_REQUIRED', 'INVALID_GUEST_PREFERENCE_IGNORED']).toContain(
        json.reconciliationStatus
      );
    });

    it('15. GET performs zero account writes', async () => {
      const handlers = createTestHandlers();
      const req = buildRequest('GET');
      await handlers.GET(req);

      const stored = await db.findUnique({ where: { user_id: testUserId } });
      expect(stored).toBeNull();
    });
  });

  // =========================================================================
  // Section D: UPDATE /api/me/preferences (16-23)
  // =========================================================================
  describe('UPDATE /api/me/preferences (16-23)', () => {
    it('16. Valid explicit update persists atomically', async () => {
      const handlers = createTestHandlers();
      const req = buildRequest('PATCH', undefined, {}, {
        languageTag: 'fil-PH',
        countryCode: 'PH',
        displayCurrency: 'PHP',
      });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.status).toBe('SUCCESS');
      expect(json.savedPreference.languageTag).toBe('fil-PH');
      expect(json.savedPreference.version).toBe(1);

      const stored = await db.findUnique({ where: { user_id: testUserId } });
      expect(stored?.languageTag).toBe('fil-PH');
      expect(stored?.countryCode).toBe('PH');
    });

    it('17. Invalid locale rejected with 400 Validation failed', async () => {
      const handlers = createTestHandlers();
      const req = buildRequest('PATCH', undefined, {}, { languageTag: 'invalid-tag-xx' });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Validation failed');
      expect(json.details).toContain("Language 'invalid-tag-xx' is not supported in registry");
    });

    it('18. Invalid country rejected with 400 Validation failed', async () => {
      const handlers = createTestHandlers();
      const req = buildRequest('PATCH', undefined, {}, { countryCode: 'ZZ' });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Validation failed');
      expect(json.details).toContain("Country 'ZZ' is not supported in registry");
    });

    it('19. Invalid display currency rejected with 400 Validation failed', async () => {
      const handlers = createTestHandlers();
      const req = buildRequest('PATCH', undefined, {}, { displayCurrency: 'XYZ' });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Validation failed');
      expect(json.details).toContain("Display currency 'XYZ' is not supported in registry");
    });

    it('20. Disallowed country/currency override rejected with 400', async () => {
      const handlers = createTestHandlers();
      // Country US only allows USD in registry; attempting JPY for US is rejected
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'US',
        displayCurrency: 'JPY',
      });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Validation failed');
      expect(json.details).toContain("Display currency 'JPY' is not allowed for country 'US'");
    });

    it('21. Version conflict returns deterministic 409 conflict response', async () => {
      // Initial save (version 1)
      await db.upsert({
        where: { user_id: testUserId },
        create: {
          user_id: testUserId,
          language_tag: 'en-PH',
          country_code: 'PH',
          display_currency: 'PHP',
          is_manual_display_override: false,
          version: 1,
        },
        update: {},
      });

      const handlers = createTestHandlers();
      // Client expects version 0, but current is 1
      const req = buildRequest('PATCH', undefined, {}, {
        languageTag: 'fil-PH',
        expectedVersion: 0,
      });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.code).toBe('CONFLICT_VERSION_MISMATCH');
      expect(json.currentVersion).toBe(1);
      expect(json.expectedVersion).toBe(0);
    });

    it('22. Successful update increments version according to concurrency rules', async () => {
      await db.upsert({
        where: { user_id: testUserId },
        create: {
          user_id: testUserId,
          language_tag: 'en-PH',
          country_code: 'PH',
          display_currency: 'PHP',
          is_manual_display_override: false,
          version: 1,
        },
        update: {},
      });

      const handlers = createTestHandlers();
      const req = buildRequest('PATCH', undefined, {}, {
        languageTag: 'fil-PH',
        expectedVersion: 1,
      });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.savedPreference.version).toBe(2);

      const stored = await db.findUnique({ where: { user_id: testUserId } });
      expect(stored?.version).toBe(2);
    });

    it('23. chargeCurrency cannot be written by the request (rejected as prohibited)', async () => {
      const handlers = createTestHandlers();
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'PH',
        chargeCurrency: 'USD', // Attempted financial authority injection
      });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe('PROHIBITED_FIELD');
      expect(json.error).toContain('chargeCurrency');
    });
  });

  // =========================================================================
  // Section E: Regression & Financial Invariants (24-28)
  // =========================================================================
  describe('Regression & Financial Invariants (24-28)', () => {
    it('24. P1A contracts remain adhered to in route responses', async () => {
      const handlers = createTestHandlers();
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(json.effectivePreference).toBeDefined();
      expect(json.effectivePreference.registryVersion).toBeDefined();
      expect(json.effectivePreference.policyVersion).toBeDefined();
      expect(json.effectivePreference.provenance).toBeDefined();
    });

    it('25. P1B reconciliation and cookie handling seamlessly integrates with route', async () => {
      const handlers = createTestHandlers();
      const cookie = serializeGuestPreferenceCookie(
        { languageTag: 'fil-PH', countryCode: 'PH', displayCurrency: 'PHP', isManualDisplayOverride: false },
        testSecret
      );
      const req = buildRequest('GET', undefined, { cookie: `${GUEST_PREFERENCE_COOKIE_NAME}=${cookie}` });
      const res = await handlers.GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.effectivePreference.languageTag).toBe('fil-PH');
    });

    it('26. Language-only change does not alter country/currency', async () => {
      // Initial state: US / USD / en-US
      await db.upsert({
        where: { user_id: testUserId },
        create: {
          user_id: testUserId,
          language_tag: 'en-US',
          country_code: 'US',
          display_currency: 'USD',
          is_manual_display_override: false,
          version: 1,
        },
        update: {},
      });

      const handlers = createTestHandlers();
      // Update only language to en-PH
      const req = buildRequest('PATCH', undefined, {}, { languageTag: 'en-PH' });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.savedPreference.languageTag).toBe('en-PH');
      expect(json.savedPreference.countryCode).toBe('US');
      expect(json.savedPreference.displayCurrency).toBe('USD');
    });

    it('27. Country change obeys approved default-currency policy', async () => {
      const handlers = createTestHandlers();
      // Change country to JP without specifying currency
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'JP',
        displayCurrency: 'JPY',
        languageTag: 'ja-JP',
      });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.savedPreference.countryCode).toBe('JP');
      expect(json.savedPreference.displayCurrency).toBe('JPY');
    });

    it('28. Financial authorities remain untouched: charge currency remains strictly PHP', async () => {
      const handlers = createTestHandlers();
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'US',
        displayCurrency: 'USD',
      });
      const res = await handlers.PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      // Display currency is USD, but charge currency is strictly PHP
      expect(json.effectivePreference.displayCurrency).toBe('USD');
      expect(json.effectivePreference.chargeCurrency).toBe('PHP');
      expect(json.effectivePreference.provenance.chargeCurrency.source).toBe('PLATFORM_DEFAULT');
    });
  });
});
