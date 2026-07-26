import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { KeyProvider, KeyPurpose } from './key-provider';
import { CryptoError } from './secret-envelope';

export interface BlindIndex {
  version: string;
  keyId: string;
  hash: string; // base64
}

const BLIND_INDEX_VERSION = 'v1';
const MAX_INPUT_SIZE = 65536; // 64KB limit

export class BlindIndexService {
  /**
   * Generates a deterministic blind index hash using HMAC-SHA-256 for a given canonical input.
   * @param canonicalInput The normalized string to be hashed (must not be empty).
   */
  static generateIndex(canonicalInput: string): BlindIndex {
    if (typeof canonicalInput !== 'string' || canonicalInput.trim().length === 0) {
      throw new CryptoError('Invalid input: canonical input cannot be empty.');
    }
    
    if (canonicalInput.length > MAX_INPUT_SIZE) {
      throw new CryptoError('Invalid input: exceeds maximum size limit.');
    }

    let keyMaterial;
    try {
      keyMaterial = KeyProvider.getActiveKey(KeyPurpose.BLIND_INDEX);
    } catch (err: unknown) {
      throw new CryptoError(`Missing or invalid key configuration: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    const hmac = createHmac('sha256', keyMaterial.value);
    hmac.update(canonicalInput, 'utf8');
    const hash = hmac.digest('base64');

    return {
      version: BLIND_INDEX_VERSION,
      keyId: keyMaterial.id,
      hash
    };
  }

  /**
   * Recalculates the blind index hash using a specific historical key version.
   * Useful when matching an incoming plaintext lookup against a specific stored version.
   * @param canonicalInput The normalized string to be hashed.
   * @param keyId The exact key ID used to generate the original index.
   */
  static recalculateIndex(canonicalInput: string, keyId: string): string {
    if (typeof canonicalInput !== 'string' || canonicalInput.trim().length === 0) {
      throw new CryptoError('Invalid input: canonical input cannot be empty.');
    }

    if (canonicalInput.length > MAX_INPUT_SIZE) {
      throw new CryptoError('Invalid input: exceeds maximum size limit.');
    }

    let keyMaterial: Buffer;
    try {
      keyMaterial = KeyProvider.getKey(keyId, KeyPurpose.BLIND_INDEX);
    } catch (err: unknown) {
      throw new CryptoError(`Missing or invalid key configuration: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    const hmac = createHmac('sha256', keyMaterial);
    hmac.update(canonicalInput, 'utf8');
    return hmac.digest('base64');
  }

  /**
   * Compares a plaintext candidate against a stored blind index safely.
   */
  static verifyIndex(candidateInput: string, storedIndex: BlindIndex): boolean {
    if (!storedIndex || !storedIndex.version || !storedIndex.keyId || !storedIndex.hash) {
      return false;
    }
    if (storedIndex.version !== BLIND_INDEX_VERSION) {
      return false; // Fail closed on unsupported versions
    }
    
    try {
      const candidateHash = this.recalculateIndex(candidateInput, storedIndex.keyId);
      const candidateBuffer = Buffer.from(candidateHash, 'base64');
      const storedBuffer = Buffer.from(storedIndex.hash, 'base64');
      
      if (candidateBuffer.length !== storedBuffer.length) {
        return false;
      }
      
      return timingSafeEqual(candidateBuffer, storedBuffer);
    } catch {
      return false; // Missing keys or malformed input fails securely
    }
  }
}
