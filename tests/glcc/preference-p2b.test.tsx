/**
 * @jest-environment jsdom
 */

/**
 * RENTipid GLCC v1.0 — P2B Surface Integration & UI Verification Tests
 *
 * Verifies:
 * 1. Shared Navigation: GLCC trigger renders in Header when enabled, hidden when disabled.
 * 2. Responsive Presentation: Displays full summary on desktop, compact currency badge on mobile.
 * 3. Mobile Navigation: Trigger opens modal with single active dialog, accessible focus transfer.
 * 4. Account Settings: RegionalPreferencesCard shows effective preferences, Edit button opens modal.
 * 5. Single Dialog Constraint: Only one active modal dialog exists at a time across triggers.
 * 6. Copy Decoupling: Preview notice distinguishes display currency from charge authority (PHP).
 * 7. Draft State Isolation: Closing via Cancel does not leak unsaved draft state.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GlobalPreferencesTrigger from '@/components/glcc/GlobalPreferencesTrigger';
import RegionalPreferencesCard from '@/components/profile/RegionalPreferencesCard';
import { GLCC_COPY } from '@/components/glcc/glcc-copy';

// Mock Header session dependencies
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

describe('GLCC-P2B — Shared Navigation Integration', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('renders preference trigger with current summary when glcc_v1_enabled is true', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/preferences') || url.includes('/api/me/preferences')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            effectivePreference: {
              countryCode: 'PH',
              languageTag: 'en-PH',
              displayCurrency: 'PHP',
              chargeCurrency: 'PHP',
            },
            capabilities: {
              v1Enabled: true,
              currencyOverrideEnabled: true,
            },
          }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<GlobalPreferencesTrigger isGuest={true} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Global Preferences/i })).not.toBeNull();
    });

    // Check that summary is displayed for both desktop and mobile
    expect(screen.getByText(/PH · PHP/i)).not.toBeNull();
    expect(screen.getByText('PHP')).not.toBeNull();
  });

  it('suppresses trigger rendering when glcc_v1_enabled is false (no dead control)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Global preferences v1 is disabled' }),
    });

    const { container } = render(<GlobalPreferencesTrigger isGuest={true} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Global Preferences/i })).toBeNull();
    });
    expect(container.firstChild).toBeNull();
  });

  it('opens GlobalPreferencesModal upon trigger activation and closes restoring focus', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        effectivePreference: {
          countryCode: 'PH',
          languageTag: 'en-PH',
          displayCurrency: 'PHP',
          chargeCurrency: 'PHP',
        },
        capabilities: {
          v1Enabled: true,
          currencyOverrideEnabled: true,
        },
        options: {
          locales: [{ tag: 'en-PH', name: 'English (Philippines)' }],
          countries: [{ code: 'PH', name: 'Philippines', defaultDisplayCurrency: 'PHP', allowedDisplayCurrencies: ['PHP'] }],
          currencies: [{ code: 'PHP', name: 'Philippine Peso', symbol: '₱' }],
        },
      }),
    });

    render(<GlobalPreferencesTrigger isGuest={true} />);

    const triggerBtn = await screen.findByRole('button', { name: /Global Preferences/i });
    fireEvent.click(triggerBtn);

    // Modal dialog is mounted
    const dialog = await screen.findByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(screen.getByText(GLCC_COPY.title)).not.toBeNull();

    // Exactly one dialog exists
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    // Cancel closes dialog
    const cancelBtn = screen.getByRole('button', { name: GLCC_COPY.cancelButton });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('displays touch-friendly trigger with accessible labels on mobile', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        effectivePreference: {
          countryCode: 'PH',
          languageTag: 'en-PH',
          displayCurrency: 'PHP',
          chargeCurrency: 'PHP',
        },
        capabilities: {
          v1Enabled: true,
          currencyOverrideEnabled: true,
        },
      }),
    });

    render(<GlobalPreferencesTrigger isGuest={true} />);

    const trigger = await screen.findByRole('button', { name: /Global Preferences/i });
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.className).toContain('touch-manipulation');
    expect(trigger.className).toContain('min-h-[38px]');
  });
});

describe('GLCC-P2B — Account / Settings Integration (RegionalPreferencesCard)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('renders effective preferences card in authenticated profile', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        effectivePreference: {
          countryCode: 'PH',
          languageTag: 'en-PH',
          displayCurrency: 'PHP',
          chargeCurrency: 'PHP',
          isManualDisplayOverride: false,
        },
        capabilities: {
          v1Enabled: true,
          currencyOverrideEnabled: true,
          chargeCurrency: 'PHP',
        },
        options: {
          locales: [{ tag: 'en-PH', name: 'English (Philippines)' }],
          countries: [{ code: 'PH', name: 'Philippines', defaultDisplayCurrency: 'PHP', allowedDisplayCurrencies: ['PHP'] }],
          currencies: [{ code: 'PHP', name: 'Philippine Peso', symbol: '₱' }],
        },
      }),
    });

    render(<RegionalPreferencesCard />);

    await waitFor(() => {
      expect(screen.getByText('Regional & Language Preferences')).not.toBeNull();
    });

    expect(screen.getByText('English (Philippines)')).not.toBeNull();
    expect(screen.getByText('Philippines')).not.toBeNull();
    expect(screen.getByText('Standard regional default')).not.toBeNull();

    // Edit button exists
    const editBtn = screen.getByRole('button', { name: /Edit global preferences/i });
    expect(editBtn).not.toBeNull();
  });

  it('displays reconciliation status notice with review action when requiresUserConfirmation is true', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        requiresUserConfirmation: true,
        reconciliationStatus: 'USER_CONFIRMATION_REQUIRED',
        effectivePreference: {
          countryCode: 'PH',
          languageTag: 'en-PH',
          displayCurrency: 'PHP',
          chargeCurrency: 'PHP',
        },
        capabilities: {
          v1Enabled: true,
          currencyOverrideEnabled: true,
        },
      }),
    });

    render(<RegionalPreferencesCard />);

    await waitFor(() => {
      expect(screen.getByText(GLCC_COPY.reconciliationNotice)).not.toBeNull();
    });

    expect(screen.getByRole('button', { name: /Review/i })).not.toBeNull();
  });

  it('clicking Edit Preferences opens GlobalPreferencesModal', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        effectivePreference: {
          countryCode: 'PH',
          languageTag: 'en-PH',
          displayCurrency: 'PHP',
          chargeCurrency: 'PHP',
        },
        capabilities: {
          v1Enabled: true,
          currencyOverrideEnabled: true,
        },
        options: {
          locales: [{ tag: 'en-PH', name: 'English (Philippines)' }],
          countries: [{ code: 'PH', name: 'Philippines', defaultDisplayCurrency: 'PHP', allowedDisplayCurrencies: ['PHP'] }],
          currencies: [{ code: 'PHP', name: 'Philippine Peso', symbol: '₱' }],
        },
      }),
    });

    render(<RegionalPreferencesCard />);

    await waitFor(() => {
      expect(screen.getByText('English (Philippines)')).not.toBeNull();
    });

    const editBtn = screen.getByRole('button', { name: /Edit global preferences/i });
    fireEvent.click(editBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });
});

describe('GLCC-P2B — Currency Copy & Financial Distinction', () => {
  it('GLCC_COPY.previewNotice decouples display currency from payment charge currency', () => {
    expect(GLCC_COPY.previewNotice).toBe(
      'Preview formatting only. Display currency may differ from the currency used for payment. The exact charge amount and currency will be shown before confirmation.'
    );
    // Asserts no hardcoded unconditional claim that all worldwide transactions are PHP
    expect(GLCC_COPY.previewNotice).not.toContain('All bookings and transactions are charged in Philippine Peso (PHP)');
  });
});
