import {
  resolveListingBridgeEnvironment,
  ListingBridgeUiService,
  ListingBridgeTestConnector,
  listingBridgeTestConnectorDescriptor,
  createListingBridgeConnectorRegistry,
  ListingBridgeFeatureFlagEvaluator,
  LISTINGBRIDGE_TEST_CONNECTOR_ID,
  type ListingBridgeFeatureFlagKey,
  type ListingBridgeSystemSettingReader,
} from '../../../src/lib/listingbridge';

function createMockEvaluator(
  values: Partial<Record<ListingBridgeFeatureFlagKey, string>> = {
    LISTINGBRIDGE_GLOBAL: 'true',
    LISTINGBRIDGE_FILE_IMPORT: 'true',
    LISTINGBRIDGE_MEDIA_IMPORT: 'true',
    LISTINGBRIDGE_AVAILABILITY_IMPORT: 'true',
  },
): ListingBridgeFeatureFlagEvaluator {
  const db: ListingBridgeSystemSettingReader = {
    systemSetting: {
      findMany: jest.fn(async (args) =>
        args.where.setting_key.in
          .filter((key) => values[key] !== undefined)
          .map((key) => ({ setting_key: key, setting_value: values[key] as string })),
      ),
    },
  };
  return new ListingBridgeFeatureFlagEvaluator(db);
}

describe('ListingBridge: Environment Resolution & Connector Policy', () => {
  const envMap = process.env as Record<string, string | undefined>;
  const savedNodeEnv = process.env.NODE_ENV;
  const savedVercelEnv = process.env.VERCEL_ENV;
  const savedAppEnv = process.env.APP_ENV;

  afterEach(() => {
    if (savedNodeEnv !== undefined) {
      envMap.NODE_ENV = savedNodeEnv;
    } else {
      delete envMap.NODE_ENV;
    }

    if (savedVercelEnv !== undefined) {
      envMap.VERCEL_ENV = savedVercelEnv;
    } else {
      delete envMap.VERCEL_ENV;
    }

    if (savedAppEnv !== undefined) {
      envMap.APP_ENV = savedAppEnv;
    } else {
      delete envMap.APP_ENV;
    }
  });

  describe('resolveListingBridgeEnvironment', () => {
    it('resolves to PREVIEW when VERCEL_ENV is preview, even if NODE_ENV is production', () => {
      const env = resolveListingBridgeEnvironment({
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
      });
      expect(env).toBe('PREVIEW');
    });

    it('resolves to PRODUCTION when VERCEL_ENV is production', () => {
      const env = resolveListingBridgeEnvironment({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      });
      expect(env).toBe('PRODUCTION');
    });

    it('resolves to LOCAL when VERCEL_ENV is development', () => {
      const env = resolveListingBridgeEnvironment({
        NODE_ENV: 'development',
        VERCEL_ENV: 'development',
      });
      expect(env).toBe('LOCAL');
    });

    it('resolves to PREVIEW when APP_ENV is preview / staging / uat', () => {
      expect(resolveListingBridgeEnvironment({ NODE_ENV: 'production', APP_ENV: 'preview' })).toBe('PREVIEW');
      expect(resolveListingBridgeEnvironment({ NODE_ENV: 'production', APP_ENV: 'staging' })).toBe('PREVIEW');
      expect(resolveListingBridgeEnvironment({ NODE_ENV: 'production', APP_ENV: 'uat' })).toBe('PREVIEW');
    });

    it('resolves to PRODUCTION when APP_ENV is production or prod', () => {
      expect(resolveListingBridgeEnvironment({ NODE_ENV: 'production', APP_ENV: 'production' })).toBe('PRODUCTION');
      expect(resolveListingBridgeEnvironment({ NODE_ENV: 'production', APP_ENV: 'prod' })).toBe('PRODUCTION');
    });

    it('resolves to TEST when NODE_ENV is test', () => {
      expect(resolveListingBridgeEnvironment({ NODE_ENV: 'test' })).toBe('TEST');
    });

    it('resolves to LOCAL when NODE_ENV is development without VERCEL_ENV', () => {
      expect(resolveListingBridgeEnvironment({ NODE_ENV: 'development' })).toBe('LOCAL');
    });

    it('fails closed to PRODUCTION when environment signals are ambiguous or unknown', () => {
      expect(resolveListingBridgeEnvironment({ NODE_ENV: 'production' })).toBe('PRODUCTION');
      expect(resolveListingBridgeEnvironment({})).toBe('PRODUCTION');
      expect(resolveListingBridgeEnvironment({ NODE_ENV: 'custom_unknown' })).toBe('PRODUCTION');
    });
  });

  describe('Connector Policy & Availability Across Environments', () => {
    it('allows the deterministic test connector in PREVIEW environment', async () => {
      envMap.NODE_ENV = 'production';
      envMap.VERCEL_ENV = 'preview';
      delete envMap.APP_ENV;

      const registry = createListingBridgeConnectorRegistry(
        [
          {
            connector: new ListingBridgeTestConnector(),
            descriptor: listingBridgeTestConnectorDescriptor,
          },
        ],
        { featureEvaluator: createMockEvaluator() },
      );

      const uiService = new ListingBridgeUiService({ registry });
      const res = await uiService.getAvailableConnectors();

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.length).toBeGreaterThanOrEqual(1);

      const testConn = res.data?.find((c) => c.id === LISTINGBRIDGE_TEST_CONNECTOR_ID);
      expect(testConn).toBeDefined();
      expect(testConn?.name).toBe('Internal Test Connector');
    });

    it('strictly forbids and strips the internal test connector in true PRODUCTION', async () => {
      envMap.NODE_ENV = 'production';
      envMap.VERCEL_ENV = 'production';
      delete envMap.APP_ENV;

      const registry = createListingBridgeConnectorRegistry(
        [
          {
            connector: new ListingBridgeTestConnector(),
            descriptor: listingBridgeTestConnectorDescriptor,
          },
        ],
        { featureEvaluator: createMockEvaluator() },
      );

      const uiService = new ListingBridgeUiService({ registry });
      const res = await uiService.getAvailableConnectors();

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      // Internal test connector must NEVER be present in true production
      const testConn = res.data?.find((c) => c.id.includes('test'));
      expect(testConn).toBeUndefined();
      expect(res.data?.length).toBe(0);
    });

    it('strictly rejects the internal test connector in registry evaluation for PRODUCTION', async () => {
      const registry = createListingBridgeConnectorRegistry(
        [
          {
            connector: new ListingBridgeTestConnector(),
            descriptor: listingBridgeTestConnectorDescriptor,
          },
        ],
        { featureEvaluator: createMockEvaluator() },
      );

      const previewConnectors = await registry.listEnabledConnectors({ environment: 'PREVIEW' });
      expect(previewConnectors.some((c) => c.id === LISTINGBRIDGE_TEST_CONNECTOR_ID)).toBe(true);

      const prodConnectors = await registry.listEnabledConnectors({ environment: 'PRODUCTION' });
      expect(prodConnectors.some((c) => c.id === LISTINGBRIDGE_TEST_CONNECTOR_ID)).toBe(false);
    });
  });
});
