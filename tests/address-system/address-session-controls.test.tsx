/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AddressAutocomplete } from '../../src/components/address/AddressAutocomplete';

let uuidCounter = 0;
// Mock crypto.randomUUID deterministically
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: jest.fn(() => `00000000-0000-0000-0000-00000000000${uuidCounter++ % 10}`),
    },
  });
} else {
  global.crypto.randomUUID = jest.fn(() => `00000000-0000-0000-0000-00000000000${uuidCounter++ % 10}`) as unknown as () => `${string}-${string}-${string}-${string}-${string}`;
}

describe('AddressAutocomplete Session Controls & Latest-Request-Wins', () => {
  let mockOnSelect: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnSelect = jest.fn();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should ignore responses from older requests if a newer request was made (reversed response)', async () => {
    // We simulate two fetch calls. The first one is delayed and resolves AFTER the second one.
    let resolveFirst: (value: unknown) => void;
    let resolveSecond: (value: unknown) => void;

    const promiseFirst = new Promise((resolve) => { resolveFirst = resolve; });
    const promiseSecond = new Promise((resolve) => { resolveSecond = resolve; });

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockReturnValueOnce(promiseFirst).mockReturnValueOnce(promiseSecond);

    render(<AddressAutocomplete countryCode="US" onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    
    // Trigger first request
    await act(async () => {
      fireEvent.change(input, { target: { value: '123' } });
      jest.advanceTimersByTime(300); // Trigger debounce
    });
    
    // Trigger second request
    await act(async () => {
      fireEvent.change(input, { target: { value: '1234' } });
      jest.advanceTimersByTime(300); // Trigger debounce
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Resolve SECOND request first
    await act(async () => {
      resolveSecond!({
        ok: true,
        json: async () => ({ status: 'OK', suggestions: [{ placeId: 'place_2', mainText: 'Second Result' }] })
      });
    });

    const resultElement2 = await screen.findByText('Second Result');
    expect(resultElement2).not.toBeNull();

    // Resolve FIRST request later
    await act(async () => {
      resolveFirst!({
        ok: true,
        json: async () => ({ status: 'OK', suggestions: [{ placeId: 'place_first', mainText: 'First Result' }] })
      });
    });

    // The UI should STILL show 'Second Result', ignoring the first
    const resultElement = await screen.findByText('Second Result');
    expect(resultElement).not.toBeNull();
    expect(screen.queryByText('First Result')).toBeNull();
  });

  it('should keep sessionToken stable during autocomplete and reset on select', async () => {
    let capturedSessionToken1: string | undefined;
    let capturedSessionToken2: string | undefined;
    
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementation(async (url, init) => {
      const body = JSON.parse(init.body);
      if (url.includes('autocomplete')) {
        if (!capturedSessionToken1) {
          capturedSessionToken1 = body.sessionToken;
        } else {
          capturedSessionToken2 = body.sessionToken;
        }
      }
      return {
        ok: true,
        json: async () => ({ status: 'OK', suggestions: [{ placeId: 'place_1', mainText: 'Result' }] })
      };
    });

    const { getByRole, findByText } = render(<AddressAutocomplete countryCode="US" onSelect={mockOnSelect} />);
    const input = getByRole('combobox');
    
    // First search
    await act(async () => {
      fireEvent.change(input, { target: { value: '123' } });
      jest.advanceTimersByTime(300);
    });
    
    // Wait for resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(capturedSessionToken1).toBeDefined();

    // Second search
    await act(async () => {
      fireEvent.change(input, { target: { value: '1234' } });
      jest.advanceTimersByTime(300);
    });

    // Wait for resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(capturedSessionToken2).toBeDefined();
    expect(capturedSessionToken2).toBe(capturedSessionToken1); // Token remained stable

    // Select result
    const resultItem = await findByText('Result');
    await act(async () => {
      fireEvent.click(resultItem);
    });

    expect(mockOnSelect).toHaveBeenCalledWith('place_1', capturedSessionToken1);

    // Third search (after reset)
    let capturedSessionToken3: string | undefined;
    mockFetch.mockImplementation(async (url, init) => {
      const body = JSON.parse(init.body);
      capturedSessionToken3 = body.sessionToken;
      return {
        ok: true,
        json: async () => ({ status: 'OK', suggestions: [] })
      };
    });

    await act(async () => {
      fireEvent.change(input, { target: { value: '999' } });
      jest.advanceTimersByTime(300);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(capturedSessionToken3).toBeDefined();
    expect(capturedSessionToken3).not.toBe(capturedSessionToken1); // Token was reset!
  });
});
