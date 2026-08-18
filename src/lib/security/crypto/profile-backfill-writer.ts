import { PrismaClient } from '@prisma/client';
import {
  ProfileBackfillField,
  ProfileBackfillState,
  ProfileBackfillRecordOutcome,
  ProfileBackfillLockOutcome,
  ProfileBackfillStructuredWriteResult
} from './profile-backfill-types';
import { ProfileBackfillClassifier } from './profile-backfill-classifier';
import { ProfileFieldProtection, ProfileFieldContext } from './profile-field-protection';
import { KeyProvider, KeyPurpose } from './key-provider';

export class ProfileBackfillWriter {
  private readonly LOCK_ID: number;
  private pinnedKeyVersion?: string;
  private readonly lockPrisma: PrismaClient;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly delayFn: (ms: number) => Promise<void> = (ms) => new Promise(r => setTimeout(r, ms)),
    lockId: number = 5054321
  ) {
    this.LOCK_ID = lockId;
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL missing');
    const url = new URL(dbUrl);
    url.searchParams.set('connection_limit', '1');
    this.lockPrisma = new PrismaClient({
      datasources: { db: { url: url.toString() } }
    });
  }

  public async acquireLock(): Promise<ProfileBackfillLockOutcome> {
    const result = await this.lockPrisma.$queryRaw<{ pg_try_advisory_lock?: boolean }[]>`SELECT pg_try_advisory_lock(${this.LOCK_ID})`;
    if (result && result.length > 0 && result[0].pg_try_advisory_lock === true) {
      return ProfileBackfillLockOutcome.LOCK_ACQUIRED;
    }
    return ProfileBackfillLockOutcome.LOCK_ALREADY_HELD;
  }

  public async releaseLock(): Promise<ProfileBackfillLockOutcome> {
    try {
      const result = await this.lockPrisma.$queryRaw<{ pg_advisory_unlock?: boolean }[]>`SELECT pg_advisory_unlock(${this.LOCK_ID})`;
      if (result && result.length > 0 && result[0].pg_advisory_unlock === true) {
        return ProfileBackfillLockOutcome.LOCK_RELEASED;
      }
      return ProfileBackfillLockOutcome.LOCK_RELEASE_FAILED;
    } catch {
      return ProfileBackfillLockOutcome.LOCK_RELEASE_FAILED;
    }
  }

  public async disconnectLock(): Promise<void> {
    await this.lockPrisma.$disconnect();
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

  private verifyEnvelopeMetadata(ciphertext: string): void {
    if (!this.pinnedKeyVersion) throw new Error('Key not pinned');
    let envelope: { keyId?: string };
    try {
      envelope = JSON.parse(ciphertext);
    } catch {
      throw new Error('Malformed envelope JSON');
    }
    if (envelope.keyId !== this.pinnedKeyVersion) {
      throw new Error('Envelope key version does not match pinned version');
    }
  }

  private async retryTransient<T>(operation: () => Promise<T>, retries: number = 2): Promise<T> {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        return await operation();
      } catch (e: Error | unknown) {
        if (attempt >= retries) throw e;
        
        const msg = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();
        const isTransient = msg.includes('timeout') || msg.includes('deadlock') || msg.includes('connection');
        if (!isTransient) throw e;
        
        attempt++;
        await this.delayFn(attempt * 100);
      }
    }
    throw new Error('Unreachable retry state');
  }

  public async processUserProfile(id: string): Promise<ProfileBackfillStructuredWriteResult> {
    const res: ProfileBackfillStructuredWriteResult = {
      outcome: ProfileBackfillRecordOutcome.NOT_REQUIRED,
      profileType: 'User',
      fieldsEligible: 0,
      fieldsBackfilled: 0,
      fieldsAlreadyCompliant: 0,
      fieldsNotRequired: 0,
      fieldsQuarantined: 0,
      fieldsConcurrent: 0
    };

    return this.retryTransient(async () => {
      this.verifyKeyPinned();

      return this.prisma.$transaction(async (tx) => {
        const record = await tx.userProfile.findUnique({ where: { id } });
        if (!record) return res;

        const classification = ProfileBackfillClassifier.classifyField(
          ProfileBackfillField.USER_ADDRESS, 
          record.address, 
          record.address_encrypted
        );

        if (classification.isQuarantined) {
           res.outcome = this.mapQuarantineState(classification.state);
           res.fieldsQuarantined = 1;
           return res;
        }

        if (classification.state === ProfileBackfillState.ABSENT) {
          res.outcome = ProfileBackfillRecordOutcome.NOT_REQUIRED;
          res.fieldsNotRequired = 1;
          return res;
        }

        if (classification.state === ProfileBackfillState.ENCRYPTED_ONLY || classification.state === ProfileBackfillState.DUAL_MATCH) {
          res.outcome = ProfileBackfillRecordOutcome.ALREADY_COMPLIANT;
          res.fieldsAlreadyCompliant = 1;
          return res;
        }

        res.fieldsEligible = 1;
        const legacyValue = record.address;
        if (legacyValue === null || legacyValue === undefined) {
           res.outcome = ProfileBackfillRecordOutcome.NOT_REQUIRED;
           res.fieldsNotRequired = 1;
           res.fieldsEligible = 0;
           return res;
        }

        const encrypted = ProfileFieldProtection.protect(legacyValue, ProfileFieldContext.USER_ADDRESS);
        this.verifyEnvelopeMetadata(encrypted);
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
          res.outcome = ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE;
          res.fieldsConcurrent = 1;
          return res;
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

        res.outcome = ProfileBackfillRecordOutcome.BACKFILLED;
        res.fieldsBackfilled = 1;
        return res;
      });
    });
  }

  public async processBusinessProfile(id: string): Promise<ProfileBackfillStructuredWriteResult> {
    const res: ProfileBackfillStructuredWriteResult = {
      outcome: ProfileBackfillRecordOutcome.NOT_REQUIRED,
      profileType: 'Business',
      fieldsEligible: 0,
      fieldsBackfilled: 0,
      fieldsAlreadyCompliant: 0,
      fieldsNotRequired: 0,
      fieldsQuarantined: 0,
      fieldsConcurrent: 0
    };

    return this.retryTransient(async () => {
      this.verifyKeyPinned();

      return this.prisma.$transaction(async (tx) => {
        const record = await tx.businessProfile.findUnique({ where: { id } });
        if (!record) return res;

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

        if (addrCls.isQuarantined || regCls.isQuarantined) {
          res.outcome = addrCls.isQuarantined ? this.mapQuarantineState(addrCls.state) : this.mapQuarantineState(regCls.state);
          res.fieldsQuarantined = (addrCls.isQuarantined ? 1 : 0) + (regCls.isQuarantined ? 1 : 0);
          return res;
        }

        if (addrCls.state === ProfileBackfillState.ABSENT) res.fieldsNotRequired++;
        else if (addrCls.state === ProfileBackfillState.ENCRYPTED_ONLY || addrCls.state === ProfileBackfillState.DUAL_MATCH) res.fieldsAlreadyCompliant++;
        else res.fieldsEligible++;

        if (regCls.state === ProfileBackfillState.ABSENT) res.fieldsNotRequired++;
        else if (regCls.state === ProfileBackfillState.ENCRYPTED_ONLY || regCls.state === ProfileBackfillState.DUAL_MATCH) res.fieldsAlreadyCompliant++;
        else res.fieldsEligible++;

        if (res.fieldsEligible === 0) {
          res.outcome = ProfileBackfillRecordOutcome.ALREADY_COMPLIANT;
          return res;
        }

        const updateWhere: Record<string, unknown> = { id };
        const updateData: Record<string, unknown> = {};
        
        let encryptedAddr: string | null = null;
        let encryptedReg: string | null = null;

        if (addrCls.state === ProfileBackfillState.LEGACY_ONLY && record.business_address !== null && record.business_address !== undefined) {
           encryptedAddr = ProfileFieldProtection.protect(record.business_address, ProfileFieldContext.BUSINESS_ADDRESS);
           this.verifyEnvelopeMetadata(encryptedAddr);
           updateWhere.business_address_encrypted = null;
           updateWhere.business_address = record.business_address;
           updateData.business_address_encrypted = encryptedAddr;
        }

        if (regCls.state === ProfileBackfillState.LEGACY_ONLY && record.business_registration_number !== null && record.business_registration_number !== undefined) {
           encryptedReg = ProfileFieldProtection.protect(record.business_registration_number, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER);
           this.verifyEnvelopeMetadata(encryptedReg);
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
          res.outcome = ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE;
          res.fieldsConcurrent = res.fieldsEligible;
          return res;
        }
        if (updateResult.count > 1) {
          throw new Error('Invariant violation: update count > 1');
        }

        const verifiedRecord = await tx.businessProfile.findUnique({ where: { id } });
        if (!verifiedRecord) throw new Error('Verification failure: record vanished');

        if (addrCls.state === ProfileBackfillState.LEGACY_ONLY) {
          if (verifiedRecord.business_address !== record.business_address) throw new Error('Verification failure: addr legacy altered');
          const rd = ProfileFieldProtection.read(verifiedRecord.business_address_encrypted, null, ProfileFieldContext.BUSINESS_ADDRESS);
          if (rd.value !== record.business_address) throw new Error('Verification failure: addr mismatch');
        }

        if (regCls.state === ProfileBackfillState.LEGACY_ONLY) {
          if (verifiedRecord.business_registration_number !== record.business_registration_number) throw new Error('Verification failure: reg legacy altered');
          const rd = ProfileFieldProtection.read(verifiedRecord.business_registration_number_encrypted, null, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER);
          if (rd.value !== record.business_registration_number) throw new Error('Verification failure: reg mismatch');
        }

        res.outcome = ProfileBackfillRecordOutcome.BACKFILLED;
        res.fieldsBackfilled = res.fieldsEligible;
        return res;
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
