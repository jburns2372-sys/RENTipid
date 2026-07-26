import { ProfileFieldProtection, ProfileFieldContext, ProtectedValueSource, ProfileFieldProtectionError } from '../../../src/lib/security/crypto/profile-field-protection';
import { KeyProvider, KeyPurpose } from '../../../src/lib/security/crypto/key-provider';
import { FakeKeyProvider } from './fake-key-provider';

describe('ProfileFieldProtection', () => {
  let fakeKeyProvider: FakeKeyProvider;

  beforeEach(() => {
    fakeKeyProvider = new FakeKeyProvider();
    KeyProvider.__setTestProvider(fakeKeyProvider);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mutateBase64Byte = (base64: string, byteIndex: number = 0): string => {
    const buf = Buffer.from(base64, 'base64');
    if (buf.length > byteIndex) {
      buf[byteIndex] ^= 0x01; // flip one bit
    }
    return buf.toString('base64');
  };

  const getEnvelope = (cipher: string): Record<string, string> => {
    return JSON.parse(cipher) as Record<string, string>;
  };

  describe('Context isolation', () => {
    it('User address encrypts and decrypts with the user-address context', () => {
      const plaintext = '123 User St';
      const ciphertext = ProfileFieldProtection.protect(plaintext, ProfileFieldContext.USER_ADDRESS);
      const result = ProfileFieldProtection.read(ciphertext, null, ProfileFieldContext.USER_ADDRESS);
      expect(result.source).toBe(ProtectedValueSource.ENCRYPTED);
      expect(result.value).toBe(plaintext);
    });

    it('Business address encrypts and decrypts with the business-address context', () => {
      const plaintext = '456 Business Rd';
      const ciphertext = ProfileFieldProtection.protect(plaintext, ProfileFieldContext.BUSINESS_ADDRESS);
      const result = ProfileFieldProtection.read(ciphertext, null, ProfileFieldContext.BUSINESS_ADDRESS);
      expect(result.source).toBe(ProtectedValueSource.ENCRYPTED);
      expect(result.value).toBe(plaintext);
    });

    it('Registration number encrypts and decrypts with the registration context', () => {
      const plaintext = 'REG-789';
      const ciphertext = ProfileFieldProtection.protect(plaintext, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER);
      const result = ProfileFieldProtection.read(ciphertext, null, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER);
      expect(result.source).toBe(ProtectedValueSource.ENCRYPTED);
      expect(result.value).toBe(plaintext);
    });

    it('Ciphertext from one context fails under every other context', () => {
      const plaintext = 'Secret Info';
      const userCipher = ProfileFieldProtection.protect(plaintext, ProfileFieldContext.USER_ADDRESS);

      expect(() => {
        ProfileFieldProtection.read(userCipher, null, ProfileFieldContext.BUSINESS_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);

      expect(() => {
        ProfileFieldProtection.read(userCipher, null, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER);
      }).toThrow(ProfileFieldProtectionError);
    });
  });

  describe('Protect behavior', () => {
    it('Valid plaintext produces ciphertext', () => {
      const ciphertext = ProfileFieldProtection.protect('Valid Data', ProfileFieldContext.USER_ADDRESS);
      expect(ciphertext).toBeDefined();
      expect(ciphertext).not.toBe('');
    });

    it('Plaintext is not present in serialized ciphertext', () => {
      const plaintext = 'TOP_SECRET_ADDRESS_999';
      const ciphertext = ProfileFieldProtection.protect(plaintext, ProfileFieldContext.USER_ADDRESS);
      expect(ciphertext).not.toContain(plaintext);
    });

    it('Repeated encryption of the same value produces different ciphertext', () => {
      const plaintext = 'Identical Data';
      const cipher1 = ProfileFieldProtection.protect(plaintext, ProfileFieldContext.USER_ADDRESS);
      const cipher2 = ProfileFieldProtection.protect(plaintext, ProfileFieldContext.USER_ADDRESS);
      expect(cipher1).not.toEqual(cipher2);
    });

    it('Empty string is rejected', () => {
      expect(() => {
        ProfileFieldProtection.protect('', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);

      expect(() => {
        ProfileFieldProtection.protect('   ', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('Unknown context is rejected', () => {
      const invalidContext = 'INVALID_CONTEXT' as ProfileFieldContext;
      expect(() => {
        ProfileFieldProtection.protect('Data', invalidContext);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('No plaintext is included in expected error messages', () => {
      try {
        ProfileFieldProtection.protect('', ProfileFieldContext.USER_ADDRESS);
        fail('Should have thrown error');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(Error);
        if (err instanceof Error) {
          expect(err.message).not.toContain('   ');
        }
      }
    });
  });

  describe('Read precedence', () => {
    it('Valid ciphertext is preferred over legacy plaintext', () => {
      const validPlain = 'New Address';
      const legacyPlain = 'Old Address';
      const cipher = ProfileFieldProtection.protect(validPlain, ProfileFieldContext.USER_ADDRESS);

      const result = ProfileFieldProtection.read(cipher, legacyPlain, ProfileFieldContext.USER_ADDRESS);
      expect(result.source).toBe(ProtectedValueSource.ENCRYPTED);
      expect(result.value).toBe(validPlain);
    });

    it('Valid ciphertext returns source ENCRYPTED', () => {
      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);
      const result = ProfileFieldProtection.read(cipher, null, ProfileFieldContext.USER_ADDRESS);
      expect(result.source).toBe(ProtectedValueSource.ENCRYPTED);
    });

    it('Missing ciphertext with legacy plaintext returns source LEGACY', () => {
      const result = ProfileFieldProtection.read(null, 'Legacy Data', ProfileFieldContext.USER_ADDRESS);
      expect(result.source).toBe(ProtectedValueSource.LEGACY);
      expect(result.value).toBe('Legacy Data');
    });

    it('Both absent returns source ABSENT', () => {
      const result = ProfileFieldProtection.read(null, null, ProfileFieldContext.USER_ADDRESS);
      expect(result.source).toBe(ProtectedValueSource.ABSENT);
      expect(result.value).toBeNull();
    });

    it('Malformed ciphertext with legacy plaintext fails closed', () => {
      expect(() => {
        ProfileFieldProtection.read('NOT_A_VALID_ENVELOPE', 'Legacy', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('Malformed envelope properties with legacy plaintext fail closed', () => {
      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);
      const tampered = cipher.replace('version', 'ver'); // break JSON properties
      expect(() => {
        ProfileFieldProtection.read(tampered, 'Legacy', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('Authenticated ciphertext tampering with legacy plaintext fails closed', () => {
      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);
      const env = getEnvelope(cipher);
      env.ciphertext = mutateBase64Byte(env.ciphertext);
      const mutatedCipher = JSON.stringify(env);

      expect(mutatedCipher).not.toEqual(cipher);
      expect(() => {
        ProfileFieldProtection.read(mutatedCipher, 'Legacy', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('Authentication-tag tampering fails closed without legacy fallback', () => {
      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);
      const env = getEnvelope(cipher);
      env.authenticationTag = mutateBase64Byte(env.authenticationTag);
      const mutatedCipher = JSON.stringify(env);

      expect(mutatedCipher).not.toEqual(cipher);
      expect(() => {
        ProfileFieldProtection.read(mutatedCipher, 'Legacy', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('Nonce tampering fails closed without legacy fallback', () => {
      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);
      const env = getEnvelope(cipher);
      env.nonce = mutateBase64Byte(env.nonce);
      const mutatedCipher = JSON.stringify(env);

      expect(mutatedCipher).not.toEqual(cipher);
      expect(() => {
        ProfileFieldProtection.read(mutatedCipher, 'Legacy', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('Wrong key material with legacy plaintext fails closed', () => {
      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);

      const anotherFakeProvider = new FakeKeyProvider();
      // Rotate the active key so it returns different bytes
      // But we need to make sure the key ID remains the same, wait FakeKeyProvider always returns same bytes for same ID.
      // I will mock the getActiveKey / getKey on the second provider
      const fakeBuffer = Buffer.alloc(32, 0x99);
      jest.spyOn(anotherFakeProvider, 'getKey').mockReturnValue(fakeBuffer);

      KeyProvider.__setTestProvider(anotherFakeProvider);

      expect(() => {
        ProfileFieldProtection.read(cipher, 'Legacy', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('Wrong key version with legacy plaintext fails closed', () => {
      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);
      const parsed = JSON.parse(cipher);
      parsed.keyId = 'non_existent_key_version';
      const invalidCipher = JSON.stringify(parsed);

      expect(() => {
        ProfileFieldProtection.read(invalidCipher, 'Legacy', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('Wrong context with legacy plaintext fails closed', () => {
      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);
      expect(() => {
        ProfileFieldProtection.read(cipher, 'Legacy', ProfileFieldContext.BUSINESS_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });
  });

  describe('Nullability', () => {
    it('Null encrypted plus null legacy returns ABSENT', () => {
      const result = ProfileFieldProtection.read(null, null, ProfileFieldContext.USER_ADDRESS);
      expect(result.source).toBe(ProtectedValueSource.ABSENT);
      expect(result.value).toBeNull();
    });

    it('Undefined encrypted plus valid legacy returns LEGACY', () => {
      const result = ProfileFieldProtection.read(undefined, 'Legacy', ProfileFieldContext.USER_ADDRESS);
      expect(result.source).toBe(ProtectedValueSource.LEGACY);
      expect(result.value).toBe('Legacy');
    });

    it('Valid encrypted plus null legacy returns ENCRYPTED', () => {
      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);
      const result = ProfileFieldProtection.read(cipher, null, ProfileFieldContext.USER_ADDRESS);
      expect(result.source).toBe(ProtectedValueSource.ENCRYPTED);
      expect(result.value).toBe('Data');
    });
  });

  describe('Size limits', () => {
    it('Maximum accepted plaintext boundary works', () => {
      const largeText = 'A'.repeat(2000);
      const cipher = ProfileFieldProtection.protect(largeText, ProfileFieldContext.USER_ADDRESS);
      const result = ProfileFieldProtection.read(cipher, null, ProfileFieldContext.USER_ADDRESS);
      expect(result.value).toBe(largeText);
    });

    it('Oversized plaintext is rejected', () => {
      const tooLarge = 'A'.repeat(2001);
      expect(() => {
        ProfileFieldProtection.protect(tooLarge, ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });

    it('Oversized ciphertext is rejected', () => {
      const oversizedCiphertext = 'A'.repeat(1_048_577);
      expect(() => {
        ProfileFieldProtection.read(oversizedCiphertext, 'Legacy', ProfileFieldContext.USER_ADDRESS);
      }).toThrow(ProfileFieldProtectionError);
    });
  });

  describe('Leak prevention', () => {
    it('Errors do not contain test plaintext', () => {
      const secret = 'SECRET_DO_NOT_LEAK';
      try {
        const invalidContext = 'INVALID_CTX' as ProfileFieldContext;
        ProfileFieldProtection.protect(secret, invalidContext);
        fail('Should have thrown error');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(Error);
        if (err instanceof Error) {
          expect(err.message).not.toContain(secret);
        }
      }
    });

    it('Errors do not contain test key bytes', () => {
      const key = fakeKeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
      try {
        ProfileFieldProtection.read('INVALID', null, ProfileFieldContext.USER_ADDRESS);
        fail('Should have thrown error');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(Error);
        if (err instanceof Error) {
          expect(err.message).not.toContain(key.value.toString('base64'));
        }
      }
    });

    it('Adapter performs no console logging', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const errorSpy = jest.spyOn(console, 'error');
      const warnSpy = jest.spyOn(console, 'warn');

      const cipher = ProfileFieldProtection.protect('Data', ProfileFieldContext.USER_ADDRESS);
      ProfileFieldProtection.read(cipher, null, ProfileFieldContext.USER_ADDRESS);

      try {
        ProfileFieldProtection.read('INVALID', null, ProfileFieldContext.USER_ADDRESS);
      } catch {
        // Ignored for test
      }

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
