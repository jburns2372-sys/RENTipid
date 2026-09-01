import type {
  ListingBridgeConnectorCapabilityId,
  ListingBridgeConnectorDescriptor,
  ListingBridgeFeatureFlagKey,
} from './descriptor';

export const LISTINGBRIDGE_FEATURE_FLAGS = Object.freeze({
  GLOBAL: 'LISTINGBRIDGE_GLOBAL',
  URL_IMPORT: 'LISTINGBRIDGE_URL_IMPORT',
  API_CONNECTORS: 'LISTINGBRIDGE_API_CONNECTORS',
  MEDIA_IMPORT: 'LISTINGBRIDGE_MEDIA_IMPORT',
  AI_MAPPING: 'LISTINGBRIDGE_AI_MAPPING',
  AVAILABILITY_IMPORT: 'LISTINGBRIDGE_AVAILABILITY_IMPORT',
  FILE_IMPORT: 'LISTINGBRIDGE_FILE_IMPORT',
} satisfies Record<string, ListingBridgeFeatureFlagKey>);

export interface ListingBridgeSystemSettingReader {
  readonly systemSetting: {
    findMany(args: {
      where: { setting_key: { in: ListingBridgeFeatureFlagKey[] } };
      select: { setting_key: true; setting_value: true };
    }): Promise<readonly { setting_key: string; setting_value: string }[]>;
  };
}

export interface ListingBridgeFeatureEvaluation {
  readonly enabled: boolean;
  readonly requiredFlags: readonly ListingBridgeFeatureFlagKey[];
  readonly flagStates: Readonly<Record<ListingBridgeFeatureFlagKey, boolean | 'MISSING'>>;
  readonly blockedBy: readonly ListingBridgeFeatureFlagKey[];
}

function parseStrictBoolean(value: string | undefined): boolean | 'MISSING' {
  if (value === undefined) return 'MISSING';
  return value.trim().toLowerCase() === 'true';
}

export function requiredFeatureFlagsForCapabilities(
  capabilities: readonly ListingBridgeConnectorCapabilityId[],
): readonly ListingBridgeFeatureFlagKey[] {
  const required = new Set<ListingBridgeFeatureFlagKey>([LISTINGBRIDGE_FEATURE_FLAGS.GLOBAL]);

  for (const capability of capabilities) {
    if (capability === 'URL_RETRIEVAL') required.add(LISTINGBRIDGE_FEATURE_FLAGS.URL_IMPORT);
    if (capability === 'OAUTH_API_AUTHORIZATION' || capability === 'API_KEY_AUTHORIZATION') {
      required.add(LISTINGBRIDGE_FEATURE_FLAGS.API_CONNECTORS);
    }
    if (capability === 'MEDIA') required.add(LISTINGBRIDGE_FEATURE_FLAGS.MEDIA_IMPORT);
    if (capability === 'AI_ASSISTED_MAPPING') required.add(LISTINGBRIDGE_FEATURE_FLAGS.AI_MAPPING);
    if (capability === 'AVAILABILITY') required.add(LISTINGBRIDGE_FEATURE_FLAGS.AVAILABILITY_IMPORT);
    if (capability === 'STRUCTURED_FILE') required.add(LISTINGBRIDGE_FEATURE_FLAGS.FILE_IMPORT);
  }

  return [...required].sort();
}

export function isManualListingCreationIndependentOfListingBridgeFlags(): true {
  return true;
}

export function isListingBridgeEnabled(): boolean {
  return process.env.LISTINGBRIDGE_GLOBAL !== 'false';
}

export class ListingBridgeFeatureFlagEvaluator {
  constructor(private readonly db?: ListingBridgeSystemSettingReader) {}

  private async getDb(): Promise<ListingBridgeSystemSettingReader> {
    if (this.db) return this.db;
    const { prisma } = await import('../../prisma');
    return prisma;
  }

  async evaluate(
    descriptor: ListingBridgeConnectorDescriptor,
    requiredCapabilities: readonly ListingBridgeConnectorCapabilityId[] = descriptor.capabilities,
  ): Promise<ListingBridgeFeatureEvaluation> {
    const requiredFlags = [
      ...new Set([
        descriptor.featureControl.requiredGlobalFlag,
        ...descriptor.featureControl.requiredCapabilityFlags,
        ...requiredFeatureFlagsForCapabilities(requiredCapabilities),
      ]),
    ].sort() as ListingBridgeFeatureFlagKey[];

    const db = await this.getDb();
    const settings = await db.systemSetting.findMany({
      where: { setting_key: { in: requiredFlags } },
      select: { setting_key: true, setting_value: true },
    });
    const values = new Map(settings.map(setting => [setting.setting_key, setting.setting_value]));
    const flagEntries = requiredFlags.map(flag => [flag, parseStrictBoolean(values.get(flag))] as const);
    const flagStates = Object.fromEntries(flagEntries) as Record<ListingBridgeFeatureFlagKey, boolean | 'MISSING'>;
    const blockedBy = flagEntries
      .filter(([, enabled]) => enabled !== true)
      .map(([flag]) => flag);

    return Object.freeze({
      enabled: blockedBy.length === 0,
      requiredFlags,
      flagStates: Object.freeze(flagStates),
      blockedBy: Object.freeze(blockedBy),
    });
  }
}
