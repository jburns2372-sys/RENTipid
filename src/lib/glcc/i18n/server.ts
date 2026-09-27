import { cookies } from 'next/headers';
import { parseGuestPreferenceCookie, GUEST_PREFERENCE_COOKIE_NAME } from '../server-adapter';
import { defaultTranslationEngine } from './engine';
import type { GlccCanonicalTranslationKey, TranslationParams } from './contracts';

/**
 * Resolves the active request locale on the server during SSR.
 * Checks lightweight 'rentipid_locale' cookie first, then signed 'rentipid_pref'.
 * Defaults safely to 'en-PH'.
 */
export async function getServerLocale(): Promise<string> {
  try {
    const cookieStore = await cookies();
    // 1. Check direct lightweight cookie
    const directLocale = cookieStore.get('rentipid_locale')?.value;
    if (directLocale && (directLocale === 'fil-PH' || directLocale === 'en-PH')) {
      return directLocale;
    }
    // 2. Check signed guest preference cookie
    const prefCookie = cookieStore.get(GUEST_PREFERENCE_COOKIE_NAME)?.value;
    if (prefCookie) {
      const parsed = parseGuestPreferenceCookie(prefCookie);
      if (parsed.isValid && parsed.payload?.lng) {
        if (parsed.payload.lng === 'fil-PH' || parsed.payload.lng === 'en-PH') {
          return parsed.payload.lng;
        }
      }
    }
  } catch {
    // cookies() may throw outside request lifecycle (e.g. static generation)
  }
  return 'en-PH';
}

/**
 * Resolves server-side translation helpers bound to the request's active locale.
 */
export async function getServerTranslation() {
  const locale = await getServerLocale();
  return {
    locale,
    direction: defaultTranslationEngine.getDirection(locale),
    t: (key: GlccCanonicalTranslationKey | string, params?: TranslationParams, fallbackText?: string) =>
      defaultTranslationEngine.translate(key, params, locale, fallbackText),
  };
}
