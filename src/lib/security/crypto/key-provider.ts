import 'server-only';
import { Buffer } from 'node:buffer';

export enum KeyPurpose {
  FIELD_ENCRYPTION = 'FIELD_ENCRYPTION',
  BLIND_INDEX = 'BLIND_INDEX'
}

export interface KeyMaterial {
  id: string;
  value: Buffer;
  purpose: KeyPurpose;
}

export interface IKeyProvider {
  getActiveKey(purpose?: KeyPurpose): KeyMaterial;
  getKey(id: string, purpose?: KeyPurpose): Buffer;
}

/**
 * A backward-compatible local/development adapter that uses environment variables.
 * This is explicitly NOT a production KMS. It serves as a temporary non-KMS adapter 
 * and external prerequisite placeholder until Azure Key Vault is provisioned.
 */
export class EnvironmentKeyProvider implements IKeyProvider {
  getActiveKey(purpose: KeyPurpose = KeyPurpose.FIELD_ENCRYPTION): KeyMaterial {
    if (purpose === KeyPurpose.FIELD_ENCRYPTION) {
      const keyId = process.env.MFA_ENCRYPTION_KEY_ID;
      const keyHex = process.env.MFA_ENCRYPTION_KEY;

      if (!keyId || !keyHex) {
        throw new Error('Key configuration is missing or incomplete for FIELD_ENCRYPTION.');
      }

      const value = Buffer.from(keyHex, 'hex');
      if (value.length !== 32) {
        throw new Error('Invalid key length. Expected exactly 32 bytes.');
      }

      return { id: keyId, value, purpose };
    } 
    
    if (purpose === KeyPurpose.BLIND_INDEX) {
      const keyId = process.env.BLIND_INDEX_KEY_ID;
      const keyHex = process.env.BLIND_INDEX_KEY;

      if (!keyId || !keyHex) {
        throw new Error('Key configuration is missing or incomplete for BLIND_INDEX.');
      }

      const value = Buffer.from(keyHex, 'hex');
      if (value.length !== 32) {
        throw new Error('Invalid key length. Expected exactly 32 bytes.');
      }

      return { id: keyId, value, purpose };
    }

    throw new Error(`Unknown key purpose: ${purpose}`);
  }

  getKey(id: string, purpose: KeyPurpose = KeyPurpose.FIELD_ENCRYPTION): Buffer {
    // For local/dev adapter, we only support the active key version.
    const active = this.getActiveKey(purpose);
    if (active.id !== id) {
      throw new Error(`Unknown key ID requested for purpose ${purpose}.`);
    }
    return active.value;
  }
}

export class KeyProvider {
  private static instance: IKeyProvider = new EnvironmentKeyProvider();

  /**
   * Test-only mechanism to inject a fake deterministic provider.
   */
  static __setTestProvider(provider: IKeyProvider): void {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Cannot override KeyProvider outside of test environments.');
    }
    this.instance = provider;
  }

  static getActiveKey(purpose: KeyPurpose = KeyPurpose.FIELD_ENCRYPTION): KeyMaterial {
    return this.instance.getActiveKey(purpose);
  }

  static getKey(id: string, purpose: KeyPurpose = KeyPurpose.FIELD_ENCRYPTION): Buffer {
    return this.instance.getKey(id, purpose);
  }
}
