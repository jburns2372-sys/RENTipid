import {
  LISTINGBRIDGE_SCHEMA_VERSION,
  isTerminalListingImportJobStatus,
  parseCanonicalImportContract,
} from '../../../src/lib/listingbridge/types';

const validContract = {
  schemaVersion: LISTINGBRIDGE_SCHEMA_VERSION,
  source: {
    connectorId: 'tier4-url',
    connectorTier: 'TIER_4_URL',
    sourceReferenceHash: 'a'.repeat(64),
    sourceReferenceLabel: 'example.com/listing/123',
    authorizationMethod: 'NONE',
    extractedAt: '2026-08-30T00:00:00.000Z',
  },
  identity: {
    providerId: 'provider_123',
    importJobId: 'job_123',
    idempotencyKey: 'b'.repeat(64),
  },
  property: {
    title: 'Condo near Makati CBD',
    description: 'One bedroom furnished condo.',
    condition: 'Good',
    propertyType: 'Condominium',
  },
  location: {
    rawLocationString: 'Makati, Metro Manila',
    city: 'Makati',
    province: 'Metro Manila',
    country: 'Philippines',
  },
  capacity: {
    quantity: 1,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
  },
  rooms: [
    {
      name: 'Bedroom',
      roomType: 'Private',
      bedCount: 1,
      sleeps: 2,
    },
  ],
  amenities: ['Air conditioning', 'WiFi'],
  rules: {
    generalRules: 'No smoking.',
    minDuration: 1,
    pickupAvailable: false,
    deliveryAvailable: false,
  },
  pricingHints: {
    dailyRate: 2500,
    currency: 'PHP',
  },
  availability: {
    availabilityStart: '2026-09-01T00:00:00.000Z',
    requiresProviderConfirmation: true,
  },
  media: [
    {
      sourceReferenceHash: 'c'.repeat(64),
      sourceUrlLabel: 'example.com/photo.jpg',
      isCover: true,
      order: 0,
      mimeType: 'image/jpeg',
      contentSha256: 'd'.repeat(64),
      confidence: 'HIGH_CONFIDENCE',
    },
  ],
  provenance: {
    rawPayloadHash: 'e'.repeat(64),
    aiAssisted: true,
    aiOutputAuthoritative: false,
    modelVersion: 'test-model',
    extractedFactCount: 8,
    rejectedFields: [],
  },
  fieldConfidence: {
    title: {
      state: 'HIGH_CONFIDENCE',
      score: 0.92,
      authority: 'SOURCE',
      requiresProviderReview: false,
      providerConfirmed: false,
    },
    suggestedCategoryId: {
      state: 'REVIEW_RECOMMENDED',
      score: 0.74,
      authority: 'AI_ASSISTED',
      requiresProviderReview: true,
      providerConfirmed: false,
    },
  },
  unresolvedFields: [
    {
      fieldName: 'category_id',
      reason: 'Provider must confirm category mapping',
      severity: 'BLOCKING',
      expectedCorrectionSource: 'PROVIDER',
    },
  ],
} as const;

describe('CanonicalImportContract', () => {
  it('accepts the source-neutral canonical contract shape', () => {
    const parsed = parseCanonicalImportContract(validContract);

    expect(parsed.schemaVersion).toBe('rentipid.listingbridge.v1');
    expect(parsed.provenance.aiOutputAuthoritative).toBe(false);
    expect(parsed.unresolvedFields[0].severity).toBe('BLOCKING');
  });

  it('keeps AI-assisted output from becoming authoritative by type validation alone', () => {
    const invalid = {
      ...validContract,
      fieldConfidence: {
        suggestedCategoryId: {
          state: 'HIGH_CONFIDENCE',
          score: 0.9,
          authority: 'AI_ASSISTED',
          requiresProviderReview: false,
          providerConfirmed: true,
        },
      },
    };

    expect(() => parseCanonicalImportContract(invalid)).toThrow(
      /AI-assisted fields cannot be marked providerConfirmed/,
    );
  });

  it('requires prohibited data to be represented with rejection context', () => {
    const invalid = {
      ...validContract,
      fieldConfidence: {
        title: {
          state: 'PROHIBITED',
          authority: 'SOURCE',
          requiresProviderReview: true,
          providerConfirmed: false,
        },
      },
    };

    expect(() => parseCanonicalImportContract(invalid)).toThrow(/PROHIBITED fields require a rejectedReason/);
  });

  it('keeps durable terminal job states explicit', () => {
    expect(isTerminalListingImportJobStatus('COMPLETED')).toBe(true);
    expect(isTerminalListingImportJobStatus('FAILED_RETRYABLE')).toBe(false);
    expect(isTerminalListingImportJobStatus('FETCHING')).toBe(false);
  });
});
