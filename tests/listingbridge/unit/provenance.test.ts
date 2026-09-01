import {
  parseCanonicalImportContract,
  listingBridgeConfidenceStates,
  LISTINGBRIDGE_SCHEMA_VERSION,
  CanonicalImportContract,
} from '../../../src/lib/listingbridge/types/canonical-contract';

describe('ListingBridge Durable Provenance (P2 Foundation)', () => {
  const validBaseContract: CanonicalImportContract = {
    schemaVersion: LISTINGBRIDGE_SCHEMA_VERSION,
    source: {
      connectorId: 'url_importer',
      connectorTier: 'TIER_4_URL',
      sourceReferenceHash: 'a1b2c3d4e5f67890abcdef1234567890',
      sourceReferenceLabel: 'https://example.com/property/123',
      authorizationMethod: 'NONE',
      extractedAt: '2026-08-31T12:00:00.000Z',
    },
    identity: {
      providerId: 'provider_123',
      idempotencyKey: 'idemp_provider_123_a1b2c3d4e5f67890',
    },
    property: {
      title: 'Cozy Makati Studio Apartment',
      description: 'Fully furnished studio near Greenbelt.',
      suggestedCategoryId: 'cat_residential_condo',
      condition: 'Like New',
    },
    location: {
      rawLocationString: 'San Lorenzo, Makati City, Metro Manila',
      city: 'Makati',
      province: 'Metro Manila',
      country: 'PH',
      postalCode: '1223',
      psgcCode: '137602000',
    },
    capacity: {
      quantity: 1,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
    },
    rooms: [
      {
        name: 'Master Studio',
        roomType: 'Studio',
        bedCount: 1,
        sleeps: 2,
      },
    ],
    amenities: ['Air Conditioning', 'WiFi', 'Swimming Pool'],
    rules: {
      generalRules: 'No smoking. Quiet hours 10PM - 8AM.',
      minDuration: 1,
      maxDuration: 30,
      pickupAvailable: true,
      deliveryAvailable: false,
    },
    pricingHints: {
      dailyRate: 2500,
      monthlyRate: 45000,
      securityDeposit: 5000,
      currency: 'PHP',
    },
    availability: {
      requiresProviderConfirmation: true,
    },
    media: [
      {
        sourceReferenceHash: 'img_hash_010203040506070809',
        sourceUrlLabel: 'https://example.com/photos/living_room.jpg',
        caption: 'Living Area',
        isCover: true,
        order: 1,
        mimeType: 'image/jpeg',
        contentSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        confidence: 'VERIFIED',
      },
    ],
    provenance: {
      rawPayloadHash: 'raw_payload_hash_abcdef0123456789',
      aiAssisted: true,
      aiOutputAuthoritative: false,
      modelVersion: 'gemini-1.5-pro',
      extractedFactCount: 18,
      rejectedFields: [],
    },
    fieldConfidence: {
      'property.title': {
        state: 'VERIFIED',
        score: 1.0,
        authority: 'SOURCE',
        provenance: {
          sourceField: 'og:title',
          extractedAt: '2026-08-31T12:00:00.000Z',
        },
        requiresProviderReview: false,
        providerConfirmed: true,
      },
      'pricing.dailyRate': {
        state: 'REVIEW_RECOMMENDED',
        score: 0.85,
        authority: 'AI_ASSISTED',
        requiresProviderReview: true,
        providerConfirmed: false,
      },
    },
    unresolvedFields: [
      {
        fieldName: 'pricing.replacementValue',
        reason: 'Replacement value not declared on source page',
        severity: 'OPTIONAL',
        expectedCorrectionSource: 'PROVIDER',
      },
    ],
  };

  it('validates all 6 mandatory confidence states from Architecture Lock', () => {
    expect(listingBridgeConfidenceStates).toEqual([
      'VERIFIED',
      'HIGH_CONFIDENCE',
      'REVIEW_RECOMMENDED',
      'CONFLICT',
      'MISSING',
      'PROHIBITED',
    ]);
  });

  it('successfully parses a compliant contract with full provenance', () => {
    const parsed = parseCanonicalImportContract(validBaseContract);
    expect(parsed.schemaVersion).toBe('rentipid.listingbridge.v1');
    expect(parsed.provenance.aiOutputAuthoritative).toBe(false);
    expect(parsed.fieldConfidence['property.title'].state).toBe('VERIFIED');
  });

  it('enforces that AI-assisted fields cannot be marked providerConfirmed without human intervention', () => {
    const invalidContract = {
      ...validBaseContract,
      fieldConfidence: {
        ...validBaseContract.fieldConfidence,
        'pricing.dailyRate': {
          state: 'HIGH_CONFIDENCE',
          score: 0.95,
          authority: 'AI_ASSISTED',
          requiresProviderReview: false,
          providerConfirmed: true, // Violation: AI cannot self-confirm provider review
        },
      },
    };

    expect(() => parseCanonicalImportContract(invalidContract)).toThrow(
      /AI-assisted fields cannot be marked providerConfirmed by contract validation alone/,
    );
  });

  it('requires a rejectedReason whenever a field is in PROHIBITED state', () => {
    const prohibitedWithoutReason = {
      ...validBaseContract,
      fieldConfidence: {
        ...validBaseContract.fieldConfidence,
        'property.title': {
          state: 'PROHIBITED',
          authority: 'SYSTEM',
          requiresProviderReview: true,
          providerConfirmed: false,
          // Missing rejectedReason
        },
      },
    };

    expect(() => parseCanonicalImportContract(prohibitedWithoutReason)).toThrow(
      /PROHIBITED fields require a rejectedReason/,
    );
  });

  it('records provider corrections durably in provenance', () => {
    const contractWithCorrection: CanonicalImportContract = {
      ...validBaseContract,
      provenance: {
        ...validBaseContract.provenance,
        providerCorrections: [
          {
            fieldName: 'pricing.dailyRate',
            correctedAt: '2026-08-31T12:05:00.000Z',
            correctedByUserId: 'provider_123',
          },
        ],
      },
    };

    const parsed = parseCanonicalImportContract(contractWithCorrection);
    expect(parsed.provenance.providerCorrections).toHaveLength(1);
    expect(parsed.provenance.providerCorrections?.[0].fieldName).toBe('pricing.dailyRate');
  });
});
