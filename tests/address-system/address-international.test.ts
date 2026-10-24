import { GoogleAddressProvider } from '../../src/lib/address/providers/google';

describe('Address System International Fixtures', () => {
  let provider: GoogleAddressProvider;

  beforeAll(() => {
    process.env.GOOGLE_MAPS_API_KEY = 'test_key';
    provider = new GoogleAddressProvider();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runCountryCase = async (countryCode: string, input: string) => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          { placePrediction: { placeId: `${countryCode}_place`, text: { text: `Result in ${countryCode}` } } }
        ]
      })
    });

    const result = await provider.autocomplete(input, { countryCode });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://places.googleapis.com/v1/places:autocomplete'),
      expect.objectContaining({
        body: expect.stringContaining(`"includedRegionCodes":["${countryCode.toLowerCase()}"]`),
      })
    );
    expect(result.status).toBe('OK');
    expect(result.suggestions[0].placeId).toBe(`${countryCode}_place`);

    global.fetch = originalFetch;
  };

  it('should format requests correctly for PH (Philippines)', async () => {
    await runCountryCase('PH', 'Makati');
  });

  it('should format requests correctly for US (United States)', async () => {
    await runCountryCase('US', 'New York');
  });

  it('should format requests correctly for CA (Canada)', async () => {
    await runCountryCase('CA', 'Toronto');
  });

  it('should format requests correctly for GB (United Kingdom)', async () => {
    await runCountryCase('GB', 'London');
  });

  it('should format requests correctly for AU (Australia)', async () => {
    await runCountryCase('AU', 'Sydney');
  });

  it('should format requests correctly for SG (Singapore)', async () => {
    await runCountryCase('SG', 'Orchard Road');
  });

  it('should format requests correctly for JP (Japan)', async () => {
    await runCountryCase('JP', 'Tokyo');
  });

  const runDetailsCase = async (countryCode: string, mockComponents: Record<string, unknown>[], expectedSchemaMatch: Record<string, unknown>) => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: `${countryCode}_place_1`,
        formattedAddress: `Mock ${countryCode} Address`,
        location: { latitude: 10, longitude: 20 },
        addressComponents: mockComponents
      })
    });

    const result = await provider.getDetails(`${countryCode}_place_1`);
    expect(result.countryCode).toBe(countryCode);
    expect(result.providerPlaceId).toBe(`${countryCode}_place_1`);
    
    for (const [key, val] of Object.entries(expectedSchemaMatch)) {
      expect((result as unknown as Record<string, unknown>)[key]).toBe(val);
    }
    
    global.fetch = originalFetch;
  };

  it('should map getDetails schema for PH', async () => {
    await runDetailsCase('PH', [
      { types: ['country'], shortText: 'PH', longText: 'Philippines' },
      { types: ['administrative_area_level_1'], shortText: 'Metro Manila', longText: 'Metro Manila' },
      { types: ['locality'], shortText: 'Makati', longText: 'Makati' }
    ], {
      administrativeArea1: 'Metro Manila',
      locality: 'Makati'
    });
  });

  it('should map getDetails schema for US', async () => {
    await runDetailsCase('US', [
      { types: ['country'], shortText: 'US', longText: 'United States' },
      { types: ['administrative_area_level_1'], shortText: 'CA', longText: 'California' },
      { types: ['locality'], shortText: 'Los Angeles', longText: 'Los Angeles' }
    ], {
      administrativeArea1: 'California',
      locality: 'Los Angeles'
    });
  });

  it('should map getDetails schema for CA', async () => {
    await runDetailsCase('CA', [
      { types: ['country'], shortText: 'CA', longText: 'Canada' },
      { types: ['administrative_area_level_1'], shortText: 'ON', longText: 'Ontario' },
      { types: ['locality'], shortText: 'Toronto', longText: 'Toronto' }
    ], {
      administrativeArea1: 'Ontario',
      locality: 'Toronto'
    });
  });

  it('should map getDetails schema for GB', async () => {
    await runDetailsCase('GB', [
      { types: ['country'], shortText: 'GB', longText: 'United Kingdom' },
      { types: ['postal_town'], shortText: 'London', longText: 'London' }
    ], {
      locality: 'London' // postal_town maps to locality
    });
  });

  it('should map getDetails schema for AU', async () => {
    await runDetailsCase('AU', [
      { types: ['country'], shortText: 'AU', longText: 'Australia' },
      { types: ['administrative_area_level_1'], shortText: 'NSW', longText: 'New South Wales' },
      { types: ['locality'], shortText: 'Sydney', longText: 'Sydney' }
    ], {
      administrativeArea1: 'New South Wales',
      locality: 'Sydney'
    });
  });

  it('should map getDetails schema for SG', async () => {
    await runDetailsCase('SG', [
      { types: ['country'], shortText: 'SG', longText: 'Singapore' },
      { types: ['locality'], shortText: 'Singapore', longText: 'Singapore' }
    ], {
      locality: 'Singapore'
    });
  });

  it('should map getDetails schema for JP', async () => {
    await runDetailsCase('JP', [
      { types: ['country'], shortText: 'JP', longText: 'Japan' },
      { types: ['administrative_area_level_1'], shortText: 'Tokyo', longText: 'Tokyo' },
      { types: ['locality'], shortText: 'Shibuya', longText: 'Shibuya' }
    ], {
      administrativeArea1: 'Tokyo',
      locality: 'Shibuya'
    });
  });
});
