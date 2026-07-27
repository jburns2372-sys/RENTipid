import { PrismaClient } from '@prisma/client';
import { SecretEnvelope, SecretEnvelopeService } from './secret-envelope';
import { KeyProvider, KeyPurpose } from './key-provider';
import { ProfileFieldContext } from './profile-field-protection';

export class KeyRotationService {
  static async rotateUserProfiles(prisma: PrismaClient, batchSize = 50): Promise<{ rotated: number }> {
    const activeKey = KeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
    let rotated = 0;
    
    // Process in batches
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
        if (!record.address_encrypted) continue;

        let envelope: SecretEnvelope;
        try {
          envelope = JSON.parse(record.address_encrypted) as SecretEnvelope;
        } catch {
          continue;
        }

        if (envelope.keyId === activeKey.id) {
          continue; // Already using active key
        }

        // Decrypt with referenced approved key
        let plaintext: string;
        try {
          plaintext = SecretEnvelopeService.decryptSecret(envelope, ProfileFieldContext.USER_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
        } catch {
          // Unknown key fails closed - cannot rotate this record.
          continue;
        }

        // Reencrypt with active key
        const newEnvelope = SecretEnvelopeService.encryptSecret(plaintext, ProfileFieldContext.USER_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
        const newCiphertext = JSON.stringify(newEnvelope);

        // Atomic transaction with optimistic concurrency via envelope checking (to prevent stale rotation write)
        await prisma.$transaction(async (tx) => {
          const current = await tx.userProfile.findUnique({
            where: { id: record.id }
          });
          
          if (!current || current.address_encrypted !== record.address_encrypted) {
            // Stale record, someone updated it concurrently
            return;
          }

          await tx.userProfile.update({
            where: { id: record.id },
            data: { address_encrypted: newCiphertext }
          });
          
          // Verify decrypted value matches in transaction
          const verify = await tx.userProfile.findUnique({ where: { id: record.id } });
          const verifyEnvelope = JSON.parse(verify!.address_encrypted!) as SecretEnvelope;
          const verifyPlaintext = SecretEnvelopeService.decryptSecret(verifyEnvelope, ProfileFieldContext.USER_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
          if (verifyPlaintext !== plaintext) {
            throw new Error('Verification failed. Rolling back.');
          }
        });
        
        rotated++;
      }
    }
    
    return { rotated };
  }

  static async rotateBusinessProfiles(prisma: PrismaClient, batchSize = 50): Promise<{ rotated: number }> {
    const activeKey = KeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
    let rotated = 0;
    
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
        
        // We might have address and registration number
        let addressRotated = false;
        let regRotated = false;
        let newAddressCiphertext = record.business_address_encrypted;
        let newRegCiphertext = record.business_registration_number_encrypted;
        
        let originalAddressPlaintext: string | null = null;
        let originalRegPlaintext: string | null = null;

        if (record.business_address_encrypted) {
          try {
            const envelope = JSON.parse(record.business_address_encrypted) as SecretEnvelope;
            if (envelope.keyId !== activeKey.id) {
              originalAddressPlaintext = SecretEnvelopeService.decryptSecret(envelope, ProfileFieldContext.BUSINESS_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
              const newEnvelope = SecretEnvelopeService.encryptSecret(originalAddressPlaintext, ProfileFieldContext.BUSINESS_ADDRESS, KeyPurpose.FIELD_ENCRYPTION);
              newAddressCiphertext = JSON.stringify(newEnvelope);
              addressRotated = true;
            }
          } catch {}
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
          } catch {}
        }

        if (!addressRotated && !regRotated) {
          continue; // Already using active key or absent/corrupted
        }

        await prisma.$transaction(async (tx) => {
          const current = await tx.businessProfile.findUnique({
            where: { id: record.id }
          });
          
          if (!current || 
              current.business_address_encrypted !== record.business_address_encrypted ||
              current.business_registration_number_encrypted !== record.business_registration_number_encrypted) {
            // Stale record
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
            if (verifyPlaintext !== originalAddressPlaintext) throw new Error('Verification failed.');
          }
          if (regRotated) {
            const verifyEnvelope = JSON.parse(verify!.business_registration_number_encrypted!) as SecretEnvelope;
            const verifyPlaintext = SecretEnvelopeService.decryptSecret(verifyEnvelope, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER, KeyPurpose.FIELD_ENCRYPTION);
            if (verifyPlaintext !== originalRegPlaintext) throw new Error('Verification failed.');
          }
        });
        
        rotated++;
      }
    }
    
    return { rotated };
  }
}
