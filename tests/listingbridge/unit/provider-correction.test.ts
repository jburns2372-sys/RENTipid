import {
  ListingBridgeProviderCorrectionService,
  LISTINGBRIDGE_SCHEMA_VERSION,
  type CanonicalImportContract,
  type ReviewFieldModel,
} from '../../../src/lib/listingbridge';

describe('ListingBridge P7: Provider Correction Service', () => {
  const service = new ListingBridgeProviderCorrectionService();

  const baseContract: CanonicalImportContract = {
    schemaVersion: LISTINGBRIDGE_SCHEMA_VERSION,
    source: {
      connectorId: 'test-connector',
      connectorTier: 'TIER_5_MANUAL',
      sourceReferenceHash: 'source-ref-corr-001',
      authorizationMethod: 'PROVIDER_RIGHTS_CONFIRMATION',
      extractedAt: new Date().toISOString(),
    },
    identity: {
      providerId: 'usr-prov-001',
      importJobId: 'job-correction-001',
      idempotencyKey: 'idemp-corr-001',
    },
    property: {
      title: 'Initial Imported Title',
      description: 'Initial description that might need correction by provider.',
      propertyType: 'other',
      condition: 'Good',
    },
    location: {
      city: 'Makati',
      province: 'Metro Manila',
      country: 'PH',
    },
    capacity: { maxGuests: 1 },
    rooms: [],
    amenities: [],
    rules: {},
    pricingHints: { currency: 'PHP' },
    availability: { requiresProviderConfirmation: true },
    media: [
      {
        sourceReferenceHash: 'hash-photo-1',
        isCover: true,
        order: 1,
        confidence: 'VERIFIED',
      },
    ],
    fieldConfidence: {
      title: { state: 'REVIEW_RECOMMENDED', authority: 'SOURCE', requiresProviderReview: true, providerConfirmed: false },
      propertyType: { state: 'REVIEW_RECOMMENDED', authority: 'SOURCE', requiresProviderReview: true, providerConfirmed: false },
    },
    unresolvedFields: [
      { fieldName: 'propertyType', reason: 'PROPERTY_TYPE_AMBIGUOUS', severity: 'BLOCKING', expectedCorrectionSource: 'PROVIDER' },
    ],
    provenance: {
      rawPayloadHash: 'h_raw',
      aiAssisted: false,
      aiOutputAuthoritative: false,
      extractedFactCount: 5,
      rejectedFields: [],
    },
  };

  const initialFields: ReviewFieldModel[] = [
    {
      fieldName: 'title',
      displayName: 'Listing Title',
      normalizedValue: 'Initial Imported Title',
      confidenceState: 'REVIEW_RECOMMENDED',
      isRequired: true,
      isBlocking: false,
      providerModified: false,
      validationState: 'VALIDATED',
      allowedActions: ['CONFIRM', 'EDIT'],
    },
    {
      fieldName: 'propertyType',
      displayName: 'Property Type',
      normalizedValue: 'other',
      confidenceState: 'REVIEW_RECOMMENDED',
      isRequired: true,
      isBlocking: true,
      providerModified: false,
      validationState: 'VALIDATED',
      allowedActions: ['CONFIRM', 'EDIT'],
    },
    {
      fieldName: 'prohibitedGuestPhone',
      displayName: 'Guest Phone',
      normalizedValue: null,
      confidenceState: 'PROHIBITED',
      isRequired: false,
      isBlocking: false,
      providerModified: false,
      validationState: 'INVALID',
      prohibitedReason: 'RENTIPID_PROHIBITED_DATA_POLICY',
      allowedActions: ['DISMISS'],
    },
  ];

  it('LB-MAP-006: Successfully validates, applies, and audits an authorized provider correction', async () => {
    const mockRepository = {
      upsertField: jest.fn().mockResolvedValue({ id: 'fld-123' }),
    };
    const auditLogs: Array<Record<string, unknown>> = [];
    const onAuditLog = jest.fn().mockImplementation((evt: Record<string, unknown>) => {
      auditLogs.push(evt);
    });

    const result = await service.applyCorrection(
      {
        actorUserId: 'usr-prov-001',
        importJobId: 'job-correction-001',
        fieldName: 'propertyType',
        correctedValue: 'condominiums',
      },
      baseContract,
      initialFields,
      'NEEDS_REVIEW',
      { repository: mockRepository, onAuditLog },
    );

    expect(result.success).toBe(true);
    expect(result.fieldName).toBe('propertyType');
    expect(result.previousConfidence).toBe('REVIEW_RECOMMENDED');
    expect(result.newConfidence).toBe('VERIFIED');
    expect(result.updatedValue).toBe('condominiums');

    // Verify Repository persistence
    expect(mockRepository.upsertField).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-correction-001',
        fieldName: 'propertyType',
        confidenceState: 'VERIFIED',
        authority: 'PROVIDER',
        providerModified: true,
      }),
    );

    // Verify Consequential Audit Event
    expect(onAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'RESOLUTION_SAVED',
        jobId: 'job-correction-001',
        actorUserId: 'usr-prov-001',
        fieldName: 'propertyType',
        action: 'PROVIDER_CORRECTION_APPLIED',
      }),
    );

    // Readiness is now true because the only blocking field was resolved
    expect(result.readiness.isReadyForDraft).toBe(true);
  });

  it('Rejects correction attempting to restore or approve a PROHIBITED field', async () => {
    const result = await service.applyCorrection(
      {
        actorUserId: 'usr-prov-001',
        importJobId: 'job-correction-001',
        fieldName: 'prohibitedGuestPhone',
        correctedValue: '+639171234567',
      },
      baseContract,
      initialFields,
      'NEEDS_REVIEW',
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('PROHIBITED_FIELD_CORRECTION_DISALLOWED');
    expect(result.newConfidence).toBe('PROHIBITED');
  });

  it('Rejects invalid correction value failing authoritative domain validation', async () => {
    // Title too short (< 3 chars)
    const result = await service.applyCorrection(
      {
        actorUserId: 'usr-prov-001',
        importJobId: 'job-correction-001',
        fieldName: 'title',
        correctedValue: 'AB',
      },
      baseContract,
      initialFields,
      'NEEDS_REVIEW',
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('VALIDATION_FAILED');
    expect(result.errorMessage).toContain('Listing title must be at least 3 characters long');
  });

  it('Does NOT create Listing database records or publish listings (No Draft Creation in P7)', async () => {
    // Verify that the correction service does not have or call Listing creation methods
    expect((service as unknown as Record<string, unknown>).createListing).toBeUndefined();
    expect((service as unknown as Record<string, unknown>).publishListing).toBeUndefined();
    expect((service as unknown as Record<string, unknown>).createDraft).toBeUndefined();
  });
});
