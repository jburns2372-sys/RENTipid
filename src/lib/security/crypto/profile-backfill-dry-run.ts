import { PrismaClient } from '@prisma/client';
import { KeyProvider, KeyPurpose } from './key-provider';
import { ProfileBackfillClassifier } from './profile-backfill-classifier';
import {
  ProfileBackfillField,
  ProfileBackfillState,
  ProfileBackfillCounters,
  ProfileBackfillReport,
} from './profile-backfill-types';
import { createHash } from 'node:crypto';

export class ProfileBackfillDryRun {
  constructor(private readonly prisma: PrismaClient) {}

  public async scan(batchSize: number = 10, syntheticPrefix?: string): Promise<ProfileBackfillReport> {
    if (batchSize < 1) throw new Error('Batch size must be positive');
    if (batchSize > 1000) throw new Error('Batch size exceeds maximum limit');

    const startTimestamp = new Date().toISOString();
    let pinnedKeyVersion: string | undefined;

    // Verify key provider availability
    try {
      const activeKey = KeyProvider.getActiveKey(KeyPurpose.FIELD_ENCRYPTION);
      pinnedKeyVersion = activeKey.id;
    } catch (e: Error | unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error('Key provider failure: ' + msg);
    }

    const counters: ProfileBackfillCounters = {
      totalProfilesScanned: 0,
      totalFieldsScanned: 0,
      totalEligible: 0,
      totalQuarantined: 0,
      totalAlreadyCompliant: 0,
      totalFailed: 0,

      absent: 0,
      legacyOnly: 0,
      encryptedOnly: 0,
      dualMatch: 0,
      dualMismatch: 0,
      invalidCiphertext: 0,
      invalidLegacy: 0,
      unsupportedState: 0,

      batchesProcessed: 0,
    };

    // Process UserProfile
    let lastUserId: string | undefined = undefined;
    while (true) {
      const batch = await this.prisma.userProfile.findMany({
        where: syntheticPrefix ? { id: { startsWith: syntheticPrefix } } : undefined,
        take: batchSize,
        skip: lastUserId ? 1 : 0,
        cursor: lastUserId ? { id: lastUserId } : undefined,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          address: true,
          address_encrypted: true,
        },
      });

      if (batch.length === 0) break;

      counters.batchesProcessed++;
      for (const record of batch) {
        counters.totalProfilesScanned++;
        counters.totalFieldsScanned++;

        const result = ProfileBackfillClassifier.classifyField(
          ProfileBackfillField.USER_ADDRESS,
          record.address,
          record.address_encrypted
        );

        this.applyResultToCounters(result.state, counters);
      }

      lastUserId = batch[batch.length - 1].id;
    }

    // Process BusinessProfile
    let lastBusinessId: string | undefined = undefined;
    while (true) {
      const batch = await this.prisma.businessProfile.findMany({
        where: syntheticPrefix ? { id: { startsWith: syntheticPrefix } } : undefined,
        take: batchSize,
        skip: lastBusinessId ? 1 : 0,
        cursor: lastBusinessId ? { id: lastBusinessId } : undefined,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          business_address: true,
          business_address_encrypted: true,
          business_registration_number: true,
          business_registration_number_encrypted: true,
        },
      });

      if (batch.length === 0) break;

      counters.batchesProcessed++;
      for (const record of batch) {
        counters.totalProfilesScanned++;
        counters.totalFieldsScanned += 2;

        const addressResult = ProfileBackfillClassifier.classifyField(
          ProfileBackfillField.BUSINESS_ADDRESS,
          record.business_address,
          record.business_address_encrypted
        );
        this.applyResultToCounters(addressResult.state, counters);

        const regNumResult = ProfileBackfillClassifier.classifyField(
          ProfileBackfillField.BUSINESS_REGISTRATION_NUMBER,
          record.business_registration_number,
          record.business_registration_number_encrypted
        );
        this.applyResultToCounters(regNumResult.state, counters);
      }

      lastBusinessId = batch[batch.length - 1].id;
    }

    const completionTimestamp = new Date().toISOString();

    return {
      startTimestamp,
      completionTimestamp,
      config: { batchSize },
      counters,
      pinnedKeyVersion,
    };
  }

  private applyResultToCounters(state: ProfileBackfillState, counters: ProfileBackfillCounters) {
    switch (state) {
      case ProfileBackfillState.ABSENT:
        counters.absent++;
        break;
      case ProfileBackfillState.LEGACY_ONLY:
        counters.legacyOnly++;
        counters.totalEligible++;
        break;
      case ProfileBackfillState.ENCRYPTED_ONLY:
        counters.encryptedOnly++;
        counters.totalAlreadyCompliant++;
        break;
      case ProfileBackfillState.DUAL_MATCH:
        counters.dualMatch++;
        counters.totalAlreadyCompliant++;
        break;
      case ProfileBackfillState.DUAL_MISMATCH:
        counters.dualMismatch++;
        counters.totalQuarantined++;
        break;
      case ProfileBackfillState.INVALID_CIPHERTEXT:
        counters.invalidCiphertext++;
        counters.totalQuarantined++;
        break;
      case ProfileBackfillState.INVALID_LEGACY_VALUE:
        counters.invalidLegacy++;
        counters.totalQuarantined++;
        break;
      case ProfileBackfillState.UNSUPPORTED_STATE:
        counters.unsupportedState++;
        counters.totalQuarantined++;
        break;
    }
  }

  public hashIdentifier(id: string): string {
    return createHash('sha256').update(id).digest('hex').substring(0, 8);
  }
}
