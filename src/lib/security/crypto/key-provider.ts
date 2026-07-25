import 'server-only';
import { Buffer } from 'node:buffer';

export interface KeyMaterial {
  id: string;
  value: Buffer;
}

export class KeyProvider {
  /**
   * Retrieves the currently active encryption key.
   * Production activation requires an external managed-key service.
   * For local SOC and Bundle 1 validation, it uses securely provided environment variables.
   */
  static getActiveKey(): KeyMaterial {
    const keyId = process.env.MFA_ENCRYPTION_KEY_ID;
    const keyHex = process.env.MFA_ENCRYPTION_KEY;

    if (!keyId || !keyHex) {
      throw new Error('Key configuration is missing or incomplete.');
    }

    const value = Buffer.from(keyHex, 'hex');
    
    if (value.length !== 32) {
      throw new Error('Invalid key length. Expected exactly 32 bytes.');
    }

    return {
      id: keyId,
      value
    };
  }

  /**
   * Retrieves a specific key by ID for decryption of older records.
   */
  static getKey(id: string): Buffer {
    // In a fully rotated environment, this would resolve the specific ID.
    // For Bundle 1, we only support the active key.
    const active = this.getActiveKey();
    if (active.id !== id) {
      throw new Error('Unknown key ID requested.');
    }
    return active.value;
  }
}
