import {
  ListingBridgeUiService,
  type ListingBridgeReviewSnapshot,
} from '../../../src/lib/listingbridge';

describe('ListingBridge P8: UI Service Actions & Adapters', () => {
  const uiService = new ListingBridgeUiService();

  const mockSnapshot: ListingBridgeReviewSnapshot = {
    importJobId: 'job-p8-test-001',
    providerId: 'usr-p8-prov',
    jobStatus: 'NEEDS_REVIEW',
    fields: [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: 'Sample Imported Title',
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
        confidenceState: 'HIGH_CONFIDENCE',
        isRequired: true,
        isBlocking: false,
        providerModified: false,
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
        addressLine1: 'Makati Avenue',
        addressLine2: null,
        sublocality: null,
        locality: 'Makati',
        administrativeArea2: null,
        administrativeArea1: 'Metro Manila',
        postalCode: '1226',
        countryCode: 'PH',
        formattedAddress: 'Makati Avenue, Makati',
        latitude: 14.5547,
        longitude: 121.0244,
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
      resolvedFieldsCount: 2,
      unresolvedBlockingCount: 0,
    },
  };

  it('LB-UX-001: Lists enabled connectors from registry', async () => {
    const res = await uiService.getAvailableConnectors();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('LB-UX-002: Submits a valid provider correction and updates review snapshot', async () => {
    const res = await uiService.submitCorrection(
      mockSnapshot,
      'title',
      'Updated Suite with Stunning Skyline View',
      'usr-p8-prov',
    );

    expect(res.success).toBe(true);
    expect(res.data?.fieldName).toBe('title');
    expect(res.data?.newConfidence).toBe('VERIFIED');
    expect(res.data?.updatedValue).toBe('Updated Suite with Stunning Skyline View');
  });

  it('Rejects invalid correction value and returns user-friendly error message', async () => {
    const res = await uiService.submitCorrection(
      mockSnapshot,
      'title',
      'AB', // Too short
      'usr-p8-prov',
    );

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('VALIDATION_FAILED');
    expect(res.errorMessage).toContain('Listing title must be at least 3 characters long');
  });

  it('LB-FUNC-005: Confirms provider rights and returns confirmation timestamp', async () => {
    const res = await uiService.confirmRights('job-p8-test-001', 'usr-p8-prov');
    expect(res.success).toBe(true);
    expect(res.data?.confirmedAt).toBeDefined();
  });
});
