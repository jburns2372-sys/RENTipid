import {
  ListingBridgeP9HandoffBoundary,
  type ListingBridgeReviewSnapshot,
} from '../../../src/lib/listingbridge';

describe('ListingBridge P8: Typed P9 Handoff Boundary & Isolation', () => {
  const boundary = new ListingBridgeP9HandoffBoundary();

  const readySnapshot: ListingBridgeReviewSnapshot = {
    importJobId: 'job-p8-ready-001',
    providerId: 'usr-p8-prov',
    jobStatus: 'READY_FOR_DRAFT',
    fields: [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: 'Verified Luxury Condo',
        confidenceState: 'VERIFIED',
        isRequired: true,
        isBlocking: false,
        providerModified: true,
        validationState: 'VALIDATED',
        allowedActions: ['CONFIRM', 'EDIT'],
      },
    ],
    unresolvedItems: [],
    media: {
      totalCandidates: 1,
      validatedCount: 1,
      rejectedCount: 0,
      duplicateCount: 0,
      hasCoverPhoto: true,
      isBlocking: false,
    },
    location: {
      normalizedAddress: {
        addressLine1: 'BGC',
        addressLine2: null,
        sublocality: null,
        locality: 'Taguig',
        administrativeArea2: null,
        administrativeArea1: 'Metro Manila',
        postalCode: '1634',
        countryCode: 'PH',
        formattedAddress: 'BGC, Taguig',
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
      resolvedFieldsCount: 1,
      unresolvedBlockingCount: 0,
    },
  };

  const blockedSnapshot: ListingBridgeReviewSnapshot = {
    ...readySnapshot,
    importJobId: 'job-p8-blocked-001',
    readiness: {
      isReadyForDraft: false,
      blockingReasons: ['REQUIRED_FIELD_MISSING: Required field description is missing'],
      warningReasons: [],
      resolvedFieldsCount: 1,
      unresolvedBlockingCount: 1,
    },
  };

  it('Prepares typed P9 handoff contract when import is ready for draft', () => {
    const handoff = boundary.prepareHandoff(readySnapshot);

    expect(handoff.importJobId).toBe('job-p8-ready-001');
    expect(handoff.providerId).toBe('usr-p8-prov');
    expect(handoff.isEligibleForDraftCreation).toBe(true);
    expect(handoff.blockingReasons.length).toBe(0);
    expect(handoff.handoffPreparedAt).toBeDefined();
  });

  it('Marks isEligibleForDraftCreation as FALSE when blockers exist', () => {
    const handoff = boundary.prepareHandoff(blockedSnapshot);

    expect(handoff.importJobId).toBe('job-p8-blocked-001');
    expect(handoff.isEligibleForDraftCreation).toBe(false);
    expect(handoff.blockingReasons.length).toBe(1);
    expect(handoff.blockingReasons[0]).toContain('REQUIRED_FIELD_MISSING');
  });

  it('Strict P8/P9 boundary: P8 does NOT invoke createDraft or create Listing database records', () => {
    // Assert boundary has no draft creation executable methods
    expect((boundary as unknown as Record<string, unknown>).createDraft).toBeUndefined();
    expect((boundary as unknown as Record<string, unknown>).createListing).toBeUndefined();
    expect((boundary as unknown as Record<string, unknown>).publishListing).toBeUndefined();
  });
});
