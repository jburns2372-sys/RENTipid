import {
  LISTINGBRIDGE_FEATURE_FLAGS,
  LISTINGBRIDGE_DEFAULT_SYSTEM_SETTINGS,
  seedListingBridgeSystemSettings,
  type ListingBridgeSystemSettingUpsertClient,
} from '../../../src/lib/listingbridge';

describe('ListingBridge Seed & Sync Authority (G1 Reopen)', () => {
  it('defines all seven required ListingBridge feature flag keys with valid defaults', () => {
    const requiredKeys = Object.values(LISTINGBRIDGE_FEATURE_FLAGS);
    expect(requiredKeys).toHaveLength(7);

    const definedKeys = LISTINGBRIDGE_DEFAULT_SYSTEM_SETTINGS.map((s) => s.setting_key);
    expect(definedKeys).toHaveLength(7);
    expect(definedKeys.sort()).toEqual(requiredKeys.slice().sort());

    for (const setting of LISTINGBRIDGE_DEFAULT_SYSTEM_SETTINGS) {
      expect(typeof setting.setting_key).toBe('string');
      expect(setting.setting_key.startsWith('LISTINGBRIDGE_')).toBe(true);
      expect(['true', 'false']).toContain(setting.setting_value);
      expect(typeof setting.description).toBe('string');
      expect(setting.description.length).toBeGreaterThan(5);
    }
  });

  it('idempotently seeds all settings using upsert semantics without duplicating or destroying data', async () => {
    const databaseMap = new Map<string, { setting_key: string; setting_value: string; description?: string }>();

    const mockDb: ListingBridgeSystemSettingUpsertClient = {
      systemSetting: {
        upsert: jest.fn(async (args) => {
          const key = args.where.setting_key;
          const existing = databaseMap.get(key);
          if (existing) {
            const updated = {
              ...existing,
              description: args.update.description ?? existing.description,
            };
            databaseMap.set(key, updated);
            return updated;
          }
          const created = {
            setting_key: args.create.setting_key,
            setting_value: args.create.setting_value,
            description: args.create.description,
          };
          databaseMap.set(key, created);
          return created;
        }),
      },
    };

    // First execution: all 7 created
    const firstResult = await seedListingBridgeSystemSettings(mockDb);
    expect(firstResult).toHaveLength(7);
    expect(databaseMap.size).toBe(7);
    expect(mockDb.systemSetting.upsert).toHaveBeenCalledTimes(7);

    // Simulate administrator manually overriding one flag to 'false'
    databaseMap.set(LISTINGBRIDGE_FEATURE_FLAGS.AVAILABILITY_IMPORT, {
      setting_key: LISTINGBRIDGE_FEATURE_FLAGS.AVAILABILITY_IMPORT,
      setting_value: 'false',
      description: 'Disabled by compliance admin',
    });

    // Second execution (repeat run / sync): must be idempotent and preserve admin override
    const secondResult = await seedListingBridgeSystemSettings(mockDb);
    expect(secondResult).toHaveLength(7);
    expect(databaseMap.size).toBe(7);
    expect(mockDb.systemSetting.upsert).toHaveBeenCalledTimes(14);

    // Verify admin override was preserved
    const availabilitySetting = databaseMap.get(LISTINGBRIDGE_FEATURE_FLAGS.AVAILABILITY_IMPORT);
    expect(availabilitySetting?.setting_value).toBe('false');
  });
});
