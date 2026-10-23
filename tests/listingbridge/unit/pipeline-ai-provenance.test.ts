import {
  ListingBridgeNormalizationPipeline,
  validateExtractionEnvelope,
  DisabledSemanticAiAdapter,
  BoundedMockSemanticAiAdapter,
} from '../../../src/lib/listingbridge';

describe('ListingBridge P5: Pipeline, Master Plan Scenarios & AI Safety', () => {
  const pipeline = new ListingBridgeNormalizationPipeline();

  const validPayload = {
    title: 'Modern 1BR Condo with Balcony in Makati',
    description: 'Fully furnished condominium near Greenbelt with swimming pool and high-speed internet.',
    property_type: 'Condominium',
    condition: 'Good',
    location: {
      city: 'Makati',
      province: 'Metro Manila',
      country: 'Philippines',
      formattedAddress: 'San Lorenzo, Makati, Metro Manila',
      latitude: 14.5501,
      longitude: 121.0168,
    },
    capacity: {
      quantity: 1,
      max_guests: 3,
      bedrooms: 1,
      bathrooms: 1,
      beds: 2,
    },
    amenities: ['wifi', 'Air Conditioning', 'pool', 'gym', 'balcony', '24/7 security'],
    pricing: {
      daily_rate: 3200,
      security_deposit: 5000,
      currency: 'PHP',
    },
    rules: {
      min_nights: 1,
      max_nights: 60,
      house_rules: 'No smoking indoors.',
    },
    media: [
      { url: 'https://images.example.com/condo1.jpg', isCover: true, order: 1 },
      { url: 'https://images.example.com/condo2.jpg', isCover: false, order: 2 },
    ],
  };

  it('LB-MAP-001: Known source fields map deterministically to canonical contract', async () => {
    const envelope = validateExtractionEnvelope({
      importJobId: 'job-lb-map-001',
      providerId: 'usr_prov_123',
      connectorId: 'airbnb-connector',
      connectorTier: 'TIER_1_OAUTH',
      sourceReferenceHash: 'hash-lb-map-001-abcdef123456',
      authorizationMethod: 'OAUTH_SERVER_SIDE',
      retrievedAt: new Date('2026-09-01T09:00:00Z'),
      contentType: 'application/json',
      payload: validPayload,
    });

    const result = await pipeline.process(envelope);

    expect(result.contract.property.title).toBe('Modern 1BR Condo with Balcony in Makati');
    expect(result.contract.property.suggestedCategoryId).toBe('condominiums');
    expect(result.contract.property.condition).toBe('Good');
    expect(result.contract.location.city).toBe('Makati');
    expect(result.contract.capacity.maxGuests).toBe(3);
    expect(result.contract.amenities).toContain('WiFi');
    expect(result.contract.amenities).toContain('Air Conditioning');
    expect(result.contract.amenities).toContain('Swimming Pool');
    expect(result.contract.amenities).toContain('Gym');
    expect(result.contract.amenities).toContain('Balcony');
    expect(result.contract.amenities).toContain('24/7 Security');
    expect(result.contract.pricingHints.dailyRate).toBe(3200);
    expect(result.contract.pricingHints.currency).toBe('PHP');
    expect(result.contract.rules.minDuration).toBe(1);
    expect(result.contract.media.length).toBe(2);
  });

  it('LB-MAP-002: Unknown required fields remain unresolved, not fabricated', async () => {
    const missingTitleAndLocationPayload = {
      property_type: 'Condominium',
      capacity: { quantity: 1 },
    };

    const envelope = validateExtractionEnvelope({
      importJobId: 'job-lb-map-002',
      providerId: 'usr_prov_123',
      connectorId: 'manual-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'hash-lb-map-002-abcdef123456',
      authorizationMethod: 'NONE',
      retrievedAt: new Date(),
      contentType: 'application/json',
      payload: missingTitleAndLocationPayload,
    });

    const result = await pipeline.process(envelope);

    expect(result.contract.property.title).toBeUndefined();
    expect(result.contract.location.city).toBeUndefined();
    expect(result.contract.location.rawLocationString).toBeUndefined();

    // Blocking unresolved fields must be present
    const unresolvedTitle = result.contract.unresolvedFields.find((u) => u.fieldName === 'property.title');
    expect(unresolvedTitle).toBeDefined();
    expect(unresolvedTitle?.severity).toBe('BLOCKING');

    const unresolvedLocation = result.contract.unresolvedFields.find((u) => u.fieldName === 'location');
    expect(unresolvedLocation).toBeDefined();
    expect(unresolvedLocation?.severity).toBe('BLOCKING');
  });

  it('LB-MAP-003: Amenity synonyms map to canonical taxonomy', async () => {
    const amenityPayload = {
      title: 'Valid Title for Amenity Test',
      location: { city: 'Cebu' },
      amenities: ['wireless internet', 'split type ac', 'infinity pool', 'full kitchen', 'dedicated parking', 'hdtv', 'standby generator'],
    };

    const envelope = validateExtractionEnvelope({
      importJobId: 'job-lb-map-003',
      providerId: 'usr_prov_123',
      connectorId: 'test-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'hash-lb-map-003-abcdef123456',
      authorizationMethod: 'NONE',
      retrievedAt: new Date(),
      contentType: 'application/json',
      payload: amenityPayload,
    });

    const result = await pipeline.process(envelope);

    expect(result.contract.amenities).toContain('WiFi');
    expect(result.contract.amenities).toContain('Air Conditioning');
    expect(result.contract.amenities).toContain('Swimming Pool');
    expect(result.contract.amenities).toContain('Kitchen');
    expect(result.contract.amenities).toContain('Free Parking');
    expect(result.contract.amenities).toContain('TV');
    expect(result.contract.amenities).toContain('Generator Backup');
  });

  it('LB-MAP-004: Property-type ambiguity triggers review where required', async () => {
    const ambiguousPayload = {
      title: 'Ambiguous House in Tagaytay',
      property_type: 'house',
      location: { city: 'Tagaytay' },
    };

    const envelope = validateExtractionEnvelope({
      importJobId: 'job-lb-map-004',
      providerId: 'usr_prov_123',
      connectorId: 'test-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'hash-lb-map-004-abcdef123456',
      authorizationMethod: 'NONE',
      retrievedAt: new Date(),
      contentType: 'application/json',
      payload: ambiguousPayload,
    });

    const result = await pipeline.process(envelope);

    expect(result.contract.property.suggestedCategoryId).toBe('other');
    const catConfidence = result.contract.fieldConfidence['property.suggestedCategoryId'];
    expect(catConfidence.state).toBe('REVIEW_RECOMMENDED');
    expect(catConfidence.requiresProviderReview).toBe(true);
  });

  it('LB-MAP-005: Prohibited source data is not persisted into listing content', async () => {
    const sensitivePayload = {
      ...validPayload,
      credit_card: '4111-5555-6666-7777',
      guest_messages: 'Can we pay via wire transfer?',
      access_token: 'secret_jwt_token_123',
      reviews: [{ rating: 5, user: 'Alice' }],
    };

    const envelope = validateExtractionEnvelope({
      importJobId: 'job-lb-map-005',
      providerId: 'usr_prov_123',
      connectorId: 'test-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'hash-lb-map-005-abcdef123456',
      authorizationMethod: 'NONE',
      retrievedAt: new Date(),
      contentType: 'application/json',
      payload: sensitivePayload,
    });

    const result = await pipeline.process(envelope);

    // Contract must not include raw prohibited keys
    const rawContract = result.contract as unknown as Record<string, unknown>;
    expect(rawContract.credit_card).toBeUndefined();
    expect(rawContract.guest_messages).toBeUndefined();
    expect(rawContract.access_token).toBeUndefined();

    // Rejected fields in provenance must document the prohibited fields
    expect(result.contract.provenance.rejectedFields.some((r) => r.fieldName === 'credit_card')).toBe(true);
    expect(result.contract.provenance.rejectedFields.some((r) => r.fieldName === 'guest_messages')).toBe(true);
    expect(result.contract.provenance.rejectedFields.some((r) => r.fieldName === 'access_token')).toBe(true);
  });

  it('LB-AI-004: Core ListingBridge functions with AI assistance disabled', async () => {
    const envelope = validateExtractionEnvelope({
      importJobId: 'job-lb-ai-004',
      providerId: 'usr_prov_123',
      connectorId: 'test-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'hash-lb-ai-004-abcdef123456',
      authorizationMethod: 'NONE',
      retrievedAt: new Date(),
      contentType: 'application/json',
      payload: validPayload,
    });

    const result = await pipeline.process(envelope, {
      aiAdapter: new DisabledSemanticAiAdapter(),
      enableAi: false,
    });

    expect(result.aiAssisted).toBe(false);
    expect(result.contract.provenance.aiAssisted).toBe(false);
    expect(result.contract.property.title).toBe('Modern 1BR Condo with Balcony in Makati');
  });

  it('LB-AI-001: AI cannot fabricate missing required facts (title/location)', async () => {
    const mockAi = new BoundedMockSemanticAiAdapter(async () => ({
      categorySlugSuggestion: 'condominiums',
      confidence: 'HIGH_CONFIDENCE',
    }));

    const incompletePayload = {
      property_type: 'villa', // ambiguous
    };

    const envelope = validateExtractionEnvelope({
      importJobId: 'job-lb-ai-001',
      providerId: 'usr_prov_123',
      connectorId: 'test-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'hash-lb-ai-001-abcdef123456',
      authorizationMethod: 'NONE',
      retrievedAt: new Date(),
      contentType: 'application/json',
      payload: incompletePayload,
    });

    const result = await pipeline.process(envelope, {
      aiAdapter: mockAi,
      enableAi: true,
    });

    // Even if AI suggests category, required title and location MUST remain missing & blocking
    expect(result.contract.property.title).toBeUndefined();
    expect(result.contract.unresolvedFields.some((u) => u.fieldName === 'property.title' && u.severity === 'BLOCKING')).toBe(true);
    expect(result.contract.unresolvedFields.some((u) => u.fieldName === 'location' && u.severity === 'BLOCKING')).toBe(true);
  });

  it('LB-AI-002: Malformed AI structured output fails safely without crashing pipeline', async () => {
    const brokenAi = new BoundedMockSemanticAiAdapter(async () => ({
      // Missing required confidence enum, invalid types
      categorySlugSuggestion: 12345,
    } as unknown as { categorySlugSuggestion: string; confidence: 'HIGH_CONFIDENCE' }));

    const envelope = validateExtractionEnvelope({
      importJobId: 'job-lb-ai-002',
      providerId: 'usr_prov_123',
      connectorId: 'test-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'hash-lb-ai-002-abcdef123456',
      authorizationMethod: 'NONE',
      retrievedAt: new Date(),
      contentType: 'application/json',
      payload: validPayload,
    });

    const result = await pipeline.process(envelope, {
      aiAdapter: brokenAi,
      enableAi: true,
    });

    // Pipeline should succeed using deterministic fallback
    expect(result.contract.property.title).toBe('Modern 1BR Condo with Balcony in Makati');
    expect(result.contract.property.suggestedCategoryId).toBe('condominiums');
    expect(result.aiAssisted).toBe(false);
  });

  it('LB-MAP-006: Repository provenance persistence is deterministic and idempotent', async () => {
    const mockFields: Record<string, unknown>[] = [];
    let savedCanonicalPayload: unknown = null;

    const mockRepo = {
      saveCanonicalPayload: jest.fn().mockImplementation(async (jobId: string, contract: unknown) => {
        savedCanonicalPayload = contract;
        return { id: jobId };
      }),
      upsertField: jest.fn().mockImplementation(async (input: { jobId: string; fieldName: string }) => {
        const existingIdx = mockFields.findIndex((f) => f.jobId === input.jobId && f.fieldName === input.fieldName);
        if (existingIdx >= 0) {
          mockFields[existingIdx] = input;
        } else {
          mockFields.push(input);
        }
        return { id: 'field_' + mockFields.length };
      }),
    };

    const envelope = validateExtractionEnvelope({
      importJobId: 'job-lb-map-006',
      providerId: 'usr_prov_123',
      connectorId: 'test-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'hash-lb-map-006-abcdef123456',
      authorizationMethod: 'NONE',
      retrievedAt: new Date(),
      contentType: 'application/json',
      payload: validPayload,
    });

    // Run pipeline 1st time
    await pipeline.process(envelope, { repository: mockRepo });
    const countAfterFirst = mockFields.length;
    expect(countAfterFirst).toBeGreaterThan(0);
    expect(savedCanonicalPayload).toBeDefined();

    // Run pipeline 2nd time (simulating retry)
    await pipeline.process(envelope, { repository: mockRepo });
    const countAfterSecond = mockFields.length;

    // Idempotent: same number of field records, no duplicates created
    expect(countAfterSecond).toBe(countAfterFirst);
  });
});
