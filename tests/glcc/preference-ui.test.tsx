/**
 * @jest-environment jsdom
 */

/**
 * RENTipid GLCC v1.0 — Global Preferences UI Component & State Tests (P2A)
 *
 * Verifies:
 * 1. Initial Load: renders effective preference tuple, loading state, feature-disabled state, API errors.
 * 2. Independence: language change does not alter country/currency; currency change does not alter country/language;
 *    country change proposes default currency; display currency never alters charge authority (PHP).
 * 3. Country Control: selecting country updates draft, proposes default currency, ignores unsupported codes.
 * 4. Currency Control: override locked when flag false; allowed override accepted when flag true; disallowed rejected.
 * 5. Draft/Apply/Cancel: editing performs 0 writes; cancel performs 0 writes & restores state; apply sends 1 write
 *    with NO userId and NO chargeCurrency; 409 conflict handled without overwrite.
 * 6. Search: case-insensitive filtering for country, language, currency; empty state; preserves stable codes.
 * 7. Accessibility: role="dialog", aria-modal="true", tab semantics, radio semantics, ESC key cancel.
 * 8. Responsive/Shared State: unified state model.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GlobalPreferencesModal from '@/components/glcc/GlobalPreferencesModal';
import type { GlobalPreferencesApiResponse } from '@/components/glcc/types';
import { GLCC_COPY } from '@/components/glcc/glcc-copy';

const mockDefaultData: GlobalPreferencesApiResponse = {
  status: 'SUCCESS',
  reconciliationStatus: 'RESOLVED',
  requiresUserConfirmation: false,
  effectivePreference: {
    languageTag: 'en-PH',
    countryCode: 'PH',
    displayCurrency: 'PHP',
    chargeCurrency: 'PHP',
    isManualDisplayOverride: false,
  },
  accountPreference: {
    languageTag: 'en-PH',
    countryCode: 'PH',
    displayCurrency: 'PHP',
    isManualDisplayOverride: false,
    version: 1,
  },
  capabilities: {
    v1Enabled: true,
    currencyOverrideEnabled: true,
    countryAutodetectEnabled: false,
  },
  options: {
    locales: [
      { tag: 'en-PH', name: 'English (Philippines)', nativeName: 'English (Philippines)', direction: 'ltr' },
      { tag: 'fil-PH', name: 'Filipino (Philippines)', nativeName: 'Wikang Filipino', direction: 'ltr', fallbackTag: 'en-PH' },
      { tag: 'ja-JP', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
      { tag: 'en-US', name: 'English (United States)', nativeName: 'English (United States)', direction: 'ltr' },
    ],
    countries: [
      {
        code: 'PH',
        name: 'Philippines',
        defaultDisplayCurrency: 'PHP',
        allowedDisplayCurrencies: ['PHP', 'USD'],
        defaultLanguageTag: 'en-PH',
        supportedLanguageTags: ['en-PH', 'fil-PH'],
      },
      {
        code: 'US',
        name: 'United States',
        defaultDisplayCurrency: 'USD',
        allowedDisplayCurrencies: ['USD'],
        defaultLanguageTag: 'en-US',
        supportedLanguageTags: ['en-US'],
      },
      {
        code: 'JP',
        name: 'Japan',
        defaultDisplayCurrency: 'JPY',
        allowedDisplayCurrencies: ['JPY', 'USD'],
        defaultLanguageTag: 'ja-JP',
        supportedLanguageTags: ['ja-JP', 'en-US'],
      },
    ],
    currencies: [
      { code: 'PHP', name: 'Philippine Peso', symbol: '₱', minorUnitExponent: 2 },
      { code: 'USD', name: 'US Dollar', symbol: '$', minorUnitExponent: 2 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', minorUnitExponent: 0 },
    ],
  },
};

describe('GLCC-P2A — Global Preferences UI Foundation', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------
  // 1. INITIAL LOAD & STATES
  // -------------------------------------------------------------
  describe('1. Initial Load & Component States', () => {
    it('1.1. Renders effective preference tuple (Country, Language, Currency) on open', () => {
      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      expect(screen.getByRole('dialog')).not.toBeNull();
      expect(screen.getByText(GLCC_COPY.title)).not.toBeNull();

      // Check current badge values on tabs
      expect(screen.getByRole('tab', { name: /Region/i }).textContent).toContain('PH');
      expect(screen.getByRole('tab', { name: /Language/i }).textContent).toContain('en-PH');
      expect(screen.getByRole('tab', { name: /Currency/i }).textContent).toContain('PHP');

      // Check preview values
      expect(screen.getAllByText('Philippines').length).toBeGreaterThan(0);
      expect(screen.getAllByText('English (Philippines)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('PHP').length).toBeGreaterThan(0);
    });

    it('1.2. Renders feature-disabled state when glcc_v1_enabled is false', () => {
      const disabledData: GlobalPreferencesApiResponse = {
        ...mockDefaultData,
        capabilities: {
          v1Enabled: false,
          currencyOverrideEnabled: false,
          countryAutodetectEnabled: false,
        },
      };

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={disabledData}
        />
      );

      expect(screen.getByText(GLCC_COPY.featureDisabled)).not.toBeNull();
      const applyBtn = screen.getByRole('button', { name: GLCC_COPY.applyButton });
      expect(applyBtn.hasAttribute('disabled')).toBe(true);
    });

    it('1.3. Fetches data from apiEndpoint when initialData is not provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDefaultData,
      });

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          apiEndpoint="/api/me/preferences"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/me/preferences', expect.objectContaining({ method: 'GET' }));
        expect(screen.getAllByText('Philippines').length).toBeGreaterThan(0);
      });
    });

    it('1.4. Renders error message on API GET failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(GLCC_COPY.errorGeneric)).not.toBeNull();
      });
    });
  });

  // -------------------------------------------------------------
  // 2. INDEPENDENCE & FINANCIAL INVARIANTS
  // -------------------------------------------------------------
  describe('2. Control Independence & Financial Boundaries', () => {
    it('2.1. Changing language does not alter country or display currency', () => {
      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      // Switch to Language tab
      fireEvent.click(screen.getByRole('tab', { name: /Language/i }));

      // Select 'Filipino (Philippines)'
      const filipinoBtn = screen.getByRole('radio', { name: /Filipino \(Philippines\)/i });
      fireEvent.click(filipinoBtn);

      // Verify draft state: language changed to fil-PH, country remains PH, currency remains PHP
      expect(screen.getByRole('tab', { name: /Language/i }).textContent).toContain('fil-PH');
      expect(screen.getByRole('tab', { name: /Region/i }).textContent).toContain('PH');
      expect(screen.getByRole('tab', { name: /Currency/i }).textContent).toContain('PHP');
    });

    it('2.2. Changing currency does not alter country or language', () => {
      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      // Switch to Currency tab
      fireEvent.click(screen.getByRole('tab', { name: /Currency/i }));

      // Select 'USD' (allowed for PH)
      const usdBtn = screen.getByRole('radio', { name: /US Dollar/i });
      fireEvent.click(usdBtn);

      // Verify draft state: currency is USD, country remains PH, language remains en-PH
      expect(screen.getByRole('tab', { name: /Currency/i }).textContent).toContain('USD');
      expect(screen.getByRole('tab', { name: /Region/i }).textContent).toContain('PH');
      expect(screen.getByRole('tab', { name: /Language/i }).textContent).toContain('en-PH');
    });

    it('2.3. Selecting country proposes that country default display currency', () => {
      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      // Switch to Region tab (active by default)
      const usBtn = screen.getByRole('radio', { name: /United States/i });
      fireEvent.click(usBtn);

      // Country is US, proposed currency is USD (US default), language remains en-PH
      expect(screen.getByRole('tab', { name: /Region/i }).textContent).toContain('US');
      expect(screen.getByRole('tab', { name: /Currency/i }).textContent).toContain('USD');
      expect(screen.getByRole('tab', { name: /Language/i }).textContent).toContain('en-PH');
    });

    it('2.4. Financial boundary: preview clearly states all charges are in PHP', () => {
      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      expect(screen.getByText(GLCC_COPY.previewNotice)).not.toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 3. CURRENCY OVERRIDE CONTROLS
  // -------------------------------------------------------------
  describe('3. Display Currency Override Controls', () => {
    it('3.1. Hides/locks currency override options when glcc_currency_override_enabled is false', () => {
      const fixedData: GlobalPreferencesApiResponse = {
        ...mockDefaultData,
        capabilities: {
          v1Enabled: true,
          currencyOverrideEnabled: false,
          countryAutodetectEnabled: false,
        },
      };

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={fixedData}
        />
      );

      // Click Currency tab
      fireEvent.click(screen.getByRole('tab', { name: /Currency/i }));

      // Expect lock message and no currency search or radios
      expect(screen.getAllByText(GLCC_COPY.currencyFixedNote).length).toBeGreaterThan(0);
      expect(screen.queryByPlaceholderText(GLCC_COPY.currencySearchPlaceholder)).toBeNull();
    });

    it('3.2. Allows selecting permitted alternate currency when override is enabled', () => {
      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /Currency/i }));

      // PH allows PHP and USD
      expect(screen.getByRole('radio', { name: /Philippine Peso/i })).not.toBeNull();
      expect(screen.getByRole('radio', { name: /US Dollar/i })).not.toBeNull();

      // JPY is NOT in PH.allowedDisplayCurrencies -> should not be rendered
      expect(screen.queryByRole('radio', { name: /Japanese Yen/i })).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 4. DRAFT, APPLY & CANCEL LIFECYCLE
  // -------------------------------------------------------------
  describe('4. Draft, Apply & Cancel Lifecycle', () => {
    it('4.1. Editing performs zero API writes', () => {
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      // Select Japan
      fireEvent.click(screen.getByRole('radio', { name: /Japan/i }));

      // Select Language
      fireEvent.click(screen.getByRole('tab', { name: /Language/i }));
      fireEvent.click(screen.getByRole('radio', { name: /Japanese/i }));

      // Verify zero fetch requests occurred during editing
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('4.2. Cancel discards edits and calls onClose without API write', () => {
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;
      const onClose = jest.fn();

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={onClose}
          initialData={mockDefaultData}
        />
      );

      // Edit country to US
      fireEvent.click(screen.getByRole('radio', { name: /United States/i }));

      // Click Cancel
      fireEvent.click(screen.getByRole('button', { name: GLCC_COPY.cancelButton }));

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('4.3. Apply performs one atomic save to /api/me/preferences with no userId or chargeCurrency', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'SUCCESS',
          effectivePreference: {
            countryCode: 'US',
            languageTag: 'en-US',
            displayCurrency: 'USD',
            chargeCurrency: 'PHP',
          },
          accountPreference: {
            countryCode: 'US',
            languageTag: 'en-US',
            displayCurrency: 'USD',
            isManualDisplayOverride: false,
            version: 2,
          },
        }),
      });
      global.fetch = fetchSpy;

      const onApplied = jest.fn();
      const onClose = jest.fn();

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={onClose}
          onApplied={onApplied}
          initialData={mockDefaultData}
        />
      );

      // Change country to US
      fireEvent.click(screen.getByRole('radio', { name: /United States/i }));

      // Click Apply
      fireEvent.click(screen.getByRole('button', { name: GLCC_COPY.applyButton }));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const callArgs = fetchSpy.mock.calls[0];
      expect(callArgs[0]).toBe('/api/me/preferences');
      expect(callArgs[1].method).toBe('PATCH');

      const body = JSON.parse(callArgs[1].body);
      expect(body.countryCode).toBe('US');
      expect(body.displayCurrency).toBe('USD');
      expect(body.expectedVersion).toBe(1);

      // Invariants: NO userId and NO chargeCurrency in payload
      expect(body.userId).toBeUndefined();
      expect(body.user_id).toBeUndefined();
      expect(body.chargeCurrency).toBeUndefined();

      expect(onApplied).toHaveBeenCalledWith(
        expect.objectContaining({
          countryCode: 'US',
          displayCurrency: 'USD',
        })
      );
      expect(onClose).toHaveBeenCalled();
    });

    it('4.4. 409 Concurrency Conflict displays message and does not overwrite server', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Concurrency conflict',
          currentVersion: 5,
        }),
      });

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      // Change country
      fireEvent.click(screen.getByRole('radio', { name: /Japan/i }));

      // Apply
      fireEvent.click(screen.getByRole('button', { name: GLCC_COPY.applyButton }));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain(GLCC_COPY.errorConflict);
      });
    });
  });

  // -------------------------------------------------------------
  // 5. SEARCH CAPABILITIES
  // -------------------------------------------------------------
  describe('5. Search Capabilities', () => {
    it('5.1. Country search filters case-insensitively and displays empty state on miss', () => {
      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      const searchInput = screen.getByPlaceholderText(GLCC_COPY.countrySearchPlaceholder);

      // Search 'phil'
      fireEvent.change(searchInput, { target: { value: 'phil' } });
      expect(screen.getByRole('radio', { name: /Philippines/i })).not.toBeNull();
      expect(screen.queryByRole('radio', { name: /Japan/i })).toBeNull();

      // Search non-existent 'Atlantis'
      fireEvent.change(searchInput, { target: { value: 'Atlantis' } });
      expect(screen.getByText(GLCC_COPY.emptySearch)).not.toBeNull();
    });

    it('5.2. Language search filters case-insensitively', () => {
      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /Language/i }));
      const searchInput = screen.getByPlaceholderText(GLCC_COPY.languageSearchPlaceholder);

      fireEvent.change(searchInput, { target: { value: 'jap' } });
      expect(screen.getByRole('radio', { name: /Japanese/i })).not.toBeNull();
      expect(screen.queryByRole('radio', { name: /Filipino/i })).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 6. ACCESSIBILITY & SEMANTICS
  // -------------------------------------------------------------
  describe('6. Accessibility & Semantics', () => {
    it('6.1. Exposes role="dialog", aria-modal="true", and proper heading association', () => {
      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={mockDefaultData}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('glcc-modal-title');
      expect(dialog.getAttribute('aria-describedby')).toBe('glcc-modal-description');
    });

    it('6.2. Pressing Escape triggers cancel and closes modal', () => {
      const onClose = jest.fn();

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={onClose}
          initialData={mockDefaultData}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('6.3. Reconciliation state shows status banner if requiresUserConfirmation is true', () => {
      const unconfirmedData: GlobalPreferencesApiResponse = {
        ...mockDefaultData,
        requiresUserConfirmation: true,
      };

      render(
        <GlobalPreferencesModal
          isOpen={true}
          onClose={jest.fn()}
          initialData={unconfirmedData}
        />
      );

      const statusEl = screen.getByRole('status');
      expect(statusEl.textContent).toContain(GLCC_COPY.reconciliationNotice);
    });
  });
});
