import { KeyProvider } from '../../src/lib/security/crypto/key-provider';
import { SecretEnvelopeService } from '../../src/lib/security/crypto/secret-envelope';
import { randomBytes } from 'crypto';

describe('Cryptographic Primitives', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.MFA_ENCRYPTION_KEY_ID = 'v1_key';
    process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString('hex');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('Valid encryption/decryption round trip', () => {
    const plaintext = 'super_secret_seed_123';
    const context = 'user:123:mfa';
    const env = SecretEnvelopeService.encryptSecret(plaintext, context);
    const decrypted = SecretEnvelopeService.decryptSecret(env, context);
    expect(decrypted).toBe(plaintext);
  });

  it('Unique nonce across repeated encryption of identical plaintext', () => {
    const plaintext = 'seed';
    const context = 'ctx';
    const env1 = SecretEnvelopeService.encryptSecret(plaintext, context);
    const env2 = SecretEnvelopeService.encryptSecret(plaintext, context);
    expect(env1.nonce).not.toBe(env2.nonce);
  });

  it('Different ciphertext for identical plaintext', () => {
    const plaintext = 'seed';
    const context = 'ctx';
    const env1 = SecretEnvelopeService.encryptSecret(plaintext, context);
    const env2 = SecretEnvelopeService.encryptSecret(plaintext, context);
    expect(env1.ciphertext).not.toBe(env2.ciphertext);
  });

  it('Authentication tag stored separately', () => {
    const env = SecretEnvelopeService.encryptSecret('seed', 'ctx');
    expect(env.authenticationTag).toBeDefined();
    expect(env.authenticationTag.length).toBeGreaterThan(0);
  });

  it('Tampered ciphertext rejected', () => {
    const context = 'ctx';
    const env = SecretEnvelopeService.encryptSecret('seed', context);
    env.ciphertext = Buffer.from('tampered').toString('base64');
    expect(() => SecretEnvelopeService.decryptSecret(env, context)).toThrow(/Decryption failed/);
  });

  it('Tampered tag rejected', () => {
    const context = 'ctx';
    const env = SecretEnvelopeService.encryptSecret('seed', context);
    env.authenticationTag = randomBytes(16).toString('base64');
    expect(() => SecretEnvelopeService.decryptSecret(env, context)).toThrow(/Decryption failed/);
  });

  it('Tampered nonce rejected', () => {
    const context = 'ctx';
    const env = SecretEnvelopeService.encryptSecret('seed', context);
    env.nonce = randomBytes(12).toString('base64');
    expect(() => SecretEnvelopeService.decryptSecret(env, context)).toThrow(/Decryption failed/);
  });

  it('Wrong context rejected', () => {
    const env = SecretEnvelopeService.encryptSecret('seed', 'ctx_a');
    expect(() => SecretEnvelopeService.decryptSecret(env, 'ctx_b')).toThrow(/Decryption failed/);
  });

  it('Wrong key ID rejected', () => {
    const context = 'ctx';
    const env = SecretEnvelopeService.encryptSecret('seed', context);
    env.keyId = 'unknown_key';
    expect(() => SecretEnvelopeService.decryptSecret(env, context)).toThrow(/Unknown key ID/);
  });

  it('Missing key configuration rejected', () => {
    delete process.env.MFA_ENCRYPTION_KEY;
    expect(() => KeyProvider.getActiveKey()).toThrow(/Key configuration is missing/);
  });

  it('Invalid key length rejected', () => {
    process.env.MFA_ENCRYPTION_KEY = randomBytes(16).toString('hex');
    expect(() => KeyProvider.getActiveKey()).toThrow(/Invalid key length/);
  });

  it('No plaintext in serialized envelope', () => {
    const plaintext = 'uniquesecret123';
    const env = SecretEnvelopeService.encryptSecret(plaintext, 'ctx');
    const serialized = JSON.stringify(env);
    expect(serialized).not.toContain(plaintext);
  });

  it('No key material in thrown errors', () => {
    delete process.env.MFA_ENCRYPTION_KEY;
    try {
      KeyProvider.getActiveKey();
    } catch (e: any) {
      expect(e.message).not.toContain('MFA_ENCRYPTION_KEY');
      expect(e.message).not.toContain('v1_key');
    }
  });
});
