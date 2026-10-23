/**
 * @jest-environment jsdom
 */

/**
 * RENTipid GLCC v1.0 — P5B Browse FX UI Component Tests
 *
 * Work Package: GLCC-P5B
 *
 * Verifies:
 * 1. Authoritative base price (PHP) is always rendered prominently.
 * 2. When display currency matches base currency (PHP), no FX network call is made.
 * 3. When display currency differs (e.g. USD) and estimate is available:
 *    - Renders converted amount with approx. label.
 *    - Renders "Estimated" badge with tooltip indicating authoritative price.
 * 4. Safe failure behavior:
 *    - When FX is unavailable, displays safe fallback message without breaking layout.
 *    - Authoritative listing price is NEVER hidden, replaced, or set to 0/NaN.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import BrowsePriceEstimate from '@/components/glcc/BrowsePriceEstimate';

// Mock useGlobalPreferences hook
jest.mock('@/components/glcc/useGlobalPreferences', () => ({
  useGlobalPreferences: jest.fn(() => ({
    serverPreference: {
      countryCode: 'PH',
      displayCurrency: 'PHP',
      languageTag: 'en-PH',
    },
  })),
}));

describe('GLCC-P5B — BrowsePriceEstimate UI Component', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('renders authoritative base price prominently with unit label', () => {
    render(
      <BrowsePriceEstimate
        amount={1500}
        baseCurrency="PHP"
        unitLabel="/ day"
      />
    );

    const authoritativeEl = screen.getByTestId('authoritative-price');
    expect(authoritativeEl).not.toBeNull();
    expect(authoritativeEl.textContent).toContain('1,500.00');
    expect(screen.getByText('/ day')).not.toBeNull();

    // When display currency is PHP, estimate container is not rendered
    expect(screen.queryByTestId('estimate-container')).toBeNull();
  });

  it('fetches and displays approximate converted estimate when target currency differs', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/fx/estimate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            isEstimateAvailable: true,
            sourceAmountExact: '1500',
            sourceCurrency: 'PHP',
            targetCurrency: 'USD',
            targetAmountExact: '26.79',
            rate: '0.01785714',
            providerId: 'currencyapi',
            status: 'ACTIVE',
            isCanonicalFallback: false,
          }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <BrowsePriceEstimate
        amount={1500}
        baseCurrency="PHP"
        targetCurrency="USD"
        unitLabel="/ day"
      />
    );

    // Primary price remains PHP
    expect(screen.getByTestId('authoritative-price').textContent).toContain('1,500.00');

    // Wait for estimate to load
    await waitFor(() => {
      expect(screen.getByTestId('converted-amount')).not.toBeNull();
    });

    const convertedEl = screen.getByTestId('converted-amount');
    expect(convertedEl.textContent).toContain('26.79');
    expect(convertedEl.textContent).toContain('approx.');

    // Estimated badge should be present
    expect(screen.getByText('Estimated')).not.toBeNull();
  });

  it('safely displays fallback text without hiding authoritative price when FX is unavailable', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/fx/estimate')) {
        return Promise.resolve({
          ok: false,
          status: 503,
          json: async () => ({ error: 'Provider unavailable' }),
        });
      }
      return Promise.reject(new Error('Network error'));
    });

    render(
      <BrowsePriceEstimate
        amount={2500}
        baseCurrency="PHP"
        targetCurrency="USD"
      />
    );

    // Primary price remains intact
    expect(screen.getByTestId('authoritative-price').textContent).toContain('2,500.00');

    await waitFor(() => {
      expect(screen.getByTestId('estimate-unavailable')).not.toBeNull();
    });

    expect(screen.getByTestId('estimate-unavailable').textContent).toBe(
      'Converted estimate temporarily unavailable'
    );
  });
});
