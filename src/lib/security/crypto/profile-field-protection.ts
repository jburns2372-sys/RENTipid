import { getProfileProtectionMode, ProfileProtectionMode } from './profile-protection-mode';
import { SecretEnvelope, SecretEnvelopeService } from './secret-envelope';
import { KeyPurpose } from './key-provider';

export enum ProfileFieldContext {
  USER_ADDRESS = 'rentipid.profile.user.address.v1',
  BUSINESS_ADDRESS = 'rentipid.profile.business.address.v1',
  BUSINESS_REGISTRATION_NUMBER = 'rentipid.profile.business.registration-number.v1',
  ADDRESS_LINE_1 = 'rentipid.profile.address.line1.v1',
  ADDRESS_LINE_2 = 'rentipid.profile.address.line2.v1',
  ADDRESS_SUBLOCALITY = 'rentipid.profile.address.sublocality.v1',
  ADDRESS_LOCALITY = 'rentipid.profile.address.locality.v1',
  ADDRESS_ADMIN_AREA_1 = 'rentipid.profile.address.adminArea1.v1',
  ADDRESS_ADMIN_AREA_2 = 'rentipid.profile.address.adminArea2.v1',
  ADDRESS_POSTAL_CODE = 'rentipid.profile.address.postalCode.v1',
  ADDRESS_FORMATTED = 'rentipid.profile.address.formatted.v1',
  ADDRESS_LATITUDE = 'rentipid.profile.address.latitude.v1',
  ADDRESS_LONGITUDE = 'rentipid.profile.address.longitude.v1',
}

export enum ProtectedValueSource {
  ENCRYPTED = 'ENCRYPTED',
  ABSENT = 'ABSENT',
  LEGACY = 'LEGACY',
}

export interface ReadProtectedResult {
  value: string | null;
  source: ProtectedValueSource;
}

export class ProfileFieldProtectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileFieldProtectionError';
  }
}

export class ProfileFieldProtection {
  public static readonly MAX_PLAINTEXT_LENGTH = 2000;
  private static readonly MAX_CIPHERTEXT_LENGTH = 1_048_576;

  static protect(plaintext: string, context: ProfileFieldContext): string {
    if (plaintext === null || plaintext === undefined) {
      throw new ProfileFieldProtectionError('Input cannot be null or undefined.');
    }

    if (plaintext.trim() === '') {
      throw new ProfileFieldProtectionError('Empty string is not supported for protection. Use null/undefined for absent values.');
    }

    if (plaintext.length > ProfileFieldProtection.MAX_PLAINTEXT_LENGTH) {
      throw new ProfileFieldProtectionError('Input exceeds maximum allowed size.');
    }

    if (!Object.values(ProfileFieldContext).includes(context)) {
      throw new ProfileFieldProtectionError('Unknown field context.');
    }

    try {
      const envelope = SecretEnvelopeService.encryptSecret(
        plaintext,
        context,
        KeyPurpose.FIELD_ENCRYPTION
      );
      return JSON.stringify(envelope);
    } catch {
      throw new ProfileFieldProtectionError('Protection failed safely.');
    }
  }

  static read(
    encryptedCompanion: string | null | undefined,
    legacyPlaintext: string | null | undefined, // Kept in signature to satisfy existing callers
    context: ProfileFieldContext
  ): ReadProtectedResult {
    if (!Object.values(ProfileFieldContext).includes(context)) {
      throw new ProfileFieldProtectionError('Unknown field context.');
    }

    if (encryptedCompanion) {
      if (typeof encryptedCompanion !== 'string' || encryptedCompanion.length > ProfileFieldProtection.MAX_CIPHERTEXT_LENGTH) {
        throw new ProfileFieldProtectionError('Malformed ciphertext rejected safely.');
      }

      try {
        const envelope = JSON.parse(encryptedCompanion) as SecretEnvelope;

        const plaintext = SecretEnvelopeService.decryptSecret(
          envelope,
          context,
          KeyPurpose.FIELD_ENCRYPTION
        );

        return {
          value: plaintext,
          source: ProtectedValueSource.ENCRYPTED,
        };
      } catch {
        throw new ProfileFieldProtectionError('Decryption failed safely.');
      }
    }

    if (legacyPlaintext !== null && legacyPlaintext !== undefined) {
      const mode = getProfileProtectionMode();
      if (mode === ProfileProtectionMode.ENCRYPTED_ONLY) {
        throw new ProfileFieldProtectionError('Legacy-only reads are rejected in ENCRYPTED_ONLY mode.');
      }
      return {
        value: legacyPlaintext,
        source: ProtectedValueSource.LEGACY,
      };
    }

    return {
      value: null,
      source: ProtectedValueSource.ABSENT,
    };
  }
}
