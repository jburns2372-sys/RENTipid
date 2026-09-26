/**
 * RENTipid GLCC v1.0 — Server-side Request & Cookie Adapter
 *
 * Implements:
 * 1. Bounded, tamper-evident guest preference cookie (rentipid_pref, < 256 bytes).
 * 2. Untrusted candidate extraction for request headers (Accept-Language, geo-IP country).
 * 3. Fail-closed handling for malformed or tampered inputs: ignores bad candidates
 *    without throwing errors or preventing valid account preferences from winning.
 * 4. Zero authorization or payment rights derived from cookies or headers.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PreferenceInputTier } from './contracts';
import type { RegistryContext } from './registry-contracts';

export const GUEST_PREFERENCE_COOKIE_NAME = 'rentipid_pref';
export const MAX_COOKIE_BYTE_LENGTH = 256;
export const COOKIE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface GuestPreferenceCookiePayload {
  readonly v: 1;
  readonly lng?: string;
  readonly cnt?: string;
  readonly cur?: string;
  readonly man?: boolean;
  readonly tz?: string;
  readonly ts: number;
}

export interface ParsedGuestCookieResult {
  readonly isValid: boolean;
  readonly payload?: GuestPreferenceCookiePayload;
  readonly reason?: string;
}

function getSigningSecret(customSecret?: string): string {
  if (customSecret && customSecret.length > 0) return customSecret;
  const envSecret =
    process.env.SECURITY_TELEMETRY_HMAC_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'rentipid-glcc-dev-secret-do-not-use-in-production';
  return envSecret;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Serializes and signs a bounded guest preference cookie payload.
 */
export function serializeGuestPreferenceCookie(
  data: {
    languageTag?: string | null;
    countryCode?: string | null;
    displayCurrency?: string | null;
    isManualDisplayOverride?: boolean;
    timezone?: string | null;
  },
  customSecret?: string,
  timestampMs = Date.now()
): string {
  const payload: GuestPreferenceCookiePayload = {
    v: 1,
    ts: timestampMs,
    ...(data.languageTag ? { lng: data.languageTag.trim().slice(0, 16) } : {}),
    ...(data.countryCode ? { cnt: data.countryCode.trim().toUpperCase().slice(0, 4) } : {}),
    ...(data.displayCurrency ? { cur: data.displayCurrency.trim().toUpperCase().slice(0, 4) } : {}),
    ...(typeof data.isManualDisplayOverride === 'boolean' ? { man: data.isManualDisplayOverride } : {}),
    ...(data.timezone ? { tz: data.timezone.trim().slice(0, 48) } : {}),
  };

  const json = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(json);

  const secret = getSigningSecret(customSecret);
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  const fullCookie = `${encodedPayload}.${signature}`;
  if (Buffer.byteLength(fullCookie, 'utf8') > MAX_COOKIE_BYTE_LENGTH) {
    throw new Error(`Serialized guest cookie exceeds maximum byte limit of ${MAX_COOKIE_BYTE_LENGTH} bytes`);
  }

  return fullCookie;
}

/**
 * Parses, validates, and verifies the tamper-evident signature of a guest preference cookie string.
 * Never throws on malformed or tampered input; returns { isValid: false, reason } to fail closed safely.
 */
export function parseGuestPreferenceCookie(
  rawCookieString?: string | null,
  customSecret?: string,
  asOfMs = Date.now()
): ParsedGuestCookieResult {
  if (!rawCookieString || typeof rawCookieString !== 'string') {
    return { isValid: false, reason: 'Cookie missing or empty' };
  }

  const trimmed = rawCookieString.trim();
  if (Buffer.byteLength(trimmed, 'utf8') > MAX_COOKIE_BYTE_LENGTH) {
    return { isValid: false, reason: 'Cookie exceeds maximum size' };
  }

  const parts = trimmed.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { isValid: false, reason: 'Malformed cookie format (expected payload.signature)' };
  }

  const [encodedPayload, clientSignature] = parts;
  const secret = getSigningSecret(customSecret);

  // Constant-time signature verification
  const expectedSignature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  const clientBuf = Buffer.from(clientSignature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (clientBuf.length !== expectedBuf.length || !timingSafeEqual(clientBuf, expectedBuf)) {
    return { isValid: false, reason: 'Tampered or invalid signature' };
  }

  try {
    const jsonStr = base64UrlDecode(encodedPayload);
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    // 1. Version check
    if (parsed.v !== 1) {
      return { isValid: false, reason: `Unsupported payload version: ${parsed.v}` };
    }

    // 2. Expiration check
    if (typeof parsed.ts !== 'number' || isNaN(parsed.ts) || asOfMs - parsed.ts > COOKIE_EXPIRATION_MS) {
      return { isValid: false, reason: 'Cookie expired' };
    }

    // 3. Security check: prohibit forbidden authorization/identity fields
    const forbiddenKeys = [
      'user_id', 'userId', 'role', 'roles', 'chargeCurrency', 'permissions',
      'email', 'id', 'token', 'sub', 'session',
    ];
    for (const key of forbiddenKeys) {
      if (key in parsed) {
        return { isValid: false, reason: `Forbidden security key '${key}' detected in guest cookie` };
      }
    }

    // 4. Sanitize and validate fields
    const cleanPayload: GuestPreferenceCookiePayload = {
      v: 1,
      ts: parsed.ts,
      ...(typeof parsed.lng === 'string' && /^[a-zA-Z0-9_-]{2,16}$/.test(parsed.lng) ? { lng: parsed.lng } : {}),
      ...(typeof parsed.cnt === 'string' && /^[a-zA-Z]{2}$/.test(parsed.cnt) ? { cnt: parsed.cnt.toUpperCase() } : {}),
      ...(typeof parsed.cur === 'string' && /^[a-zA-Z]{3}$/.test(parsed.cur) ? { cur: parsed.cur.toUpperCase() } : {}),
      ...(typeof parsed.man === 'boolean' ? { man: parsed.man } : {}),
      ...(typeof parsed.tz === 'string' && parsed.tz.length <= 48 ? { tz: parsed.tz } : {}),
    };

    return Object.freeze({
      isValid: true,
      payload: Object.freeze(cleanPayload),
    });
  } catch {
    return { isValid: false, reason: 'JSON parsing failure' };
  }
}

/**
 * Extracts candidate first-run suggestions (Tier 4) from untrusted HTTP headers.
 */
export function extractHeaderSuggestions(
  headers: {
    acceptLanguage?: string | null;
    countryHeader?: string | null;
  },
  registries?: RegistryContext
): PreferenceInputTier {
  let languageTag: string | undefined;
  let countryCode: string | undefined;

  // 1. Parse Accept-Language header
  if (headers.acceptLanguage && typeof headers.acceptLanguage === 'string') {
    const rawTags = headers.acceptLanguage
      .split(',')
      .map(entry => {
        const [lang, qPart] = entry.trim().split(';');
        let q = 1.0;
        if (qPart && qPart.trim().startsWith('q=')) {
          const parsedQ = parseFloat(qPart.trim().slice(2));
          if (!isNaN(parsedQ)) q = parsedQ;
        }
        return { lang: lang?.trim(), q };
      })
      .sort((a, b) => b.q - a.q);

    for (const item of rawTags) {
      if (!item.lang) continue;
      if (!registries || registries.locales.isSupported(item.lang)) {
        languageTag = item.lang;
        break;
      }
      const fallback = registries.locales.resolveFallback(item.lang);
      if (fallback && registries.locales.isSupported(fallback)) {
        languageTag = fallback;
        break;
      }
    }
  }

  // 2. Parse Geo-IP country header (e.g. x-vercel-ip-country, cf-ipcountry)
  if (headers.countryHeader && typeof headers.countryHeader === 'string') {
    const candidate = headers.countryHeader.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(candidate)) {
      if (!registries || registries.countries.isSupported(candidate)) {
        countryCode = candidate;
      }
    }
  }

  return Object.freeze({
    ...(languageTag ? { languageTag } : {}),
    ...(countryCode ? { countryCode } : {}),
  });
}

/**
 * Adapts incoming HTTP request state (cookies & headers) into untrusted GLCC candidate tiers.
 */
export function adaptRequestToCandidateTiers(
  request: {
    cookieHeader?: string | null;
    acceptLanguage?: string | null;
    geoIpCountry?: string | null;
  },
  registries?: RegistryContext,
  secret?: string
): {
  guestSession: PreferenceInputTier | null;
  firstRunSuggestion: PreferenceInputTier;
} {
  // Extract guest cookie
  let rawCookie: string | null = null;
  if (request.cookieHeader) {
    const match = request.cookieHeader.match(new RegExp(`(?:^|;\\s*)${GUEST_PREFERENCE_COOKIE_NAME}=([^;]+)`));
    if (match && match[1]) {
      rawCookie = decodeURIComponent(match[1]);
    }
  }

  const parsedCookie = parseGuestPreferenceCookie(rawCookie, secret);
  let guestSession: PreferenceInputTier | null = null;

  if (parsedCookie.isValid && parsedCookie.payload) {
    guestSession = Object.freeze({
      ...(parsedCookie.payload.lng ? { languageTag: parsedCookie.payload.lng } : {}),
      ...(parsedCookie.payload.cnt ? { countryCode: parsedCookie.payload.cnt } : {}),
      ...(parsedCookie.payload.cur ? { displayCurrency: parsedCookie.payload.cur } : {}),
      ...(typeof parsedCookie.payload.man === 'boolean' ? { isManualDisplayOverride: parsedCookie.payload.man } : {}),
      ...(parsedCookie.payload.tz ? { timezone: parsedCookie.payload.tz } : {}),
      timestamp: String(parsedCookie.payload.ts),
    });
  }

  // Extract suggestions
  const firstRunSuggestion = extractHeaderSuggestions(
    {
      acceptLanguage: request.acceptLanguage,
      countryHeader: request.geoIpCountry,
    },
    registries
  );

  return Object.freeze({
    guestSession,
    firstRunSuggestion,
  });
}
