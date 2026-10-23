import { LISTINGBRIDGE_FEATURE_FLAGS } from './feature-flags';

export interface ListingBridgeSystemSettingSeedDefinition {
  readonly setting_key: string;
  readonly setting_value: string;
  readonly description: string;
}

export const LISTINGBRIDGE_DEFAULT_SYSTEM_SETTINGS: readonly ListingBridgeSystemSettingSeedDefinition[] = Object.freeze([
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.GLOBAL,
    setting_value: 'false',
    description: 'Master kill-switch for ListingBridge v1.0 import subsystem (retired)',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.FILE_IMPORT,
    setting_value: 'false',
    description: 'Enable structured file upload imports (retired)',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.URL_IMPORT,
    setting_value: 'false',
    description: 'Enable secure URL retrieval imports (retired)',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.API_CONNECTORS,
    setting_value: 'false',
    description: 'Enable authorized partner API connectors (retired)',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.MEDIA_IMPORT,
    setting_value: 'false',
    description: 'Enable media asset retrieval and SHA-256 deduplication (retired)',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.AI_MAPPING,
    setting_value: 'false',
    description: 'Enable Unified AI semantic property and amenity mapping (retired)',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.AVAILABILITY_IMPORT,
    setting_value: 'false',
    description: 'Enable external availability calendar import (retired)',
  },
]);

export interface ListingBridgeSystemSettingUpsertClient {
  readonly systemSetting: {
    upsert(args: {
      where: { setting_key: string };
      update: { description?: string; setting_value?: string };
      create: { setting_key: string; setting_value: string; description?: string };
    }): Promise<unknown>;
  };
}

/**
 * Idempotently seeds or syncs the required ListingBridge SystemSetting records.
 * Uses upsert semantics ensuring all ListingBridge capability flags reflect
 * the decommissioned / retired state ('false').
 */
export async function seedListingBridgeSystemSettings(
  db: ListingBridgeSystemSettingUpsertClient,
): Promise<readonly ListingBridgeSystemSettingSeedDefinition[]> {
  for (const setting of LISTINGBRIDGE_DEFAULT_SYSTEM_SETTINGS) {
    await db.systemSetting.upsert({
      where: { setting_key: setting.setting_key },
      update: {
        setting_value: setting.setting_value,
        description: setting.description,
      },
      create: {
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
        description: setting.description,
      },
    });
  }
  return LISTINGBRIDGE_DEFAULT_SYSTEM_SETTINGS;
}
