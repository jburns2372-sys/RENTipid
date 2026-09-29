import { cookies, headers } from 'next/headers';
import {
  parseGuestPreferenceCookie,
  GUEST_PREFERENCE_COOKIE_NAME,
  extractHeaderSuggestions,
} from '../server-adapter';
import { defaultTranslationEngine } from './engine';
import {
  resolveEffectiveLocale,
  resolveEffectiveResolverMode,
  type ResolverMode,
} from '../locale-resolver';
import { getDefaultRegistryContext } from '../default-registries';
import type { GlccCanonicalTranslationKey, TranslationParams } from './contracts';

export interface GetServerLocaleOptions {
  readonly resolverMode?: ResolverMode;
  readonly defaultLocale?: string;
  readonly explicitLocale?: string | null;
  readonly accountLocale?: string | null;
}

/**
 * Resolves the active request locale on the server during SSR using the authoritative P3 Locale Resolver.
 *
 * Precedence & Authority:
 * 1. Explicit tier: Explicit locale provided by caller (options.explicitLocale).
 * 2. Account tier: Authenticated account preference (options.accountLocale).
 * 3. Guest tier: Reads signed 'rentipid_pref' (authoritative) and lightweight 'rentipid_locale' (convenience mirror).
 *    If 'rentipid_pref' is valid and signed, its language takes precedence as the guest candidate.
 * 4. Suggestion tier: Reads 'accept-language' header.
 * 5. Default tier: Platform canonical default ('en-PH').
 *
 * Mode Governance:
 * Evaluated under 'PRODUCTION' mode by default. Locales in QA_REQUIRED (such as fil-PH)
 * or REGISTERED (ja-JP) do NOT resolve in PRODUCTION mode, preventing unauthorized premature activation.
 * Under controlled QA mode ('QA'), QA_REQUIRED locales are allowed to resolve.
 */
export async function getServerLocale(options?: GetServerLocaleOptions): Promise<string> {
  let guestCandidate: string | null = null;
  let suggestedLocale: string | null = null;
  let qaCandidate: ResolverMode | undefined = options?.resolverMode;

  try {
    const cookieStore = await cookies();

    // Check for QA mode cookie in non-production environments
    if (!qaCandidate) {
      const qaCookie = cookieStore.get('glcc_qa')?.value || cookieStore.get('rentipid_qa_mode')?.value;
      if (qaCookie === 'true' || qaCookie === '1' || qaCookie === 'QA') {
        qaCandidate = 'QA';
      }
    }

    // 1. Check signed guest preference cookie (authoritative guest cookie)
    const prefCookie = cookieStore.get(GUEST_PREFERENCE_COOKIE_NAME)?.value;
    if (prefCookie) {
      const parsed = parseGuestPreferenceCookie(prefCookie);
      if (parsed.isValid && parsed.payload?.lng) {
        guestCandidate = parsed.payload.lng;
      }
    }

    // 2. If no valid signed preference was found, check direct lightweight cookie
    if (!guestCandidate) {
      const directLocale = cookieStore.get('rentipid_locale')?.value;
      if (directLocale) {
        guestCandidate = directLocale;
      }
    }

    // 3. Check Accept-Language header for suggestion tier
    try {
      const headerStore = await headers();
      const acceptLanguage = headerStore.get('accept-language');
      if (acceptLanguage) {
        const suggestions = extractHeaderSuggestions({ acceptLanguage });
        if (suggestions.languageTag) {
          suggestedLocale = suggestions.languageTag;
        }
      }
    } catch {
      // headers() might not be available in some execution environments
    }
  } catch {
    // cookies() may throw outside request lifecycle (e.g. static generation)
  }

  const resolverMode: ResolverMode = resolveEffectiveResolverMode(qaCandidate);

  const resolved = resolveEffectiveLocale(
    {
      explicitLocale: options?.explicitLocale,
      accountLocale: options?.accountLocale,
      guestLocale: guestCandidate,
      suggestedLocale,
      platformDefault: options?.defaultLocale ?? 'en-PH',
      resolverMode,
    },
    getDefaultRegistryContext().locales
  );

  return resolved.effectiveLocale;
}

/**
 * Resolves server-side translation helpers bound to the request's active locale.
 */
export async function getServerTranslation(options?: GetServerLocaleOptions) {
  const locale = await getServerLocale(options);
  return {
    locale,
    direction: defaultTranslationEngine.getDirection(locale),
    t: (key: GlccCanonicalTranslationKey | string, params?: TranslationParams, fallbackText?: string) =>
      defaultTranslationEngine.translate(key, params, locale, fallbackText),
  };
}
