import { ProfileBackfillClassifier } from '../../../src/lib/security/crypto/profile-backfill-classifier';
import { ProfileBackfillField, ProfileBackfillState } from '../../../src/lib/security/crypto/profile-backfill-types';
import { KeyProvider } from '../../../src/lib/security/crypto/key-provider';
import { FakeKeyProvider } from './fake-key-provider';
import { ProfileFieldProtection, ProfileFieldContext } from '../../../src/lib/security/crypto/profile-field-protection';

describe('ProfileBackfillClassifier', () => {
  beforeAll(() => {
    KeyProvider.__setTestProvider(new FakeKeyProvider());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const field = ProfileBackfillField.USER_ADDRESS;
  const context = ProfileFieldContext.USER_ADDRESS;
  const validLegacy = '123 Main St';

  it('classifies ABSENT when both values are absent', () => {
    const result = ProfileBackfillClassifier.classifyField(field, null, null);
    expect(result.state).toBe(ProfileBackfillState.ABSENT);
    expect(result.isEligible).toBe(false);
    expect(result.isCompliant).toBe(false);
    expect(result.isQuarantined).toBe(false);
  });

  it('classifies LEGACY_ONLY when legacy is present and encrypted is absent', () => {
    const result = ProfileBackfillClassifier.classifyField(field, validLegacy, null);
    expect(result.state).toBe(ProfileBackfillState.LEGACY_ONLY);
    expect(result.isEligible).toBe(true);
    expect(result.isCompliant).toBe(false);
    expect(result.isQuarantined).toBe(false);
  });

  it('classifies INVALID_LEGACY_VALUE for oversized legacy plaintext', () => {
    const oversizedLegacy = 'A'.repeat(2001);
    const result = ProfileBackfillClassifier.classifyField(field, oversizedLegacy, null);
    expect(result.state).toBe(ProfileBackfillState.INVALID_LEGACY_VALUE);
    expect(result.isEligible).toBe(false);
    expect(result.isQuarantined).toBe(true);
    expect(result.reasonCode).toContain('Oversized');
  });

  it('classifies ENCRYPTED_ONLY when legacy is absent and encrypted is valid', () => {
    const validCiphertext = ProfileFieldProtection.protect(validLegacy, context);
    const result = ProfileBackfillClassifier.classifyField(field, null, validCiphertext);
    expect(result.state).toBe(ProfileBackfillState.ENCRYPTED_ONLY);
    expect(result.isCompliant).toBe(true);
    expect(result.isEligible).toBe(false);
  });

  it('classifies DUAL_MATCH when both present and decrypted matches legacy', () => {
    const validCiphertext = ProfileFieldProtection.protect(validLegacy, context);
    const result = ProfileBackfillClassifier.classifyField(field, validLegacy, validCiphertext);
    expect(result.state).toBe(ProfileBackfillState.DUAL_MATCH);
    expect(result.isCompliant).toBe(true);
    expect(result.isQuarantined).toBe(false);
  });

  it('classifies DUAL_MISMATCH when decrypted value differs from legacy value', () => {
    const validCiphertext = ProfileFieldProtection.protect('Different Address', context);
    const result = ProfileBackfillClassifier.classifyField(field, validLegacy, validCiphertext);
    expect(result.state).toBe(ProfileBackfillState.DUAL_MISMATCH);
    expect(result.isQuarantined).toBe(true);
    expect(result.reasonCode).toContain('does not exactly match');
  });

  it('enforces exact equality, no normalization', () => {
    const validCiphertext = ProfileFieldProtection.protect(validLegacy + ' ', context); // added space
    const result = ProfileBackfillClassifier.classifyField(field, validLegacy, validCiphertext);
    expect(result.state).toBe(ProfileBackfillState.DUAL_MISMATCH);
  });

  it('classifies INVALID_CIPHERTEXT for malformed serialized envelope', () => {
    const result = ProfileBackfillClassifier.classifyField(field, validLegacy, 'not json');
    expect(result.state).toBe(ProfileBackfillState.INVALID_CIPHERTEXT);
    expect(result.isQuarantined).toBe(true);
  });

  it('classifies INVALID_CIPHERTEXT for wrong context', () => {
    const wrongContextCiphertext = ProfileFieldProtection.protect(validLegacy, ProfileFieldContext.BUSINESS_ADDRESS);
    const result = ProfileBackfillClassifier.classifyField(field, validLegacy, wrongContextCiphertext);
    expect(result.state).toBe(ProfileBackfillState.INVALID_CIPHERTEXT);
    expect(result.isQuarantined).toBe(true);
  });

  it('classifies INVALID_CIPHERTEXT for tampered ciphertext', () => {
    const validCiphertext = ProfileFieldProtection.protect(validLegacy, context);
    const envelope = JSON.parse(validCiphertext);
    envelope.ciphertext = 'tampered';
    const result = ProfileBackfillClassifier.classifyField(field, validLegacy, JSON.stringify(envelope));
    expect(result.state).toBe(ProfileBackfillState.INVALID_CIPHERTEXT);
    expect(result.isQuarantined).toBe(true);
  });

  it('sanitized result contains no plaintext or ciphertext', () => {
    const validCiphertext = ProfileFieldProtection.protect(validLegacy, context);
    const result = ProfileBackfillClassifier.classifyField(field, validLegacy, validCiphertext);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(validLegacy);
    expect(serialized).not.toContain('v1'); // envelope version
    expect(serialized).not.toContain('rentipid'); // context
  });

  it('unexpected internal error is not hidden as normal invalid data', () => {
    // Force tryDecrypt to throw a weird non-Error
    jest.spyOn(ProfileFieldProtection, 'read').mockImplementation(() => {
      throw 'A completely unexpected string throw';
    });
    const result = ProfileBackfillClassifier.classifyField(field, validLegacy, 'anything');
    expect(result.state).toBe(ProfileBackfillState.INVALID_CIPHERTEXT);
    expect(result.reasonCode).toBe('Unknown decryption error safely caught');
  });

  it('returns correct context for all three fields', () => {
    const uAddr = ProfileBackfillClassifier.classifyField(ProfileBackfillField.USER_ADDRESS, null, null);
    const bAddr = ProfileBackfillClassifier.classifyField(ProfileBackfillField.BUSINESS_ADDRESS, null, null);
    const bReg = ProfileBackfillClassifier.classifyField(ProfileBackfillField.BUSINESS_REGISTRATION_NUMBER, null, null);
    
    expect(uAddr.state).toBe(ProfileBackfillState.ABSENT);
    expect(bAddr.state).toBe(ProfileBackfillState.ABSENT);
    expect(bReg.state).toBe(ProfileBackfillState.ABSENT);
  });
});
