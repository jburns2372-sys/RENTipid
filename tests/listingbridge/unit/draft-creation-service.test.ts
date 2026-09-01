import { ListingBridgeDraftCreationService } from '../../../src/lib/listingbridge/draft/draft-creation-service';
import type { ListingBridgeReviewSnapshot } from '../../../src/lib/listingbridge/review/types';
import type { ListingAuthorityAdapter } from '../../../src/lib/listingbridge/draft/types';

describe('ListingBridge P9: Draft Creation Service & Idempotency', () => {
  const readySnapshot: ListingBridgeReviewSnapshot = {
    importJobId: 'job-p9-create-001',
    providerId: 'usr-p9-prov-001',
    jobStatus: 'READY_FOR_DRAFT',
    fields: [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: 'Verified Modern Loft in Makati',
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
        normalizedValue: 'Cozy loft with high ceilings and high-speed internet.',
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
    ],
    unresolvedItems: [],
    media: {
      totalCandidates: 2,
      validatedCount: 2,
      rejectedCount: 0,
      duplicateCount: 0,
      hasCoverPhoto: true,
      isBlocking: false,
    },
    location: {
      normalizedAddress: {
        addressLine1: 'Salcedo Village',
        addressLine2: null,
        sublocality: null,
        locality: 'Makati',
        administrativeArea2: null,
        administrativeArea1: 'Metro Manila',
        postalCode: '1227',
        countryCode: 'PH',
        formattedAddress: 'Salcedo Village, Makati',
        latitude: 14.5583,
        longitude: 121.0194,
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
      resolvedFieldsCount: 3,
      unresolvedBlockingCount: 0,
    },
  };

  const blockedSnapshot: ListingBridgeReviewSnapshot = {
    ...readySnapshot,
    importJobId: 'job-p9-blocked-001',
    rights: {
      rightsConfirmed: false,
      isBlocking: true,
    },
    readiness: {
      isReadyForDraft: false,
      blockingReasons: ['RIGHTS_NOT_CONFIRMED: Provider rights confirmation is required'],
      warningReasons: [],
      resolvedFieldsCount: 2,
      unresolvedBlockingCount: 1,
    },
  };

  it('LB-FUNC-006: Creates a native RENTipid draft through ListingService authority', async () => {
    const mockAuthority: ListingAuthorityAdapter = {
      createDraft: jest.fn().mockResolvedValue({
        id: 'lst-native-12345',
        status: 'Draft',
      }),
    };

    const mockRepo = {
      getJobById: jest.fn().mockResolvedValue({
        id: 'job-p9-create-001',
        provider_id: 'usr-p9-prov-001',
        status: 'READY_FOR_DRAFT',
        created_listing_id: null,
      }),
      markJobCreatingDraft: jest.fn().mockResolvedValue(true),
      completeJobWithListing: jest.fn().mockResolvedValue(true),
    };

    const service = new ListingBridgeDraftCreationService(mockRepo, mockAuthority);

    const result = await service.createDraftFromImport(
      {
        actorUserId: 'usr-p9-prov-001',
        importJobId: 'job-p9-create-001',
      },
      {
        overrideSnapshot: readySnapshot,
      },
    );

    expect(result.success).toBe(true);
    expect(result.listingId).toBe('lst-native-12345');
    expect(result.isReusedIdempotently).toBe(false);
    expect(result.status).toBe('Draft');

    // Verify native listing authority was invoked with Draft status
    expect(mockAuthority.createDraft).toHaveBeenCalledTimes(1);
    expect(mockAuthority.createDraft).toHaveBeenCalledWith(
      'usr-p9-prov-001',
      expect.objectContaining({
        title: 'Verified Modern Loft in Makati',
        status: 'Draft',
      }),
    );

    // Verify durable completion linkage
    expect(mockRepo.completeJobWithListing).toHaveBeenCalledWith(
      'job-p9-create-001',
      'lst-native-12345',
      'usr-p9-prov-001',
    );
  });

  it('Idempotency: Re-invoking draft creation for an already completed job returns existing draft without creating a new one', async () => {
    const mockAuthority: ListingAuthorityAdapter = {
      createDraft: jest.fn(),
    };

    const mockRepo = {
      getJobById: jest.fn().mockResolvedValue({
        id: 'job-p9-create-001',
        provider_id: 'usr-p9-prov-001',
        status: 'COMPLETED',
        created_listing_id: 'lst-existing-99999',
      }),
      markJobCreatingDraft: jest.fn(),
      completeJobWithListing: jest.fn(),
    };

    const service = new ListingBridgeDraftCreationService(mockRepo, mockAuthority);

    const result = await service.createDraftFromImport(
      {
        actorUserId: 'usr-p9-prov-001',
        importJobId: 'job-p9-create-001',
      },
      {
        overrideSnapshot: readySnapshot,
      },
    );

    expect(result.success).toBe(true);
    expect(result.listingId).toBe('lst-existing-99999');
    expect(result.isReusedIdempotently).toBe(true);
    expect(mockAuthority.createDraft).not.toHaveBeenCalled();
  });

  it('Rejects draft creation when actor is not the authorized provider', async () => {
    const mockAuthority: ListingAuthorityAdapter = {
      createDraft: jest.fn(),
    };

    const mockRepo = {
      getJobById: jest.fn().mockResolvedValue({
        id: 'job-p9-create-001',
        provider_id: 'usr-p9-different-owner',
        status: 'READY_FOR_DRAFT',
        created_listing_id: null,
      }),
      markJobCreatingDraft: jest.fn(),
      completeJobWithListing: jest.fn(),
    };

    const service = new ListingBridgeDraftCreationService(mockRepo, mockAuthority);

    const result = await service.createDraftFromImport(
      {
        actorUserId: 'usr-p9-prov-001',
        importJobId: 'job-p9-create-001',
      },
      {
        overrideSnapshot: readySnapshot,
      },
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('OWNERSHIP_MISMATCH');
    expect(mockAuthority.createDraft).not.toHaveBeenCalled();
  });

  it('Rejects draft creation when draft readiness evaluation fails (fail-closed)', async () => {
    const mockAuthority: ListingAuthorityAdapter = {
      createDraft: jest.fn(),
    };

    const mockRepo = {
      getJobById: jest.fn().mockResolvedValue({
        id: 'job-p9-blocked-001',
        provider_id: 'usr-p9-prov-001',
        status: 'NEEDS_REVIEW',
        created_listing_id: null,
      }),
      markJobCreatingDraft: jest.fn(),
      completeJobWithListing: jest.fn(),
    };

    const service = new ListingBridgeDraftCreationService(mockRepo, mockAuthority);

    const result = await service.createDraftFromImport(
      {
        actorUserId: 'usr-p9-prov-001',
        importJobId: 'job-p9-blocked-001',
      },
      {
        overrideSnapshot: blockedSnapshot,
      },
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('DRAFT_READINESS_FAILED');
    expect(result.blockingReasons?.length).toBeGreaterThan(0);
    expect(mockAuthority.createDraft).not.toHaveBeenCalled();
  });

  it('Strictly does NOT publish or approve listing (Draft state only)', async () => {
    const mockAuthority = {
      createDraft: jest.fn().mockResolvedValue({
        id: 'lst-draft-only-111',
        status: 'Draft',
      }),
      publishListing: jest.fn(),
      approveListing: jest.fn(),
    };

    const service = new ListingBridgeDraftCreationService(undefined, mockAuthority);

    const result = await service.createDraftFromImport(
      {
        actorUserId: 'usr-p9-prov-001',
        importJobId: 'job-p9-create-001',
      },
      {
        overrideSnapshot: readySnapshot,
      },
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe('Draft');
    expect(mockAuthority.publishListing).not.toHaveBeenCalled();
    expect(mockAuthority.approveListing).not.toHaveBeenCalled();
  });
});
