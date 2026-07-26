import { PrismaClient } from '@prisma/client';
import {
  ProfileBackfillField,
  ProfileBackfillState,
  ProfileBackfillRecordOutcome,
  ProfileBackfillLockOutcome} from './profile-backfill-types';
import { ProfileBackfillClassifier } from './profile-backfill-classifier';
import { ProfileFieldProtection, ProfileFieldContext } from './profile-field-protection';
import { KeyProvider, KeyPurpose } from './key-provider';

export class ProfileBackfillWriter {
  private readonly LOCK_ID = 5054321; // Derived hash for rentipid.phase5f.profile-backfill.v1
  private pinnedKeyVersion?: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly lockPrisma: PrismaClient,
    private readonly delayFn: (ms: number) => Promise<void> = (ms) => new Promise(r => setTimeout(r, ms))
  ) {}

  public async acquireLock(): Promise<ProfileBackfillLockOutcome> {
    const result: { pg_try_advisory_lock?: boolean; pg_advisory_unlock?: boolean }[] = await this.lockPrisma.$queryRawUnsafe('SELECT pg_try_advisory_lock(' + this.LOCK_ID + ');');
    if (result && result.length > 0 && result[0].pg_try_advisory_lock === true) {
      return ProfileBackfillLockOutcome.LOCK_ACQUIRED;
    }
    return ProfileBackfillLockOutcome.LOCK_ALREADY_HELD;
  }

  public async releaseLock(): Promise<ProfileBackfillLockOutcome> {
    try {
      const result: { pg_try_advisory_lock?: boolean; pg_advisory_unlock?: boolean }[] = await this.lockPrisma.$queryRawUnsafe('SELECT pg_advisory_unlock(' + this.LOCK_ID + ');');
      if (result && result.length > 0 && result[0].pg_advisory_unlock === true) {
        return ProfileBackfillLockOutcome.LOCK_RELEASED;
      }
      return ProfileBackfillLockOutcome.LOCK_RELEASE_FAILED;
    } catch {
      return ProfileBackfillLockOutcome.LOCK_RELEASE_FAILED;
    }
  }

  public pinKeyVersion(): string {
    const activeKey = KeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
    this.pinnedKeyVersion = activeKey.id;
    return this.pinnedKeyVersion;
  }
  
  public verifyKeyPinned(): void {
    if (!this.pinnedKeyVersion) throw new Error('Key not pinned');
    const activeKey = KeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
    if (activeKey.id !== this.pinnedKeyVersion) {
      throw new Error('Key version changed during run');
    }
  }

  private async retryTransient<T>(operation: () => Promise<T>, retries: number = 3): Promise<T> {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        return await operation();
      } catch (e: Error | unknown) {
        if (attempt >= retries) throw e;
        
        // Only retry transient DB issues (e.g., deadlock, timeout, connectivity)
        const msg = e.message?.toLowerCase() || '';
        const isTransient = msg.includes('timeout') || msg.includes('deadlock') || msg.includes('connection');
        if (!isTransient) throw e;
        
        attempt++;
        await this.delayFn(attempt * 100);
      }
    }
    throw new Error('Unreachable retry state');
  }

  public async processUserProfile(id: string): Promise<ProfileBackfillRecordOutcome> {
    return this.retryTransient(async () => {
      this.verifyKeyPinned();

      return this.prisma.$transaction(async (tx) => {
        const record = await tx.userProfile.findUnique({ where: { id } });
        if (!record) return ProfileBackfillRecordOutcome.NOT_REQUIRED;

        const classification = ProfileBackfillClassifier.classifyField(
          ProfileBackfillField.USER_ADDRESS, 
          record.address, 
          record.address_encrypted
        );

        if (classification.isQuarantined) {
           return this.mapQuarantineState(classification.state);
        }

        if (classification.state !== ProfileBackfillState.LEGACY_ONLY) {
          return ProfileBackfillRecordOutcome.ALREADY_COMPLIANT; 
        }

        const legacyValue = record.address;
        if (legacyValue === null || legacyValue === undefined) {
           return ProfileBackfillRecordOutcome.NOT_REQUIRED;
        }

        const encrypted = ProfileFieldProtection.protect(legacyValue, ProfileFieldContext.USER_ADDRESS);
        
        this.verifyKeyPinned();

        const updateResult = await tx.userProfile.updateMany({
          where: {
            id,
            address_encrypted: null,
            address: legacyValue,
          },
          data: {
            address_encrypted: encrypted
          }
        });

        if (updateResult.count === 0) {
          return ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE;
        }
        if (updateResult.count > 1) {
          throw new Error('Invariant violation: update count > 1');
        }

        const verifiedRecord = await tx.userProfile.findUnique({ where: { id } });
        if (!verifiedRecord || verifiedRecord.address !== legacyValue) {
           throw new Error('Verification failure: legacy value altered');
        }

        const readResult = ProfileFieldProtection.read(verifiedRecord.address_encrypted, null, ProfileFieldContext.USER_ADDRESS);
        if (readResult.value !== legacyValue) {
           throw new Error('Verification failure: decrypted companion does not match legacy value');
        }

        return ProfileBackfillRecordOutcome.BACKFILLED;
      });
    });
  }

  public async processBusinessProfile(id: string): Promise<ProfileBackfillRecordOutcome> {
    return this.retryTransient(async () => {
      this.verifyKeyPinned();

      return this.prisma.$transaction(async (tx) => {
        const record = await tx.businessProfile.findUnique({ where: { id } });
        if (!record) return ProfileBackfillRecordOutcome.NOT_REQUIRED;

        const addrCls = ProfileBackfillClassifier.classifyField(
          ProfileBackfillField.BUSINESS_ADDRESS,
          record.business_address,
          record.business_address_encrypted
        );
        const regCls = ProfileBackfillClassifier.classifyField(
          ProfileBackfillField.BUSINESS_REGISTRATION_NUMBER,
          record.business_registration_number,
          record.business_registration_number_encrypted
        );

        if (addrCls.isQuarantined) return this.mapQuarantineState(addrCls.state);
        if (regCls.isQuarantined) return this.mapQuarantineState(regCls.state);

        const addrEligible = addrCls.state === ProfileBackfillState.LEGACY_ONLY;
        const regEligible = regCls.state === ProfileBackfillState.LEGACY_ONLY;

        if (!addrEligible && !regEligible) {
          return ProfileBackfillRecordOutcome.ALREADY_COMPLIANT;
        }

        const updateWhere: Error | unknown = { id };
        const updateData: Record<string, unknown> = {};
        
        let encryptedAddr: string | null = null;
        let encryptedReg: string | null = null;

        if (addrEligible && record.business_address !== null && record.business_address !== undefined) {
           encryptedAddr = ProfileFieldProtection.protect(record.business_address, ProfileFieldContext.BUSINESS_ADDRESS);
           updateWhere.business_address_encrypted = null;
           updateWhere.business_address = record.business_address;
           updateData.business_address_encrypted = encryptedAddr;
        }

        if (regEligible && record.business_registration_number !== null && record.business_registration_number !== undefined) {
           encryptedReg = ProfileFieldProtection.protect(record.business_registration_number, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER);
           updateWhere.business_registration_number_encrypted = null;
           updateWhere.business_registration_number = record.business_registration_number;
           updateData.business_registration_number_encrypted = encryptedReg;
        }
        
        this.verifyKeyPinned();

        const updateResult = await tx.businessProfile.updateMany({
          where: updateWhere,
          data: updateData
        });

        if (updateResult.count === 0) {
          return ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE;
        }
        if (updateResult.count > 1) {
          throw new Error('Invariant violation: update count > 1');
        }

        const verifiedRecord = await tx.businessProfile.findUnique({ where: { id } });
        if (!verifiedRecord) throw new Error('Verification failure: record vanished');

        if (addrEligible) {
          if (verifiedRecord.business_address !== record.business_address) throw new Error('Verification failure: addr legacy altered');
          const rd = ProfileFieldProtection.read(verifiedRecord.business_address_encrypted, null, ProfileFieldContext.BUSINESS_ADDRESS);
          if (rd.value !== record.business_address) throw new Error('Verification failure: addr mismatch');
        }

        if (regEligible) {
          if (verifiedRecord.business_registration_number !== record.business_registration_number) throw new Error('Verification failure: reg legacy altered');
          const rd = ProfileFieldProtection.read(verifiedRecord.business_registration_number_encrypted, null, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER);
          if (rd.value !== record.business_registration_number) throw new Error('Verification failure: reg mismatch');
        }

        return ProfileBackfillRecordOutcome.BACKFILLED;
      });
    });
  }

  private mapQuarantineState(state: ProfileBackfillState): ProfileBackfillRecordOutcome {
    switch(state) {
       case ProfileBackfillState.DUAL_MISMATCH: return ProfileBackfillRecordOutcome.QUARANTINED_DUAL_MISMATCH;
       case ProfileBackfillState.INVALID_CIPHERTEXT: return ProfileBackfillRecordOutcome.QUARANTINED_INVALID_CIPHERTEXT;
       case ProfileBackfillState.INVALID_LEGACY_VALUE: return ProfileBackfillRecordOutcome.QUARANTINED_INVALID_LEGACY;
       default: return ProfileBackfillRecordOutcome.QUARANTINED_UNSUPPORTED;
    }
  }
}

