/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '@/components/glcc/LanguageSelector';
import { TranslationProvider, useTranslation } from '@/lib/glcc/i18n/context';
import { getDefaultLocaleRegistry } from '@/lib/glcc/default-registries';
import {
  isProductionRuntime,
  isPreviewRuntime,
  resolveEffectiveResolverMode,
  isLocaleEligibleForMode,
} from '@/lib/glcc/locale-resolver';

describe('RENTipid GLCC v1.0.1 — Deployed Production-Build QA Policy Regression Suite (GLCC-LOC-002)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('1. Production-Build Semantics: NODE_ENV="production"', () => {
    it('Preview trusted QA policy: authorizes QA mode and makes fil-PH selectable despite NODE_ENV="production"', () => {
      // Emulate Next.js production build inlining
      const previewEnv: Record<string, string | undefined> = {
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
        NEXT_PUBLIC_VERCEL_ENV: 'preview',
        GLCC_TEST_HOSTNAME: 'preview.rentipid.com.ph',
      };

      expect(isProductionRuntime(previewEnv)).toBe(false);
      expect(isPreviewRuntime(previewEnv)).toBe(true);

      // 1. Explicit trusted QA candidate on Preview
      const effectiveMode = resolveEffectiveResolverMode('QA', { env: previewEnv });
      expect(effectiveMode).toBe('QA');

      // 2. Browser cookie signal on Preview
      document.cookie = 'glcc_qa=true; path=/';
      const effectiveModeFromCookie = resolveEffectiveResolverMode(undefined, { env: previewEnv });
      expect(effectiveModeFromCookie).toBe('QA');
      document.cookie = 'glcc_qa=; Max-Age=0; path=/';

      const registry = getDefaultLocaleRegistry();
      const filPh = registry.get('fil-PH');
      const enPh = registry.get('en-PH');
      const enUs = registry.get('en-US');
      const jaJp = registry.get('ja-JP');

      expect(isLocaleEligibleForMode(filPh, effectiveMode)).toBe(true);
      expect(isLocaleEligibleForMode(enPh, effectiveMode)).toBe(true);
      // Strictly blocked in QA mode
      expect(isLocaleEligibleForMode(enUs, effectiveMode)).toBe(false);
      expect(isLocaleEligibleForMode(jaJp, effectiveMode)).toBe(false);
    });

    it('Production policy: strictly blocks fil-PH, en-US, and ja-JP in production deployment', () => {
      const prodEnv: Record<string, string | undefined> = {
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_VERCEL_ENV: 'production',
        GLCC_TEST_HOSTNAME: 'www.rentipid.com.ph',
      };

      expect(isProductionRuntime(prodEnv)).toBe(true);
      expect(isPreviewRuntime(prodEnv)).toBe(false);

      const effectiveMode = resolveEffectiveResolverMode(undefined, { env: prodEnv });
      expect(effectiveMode).toBe('PRODUCTION');

      const registry = getDefaultLocaleRegistry();
      const filPh = registry.get('fil-PH');
      const enPh = registry.get('en-PH');
      const enUs = registry.get('en-US');
      const jaJp = registry.get('ja-JP');

      expect(isLocaleEligibleForMode(enPh, effectiveMode)).toBe(true);
      expect(isLocaleEligibleForMode(filPh, effectiveMode)).toBe(false);
      expect(isLocaleEligibleForMode(enUs, effectiveMode)).toBe(false);
      expect(isLocaleEligibleForMode(jaJp, effectiveMode)).toBe(false);
    });
  });

  describe('2. Client Parameter & Cookie Injection Attack Prevention', () => {
    it('client query (?glcc_qa=true) and cookie injection alone CANNOT enable QA mode in Production', () => {
      const prodEnv: Record<string, string | undefined> = {
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_VERCEL_ENV: 'production',
        GLCC_TEST_HOSTNAME: 'www.rentipid.com.ph',
      };

      // Attacker attempts injection via cookies and client state
      document.cookie = 'glcc_qa=true; path=/';
      document.cookie = 'rentipid_qa_mode=true; path=/';

      // Production Firewall must fail closed
      expect(isProductionRuntime(prodEnv)).toBe(true);
      expect(isPreviewRuntime(prodEnv)).toBe(false);

      // Caller requesting 'QA' mode on Production runtime must be rejected
      const effectiveMode = resolveEffectiveResolverMode('QA', { env: prodEnv });
      expect(effectiveMode).toBe('PRODUCTION');

      render(
        <TranslationProvider initialLocale="en-PH" resolverMode="PRODUCTION">
          <LanguageSelector currentLocale="en-PH" showActions={true} />
        </TranslationProvider>
      );

      // fil-PH option must be rendered as disabled (Unavailable)
      const filPhOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      expect(filPhOption.getAttribute('aria-disabled')).toBe('true');
      expect(screen.getByText('Unavailable')).toBeDefined();
    });
  });

  describe('3. Language Selector UI in Governed Preview QA Mode', () => {
    it('renders fil-PH as selectable in Preview QA mode', () => {
      render(
        <TranslationProvider initialLocale="en-PH" resolverMode="QA">
          <LanguageSelector currentLocale="en-PH" showActions={true} />
        </TranslationProvider>
      );

      const filPhOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      expect(filPhOption.getAttribute('aria-disabled')).toBe('false');

      // ja-JP and en-US remain strictly disabled
      const jaOption = screen.getByRole('option', { name: /日本語/i });
      expect(jaOption.getAttribute('aria-disabled')).toBe('true');
    });

    it('Apply fil-PH triggers actual UI locale change in context and documentElement', () => {
      function TestHost() {
        const { locale, setLocale, t } = useTranslation();
        return (
          <div>
            <span data-testid="current-locale">{locale}</span>
            <span data-testid="beta-text">{t('common.betaNotice')}</span>
            <LanguageSelector
              currentLocale={locale}
              onApply={(tag) => setLocale(tag)}
              showActions={true}
            />
          </div>
        );
      }

      render(
        <TranslationProvider initialLocale="en-PH" resolverMode="QA">
          <TestHost />
        </TranslationProvider>
      );

      expect(screen.getByTestId('current-locale').textContent).toBe('en-PH');

      // Click on Wikang Filipino
      const filPhOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      fireEvent.click(filPhOption);

      // Click Apply
      const applyBtn = screen.getByRole('button', { name: /Apply/i });
      fireEvent.click(applyBtn);

      // Verify immediate UI rerender
      expect(screen.getByTestId('current-locale').textContent).toBe('fil-PH');
      expect(document.documentElement.lang).toBe('fil-PH');
    });

    it('Cancel does not switch the active locale', () => {
      const onCancelMock = jest.fn();

      function TestHost() {
        const { locale, setLocale } = useTranslation();
        return (
          <div>
            <span data-testid="current-locale">{locale}</span>
            <LanguageSelector
              currentLocale={locale}
              onApply={(tag) => setLocale(tag)}
              onCancel={onCancelMock}
              showActions={true}
            />
          </div>
        );
      }

      render(
        <TranslationProvider initialLocale="en-PH" resolverMode="QA">
          <TestHost />
        </TranslationProvider>
      );

      expect(screen.getByTestId('current-locale').textContent).toBe('en-PH');

      // Select fil-PH
      const filPhOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      fireEvent.click(filPhOption);

      // Click Cancel
      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelBtn);

      expect(onCancelMock).toHaveBeenCalledTimes(1);
      // Locale must remain unchanged
      expect(screen.getByTestId('current-locale').textContent).toBe('en-PH');
      expect(document.documentElement.lang).toBe('en-PH');
    });
  });
});
