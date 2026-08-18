import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { KeyProvider, KeyPurpose } from './key-provider';

export interface SecretEnvelope {
  version: string;
  algorithm: string;
  keyId: string;
  nonce: string; // base64
  ciphertext: string; // base64
  authenticationTag: string; // base64
}

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const NONCE_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const MAX_CIPHERTEXT_SIZE = 1048576; // 1MB arbitrary limit to prevent DoS

export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

export class SecretEnvelopeService {
  /**
   * Encrypts a plaintext secret using AES-256-GCM.
   * @param plaintext The string to encrypt.
   * @param context Additional Authenticated Data (AAD) to bind the ciphertext.
   * @param purpose The intended key purpose (default: FIELD_ENCRYPTION).
   */
  static encryptSecret(plaintext: string, context: string, purpose: KeyPurpose = KeyPurpose.FIELD_ENCRYPTION): SecretEnvelope {
    if (typeof plaintext !== 'string' || typeof context !== 'string') {
      throw new CryptoError('Plaintext and context must be strings.');
    }

    let keyMaterial;
    try {
      keyMaterial = KeyProvider.getActiveKey(purpose);
    } catch (err: unknown) {
      throw new CryptoError(`Missing or invalid key configuration: ${err instanceof Error ? err.message : String(err)}`);
    }

    const nonce = randomBytes(NONCE_LENGTH);

    const cipher = createCipheriv(ALGORITHM, keyMaterial.value, nonce, {
      authTagLength: AUTH_TAG_LENGTH
    });

    cipher.setAAD(Buffer.from(context, 'utf8'));

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      version: VERSION,
      algorithm: ALGORITHM,
      keyId: keyMaterial.id,
      nonce: nonce.toString('base64'),
      ciphertext: encrypted,
      authenticationTag: authTag.toString('base64')
    };
  }

  /**
   * Decrypts a secret envelope. Fails closed on any tampering or mismatch.
   * @param envelope The stored ciphertext envelope.
   * @param expectedContext The expected AAD context.
   * @param purpose The intended key purpose (default: FIELD_ENCRYPTION).
   */
  static decryptSecret(envelope: SecretEnvelope, expectedContext: string, purpose: KeyPurpose = KeyPurpose.FIELD_ENCRYPTION): string {
    if (!envelope || !envelope.version || !envelope.algorithm || !envelope.keyId || !envelope.nonce || typeof envelope.ciphertext !== 'string' || !envelope.authenticationTag) {
      throw new CryptoError('Malformed envelope: missing required fields.');
    }

    if (envelope.version !== VERSION) {
      throw new CryptoError('Unsupported envelope version.');
    }

    if (envelope.algorithm !== ALGORITHM) {
      throw new CryptoError('Unsupported cryptographic algorithm.');
    }

    if (envelope.ciphertext.length > MAX_CIPHERTEXT_SIZE) {
      throw new CryptoError('Malformed envelope: ciphertext exceeds maximum size limit.');
    }

    let nonce: Buffer;
    let authTag: Buffer;

    try {
      nonce = Buffer.from(envelope.nonce, 'base64');
      authTag = Buffer.from(envelope.authenticationTag, 'base64');
    } catch {
      throw new CryptoError('Malformed envelope: invalid base64 encoding.');
    }

    if (nonce.length !== NONCE_LENGTH) {
      throw new CryptoError('Invalid nonce length.');
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new CryptoError('Invalid authentication tag length.');
    }

    let keyMaterial: Buffer;
    try {
      keyMaterial = KeyProvider.getKey(envelope.keyId, purpose);
    } catch (err: unknown) {
      throw new CryptoError(`Missing or invalid key configuration: ${err instanceof Error ? err.message : String(err)}`);
    }

    const decipher = createDecipheriv(ALGORITHM, keyMaterial, nonce, {
      authTagLength: AUTH_TAG_LENGTH
    });

    decipher.setAAD(Buffer.from(expectedContext, 'utf8'));
    decipher.setAuthTag(authTag);

    try {
      let decrypted = decipher.update(envelope.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // Intentionally opaque error message to prevent padding oracle or context-leak attacks.
      throw new CryptoError('Decryption failed: tampered ciphertext, invalid tag, or incorrect context.');
    }
  }
}
