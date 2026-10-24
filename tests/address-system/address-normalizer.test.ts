import { normalizeAddress } from '../../src/lib/address/normalizer';

describe('Address Normalizer', () => {
  it('should accept valid coordinate boundaries', () => {
    const cases = [
      { lat: 0, lng: 0 },
      { lat: 90, lng: 180 },
      { lat: -90, lng: -180 },
    ];

    cases.forEach(({ lat, lng }) => {
      const result = normalizeAddress({ latitude: lat, longitude: lng });
      expect(result.latitude).toBe(lat);
      expect(result.longitude).toBe(lng);
    });
  });

  it('should reject invalid coordinate boundaries and non-finite values', () => {
    const invalidCases = [
      { lat: 91, lng: 0 },
      { lat: -91, lng: 0 },
      { lat: 0, lng: 181 },
      { lat: 0, lng: -181 },
      { lat: NaN, lng: 0 },
      { lat: 0, lng: NaN },
      { lat: Infinity, lng: 0 },
      { lat: 0, lng: Infinity },
      { lat: -Infinity, lng: 0 },
      { lat: 0, lng: -Infinity },
    ];

    invalidCases.forEach(({ lat, lng }) => {
      expect(() => normalizeAddress({ latitude: lat, longitude: lng })).toThrow(/Invalid coordinates/);
    });
  });
});
