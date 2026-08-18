/** @jest-environment jsdom */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { AddressForm } from '../../src/components/address/AddressForm';
import { NormalizedAddress } from '../../src/lib/address/types';

describe('Address Country Change & Meaningful Data Check', () => {
  beforeEach(() => {
    // Mock window.confirm
    window.confirm = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const getAddress = (overrides?: Partial<NormalizedAddress>): NormalizedAddress => ({
    addressLine1: null,
    addressLine2: null,
    sublocality: null,
    locality: null,
    administrativeArea2: null,
    administrativeArea1: null,
    postalCode: null,
    countryCode: 'PH',
    formattedAddress: null,
    latitude: null,
    longitude: null,
    provider: 'MANUAL',
    providerPlaceId: null,
    validationStatus: 'UNVERIFIED',
    validationLevel: null,
    manuallyEdited: true,
    validatedAt: null,
    ...overrides
  });

  it('should ask for confirmation if zero coordinates are present', () => {
    const addr = getAddress({ latitude: 0, longitude: 0 }); // Meaningful data because it's 0

    const { getByRole } = render(<AddressForm initialAddress={addr} onAddressChange={jest.fn()} />);
    
    // Find country select
    const select = getByRole('combobox', { name: /country/i });
    
    (window.confirm as jest.Mock).mockReturnValue(false); // Simulate clicking cancel

    fireEvent.change(select, { target: { value: 'US' } });

    expect(window.confirm).toHaveBeenCalledWith("Changing the country will clear the selected address. Continue?");
  });

  it('should not ask for confirmation if ONLY countryCode is present (no meaningful data)', () => {
    const addr = getAddress(); // No meaningful data except countryCode='PH'

    const { getByRole } = render(<AddressForm initialAddress={addr} onAddressChange={jest.fn()} />);
    
    // Find country select
    const select = getByRole('combobox', { name: /country/i });
    
    fireEvent.change(select, { target: { value: 'US' } });

    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('should ask for confirmation if providerPlaceId is present', () => {
    const addr = getAddress({ providerPlaceId: 'place_123' });

    const { getByRole } = render(<AddressForm initialAddress={addr} onAddressChange={jest.fn()} />);
    
    const select = getByRole('combobox', { name: /country/i });
    
    (window.confirm as jest.Mock).mockReturnValue(false);
    fireEvent.change(select, { target: { value: 'US' } });

    expect(window.confirm).toHaveBeenCalled();
  });

  const testMatrix = [
    { name: 'manual data', data: { addressLine1: '123 Test St' } },
    { name: 'provider data', data: { provider: 'google' } },
    { name: 'line2-only', data: { addressLine2: 'Apt 4B' } },
    { name: 'postal-only', data: { postalCode: '1000' } },
    { name: 'administrativeArea2-only', data: { administrativeArea2: 'Manila' } },
    { name: 'latitude = 0', data: { latitude: 0 } },
    { name: 'longitude = 0', data: { longitude: 0 } },
    { name: 'providerPlaceId', data: { providerPlaceId: 'place_abc' } },
    { name: 'non-default validation state', data: { validationStatus: 'VALIDATED' } }
  ];

  testMatrix.forEach(({ name, data }) => {
    it(`should treat ${name} as meaningful and clear on confirm`, () => {
      const addr = getAddress(data);
      const onAddressChange = jest.fn();
      const { getByRole } = render(<AddressForm initialAddress={addr} onAddressChange={onAddressChange} />);
      
      const select = getByRole('combobox', { name: /country/i });
      
      // Cancel -> preserve
      (window.confirm as jest.Mock).mockReturnValueOnce(false);
      fireEvent.change(select, { target: { value: 'US' } });
      
      expect(window.confirm).toHaveBeenCalled();
      expect(onAddressChange).not.toHaveBeenCalledWith(expect.objectContaining({ countryCode: 'US' })); // not updated

      // Confirm -> clear
      (window.confirm as jest.Mock).mockReturnValueOnce(true);
      fireEvent.change(select, { target: { value: 'US' } });
      
      expect(onAddressChange).toHaveBeenCalledWith(expect.objectContaining({
        countryCode: 'US',
        provider: 'MANUAL',
        addressLine1: null,
        providerPlaceId: null,
        validationStatus: 'UNVERIFIED',
      }));
    });
  });
});
