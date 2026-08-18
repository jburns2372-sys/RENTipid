import crypto from 'crypto';

/**
 * Privacy field encryption service.
 * Uses AES-256-GCM authenticated encryption.
 */

function getEncryptionKey(): Buffer {
  const b64Key = process.env.PRIVACY_FIELD_ENCRYPTION_KEY_B64;
  if (!b64Key) {
    throw new Error('Encryption key PRIVACY_FIELD_ENCRYPTION_KEY_B64 is absent from environment.');
  }
  const key = Buffer.from(b64Key, 'base64');
  if (key.length !== 32) {
    throw new Error('Encryption key PRIVACY_FIELD_ENCRYPTION_KEY_B64 must decode to exactly 32 bytes.');
  }
  return key;
}

export function encryptPrivacyField(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty plaintext');
  }

  const key = getEncryptionKey();
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Versioned ciphertext envelope: V1:nonce:ciphertext:authTag (Base64 encoded)
  return `V1:${nonce.toString('base64')}:${ciphertext.toString('base64')}:${authTag.toString('base64')}`;
}

export function decryptPrivacyField(encryptedData: string): string {
  if (!encryptedData.startsWith('V1:')) {
    throw new Error('Invalid ciphertext version or format');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid ciphertext format');
  }

  const nonce = Buffer.from(parts[1], 'base64');
  const ciphertext = Buffer.from(parts[2], 'base64');
  const authTag = Buffer.from(parts[3], 'base64');
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(authTag);

  try {
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch {
    throw new Error('Decryption failed: authentication tag verification error');
  }
}
