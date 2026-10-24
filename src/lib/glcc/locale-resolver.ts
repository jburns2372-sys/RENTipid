/**
 * RENTipid GLCC v1.0.1 — Authoritative Locale Resolver
 *
 * Implements the single authoritative locale resolution policy under Master Plan
 * RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0 (Work Package P3).
 *
 * Precedence Order (Strict 5-Tier):
 * 1. EXPLICIT   — explicit current user selection (explicitLocale / explicitChoice)
 * 2. ACCOUNT    — authenticated account saved preference (accountLocale / accountSaved)
 * 3. GUEST      — signed guest session cookie or validated device preference (guestLocale / guestSession)
 * 4. SUGGESTION — safe browser header or market suggestion (suggestedLocale / firstRunSuggestion)
 * 5. DEFAULT    — platform canonical default ('en-PH')
 *
 * Mode Governance & Production Eligibility Invariant:
 * - PRODUCTION mode (default):
 *   Only locales with enabled === true AND releaseStatus === 'PRODUCTION_READY' are eligible.
 *   Locales in QA_REQUIRED (e.g. fil-PH), TRANSLATION_IN_PROGRESS (e.g. en-US),
 *   REGISTERED (e.g. ja-JP), or DISABLED fail closed and fall through to lower precedence tiers.
 * - QA mode (controlled developer/test mode):
 *   Allows both PRODUCTION_READY and QA_REQUIRED locales (e.g. fil-PH) to be exercised
 *   during automated tests, local development, and controlled QA.
 *   REGISTERED-only locales (e.g. ja-JP) remain strictly ineligible.
 *
 * Security & Architectural Invariants:
 * - Pure language resolution only.
 * - ZERO authority over countryCode, displayCurrency, chargeCurrency, payment provider,
 *   settlement, legal jurisdiction, or RBAC.
 * - Input immutability; deep-frozen outputs.
 * - Does not trust client-supplied userId or tamperable state.
 * - No automatic status promotion.
 */

import {
  type LocaleMetadata,
  type LocaleReleaseStatus,
  type LocaleRegistry,
  type RegistryContext,
  validateBcp47LocaleTag,
  isLocaleProductionSelectable,
} from './registry-contracts';
import { getDefaultLocaleRegistry } from './default-registries';
import type { PreferenceSource } from './contracts';

export type ResolverMode = 'PRODUCTION' | 'QA';

export type LocaleResolutionSource =
  | 'EXPLICIT'
  | 'ACCOUNT'
  | 'GUEST'
  | 'SUGGESTION'
  | 'DEFAULT';

export interface EffectiveLocaleResolutionInput {
  readonly explicitLocale?: string | null;
  readonly explicitChoice?: { readonly languageTag?: string | null; readonly timestamp?: string } | null;
  readonly accountLocale?: string | null;
  readonly accountSaved?: { readonly languageTag?: string | null; readonly timestamp?: string } | null;
  readonly guestLocale?: string | null;
  readonly guestSession?: { readonly languageTag?: string | null; readonly timestamp?: string } | null;
  readonly suggestedLocale?: string | null;
  readonly firstRunSuggestion?: { readonly languageTag?: string | null; readonly timestamp?: string } | null;
  readonly platformDefault?: string | null;
  readonly resolverMode?: ResolverMode;
  readonly asOf?: Date | string;
}

export interface EffectiveLocaleResult {
  readonly effectiveLocale: string;
  readonly source: LocaleResolutionSource;
  readonly preferenceSource: PreferenceSource;
  readonly requestedLocale?: string;
  readonly fallbackFrom?: string;
  readonly releaseStatus: LocaleReleaseStatus;
  readonly direction: 'ltr' | 'rtl';
  readonly isProductionSelectable: boolean;
  readonly resolverMode: ResolverMode;
  readonly reason: string;
  readonly resolvedAt: string;
}

/**
 * Maps LocaleResolutionSource to the GLCC PreferenceSource contract.
 */
export function mapLocaleSourceToPreferenceSource(source: LocaleResolutionSource): PreferenceSource {
  switch (source) {
    case 'EXPLICIT':
      return 'EXPLICIT_CHOICE';
    case 'ACCOUNT':
      return 'ACCOUNT_SAVED';
    case 'GUEST':
      return 'GUEST_SESSION';
    case 'SUGGESTION':
      return 'FIRST_RUN_SUGGESTION';
    case 'DEFAULT':
      return 'PLATFORM_DEFAULT';
  }
}

/**
 * Maps GLCC PreferenceSource contract to LocaleResolutionSource.
 */
export function mapPreferenceSourceToLocaleSource(source: PreferenceSource): LocaleResolutionSource {
  switch (source) {
    case 'EXPLICIT_CHOICE':
      return 'EXPLICIT';
    case 'ACCOUNT_SAVED':
      return 'ACCOUNT';
    case 'GUEST_SESSION':
      return 'GUEST';
    case 'FIRST_RUN_SUGGESTION':
      return 'SUGGESTION';
    case 'PLATFORM_DEFAULT':
      return 'DEFAULT';
  }
}

/**
 * Evaluates whether a registered locale is eligible for resolution in the active resolver mode.
 * - PRODUCTION: requires enabled === true AND releaseStatus === 'PRODUCTION_READY'.
 * - QA: requires enabled === true AND (releaseStatus === 'PRODUCTION_READY' || releaseStatus === 'QA_REQUIRED').
 * - REGISTERED, TRANSLATION_IN_PROGRESS, and DISABLED locales are never eligible in either mode.
 */
export function isLocaleEligibleForMode(
  locale: LocaleMetadata | null | undefined,
  mode: ResolverMode = 'PRODUCTION'
): boolean {
  if (!locale) return false;
  const isEnabled = locale.enabled ?? locale.isActive;
  if (!isEnabled) return false;

  const status: LocaleReleaseStatus = locale.releaseStatus ?? locale.status ?? 'REGISTERED';
  if (status === 'DISABLED') return false;

  if (mode === 'PRODUCTION') {
    return status === 'PRODUCTION_READY';
  }

  if (mode === 'QA') {
    return status === 'PRODUCTION_READY' || status === 'QA_REQUIRED';
  }

  return false;
}

function sanitizeString(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolves whether the current execution context represents a Production deployment.
 * Enforces strict fail-closed evaluation:
 * - VERCEL_ENV === 'production' => true
 * - APP_ENV === 'production' | 'prod' => true
 * - NODE_ENV === 'production' (unless running in explicit Preview or Test) => true
 */
export function isProductionRuntime(env: Record<string, string | undefined> = process.env): boolean {
  // 1. Trusted deployment tier signals (highest authority)
  const vercelEnv = (env.NEXT_PUBLIC_VERCEL_ENV || env.VERCEL_ENV)?.trim().toLowerCase();
  if (vercelEnv === 'production') return true;
  if (vercelEnv === 'preview') return false;

  const appEnv = (env.NEXT_PUBLIC_APP_ENV || env.APP_ENV)?.trim().toLowerCase();
  if (appEnv === 'production' || appEnv === 'prod') return true;
  if (appEnv === 'preview') return false;

  // 2. Browser domain inspection (canonical Production domain authority)
  if (typeof window !== 'undefined') {
    const hostname = (env.GLCC_TEST_HOSTNAME || window.location?.hostname || '').toLowerCase();
    if (hostname === 'www.rentipid.com.ph' || hostname === 'rentipid.com.ph') {
      return true;
    }
    if (hostname === 'preview.rentipid.com.ph' || hostname.endsWith('.vercel.app')) {
      return false;
    }
  }

  // 3. Fallback to NODE_ENV
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase();
  if (nodeEnv === 'production' && !isPreviewRuntime(env)) {
    return true;
  }

  return false;
}

/**
 * Resolves whether the current execution context represents a trusted Preview deployment.
 */
export function isPreviewRuntime(env: Record<string, string | undefined> = process.env): boolean {
  const vercelEnv = (env.NEXT_PUBLIC_VERCEL_ENV || env.VERCEL_ENV)?.trim().toLowerCase();
  if (vercelEnv === 'production') return false;
  if (vercelEnv === 'preview') return true;

  const appEnv = (env.NEXT_PUBLIC_APP_ENV || env.APP_ENV)?.trim().toLowerCase();
  if (appEnv === 'production' || appEnv === 'prod') return false;
  if (appEnv === 'preview') return true;

  if (typeof window !== 'undefined') {
    const hostname = (env.GLCC_TEST_HOSTNAME || window.location?.hostname || '').toLowerCase();
    if (hostname === 'www.rentipid.com.ph' || hostname === 'rentipid.com.ph') {
      return false;
    }
    if (hostname === 'preview.rentipid.com.ph' || hostname.endsWith('.vercel.app')) {
      return true;
    }
  }

  return false;
}

/**
 * Authoritatively determines the effective resolverMode enforcing the Production Firewall.
 *
 * Invariants:
 * 1. In a Production deployment, resolverMode is IMMUTABLY FORCED to 'PRODUCTION' — fail closed.
 *    No user preference, request input, query parameter, body field, cookie, header,
 *    or accidental environment configuration can switch a Production runtime to QA mode.
 * 2. In non-Production runtimes:
 *    - In Jest / CI Test Runner (NODE_ENV === 'test'): trustedCallerMode is honored for unit/integration tests.
 *    - In Controlled Preview QA: trusted Preview deployment policy authorizes QA mode.
 *    - In Local Development (NODE_ENV === 'development'): QA mode is available if GLCC_ENABLE_LOCAL_QA_MODE === 'true' or trustedCallerMode === 'QA'.
 * 3. Default fallback is always 'PRODUCTION'.
 */
export function resolveEffectiveResolverMode(
  trustedModeCandidate?: ResolverMode | null,
  options?: {
    readonly env?: Record<string, string | undefined>;
  }
): ResolverMode {
  const env = options?.env ?? process.env;

  // 1. Production Firewall: fail closed to 'PRODUCTION'
  if (isProductionRuntime(env)) {
    return 'PRODUCTION';
  }

  // 2. Non-Production Environments:
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase();

  // Test Runner harness (e.g. Jest unit tests)
  if (nodeEnv === 'test') {
    if (trustedModeCandidate === 'QA' || env.GLCC_RESOLVER_MODE === 'QA') {
      return 'QA';
    }
    return 'PRODUCTION';
  }

  // Controlled Preview QA deployment authorized by deployment policy
  if (isPreviewRuntime(env)) {
    if (
      trustedModeCandidate === 'QA' ||
      env.GLCC_PREVIEW_QA_ENABLED === 'true' ||
      env.NEXT_PUBLIC_GLCC_PREVIEW_QA_ENABLED === 'true'
    ) {
      return 'QA';
    }

    if (typeof window !== 'undefined') {
      try {
        const search = window.location?.search;
        if (search) {
          const urlParams = new URLSearchParams(search);
          if (urlParams.get('glcc_qa') === 'true' || urlParams.get('glcc_qa') === '1') {
            return 'QA';
          }
        }
        if (
          typeof document !== 'undefined' &&
          document.cookie &&
          (document.cookie.includes('glcc_qa=true') || document.cookie.includes('rentipid_qa_mode=true'))
        ) {
          return 'QA';
        }
      } catch {
        // Safe fallback
      }
    }

    return 'PRODUCTION';
  }

  // Local Development
  if (nodeEnv === 'development' || !nodeEnv) {
    if (env.GLCC_ENABLE_LOCAL_QA_MODE === 'true' || trustedModeCandidate === 'QA') {
      return 'QA';
    }
    return 'PRODUCTION';
  }

  return 'PRODUCTION';
}

/**
 * Pure, authoritative function resolving the effective application locale.
 * Strictly adheres to 5-tier precedence and registry governance.
 */
export function resolveEffectiveLocale(
  input: EffectiveLocaleResolutionInput,
  registries?: RegistryContext | LocaleRegistry,
  options?: { resolverMode?: ResolverMode; asOf?: Date | string; env?: Record<string, string | undefined> }
): EffectiveLocaleResult {
  const resolvedAt = (options?.asOf || input.asOf
    ? new Date(options?.asOf || input.asOf!)
    : new Date()
  ).toISOString();

  // Determine effective mode through Production Firewall authority
  const trustedCandidate = options?.resolverMode ?? input.resolverMode;
  const mode: ResolverMode = resolveEffectiveResolverMode(trustedCandidate, {
    env: options?.env,
  });

  const localeRegistry: LocaleRegistry =
    registries && 'locales' in registries
      ? registries.locales
      : (registries as LocaleRegistry) ?? getDefaultLocaleRegistry();

  // Tier Candidates in strict precedence order
  const tiers: {
    source: LocaleResolutionSource;
    rawCandidate: string | null;
    tierName: string;
  }[] = [
    {
      source: 'EXPLICIT',
      rawCandidate: sanitizeString(input.explicitLocale ?? input.explicitChoice?.languageTag),
      tierName: 'Tier 1 (Explicit Choice)',
    },
    {
      source: 'ACCOUNT',
      rawCandidate: sanitizeString(input.accountLocale ?? input.accountSaved?.languageTag),
      tierName: 'Tier 2 (Account Saved)',
    },
    {
      source: 'GUEST',
      rawCandidate: sanitizeString(input.guestLocale ?? input.guestSession?.languageTag),
      tierName: 'Tier 3 (Guest Session)',
    },
    {
      source: 'SUGGESTION',
      rawCandidate: sanitizeString(input.suggestedLocale ?? input.firstRunSuggestion?.languageTag),
      tierName: 'Tier 4 (Header Suggestion)',
    },
  ];

  // Evaluate Tiers 1-4
  for (const { source, rawCandidate, tierName } of tiers) {
    if (!rawCandidate) continue;

    // Validate BCP-47 syntax
    const bcp47Check = validateBcp47LocaleTag(rawCandidate);
    if (!bcp47Check.isValid) {
      // Malformed candidate fails safely to next tier
      continue;
    }

    const locale = localeRegistry.get(rawCandidate, resolvedAt);
    if (locale) {
      if (isLocaleEligibleForMode(locale, mode)) {
        return Object.freeze({
          effectiveLocale: locale.tag,
          source,
          preferenceSource: mapLocaleSourceToPreferenceSource(source),
          requestedLocale: rawCandidate,
          releaseStatus: locale.releaseStatus ?? locale.status ?? 'REGISTERED',
          direction: locale.direction,
          isProductionSelectable: isLocaleProductionSelectable(locale),
          resolverMode: mode,
          reason: `Resolved from ${tierName}: '${locale.tag}' is eligible in ${mode} mode (${locale.releaseStatus}).`,
          resolvedAt,
        });
      }
      // Registered locale exists but is NOT eligible in this mode (e.g. fil-PH in PRODUCTION or ja-JP in QA).
      // Fallback cannot make an unapproved locale appear production-ready.
      // Candidate fails closed to the next precedence tier.
      continue;
    }

    // Candidate not directly registered: check if registry can resolve fallback for unregistered subtag
    const fallbackTag = localeRegistry.resolveFallback(rawCandidate);
    if (fallbackTag) {
      const fallbackLocale = localeRegistry.get(fallbackTag, resolvedAt);
      if (fallbackLocale && isLocaleEligibleForMode(fallbackLocale, mode)) {
        return Object.freeze({
          effectiveLocale: fallbackLocale.tag,
          source,
          preferenceSource: mapLocaleSourceToPreferenceSource(source),
          requestedLocale: rawCandidate,
          fallbackFrom: rawCandidate,
          releaseStatus: fallbackLocale.releaseStatus ?? fallbackLocale.status ?? 'REGISTERED',
          direction: fallbackLocale.direction,
          isProductionSelectable: isLocaleProductionSelectable(fallbackLocale),
          resolverMode: mode,
          reason: `Resolved from ${tierName} fallback: '${rawCandidate}' mapped to eligible fallback '${fallbackLocale.tag}' in ${mode} mode.`,
          resolvedAt,
        });
      }
    }
  }

  // Tier 5: Platform Default Anchor
  const defaultTag = sanitizeString(input.platformDefault) || 'en-PH';
  const defaultBcp47 = validateBcp47LocaleTag(defaultTag);
  if (!defaultBcp47.isValid) {
    throw new Error(`Platform default locale '${defaultTag}' has invalid BCP-47 syntax`);
  }

  const defaultLocale = localeRegistry.get(defaultTag, resolvedAt);
  if (!defaultLocale) {
    throw new Error(`Platform default locale '${defaultTag}' is not supported in the locale registry`);
  }

  if (!isLocaleEligibleForMode(defaultLocale, mode)) {
    throw new Error(
      `Platform default locale '${defaultTag}' is not eligible in ${mode} mode (${defaultLocale.releaseStatus})`
    );
  }

  return Object.freeze({
    effectiveLocale: defaultLocale.tag,
    source: 'DEFAULT',
    preferenceSource: 'PLATFORM_DEFAULT',
    requestedLocale: defaultTag,
    releaseStatus: defaultLocale.releaseStatus ?? defaultLocale.status ?? 'REGISTERED',
    direction: defaultLocale.direction,
    isProductionSelectable: isLocaleProductionSelectable(defaultLocale),
    resolverMode: mode,
    reason: `All higher tiers missing, invalid, or ineligible in ${mode} mode; resolved to platform default '${defaultLocale.tag}'.`,
    resolvedAt,
  });
}
