import { KeyProvider, KeyPurpose } from '../../../src/lib/security/crypto/key-provider';
import { SecretEnvelopeService, CryptoError, SecretEnvelope } from '../../../src/lib/security/crypto/secret-envelope';
import { BlindIndexService, BlindIndex } from '../../../src/lib/security/crypto/blind-index';
import { FakeKeyProvider } from './fake-key-provider';

describe('Phase 5F-B Cryptographic Foundation', () => {
  let fakeProvider: FakeKeyProvider;

  beforeAll(() => {
    // Inject test fake
    fakeProvider = new FakeKeyProvider();
    KeyProvider.__setTestProvider(fakeProvider);
  });

  describe('KeyProvider Abstraction', () => {
    it('resolves active key correctly', () => {
      const active = KeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
      expect(active.id).toBe('test-enc-v2');
      expect(active.purpose).toBe(KeyPurpose.FIELD_ENCRYPTION);
    });

    it('resolves historical key correctly', () => {
      const hist = KeyProvider.getKey('test-enc-v1', KeyPurpose.FIELD_ENCRYPTION);
      expect(hist).toBeDefined();
    });

    it('fails on missing historical version', () => {
      expect(() => KeyProvider.getKey('non-existent', KeyPurpose.FIELD_ENCRYPTION)).toThrow(/Unknown key ID/);
    });

    it('maintains separated purposes', () => {
      const encKey = KeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
      const idxKey = KeyProvider.getActiveKey(KeyPurpose.BLIND_INDEX);
      expect(encKey.id).not.toBe(idxKey.id);
      expect(encKey.value.equals(idxKey.value)).toBe(false);
    });
  });

  describe('SecretEnvelopeService - Encryption and Decryption', () => {
    const context = 'test-context';

    it('completes a valid round trip with ascii', () => {
      const plaintext = 'Secret Message';
      const envelope = SecretEnvelopeService.encryptSecret(plaintext, context, KeyPurpose.FIELD_ENCRYPTION);
      const decrypted = SecretEnvelopeService.decryptSecret(envelope, context, KeyPurpose.FIELD_ENCRYPTION);
      expect(decrypted).toBe(plaintext);
    });

    it('supports empty plaintext', () => {
      const envelope = SecretEnvelopeService.encryptSecret('', context);
      expect(SecretEnvelopeService.decryptSecret(envelope, context)).toBe('');
    });

    it('supports unicode plaintext', () => {
      const plaintext = 'S3cr3t! 👋 🌍';
      const envelope = SecretEnvelopeService.encryptSecret(plaintext, context);
      expect(SecretEnvelopeService.decryptSecret(envelope, context)).toBe(plaintext);
    });

    it('supports structured JSON plaintext', () => {
      const plaintext = JSON.stringify({ secretToken: 'abc', role: 'admin' });
      const envelope = SecretEnvelopeService.encryptSecret(plaintext, context);
      expect(SecretEnvelopeService.decryptSecret(envelope, context)).toBe(plaintext);
    });

    it('ensures identical plaintexts produce different ciphertexts (nonce uniqueness)', () => {
      const p = 'Same String';
      const e1 = SecretEnvelopeService.encryptSecret(p, context);
      const e2 = SecretEnvelopeService.encryptSecret(p, context);
      expect(e1.nonce).not.toBe(e2.nonce);
      expect(e1.ciphertext).not.toBe(e2.ciphertext);
      expect(e1.authenticationTag).not.toBe(e2.authenticationTag);
    });

    it('records the correct key version', () => {
      const envelope = SecretEnvelopeService.encryptSecret('hello', context);
      expect(envelope.keyId).toBe('test-enc-v2');
    });

    it('generates unique nonces over a sample set', () => {
      const nonces = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const env = SecretEnvelopeService.encryptSecret('test', context);
        nonces.add(env.nonce);
      }
      expect(nonces.size).toBe(1000);
    });

    it('decrypts historical key version correctly', async () => {
      // Simulate an envelope encrypted with v1
      const histKey = KeyProvider.getKey('test-enc-v1', KeyPurpose.FIELD_ENCRYPTION);
      const crypto = await import('node:crypto');
      const nonce = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', histKey, nonce, { authTagLength: 16 });
      cipher.setAAD(Buffer.from(context, 'utf8'));
      let ciphertext = cipher.update('Old Data', 'utf8', 'base64');
      ciphertext += cipher.final('base64');
      const tag = cipher.getAuthTag();

      const envelope = {
        version: 'v1',
        algorithm: 'aes-256-gcm',
        keyId: 'test-enc-v1',
        nonce: nonce.toString('base64'),
        ciphertext,
        authenticationTag: tag.toString('base64')
      };

      expect(SecretEnvelopeService.decryptSecret(envelope, context)).toBe('Old Data');
    });
  });

  describe('SecretEnvelopeService - Tamper Detection & Wrong Key', () => {
    const context = 'tamper-context';
    let envelope: SecretEnvelope;

    beforeEach(() => {
      envelope = SecretEnvelopeService.encryptSecret('Important Data', context);
    });

    it('fails closed when ciphertext is altered', () => {
      // Change one character in base64
      const chars = envelope.ciphertext.split('');
      chars[0] = chars[0] === 'A' ? 'B' : 'A';
      envelope.ciphertext = chars.join('');
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(CryptoError);
    });

    it('fails closed when auth tag is altered', () => {
      const chars = envelope.authenticationTag.split('');
      chars[0] = chars[0] === 'A' ? 'B' : 'A';
      envelope.authenticationTag = chars.join('');
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(CryptoError);
    });

    it('fails closed when nonce is altered', () => {
      const chars = envelope.nonce.split('');
      chars[0] = chars[0] === 'A' ? 'B' : 'A';
      envelope.nonce = chars.join('');
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(CryptoError);
    });

    it('fails closed when key version is altered', () => {
      envelope.keyId = 'test-enc-v1';
      // It will use v1 key instead of v2 to decrypt, which will fail auth tag check
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(CryptoError);
    });

    it('fails closed when context (AAD) is altered', () => {
      expect(() => SecretEnvelopeService.decryptSecret(envelope, 'wrong-context')).toThrow(CryptoError);
    });

    it('fails closed when algorithm identifier is altered', () => {
      envelope.algorithm = 'aes-128-gcm';
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(CryptoError);
    });

    it('fails closed when envelope version is altered', () => {
      envelope.version = 'v2';
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(CryptoError);
    });

    it('fails closed when wrong key purpose is provided', () => {
      // Should fail if we try to decrypt field encryption with a blind index purpose
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context, KeyPurpose.BLIND_INDEX)).toThrow(CryptoError);
    });
  });

  describe('SecretEnvelopeService - Format Validation', () => {
    const context = 'format-context';

    it('fails on missing envelope fields', () => {
      const malformed: Partial<SecretEnvelope> = { version: 'v1' };
      expect(() => SecretEnvelopeService.decryptSecret(malformed as SecretEnvelope, context)).toThrow(CryptoError);
    });

    it('fails on invalid base64 encoding', () => {
      const envelope = SecretEnvelopeService.encryptSecret('data', context);
      envelope.nonce = 'not-base64-!@#$';
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(CryptoError);
    });

    it('fails on invalid nonce length', () => {
      const envelope = SecretEnvelopeService.encryptSecret('data', context);
      envelope.nonce = Buffer.alloc(10).toString('base64');
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(CryptoError);
    });

    it('fails on invalid tag length', () => {
      const envelope = SecretEnvelopeService.encryptSecret('data', context);
      envelope.authenticationTag = Buffer.alloc(10).toString('base64');
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(CryptoError);
    });

    it('fails on excessively large input (DoS prevention)', () => {
      const envelope = SecretEnvelopeService.encryptSecret('data', context);
      // Construct a string larger than 1MB
      envelope.ciphertext = 'A'.repeat(1048577);
      expect(() => SecretEnvelopeService.decryptSecret(envelope, context)).toThrow(/exceeds maximum size/);
    });
  });

  describe('BlindIndexService', () => {
    it('produces same index for same input and same key', () => {
      const idx1 = BlindIndexService.generateIndex('alice@example.com');
      const idx2 = BlindIndexService.generateIndex('alice@example.com');
      expect(idx1.hash).toBe(idx2.hash);
      expect(idx1.keyId).toBe(idx2.keyId);
    });

    it('produces different index for different input', () => {
      const idx1 = BlindIndexService.generateIndex('alice@example.com');
      const idx2 = BlindIndexService.generateIndex('bob@example.com');
      expect(idx1.hash).not.toBe(idx2.hash);
    });

    it('verifies correct index safely', () => {
      const input = '09171234567';
      const index = BlindIndexService.generateIndex(input);
      expect(BlindIndexService.verifyIndex(input, index)).toBe(true);
    });

    it('rejects incorrect index safely', () => {
      const index = BlindIndexService.generateIndex('09171234567');
      expect(BlindIndexService.verifyIndex('09170000000', index)).toBe(false);
    });

    it('rejects empty inputs safely', () => {
      expect(() => BlindIndexService.generateIndex('')).toThrow(CryptoError);
      expect(() => BlindIndexService.generateIndex('   ')).toThrow(CryptoError);
    });

    it('rejects malformed blind index payloads safely', () => {
      const index: Partial<BlindIndex> = { version: 'v2', hash: 'abc' };
      expect(BlindIndexService.verifyIndex('data', index as BlindIndex)).toBe(false);
    });

    it('ensures output contains no plaintext', () => {
      const p = 'SUPER_SECRET_VALUE';
      const index = BlindIndexService.generateIndex(p);
      expect(index.hash).not.toContain(p);
      // base64 encodes ascii
      expect(Buffer.from(index.hash, 'base64').toString('ascii')).not.toContain(p);
    });
  });

  describe('Leak Prevention', () => {
    it('ensures error messages do not leak plaintext or keys', () => {
      const plaintext = 'CRITICAL_DATA_LEAK_TEST';
      const envelope = SecretEnvelopeService.encryptSecret(plaintext, 'ctx');
      envelope.ciphertext = 'tampered'; // Force error

      try {
        SecretEnvelopeService.decryptSecret(envelope, 'ctx');
        fail('Should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).not.toContain(plaintext);
        // Keys should not be in error message
        const keyVal = KeyProvider.getActiveKey().value.toString('hex');
        expect((e as Error).message).not.toContain(keyVal);
      }
    });
  });
});
