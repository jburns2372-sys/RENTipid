import { PrismaClient } from '@prisma/client';
import { SecretEnvelope, SecretEnvelopeService } from './secret-envelope';
import { KeyProvider, KeyPurpose } from './key-provider';
import { ProfileFieldContext } from './profile-field-protection';

export interface RotationResult {
  scanned: number;
  rotated: number;
  alreadyCurrent: number;
  stale: number;
  failed: number;
  rotatedFields: number;
}

export class KeyRotationService {
  static async rotateUserProfiles(prisma: PrismaClient, batchSize = 50): Promise<RotationResult> {
    const activeKey = KeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
    const result: RotationResult = {
      scanned: 0,
      rotated: 0,
      alreadyCurrent: 0,
      stale: 0,
      failed: 0,
      rotatedFields: 0
    };

    let lastId = '';
    while (true) {
      const records = await prisma.userProfile.findMany({
        take: batchSize,
        ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
        orderBy: { id: 'asc' }
      });

      if (records.length === 0) break;

      for (const record of records) {
        lastId = record.id;
        result.scanned++;

        if (!record.address_encrypted) {
          result.alreadyCurrent++;
          continue;
        }

        let envelope: SecretEnvelope;
        try {
          envelope = JSON.parse(record.address_encrypted) as SecretEnvelope;
          if (envelope.keyId === activeKey.id) {
            result.alreadyCurrent++;
            continue;
          }
        } catch (e) {
          result.failed++;
          continue;
        }

        let plaintext: string;
        try {
          plaintext = SecretEnvelopeService.decryptSecret(envelope, ProfileFieldContext.USER_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
        } catch (e) {
          result.failed++;
          continue;
        }

        const newEnvelope = SecretEnvelopeService.encryptSecret(plaintext, ProfileFieldContext.USER_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
        const newCiphertext = JSON.stringify(newEnvelope);

        try {
          await prisma.$transaction(async (tx) => {
            const current = await tx.userProfile.findUnique({
              where: { id: record.id }
            });

            if (!current || current.address_encrypted !== record.address_encrypted) {
              result.stale++;
              return;
            }

            await tx.userProfile.update({
              where: { id: record.id },
              data: { address_encrypted: newCiphertext }
            });

            const verify = await tx.userProfile.findUnique({ where: { id: record.id } });
            const verifyEnvelope = JSON.parse(verify!.address_encrypted!) as SecretEnvelope;
            const verifyPlaintext = SecretEnvelopeService.decryptSecret(verifyEnvelope, ProfileFieldContext.USER_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
            if (verifyPlaintext !== plaintext) {
              throw new Error('Verification_Failed');
            }
          });

          // Transaction completed, meaning if not stale, it was rotated
          const reCheck = await prisma.userProfile.findUnique({ where: { id: record.id }});
          if (reCheck?.address_encrypted === newCiphertext) {
             result.rotated++;
             result.rotatedFields++;
          }
        } catch (e) {
           result.failed++;
        }
      }
    }

    return result;
  }

  static async rotateBusinessProfiles(prisma: PrismaClient, batchSize = 50): Promise<RotationResult> {
    const activeKey = KeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
    const result: RotationResult = {
      scanned: 0,
      rotated: 0,
      alreadyCurrent: 0,
      stale: 0,
      failed: 0,
      rotatedFields: 0
    };

    let lastId = '';
    while (true) {
      const records = await prisma.businessProfile.findMany({
        take: batchSize,
        ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
        orderBy: { id: 'asc' }
      });

      if (records.length === 0) break;

      for (const record of records) {
        lastId = record.id;
        result.scanned++;

        let addressRotated = false;
        let regRotated = false;
        let newAddressCiphertext = record.business_address_encrypted;
        let newRegCiphertext = record.business_registration_number_encrypted;

        let originalAddressPlaintext: string | null = null;
        let originalRegPlaintext: string | null = null;
        let fieldFailed = false;

        if (record.business_address_encrypted) {
          try {
            const envelope = JSON.parse(record.business_address_encrypted) as SecretEnvelope;
            if (envelope.keyId !== activeKey.id) {
              originalAddressPlaintext = SecretEnvelopeService.decryptSecret(envelope, ProfileFieldContext.BUSINESS_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
              const newEnvelope = SecretEnvelopeService.encryptSecret(originalAddressPlaintext, ProfileFieldContext.BUSINESS_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
              newAddressCiphertext = JSON.stringify(newEnvelope);
              addressRotated = true;
            }
          } catch (e) {
            fieldFailed = true;
          }
        }

        if (record.business_registration_number_encrypted) {
          try {
            const envelope = JSON.parse(record.business_registration_number_encrypted) as SecretEnvelope;
            if (envelope.keyId !== activeKey.id) {
              originalRegPlaintext = SecretEnvelopeService.decryptSecret(envelope, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER, KeyPurpose.FIELD_ENCRYPTION);
              const newEnvelope = SecretEnvelopeService.encryptSecret(originalRegPlaintext, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER, KeyPurpose.FIELD_ENCRYPTION);
              newRegCiphertext = JSON.stringify(newEnvelope);
              regRotated = true;
            }
          } catch (e) {
            fieldFailed = true;
          }
        }

        if (fieldFailed) {
          result.failed++;
          continue;
        }

        if (!addressRotated && !regRotated) {
          result.alreadyCurrent++;
          continue;
        }

        try {
          await prisma.$transaction(async (tx) => {
            const current = await tx.businessProfile.findUnique({
              where: { id: record.id }
            });

            if (!current ||
                current.business_address_encrypted !== record.business_address_encrypted ||
                current.business_registration_number_encrypted !== record.business_registration_number_encrypted) {
              result.stale++;
              return;
            }

            await tx.businessProfile.update({
              where: { id: record.id },
              data: {
                business_address_encrypted: newAddressCiphertext,
                business_registration_number_encrypted: newRegCiphertext
              }
            });

            const verify = await tx.businessProfile.findUnique({ where: { id: record.id } });
            if (addressRotated) {
              const verifyEnvelope = JSON.parse(verify!.business_address_encrypted!) as SecretEnvelope;
              const verifyPlaintext = SecretEnvelopeService.decryptSecret(verifyEnvelope, ProfileFieldContext.BUSINESS_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
              if (verifyPlaintext !== originalAddressPlaintext) throw new Error('Verification_Failed');
            }
            if (regRotated) {
              const verifyEnvelope = JSON.parse(verify!.business_registration_number_encrypted!) as SecretEnvelope;
              const verifyPlaintext = SecretEnvelopeService.decryptSecret(verifyEnvelope, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER, KeyPurpose.FIELD_ENCRYPTION);
              if (verifyPlaintext !== originalRegPlaintext) throw new Error('Verification_Failed');
            }
          });

          const reCheck = await prisma.businessProfile.findUnique({ where: { id: record.id }});
          if (reCheck?.business_address_encrypted === newAddressCiphertext &&
              reCheck?.business_registration_number_encrypted === newRegCiphertext) {
             result.rotated++;
             if (addressRotated) result.rotatedFields++;
             if (regRotated) result.rotatedFields++;
          }
        } catch (e) {
           result.failed++;
        }
      }
    }

    return result;
  }
}
