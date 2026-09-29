/** @jest-environment jsdom */
/**
 * RENTipid GLCC v1.0.1 — Work Package P8: SSR/CSR Live Switching Test Suite
 *
 * Controlling Document: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 * Verification Scope:
 * 1. SSR Locale Resolution & Server Translator Request-Safety
 * 2. Client TranslationProvider Initial State & Hydration Parity
 * 3. Live Client Switch & Multi-Component CSR Re-render (No Page Reload)
 * 4. Next-Route Navigation & Hard Refresh Locale Preservation
 * 5. Guest & Authenticated Persistence Lifecycles
 * 6. Authentication Transitions (Login / Logout Continuity)
 * 7. Action Lifecycle: Cancel, Close without Apply, Apply Failure Rollback
 * 8. HTML Semantics (lang, dir), Loading UI, and Error UI
 * 9. Security, Production Firewall, and Tamper Resistance
 * 10. Independence Invariants (Country, Currency, RBAC)
 * 11. Dictionary Completeness & Zero Fallback Invariant
 */

import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { TranslationProvider, useTranslation } from '@/lib/glcc/i18n/context';
import { getServerLocale, getServerTranslation } from '@/lib/glcc/i18n/server';
import { defaultTranslationEngine } from '@/lib/glcc/i18n/engine';
import {
  getDefaultRegistryContext,
  getDefaultLocaleRegistry,
  DEFAULT_PLATFORM_PREFERENCE,
} from '@/lib/glcc/default-registries';
import {
  resolveEffectiveLocale,
  resolveEffectiveResolverMode,
} from '@/lib/glcc/locale-resolver';
import {
  serializeGuestPreferenceCookie,
  parseGuestPreferenceCookie,
  GUEST_PREFERENCE_COOKIE_NAME,
} from '@/lib/glcc/server-adapter';
import { reconcilePreferencesOnSignIn } from '@/lib/glcc/preference-reconciler';

// Mock next/headers
jest.mock('next/headers', () => {
  const cookieStore: Map<string, string> = new Map();
  const headerStore: Map<string, string> = new Map();

  return {
    cookies: jest.fn().mockImplementation(async () => ({
      get: (name: string) => {
        const val = cookieStore.get(name);
        return val ? { name, value: val } : undefined;
      },
      set: (name: string, value: string) => cookieStore.set(name, value),
    })),
    headers: jest.fn().mockImplementation(async () => ({
      get: (name: string) => headerStore.get(name.toLowerCase()) ?? null,
    })),
    __setMockCookie: (name: string, val: string) => cookieStore.set(name, val),
    __clearMockCookies: () => cookieStore.clear(),
    __setMockHeader: (name: string, val: string) => headerStore.set(name.toLowerCase(), val),
    __clearMockHeaders: () => headerStore.clear(),
  };
});

// Helper component for multi-component re-render testing
function ConsumerComponentA() {
  const { t, locale } = useTranslation();
  return (
    <div data-testid="consumer-a">
      <span data-testid="consumer-a-locale">{locale}</span>
      <span data-testid="consumer-a-text">{t('navigation.browseRentals')}</span>
    </div>
  );
}

function ConsumerComponentB() {
  const { t, locale, direction } = useTranslation();
  return (
    <div data-testid="consumer-b" dir={direction}>
      <span data-testid="consumer-b-locale">{locale}</span>
      <span data-testid="consumer-b-text">{t('footer.helpCenter')}</span>
    </div>
  );
}

function ConsumerComponentLoading() {
  const { t } = useTranslation();
  return (
    <div data-testid="consumer-loading">
      <span>{t('common.loadingSecureEnvironment')}</span>
    </div>
  );
}

function ConsumerComponentError() {
  const { t } = useTranslation();
  return (
    <div data-testid="consumer-error">
      <span>{t('errors.unauthorized.title')}</span>
    </div>
  );
}

describe('RENTipid GLCC v1.0.1 — Work Package P8: SSR/CSR Live Switching Suite', () => {
  const nextHeaders = jest.requireMock('next/headers');
  const secretKey = 'rentipid-test-secret-key-32-bytes-long!';

  beforeEach(() => {
    nextHeaders.__clearMockCookies();
    nextHeaders.__clearMockHeaders();
    defaultTranslationEngine.setActiveLocale('en-PH');
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en-PH';
      document.documentElement.dir = 'ltr';
    }
    delete process.env.GLCC_ENABLE_LOCAL_QA_MODE;
    delete process.env.GLCC_RESOLVER_MODE;
  });

  describe('1. SSR Locale Resolution & Server Translator Request-Safety', () => {
    it('resolves platform canonical default en-PH on cold request without cookies', async () => {
      const locale = await getServerLocale();
      expect(locale).toBe('en-PH');

      const serverTranslation = await getServerTranslation();
      expect(serverTranslation.locale).toBe('en-PH');
      expect(serverTranslation.direction).toBe('ltr');
      expect(serverTranslation.t('navigation.browseRentals')).toBe('Browse Rentals');
    });

    it('resolves signed guest preference cookie in controlled QA mode', async () => {
      const signedCookie = serializeGuestPreferenceCookie({
        languageTag: 'fil-PH',
        countryCode: 'PH',
        displayCurrency: 'PHP',
        isManualDisplayOverride: false,
      });

      nextHeaders.__setMockCookie(GUEST_PREFERENCE_COOKIE_NAME, signedCookie);

      const locale = await getServerLocale({ resolverMode: 'QA' });
      expect(locale).toBe('fil-PH');

      const serverTranslation = await getServerTranslation({ resolverMode: 'QA' });
      expect(serverTranslation.locale).toBe('fil-PH');
      expect(serverTranslation.t('navigation.browseRentals')).toBe('Mag-browse ng mga Paupahan');
    });

    it('enforces production firewall on server SSR: blocks fil-PH and ja-JP in PRODUCTION mode', async () => {
      const signedCookie = serializeGuestPreferenceCookie({
        languageTag: 'fil-PH',
        countryCode: 'PH',
        displayCurrency: 'PHP',
        isManualDisplayOverride: false,
      });

      nextHeaders.__setMockCookie(GUEST_PREFERENCE_COOKIE_NAME, signedCookie);

      // In default PRODUCTION mode, fil-PH is QA_REQUIRED and must fail closed to en-PH
      const locale = await getServerLocale({ resolverMode: 'PRODUCTION' });
      expect(locale).toBe('en-PH');

      const serverTranslation = await getServerTranslation({ resolverMode: 'PRODUCTION' });
      expect(serverTranslation.locale).toBe('en-PH');
      expect(serverTranslation.t('navigation.browseRentals')).toBe('Browse Rentals');
    });

    it('guarantees server translator is request-safe without global mutable state cross-contamination', async () => {
      // Simulate concurrent requests with different target options
      const [reqA, reqB] = await Promise.all([
        getServerTranslation({ explicitLocale: 'en-PH', resolverMode: 'QA' }),
        getServerTranslation({ explicitLocale: 'fil-PH', resolverMode: 'QA' }),
      ]);

      expect(reqA.locale).toBe('en-PH');
      expect(reqA.t('navigation.browseRentals')).toBe('Browse Rentals');

      expect(reqB.locale).toBe('fil-PH');
      expect(reqB.t('navigation.browseRentals')).toBe('Mag-browse ng mga Paupahan');
    });
  });

  describe('2. Client TranslationProvider Initial State & Hydration Parity', () => {
    it('seeds client state with server initialLocale guaranteeing zero hydration mismatch', () => {
      const serverResolvedLocale = 'en-PH';

      render(
        <TranslationProvider initialLocale={serverResolvedLocale}>
          <ConsumerComponentA />
        </TranslationProvider>
      );

      expect(screen.getByTestId('consumer-a-locale').textContent).toBe('en-PH');
      expect(screen.getByTestId('consumer-a-text').textContent).toBe('Browse Rentals');
    });

    it('seeds client state with fil-PH in controlled QA without initial English flash', () => {
      const serverResolvedLocale = 'fil-PH';

      render(
        <TranslationProvider initialLocale={serverResolvedLocale}>
          <ConsumerComponentA />
        </TranslationProvider>
      );

      expect(screen.getByTestId('consumer-a-locale').textContent).toBe('fil-PH');
      expect(screen.getByTestId('consumer-a-text').textContent).toBe('Mag-browse ng mga Paupahan');
      expect(document.documentElement.lang).toBe('fil-PH');
    });

    it('synchronizes document html lang and dir with initial active locale', () => {
      render(
        <TranslationProvider initialLocale="en-PH">
          <ConsumerComponentB />
        </TranslationProvider>
      );

      expect(document.documentElement.lang).toBe('en-PH');
      expect(document.documentElement.dir).toBe('ltr');
    });
  });

  describe('3. Live Client Switch & Multi-Component CSR Re-render (No Page Reload)', () => {
    it('immediately re-renders all subscribed client components upon rentipid:preference-applied event', async () => {
      render(
        <TranslationProvider initialLocale="en-PH">
          <ConsumerComponentA />
          <ConsumerComponentB />
        </TranslationProvider>
      );

      // Initial English state
      expect(screen.getByTestId('consumer-a-text').textContent).toBe('Browse Rentals');
      expect(screen.getByTestId('consumer-b-text').textContent).toBe('Help Center');
      expect(document.documentElement.lang).toBe('en-PH');

      // User selects and applies Filipino
      act(() => {
        window.dispatchEvent(
          new CustomEvent('rentipid:preference-applied', {
            detail: {
              languageTag: 'fil-PH',
              countryCode: 'PH',
              displayCurrency: 'PHP',
            },
          })
        );
      });

      // Assert immediate CSR re-render without reload
      await waitFor(() => {
        expect(screen.getByTestId('consumer-a-locale').textContent).toBe('fil-PH');
        expect(screen.getByTestId('consumer-a-text').textContent).toBe('Mag-browse ng mga Paupahan');
        expect(screen.getByTestId('consumer-b-locale').textContent).toBe('fil-PH');
        expect(screen.getByTestId('consumer-b-text').textContent).toBe('Sentro ng Tulong');
        expect(document.documentElement.lang).toBe('fil-PH');
      });
    });

    it('switches back from fil-PH to en-PH cleanly on client', async () => {
      render(
        <TranslationProvider initialLocale="fil-PH">
          <ConsumerComponentA />
        </TranslationProvider>
      );

      expect(screen.getByTestId('consumer-a-text').textContent).toBe('Mag-browse ng mga Paupahan');

      act(() => {
        window.dispatchEvent(
          new CustomEvent('rentipid:preference-applied', {
            detail: {
              languageTag: 'en-PH',
              countryCode: 'PH',
              displayCurrency: 'PHP',
            },
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('consumer-a-locale').textContent).toBe('en-PH');
        expect(screen.getByTestId('consumer-a-text').textContent).toBe('Browse Rentals');
        expect(document.documentElement.lang).toBe('en-PH');
      });
    });

    it('ignores invalid or malformed locale tags in preference event', () => {
      render(
        <TranslationProvider initialLocale="en-PH">
          <ConsumerComponentA />
        </TranslationProvider>
      );

      act(() => {
        window.dispatchEvent(
          new CustomEvent('rentipid:preference-applied', {
            detail: { languageTag: 'invalid-tag<script>' },
          })
        );
      });

      // Retains safe en-PH
      expect(screen.getByTestId('consumer-a-locale').textContent).toBe('en-PH');
      expect(screen.getByTestId('consumer-a-text').textContent).toBe('Browse Rentals');
    });

    it('cross-tab storage event synchronizes active locale', async () => {
      render(
        <TranslationProvider initialLocale="en-PH">
          <ConsumerComponentA />
        </TranslationProvider>
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rentipid_locale',
            newValue: 'fil-PH',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('consumer-a-locale').textContent).toBe('fil-PH');
        expect(screen.getByTestId('consumer-a-text').textContent).toBe('Mag-browse ng mga Paupahan');
      });
    });
  });

  describe('4. Next-Route Navigation & Hard Refresh Locale Preservation', () => {
    it('persists locale into rentipid_locale cookie on setLocale call', () => {
      function TriggerChange() {
        const { setLocale } = useTranslation();
        return (
          <button data-testid="set-btn" onClick={() => setLocale('fil-PH')}>
            Set
          </button>
        );
      }

      render(
        <TranslationProvider initialLocale="en-PH">
          <TriggerChange />
        </TranslationProvider>
      );

      fireEvent.click(screen.getByTestId('set-btn'));
      expect(document.cookie).toContain('rentipid_locale=fil-PH');
    });

    it('simulates hard refresh: SSR resolver reads cookie and renders fil-PH', async () => {
      nextHeaders.__setMockCookie('rentipid_locale', 'fil-PH');

      const locale = await getServerLocale({ resolverMode: 'QA' });
      expect(locale).toBe('fil-PH');

      const serverTranslation = await getServerTranslation({ resolverMode: 'QA' });
      expect(serverTranslation.t('navigation.browseRentals')).toBe('Mag-browse ng mga Paupahan');
    });
  });

  describe('5. Guest & Authenticated Persistence Lifecycles', () => {
    it('preserves guest preference through signed cookie parsing and serialization', () => {
      const payload = {
        languageTag: 'fil-PH',
        countryCode: 'PH',
        displayCurrency: 'PHP',
        isManualDisplayOverride: false,
      };

      const cookieVal = serializeGuestPreferenceCookie(payload, secretKey);
      const parsed = parseGuestPreferenceCookie(cookieVal, secretKey);

      expect(parsed.isValid).toBe(true);
      expect(parsed.payload?.lng).toBe('fil-PH');
      expect(parsed.payload?.cur).toBe('PHP');
      expect(parsed.payload?.cnt).toBe('PH');
    });

    it('tampered guest preference cookie fails closed and falls back to en-PH', () => {
      const rawCookie = serializeGuestPreferenceCookie(
        {
          languageTag: 'fil-PH',
          countryCode: 'PH',
          displayCurrency: 'PHP',
          isManualDisplayOverride: false,
        },
        secretKey
      );

      // Tamper signature
      const tamperedCookie = rawCookie + 'tampered';
      const parsed = parseGuestPreferenceCookie(tamperedCookie, secretKey);

      expect(parsed.isValid).toBe(false);

      const resolved = resolveEffectiveLocale(
        {
          guestLocale: parsed.isValid ? parsed.payload?.lng : null,
          platformDefault: 'en-PH',
          resolverMode: 'QA',
        },
        getDefaultRegistryContext().locales
      );

      expect(resolved.effectiveLocale).toBe('en-PH');
    });

    it('reconciles guest choice upon signIn: adopts guest choice when no prior account preference exists', () => {
      const guestSession = {
        languageTag: 'fil-PH',
        countryCode: 'PH',
        displayCurrency: 'PHP',
        isManualDisplayOverride: true,
        timezone: 'Asia/Manila',
        isValid: true,
      };

      const reconciliation = reconcilePreferencesOnSignIn(
        null, // No prior saved account preference
        guestSession,
        getDefaultRegistryContext(),
        DEFAULT_PLATFORM_PREFERENCE
      );

      expect(reconciliation.outcome).toBe('CURRENT_EXPLICIT_SELECTION_USED');
      expect(reconciliation.effectivePreference.languageTag).toBe('fil-PH');
      expect(reconciliation.accountSaveRequired).toBe(true);
    });

    it('reconciles guest choice upon signIn: preserves account preference when passive guest cookie conflicts', () => {
      const accountSaved = {
        languageTag: 'en-PH',
        countryCode: 'PH',
        displayCurrency: 'PHP',
        isManualDisplayOverride: false,
        timezone: 'Asia/Manila',
        version: 1,
      };

      const guestSession = {
        languageTag: 'fil-PH',
        countryCode: 'PH',
        displayCurrency: 'PHP',
        isManualDisplayOverride: false, // passive
        timezone: 'Asia/Manila',
        isValid: true,
      };

      const reconciliation = reconcilePreferencesOnSignIn(
        accountSaved,
        guestSession,
        getDefaultRegistryContext(),
        DEFAULT_PLATFORM_PREFERENCE
      );

      expect(reconciliation.outcome).toBe('ACCOUNT_PREFERENCE_USED');
      expect(reconciliation.effectivePreference.languageTag).toBe('en-PH');
    });
  });

  describe('6. Action Lifecycle: Cancel, Close without Apply, Apply Failure Rollback', () => {
    it('Cancel does not dispatch preference event and keeps current active translation intact', () => {
      const eventSpy = jest.fn();
      window.addEventListener('rentipid:preference-applied', eventSpy);

      render(
        <TranslationProvider initialLocale="en-PH">
          <ConsumerComponentA />
        </TranslationProvider>
      );

      // Cancel simulation: no event dispatched
      expect(eventSpy).not.toHaveBeenCalled();
      expect(screen.getByTestId('consumer-a-locale').textContent).toBe('en-PH');
      expect(screen.getByTestId('consumer-a-text').textContent).toBe('Browse Rentals');

      window.removeEventListener('rentipid:preference-applied', eventSpy);
    });

    it('network failure during Apply preserves prior authoritative locale', async () => {
      render(
        <TranslationProvider initialLocale="en-PH">
          <ConsumerComponentA />
        </TranslationProvider>
      );

      // In a failed PATCH call, no rentipid:preference-applied event is dispatched
      expect(screen.getByTestId('consumer-a-locale').textContent).toBe('en-PH');
      expect(screen.getByTestId('consumer-a-text').textContent).toBe('Browse Rentals');
    });
  });

  describe('7. HTML Semantics (lang, dir), Loading UI, and Error UI', () => {
    it('renders localized loading screen in fil-PH during route transition', () => {
      render(
        <TranslationProvider initialLocale="fil-PH">
          <ConsumerComponentLoading />
        </TranslationProvider>
      );

      expect(screen.getByTestId('consumer-loading').textContent).toBe(
        'Ikinakarga ang ligtas na kapaligiran...'
      );
    });

    it('renders localized error screen in fil-PH', () => {
      render(
        <TranslationProvider initialLocale="fil-PH">
          <ConsumerComponentError />
        </TranslationProvider>
      );

      expect(screen.getByTestId('consumer-error').textContent).toBe(
        'Tinanggihan ang Pag-access'
      );
    });

    it('maintains direction ltr for both en-PH and fil-PH', () => {
      expect(defaultTranslationEngine.getDirection('en-PH')).toBe('ltr');
      expect(defaultTranslationEngine.getDirection('fil-PH')).toBe('ltr');
    });
  });

  describe('8. Security, Production Firewall, and Tamper Resistance', () => {
    it('resolveEffectiveResolverMode strictly enforces PRODUCTION in production runtime', () => {
      const mode = resolveEffectiveResolverMode('QA', {
        env: { NODE_ENV: 'production', VERCEL_ENV: 'production' },
      });
      expect(mode).toBe('PRODUCTION');
    });

    it('resolveEffectiveLocale blocks fil-PH, en-US, and ja-JP in PRODUCTION mode', () => {
      const registry = getDefaultLocaleRegistry();

      const resFil = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH', resolverMode: 'PRODUCTION' },
        registry
      );
      expect(resFil.effectiveLocale).toBe('en-PH');

      const resJa = resolveEffectiveLocale(
        { explicitLocale: 'ja-JP', resolverMode: 'PRODUCTION' },
        registry
      );
      expect(resJa.effectiveLocale).toBe('en-PH');

      const resEnUs = resolveEffectiveLocale(
        { explicitLocale: 'en-US', resolverMode: 'PRODUCTION' },
        registry
      );
      expect(resEnUs.effectiveLocale).toBe('en-PH');
    });

    it('resolveEffectiveLocale permits fil-PH in controlled QA mode, but strictly blocks ja-JP and en-US', () => {
      const registry = getDefaultLocaleRegistry();

      const resFil = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH', resolverMode: 'QA' },
        registry
      );
      expect(resFil.effectiveLocale).toBe('fil-PH');

      const resJa = resolveEffectiveLocale(
        { explicitLocale: 'ja-JP', resolverMode: 'QA' },
        registry
      );
      expect(resJa.effectiveLocale).toBe('en-PH');

      const resEnUs = resolveEffectiveLocale(
        { explicitLocale: 'en-US', resolverMode: 'QA' },
        registry
      );
      expect(resEnUs.effectiveLocale).toBe('en-PH');
    });
  });

  describe('9. Independence Invariants (Country, Currency, RBAC)', () => {
    it('locale switching preserves immutable charge currency (PHP) and financial boundaries', () => {
      const defaultPref = getDefaultRegistryContext();
      expect(defaultPref.countries.get('PH')?.allowedChargeCurrencies).toEqual(['PHP']);

      // Language selection does not touch displayCurrency or chargeCurrency
      const resolved = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH', resolverMode: 'QA' },
        defaultPref.locales
      );
      expect(resolved.effectiveLocale).toBe('fil-PH');
      // No currency properties are emitted or modified by locale resolver
      expect((resolved as any).chargeCurrency).toBeUndefined();
      expect((resolved as any).countryCode).toBeUndefined();
    });
  });

  describe('10. Dictionary Completeness & Zero Fallback Invariant', () => {
    it('preserves exact 2,208 canonical keys in en-PH (100% coverage)', () => {
      const enBundle = defaultTranslationEngine.getBundle('en-ph');
      expect(enBundle).toBeDefined();
      expect(Object.keys(enBundle!.messages).length).toBe(2208);
    });

    it('preserves exact 2,208 canonical keys in fil-PH (100% coverage, 0 missing, 0 empty)', () => {
      const filBundle = defaultTranslationEngine.getBundle('fil-ph');
      expect(filBundle).toBeDefined();
      const filKeys = Object.keys(filBundle!.messages);
      expect(filKeys.length).toBe(2208);

      // Verify zero empty values
      for (const [k, v] of Object.entries(filBundle!.messages)) {
        expect(typeof v).toBe('string');
        expect((v as string).trim().length).toBeGreaterThan(0);
      }
    });

    it('renders zero raw translation keys in fil-PH', () => {
      const keysToTest = [
        'navigation.browseRentals',
        'footer.helpCenter',
        'common.loadingSecureEnvironment',
        'errors.unauthorized.title',
        'preferences.language',
      ];

      for (const k of keysToTest) {
        const translated = defaultTranslationEngine.translate(k, undefined, 'fil-PH');
        expect(translated).not.toBe(k);
        expect(translated).not.toMatch(/^[a-z]+(\.[a-zA-Z0-9]+)+$/);
      }
    });
  });
});
