import { AddressTokenService } from '../../src/lib/address/address-token';
import { SecretEnvelopeService } from '../../src/lib/security/crypto/secret-envelope';

// Mock KeyProvider to return a fixed 32-byte key for tests
jest.mock('../../src/lib/security/crypto/key-provider', () => {
  return {
    KeyProvider: {
      getActiveKey: jest.fn().mockReturnValue({ id: 'test-key-1', value: Buffer.alloc(32, 'a') }),
      getKey: jest.fn().mockReturnValue(Buffer.alloc(32, 'a')),
    },
    KeyPurpose: {
      FIELD_ENCRYPTION: 'FIELD_ENCRYPTION',
    }
  };
});

describe('AddressTokenService', () => {
  const dummyPayload = {
    userId: 'test-user',
    addressLine1: '123 Main St',
    addressLine2: null,
    sublocality: 'Downtown',
    locality: 'Metropolis',
    administrativeArea2: 'County',
    administrativeArea1: 'State',
    postalCode: '12345',
    countryCode: 'US',
    formattedAddress: '123 Main St, Metropolis, State 12345, US',
    latitude: 12.34,
    longitude: 56.78,
    provider: 'google',
    providerPlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    validationStatus: 'VALIDATED',
    validationLevel: 'PREMISE',
    manuallyEdited: false,
    validatedAt: null
  };

  it('should generate a valid token and decrypt it successfully', () => {
    const token = AddressTokenService.generateToken(dummyPayload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    const verified = AddressTokenService.verifyToken(token);
    expect(verified).toBeDefined();
    expect(verified?.addressLine1).toBe(dummyPayload.addressLine1);
    expect(verified?.provider).toBe(dummyPayload.provider);
  });

  it('should return null for expired tokens', () => {
    // Generate an expired payload
    const expiredPayload = { ...dummyPayload, expiresAt: Date.now() - 1000 };
    // We have to bypass the generate method since it forces future expiration
    const plaintext = JSON.stringify(expiredPayload);
    const envelope = SecretEnvelopeService.encryptSecret(plaintext, 'rentipid.address.selection.token.v1');
    const token = Buffer.from(JSON.stringify(envelope)).toString('base64');
    
    const verified = AddressTokenService.verifyToken(token);
    expect(verified).toBeNull();
  });

  it('should return null for tampered tokens', () => {
    const token = AddressTokenService.generateToken(dummyPayload);
    // Tamper by reversing string
    const tampered = token.split('').reverse().join('');
    
    const verified = AddressTokenService.verifyToken(tampered);
    expect(verified).toBeNull();
  });
});
