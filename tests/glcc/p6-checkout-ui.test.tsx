/**
 * @jest-environment jsdom
 */

/**
 * RENTipid GLCC v1.0 — Test Suite: Package P6 Checkout UI
 *
 * Verifies:
 * 1. CheckoutFxDisclosure renders authoritative PHP payment currency notice.
 * 2. CheckoutFxDisclosure renders display currency estimate alongside PHP charge.
 * 3. Shows quote expiry notice and refresh button when expired.
 * 4. Preserves hidden form inputs for binding quote evidence to payment action.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CheckoutFxDisclosure } from '../../src/components/glcc/CheckoutFxDisclosure';
import type { FxQuoteEvidence } from '../../src/lib/glcc/fx-contracts';

describe('GLCC-P6 — Checkout FX Disclosure UI Component', () => {
  const baseTime = new Date('2026-09-26T12:00:00.000Z');

  const mockActiveQuote: FxQuoteEvidence = {
    quoteId: 'fxq_chk_1727352000000_test12',
    rateSourceRef: 'currencyapi',
    providerId: 'currencyapi',
    sourceAmount: '5600.00',
    sourceCurrency: 'PHP',
    targetAmount: '100.00',
    targetCurrency: 'USD',
    rate: '0.01785714',
    providerObservedAt: baseTime.toISOString(),
    createdAt: baseTime.toISOString(),
    expiresAt: new Date(baseTime.getTime() + 120_000).toISOString(),
    feePolicyRef: 'NONE',
    spreadPolicyRef: 'NONE',
    roundingPolicyRef: 'ROUND_HALF_UP',
    context: 'CHECKOUT_QUOTE',
    quoteStatus: 'ACTIVE',
    provenance: {
      evaluatedAt: baseTime.toISOString(),
      canonicalFallbackUsed: false,
    },
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseTime);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders simple authoritative PHP notice when display currency is PHP', () => {
    render(
      <CheckoutFxDisclosure
        authoritativeAmountPhp={5600}
        targetCurrency="PHP"
      />
    );

    expect(screen.getByText('Authoritative Payment Currency')).toBeDefined();
    expect(screen.getByText(/PHP \(Philippine Peso\)/i)).toBeDefined();
    expect(screen.getByText(/₱5,600\.00/i)).toBeDefined();
  });

  it('renders disclosure box with estimated equivalent and countdown when target currency is USD', () => {
    const { container } = render(
      <CheckoutFxDisclosure
        authoritativeAmountPhp={5600}
        targetCurrency="USD"
        initialQuote={mockActiveQuote}
      />
    );

    expect(screen.getByText('Currency & Payment Disclosure')).toBeDefined();
    expect(screen.getByText(/₱5,600\.00 PHP/i)).toBeDefined();
    expect(screen.getByText(/≈ USD 100\.00/i)).toBeDefined();
    expect(screen.getByText(/Quote valid: 120s/i)).toBeDefined();

    // Verify hidden form inputs exist for submission binding
    const quoteIdInput = container.querySelector('input[name="fx_quote_id"]') as HTMLInputElement;
    expect(quoteIdInput).not.toBeNull();
    expect(quoteIdInput.value).toBe('fxq_chk_1727352000000_test12');
  });

  it('transitions to expired state when 120 seconds elapse and shows refresh action', () => {
    render(
      <CheckoutFxDisclosure
        authoritativeAmountPhp={5600}
        targetCurrency="USD"
        initialQuote={mockActiveQuote}
      />
    );

    expect(screen.getByText(/Quote valid: 120s/i)).toBeDefined();

    // Fast-forward 121 seconds
    act(() => {
      jest.advanceTimersByTime(121_000);
    });

    expect(screen.getByText(/Quote Expired:/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Refresh Exchange Rate/i })).toBeDefined();
  });
});
