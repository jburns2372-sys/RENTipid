import { SsrfProtectionService } from '../../../src/lib/listingbridge/security/ssrf-protection';
import { ListingBridgeAiService } from '../../../src/lib/listingbridge/ai/listingbridge-ai-service';
import { ListingBridgeDraftCreationService } from '../../../src/lib/listingbridge/draft/draft-creation-service';
import { ListingBridgeUiService } from '../../../src/lib/listingbridge/ui/actions';
import {
  isManualListingCreationIndependentOfListingBridgeFlags,
} from '../../../src/lib/listingbridge/connectors/feature-flags';
import type { ListingBridgeReviewSnapshot } from '../../../src/lib/listingbridge/review/types';

describe('ListingBridge P11: Negative Security Campaign & Cross-Tenant Isolation', () => {
  const ssrfService = new SsrfProtectionService({ allowHttp: true });

  const providerBJobSnapshot: ListingBridgeReviewSnapshot = {
    importJobId: 'job-tenant-B-001',
    providerId: 'usr-tenant-B',
    jobStatus: 'READY_FOR_DRAFT',
    fields: [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: 'Private Villa owned by Provider B',
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
        latitude: 14.55,
        longitude: 121.05,
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

  it('Cross-Tenant: Provider A cannot access Provider B review summary or AI tools', async () => {
    const aiService = new ListingBridgeAiService();

    await expect(
      aiService.getReviewSummary('usr-tenant-A', 'job-tenant-B-001', {
        overrideSnapshot: providerBJobSnapshot,
      }),
    ).rejects.toThrow('OWNERSHIP_DENIAL');
  });

  it('Cross-Tenant: Provider A cannot submit corrections for Provider B import job', async () => {
    const uiService = new ListingBridgeUiService();

    const result = await uiService.submitCorrection(
      providerBJobSnapshot,
      'title',
      'Hacked Title by Provider A',
      'usr-tenant-A',
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('OWNERSHIP_MISMATCH');
  });

  it('Cross-Tenant: Provider A cannot trigger draft creation for Provider B import job', async () => {
    const mockAuthority = { createDraft: jest.fn() };
    const mockRepo = {
      getJobById: jest.fn().mockResolvedValue({
        id: 'job-tenant-B-001',
        provider_id: 'usr-tenant-B',
        status: 'READY_FOR_DRAFT',
        created_listing_id: null,
      }),
      markJobCreatingDraft: jest.fn(),
      completeJobWithListing: jest.fn(),
    };

    const draftService = new ListingBridgeDraftCreationService(mockRepo, mockAuthority);

    const result = await draftService.createDraftFromImport({
      actorUserId: 'usr-tenant-A',
      importJobId: 'job-tenant-B-001',
    }, { overrideSnapshot: providerBJobSnapshot });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('OWNERSHIP_MISMATCH');
    expect(mockAuthority.createDraft).not.toHaveBeenCalled();
  });

  it('SSRF Hardening: Denies loopback, private RFC1918, link-local metadata, and IPv6 loopback', async () => {
    const blockedUrls = [
      'https://127.0.0.1:8080/admin',
      'https://localhost/metrics',
      'https://10.0.0.1/internal-api',
      'https://172.16.0.5/secrets',
      'https://192.168.1.1/router-config',
      'https://169.254.169.254/latest/meta-data/',
      'https://[::1]/internal',
      'https://0.0.0.0:3000/api',
    ];

    for (const url of blockedUrls) {
      await expect(ssrfService.validateUrl(url)).rejects.toThrow();
    }
  });

  it('Manual Listing Independence: Manual listing wizard remains 100% operational when kill switches are active', () => {
    expect(isManualListingCreationIndependentOfListingBridgeFlags()).toBe(true);
  });
});
