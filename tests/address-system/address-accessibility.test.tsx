/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AddressAutocomplete } from '../../src/components/address/AddressAutocomplete';

import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

let uuidCounter = 0;
// Mock crypto.randomUUID deterministically
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: jest.fn(() => `00000000-0000-0000-0000-${String(uuidCounter++).padStart(12, '0')}`),
    },
  });
} else {
  global.crypto.randomUUID = jest.fn(() => `00000000-0000-0000-0000-${String(uuidCounter++).padStart(12, '0')}`) as unknown as () => `${string}-${string}-${string}-${string}-${string}`;
}

describe('AddressAutocomplete Accessibility (A11y)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should announce loading state and search results to screen readers via aria-live', async () => {
    let resolveSearch: (value: unknown) => void;
    const promise = new Promise((resolve) => { resolveSearch = resolve; });

    (global.fetch as jest.Mock).mockReturnValue(promise);

    render(<AddressAutocomplete countryCode="US" onSelect={jest.fn()} />);
    const input = screen.getByRole('combobox');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: '123' } });
      jest.advanceTimersByTime(300);
    });

    // Check loading announcement
    const liveRegion = document.querySelector('[aria-live="assertive"]');
    expect(liveRegion?.textContent).toContain('Searching for address...');

    await act(async () => {
      resolveSearch!({
        ok: true,
        json: async () => ({ status: 'OK', suggestions: [{ placeId: 'place_1', mainText: '123 Main' }] })
      });
    });

    // Check result announcement
    await waitFor(() => {
      expect(liveRegion?.textContent).toContain('1 suggestions available. Use up and down arrows to navigate.');
    });
  });

  it('should announce NO_RESULTS to screen readers', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'NO_RESULTS', suggestions: [] })
    });

    render(<AddressAutocomplete countryCode="US" onSelect={jest.fn()} />);
    const input = screen.getByRole('combobox');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: '123' } });
      jest.advanceTimersByTime(300);
    });

    const liveRegion = document.querySelector('[aria-live="assertive"]');

    await waitFor(() => {
      expect(liveRegion?.textContent).toContain('No matching address found. Try entering manually.');
    });
  });

  it('should allow keyboard navigation through suggestions', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'OK', suggestions: [
        { placeId: 'place_1', mainText: 'Result 1' },
        { placeId: 'place_2', mainText: 'Result 2' }
      ] })
    });

    const mockOnSelect = jest.fn();
    render(<AddressAutocomplete countryCode="US" onSelect={mockOnSelect} />);
    const input = screen.getByRole('combobox');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: '123' } });
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Result 1')).not.toBeNull();
    });

    // Navigate with keyboard
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Select Result 1
    
    expect(input.getAttribute('aria-activedescendant')).toMatch(/suggestion-.*-0|suggestion-0/);

    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Select Result 2
    expect(input.getAttribute('aria-activedescendant')).toMatch(/suggestion-.*-1|suggestion-1/);

    fireEvent.keyDown(input, { key: 'ArrowUp' }); // Select Result 1
    expect(input.getAttribute('aria-activedescendant')).toMatch(/suggestion-.*-0|suggestion-0/);

    fireEvent.keyDown(input, { key: 'Enter' }); // Submit
    
    expect(mockOnSelect).toHaveBeenCalledWith('place_1', expect.any(String));
  });

  it('should close suggestions on Escape and Tab keys', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'OK', suggestions: [{ placeId: '1', mainText: 'Result 1' }] })
    });

    render(<AddressAutocomplete countryCode="US" onSelect={jest.fn()} />);
    const input = screen.getByRole('combobox');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: '123' } });
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Result 1')).not.toBeNull();
    });

    // Escape
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('Result 1')).toBeNull();

    // Trigger again
    await act(async () => {
      fireEvent.change(input, { target: { value: '1234' } });
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Result 1')).not.toBeNull();
    });

    // Tab
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(screen.queryByText('Result 1')).toBeNull();
  });

  it('should announce PROVIDER_UNAVAILABLE to screen readers', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'PROVIDER_UNAVAILABLE', suggestions: [] })
    });

    render(<AddressAutocomplete countryCode="US" onSelect={jest.fn()} />);
    const input = screen.getByRole('combobox');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: '123' } });
      jest.advanceTimersByTime(300);
    });

    const liveRegion = document.querySelector('[aria-live="assertive"]');

    await waitFor(() => {
      expect(liveRegion?.textContent).toContain('Address search is temporarily unavailable.');
    });
  });

});
