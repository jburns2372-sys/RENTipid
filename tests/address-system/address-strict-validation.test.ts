import { addressSchema, tokenPayloadSchema, autocompleteRequestSchema, detailsRequestSchema } from '../../src/lib/address/types';

describe('Address System Strict Validation', () => {
  const validData = {
    addressLine1: '123 Main',
    addressLine2: null,
    sublocality: null,
    locality: null,
    administrativeArea2: null,
    administrativeArea1: null,
    postalCode: null,
    countryCode: 'US',
    formattedAddress: null,
    latitude: 40.0,
    longitude: -70.0,
    provider: 'MANUAL' as const,
    providerPlaceId: null,
    validationStatus: 'UNVERIFIED' as const,
    validationLevel: null,
    manuallyEdited: true
  };

  it('should verify the baseline validData successfully', () => {
    expect(addressSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject unknown fields in addressSchema (strict)', () => {
    const invalidData = { ...validData, injectedField: 'malicious' };
    expect(addressSchema.safeParse(invalidData).success).toBe(false);
  });

  it('should reject out-of-bounds coordinates', () => {
    expect(addressSchema.safeParse({ ...validData, latitude: 91, longitude: 0 }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validData, latitude: -91, longitude: 0 }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validData, latitude: 0, longitude: 181 }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validData, latitude: 0, longitude: -181 }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validData, latitude: Infinity, longitude: 0 }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validData, latitude: -Infinity, longitude: 0 }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validData, latitude: NaN, longitude: 0 }).success).toBe(false);
  });

  it('should reject invalid country codes', () => {
    expect(addressSchema.safeParse({ ...validData, countryCode: 'USA' }).success).toBe(false); // Too long
    expect(addressSchema.safeParse({ ...validData, countryCode: 'ZZ' }).success).toBe(false);  // Not in registry
  });

  it('should reject unknown provider and validationStatus', () => {
    expect(addressSchema.safeParse({ ...validData, provider: 'FAKE', validationStatus: 'UNVERIFIED' }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validData, provider: 'MANUAL', validationStatus: 'FAKE_STATUS' }).success).toBe(false);
  });
  
  it('should reject oversized strings in autocompleteRequestSchema', () => {
    const validAutocomplete = { input: 'test', countryCode: 'US', sessionToken: '123' };
    expect(autocompleteRequestSchema.safeParse(validAutocomplete).success).toBe(true);
    
    const oversizedInput = { input: 'a'.repeat(256), countryCode: 'US' };
    expect(autocompleteRequestSchema.safeParse(oversizedInput).success).toBe(false);

    const oversizedToken = { input: 'test', countryCode: 'US', sessionToken: 'a'.repeat(1025) };
    expect(autocompleteRequestSchema.safeParse(oversizedToken).success).toBe(false);
    
    const strictFail = { ...validAutocomplete, extra: true };
    expect(autocompleteRequestSchema.safeParse(strictFail).success).toBe(false);
  });

  it('should reject strict violations and oversized strings in detailsRequestSchema', () => {
    const validDetails = { placeId: '123', sessionToken: '123' };
    expect(detailsRequestSchema.safeParse(validDetails).success).toBe(true);
    
    const strictFail = { ...validDetails, extra: true };
    expect(detailsRequestSchema.safeParse(strictFail).success).toBe(false);

    const oversizedPlaceId = { placeId: 'a'.repeat(256) };
    expect(detailsRequestSchema.safeParse(oversizedPlaceId).success).toBe(false);
  });

  it('should fail token generation/verification on strict token payload schema', () => {
    const badPayload = {
      ...validData,
      userId: '1',
      expiresAt: Date.now() + 10000,
      extraMaliciousField: 'yes'
    };
    
    expect(tokenPayloadSchema.safeParse(badPayload).success).toBe(false);
  });
});
