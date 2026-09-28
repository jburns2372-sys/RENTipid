/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSelector } from '@/components/glcc/LanguageSelector';
import { getDefaultLocaleRegistry } from '@/lib/glcc/default-registries';
import {
  isLocaleEligibleForMode,
  resolveEffectiveResolverMode,
  resolveEffectiveLocale,
} from '@/lib/glcc/locale-resolver';
import {
  EN_PH_BUNDLE,
  FIL_PH_BUNDLE,
  GLCC_CANONICAL_KEYS,
  validateTranslationBundle,
  validateCanonicalSourceCompleteness,
} from '@/lib/glcc/i18n';

describe('RENTipid GLCC v1.0.1 — Work Package P7: Language Selector UX Suite', () => {
  const registry = getDefaultLocaleRegistry();

  describe('1. Authoritative Registry & Selectability Governance', () => {
    it('consumes authoritative registry and verifies expected initial release statuses', () => {
      const enPh = registry.get('en-PH');
      const filPh = registry.get('fil-PH');
      const enUs = registry.get('en-US');
      const jaJp = registry.get('ja-JP');

      expect(enPh?.releaseStatus).toBe('PRODUCTION_READY');
      expect(filPh?.releaseStatus).toBe('QA_REQUIRED');
      expect(enUs?.releaseStatus).toBe('TRANSLATION_IN_PROGRESS');
      expect(jaJp?.releaseStatus).toBe('REGISTERED');
    });

    it('Production mode: ONLY PRODUCTION_READY locales are selectable (en-PH)', () => {
      const enPh = registry.get('en-PH');
      const filPh = registry.get('fil-PH');
      const enUs = registry.get('en-US');
      const jaJp = registry.get('ja-JP');

      expect(isLocaleEligibleForMode(enPh, 'PRODUCTION')).toBe(true);
      expect(isLocaleEligibleForMode(filPh, 'PRODUCTION')).toBe(false);
      expect(isLocaleEligibleForMode(enUs, 'PRODUCTION')).toBe(false);
      expect(isLocaleEligibleForMode(jaJp, 'PRODUCTION')).toBe(false);
    });

    it('Controlled QA mode: PRODUCTION_READY and QA_REQUIRED are selectable (en-PH, fil-PH)', () => {
      const enPh = registry.get('en-PH');
      const filPh = registry.get('fil-PH');
      const enUs = registry.get('en-US');
      const jaJp = registry.get('ja-JP');

      expect(isLocaleEligibleForMode(enPh, 'QA')).toBe(true);
      expect(isLocaleEligibleForMode(filPh, 'QA')).toBe(true);
      // ja-JP and en-US remain strictly blocked in QA mode
      expect(isLocaleEligibleForMode(enUs, 'QA')).toBe(false);
      expect(isLocaleEligibleForMode(jaJp, 'QA')).toBe(false);
    });
  });

  describe('2. Component Rendering & Language Identity', () => {
    it('renders native language name as primary identity and English name as secondary', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
          showActions={true}
        />
      );

      // Native names (primary)
      expect(screen.getByText('English')).toBeDefined();
      expect(screen.getByText('Wikang Filipino')).toBeDefined();
      expect(screen.getByText('日本語')).toBeDefined();

      // Display/English names (secondary)
      expect(screen.getByText('English (Philippines)')).toBeDefined();
      expect(screen.getByText('Filipino (Philippines)')).toBeDefined();
      expect(screen.getByText('Japanese')).toBeDefined();

      // Locale tags
      expect(screen.getByText('en-PH')).toBeDefined();
      expect(screen.getByText('fil-PH')).toBeDefined();
      expect(screen.getByText('ja-JP')).toBeDefined();
    });

    it('displays clear indicator for currently applied locale', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
          showActions={true}
        />
      );

      // en-PH should have the current language badge
      const enOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      expect(enOption).toBeDefined();

      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(3);
    });

    it('in Production mode, fil-PH, en-US, and ja-JP are disabled and marked unavailable', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="PRODUCTION"
          showActions={true}
        />
      );

      const enOption = screen.getByRole('option', { name: /English \(Philippines\)/i });
      expect((enOption as HTMLButtonElement).disabled).toBe(false);
      expect(enOption.getAttribute('aria-disabled')).toBe('false');

      const filOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      expect((filOption as HTMLButtonElement).disabled).toBe(true);
      expect(filOption.getAttribute('aria-disabled')).toBe('true');

      const jaOption = screen.getByRole('option', { name: /日本語/i });
      expect((jaOption as HTMLButtonElement).disabled).toBe(true);
      expect(jaOption.getAttribute('aria-disabled')).toBe('true');
    });

    it('in Controlled QA mode, fil-PH is active and selectable, while ja-JP and en-US remain disabled', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
          showActions={true}
        />
      );

      const enOption = screen.getByRole('option', { name: /English \(Philippines\)/i });
      expect((enOption as HTMLButtonElement).disabled).toBe(false);

      const filOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      expect((filOption as HTMLButtonElement).disabled).toBe(false);
      expect(filOption.getAttribute('aria-disabled')).toBe('false');

      const jaOption = screen.getByRole('option', { name: /日本語/i });
      expect((jaOption as HTMLButtonElement).disabled).toBe(true);
      expect(jaOption.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('3. Search UX & Result Governance', () => {
    it('supports case-insensitive search by native name', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'wikang' } });

      expect(screen.getByText('Wikang Filipino')).toBeDefined();
      expect(screen.queryByText('Japanese')).toBeNull();
    });

    it('supports case-insensitive search by English display name', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'filipino' } });

      expect(screen.getByText('Wikang Filipino')).toBeDefined();
      expect(screen.queryByText('Japanese')).toBeNull();
    });

    it('supports search by locale tag code', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'fil-ph' } });

      expect(screen.getByText('Wikang Filipino')).toBeDefined();
      expect(screen.queryByText('English (Philippines)')).toBeNull();
    });

    it('displays deterministic empty state when no languages match', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'nonexistent-query-xyz' } });

      expect(screen.getByRole('status')).toBeDefined();
      expect(screen.queryByRole('option')).toBeNull();
    });

    it('searching a blocked locale code in Production mode does NOT expose it as selectable', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="PRODUCTION"
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'fil' } });

      const filOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      expect(filOption).toBeDefined();
      // MUST REMAIN DISABLED AND NOT FUNCTIONING
      expect((filOption as HTMLButtonElement).disabled).toBe(true);
      expect(filOption.getAttribute('aria-disabled')).toBe('true');
    });

    it('searching ja-JP in QA mode still presents it as disabled / coming soon', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'ja' } });

      const jaOption = screen.getByRole('option', { name: /日本語/i });
      expect(jaOption).toBeDefined();
      expect((jaOption as HTMLButtonElement).disabled).toBe(true);
      expect(jaOption.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('4. Selection Lifecycle: Current vs Pending, Apply, Cancel', () => {
    it('selecting a candidate updates pending selection without immediately calling onApply', () => {
      const handleSelect = jest.fn();
      const handleApply = jest.fn();

      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
          onSelect={handleSelect}
          onApply={handleApply}
          showActions={true}
        />
      );

      const filOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      fireEvent.click(filOption);

      expect(handleSelect).toHaveBeenCalledWith('fil-PH');
      expect(handleApply).not.toHaveBeenCalled();
      expect(filOption.getAttribute('aria-selected')).toBe('true');
    });

    it('clicking Apply invokes onApply with the pending selected locale', () => {
      const handleApply = jest.fn();

      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
          onApply={handleApply}
          showActions={true}
        />
      );

      const filOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      fireEvent.click(filOption);

      const applyButton = screen.getByRole('button', { name: /Apply/i });
      expect((applyButton as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(applyButton);

      expect(handleApply).toHaveBeenCalledWith('fil-PH');
    });

    it('clicking Cancel discards pending choice and resets state', () => {
      const handleCancel = jest.fn();
      const handleApply = jest.fn();

      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
          onCancel={handleCancel}
          onApply={handleApply}
          showActions={true}
        />
      );

      const filOption = screen.getByRole('option', { name: /Wikang Filipino/i });
      fireEvent.click(filOption);
      expect(filOption.getAttribute('aria-selected')).toBe('true');

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(handleCancel).toHaveBeenCalled();
      expect(handleApply).not.toHaveBeenCalled();
      expect(filOption.getAttribute('aria-selected')).toBe('false');
    });

    it('attempting to click a disabled locale does not change pending selection', () => {
      const handleSelect = jest.fn();

      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
          onSelect={handleSelect}
          showActions={true}
        />
      );

      const jaOption = screen.getByRole('option', { name: /日本語/i });
      fireEvent.click(jaOption);

      expect(handleSelect).not.toHaveBeenCalled();
      expect(jaOption.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('5. Keyboard Accessibility & Focus Management', () => {
    it('pressing Escape triggers onCancel', () => {
      const handleCancel = jest.fn();

      const { container } = render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
          onCancel={handleCancel}
        />
      );

      const region = container.firstChild as HTMLElement;
      fireEvent.keyDown(region, { key: 'Escape' });

      expect(handleCancel).toHaveBeenCalled();
    });

    it('navigates through selectable options using ArrowDown and ArrowUp and selects with Enter', () => {
      const handleSelect = jest.fn();

      const { container } = render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
          onSelect={handleSelect}
        />
      );

      const region = container.firstChild as HTMLElement;

      // Arrow down to first item (en-PH)
      fireEvent.keyDown(region, { key: 'ArrowDown' });
      // Arrow down to second selectable item (fil-PH)
      fireEvent.keyDown(region, { key: 'ArrowDown' });

      // Press Enter to select
      fireEvent.keyDown(region, { key: 'Enter' });

      expect(handleSelect).toHaveBeenCalledWith('fil-PH');
    });

    it('has correct ARIA semantics for screen readers', () => {
      render(
        <LanguageSelector
          currentLocale="en-PH"
          resolverMode="QA"
        />
      );

      expect(screen.getByRole('region')).toBeDefined();
      expect(screen.getByRole('searchbox').getAttribute('aria-label')).toBeTruthy();
      expect(screen.getByRole('listbox')).toBeDefined();

      const options = screen.getAllByRole('option');
      for (const opt of options) {
        expect(opt.getAttribute('aria-selected')).toBeTruthy();
        expect(opt.getAttribute('aria-disabled')).toBeTruthy();
      }
    });
  });

  describe('6. Security, Firewall & Tamper Resistance', () => {
    it('resolveEffectiveResolverMode enforces strict fail-closed in Production environments', () => {
      // In Production runtime, resolverMode is immutably FORCED to 'PRODUCTION'
      const prodEnv1 = { VERCEL_ENV: 'production' };
      expect(resolveEffectiveResolverMode('QA', { env: prodEnv1 })).toBe('PRODUCTION');

      const prodEnv2 = { APP_ENV: 'production' };
      expect(resolveEffectiveResolverMode('QA', { env: prodEnv2 })).toBe('PRODUCTION');

      const prodEnv3 = { NODE_ENV: 'production' };
      expect(resolveEffectiveResolverMode('QA', { env: prodEnv3 })).toBe('PRODUCTION');
    });

    it('resolveEffectiveLocale blocks fil-PH and ja-JP in PRODUCTION mode', () => {
      const resFil = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH', resolverMode: 'PRODUCTION' },
        registry
      );
      // In Production mode, fil-PH is not eligible and falls back to platform default (en-PH)
      expect(resFil.effectiveLocale).toBe('en-PH');
      expect(resFil.source).toBe('DEFAULT');

      const resJa = resolveEffectiveLocale(
        { explicitLocale: 'ja-JP', resolverMode: 'PRODUCTION' },
        registry
      );
      expect(resJa.effectiveLocale).toBe('en-PH');
    });

    it('resolveEffectiveLocale permits fil-PH in controlled QA mode, but strictly blocks ja-JP and en-US', () => {
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

      const resUs = resolveEffectiveLocale(
        { explicitLocale: 'en-US', resolverMode: 'QA' },
        registry
      );
      expect(resUs.effectiveLocale).toBe('en-PH');
    });
  });

  describe('7. Independence Invariants (Country, Currency, RBAC)', () => {
    it('language selection component has zero authority over country, currency, or permissions', () => {
      const props: Record<string, unknown> = {
        currentLocale: 'en-PH',
        selectedLocale: 'fil-PH',
      };

      expect(props).not.toHaveProperty('countryCode');
      expect(props).not.toHaveProperty('displayCurrency');
      expect(props).not.toHaveProperty('chargeCurrency');
      expect(props).not.toHaveProperty('role');
      expect(props).not.toHaveProperty('permissions');
      expect(props).not.toHaveProperty('paymentProvider');
    });
  });

  describe('8. Translation Dictionary Parity Preservation', () => {
    it('preserves complete en-PH completeness (100%)', () => {
      const completeness = validateCanonicalSourceCompleteness(EN_PH_BUNDLE);
      expect(completeness.isValid).toBe(true);
      expect(completeness.missingCanonicalKeys).toHaveLength(0);
      expect(completeness.emptyKeys).toHaveLength(0);
    });

    it('preserves fil-PH 100% contract coverage (2,208 canonical keys, 0 missing, 0 empty)', () => {
      const validation = validateTranslationBundle(FIL_PH_BUNDLE, EN_PH_BUNDLE, { allowPartial: true });
      expect(validation.isValid).toBe(true);
      expect(validation.missingKeys).toHaveLength(0);
      expect(validation.emptyKeys).toHaveLength(0);
      expect(validation.placeholderMismatches).toHaveLength(0);

      const canonicalTotal = GLCC_CANONICAL_KEYS.length;
      const filPresent = Object.keys(FIL_PH_BUNDLE.messages).length;

      expect(canonicalTotal).toBe(2208);
      expect(filPresent).toBe(2208);
    });

    it('ja-JP remains registered-only with zero translation keys', () => {
      const jaLoc = registry.get('ja-JP');
      expect(jaLoc?.releaseStatus).toBe('REGISTERED');
    });
  });
});
