import { ProfileFieldProtection, ProfileFieldContext } from './profile-field-protection';
import {
  ProfileBackfillField,
  ProfileBackfillState,
  ProfileBackfillFieldResult,
} from './profile-backfill-types';

export class ProfileBackfillClassifier {
  /**
   * Pure classification logic for a profile field.
   * Classifies the data state based on the legacy value and encrypted companion.
   */
  static classifyField(
    field: ProfileBackfillField,
    legacyValue: string | null | undefined,
    encryptedValue: string | null | undefined
  ): ProfileBackfillFieldResult {
    const context = this.getContextForField(field);

    const hasLegacy = legacyValue !== null && legacyValue !== undefined && legacyValue !== '';
    const hasEncrypted = encryptedValue !== null && encryptedValue !== undefined && encryptedValue !== '';

    if (!hasLegacy && !hasEncrypted) {
      return this.createResult(field, ProfileBackfillState.ABSENT, null);
    }

    if (hasLegacy && !hasEncrypted) {
      if (this.isInvalidLegacyValue(legacyValue)) {
        return this.createResult(field, ProfileBackfillState.INVALID_LEGACY_VALUE, 'Oversized legacy value');
      }
      return this.createResult(field, ProfileBackfillState.LEGACY_ONLY, null);
    }

    if (!hasLegacy && hasEncrypted) {
      const decrypted = this.tryDecrypt(encryptedValue, context);
      if (decrypted.error) {
        return this.createResult(field, ProfileBackfillState.INVALID_CIPHERTEXT, decrypted.error);
      }
      return this.createResult(field, ProfileBackfillState.ENCRYPTED_ONLY, null);
    }

    if (hasLegacy && hasEncrypted) {
      const decrypted = this.tryDecrypt(encryptedValue, context);
      if (decrypted.error) {
        return this.createResult(field, ProfileBackfillState.INVALID_CIPHERTEXT, decrypted.error);
      }

      if (decrypted.value === legacyValue) {
        return this.createResult(field, ProfileBackfillState.DUAL_MATCH, null);
      }

      return this.createResult(field, ProfileBackfillState.DUAL_MISMATCH, 'Decrypted value does not exactly match legacy value');
    }

    return this.createResult(field, ProfileBackfillState.UNSUPPORTED_STATE, 'Unhandled state combination');
  }

  private static getContextForField(field: ProfileBackfillField): ProfileFieldContext {
    switch (field) {
      case ProfileBackfillField.USER_ADDRESS:
        return ProfileFieldContext.USER_ADDRESS;
      case ProfileBackfillField.BUSINESS_ADDRESS:
        return ProfileFieldContext.BUSINESS_ADDRESS;
      case ProfileBackfillField.BUSINESS_REGISTRATION_NUMBER:
        return ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER;
      default:
        throw new Error(`Unknown ProfileBackfillField: ${field}`);
    }
  }

  private static isInvalidLegacyValue(value: string | null | undefined): boolean {
    if (value === null || value === undefined) return false;
    return value.length > ProfileFieldProtection.MAX_PLAINTEXT_LENGTH;
  }

  private static tryDecrypt(encryptedValue: string | null | undefined, context: ProfileFieldContext): { value: string | null; error: string | null } {
    try {
      // Temporarily use ProfileFieldProtection.read to validate/decrypt
      // Since ProfileFieldProtection.read falls back to legacy if provided, we pass null to force only encrypted read.
      const readResult = ProfileFieldProtection.read(encryptedValue, null, context);
      if (readResult.source !== 'ENCRYPTED') {
        // Unexpectedly not ENCRYPTED, even though we passed an encryptedValue.
        // This shouldn't happen unless there's an internal error.
        return { value: null, error: 'Failed to read encrypted source' };
      }
      return { value: readResult.value, error: null };
    } catch (e: any) {
      // ProfileFieldProtection throws ProfileFieldProtectionError on failure.
      // E.g. Malformed ciphertext, decryption failure, etc.
      // We map these to safe reason codes, and never log the actual payload or sensitive data.
      const msg = e instanceof Error ? e.message : 'Unknown decryption error safely caught';
      return { value: null, error: msg };
    }
  }

  private static createResult(
    field: ProfileBackfillField,
    state: ProfileBackfillState,
    reasonCode: string | null
  ): ProfileBackfillFieldResult {
    return {
      field,
      state,
      reasonCode,
      isEligible: state === ProfileBackfillState.LEGACY_ONLY,
      isQuarantined: [
        ProfileBackfillState.DUAL_MISMATCH,
        ProfileBackfillState.INVALID_CIPHERTEXT,
        ProfileBackfillState.INVALID_LEGACY_VALUE,
        ProfileBackfillState.UNSUPPORTED_STATE,
      ].includes(state),
      isCompliant: [
        ProfileBackfillState.ENCRYPTED_ONLY,
        ProfileBackfillState.DUAL_MATCH,
      ].includes(state),
    };
  }
}
