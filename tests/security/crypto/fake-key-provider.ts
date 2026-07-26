import { Buffer } from 'node:buffer';
import { IKeyProvider, KeyMaterial, KeyPurpose } from '../../../src/lib/security/crypto/key-provider';

/**
 * A deterministic fake key provider strictly for test environments.
 * Uses synthetic, non-secret byte arrays.
 */
export class FakeKeyProvider implements IKeyProvider {
  // Use predictable arrays for tests (32 bytes each)
  private encryptionKeyV1 = Buffer.alloc(32, 0x11);
  private encryptionKeyV2 = Buffer.alloc(32, 0x22);
  
  private blindIndexKeyV1 = Buffer.alloc(32, 0xAA);

  private activeEncryptionVersion = 'test-enc-v2';
  private activeBlindIndexVersion = 'test-idx-v1';

  getActiveKey(purpose: KeyPurpose = KeyPurpose.FIELD_ENCRYPTION): KeyMaterial {
    if (purpose === KeyPurpose.FIELD_ENCRYPTION) {
      return {
        id: this.activeEncryptionVersion,
        value: this.encryptionKeyV2,
        purpose
      };
    }
    
    if (purpose === KeyPurpose.BLIND_INDEX) {
      return {
        id: this.activeBlindIndexVersion,
        value: this.blindIndexKeyV1,
        purpose
      };
    }
    
    throw new Error(`FakeKeyProvider: Unknown purpose ${purpose}`);
  }

  getKey(id: string, purpose: KeyPurpose = KeyPurpose.FIELD_ENCRYPTION): Buffer {
    if (purpose === KeyPurpose.FIELD_ENCRYPTION) {
      if (id === 'test-enc-v1') return this.encryptionKeyV1;
      if (id === 'test-enc-v2') return this.encryptionKeyV2;
      throw new Error(`FakeKeyProvider: Unknown key ID ${id} for FIELD_ENCRYPTION`);
    }
    
    if (purpose === KeyPurpose.BLIND_INDEX) {
      if (id === 'test-idx-v1') return this.blindIndexKeyV1;
      throw new Error(`FakeKeyProvider: Unknown key ID ${id} for BLIND_INDEX`);
    }

    throw new Error(`FakeKeyProvider: Unknown purpose ${purpose}`);
  }
}
