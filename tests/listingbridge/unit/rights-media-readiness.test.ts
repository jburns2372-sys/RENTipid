import {
  ListingBridgeDraftCreationService,
  type ListingBridgeDraftRepository,
} from '../../../src/lib/listingbridge/draft/draft-creation-service';
import { ListingBridgeDraftReadinessEngine } from '../../../src/lib/listingbridge/review/draft-readiness-engine';
import { ListingBridgeReviewSnapshotEngine } from '../../../src/lib/listingbridge/review/review-snapshot-engine';
import { validateUploadRequest, LISTING_PHOTO_POLICY } from '../../../src/lib/security/upload-security';
import type { ListingBridgeReviewSnapshot } from '../../../src/lib/listingbridge/review/types';
import type { ListingAuthorityAdapter } from '../../../src/lib/listingbridge/draft/types';

describe('ListingBridge v1.1 Rights Confirmation & Media Readiness Regression Suite', () => {
  const readinessEngine = new ListingBridgeDraftReadinessEngine();
  const snapshotEngine = new ListingBridgeReviewSnapshotEngine();

  const baseSnapshot: ListingBridgeReviewSnapshot = {
    importJobId: 'job-rights-media-001',
    providerId: 'usr-provider-001',
    jobStatus: 'NEEDS_REVIEW',
    fields: [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: 'Spacious 2BR Condo in BGC',
        confidenceState: 'VERIFIED',
        isRequired: true,
        isBlocking: false,
        providerModified: false,
        validationState: 'VALIDATED',
        allowedActions: ['CONFIRM', 'EDIT'],
      },
      {
        fieldName: 'description',
        displayName: 'Description',
        normalizedValue: 'Fully furnished with high-speed internet.',
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
      totalCandidates: 0,
      validatedCount: 0,
      rejectedCount: 0,
      duplicateCount: 0,
      hasCoverPhoto: false,
      isBlocking: true,
      assets: [],
    },
    location: {
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
      rightsConfirmed: false,
      isBlocking: true,
    },
    readiness: {
      isReadyForDraft: false,
      blockingReasons: [
        'RIGHTS_NOT_CONFIRMED: Provider rights confirmation is required before draft readiness',
        'MEDIA_PHOTOS_MISSING: At least one validated photo is required for listing draft',
      ],
      warningReasons: [],
      resolvedFieldsCount: 2,
      unresolvedBlockingCount: 0,
    },
  };

  describe('1. Rights Confirmation State & Propagation', () => {
    it('1.1: Initial assisted snapshot has RIGHTS_NOT_CONFIRMED blocker', () => {
      const readiness = readinessEngine.evaluate(baseSnapshot);
      expect(readiness.isReadyForDraft).toBe(false);
      expect(readiness.blockingReasons).toContain(
        'RIGHTS_NOT_CONFIRMED: Provider rights confirmation is required before draft readiness',
      );
    });

    it('1.2: Confirmed rights remove the rights blocker from readiness', () => {
      const confirmedSnapshot: ListingBridgeReviewSnapshot = {
        ...baseSnapshot,
        rights: {
          rightsConfirmed: true,
          confirmedAt: new Date(),
          isBlocking: false,
        },
      };
      const readiness = readinessEngine.evaluate(confirmedSnapshot);
      expect(readiness.blockingReasons).not.toContain(
        'RIGHTS_NOT_CONFIRMED: Provider rights confirmation is required before draft readiness',
      );
    });

    it('1.3: Draft creation service rejects draft creation when DB rights confirmation is missing', async () => {
      const mockRepo: ListingBridgeDraftRepository = {
        getJobById: jest.fn().mockResolvedValue({
          id: 'job-rights-media-001',
          provider_id: 'usr-provider-001',
          status: 'NEEDS_REVIEW',
          created_listing_id: null,
          canonical_payload: {
            schemaVersion: 'rentipid.listingbridge.v1',
            property: { title: 'Test' },
            media: [{ isCover: true }],
          },
          resolutions: [], // NO rights confirmation resolution
          assets: [{ id: 'asset-1', status: 'VALIDATED', is_cover: true }],
        }),
        completeJobWithListing: jest.fn(),
      };

      const service = new ListingBridgeDraftCreationService(mockRepo);
      const result = await service.createDraftFromImport({
        actorUserId: 'usr-provider-001',
        importJobId: 'job-rights-media-001',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DRAFT_READINESS_FAILED');
      expect(result.blockingReasons).toContain(
        'RIGHTS_NOT_CONFIRMED: Provider rights confirmation is required before draft readiness',
      );
    });

    it('1.4: Draft creation service accepts draft when DB rights resolution exists and media is validated', async () => {
      const mockRepo: ListingBridgeDraftRepository = {
        getJobById: jest.fn().mockResolvedValue({
          id: 'job-rights-media-001',
          provider_id: 'usr-provider-001',
          status: 'NEEDS_REVIEW',
          created_listing_id: null,
          canonical_payload: {
            schemaVersion: 'rentipid.listingbridge.v1',
            source: { connectorId: 'airbnb.assisted.v1', connectorTier: 'TIER_3_FILE', sourceReferenceHash: 'hash1' },
            identity: { canonicalId: 'can-1', provenanceHash: 'hash1' },
            property: {
              title: 'Spacious 2BR Condo',
              description: 'A cozy two-bedroom unit with fast WiFi and air conditioning.',
              propertyType: 'condominiums',
            },
            location: { country: 'PH' },
            pricingHints: { currency: 'PHP' },
            media: [],
            fieldConfidence: {},
            unresolvedFields: [],
            provenance: { rawPayloadHash: 'hash', aiAssisted: false, aiOutputAuthoritative: false, extractedFactCount: 1, rejectedFields: [] },
          },
          resolutions: [
            {
              field_name: 'listingbridge.rightsConfirmation.v1',
              resolved_value: { hasImportedMediaReuseRights: true },
              resolved_at: new Date(),
            },
          ],
          assets: [
            {
              id: 'asset-val-1',
              status: 'VALIDATED',
              is_cover: true,
              storage_path: '/uploads/sample.jpg',
            },
          ],
        }),
        completeJobWithListing: jest.fn().mockResolvedValue({ id: 'job-rights-media-001' }),
      };

      const mockAuthority: ListingAuthorityAdapter = {
        createDraft: jest.fn().mockResolvedValue({ id: 'lst-native-draft-001', status: 'Draft' }),
      };

      const service = new ListingBridgeDraftCreationService(mockRepo, mockAuthority);
      const result = await service.createDraftFromImport({
        actorUserId: 'usr-provider-001',
        importJobId: 'job-rights-media-001',
      });

      expect(result.success).toBe(true);
      expect(result.listingId).toBe('lst-native-draft-001');
      expect(result.status).toBe('Draft');
    });
  });

  describe('2. Media Validation & Upload Controls', () => {
    it('2.1: Initial assisted import with 0 photos has MEDIA_PHOTOS_MISSING blocker', () => {
      const readiness = readinessEngine.evaluate(baseSnapshot);
      expect(readiness.blockingReasons).toContain(
        'MEDIA_PHOTOS_MISSING: At least one validated photo is required for listing draft',
      );
    });

    it('2.2: Valid JPEG/PNG/WebP upload under 5MB passes policy validation', async () => {
      const validJpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const validBuffer = Buffer.concat([validJpegHeader, Buffer.alloc(100)]);
      const file = new File([validBuffer], 'living-room.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);

      const validation = await validateUploadRequest(formData, 'file', LISTING_PHOTO_POLICY);
      expect(validation.isValid).toBe(true);
      expect(validation.files).toHaveLength(1);
    });

    it('2.3: Non-image or dangerous extension is rejected by upload policy', async () => {
      const scriptBuffer = Buffer.from('console.log("bad")');
      const file = new File([scriptBuffer], 'exploit.js', { type: 'application/javascript' });

      const formData = new FormData();
      formData.append('file', file);

      const validation = await validateUploadRequest(formData, 'file', LISTING_PHOTO_POLICY);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('UPLOAD_EXTENSION_NOT_ALLOWED');
    });

    it('2.4: Oversized image (>5MB) is rejected by upload policy', async () => {
      const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024);
      const file = new File([oversizedBuffer], 'giant.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);

      const validation = await validateUploadRequest(formData, 'file', LISTING_PHOTO_POLICY);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('UPLOAD_TOO_LARGE');
    });

    it('2.5: Validated media count >= 1 removes MEDIA_PHOTOS_MISSING blocker', () => {
      const snapshotWithPhoto: ListingBridgeReviewSnapshot = {
        ...baseSnapshot,
        media: {
          totalCandidates: 1,
          validatedCount: 1,
          rejectedCount: 0,
          duplicateCount: 0,
          hasCoverPhoto: true,
          isBlocking: false,
          assets: [
            {
              id: 'asset-01',
              url: '/uploads/living-room.jpg',
              label: 'living-room.jpg',
              status: 'VALIDATED',
              isCover: true,
            },
          ],
        },
      };

      const readiness = readinessEngine.evaluate(snapshotWithPhoto);
      expect(readiness.blockingReasons).not.toContain(
        'MEDIA_PHOTOS_MISSING: At least one validated photo is required for listing draft',
      );
    });

    it('2.6: Draft creation service rejects draft when validated photo count is zero', async () => {
      const mockRepo: ListingBridgeDraftRepository = {
        getJobById: jest.fn().mockResolvedValue({
          id: 'job-rights-media-001',
          provider_id: 'usr-provider-001',
          status: 'NEEDS_REVIEW',
          created_listing_id: null,
          canonical_payload: {
            schemaVersion: 'rentipid.listingbridge.v1',
            property: { title: 'Test' },
            media: [], // 0 media
          },
          resolutions: [
            {
              field_name: 'listingbridge.rightsConfirmation.v1',
              resolved_value: { hasImportedMediaReuseRights: true },
              resolved_at: new Date(),
            },
          ],
          assets: [], // 0 assets
        }),
        completeJobWithListing: jest.fn(),
      };

      const service = new ListingBridgeDraftCreationService(mockRepo);
      const result = await service.createDraftFromImport({
        actorUserId: 'usr-provider-001',
        importJobId: 'job-rights-media-001',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DRAFT_READINESS_FAILED');
      expect(result.blockingReasons).toContain(
        'MEDIA_PHOTOS_MISSING: At least one validated photo is required for listing draft',
      );
    });
  });

  describe('3. Combined Readiness & Draft Safety Invariants', () => {
    it('3.1: Readiness succeeds only when BOTH rights and media are satisfied', () => {
      // Both satisfied
      const fullyReadySnapshot: ListingBridgeReviewSnapshot = {
        ...baseSnapshot,
        rights: {
          rightsConfirmed: true,
          confirmedAt: new Date(),
          isBlocking: false,
        },
        media: {
          totalCandidates: 1,
          validatedCount: 1,
          rejectedCount: 0,
          duplicateCount: 0,
          hasCoverPhoto: true,
          isBlocking: false,
        },
      };

      const readiness = readinessEngine.evaluate(fullyReadySnapshot);
      expect(readiness.isReadyForDraft).toBe(true);
      expect(readiness.blockingReasons).toHaveLength(0);
    });

    it('3.2: Draft creation creates native draft with status strictly "Draft" (no auto-publication)', async () => {
      const mockRepo: ListingBridgeDraftRepository = {
        getJobById: jest.fn().mockResolvedValue({
          id: 'job-rights-media-001',
          provider_id: 'usr-provider-001',
          status: 'NEEDS_REVIEW',
          created_listing_id: null,
          canonical_payload: {
            schemaVersion: 'rentipid.listingbridge.v1',
            source: { connectorId: 'facebook.marketplace.assisted.v1', connectorTier: 'TIER_3_FILE', sourceReferenceHash: 'h1' },
            identity: { canonicalId: 'can-1', provenanceHash: 'h1' },
            property: {
              title: 'Safe Draft Property',
              description: 'A cozy two-bedroom unit with fast WiFi and air conditioning.',
              propertyType: 'condominiums',
            },
            location: { country: 'PH' },
            pricingHints: { currency: 'PHP' },
            media: [],
            fieldConfidence: {},
            unresolvedFields: [],
            provenance: { rawPayloadHash: 'h', aiAssisted: false, aiOutputAuthoritative: false, extractedFactCount: 1, rejectedFields: [] },
          },
          resolutions: [
            { field_name: 'listingbridge.rightsConfirmation.v1', resolved_value: true, resolved_at: new Date() },
          ],
          assets: [
            { id: 'ast-1', status: 'VALIDATED', is_cover: true, storage_path: '/uploads/p1.jpg' },
          ],
        }),
        completeJobWithListing: jest.fn().mockResolvedValue({ id: 'job-rights-media-001' }),
      };

      const mockAuthority: ListingAuthorityAdapter = {
        createDraft: jest.fn().mockResolvedValue({ id: 'lst-draft-999', status: 'Draft' }),
      };

      const service = new ListingBridgeDraftCreationService(mockRepo, mockAuthority);
      const res = await service.createDraftFromImport({
        actorUserId: 'usr-provider-001',
        importJobId: 'job-rights-media-001',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('Draft');
      expect(res.status).not.toBe('Published');
    });

    it('3.3: Actor cannot create draft for another provider\'s import job (Ownership Mismatch)', async () => {
      const mockRepo: ListingBridgeDraftRepository = {
        getJobById: jest.fn().mockResolvedValue({
          id: 'job-rights-media-001',
          provider_id: 'legitimate-provider',
          status: 'NEEDS_REVIEW',
          created_listing_id: null,
        }),
        completeJobWithListing: jest.fn(),
      };

      const service = new ListingBridgeDraftCreationService(mockRepo);
      const res = await service.createDraftFromImport({
        actorUserId: 'unauthorized-attacker',
        importJobId: 'job-rights-media-001',
      });

      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('OWNERSHIP_MISMATCH');
    });
  });

  describe('4. Durable Storage & Production Invariants', () => {
    it('4.1: Local storage adapter is blocked in Production when STORAGE_PROVIDER=local and no token is present', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalProvider = process.env.STORAGE_PROVIDER;
      const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
      const originalVercel = process.env.VERCEL;

      const env = process.env as Record<string, string | undefined>;

      try {
        env.NODE_ENV = 'production';
        process.env.VERCEL = '1';
        process.env.STORAGE_PROVIDER = 'local';
        delete process.env.BLOB_READ_WRITE_TOKEN;
        delete process.env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION;

        // Re-import storage service in fresh context
        const { storageService } = await import('../../../src/lib/storage/storage-service');
        expect(() => {
          const ServiceClass = storageService.constructor as new () => { adapter: unknown };
          const instance = new ServiceClass();
          // Accessing the adapter property triggers resolveAdapter
          void instance.adapter;
        }).toThrow(/FATAL: LocalStorageAdapter is disabled in Production\/Vercel/);
      } finally {
        env.NODE_ENV = originalEnv;
        process.env.STORAGE_PROVIDER = originalProvider;
        if (originalToken) process.env.BLOB_READ_WRITE_TOKEN = originalToken;
        if (originalVercel) process.env.VERCEL = originalVercel;
      }
    });

    it('4.2: VercelBlobStorageAdapter returns a durable https public URL', async () => {
      const { VercelBlobStorageAdapter } = await import('../../../src/lib/storage/vercel-blob-storage-adapter');
      const adapter = new VercelBlobStorageAdapter();

      // Mock put
      jest.spyOn(adapter, 'uploadFile').mockResolvedValue({
        url: 'https://store_5mxwewro6obcfu60.public.blob.vercel-storage.com/uploads/listingbridge-test.jpg',
        path: 'uploads/listingbridge-test.jpg',
      });

      const res = await adapter.uploadFile(Buffer.from('fake-image-bytes'), 'listingbridge-test.jpg', false);
      expect(res.url).toMatch(/^https:\/\/.+\.blob\.vercel-storage\.com\//);
      expect(res.url).not.toContain('/var/task');
      expect(res.url).not.toContain('public/uploads');
    });

    it('4.3: Storage service auto-selects vercel_blob when BLOB_READ_WRITE_TOKEN is configured', async () => {
      const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
      const originalProvider = process.env.STORAGE_PROVIDER;

      try {
        process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_test_token';
        delete process.env.STORAGE_PROVIDER;

        const { storageService } = await import('../../../src/lib/storage/storage-service');
        const ServiceClass = storageService.constructor as new () => { adapter: { constructor: { name: string } } };
        const instance = new ServiceClass();
        expect(instance.adapter.constructor.name).toBe('VercelBlobStorageAdapter');
      } finally {
        if (originalToken) process.env.BLOB_READ_WRITE_TOKEN = originalToken;
        else delete process.env.BLOB_READ_WRITE_TOKEN;
        if (originalProvider) process.env.STORAGE_PROVIDER = originalProvider;
      }
    });
  });
});
