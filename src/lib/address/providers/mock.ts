import { AddressProvider, NormalizedAddress } from '../types';

export class MockAddressProvider implements AddressProvider {
  async autocomplete(input: string) {
    if (input === 'FAIL') {
      throw new Error('Simulated Provider Error');
    }
    return {
      status: 'OK',
      suggestions: [
        {
          placeId: 'mock_place_123',
          description: 'E2E ADDRESS 7391 ALPHA STREET, Mock City, CA 90210, USA',
          mainText: 'E2E ADDRESS 7391 ALPHA STREET',
          secondaryText: 'Mock City, CA, USA',
        }
      ]
    };
  }

  async getDetails(placeId: string): Promise<NormalizedAddress> {
    if (placeId !== 'mock_place_123') {
      throw new Error('Place not found');
    }
    return {
      addressLine1: 'E2E ADDRESS 7391 ALPHA STREET',
      addressLine2: null,
      sublocality: null,
      locality: 'Mock City',
      administrativeArea2: 'Los Angeles County',
      administrativeArea1: 'CA',
      postalCode: '90210',
      countryCode: 'US',
      formattedAddress: 'E2E ADDRESS 7391 ALPHA STREET, Mock City, CA 90210, USA',
      latitude: 34.0901,
      longitude: -118.4065,
      provider: 'google', // We simulate a successful Google return
      providerPlaceId: 'mock_place_123',
      validationStatus: 'VALIDATED',
      validationLevel: 'PREMISE',
      validatedAt: new Date().toISOString(),
      manuallyEdited: false
    };
  }
}
