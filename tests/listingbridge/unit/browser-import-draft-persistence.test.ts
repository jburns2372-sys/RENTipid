import { ListingBridgeDraftCreationService } from '../../../src/lib/listingbridge/draft/draft-creation-service';
import type { ListingAuthorityAdapter } from '../../../src/lib/listingbridge/draft/types';
import type { ListingBridgeReviewSnapshot } from '../../../src/lib/listingbridge/review/types';

// Define mock functions that are safe with Jest hoisting
const mockFindUniqueJob = jest.fn();
const mockCreateJob = jest.fn();
const mockUpdateJob = jest.fn();
const mockUpsertField = jest.fn().mockResolvedValue({ id: 'f-1' });
const mockCreateSource = jest.fn().mockResolvedValue({ id: 'src-1' });
const mockUpsertResolution = jest.fn().mockResolvedValue({ id: 'res-1' });
const mockCreateAuditEvent = jest.fn().mockResolvedValue({ id: 'aud-1' });
const mockFindUniqueListing = jest.fn();
const mockCreateListing = jest.fn();
const mockFindFirstCategory = jest.fn().mockResolvedValue({ id: 'cat-condo-001', slug: 'condominiums' });

jest.mock('@prisma/client', () => {
  return {
    ListingImportResolutionType: {
      PROVIDER_OVERRIDE: 'PROVIDER_OVERRIDE',
      AI_SUGGESTION_ACCEPTED: 'AI_SUGGESTION_ACCEPTED',
      SYSTEM_DEFAULT: 'SYSTEM_DEFAULT',
      DISMISSED: 'DISMISSED',
    },
    ListingImportAuditEventType: {
      JOB_CREATED: 'JOB_CREATED',
      STATUS_CHANGED: 'STATUS_CHANGED',
      AUTHORIZATION_COMPLETED: 'AUTHORIZATION_COMPLETED',
      FETCH_COMPLETED: 'FETCH_COMPLETED',
      NORMALIZATION_COMPLETED: 'NORMALIZATION_COMPLETED',
      SECURITY_BLOCKED: 'SECURITY_BLOCKED',
      AI_ENRICHED: 'AI_ENRICHED',
      RESOLUTION_SAVED: 'RESOLUTION_SAVED',
      DRAFT_COMMITTED: 'DRAFT_COMMITTED',
      JOB_FAILED: 'JOB_FAILED',
    },
    PrismaClient: jest.fn().mockImplementation(() => ({
      listingImportJob: {
        findUnique: (...args: unknown[]) => mockFindUniqueJob(...args),
        create: (...args: unknown[]) => mockCreateJob(...args),
        update: (...args: unknown[]) => mockUpdateJob(...args),
      },
      listingImportField: {
        upsert: (...args: unknown[]) => mockUpsertField(...args),
      },
      listingImportSource: {
        create: (...args: unknown[]) => mockCreateSource(...args),
      },
      listingImportResolution: {
        upsert: (...args: unknown[]) => mockUpsertResolution(...args),
      },
      listingImportAuditEvent: {
        create: (...args: unknown[]) => mockCreateAuditEvent(...args),
      },
      listing: {
        findUnique: (...args: unknown[]) => mockFindUniqueListing(...args),
        create: (...args: unknown[]) => mockCreateListing(...args),
      },
      category: {
        findFirst: (...args: unknown[]) => mockFindFirstCategory(...args),
      },
    })),
  };
});

const mockSession = {
  user: {
    id: 'usr-prov-100',
    email: 'provider@rentipid.local',
    role: 'Individual Provider',
    status: 'Verified',
  },
};

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockImplementation(() => Promise.resolve(mockSession)),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Import after mocks
import {
  startImportAction,
  saveCorrectionAction,
  confirmRightsAction,
} from '../../../src/app/dashboard/provider/listings/import/actions';

describe('G1: Browser Import & Draft Persistence Authority', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. startImportAction creates and returns real persisted ListingImportJob with review snapshot', async () => {
    mockFindUniqueJob.mockResolvedValue(null);
    mockCreateJob.mockResolvedValue({
      id: 'job-real-db-999',
      provider_id: 'usr-prov-100',
      status: 'CREATED',
      idempotency_key: 'idemp-key-1',
    });
    mockCreateSource.mockResolvedValue({ id: 'src-1' });
    mockUpdateJob.mockResolvedValue({ id: 'job-real-db-999' });

    const result = await startImportAction('internal.test.fixture');

    expect(result.success).toBe(true);
    expect(result.jobId).toBe('job-real-db-999');
    expect(result.snapshot).toBeDefined();
    expect(result.snapshot?.importJobId).toBe('job-real-db-999');
    expect(result.snapshot?.providerId).toBe('usr-prov-100');
  });

  it('2. saveCorrectionAction validates provider ownership and persists correction to DB', async () => {
    mockFindUniqueJob.mockResolvedValue({
      id: 'job-real-db-999',
      provider_id: 'usr-prov-100',
      fields: [],
    });

    const mockSnapshot: ListingBridgeReviewSnapshot = {
      importJobId: 'job-real-db-999',
      providerId: 'usr-prov-100',
      jobStatus: 'NEEDS_REVIEW',
      fields: [
        {
          fieldName: 'title',
          displayName: 'Listing Title',
          normalizedValue: 'Old Title',
          confidenceState: 'HIGH_CONFIDENCE',
          isRequired: true,
          isBlocking: false,
          providerModified: false,
          validationState: 'VALIDATED',
          allowedActions: ['EDIT'],
        },
      ],
      unresolvedItems: [],
      media: { totalCandidates: 1, validatedCount: 1, rejectedCount: 0, duplicateCount: 0, hasCoverPhoto: true, isBlocking: false },
      location: { normalizedAddress: undefined, isWithinPhilippineBounds: true, conflicts: [], isBlocking: false, requiresReview: false },
      duplicate: { matchLevel: 'NO_MATCH', confidenceScore: 0, signals: [], isBlocking: false, requiresReview: false },
      rights: { rightsConfirmed: true, isBlocking: false },
      readiness: { isReadyForDraft: true, blockingReasons: [], warningReasons: [], resolvedFieldsCount: 1, unresolvedBlockingCount: 0 },
    };

    const result = await saveCorrectionAction(
      'job-real-db-999',
      'title',
      'Verified Modern Suite in BGC',
      mockSnapshot,
    );

    expect(result.success).toBe(true);
    expect(mockUpsertResolution).toHaveBeenCalled();
    expect(mockUpsertField).toHaveBeenCalled();
    expect(result.snapshot?.fields.find((f) => f.fieldName === 'title')?.normalizedValue).toBe(
      'Verified Modern Suite in BGC',
    );
    expect(result.snapshot?.fields.find((f) => f.fieldName === 'title')?.confidenceState).toBe(
      'VERIFIED',
    );
  });

  it('3. Ownership mismatch blocks unauthorized provider from modifying job', async () => {
    mockFindUniqueJob.mockResolvedValue({
      id: 'job-real-db-999',
      provider_id: 'usr-other-attacker',
      fields: [],
    });

    const mockSnapshot: ListingBridgeReviewSnapshot = {
      importJobId: 'job-real-db-999',
      providerId: 'usr-other-attacker',
      jobStatus: 'NEEDS_REVIEW',
      fields: [],
      unresolvedItems: [],
      media: { totalCandidates: 0, validatedCount: 0, rejectedCount: 0, duplicateCount: 0, hasCoverPhoto: false, isBlocking: false },
      location: { normalizedAddress: undefined, isWithinPhilippineBounds: true, conflicts: [], isBlocking: false, requiresReview: false },
      duplicate: { matchLevel: 'NO_MATCH', confidenceScore: 0, signals: [], isBlocking: false, requiresReview: false },
      rights: { rightsConfirmed: true, isBlocking: false },
      readiness: { isReadyForDraft: false, blockingReasons: [], warningReasons: [], resolvedFieldsCount: 0, unresolvedBlockingCount: 0 },
    };

    const result = await saveCorrectionAction(
      'job-real-db-999',
      'title',
      'Hacked Title',
      mockSnapshot,
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('OWNERSHIP_MISMATCH');
  });

  it('4. confirmRightsAction persists rights confirmation and creates audit log', async () => {
    mockFindUniqueJob.mockResolvedValue({
      id: 'job-real-db-999',
      provider_id: 'usr-prov-100',
    });

    const result = await confirmRightsAction('job-real-db-999', {
      ownsOrManagesProperty: true,
      authorizedToSubmitImportedInformation: true,
      hasImportedMediaReuseRights: true,
      acceptsAccuracyResponsibility: true,
    });

    expect(result.success).toBe(true);
    expect(mockUpsertResolution).toHaveBeenCalled();
    expect(mockCreateAuditEvent).toHaveBeenCalled();
  });

  it('5. createNativeDraftAction invokes authoritative draft authority and returns actual Listing.id', async () => {
    mockFindUniqueJob.mockResolvedValue({
      id: 'job-real-db-999',
      provider_id: 'usr-prov-100',
      status: 'NEEDS_REVIEW',
      created_listing_id: null,
      canonical_payload: {
        schemaVersion: 'rentipid.listingbridge.v1',
        source: { connectorId: 'internal.test.fixture', connectorTier: 'TIER_3_FILE', sourceReferenceHash: 'hash', authorizationMethod: 'PROVIDER_RIGHTS_CONFIRMATION', extractedAt: new Date().toISOString() },
        identity: { providerId: 'usr-prov-100', importJobId: 'job-real-db-999', idempotencyKey: 'idemp-1' },
        property: { title: 'Verified Luxury Suite', description: 'Description', propertyType: 'condominiums' },
        location: { city: 'Makati', country: 'PH' },
        capacity: {},
        rooms: [],
        amenities: [],
        rules: {},
        pricingHints: { currency: 'PHP', baseRate: { amount: 3500 } },
        availability: { requiresProviderConfirmation: true },
        media: [{ sourceReferenceHash: 'media-1', isCover: true, order: 1, confidence: 'VERIFIED' }],
        fieldConfidence: {},
        unresolvedFields: [],
        provenance: { rawPayloadHash: 'hash', aiAssisted: false, aiOutputAuthoritative: false, extractedFactCount: 5, rejectedFields: [] },
      },
      resolutions: [
        { field_name: 'listingbridge.rightsConfirmation.v1', resolved_value: { confirmed: true } },
      ],
      fields: [
        { fieldName: 'title', normalizedValue: 'Verified Luxury Suite', confidenceState: 'VERIFIED', isRequired: true, isBlocking: false, providerModified: true, validationState: 'VALIDATED' },
        { fieldName: 'description', normalizedValue: 'Description', confidenceState: 'VERIFIED', isRequired: true, isBlocking: false, providerModified: true, validationState: 'VALIDATED' },
        { fieldName: 'propertyType', normalizedValue: 'condominiums', confidenceState: 'VERIFIED', isRequired: true, isBlocking: false, providerModified: true, validationState: 'VALIDATED' },
      ],
    });

    const mockAdapter: ListingAuthorityAdapter = {
      createDraft: jest.fn().mockResolvedValue({
        id: 'lst-real-cuid-12345678',
        status: 'Draft',
        title: 'Verified Luxury Suite',
      }),
    };

    const draftService = new ListingBridgeDraftCreationService(
      {
        getJobById: async () => ({
          id: 'job-real-db-999',
          provider_id: 'usr-prov-100',
          status: 'NEEDS_REVIEW',
          created_listing_id: null,
          canonical_payload: {
            schemaVersion: 'rentipid.listingbridge.v1',
            source: { connectorId: 'internal.test.fixture', connectorTier: 'TIER_3_FILE', sourceReferenceHash: 'hash', authorizationMethod: 'PROVIDER_RIGHTS_CONFIRMATION', extractedAt: new Date().toISOString() },
            identity: { providerId: 'usr-prov-100', importJobId: 'job-real-db-999', idempotencyKey: 'idemp-1' },
            property: { title: 'Verified Luxury Suite', description: 'Description', propertyType: 'condominiums' },
            location: { city: 'Makati', country: 'PH' },
            capacity: {},
            rooms: [],
            amenities: [],
            rules: {},
            pricingHints: { currency: 'PHP', baseRate: { amount: 3500 } },
            availability: { requiresProviderConfirmation: true },
            media: [{ sourceReferenceHash: 'media-1', isCover: true, order: 1, confidence: 'VERIFIED' }],
            fieldConfidence: {},
            unresolvedFields: [],
            provenance: { rawPayloadHash: 'hash', aiAssisted: false, aiOutputAuthoritative: false, extractedFactCount: 5, rejectedFields: [] },
          },
          resolutions: [
            { field_name: 'listingbridge.rightsConfirmation.v1', resolved_value: { confirmed: true }, resolved_at: new Date() },
          ],
          fields: [
            { fieldName: 'title', normalizedValue: 'Verified Luxury Suite', confidenceState: 'VERIFIED', authority: 'PROVIDER_ASSERTED', isRequired: true, isBlocking: false, providerModified: true, validationState: 'VALIDATED' },
            { fieldName: 'description', normalizedValue: 'Description', confidenceState: 'VERIFIED', authority: 'PROVIDER_ASSERTED', isRequired: true, isBlocking: false, providerModified: true, validationState: 'VALIDATED' },
            { fieldName: 'propertyType', normalizedValue: 'condominiums', confidenceState: 'VERIFIED', authority: 'PROVIDER_ASSERTED', isRequired: true, isBlocking: false, providerModified: true, validationState: 'VALIDATED' },
          ],
        }),
        completeJobWithListing: async (jobId, listingId) => {
          return { id: jobId, created_listing_id: listingId, status: 'COMPLETED' };
        },
      },
      mockAdapter,
    );

    const draftResult = await draftService.createDraftFromImport({
      actorUserId: 'usr-prov-100',
      importJobId: 'job-real-db-999',
    });

    expect(draftResult.success).toBe(true);
    expect(draftResult.listingId).toBe('lst-real-cuid-12345678');
    expect(draftResult.status).toBe('Draft');
    expect(draftResult.listingId).not.toContain('lst-draft-mo-001');
    expect(mockAdapter.createDraft).toHaveBeenCalledTimes(1);
  });

  it('6. Repeat draft creation returns existing Listing.id idempotently without creating duplicate', async () => {
    const mockAdapter: ListingAuthorityAdapter = {
      createDraft: jest.fn(),
    };

    const draftService = new ListingBridgeDraftCreationService(
      {
        getJobById: async () => ({
          id: 'job-real-db-999',
          provider_id: 'usr-prov-100',
          status: 'COMPLETED',
          created_listing_id: 'lst-real-cuid-12345678',
        }),
        completeJobWithListing: jest.fn().mockResolvedValue({}),
      },
      mockAdapter,
    );

    const repeatResult = await draftService.createDraftFromImport({
      actorUserId: 'usr-prov-100',
      importJobId: 'job-real-db-999',
    });

    expect(repeatResult.success).toBe(true);
    expect(repeatResult.listingId).toBe('lst-real-cuid-12345678');
    expect(repeatResult.isReusedIdempotently).toBe(true);
    expect(mockAdapter.createDraft).not.toHaveBeenCalled();
  });
});
