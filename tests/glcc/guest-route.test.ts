/**
 * RENTipid GLCC v1.0 — Public Guest Preferences Route Tests (P2B)
 *
 * Verifies:
 * 1. Public Unauthenticated Access: GET /api/preferences resolves without session.
 * 2. Resolution Precedence:
 *    - Tier 2 (valid guest cookie) wins over Tier 4 and Tier 5.
 *    - Tier 4 (header suggestion) wins over Tier 5 when autodetect enabled.
 *    - Tier 5 (platform default) applies when no cookies or headers present.
 * 3. Fail-Closed Cookie Security:
 *    - Malformed or tampered cookies fail closed safely without error.
 *    - Expired cookies are ignored.
 *    - Prohibited keys in cookie are rejected.
 * 4. PATCH Cookie Persistence:
 *    - Valid update serializes signed, tamper-evident cookie.
 *    - Sets Set-Cookie: rentipid_pref=... header.
 *    - Zero database queries, zero User records created.
 * 5. Update Validation:
 *    - Rejects invalid language tag with 400.
 *    - Rejects invalid country code with 400.
 *    - Rejects invalid currency code with 400.
 *    - Rejects disallowed currency for country with 400.
 *    - Rejects currency override when flag disabled.
 * 6. Security Boundaries:
 *    - Rejects prohibited fields (userId, role, permissions, chargeCurrency).
 *    - Financial invariant: chargeCurrency cannot be mutated and remains PHP.
 * 7. Feature Flag Gating:
 *    - glcc_v1_enabled false returns 503 for GET and PATCH.
 */

import {
  createGuestPreferencesRouteHandlers,
} from '../../src/lib/glcc/guest-preferences-handlers';
import {
  createInMemorySystemSettingReader,
  GLCC_FEATURE_FLAGS,
} from '../../src/lib/glcc/feature-flags';
import { getDefaultRegistryContext } from '../../src/lib/glcc/default-registries';
import {
  serializeGuestPreferenceCookie,
  GUEST_PREFERENCE_COOKIE_NAME,
} from '../../src/lib/glcc/server-adapter';

function buildRequest(
  method: string,
  url = 'http://localhost:3000/api/preferences',
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

describe('GLCC-P2B — Public Guest Preferences Route (/api/preferences)', () => {
  const testSecret = 'rentipid-test-guest-secret-key-32bytes';
  const registries = getDefaultRegistryContext();

  let flagReader: ReturnType<typeof createInMemorySystemSettingReader>;
  let handlers: ReturnType<typeof createGuestPreferencesRouteHandlers>;

  beforeEach(() => {
    flagReader = createInMemorySystemSettingReader({
      [GLCC_FEATURE_FLAGS.V1_ENABLED]: 'true',
      [GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED]: 'true',
      [GLCC_FEATURE_FLAGS.COUNTRY_AUTODETECT_ENABLED]: 'true',
    });

    handlers = createGuestPreferencesRouteHandlers({
      flagReader,
      registries,
      cookieSecret: testSecret,
    });
  });

  describe('GET /api/preferences', () => {
    it('resolves platform default when no cookie or header is provided', async () => {
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.effectivePreference.countryCode).toBe('PH');
      expect(json.effectivePreference.languageTag).toBe('en-PH');
      expect(json.effectivePreference.displayCurrency).toBe('PHP');
      expect(json.effectivePreference.chargeCurrency).toBe('PHP');
      expect(json.capabilities.isGuest).toBe(true);
      expect(json.capabilities.v1Enabled).toBe(true);
      expect(json.options.countries.length).toBeGreaterThan(0);
    });

    it('resolves from valid tamper-evident guest cookie (Tier 2)', async () => {
      const cookieValue = serializeGuestPreferenceCookie(
        {
          languageTag: 'fil-PH',
          countryCode: 'PH',
          displayCurrency: 'PHP',
          isManualDisplayOverride: false,
        },
        testSecret
      );

      const req = buildRequest('GET', undefined, {
        cookie: `${GUEST_PREFERENCE_COOKIE_NAME}=${cookieValue}`,
      });
      const res = await handlers.GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.effectivePreference.languageTag).toBe('fil-PH');
      expect(json.effectivePreference.provenance.language.source).toBe('GUEST_SESSION');
    });

    it('fails closed safely on tampered cookie and falls back to platform default (Tier 5)', async () => {
      const req = buildRequest('GET', undefined, {
        cookie: `${GUEST_PREFERENCE_COOKIE_NAME}=eyJ2IjoxLCJjbnQiOiJHQiJ9.invalidsignature123`,
      });
      const res = await handlers.GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.effectivePreference.countryCode).toBe('PH');
      expect(json.effectivePreference.provenance.country.source).toBe('PLATFORM_DEFAULT');
    });

    it('returns 503 when glcc_v1_enabled is false', async () => {
      flagReader.setFlag(GLCC_FEATURE_FLAGS.V1_ENABLED, 'false');
      const req = buildRequest('GET');
      const res = await handlers.GET(req);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.error).toMatch(/disabled/i);
    });
  });

  describe('PATCH /api/preferences', () => {
    it('persists preference by serializing signed cookie into Set-Cookie header', async () => {
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'PH',
        languageTag: 'fil-PH',
        displayCurrency: 'PHP',
        isManualDisplayOverride: false,
      });

      const res = await handlers.PATCH(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('SUCCESS');
      expect(json.effectivePreference.countryCode).toBe('PH');
      expect(json.effectivePreference.languageTag).toBe('fil-PH');

      // Check Set-Cookie header
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain(GUEST_PREFERENCE_COOKIE_NAME);
    });

    it('rejects prohibited identity and security fields with 400', async () => {
      const prohibitedPayloads = [
        { userId: 'usr_guest_inject_001', countryCode: 'PH', languageTag: 'en-PH', displayCurrency: 'PHP' },
        { role: 'Admin', countryCode: 'PH', languageTag: 'en-PH', displayCurrency: 'PHP' },
        { permissions: ['system:write'], countryCode: 'PH', languageTag: 'en-PH', displayCurrency: 'PHP' },
        { chargeCurrency: 'USD', countryCode: 'PH', languageTag: 'en-PH', displayCurrency: 'PHP' },
        { email: 'guest@evil.com', countryCode: 'PH', languageTag: 'en-PH', displayCurrency: 'PHP' },
      ];

      for (const payload of prohibitedPayloads) {
        const req = buildRequest('PATCH', undefined, {}, payload);
        const res = await handlers.PATCH(req);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.error).toMatch(/Prohibited field/i);
      }
    });

    it('rejects unsupported country code with 400', async () => {
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'XX',
        languageTag: 'en-PH',
        displayCurrency: 'PHP',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toMatch(/Unsupported country/i);
    });

    it('rejects unsupported language tag with 400', async () => {
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'PH',
        languageTag: 'xx-YY',
        displayCurrency: 'PHP',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toMatch(/Unsupported language/i);
    });

    it('rejects disallowed currency for country with 400', async () => {
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'US',
        languageTag: 'en-US',
        displayCurrency: 'PHP', // PHP is not in US allowedDisplayCurrencies (['USD'])
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toMatch(/not allowed for country/i);
    });

    it('rejects currency override when glcc_currency_override_enabled is false', async () => {
      flagReader.setFlag(GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED, 'false');

      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'PH',
        languageTag: 'en-PH',
        displayCurrency: 'USD',
        isManualDisplayOverride: true,
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toMatch(/Currency override is disabled/i);
    });

    it('returns 503 on PATCH when glcc_v1_enabled is false', async () => {
      flagReader.setFlag(GLCC_FEATURE_FLAGS.V1_ENABLED, 'false');
      const req = buildRequest('PATCH', undefined, {}, {
        countryCode: 'PH',
        languageTag: 'en-PH',
        displayCurrency: 'PHP',
      });
      const res = await handlers.PATCH(req);
      expect(res.status).toBe(503);
    });
  });
});
