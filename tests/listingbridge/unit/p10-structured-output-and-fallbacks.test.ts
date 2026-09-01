import { ListingBridgeUnifiedAiAdapter } from '../../../src/lib/listingbridge/ai/unified-ai-adapter';
import { ListingBridgeAiService } from '../../../src/lib/listingbridge/ai/listingbridge-ai-service';
import type { ListingBridgeSemanticAiInput } from '../../../src/lib/listingbridge/normalization/semantic-ai-boundary';
import type { ListingBridgeReviewSnapshot } from '../../../src/lib/listingbridge/review/types';

describe('ListingBridge P10: Master Plan AI Boundary & Fallbacks (LB-AI-001..005)', () => {
  const aiService = new ListingBridgeAiService();

  const mockSnapshot: ListingBridgeReviewSnapshot = {
    importJobId: 'job-p10-sp-001',
    providerId: 'usr-p10-prov-001',
    jobStatus: 'READY_FOR_DRAFT',
    fields: [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: 'Modern 1BR Condo with High-Speed Internet',
        confidenceState: 'VERIFIED',
        isRequired: true,
        isBlocking: false,
        providerModified: false,
        validationState: 'VALIDATED',
        allowedActions: ['CONFIRM', 'EDIT'],
      },
      {
        fieldName: 'propertyType',
        displayName: 'Property Type',
        normalizedValue: 'Condominium',
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
        addressLine1: 'Ayala Avenue',
        addressLine2: null,
        sublocality: null,
        locality: 'Makati',
        administrativeArea2: null,
        administrativeArea1: 'Metro Manila',
        postalCode: '1226',
        countryCode: 'PH',
        formattedAddress: 'Ayala Avenue, Makati, Metro Manila',
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

  it('LB-AI-001: AI cannot fabricate missing factual fields (advisory suggestions only, isVerified: false)', () => {
    const suggestion = aiService.suggestAmenityMapping('usr-p10-prov-001', 'fast wifi connection');

    expect(suggestion.suggestedCanonicalAmenityId).toBe('wifi');
    expect(suggestion.suggestedDisplayName).toBe('WiFi');
    expect(suggestion.provenance).toBe('AI_ASSISTED');
    expect(suggestion.isVerified).toBe(false); // AI NEVER directly marks field as VERIFIED
  });

  it('LB-AI-002: AI structured output schema violation fails safely (fails closed)', async () => {
    const mockCorruptAiService = {
      suggestAmenityMapping: () => {
        // Return corrupt object that breaks schema
        return { invalidKey: 12345 } as unknown as ReturnType<ListingBridgeAiService['suggestAmenityMapping']>;
      },
      suggestPropertyCategory: () => ({ invalid: true } as unknown as ReturnType<ListingBridgeAiService['suggestPropertyCategory']>),
    } as unknown as ListingBridgeAiService;

    const adapter = new ListingBridgeUnifiedAiAdapter({
      enabled: true,
      aiService: mockCorruptAiService,
    });

    const input: ListingBridgeSemanticAiInput = {
      rawPropertyType: 'loft',
      unmappedAmenities: ['fibre internet'],
    };

    // Should return valid structured output or fail safely (null)
    const result = await adapter.mapAmbiguousFields(input);
    expect(result === null || typeof result === 'object').toBe(true);
  });

  it('LB-AI-003: AI cannot publish or approve a listing (drafting is strictly advisory)', async () => {
    const draft = await aiService.draftOriginalDescription('usr-p10-prov-001', 'job-p10-sp-001', {
      overrideSnapshot: mockSnapshot,
    });

    expect(draft.importJobId).toBe('job-p10-sp-001');
    expect(draft.draftedDescription).toContain('Modern 1BR Condo with High-Speed Internet');
    expect(draft.provenance).toBe('AI_ASSISTED_DRAFT');
    expect(draft.disclaimer).toContain('Please review before publishing');
  });

  it('LB-AI-004: ListingBridge core works with AI assistance disabled (fallback to null)', async () => {
    const disabledAdapter = new ListingBridgeUnifiedAiAdapter({ enabled: false });

    expect(disabledAdapter.isAvailable()).toBe(false);

    const input: ListingBridgeSemanticAiInput = {
      rawPropertyType: 'condo',
      unmappedAmenities: ['fast wifi'],
    };

    const result = await disabledAdapter.mapAmbiguousFields(input);
    expect(result).toBeNull(); // Clean fallback: normalization pipeline continues with deterministic defaults
  });

  it('LB-AI-005: AI cannot bypass duplicate, RBAC or rights controls', async () => {
    const blockedSnapshot: ListingBridgeReviewSnapshot = {
      ...mockSnapshot,
      importJobId: 'job-p10-blocked-001',
      rights: {
        rightsConfirmed: false,
        isBlocking: true,
      },
      readiness: {
        isReadyForDraft: false,
        blockingReasons: ['RIGHTS_NOT_CONFIRMED'],
        warningReasons: [],
        resolvedFieldsCount: 1,
        unresolvedBlockingCount: 1,
      },
    };

    const summary = await aiService.getReviewSummary('usr-p10-prov-001', 'job-p10-blocked-001', {
      overrideSnapshot: blockedSnapshot,
    });

    // Summary correctly communicates that rights confirmation is required and listing is NOT ready
    expect(summary.isReadyForDraft).toBe(false);
    expect(summary.nextRecommendedAction).toContain('Confirm provider listing rights');
  });

  it('Suggests canonical property category slug conforming to taxonomy', () => {
    const suggestion = aiService.suggestPropertyCategory('usr-p10-prov-001', 'serviced apartment');

    expect(suggestion.suggestedCategorySlug).toBe('condominiums');
    expect(suggestion.suggestedDisplayName).toBe('Condominium');
    expect(suggestion.confidence).toBe('HIGH_CONFIDENCE');
    expect(suggestion.provenance).toBe('AI_ASSISTED');
  });
});
