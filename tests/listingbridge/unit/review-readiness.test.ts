import {
  ListingBridgeDraftReadinessEngine,
  ListingBridgeReviewSnapshotEngine,
  LISTINGBRIDGE_SCHEMA_VERSION,
  type CanonicalImportContract,
  type ReviewFieldModel,
} from '../../../src/lib/listingbridge';

describe('ListingBridge P7: Review Snapshot & Draft Readiness Engine', () => {
  const readinessEngine = new ListingBridgeDraftReadinessEngine();
  const snapshotEngine = new ListingBridgeReviewSnapshotEngine();

  const validContract: CanonicalImportContract = {
    schemaVersion: LISTINGBRIDGE_SCHEMA_VERSION,
    source: {
      connectorId: 'test-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'source-ref-p7-001',
      authorizationMethod: 'PROVIDER_RIGHTS_CONFIRMATION',
      extractedAt: new Date().toISOString(),
    },
    identity: {
      providerId: 'usr-p7-prov',
      importJobId: 'job-p7-001',
      idempotencyKey: 'idemp-p7-001',
    },
    property: {
      title: 'Modern 1BR Condo with Balcony in Makati',
      description: 'Fully furnished one bedroom unit located in the heart of Makati CBD.',
      propertyType: 'Condominium',
      condition: 'Good',
    },
    location: {
      city: 'Makati',
      province: 'Metro Manila',
      country: 'PH',
      rawLocationString: 'Ayala Avenue',
      latitude: 14.5547,
      longitude: 121.0244,
    },
    capacity: { maxGuests: 2, bedrooms: 1, bathrooms: 1 },
    rooms: [],
    amenities: ['WiFi', 'Air Conditioning'],
    rules: { pickupAvailable: false, deliveryAvailable: false },
    pricingHints: {
      dailyRate: 3500,
      currency: 'PHP',
    },
    availability: { requiresProviderConfirmation: true },
    media: [
      {
        sourceReferenceHash: 'hash-cover-1',
        isCover: true,
        order: 1,
        confidence: 'VERIFIED',
      },
    ],
    fieldConfidence: {
      title: { state: 'VERIFIED', authority: 'SOURCE', requiresProviderReview: false, providerConfirmed: true },
      description: { state: 'VERIFIED', authority: 'SOURCE', requiresProviderReview: false, providerConfirmed: true },
      propertyType: { state: 'VERIFIED', authority: 'SOURCE', requiresProviderReview: false, providerConfirmed: true },
      location: { state: 'VERIFIED', authority: 'SOURCE', requiresProviderReview: false, providerConfirmed: true },
      capacity: { state: 'HIGH_CONFIDENCE', authority: 'SOURCE', requiresProviderReview: false, providerConfirmed: false },
      amenities: { state: 'HIGH_CONFIDENCE', authority: 'SOURCE', requiresProviderReview: false, providerConfirmed: false },
    },
    unresolvedFields: [],
    provenance: {
      rawPayloadHash: 'h_raw',
      aiAssisted: false,
      aiOutputAuthoritative: false,
      extractedFactCount: 10,
      rejectedFields: [],
    },
  };

  it('Evaluates draft readiness as TRUE when all mandatory criteria and rights are satisfied', () => {
    const snapshot = snapshotEngine.buildSnapshot({
      importJobId: 'job-p7-001',
      providerId: 'usr-p7-prov',
      jobStatus: 'NEEDS_REVIEW',
      contract: validContract,
    });

    expect(snapshot.readiness.isReadyForDraft).toBe(true);
    expect(snapshot.readiness.blockingReasons.length).toBe(0);
    expect(snapshot.readiness.unresolvedBlockingCount).toBe(0);
    expect(snapshot.fields.length).toBeGreaterThan(0);
    expect(snapshot.media.isBlocking).toBe(false);
    expect(snapshot.location.isBlocking).toBe(false);
    expect(snapshot.rights.isBlocking).toBe(false);
  });

  it('Blocks readiness if provider rights confirmation is missing', () => {
    const snapshot = snapshotEngine.buildSnapshot({
      importJobId: 'job-p7-002',
      providerId: 'usr-p7-prov',
      jobStatus: 'NEEDS_REVIEW',
      contract: validContract,
      rights: { rightsConfirmed: false, isBlocking: true },
    });

    expect(snapshot.readiness.isReadyForDraft).toBe(false);
    expect(snapshot.readiness.blockingReasons.some((r) => r.includes('RIGHTS_NOT_CONFIRMED'))).toBe(true);
  });

  it('Blocks readiness if an exact duplicate listing is detected', () => {
    const snapshot = snapshotEngine.buildSnapshot({
      importJobId: 'job-p7-003',
      providerId: 'usr-p7-prov',
      jobStatus: 'NEEDS_REVIEW',
      contract: validContract,
      duplicate: {
        matchLevel: 'EXACT_MATCH',
        matchedListingId: 'lst-existing-999',
        confidenceScore: 1.0,
        signals: [{ code: 'SAME_SOURCE_REFERENCE', score: 1.0, description: 'Matched existing' }],
        isBlocking: true,
        requiresReview: true,
      },
    });

    expect(snapshot.readiness.isReadyForDraft).toBe(false);
    expect(snapshot.readiness.blockingReasons.some((r) => r.includes('DUPLICATE_PROPERTY_BLOCKING'))).toBe(true);
  });

  it('Blocks readiness if required field is MISSING or CONFLICT', () => {
    const fieldsWithMissing: ReviewFieldModel[] = [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: null,
        confidenceState: 'MISSING',
        isRequired: true,
        isBlocking: true,
        providerModified: false,
        validationState: 'INVALID',
        allowedActions: ['EDIT'],
      },
      {
        fieldName: 'propertyType',
        displayName: 'Property Type',
        normalizedValue: null,
        confidenceState: 'CONFLICT',
        isRequired: true,
        isBlocking: true,
        providerModified: false,
        validationState: 'INVALID',
        allowedActions: ['EDIT'],
      },
    ];

    const result = readinessEngine.evaluate({
      fields: fieldsWithMissing,
      media: { totalCandidates: 1, validatedCount: 1, rejectedCount: 0, duplicateCount: 0, hasCoverPhoto: true, isBlocking: false },
      location: { isWithinPhilippineBounds: true, conflicts: [], isBlocking: false, requiresReview: false },
      duplicate: { matchLevel: 'NO_MATCH', confidenceScore: 0.0, signals: [], isBlocking: false, requiresReview: false },
      rights: { rightsConfirmed: true, isBlocking: false },
      jobStatus: 'NEEDS_REVIEW',
    });

    expect(result.isReadyForDraft).toBe(false);
    expect(result.blockingReasons.some((r) => r.includes('REQUIRED_FIELD_MISSING'))).toBe(true);
    expect(result.blockingReasons.some((r) => r.includes('REQUIRED_FIELD_CONFLICT'))).toBe(true);
  });

  it('Blocks readiness if job status is in an invalid/cancelled state', () => {
    const result = readinessEngine.evaluate({
      fields: [],
      media: { totalCandidates: 1, validatedCount: 1, rejectedCount: 0, duplicateCount: 0, hasCoverPhoto: true, isBlocking: false },
      location: { isWithinPhilippineBounds: true, conflicts: [], isBlocking: false, requiresReview: false },
      duplicate: { matchLevel: 'NO_MATCH', confidenceScore: 0.0, signals: [], isBlocking: false, requiresReview: false },
      rights: { rightsConfirmed: true, isBlocking: false },
      jobStatus: 'CANCELLED',
    });

    expect(result.isReadyForDraft).toBe(false);
    expect(result.blockingReasons.some((r) => r.includes('JOB_STATE_INELIGIBLE'))).toBe(true);
  });
});
