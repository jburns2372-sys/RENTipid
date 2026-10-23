import { GoogleAddressProvider } from '../../src/lib/address/providers/google';

// Mock fetch globally
const originalFetch = global.fetch;

describe('Address Provider Semantics (Places API New)', () => {
  let provider: GoogleAddressProvider;

  beforeAll(() => {
    process.env.GOOGLE_MAPS_API_KEY = 'test_key';
    provider = new GoogleAddressProvider();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('autocomplete should map HTTP 400 to INVALID_PROVIDER_REQUEST', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ error: 'INVALID_ARGUMENT' })
    });

    const result = await provider.autocomplete('123');
    expect(result.status).toBe('INVALID_PROVIDER_REQUEST');
  });

  it('autocomplete should map HTTP 403 to PROVIDER_CONFIGURATION_MISSING', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue({ error: 'PERMISSION_DENIED' })
    });

    const result = await provider.autocomplete('123');
    expect(result.status).toBe('PROVIDER_CONFIGURATION_MISSING');
  });

  it('autocomplete should map HTTP 429 to RATE_LIMITED', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({ error: 'RESOURCE_EXHAUSTED' })
    });

    const result = await provider.autocomplete('123');
    expect(result.status).toBe('RATE_LIMITED');
  });

  it('autocomplete should map HTTP 500 to PROVIDER_UNAVAILABLE', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: 'INTERNAL' })
    });

    const result = await provider.autocomplete('123');
    expect(result.status).toBe('PROVIDER_UNAVAILABLE');
  });

  it('getDetails should throw INVALID_PROVIDER_REQUEST on HTTP 400', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ error: 'INVALID_ARGUMENT' })
    });

    await expect(provider.getDetails('place_1')).rejects.toThrow('INVALID_PROVIDER_REQUEST');
  });

  it('getDetails should throw RATE_LIMITED on HTTP 429', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({ error: 'RESOURCE_EXHAUSTED' })
    });

    await expect(provider.getDetails('place_1')).rejects.toThrow('RATE_LIMITED');
  });

  it('getDetails should throw NO_RESULTS if place object has no id', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}) // empty object, no id
    });

    await expect(provider.getDetails('place_1')).rejects.toThrow('NO_RESULTS');
  });
});
