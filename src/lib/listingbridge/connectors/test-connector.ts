import { createHash } from 'node:crypto';
import {
  LISTINGBRIDGE_SCHEMA_VERSION,
  type CanonicalImportContract,
} from '../types/canonical-contract';
import type {
  ListingBridgeAuthorizationContext,
  ListingBridgeConnector,
  ListingBridgeConnectorCapabilities,
  ListingBridgeConnectorConfig,
  ListingBridgeHealthCheckResult,
  ListingBridgeResponseValidationResult,
  RawAvailabilityPayload,
  RawListingPayload,
  RawMediaPayload,
} from './types';
import type { ListingBridgeConnectorDescriptor } from './descriptor';
import {
  evaluateListingBridgeConnectorAuthorization,
} from './authorization';

export const LISTINGBRIDGE_TEST_CONNECTOR_ID = 'internal.test.fixture';
export const LISTINGBRIDGE_TEST_SOURCE_REFERENCE = 'listingbridge-test://listing/fixture-1';

const FIXED_TIMESTAMP = '2026-08-30T00:00:00.000Z';
const TEST_PROVIDER_ID = 'provider_test_fixture';

const rawFixture = Object.freeze({
  title: 'ListingBridge Test Studio',
  description: 'Deterministic internal ListingBridge connector fixture.',
  location: 'Makati, Metro Manila, Philippines',
  dailyRate: 1800,
  bedrooms: 1,
  bathrooms: 1,
  amenities: ['WiFi', 'Air conditioning'],
});

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const rawPayloadHash = sha256(rawFixture);
const sourceReferenceHash = sha256(LISTINGBRIDGE_TEST_SOURCE_REFERENCE);
const mediaBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9]);
const mediaHash = createHash('sha256').update(mediaBytes).digest('hex');

export const testConnectorDescriptor: ListingBridgeConnectorDescriptor = {
  id: LISTINGBRIDGE_TEST_CONNECTOR_ID,
  internalName: 'ListingBridge Internal Test Connector',
  displayName: 'Internal Test Connector',
  version: '1.0.0',
  tier: 'TIER_3_FILE',
  sourceMode: 'INTERNAL_TEST',
  authorization: {
    type: 'PROVIDER_RIGHTS_CONFIRMATION',
    requiresProviderRightsConfirmation: true,
    serverSideOnly: true,
    credentialReferenceRequired: false,
  },
  capabilities: [
    'LISTING_FACTS',
    'MEDIA',
    'AVAILABILITY',
    'STRUCTURED_FILE',
    'PROVIDER_RIGHTS_CONFIRMATION',
  ],
  environments: {
    LOCAL: { state: 'APPROVED' },
    TEST: { state: 'APPROVED' },
    PREVIEW: { state: 'APPROVED' },
    PRODUCTION: { state: 'DISABLED', reason: 'Internal connector must never run in production' },
  },
  featureStatus: 'INTERNAL_ONLY',
  featureControl: {
    requiredGlobalFlag: 'LISTINGBRIDGE_GLOBAL',
    requiredCapabilityFlags: ['LISTINGBRIDGE_FILE_IMPORT'],
  },
  compliance: {
    status: 'APPROVED',
    reference: 'LISTINGBRIDGE_INTERNAL_TEST_ONLY',
  },
  health: {
    state: 'HEALTHY',
    checkedAt: FIXED_TIMESTAMP,
    latencyMs: 0,
    message: 'Deterministic local fixture only',
  },
  timeoutPolicy: {
    connectTimeoutMs: 100,
    responseTimeoutMs: 100,
    maxRedirects: 0,
    maxResponseBytes: 32 * 1024,
  },
  retryPolicy: {
    maxAttempts: 0,
    baseDelayMs: 0,
    maxDelayMs: 0,
    retryableStatusCodes: [],
  },
  ratePolicy: {
    policyRef: 'LISTINGBRIDGE_INTERNAL_TEST_ONLY',
    maxRequestsPerMinute: 600,
    burstLimit: 10,
  },
  enabled: true,
} as const satisfies ListingBridgeConnectorDescriptor;

export const listingBridgeTestConnectorDescriptor: ListingBridgeConnectorDescriptor = Object.freeze(testConnectorDescriptor);

const testConnectorConfig = {
  id: LISTINGBRIDGE_TEST_CONNECTOR_ID,
  name: 'Internal Test Connector',
  tier: 'TIER_3_FILE',
  capabilities: {
    supportsMedia: true,
    supportsAvailability: true,
    supportsBatch: false,
    requiresAuthorization: true,
    authorizationType: 'PROVIDER_RIGHTS_CONFIRMATION',
  },
  timeoutPolicy: listingBridgeTestConnectorDescriptor.timeoutPolicy,
  retryPolicy: listingBridgeTestConnectorDescriptor.retryPolicy,
  featureStatus: 'INTERNAL_ONLY',
  environmentStatus: 'TEST',
  complianceStatus: 'APPROVED',
} as const satisfies ListingBridgeConnectorConfig;

const config: ListingBridgeConnectorConfig = Object.freeze(testConnectorConfig);

export class ListingBridgeTestConnector implements ListingBridgeConnector {
  readonly config = config;

  async identifySource(input: string | Uint8Array) {
    const value = typeof input === 'string' ? input : Buffer.from(input).toString('utf8');

    return Object.freeze({
      matched: value === LISTINGBRIDGE_TEST_SOURCE_REFERENCE,
      connectorId: LISTINGBRIDGE_TEST_CONNECTOR_ID,
      confidence: value === LISTINGBRIDGE_TEST_SOURCE_REFERENCE ? 1 : 0,
      sourceReferenceHash,
    });
  }

  getCapabilities(): ListingBridgeConnectorCapabilities {
    return config.capabilities;
  }

  async authorize(context: ListingBridgeAuthorizationContext): Promise<boolean> {
    const decision = evaluateListingBridgeConnectorAuthorization(listingBridgeTestConnectorDescriptor, {
      providerId: context.providerId,
      connectorId: LISTINGBRIDGE_TEST_CONNECTOR_ID,
      authorizationType: context.authorizationType,
      providerRightsConfirmed: context.providerRightsConfirmed,
      credentialReference: context.credentialReference,
    });

    return decision.authorized;
  }

  async fetchListing(sourceReference: string): Promise<RawListingPayload> {
    if (sourceReference !== LISTINGBRIDGE_TEST_SOURCE_REFERENCE) {
      throw new Error('LISTINGBRIDGE_TEST_SOURCE_NOT_FOUND');
    }

    return Object.freeze({
      sourceReferenceHash,
      retrievedAt: FIXED_TIMESTAMP,
      contentType: 'application/vnd.rentipid.listingbridge.test+json',
      body: rawFixture,
    });
  }

  async fetchMedia(sourceReference: string): Promise<RawMediaPayload> {
    if (sourceReference !== 'listingbridge-test://media/fixture-cover.jpg') {
      throw new Error('LISTINGBRIDGE_TEST_MEDIA_NOT_FOUND');
    }

    return Object.freeze({
      sourceReferenceHash: mediaHash,
      retrievedAt: FIXED_TIMESTAMP,
      mimeType: 'image/jpeg',
      fileName: 'fixture-cover.jpg',
      contentSha256: mediaHash,
      body: mediaBytes,
    });
  }

  async fetchAvailability(sourceReference: string): Promise<RawAvailabilityPayload | null> {
    if (sourceReference !== LISTINGBRIDGE_TEST_SOURCE_REFERENCE) return null;

    return Object.freeze({
      sourceReferenceHash,
      retrievedAt: FIXED_TIMESTAMP,
      body: {
        availabilityStart: '2026-09-01T00:00:00.000Z',
        availabilityEnd: '2026-12-31T00:00:00.000Z',
      },
    });
  }

  async normalize(raw: RawListingPayload): Promise<CanonicalImportContract> {
    if (!this.validateResponse(raw).valid) throw new Error('LISTINGBRIDGE_TEST_INVALID_RAW_PAYLOAD');

    const contract: CanonicalImportContract = {
      schemaVersion: LISTINGBRIDGE_SCHEMA_VERSION,
      source: {
        connectorId: LISTINGBRIDGE_TEST_CONNECTOR_ID,
        connectorTier: 'TIER_3_FILE',
        sourceReferenceHash: raw.sourceReferenceHash,
        sourceReferenceLabel: 'Internal ListingBridge fixture',
        authorizationMethod: 'PROVIDER_RIGHTS_CONFIRMATION',
        extractedAt: FIXED_TIMESTAMP,
      },
      identity: {
        providerId: TEST_PROVIDER_ID,
        importJobId: 'job_listingbridge_test_fixture',
        idempotencyKey: sha256(`${TEST_PROVIDER_ID}:${LISTINGBRIDGE_TEST_CONNECTOR_ID}:${raw.sourceReferenceHash}`),
      },
      property: {
        title: rawFixture.title,
        description: rawFixture.description,
        condition: 'Good',
        propertyType: 'Studio',
      },
      location: {
        rawLocationString: rawFixture.location,
        city: 'Makati',
        province: 'Metro Manila',
        country: 'Philippines',
      },
      capacity: {
        quantity: 1,
        bedrooms: rawFixture.bedrooms,
        bathrooms: rawFixture.bathrooms,
      },
      rooms: [],
      amenities: rawFixture.amenities,
      rules: {
        pickupAvailable: false,
        deliveryAvailable: false,
      },
      pricingHints: {
        dailyRate: rawFixture.dailyRate,
        currency: 'PHP',
      },
      availability: {
        availabilityStart: '2026-09-01T00:00:00.000Z',
        availabilityEnd: '2026-12-31T00:00:00.000Z',
        sourceCalendarHash: raw.sourceReferenceHash,
        requiresProviderConfirmation: true,
      },
      media: [{
        sourceReferenceHash: mediaHash,
        sourceUrlLabel: 'Internal fixture cover',
        caption: 'Internal fixture cover',
        isCover: true,
        order: 0,
        mimeType: 'image/jpeg',
        contentSha256: mediaHash,
        confidence: 'VERIFIED',
      }],
      provenance: {
        rawPayloadHash,
        aiAssisted: false,
        aiOutputAuthoritative: false,
        extractedFactCount: 8,
        rejectedFields: [],
      },
      fieldConfidence: {
        title: {
          state: 'VERIFIED',
          score: 1,
          authority: 'SOURCE',
          requiresProviderReview: false,
          providerConfirmed: false,
        },
        dailyRate: {
          state: 'VERIFIED',
          score: 1,
          authority: 'SOURCE',
          requiresProviderReview: false,
          providerConfirmed: false,
        },
      },
      unresolvedFields: [],
    };

    return Object.freeze(contract);
  }

  validateResponse(raw: RawListingPayload | RawMediaPayload | RawAvailabilityPayload): ListingBridgeResponseValidationResult {
    if (!raw.sourceReferenceHash.trim() || !raw.retrievedAt.trim() || raw.body == null) {
      return Object.freeze({ valid: false, errorCode: 'INVALID_TEST_PAYLOAD', message: 'Malformed internal test payload' });
    }

    return Object.freeze({ valid: true, contentType: 'contentType' in raw ? raw.contentType : undefined });
  }

  async healthCheck(): Promise<ListingBridgeHealthCheckResult> {
    return Object.freeze({
      state: 'HEALTHY',
      healthy: true,
      latencyMs: 0,
      checkedAt: FIXED_TIMESTAMP,
      message: 'Deterministic local fixture only',
    });
  }
}

export function createListingBridgeTestConnector(): ListingBridgeTestConnector {
  return new ListingBridgeTestConnector();
}
