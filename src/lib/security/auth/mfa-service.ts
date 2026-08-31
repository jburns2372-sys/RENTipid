import 'server-only';
import { PrismaClient } from '@prisma/client';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { randomBytes, createHash } from 'node:crypto';
import { SecretEnvelopeService } from '../crypto/secret-envelope';
import { logAuthenticationEvent } from '../events/writers/authentication-writer';

const prisma = new PrismaClient();

export class MfaService {
  /**
   * Begins the MFA enrollment process for a user.
   * Generates a new TOTP secret and returns the otpauth URL for the QR code.
   */
  static async generateEnrollment(userId: string, userEmail: string): Promise<{ secret: string, otpauthUrl: string }> {
    const existing = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    
    if (existing && existing.status === 'ENABLED') {
      throw new Error('MFA is already enrolled.');
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: 'RENTipid', label: userEmail, secret });

    const context = `mfa:enrollment:${userId}`;
    const envelope = SecretEnvelopeService.encryptSecret(secret, context);

    if (existing) {
      await prisma.userMfa.update({
        where: { user_id: userId },
        data: {
          status: 'ENROLLMENT_PENDING',
          envelope_version: envelope.version,
          envelope_algorithm: envelope.algorithm,
          envelope_key_id: envelope.keyId,
          envelope_nonce: envelope.nonce,
          envelope_ciphertext: envelope.ciphertext,
          envelope_auth_tag: envelope.authenticationTag,
          enrolled_at: new Date(),
          reset_at: null
        }
      });
    } else {
      await prisma.userMfa.create({
        data: {
          user_id: userId,
          status: 'ENROLLMENT_PENDING',
          envelope_version: envelope.version,
          envelope_algorithm: envelope.algorithm,
          envelope_key_id: envelope.keyId,
          envelope_nonce: envelope.nonce,
          envelope_ciphertext: envelope.ciphertext,
          envelope_auth_tag: envelope.authenticationTag
        }
      });
    }

    await logAuthenticationEvent({
      event_code: 'AUTH_MFA_ENROLLMENT_STARTED',
      outcome: 'Success',
      actor_user_id: userId,
      sanitized_metadata: { action: 'MFA enrollment pending' }
    });

    return { secret, otpauthUrl };
  }

  /**
   * Activates MFA for a user by verifying the first TOTP token and generating recovery codes.
   */
  static async activateMfa(userId: string, token: string): Promise<{ recoveryCodes: string[] }> {
    const mfa = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    if (!mfa || mfa.status !== 'ENROLLMENT_PENDING') {
      throw new Error('MFA enrollment not pending.');
    }

    const context = `mfa:enrollment:${userId}`;
    const envelope = {
      version: mfa.envelope_version,
      algorithm: mfa.envelope_algorithm,
      keyId: mfa.envelope_key_id,
      nonce: mfa.envelope_nonce,
      ciphertext: mfa.envelope_ciphertext,
      authenticationTag: mfa.envelope_auth_tag
    };

    const secret = SecretEnvelopeService.decryptSecret(envelope, context);
    const isValid = verifySync({ token, secret }).valid;

    if (!isValid) {
      await logAuthenticationEvent({
        event_code: 'AUTH_MFA_ACTIVATION_FAILED',
        outcome: 'Failure',
        actor_user_id: userId,
        sanitized_metadata: { reason: 'Invalid TOTP token during activation' }
      });
      throw new Error('Invalid TOTP token.');
    }

    // Generate 10 recovery codes
    const recoveryCodes: string[] = [];
    const recoveryCodeHashes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const code = randomBytes(6).toString('hex').toLowerCase();
      recoveryCodes.push(code);
      recoveryCodeHashes.push(this.hashRecoveryCode(code));
    }

    // Re-encrypt the secret with the active context
    const activeContext = `mfa:active:${userId}`;
    const activeEnvelope = SecretEnvelopeService.encryptSecret(secret, activeContext);

    await prisma.userMfa.update({
      where: { id: mfa.id },
      data: {
        status: 'ENABLED',
        envelope_version: activeEnvelope.version,
        envelope_algorithm: activeEnvelope.algorithm,
        envelope_key_id: activeEnvelope.keyId,
        envelope_nonce: activeEnvelope.nonce,
        envelope_ciphertext: activeEnvelope.ciphertext,
        envelope_auth_tag: activeEnvelope.authenticationTag,
        recovery_code_hashes: recoveryCodeHashes,
        recovery_codes_consumed: 0,
        activated_at: new Date(),
        last_verified_at: new Date()
      }
    });

    await logAuthenticationEvent({
      event_code: 'AUTH_MFA_ACTIVATED',
      outcome: 'Success',
      actor_user_id: userId,
      sanitized_metadata: { action: 'MFA activated successfully' }
    });

    return { recoveryCodes };
  }

  /**
   * Regenerates recovery codes for an active MFA session, invalidating all old codes.
   */
  static async regenerateRecoveryCodes(userId: string): Promise<{ recoveryCodes: string[] }> {
    const mfa = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    if (!mfa || mfa.status !== 'ENABLED') {
      throw new Error('MFA is not fully enabled.');
    }

    const recoveryCodes: string[] = [];
    const recoveryCodeHashes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const code = randomBytes(6).toString('hex').toLowerCase();
      recoveryCodes.push(code);
      recoveryCodeHashes.push(this.hashRecoveryCode(code));
    }

    await prisma.userMfa.update({
      where: { id: mfa.id },
      data: {
        recovery_code_hashes: recoveryCodeHashes,
        recovery_codes_consumed: 0,
        last_verified_at: new Date()
      }
    });

    await logAuthenticationEvent({
      event_code: 'AUTH_MFA_RECOVERY_GENERATED',
      outcome: 'Success',
      actor_user_id: userId,
      sanitized_metadata: { action: 'MFA recovery codes regenerated' }
    });

    return { recoveryCodes };
  }

  /**
   * Verifies an MFA token during login or step-up.
   */
  static async verifyMfa(userId: string, token: string): Promise<boolean> {
    const mfa = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    if (!mfa || mfa.status !== 'ENABLED') {
      throw new Error('MFA is not enabled.');
    }

    const context = `mfa:active:${userId}`;
    const envelope = {
      version: mfa.envelope_version,
      algorithm: mfa.envelope_algorithm,
      keyId: mfa.envelope_key_id,
      nonce: mfa.envelope_nonce,
      ciphertext: mfa.envelope_ciphertext,
      authenticationTag: mfa.envelope_auth_tag
    };

    try {
      const secret = SecretEnvelopeService.decryptSecret(envelope, context);
      const isValid = verifySync({ token, secret }).valid;
      
      if (isValid) {
        await prisma.userMfa.update({
          where: { id: mfa.id },
          data: { last_verified_at: new Date() }
        });
        await logAuthenticationEvent({
          event_code: 'AUTH_MFA_VERIFIED',
          outcome: 'Success',
          actor_user_id: userId
        });
      } else {
        await logAuthenticationEvent({
          event_code: 'AUTH_MFA_VERIFICATION_FAILED',
          outcome: 'Failure',
          actor_user_id: userId,
          sanitized_metadata: { reason: 'Invalid TOTP token' }
        });
      }
      
      return isValid;
    } catch (e) {
      await logAuthenticationEvent({
        event_code: 'AUTH_MFA_VERIFICATION_FAILED',
        outcome: 'Failure',
        actor_user_id: userId,
        sanitized_metadata: { reason: 'Tampered envelope or wrong context' }
      });
      // Tampered envelope or wrong context
      return false;
    }
  }

  /**
   * Verifies a recovery code. If successful, consumes the code.
   * If all codes are consumed, transitions status to RECOVERY_REQUIRED.
   */
  static async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    const mfa = await prisma.userMfa.findUnique({ where: { user_id: userId } });
    if (!mfa || (mfa.status !== 'ENABLED' && mfa.status !== 'RECOVERY_REQUIRED')) {
      throw new Error('MFA is not active.');
    }

    const hashCode = this.hashRecoveryCode(code);
    const codeIndex = mfa.recovery_code_hashes.indexOf(hashCode);

    if (codeIndex === -1) {
      await logAuthenticationEvent({
        event_code: 'AUTH_MFA_RECOVERY_FAILED',
        outcome: 'Failure',
        actor_user_id: userId,
        sanitized_metadata: { reason: 'Invalid or consumed recovery code' }
      });
      return false; // Code not found or already consumed
    }

    // Remove the consumed code
    const updatedHashes = [...mfa.recovery_code_hashes];
    updatedHashes.splice(codeIndex, 1);
    
    const consumed = mfa.recovery_codes_consumed + 1;
    const newStatus = updatedHashes.length === 0 ? 'RECOVERY_REQUIRED' : mfa.status;

    await prisma.userMfa.update({
      where: { id: mfa.id },
      data: {
        recovery_code_hashes: updatedHashes,
        recovery_codes_consumed: consumed,
        status: newStatus,
        last_verified_at: new Date()
      }
    });

    await logAuthenticationEvent({
      event_code: 'AUTH_MFA_RECOVERY_VERIFIED',
      outcome: 'Success',
      actor_user_id: userId,
      sanitized_metadata: { action: 'Recovery code verified and consumed', remaining_codes: updatedHashes.length }
    });

    return true;
  }

  /**
   * Resets MFA for a user, disabling it completely.
   */
  static async resetMfa(userId: string): Promise<void> {
    await prisma.userMfa.update({
      where: { user_id: userId },
      data: {
        status: 'DISABLED',
        envelope_ciphertext: '',
        envelope_nonce: '',
        envelope_auth_tag: '',
        recovery_code_hashes: [],
        reset_at: new Date()
      }
    });

    await logAuthenticationEvent({
      event_code: 'AUTH_MFA_RESET',
      outcome: 'Success',
      actor_user_id: userId,
      sanitized_metadata: { action: 'MFA was reset and disabled' }
    });
  }

  private static hashRecoveryCode(code: string): string {
    return createHash('sha256').update(code.trim().toLowerCase()).digest('hex');
  }
}
