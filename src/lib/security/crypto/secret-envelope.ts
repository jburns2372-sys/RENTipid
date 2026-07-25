import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { KeyProvider } from './key-provider';

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

export class SecretEnvelopeService {
  /**
   * Encrypts a plaintext secret.
   * @param plaintext The secret to encrypt
   * @param context Additional Authenticated Data (AAD) to bind the ciphertext to its context
   */
  static encryptSecret(plaintext: string, context: string): SecretEnvelope {
    const keyMaterial = KeyProvider.getActiveKey();
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
   * Decrypts a secret envelope.
   * @param envelope The stored envelope
   * @param expectedContext The expected Additional Authenticated Data (AAD)
   */
  static decryptSecret(envelope: SecretEnvelope, expectedContext: string): string {
    if (envelope.version !== VERSION) {
      throw new Error('Unsupported envelope version.');
    }
    if (envelope.algorithm !== ALGORITHM) {
      throw new Error('Unsupported cryptographic algorithm.');
    }
    
    const keyMaterial = KeyProvider.getKey(envelope.keyId);
    const nonce = Buffer.from(envelope.nonce, 'base64');
    const authTag = Buffer.from(envelope.authenticationTag, 'base64');
    
    if (nonce.length !== NONCE_LENGTH) {
      throw new Error('Invalid nonce length.');
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid authentication tag length.');
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
    } catch (error) {
      throw new Error('Decryption failed: tampered ciphertext, invalid tag, or incorrect context.');
    }
  }
}
