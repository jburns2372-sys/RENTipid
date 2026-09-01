import {
  LISTINGBRIDGE_FEATURE_FLAGS,
  LISTINGBRIDGE_TEST_CONNECTOR_ID,
  LISTINGBRIDGE_TEST_SOURCE_REFERENCE,
  ListingBridgeConnectorRegistry,
  ListingBridgeFeatureFlagEvaluator,
  ListingBridgeTestConnector,
  createListingBridgeConnectorRegistry,
  evaluateListingBridgeConnectorAuthorization,
  isManualListingCreationIndependentOfListingBridgeFlags,
  listingBridgeTestConnectorDescriptor,
  parseListingBridgeConnectorDescriptor,
  type ListingBridgeConnectorDescriptor,
  type ListingBridgeFeatureFlagKey,
  type ListingBridgeSystemSettingReader,
} from '../../../src/lib/listingbridge';

function featureEvaluator(
  values: Partial<Record<ListingBridgeFeatureFlagKey, string>>,
): ListingBridgeFeatureFlagEvaluator {
  const db: ListingBridgeSystemSettingReader = {
    systemSetting: {
      findMany: jest.fn(async args => args.where.setting_key.in
        .filter(key => values[key] !== undefined)
        .map(key => ({ setting_key: key, setting_value: values[key] as string }))),
    },
  };

  return new ListingBridgeFeatureFlagEvaluator(db);
}

function enabledFeatureValues(): Record<ListingBridgeFeatureFlagKey, string> {
  return {
    LISTINGBRIDGE_GLOBAL: 'true',
    LISTINGBRIDGE_URL_IMPORT: 'false',
    LISTINGBRIDGE_API_CONNECTORS: 'false',
    LISTINGBRIDGE_MEDIA_IMPORT: 'true',
    LISTINGBRIDGE_AI_MAPPING: 'false',
    LISTINGBRIDGE_AVAILABILITY_IMPORT: 'true',
    LISTINGBRIDGE_FILE_IMPORT: 'true',
  };
}

function registry(
  descriptor: ListingBridgeConnectorDescriptor = listingBridgeTestConnectorDescriptor,
  flags: Partial<Record<ListingBridgeFeatureFlagKey, string>> = enabledFeatureValues(),
): ListingBridgeConnectorRegistry {
  return createListingBridgeConnectorRegistry(
    [{ connector: new ListingBridgeTestConnector(), descriptor }],
    { featureEvaluator: featureEvaluator(flags) },
  );
}

describe('ListingBridge Connector Registry (P3)', () => {
  it('registers a valid connector immutably', () => {
    const empty = createListingBridgeConnectorRegistry([], { featureEvaluator: featureEvaluator(enabledFeatureValues()) });
    const next = empty.registerConnector({
      connector: new ListingBridgeTestConnector(),
      descriptor: listingBridgeTestConnectorDescriptor,
    });

    expect(empty.listRegisteredConnectors()).toHaveLength(0);
    expect(next.listRegisteredConnectors()).toHaveLength(1);
    expect(next.getDescriptorById(LISTINGBRIDGE_TEST_CONNECTOR_ID)?.displayName).toBe('Internal Test Connector');
  });

  it('rejects duplicate connector IDs', () => {
    const existing = registry();

    expect(() => existing.registerConnector({
      connector: new ListingBridgeTestConnector(),
      descriptor: listingBridgeTestConnectorDescriptor,
    })).toThrow(/Duplicate ListingBridge connector id/);
  });

  it('looks up connectors, lists deterministically, and filters by capability and environment', () => {
    const subject = registry();

    expect(subject.getConnectorById(LISTINGBRIDGE_TEST_CONNECTOR_ID)).toBeInstanceOf(ListingBridgeTestConnector);
    expect(subject.getConnectorById('missing')).toBeNull();
    expect(subject.listRegisteredConnectors().map(connector => connector.id)).toEqual([LISTINGBRIDGE_TEST_CONNECTOR_ID]);
    expect(subject.filterByCapability('MEDIA')).toHaveLength(1);
    expect(subject.filterByCapability('URL_RETRIEVAL')).toHaveLength(0);
    expect(subject.filterByEnvironment('TEST')).toHaveLength(1);
    expect(subject.filterByEnvironment('PRODUCTION')).toHaveLength(0);
  });

  it('keeps disabled connectors unavailable', async () => {
    const disabled = {
      ...listingBridgeTestConnectorDescriptor,
      enabled: false,
    };

    const availability = await registry(disabled).evaluateAvailability(LISTINGBRIDGE_TEST_CONNECTOR_ID, {
      environment: 'TEST',
    });

    expect(availability.available).toBe(false);
    expect(availability.blockedReasons).toContain('CONNECTOR_DISABLED');
  });

  it('requires ListingBridge global and capability flags to be explicitly enabled', async () => {
    const globalOff = await registry(listingBridgeTestConnectorDescriptor, {
      ...enabledFeatureValues(),
      LISTINGBRIDGE_GLOBAL: 'false',
    }).evaluateAvailability(LISTINGBRIDGE_TEST_CONNECTOR_ID, { environment: 'TEST' });
    const mediaOff = await registry(listingBridgeTestConnectorDescriptor, {
      ...enabledFeatureValues(),
      LISTINGBRIDGE_MEDIA_IMPORT: 'false',
    }).evaluateAvailability(LISTINGBRIDGE_TEST_CONNECTOR_ID, { environment: 'TEST' });
    const missingCritical = await registry(listingBridgeTestConnectorDescriptor, {
      LISTINGBRIDGE_GLOBAL: 'true',
    }).evaluateAvailability(LISTINGBRIDGE_TEST_CONNECTOR_ID, { environment: 'TEST' });

    expect(globalOff.available).toBe(false);
    expect(globalOff.blockedReasons).toContain(`FEATURE_FLAG_${LISTINGBRIDGE_FEATURE_FLAGS.GLOBAL}`);
    expect(mediaOff.available).toBe(false);
    expect(mediaOff.blockedReasons).toContain(`FEATURE_FLAG_${LISTINGBRIDGE_FEATURE_FLAGS.MEDIA_IMPORT}`);
    expect(missingCritical.available).toBe(false);
    expect(missingCritical.featureEvaluation.flagStates.LISTINGBRIDGE_FILE_IMPORT).toBe('MISSING');
    expect(isManualListingCreationIndependentOfListingBridgeFlags()).toBe(true);
  });

  it('represents authorization without exposing secret payloads or treating missing rights as authorized', async () => {
    const publicDescriptor = registry().getDescriptorById(LISTINGBRIDGE_TEST_CONNECTOR_ID);
    const denied = evaluateListingBridgeConnectorAuthorization(listingBridgeTestConnectorDescriptor, {
      providerId: 'provider_1',
      connectorId: LISTINGBRIDGE_TEST_CONNECTOR_ID,
      authorizationType: 'PROVIDER_RIGHTS_CONFIRMATION',
      providerRightsConfirmed: false,
      credentialReference: 'server-side-reference-only',
    });
    const allowed = await new ListingBridgeTestConnector().authorize({
      providerId: 'provider_1',
      authorizationType: 'PROVIDER_RIGHTS_CONFIRMATION',
      providerRightsConfirmed: true,
      requestedAt: '2026-08-30T00:00:00.000Z',
    });

    expect(publicDescriptor?.authorization.type).toBe('PROVIDER_RIGHTS_CONFIRMATION');
    expect(JSON.stringify(publicDescriptor)).not.toMatch(/server-side-reference-only|token|secret/i);
    expect(JSON.stringify(denied)).not.toContain('server-side-reference-only');
    expect(denied.authorized).toBe(false);
    expect(denied.status).toBe('REQUIRES_PROVIDER_RIGHTS_CONFIRMATION');
    expect(allowed).toBe(true);
  });

  it('treats healthy and degraded connectors as usable, and unhealthy or disabled health as unavailable', async () => {
    const healthy = await registry().evaluateAvailability(LISTINGBRIDGE_TEST_CONNECTOR_ID, { environment: 'TEST' });
    const degraded = await registry({
      ...listingBridgeTestConnectorDescriptor,
      health: { state: 'DEGRADED', checkedAt: '2026-08-30T00:00:00.000Z', latencyMs: 25 },
    }).evaluateAvailability(LISTINGBRIDGE_TEST_CONNECTOR_ID, { environment: 'TEST' });
    const unhealthy = await registry({
      ...listingBridgeTestConnectorDescriptor,
      health: { state: 'UNHEALTHY', checkedAt: '2026-08-30T00:00:00.000Z', latencyMs: 25 },
    }).evaluateAvailability(LISTINGBRIDGE_TEST_CONNECTOR_ID, { environment: 'TEST' });
    const disabledHealth = await registry({
      ...listingBridgeTestConnectorDescriptor,
      health: { state: 'DISABLED', checkedAt: '2026-08-30T00:00:00.000Z', latencyMs: 0 },
    }).evaluateAvailability(LISTINGBRIDGE_TEST_CONNECTOR_ID, { environment: 'TEST' });

    expect(healthy.available).toBe(true);
    expect(degraded.available).toBe(true);
    expect(unhealthy.available).toBe(false);
    expect(unhealthy.blockedReasons).toContain('HEALTH_UNHEALTHY');
    expect(disabledHealth.available).toBe(false);
    expect(disabledHealth.blockedReasons).toContain('HEALTH_DISABLED');
  });

  it('prevents internal test connector production availability', async () => {
    const availability = await registry().evaluateAvailability(LISTINGBRIDGE_TEST_CONNECTOR_ID, {
      environment: 'PRODUCTION',
    });

    expect(availability.available).toBe(false);
    expect(availability.blockedReasons).toEqual(expect.arrayContaining(['INTERNAL_ONLY', 'ENVIRONMENT_DISABLED']));
  });
});

describe('ListingBridge internal test connector', () => {
  it('returns deterministic listing, media, availability, normalization, and health without network access', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const connector = new ListingBridgeTestConnector();
    const identification = await connector.identifySource(LISTINGBRIDGE_TEST_SOURCE_REFERENCE);
    const raw = await connector.fetchListing(LISTINGBRIDGE_TEST_SOURCE_REFERENCE);
    const media = await connector.fetchMedia('listingbridge-test://media/fixture-cover.jpg');
    const availability = await connector.fetchAvailability(LISTINGBRIDGE_TEST_SOURCE_REFERENCE);
    const normalized = await connector.normalize(raw);
    const health = await connector.healthCheck();

    expect(identification).toEqual({
      matched: true,
      connectorId: LISTINGBRIDGE_TEST_CONNECTOR_ID,
      confidence: 1,
      sourceReferenceHash: identification.sourceReferenceHash,
    });
    expect(raw).toEqual(await connector.fetchListing(LISTINGBRIDGE_TEST_SOURCE_REFERENCE));
    expect(media.mimeType).toBe('image/jpeg');
    expect(availability?.body).toEqual({
      availabilityStart: '2026-09-01T00:00:00.000Z',
      availabilityEnd: '2026-12-31T00:00:00.000Z',
    });
    expect(normalized.provenance.aiAssisted).toBe(false);
    expect(health).toEqual({
      state: 'HEALTHY',
      healthy: true,
      latencyMs: 0,
      checkedAt: '2026-08-30T00:00:00.000Z',
      message: 'Deterministic local fixture only',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('declares capabilities that match its connector implementation', () => {
    const connector = new ListingBridgeTestConnector();

    expect(connector.getCapabilities()).toMatchObject({
      supportsMedia: true,
      supportsAvailability: true,
      requiresAuthorization: true,
      authorizationType: 'PROVIDER_RIGHTS_CONFIRMATION',
    });
    expect(listingBridgeTestConnectorDescriptor.capabilities).toEqual(expect.arrayContaining([
      'LISTING_FACTS',
      'MEDIA',
      'AVAILABILITY',
      'STRUCTURED_FILE',
      'PROVIDER_RIGHTS_CONFIRMATION',
    ]));
  });
});

describe('ListingBridge connector descriptor validation', () => {
  it('rejects malformed descriptors', () => {
    expect(() => parseListingBridgeConnectorDescriptor({
      ...listingBridgeTestConnectorDescriptor,
      id: '',
    })).toThrow();
    expect(() => parseListingBridgeConnectorDescriptor({
      ...listingBridgeTestConnectorDescriptor,
      version: 'v1',
    })).toThrow();
    expect(() => parseListingBridgeConnectorDescriptor({
      ...listingBridgeTestConnectorDescriptor,
      health: { state: 'BROKEN' },
    })).toThrow();
  });

  it('rejects contradictory capability and configuration combinations', () => {
    expect(() => parseListingBridgeConnectorDescriptor({
      ...listingBridgeTestConnectorDescriptor,
      sourceMode: 'INTERNAL_TEST',
      capabilities: [...listingBridgeTestConnectorDescriptor.capabilities, 'URL_RETRIEVAL'],
    })).toThrow(/URL_RETRIEVAL requires PUBLIC_URL sourceMode/);

    expect(() => parseListingBridgeConnectorDescriptor({
      ...listingBridgeTestConnectorDescriptor,
      retryPolicy: {
        ...listingBridgeTestConnectorDescriptor.retryPolicy,
        baseDelayMs: 1000,
        maxDelayMs: 500,
      },
    })).toThrow(/maxDelayMs/);
  });
});
