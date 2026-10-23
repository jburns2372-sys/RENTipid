import { listingBridgeAiTools } from '../../../src/lib/listingbridge/ai/tools';
import { ListingBridgeAiService } from '../../../src/lib/listingbridge/ai/listingbridge-ai-service';
import type { ListingBridgeReviewSnapshot } from '../../../src/lib/listingbridge/review/types';

describe('ListingBridge P10: AI Tools Authorization, RBAC & Non-Consequential Boundary', () => {
  const mockSnapshot: ListingBridgeReviewSnapshot = {
    importJobId: 'job-p10-auth-001',
    providerId: 'usr-owner-001',
    jobStatus: 'NEEDS_REVIEW',
    fields: [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: 'Cozy Loft in Salcedo',
        confidenceState: 'VERIFIED',
        isRequired: true,
        isBlocking: false,
        providerModified: false,
        validationState: 'VALIDATED',
        allowedActions: ['CONFIRM', 'EDIT'],
      },
      {
        fieldName: 'dailyRate',
        displayName: 'Daily Rate',
        normalizedValue: null,
        confidenceState: 'MISSING',
        isRequired: true,
        isBlocking: true,
        providerModified: false,
        validationState: 'INVALID',
        allowedActions: ['CONFIRM', 'EDIT'],
      },
    ],
    unresolvedItems: [
      {
        fieldName: 'dailyRate',
        reasonCode: 'MISSING_REQUIRED_FIELD',
        reasonMessage: 'Daily rate is required for active listing',
        severity: 'BLOCKING',
        currentConfidence: 'MISSING',
        permittedActions: ['EDIT', 'CONFIRM'],
      },
    ],
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
        addressLine1: 'Salcedo',
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
      isReadyForDraft: false,
      blockingReasons: ['MISSING_REQUIRED_FIELDS: dailyRate'],
      warningReasons: [],
      resolvedFieldsCount: 1,
      unresolvedBlockingCount: 1,
    },
  };

  const mockRepo = {
    getJobById: jest.fn().mockImplementation(async (jobId: string) => {
      if (jobId === 'job-p10-auth-001') {
        return {
          id: 'job-p10-auth-001',
          provider_id: 'usr-owner-001',
          status: 'NEEDS_REVIEW',
          canonical_payload: {
            version: '1.0',
            sourceConnectorId: 'manual',
            sourceListingId: 'job-p10-auth-001',
            importedAt: new Date().toISOString(),
            fields: {},
            unresolvedFields: [],
            rawMetadata: {},
          },
          resolutions: [{ field_name: 'listingbridge.rightsConfirmation.v1' }],
        };
      }
      return null;
    }),
  };

  const service = new ListingBridgeAiService(mockRepo);

  it('All ListingBridge AI tools are strictly READ_ONLY or DRAFT_ONLY risk class', () => {
    for (const tool of listingBridgeAiTools) {
      expect(['READ_ONLY', 'DRAFT_ONLY']).toContain(tool.riskClass);
    }
  });

  it('All ListingBridge AI tools restrict allowedRoles to Provider and Admin', () => {
    for (const tool of listingBridgeAiTools) {
      expect(tool.allowedRoles).toContain('Provider');
      expect(tool.allowedRoles).toContain('Individual Provider');
      expect(tool.allowedRoles).toContain('Business Provider');
      expect(tool.allowedRoles).toContain('Admin');
      expect(tool.allowedRoles).toContain('Super Admin');
      expect(tool.allowedRoles).not.toContain('Guest');
      expect(tool.allowedRoles).not.toContain('Renter');
    }
  });

  it('Allows authorized owner to retrieve review summary and missing fields', async () => {
    const summary = await service.getReviewSummary('usr-owner-001', 'job-p10-auth-001', {
      overrideSnapshot: mockSnapshot,
    });
    expect(summary.importJobId).toBe('job-p10-auth-001');
    expect(summary.providerId).toBe('usr-owner-001');
    expect(summary.missingRequiredCount).toBe(1);
    expect(summary.isReadyForDraft).toBe(false);

    const missing = await service.identifyMissingFields('usr-owner-001', 'job-p10-auth-001', {
      overrideSnapshot: mockSnapshot,
    });
    expect(missing.missingFields.length).toBe(1);
    expect(missing.missingFields[0]?.fieldName).toBe('dailyRate');
  });

  it('Rejects unauthorized actor attempting to access another provider import job', async () => {
    await expect(
      service.getReviewSummary('usr-different-provider', 'job-p10-auth-001', {
        overrideSnapshot: mockSnapshot,
      }),
    ).rejects.toThrow('OWNERSHIP_DENIAL');

    await expect(
      service.identifyMissingFields('usr-different-provider', 'job-p10-auth-001', {
        overrideSnapshot: mockSnapshot,
      }),
    ).rejects.toThrow('OWNERSHIP_DENIAL');
  });

  it('Allows admin actor (usr-admin) to inspect provider import job', async () => {
    const summary = await service.getReviewSummary('usr-admin', 'job-p10-auth-001', {
      overrideSnapshot: mockSnapshot,
    });
    expect(summary.importJobId).toBe('job-p10-auth-001');
  });

  it('Explains conflict codes in provider-friendly format', async () => {
    const conflict = await service.explainConflict(
      'usr-owner-001',
      'job-p10-auth-001',
      'MISSING_REQUIRED_FIELD',
      { overrideSnapshot: mockSnapshot },
    );
    expect(conflict.conflictCode).toBe('MISSING_REQUIRED_FIELD');
    expect(conflict.fieldName).toBe('dailyRate');
    expect(conflict.isBlocking).toBe(true);
  });
});
