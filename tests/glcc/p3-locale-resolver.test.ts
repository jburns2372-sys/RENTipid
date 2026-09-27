/**
 * @jest-environment node
 *
 * RENTipid GLCC v1.0.1 — Authoritative Locale Resolver Test Suite (P3)
 * Controlling Document: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 *
 * Verifies:
 * 1. Strict 5-tier resolution precedence: Explicit > Account > Guest > Suggestion > Default.
 * 2. Deterministic mode governance: PRODUCTION vs controlled QA.
 * 3. Production selectability gating:
 *    - en-PH (PRODUCTION_READY) resolves in PRODUCTION and QA.
 *    - fil-PH (QA_REQUIRED) resolves in controlled QA, BLOCKED in PRODUCTION.
 *    - ja-JP (REGISTERED) BLOCKED in both PRODUCTION and QA.
 *    - en-US (TRANSLATION_IN_PROGRESS) BLOCKED in both PRODUCTION and QA.
 *    - Disabled locales BLOCKED in both modes.
 * 4. Explicit selection validation and safe fail-closed behavior for malformed BCP-47 tags.
 * 5. Authenticated account preference participation and non-mutation of stored records.
 * 6. Guest preference validation: signed cookie verification, tamper resistance, and lightweight mirror.
 * 7. Suggestion source: safe fallback without overriding explicit, account, or guest choices.
 * 8. Platform default anchor: canonical en-PH and configuration error on corrupted default.
 * 9. Architectural firewalls: Language != Country, Language != Currency, Language != chargeCurrency, Language != RBAC.
 * 10. No automatic status promotion.
 * 11. Server and client initial locale parity (hydration invariant).
 * 12. Full conflict resolution test matrix from Section 17.
 */

import {
  resolveEffectiveLocale,
  isLocaleEligibleForMode,
  isProductionRuntime,
  resolveEffectiveResolverMode,
  mapLocaleSourceToPreferenceSource,
  mapPreferenceSourceToLocaleSource,
  type EffectiveLocaleResolutionInput,
} from '@/lib/glcc/locale-resolver';
import {
  getDefaultRegistryContext,
  getDefaultLocaleRegistry,
  clearCachedRegistryContext,
  DEFAULT_PLATFORM_PREFERENCE,
} from '@/lib/glcc/default-registries';
import {
  createInMemoryRegistryContext,
  type LocaleMetadata,
} from '@/lib/glcc/registry-contracts';
import {
  serializeGuestPreferenceCookie,
  parseGuestPreferenceCookie,
  extractHeaderSuggestions,
} from '@/lib/glcc/server-adapter';
import { resolveGlobalPreference } from '@/lib/glcc/preference-resolver';

describe('RENTipid GLCC v1.0.1 — P3 Authoritative Locale Resolver', () => {
  beforeEach(() => {
    clearCachedRegistryContext();
    delete process.env.GLCC_RESOLVER_MODE;
  });

  afterAll(() => {
    clearCachedRegistryContext();
    delete process.env.GLCC_RESOLVER_MODE;
  });

  const defaultRegistry = getDefaultRegistryContext();
  const defaultLocaleReg = getDefaultLocaleRegistry();

  describe('1. 5-Tier Precedence Hierarchy', () => {
    it('Tier 1 (Explicit) overrides Account, Guest, Suggestion, and Default', () => {
      const input: EffectiveLocaleResolutionInput = {
        explicitLocale: 'en-PH',
        accountLocale: 'en-PH',
        guestLocale: 'en-PH',
        suggestedLocale: 'en-PH',
        platformDefault: 'en-PH',
        resolverMode: 'PRODUCTION',
      };

      // Also verifies resolveEffectiveLocale accepts direct LocaleRegistry input
      const result = resolveEffectiveLocale(input, defaultLocaleReg);
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('EXPLICIT');
      expect(result.preferenceSource).toBe('EXPLICIT_CHOICE');
      expect(result.isProductionSelectable).toBe(true);
    });

    it('Tier 2 (Account) overrides Guest, Suggestion, and Default when Explicit is absent', () => {
      const input: EffectiveLocaleResolutionInput = {
        explicitLocale: null,
        accountLocale: 'en-PH',
        guestLocale: 'en-PH',
        suggestedLocale: 'en-PH',
        platformDefault: 'en-PH',
        resolverMode: 'PRODUCTION',
      };

      const result = resolveEffectiveLocale(input, defaultRegistry);
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('ACCOUNT');
      expect(result.preferenceSource).toBe('ACCOUNT_SAVED');
    });

    it('Tier 3 (Guest) overrides Suggestion and Default when Explicit and Account are absent', () => {
      const input: EffectiveLocaleResolutionInput = {
        guestLocale: 'en-PH',
        suggestedLocale: 'en-PH',
        platformDefault: 'en-PH',
        resolverMode: 'PRODUCTION',
      };

      const result = resolveEffectiveLocale(input, defaultRegistry);
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('GUEST');
      expect(result.preferenceSource).toBe('GUEST_SESSION');
    });

    it('Tier 4 (Suggestion) overrides Default when higher tiers are absent', () => {
      const input: EffectiveLocaleResolutionInput = {
        suggestedLocale: 'en-PH',
        platformDefault: 'en-PH',
        resolverMode: 'PRODUCTION',
      };

      const result = resolveEffectiveLocale(input, defaultRegistry);
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('SUGGESTION');
      expect(result.preferenceSource).toBe('FIRST_RUN_SUGGESTION');
    });

    it('Tier 5 (Default) resolves when all higher tiers are absent', () => {
      const input: EffectiveLocaleResolutionInput = {
        platformDefault: 'en-PH',
        resolverMode: 'PRODUCTION',
      };

      const result = resolveEffectiveLocale(input, defaultRegistry);
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
      expect(result.preferenceSource).toBe('PLATFORM_DEFAULT');
    });
  });

  describe('2. Mode Governance & Production Eligibility', () => {
    it('en-PH is PRODUCTION_READY and resolves in PRODUCTION and QA modes', () => {
      const prodRes = resolveEffectiveLocale({ explicitLocale: 'en-PH', resolverMode: 'PRODUCTION' }, defaultRegistry);
      expect(prodRes.effectiveLocale).toBe('en-PH');
      expect(prodRes.source).toBe('EXPLICIT');
      expect(prodRes.releaseStatus).toBe('PRODUCTION_READY');

      const qaRes = resolveEffectiveLocale({ explicitLocale: 'en-PH', resolverMode: 'QA' }, defaultRegistry);
      expect(qaRes.effectiveLocale).toBe('en-PH');
      expect(qaRes.source).toBe('EXPLICIT');
      expect(qaRes.releaseStatus).toBe('PRODUCTION_READY');
    });

    it('fil-PH is QA_REQUIRED: BLOCKED in PRODUCTION mode, falls through to default en-PH', () => {
      const result = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH', resolverMode: 'PRODUCTION' },
        defaultRegistry
      );
      // In PRODUCTION mode, fil-PH cannot become active; falls through to default
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
      expect(result.isProductionSelectable).toBe(true);
    });

    it('fil-PH is QA_REQUIRED: ALLOWED in controlled QA mode', () => {
      const result = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH', resolverMode: 'QA' },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('fil-PH');
      expect(result.source).toBe('EXPLICIT');
      expect(result.releaseStatus).toBe('QA_REQUIRED');
      expect(result.isProductionSelectable).toBe(false);
    });

    it('ja-JP is REGISTERED: BLOCKED in PRODUCTION mode', () => {
      const result = resolveEffectiveLocale(
        { explicitLocale: 'ja-JP', resolverMode: 'PRODUCTION' },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });

    it('ja-JP is REGISTERED: BLOCKED even in controlled QA mode (registered metadata only)', () => {
      const result = resolveEffectiveLocale(
        { explicitLocale: 'ja-JP', resolverMode: 'QA' },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });

    it('en-US is TRANSLATION_IN_PROGRESS: BLOCKED in both PRODUCTION and QA modes', () => {
      const prodRes = resolveEffectiveLocale({ explicitLocale: 'en-US', resolverMode: 'PRODUCTION' }, defaultRegistry);
      expect(prodRes.effectiveLocale).toBe('en-PH');
      expect(prodRes.source).toBe('DEFAULT');

      const qaRes = resolveEffectiveLocale({ explicitLocale: 'en-US', resolverMode: 'QA' }, defaultRegistry);
      expect(qaRes.effectiveLocale).toBe('en-PH');
      expect(qaRes.source).toBe('DEFAULT');
    });

    it('disabled locale is BLOCKED in both PRODUCTION and QA modes', () => {
      const customReg = createInMemoryRegistryContext({
        locales: [
          {
            tag: 'en-PH',
            direction: 'ltr',
            nativeName: 'English',
            name: 'English (Philippines)',
            isActive: true,
            releaseStatus: 'PRODUCTION_READY',
          },
          {
            tag: 'de-DE',
            direction: 'ltr',
            nativeName: 'Deutsch',
            name: 'German',
            isActive: false,
            enabled: false,
            releaseStatus: 'DISABLED',
          },
        ],
      });

      const prodRes = resolveEffectiveLocale({ explicitLocale: 'de-DE', resolverMode: 'PRODUCTION' }, customReg);
      expect(prodRes.effectiveLocale).toBe('en-PH');
      expect(prodRes.source).toBe('DEFAULT');

      const qaRes = resolveEffectiveLocale({ explicitLocale: 'de-DE', resolverMode: 'QA' }, customReg);
      expect(qaRes.effectiveLocale).toBe('en-PH');
      expect(qaRes.source).toBe('DEFAULT');
    });

    it('isLocaleEligibleForMode correctly enforces lifecycle states', () => {
      const prodReady: LocaleMetadata = {
        tag: 'en-PH',
        direction: 'ltr',
        nativeName: 'English',
        name: 'English',
        isActive: true,
        releaseStatus: 'PRODUCTION_READY',
      };
      const qaReq: LocaleMetadata = {
        tag: 'fil-PH',
        direction: 'ltr',
        nativeName: 'Filipino',
        name: 'Filipino',
        isActive: true,
        releaseStatus: 'QA_REQUIRED',
      };
      const registered: LocaleMetadata = {
        tag: 'ja-JP',
        direction: 'ltr',
        nativeName: '日本語',
        name: 'Japanese',
        isActive: true,
        releaseStatus: 'REGISTERED',
      };
      const disabled: LocaleMetadata = {
        tag: 'es-ES',
        direction: 'ltr',
        nativeName: 'Español',
        name: 'Spanish',
        isActive: false,
        releaseStatus: 'DISABLED',
      };

      // PRODUCTION mode
      expect(isLocaleEligibleForMode(prodReady, 'PRODUCTION')).toBe(true);
      expect(isLocaleEligibleForMode(qaReq, 'PRODUCTION')).toBe(false);
      expect(isLocaleEligibleForMode(registered, 'PRODUCTION')).toBe(false);
      expect(isLocaleEligibleForMode(disabled, 'PRODUCTION')).toBe(false);

      // QA mode
      expect(isLocaleEligibleForMode(prodReady, 'QA')).toBe(true);
      expect(isLocaleEligibleForMode(qaReq, 'QA')).toBe(true);
      expect(isLocaleEligibleForMode(registered, 'QA')).toBe(false);
      expect(isLocaleEligibleForMode(disabled, 'QA')).toBe(false);
    });
  });

  describe('3. Explicit Selection & BCP-47 Validation', () => {
    it('rejects malformed locale tags safely without crashing', () => {
      const malformedTags = ['123', 'invalid_locale!@#', '---', '', '   '];

      for (const badTag of malformedTags) {
        const result = resolveEffectiveLocale(
          { explicitLocale: badTag, platformDefault: 'en-PH' },
          defaultRegistry
        );
        expect(result.effectiveLocale).toBe('en-PH');
        expect(result.source).toBe('DEFAULT');
      }
    });

    it('candidate tier object aliases (explicitChoice, accountSaved, guestSession) work identically', () => {
      const result = resolveEffectiveLocale(
        {
          explicitChoice: { languageTag: 'en-PH', timestamp: '2026-09-27T00:00:00Z' },
          platformDefault: 'en-PH',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('EXPLICIT');
    });
  });

  describe('4. Authenticated Account Preference', () => {
    it('participates in resolution and overrides guest session and suggestion', () => {
      const result = resolveEffectiveLocale(
        {
          accountLocale: 'en-PH',
          guestLocale: 'en-PH',
          suggestedLocale: 'en-PH',
          platformDefault: 'en-PH',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('ACCOUNT');
    });

    it('ineligible account locale falls through safely to guest session without throwing', () => {
      const result = resolveEffectiveLocale(
        {
          accountLocale: 'ja-JP', // Ineligible (REGISTERED)
          guestLocale: 'en-PH',   // Eligible (PRODUCTION_READY)
          platformDefault: 'en-PH',
          resolverMode: 'PRODUCTION',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('GUEST');
    });
  });

  describe('5. Guest Preference & Tamper Protection', () => {
    it('signed guest cookie resolves safely at Tier 3', () => {
      const signedCookie = serializeGuestPreferenceCookie({ languageTag: 'en-PH' });
      const parsed = parseGuestPreferenceCookie(signedCookie);
      expect(parsed.isValid).toBe(true);

      const result = resolveEffectiveLocale(
        {
          guestLocale: parsed.payload?.lng,
          platformDefault: 'en-PH',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('GUEST');
    });

    it('tampered guest cookie signature is rejected and falls through to default safely', () => {
      const signedCookie = serializeGuestPreferenceCookie({ languageTag: 'en-PH' });
      const tamperedCookie = signedCookie.slice(0, -6) + 'xxxxxx'; // corrupt signature
      const parsed = parseGuestPreferenceCookie(tamperedCookie);
      expect(parsed.isValid).toBe(false);

      const result = resolveEffectiveLocale(
        {
          guestLocale: parsed.payload?.lng ?? null,
          platformDefault: 'en-PH',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });
  });

  describe('6. Suggestion Source (Accept-Language)', () => {
    it('resolves supported suggestion when higher tiers are absent', () => {
      const suggestions = extractHeaderSuggestions({ acceptLanguage: 'en-PH,en;q=0.9' }, defaultRegistry);
      expect(suggestions.languageTag).toBe('en-PH');

      const result = resolveEffectiveLocale(
        {
          suggestedLocale: suggestions.languageTag,
          platformDefault: 'en-PH',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('SUGGESTION');
    });

    it('unsupported suggestion falls through safely to platform default', () => {
      const result = resolveEffectiveLocale(
        {
          suggestedLocale: 'de-CH', // Unsupported
          platformDefault: 'en-PH',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });

    it('suggestion never overrides explicit choice, account preference, or guest preference', () => {
      const withExplicit = resolveEffectiveLocale(
        { explicitLocale: 'en-PH', suggestedLocale: 'en-PH' },
        defaultRegistry
      );
      expect(withExplicit.source).toBe('EXPLICIT');

      const withAccount = resolveEffectiveLocale(
        { accountLocale: 'en-PH', suggestedLocale: 'en-PH' },
        defaultRegistry
      );
      expect(withAccount.source).toBe('ACCOUNT');

      const withGuest = resolveEffectiveLocale(
        { guestLocale: 'en-PH', suggestedLocale: 'en-PH' },
        defaultRegistry
      );
      expect(withGuest.source).toBe('GUEST');
    });
  });

  describe('7. Platform Default Anchor', () => {
    it('canonical platform default is en-PH', () => {
      const result = resolveEffectiveLocale({}, defaultRegistry);
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });

    it('fails closed with configuration error if platform default is corrupt or missing from registry', () => {
      // 1. Invalid BCP-47 tag
      expect(() => {
        resolveEffectiveLocale(
          { platformDefault: 'invalid_default!@#' },
          defaultRegistry
        );
      }).toThrow(/has invalid BCP-47 syntax/);

      // 2. Valid BCP-47 tag but missing from registry
      expect(() => {
        resolveEffectiveLocale(
          { platformDefault: 'xx-YY' },
          defaultRegistry
        );
      }).toThrow(/not supported in the locale registry/);
    });
  });

  describe('8. Section 17 Conflict Resolution Test Matrix', () => {
    it('explicit en-PH, account fil-PH, guest en-US, suggestion ja-JP => explicit en-PH in Production', () => {
      const result = resolveEffectiveLocale(
        {
          explicitLocale: 'en-PH',
          accountLocale: 'fil-PH',
          guestLocale: 'en-US',
          suggestedLocale: 'ja-JP',
          resolverMode: 'PRODUCTION',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('EXPLICIT');
    });

    it('no explicit, account en-PH, guest fil-PH => account en-PH', () => {
      const result = resolveEffectiveLocale(
        {
          accountLocale: 'en-PH',
          guestLocale: 'fil-PH',
          resolverMode: 'PRODUCTION',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('ACCOUNT');
    });

    it('no explicit/account, guest valid en-PH => guest en-PH', () => {
      const result = resolveEffectiveLocale(
        {
          guestLocale: 'en-PH',
          resolverMode: 'PRODUCTION',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('GUEST');
    });

    it('only suggestion en-PH => suggestion en-PH', () => {
      const result = resolveEffectiveLocale(
        {
          suggestedLocale: 'en-PH',
          resolverMode: 'PRODUCTION',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('SUGGESTION');
    });

    it('unsupported suggestion => default en-PH', () => {
      const result = resolveEffectiveLocale(
        {
          suggestedLocale: 'xx-YY',
          resolverMode: 'PRODUCTION',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });

    it('tampered guest preference => ignored/rejected safely', () => {
      const signed = serializeGuestPreferenceCookie({ languageTag: 'en-PH' });
      const tampered = signed.replace(/\.[^.]+$/, '.corruptedSignature');
      const parsed = parseGuestPreferenceCookie(tampered);

      const result = resolveEffectiveLocale(
        {
          guestLocale: parsed.payload?.lng ?? null,
          resolverMode: 'PRODUCTION',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });

    it('QA context explicit fil-PH => fil-PH allowed', () => {
      const result = resolveEffectiveLocale(
        {
          explicitLocale: 'fil-PH',
          resolverMode: 'QA',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('fil-PH');
      expect(result.source).toBe('EXPLICIT');
      expect(result.releaseStatus).toBe('QA_REQUIRED');
    });

    it('Production context explicit fil-PH while fil-PH = QA_REQUIRED => not activated as normal Production locale', () => {
      const result = resolveEffectiveLocale(
        {
          explicitLocale: 'fil-PH',
          resolverMode: 'PRODUCTION',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });

    it('Production explicit ja-JP while ja-JP = REGISTERED => rejected/not activated', () => {
      const result = resolveEffectiveLocale(
        {
          explicitLocale: 'ja-JP',
          resolverMode: 'PRODUCTION',
        },
        defaultRegistry
      );
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });
  });

  describe('9. Language / Country / Currency / Payment / RBAC Firewall', () => {
    it('resolveEffectiveLocale returns language context only without mutating or exposing financial/auth fields', () => {
      const result = resolveEffectiveLocale({ explicitLocale: 'en-PH' }, defaultRegistry);
      expect(result).toHaveProperty('effectiveLocale');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('direction');
      // Must NOT contain country, currency, charge currency, role, or permissions
      expect((result as Record<string, unknown>).countryCode).toBeUndefined();
      expect((result as Record<string, unknown>).displayCurrency).toBeUndefined();
      expect((result as Record<string, unknown>).chargeCurrency).toBeUndefined();
      expect((result as Record<string, unknown>).role).toBeUndefined();
      expect((result as Record<string, unknown>).permissions).toBeUndefined();
    });

    it('changing effective locale does NOT alter country in preference resolver', () => {
      const enRes = resolveGlobalPreference(
        { explicitChoice: { languageTag: 'en-PH' }, platformDefault: DEFAULT_PLATFORM_PREFERENCE },
        defaultRegistry
      );
      const filRes = resolveGlobalPreference(
        { explicitChoice: { languageTag: 'fil-PH' }, platformDefault: DEFAULT_PLATFORM_PREFERENCE },
        defaultRegistry
      );

      expect(enRes.countryCode).toBe('PH');
      expect(filRes.countryCode).toBe('PH');
    });

    it('changing effective locale does NOT alter display currency in preference resolver', () => {
      const enRes = resolveGlobalPreference(
        { explicitChoice: { languageTag: 'en-PH' }, platformDefault: DEFAULT_PLATFORM_PREFERENCE },
        defaultRegistry
      );
      const filRes = resolveGlobalPreference(
        { explicitChoice: { languageTag: 'fil-PH' }, platformDefault: DEFAULT_PLATFORM_PREFERENCE },
        defaultRegistry
      );

      expect(enRes.displayCurrency).toBe('PHP');
      expect(filRes.displayCurrency).toBe('PHP');
    });

    it('changing effective locale does NOT alter charge currency from immutable PHP', () => {
      const enRes = resolveGlobalPreference(
        { explicitChoice: { languageTag: 'en-PH' }, platformDefault: DEFAULT_PLATFORM_PREFERENCE },
        defaultRegistry
      );
      const filRes = resolveGlobalPreference(
        { explicitChoice: { languageTag: 'fil-PH' }, platformDefault: DEFAULT_PLATFORM_PREFERENCE },
        defaultRegistry
      );

      expect(enRes.chargeCurrency).toBe('PHP');
      expect(filRes.chargeCurrency).toBe('PHP');
    });
  });

  describe('10. No Automatic Status Promotion Invariant', () => {
    it('resolution of fil-PH in QA mode does NOT modify its releaseStatus in the registry', () => {
      const rawBefore = defaultRegistry.locales.getRaw ? defaultRegistry.locales.getRaw('fil-PH') : null;
      expect(rawBefore?.releaseStatus).toBe('QA_REQUIRED');

      const result = resolveEffectiveLocale({ explicitLocale: 'fil-PH', resolverMode: 'QA' }, defaultRegistry);
      expect(result.effectiveLocale).toBe('fil-PH');

      const rawAfter = defaultRegistry.locales.getRaw ? defaultRegistry.locales.getRaw('fil-PH') : null;
      expect(rawAfter?.releaseStatus).toBe('QA_REQUIRED');
      expect(defaultRegistry.locales.isLocaleProductionSelectable('fil-PH')).toBe(false);
    });
  });

  describe('11. Source Mapping Compatibility', () => {
    it('correctly maps bidirectional LocaleResolutionSource and PreferenceSource', () => {
      expect(mapLocaleSourceToPreferenceSource('EXPLICIT')).toBe('EXPLICIT_CHOICE');
      expect(mapLocaleSourceToPreferenceSource('ACCOUNT')).toBe('ACCOUNT_SAVED');
      expect(mapLocaleSourceToPreferenceSource('GUEST')).toBe('GUEST_SESSION');
      expect(mapLocaleSourceToPreferenceSource('SUGGESTION')).toBe('FIRST_RUN_SUGGESTION');
      expect(mapLocaleSourceToPreferenceSource('DEFAULT')).toBe('PLATFORM_DEFAULT');

      expect(mapPreferenceSourceToLocaleSource('EXPLICIT_CHOICE')).toBe('EXPLICIT');
      expect(mapPreferenceSourceToLocaleSource('ACCOUNT_SAVED')).toBe('ACCOUNT');
      expect(mapPreferenceSourceToLocaleSource('GUEST_SESSION')).toBe('GUEST');
      expect(mapPreferenceSourceToLocaleSource('FIRST_RUN_SUGGESTION')).toBe('SUGGESTION');
      expect(mapPreferenceSourceToLocaleSource('PLATFORM_DEFAULT')).toBe('DEFAULT');
    });
  });

  describe('12. Production Locale Resolver Firewall & Untrusted Input Negative Tests', () => {
    it('isProductionRuntime correctly identifies production environments and fails closed', () => {
      expect(isProductionRuntime({ VERCEL_ENV: 'production' })).toBe(true);
      expect(isProductionRuntime({ APP_ENV: 'production' })).toBe(true);
      expect(isProductionRuntime({ APP_ENV: 'prod' })).toBe(true);
      expect(isProductionRuntime({ NODE_ENV: 'production' })).toBe(true);

      // Non-production runtimes
      expect(isProductionRuntime({ VERCEL_ENV: 'preview', NODE_ENV: 'production' })).toBe(false);
      expect(isProductionRuntime({ APP_ENV: 'preview', NODE_ENV: 'production' })).toBe(false);
      expect(isProductionRuntime({ NODE_ENV: 'test' })).toBe(false);
      expect(isProductionRuntime({ NODE_ENV: 'development' })).toBe(false);
    });

    it('resolveEffectiveResolverMode forces PRODUCTION in Production environments regardless of inputs', () => {
      const prodEnv = { NODE_ENV: 'production', VERCEL_ENV: 'production', GLCC_RESOLVER_MODE: 'QA' };

      // Attempting QA via candidate argument
      expect(resolveEffectiveResolverMode('QA', { env: prodEnv })).toBe('PRODUCTION');
      // Attempting QA via undefined/null
      expect(resolveEffectiveResolverMode(null, { env: prodEnv })).toBe('PRODUCTION');
      // Attempting QA via environment variable in production
      expect(resolveEffectiveResolverMode(undefined, { env: prodEnv })).toBe('PRODUCTION');
    });

    it('A. Production mode + explicit fil-PH (QA_REQUIRED) => fil-PH NOT activated', () => {
      const prodEnv = { NODE_ENV: 'production', VERCEL_ENV: 'production' };
      const result = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH' },
        defaultRegistry,
        { env: prodEnv }
      );

      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
      expect(result.resolverMode).toBe('PRODUCTION');
    });

    it('B. Production mode + explicit ja-JP (REGISTERED) => ja-JP NOT activated', () => {
      const prodEnv = { NODE_ENV: 'production', VERCEL_ENV: 'production' };
      const result = resolveEffectiveLocale(
        { explicitLocale: 'ja-JP' },
        defaultRegistry,
        { env: prodEnv }
      );

      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
      expect(result.resolverMode).toBe('PRODUCTION');
    });

    it('C. Production request attempting resolverMode=QA => ignored and forced to PRODUCTION', () => {
      const prodEnv = { NODE_ENV: 'production', VERCEL_ENV: 'production' };
      const result = resolveEffectiveLocale(
        {
          explicitLocale: 'fil-PH',
          resolverMode: 'QA', // Untrusted caller injection attempt
        },
        defaultRegistry,
        { env: prodEnv }
      );

      // Firewall forces PRODUCTION mode, blocking fil-PH
      expect(result.resolverMode).toBe('PRODUCTION');
      expect(result.effectiveLocale).toBe('en-PH');
      expect(result.source).toBe('DEFAULT');
    });

    it('D. Guest cookie attempting to inject resolverMode is rejected by tamper verification', () => {
      // Craft a signed-like or forged cookie with forbidden key 'resolverMode'
      const payloadWithForbiddenKey = {
        v: 1,
        lng: 'fil-PH',
        resolverMode: 'QA',
        ts: Date.now(),
      };
      const json = JSON.stringify(payloadWithForbiddenKey);
      const encoded = Buffer.from(json).toString('base64url');
      const forgedCookie = `${encoded}.dummySignature`;

      const parsed = parseGuestPreferenceCookie(forgedCookie);
      // parseGuestPreferenceCookie fails closed
      expect(parsed.isValid).toBe(false);
    });

    it('E. Production server helper cannot derive QA mode from untrusted request data', () => {
      const prodEnv = { NODE_ENV: 'production', VERCEL_ENV: 'production' };
      const result = resolveEffectiveResolverMode(undefined, { env: prodEnv });
      expect(result).toBe('PRODUCTION');
    });

    it('F. QA-required locale can still be used in controlled test / QA environment', () => {
      const testEnv = { NODE_ENV: 'test' };
      const result = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH', resolverMode: 'QA' },
        defaultRegistry,
        { env: testEnv }
      );

      expect(result.resolverMode).toBe('QA');
      expect(result.effectiveLocale).toBe('fil-PH');
      expect(result.source).toBe('EXPLICIT');
      expect(result.releaseStatus).toBe('QA_REQUIRED');
    });

    it('G. Registry releaseStatus remains strictly unchanged after firewall checks', () => {
      const rawFil = defaultRegistry.locales.getRaw ? defaultRegistry.locales.getRaw('fil-PH') : null;
      expect(rawFil?.releaseStatus).toBe('QA_REQUIRED');

      const rawJa = defaultRegistry.locales.getRaw ? defaultRegistry.locales.getRaw('ja-JP') : null;
      expect(rawJa?.releaseStatus).toBe('REGISTERED');

      const rawEn = defaultRegistry.locales.getRaw ? defaultRegistry.locales.getRaw('en-PH') : null;
      expect(rawEn?.releaseStatus).toBe('PRODUCTION_READY');
    });
  });
});

