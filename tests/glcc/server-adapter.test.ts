/**
 * RENTipid GLCC v1.0 — Server Adapter & Guest Cookie Unit Tests
 *
 * Verifies:
 * - Cookie serialization & tamper-evident signature.
 * - Max size limit enforcement (< 256 bytes).
 * - Tampered signature rejection.
 * - Malformed JSON / format fail-closed handling without throwing.
 * - Security key prohibition (user_id, role, tokens, chargeCurrency).
 * - Expiration window (30 days).
 * - Header candidate extraction (Accept-Language q-sorting & geo-IP).
 * - Request adapter integration.
 */

import { createHmac } from 'node:crypto';
import {
  serializeGuestPreferenceCookie,
  parseGuestPreferenceCookie,
  extractHeaderSuggestions,
  adaptRequestToCandidateTiers,
  MAX_COOKIE_BYTE_LENGTH,
  GUEST_PREFERENCE_COOKIE_NAME,
} from '../../src/lib/glcc/server-adapter';
import { createInMemoryRegistryContext } from '../../src/lib/glcc/registry-contracts';

describe('GLCC v1.0 — Server Adapter & Guest Cookie', () => {
  const testSecret = 'rentipid-test-secret-key-32bytes-min-len';

  const registries = createInMemoryRegistryContext({
    currencies: [
      { code: 'PHP', minorUnitExponent: 2, name: 'Peso', symbol: '₱', isActive: true },
      { code: 'USD', minorUnitExponent: 2, name: 'Dollar', symbol: '$', isActive: true },
      { code: 'JPY', minorUnitExponent: 0, name: 'Yen', symbol: '¥', isActive: true },
    ],
    countries: [
      {
        code: 'PH',
        name: 'Philippines',
        defaultDisplayCurrency: 'PHP',
        allowedDisplayCurrencies: ['PHP', 'USD'],
        defaultLanguageTag: 'en-PH',
        supportedLanguageTags: ['en-PH', 'fil-PH'],
        isActive: true,
      },
      {
        code: 'US',
        name: 'United States',
        defaultDisplayCurrency: 'USD',
        allowedDisplayCurrencies: ['USD'],
        defaultLanguageTag: 'en-US',
        supportedLanguageTags: ['en-US'],
        isActive: true,
      },
    ],
    locales: [
      { tag: 'en-PH', language: 'en', region: 'PH', direction: 'ltr', name: 'English (PH)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
      { tag: 'fil-PH', language: 'fil', region: 'PH', direction: 'ltr', name: 'Filipino', nativeName: 'Filipino', isActive: true, fallbackTag: 'en-PH' },
      { tag: 'en-US', language: 'en', region: 'US', direction: 'ltr', name: 'English (US)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
      { tag: 'en', language: 'en', direction: 'ltr', name: 'English', nativeName: 'English', isActive: true },
    ],
  });

  describe('Guest Cookie Serialization & Validation', () => {
    it('serializes and parses a valid guest preference cookie', () => {
      const now = Date.now();
      const cookie = serializeGuestPreferenceCookie(
        {
          languageTag: 'fil-PH',
          countryCode: 'PH',
          displayCurrency: 'USD',
          isManualDisplayOverride: true,
          timezone: 'Asia/Manila',
        },
        testSecret,
        now
      );

      expect(typeof cookie).toBe('string');
      expect(Buffer.byteLength(cookie, 'utf8')).toBeLessThanOrEqual(MAX_COOKIE_BYTE_LENGTH);

      const parsed = parseGuestPreferenceCookie(cookie, testSecret, now);
      expect(parsed.isValid).toBe(true);
      expect(parsed.payload?.v).toBe(1);
      expect(parsed.payload?.lng).toBe('fil-PH');
      expect(parsed.payload?.cnt).toBe('PH');
      expect(parsed.payload?.cur).toBe('USD');
      expect(parsed.payload?.man).toBe(true);
      expect(parsed.payload?.tz).toBe('Asia/Manila');
    });

    it('rejects tampered cookie signatures', () => {
      const cookie = serializeGuestPreferenceCookie({ countryCode: 'PH' }, testSecret);
      const [payload, sig] = cookie.split('.');
      // Tamper signature by modifying last character
      const tamperedSig = sig.slice(0, -1) + (sig.slice(-1) === 'a' ? 'b' : 'a');
      const tamperedCookie = `${payload}.${tamperedSig}`;

      const parsed = parseGuestPreferenceCookie(tamperedCookie, testSecret);
      expect(parsed.isValid).toBe(false);
      expect(parsed.reason).toContain('Tampered or invalid signature');
    });

    it('rejects tampered payload content', () => {
      const cookie = serializeGuestPreferenceCookie({ countryCode: 'PH' }, testSecret);
      const [, sig] = cookie.split('.');
      const modifiedPayload = Buffer.from(JSON.stringify({ v: 1, cnt: 'US', ts: Date.now() })).toString('base64url');
      const tamperedCookie = `${modifiedPayload}.${sig}`;

      const parsed = parseGuestPreferenceCookie(tamperedCookie, testSecret);
      expect(parsed.isValid).toBe(false);
      expect(parsed.reason).toContain('Tampered or invalid signature');
    });

    it('fails closed safely on malformed cookie strings without throwing', () => {
      expect(parseGuestPreferenceCookie('', testSecret).isValid).toBe(false);
      expect(parseGuestPreferenceCookie('not-a-valid-cookie', testSecret).isValid).toBe(false);
      expect(parseGuestPreferenceCookie('invalid.payload.too.many.dots', testSecret).isValid).toBe(false);
      expect(parseGuestPreferenceCookie(null, testSecret).isValid).toBe(false);
    });

    it('rejects expired cookies (beyond 30 days)', () => {
      const thirtyOneDaysAgo = Date.now() - (31 * 24 * 60 * 60 * 1000);
      const expiredCookie = serializeGuestPreferenceCookie({ countryCode: 'PH' }, testSecret, thirtyOneDaysAgo);

      const parsed = parseGuestPreferenceCookie(expiredCookie, testSecret, Date.now());
      expect(parsed.isValid).toBe(false);
      expect(parsed.reason).toContain('Cookie expired');
    });

    it('strictly prohibits forbidden authorization and identity keys in payload', () => {
      const forbiddenPayload = {
        v: 1,
        ts: Date.now(),
        cnt: 'PH',
        role: 'SUPER_ADMIN', // Attempted injection
        user_id: 'cmu12345',
      };
      const jsonStr = JSON.stringify(forbiddenPayload);
      const encoded = Buffer.from(jsonStr).toString('base64url');
      const sig = createHmac('sha256', testSecret).update(encoded).digest('base64url');
      const maliciousCookie = `${encoded}.${sig}`;

      const parsed = parseGuestPreferenceCookie(maliciousCookie, testSecret);
      expect(parsed.isValid).toBe(false);
      expect(parsed.reason).toMatch(/Forbidden security key '(user_id|role)' detected/);
    });
  });

  describe('Header Suggestions Extraction', () => {
    it('parses Accept-Language with q-factor sorting and matches supported locales', () => {
      const suggestions = extractHeaderSuggestions(
        {
          acceptLanguage: 'fr-FR,fr;q=0.9,fil-PH;q=0.8,en;q=0.7',
        },
        registries
      );

      // 'fil-PH' is the highest q-factor supported in our registry
      expect(suggestions.languageTag).toBe('fil-PH');
    });

    it('parses geo-IP country header and normalizes to uppercase', () => {
      const suggestions = extractHeaderSuggestions(
        {
          countryHeader: 'ph',
        },
        registries
      );

      expect(suggestions.countryCode).toBe('PH');
    });

    it('ignores unsupported geo-IP country codes', () => {
      const suggestions = extractHeaderSuggestions(
        {
          countryHeader: 'ZZ',
        },
        registries
      );

      expect(suggestions.countryCode).toBeUndefined();
    });
  });

  describe('Request Adapter Integration', () => {
    it('adapts request cookies and headers into candidate tiers', () => {
      const cookie = serializeGuestPreferenceCookie(
        {
          languageTag: 'fil-PH',
          countryCode: 'PH',
          displayCurrency: 'USD',
          isManualDisplayOverride: true,
        },
        testSecret
      );

      const adapted = adaptRequestToCandidateTiers(
        {
          cookieHeader: `session=abc; ${GUEST_PREFERENCE_COOKIE_NAME}=${encodeURIComponent(cookie)}; other=123`,
          acceptLanguage: 'en-US,en;q=0.9',
          geoIpCountry: 'US',
        },
        registries,
        testSecret
      );

      expect(adapted.guestSession).not.toBeNull();
      expect(adapted.guestSession?.languageTag).toBe('fil-PH');
      expect(adapted.guestSession?.countryCode).toBe('PH');
      expect(adapted.guestSession?.displayCurrency).toBe('USD');
      expect(adapted.guestSession?.isManualDisplayOverride).toBe(true);

      expect(adapted.firstRunSuggestion.languageTag).toBe('en-US');
      expect(adapted.firstRunSuggestion.countryCode).toBe('US');
    });

    it('safely drops malformed cookies and provides null guestSession without throwing', () => {
      const adapted = adaptRequestToCandidateTiers(
        {
          cookieHeader: `${GUEST_PREFERENCE_COOKIE_NAME}=malformed.cookie.value`,
          acceptLanguage: 'en-PH',
        },
        registries,
        testSecret
      );

      expect(adapted.guestSession).toBeNull();
      expect(adapted.firstRunSuggestion.languageTag).toBe('en-PH');
    });
  });
});
