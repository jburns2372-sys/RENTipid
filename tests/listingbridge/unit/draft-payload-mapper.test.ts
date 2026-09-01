import { ListingBridgeDraftPayloadMapper } from '../../../src/lib/listingbridge/draft/draft-payload-mapper';
import type { ListingBridgeReviewSnapshot } from '../../../src/lib/listingbridge/review/types';

describe('ListingBridge P9: Draft Payload Mapper', () => {
  const mapper = new ListingBridgeDraftPayloadMapper();

  const mockSnapshot: ListingBridgeReviewSnapshot = {
    importJobId: 'job-p9-map-001',
    providerId: 'usr-p9-prov-001',
    jobStatus: 'READY_FOR_DRAFT',
    fields: [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: 'Spacious 2BR Condo with Balcony',
        confidenceState: 'VERIFIED',
        isRequired: true,
        isBlocking: false,
        providerModified: true,
        validationState: 'VALIDATED',
        allowedActions: ['CONFIRM', 'EDIT'],
      },
      {
        fieldName: 'description',
        displayName: 'Description',
        normalizedValue: 'Fully furnished two-bedroom suite located in prime BGC district.',
        confidenceState: 'HIGH_CONFIDENCE',
        isRequired: true,
        isBlocking: false,
        providerModified: false,
        validationState: 'VALIDATED',
        allowedActions: ['CONFIRM', 'EDIT'],
      },
      {
        fieldName: 'propertyType',
        displayName: 'Property Type',
        normalizedValue: 'condominiums',
        confidenceState: 'VERIFIED',
        isRequired: true,
        isBlocking: false,
        providerModified: false,
        validationState: 'VALIDATED',
        allowedActions: ['CONFIRM', 'EDIT'],
      },
      {
        fieldName: 'pricingHints',
        displayName: 'Pricing Hints',
        normalizedValue: {
          currency: 'PHP',
          baseRate: { amount: 3500, interval: 'daily' },
          securityDeposit: 5000,
        },
        confidenceState: 'HIGH_CONFIDENCE',
        isRequired: false,
        isBlocking: false,
        providerModified: false,
        validationState: 'VALIDATED',
        allowedActions: ['CONFIRM', 'EDIT'],
      },
      {
        fieldName: 'prohibitedOwnerSecret',
        displayName: 'Prohibited Data',
        normalizedValue: 'SECRET_API_KEY_12345',
        confidenceState: 'PROHIBITED',
        isRequired: false,
        isBlocking: false,
        providerModified: false,
        validationState: 'INVALID',
        allowedActions: [],
      },
    ],
    unresolvedItems: [],
    media: {
      totalCandidates: 3,
      validatedCount: 3,
      rejectedCount: 0,
      duplicateCount: 0,
      hasCoverPhoto: true,
      isBlocking: false,
    },
    location: {
      normalizedAddress: {
        addressLine1: '5th Avenue corner 26th Street',
        addressLine2: null,
        sublocality: null,
        locality: 'Taguig',
        administrativeArea2: null,
        administrativeArea1: 'Metro Manila',
        postalCode: '1634',
        countryCode: 'PH',
        formattedAddress: '5th Avenue corner 26th Street, BGC, Taguig',
        latitude: 14.5501,
        longitude: 121.0504,
        provider: 'MANUAL',
        providerPlaceId: null,
        validationStatus: 'VERIFIED',
        validationLevel: null,
        manuallyEdited: false,
        validatedAt: null,
      },
      isWithinPhilippineBounds: true,
      conflicts: [],
      isBlocking: false,
      requiresReview: false,
    },
    duplicate: {
      matchLevel: 'NO_MATCH',
      confidenceScore: 0,
      signals: [],
      isBlocking: false,
      requiresReview: false,
    },
    rights: {
      rightsConfirmed: true,
      isBlocking: false,
    },
    readiness: {
      isReadyForDraft: true,
      blockingReasons: [],
      warningReasons: [],
      resolvedFieldsCount: 4,
      unresolvedBlockingCount: 0,
    },
  };

  it('Maps reviewed fields to a native RENTipid draft payload with status Draft', () => {
    const payload = mapper.mapToNativeDraft(mockSnapshot);

    expect(payload.provider_id).toBe('usr-p9-prov-001');
    expect(payload.title).toBe('Spacious 2BR Condo with Balcony');
    expect(payload.description).toBe('Fully furnished two-bedroom suite located in prime BGC district.');
    expect(payload.category_id).toBe('condominiums');
    expect(payload.location).toBe('5th Avenue corner 26th Street, BGC, Taguig');
    expect(payload.city).toBe('Taguig');
    expect(payload.province).toBe('Metro Manila');
    expect(payload.country).toBe('PH');
    expect(payload.daily_rate).toBe(3500);
    expect(payload.security_deposit).toBe(5000);
    expect(payload.status).toBe('Draft');
  });

  it('Strictly EXCLUDES prohibited fields from entering the draft payload', () => {
    const payload = mapper.mapToNativeDraft(mockSnapshot);
    const payloadRecord = payload as unknown as Record<string, unknown>;

    expect(payloadRecord.prohibitedOwnerSecret).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain('SECRET_API_KEY_12345');
  });

  it('Uses default title if title is absent or too short', () => {
    const snapshotWithoutTitle: ListingBridgeReviewSnapshot = {
      ...mockSnapshot,
      fields: mockSnapshot.fields.filter((f) => f.fieldName !== 'title'),
    };

    const payload = mapper.mapToNativeDraft(snapshotWithoutTitle);
    expect(payload.title).toBe('Imported Listing Draft');
  });
});
