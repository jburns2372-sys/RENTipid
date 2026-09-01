import { LISTINGBRIDGE_FEATURE_FLAGS } from './feature-flags';

export interface ListingBridgeSystemSettingSeedDefinition {
  readonly setting_key: string;
  readonly setting_value: string;
  readonly description: string;
}

export const LISTINGBRIDGE_DEFAULT_SYSTEM_SETTINGS: readonly ListingBridgeSystemSettingSeedDefinition[] = Object.freeze([
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.GLOBAL,
    setting_value: 'true',
    description: 'Master kill-switch for ListingBridge v1.0 import subsystem',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.FILE_IMPORT,
    setting_value: 'true',
    description: 'Enable structured file upload imports (CSV, JSON, PDF)',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.URL_IMPORT,
    setting_value: 'true',
    description: 'Enable secure URL retrieval imports',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.API_CONNECTORS,
    setting_value: 'true',
    description: 'Enable authorized partner API connectors',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.MEDIA_IMPORT,
    setting_value: 'true',
    description: 'Enable media asset retrieval and SHA-256 deduplication',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.AI_MAPPING,
    setting_value: 'true',
    description: 'Enable Unified AI semantic property and amenity mapping',
  },
  {
    setting_key: LISTINGBRIDGE_FEATURE_FLAGS.AVAILABILITY_IMPORT,
    setting_value: 'true',
    description: 'Enable external availability calendar import',
  },
]);

export interface ListingBridgeSystemSettingUpsertClient {
  readonly systemSetting: {
    upsert(args: {
      where: { setting_key: string };
      update: { description?: string };
      create: { setting_key: string; setting_value: string; description?: string };
    }): Promise<unknown>;
  };
}

/**
 * Idempotently seeds or syncs the required ListingBridge SystemSetting records.
 * Uses upsert with non-destructive update semantics so that existing administrator
 * overrides are preserved while missing required flags are initialized with safe defaults.
 */
export async function seedListingBridgeSystemSettings(
  db: ListingBridgeSystemSettingUpsertClient,
): Promise<readonly ListingBridgeSystemSettingSeedDefinition[]> {
  for (const setting of LISTINGBRIDGE_DEFAULT_SYSTEM_SETTINGS) {
    await db.systemSetting.upsert({
      where: { setting_key: setting.setting_key },
      update: { description: setting.description },
      create: {
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
        description: setting.description,
      },
    });
  }
  return LISTINGBRIDGE_DEFAULT_SYSTEM_SETTINGS;
}
