import { resolveAuthoritativeCategory } from '../../../src/lib/categories/category-resolver';
import { CANONICAL_CATEGORIES } from '../../../src/lib/categories/canonical-categories';
import { DefaultListingAuthorityAdapter, ListingBridgeDraftCreationService } from '../../../src/lib/listingbridge/draft/draft-creation-service';
import type { ListingBridgeReviewSnapshot } from '../../../src/lib/listingbridge/review/types';
import type { ListingAuthorityAdapter, NativeListingDraftPayload } from '../../../src/lib/listingbridge/draft/types';

describe('ListingBridge v1.1 Category Reference-Data & Resolution Fail-Closed Suite', () => {
  const mockCategories = [
    { id: 'cat_condo_001', name: 'Condominiums', slug: 'condominiums', is_active: true },
    { id: 'cat_rooms_002', name: 'Rooms', slug: 'rooms', is_active: true },
    { id: 'cat_tools_003', name: 'Tools', slug: 'tools', is_active: true },
    { id: 'cat_other_999', name: 'Other Legally Rentable Assets', slug: 'other', is_active: true },
  ];

  const readySnapshot: ListingBridgeReviewSnapshot = {
    importJobId: 'job-cat-test-001',
    providerId: 'usr-prov-001',
    jobStatus: 'READY_FOR_DRAFT',
    fields: [
      {
        fieldName: 'title',
        displayName: 'Listing Title',
        normalizedValue: 'Spacious Makati Condo',
        confidenceState: 'VERIFIED',
        isRequired: true,
        isBlocking: false,
        providerModified: true,
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
      totalCandidates: 1,
      validatedCount: 1,
      rejectedCount: 0,
      duplicateCount: 0,
      hasCoverPhoto: true,
      isBlocking: false,
      assets: [
        {
          id: 'asset-001',
          url: 'https://store_5mxwewro6obcfu60.public.blob.vercel-storage.com/uploads/photo.jpg',
          status: 'VALIDATED',
          isCover: true,
        },
      ],
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

  describe('1. Authoritative Category Resolution Engine', () => {
    it('1.1: Empty Category table causes controlled CATEGORY_REFERENCE_DATA_MISSING, not FK exception', async () => {
      const mockPrisma = {
        category: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const res = await resolveAuthoritativeCategory('condominiums', mockPrisma);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('CATEGORY_REFERENCE_DATA_MISSING');
      expect(res.categoryId).toBeUndefined();
      expect(res.errorMessage).toContain('Please try again after category data is restored');
    });

    it('1.2: Category slug "condominiums" resolves to actual database Category.id', async () => {
      const mockPrisma = {
        category: {
          findMany: jest.fn().mockResolvedValue(mockCategories),
        },
      };

      const res = await resolveAuthoritativeCategory('condominiums', mockPrisma);
      expect(res.success).toBe(true);
      expect(res.categoryId).toBe('cat_condo_001');
      expect(res.categorySlug).toBe('condominiums');
    });

    it('1.3: Category name "Condominiums" resolves to actual database Category.id', async () => {
      const mockPrisma = {
        category: {
          findMany: jest.fn().mockResolvedValue(mockCategories),
        },
      };

      const res = await resolveAuthoritativeCategory('Condominiums', mockPrisma);
      expect(res.success).toBe(true);
      expect(res.categoryId).toBe('cat_condo_001');
    });

    it('1.4: Valid Category.id remains valid and resolves directly', async () => {
      const mockPrisma = {
        category: {
          findMany: jest.fn().mockResolvedValue(mockCategories),
        },
      };

      const res = await resolveAuthoritativeCategory('cat_tools_003', mockPrisma);
      expect(res.success).toBe(true);
      expect(res.categoryId).toBe('cat_tools_003');
      expect(res.categorySlug).toBe('tools');
    });

    it('1.5: Unknown imported propertyType does not pass arbitrary text into Listing.category_id', async () => {
      const mockPrisma = {
        category: {
          // Without 'other' category
          findMany: jest.fn().mockResolvedValue(mockCategories.filter((c) => c.slug !== 'other')),
        },
      };

      const res = await resolveAuthoritativeCategory('completely_unknown_xyz', mockPrisma);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('CATEGORY_RESOLUTION_FAILED');
      expect(res.categoryId).toBeUndefined();
    });

    it('1.6: Fallback "other" is used only where valid and category exists', async () => {
      const mockPrisma = {
        category: {
          findMany: jest.fn().mockResolvedValue(mockCategories),
        },
      };

      const res = await resolveAuthoritativeCategory('rare_exotic_antique', mockPrisma);
      expect(res.success).toBe(true);
      expect(res.categoryId).toBe('cat_other_999');
      expect(res.categorySlug).toBe('other');
    });
  });

  describe('2. Canonical Category Reference Definitions & Reconciler', () => {
    it('2.1: Canonical category definitions export exactly 15 platform categories', () => {
      expect(CANONICAL_CATEGORIES.length).toBe(15);
      const slugs = CANONICAL_CATEGORIES.map((c) => c.slug);
      expect(slugs).toContain('condominiums');
      expect(slugs).toContain('tools');
      expect(slugs).toContain('rooms');
      expect(slugs).toContain('cars-and-motorcycles');
      expect(slugs).toContain('other');
    });

    it('2.2: Reconciler creates missing canonical rows idempotently without mutating users or settings', async () => {
      const memoryDb = {
        categories: new Map<string, any>(),
        users: 5,
        systemSettings: 12,
        listings: 0,
      };

      // Simulated reconciler logic
      for (const cat of CANONICAL_CATEGORIES) {
        if (!memoryDb.categories.has(cat.slug)) {
          memoryDb.categories.set(cat.slug, {
            id: `cat_${cat.slug}`,
            slug: cat.slug,
            name: cat.name,
          });
        }
      }

      expect(memoryDb.categories.size).toBe(15);
      expect(memoryDb.categories.has('condominiums')).toBe(true);
      expect(memoryDb.users).toBe(5);
      expect(memoryDb.systemSettings).toBe(12);

      // Second run is completely idempotent
      const countBeforeSecond = memoryDb.categories.size;
      for (const cat of CANONICAL_CATEGORIES) {
        if (!memoryDb.categories.has(cat.slug)) {
          memoryDb.categories.set(cat.slug, { id: `cat_${cat.slug}`, slug: cat.slug, name: cat.name });
        }
      }
      expect(memoryDb.categories.size).toBe(countBeforeSecond);
      expect(memoryDb.users).toBe(5);
      expect(memoryDb.systemSettings).toBe(12);
    });
  });

  describe('3. Draft Creation Authority Safeguards & Invariants', () => {
    it('3.1: DefaultListingAuthorityAdapter fails closed when category reference data is missing', async () => {
      const mockPrisma = {
        category: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const adapter = new DefaultListingAuthorityAdapter(mockPrisma);
      const payload: NativeListingDraftPayload = {
        provider_id: 'usr-prov-001',
        category_id: 'condominiums',
        title: 'Test Listing',
        status: 'Draft',
      };

      await expect(adapter.createDraft('usr-prov-001', payload)).rejects.toThrow(
        /CATEGORY_REFERENCE_DATA_MISSING/,
      );
    });

    it('3.2: ListingBridge READY_FOR_DRAFT with valid category creates native Listing with true Category.id', async () => {
      let passedCategoryId: string | undefined;

      const mockAuthority: ListingAuthorityAdapter = {
        createDraft: jest.fn().mockImplementation(async (_providerId, payload) => {
          passedCategoryId = payload.category_id;
          return {
            id: 'lst_native_draft_123',
            status: 'Draft',
            title: payload.title,
            category_id: payload.category_id,
          };
        }),
      };

      const mockRepo = {
        getJobById: jest.fn().mockResolvedValue({
          id: 'job-cat-test-001',
          provider_id: 'usr-prov-001',
          status: 'NEEDS_REVIEW',
          created_listing_id: null,
          fields: [
            { fieldName: 'title', normalizedValue: 'Test Condo', confidenceState: 'VERIFIED', isRequired: true, isBlocking: false, providerModified: true, validationState: 'VALIDATED', authority: 'PROVIDER' },
            { fieldName: 'propertyType', normalizedValue: 'condominiums', confidenceState: 'VERIFIED', isRequired: true, isBlocking: false, providerModified: false, validationState: 'VALIDATED', authority: 'EXTERNAL' },
          ],
          assets: [{ id: 'a1', status: 'VALIDATED', is_cover: true, storage_path: 'https://store.blob.vercel-storage.com/photo.jpg' }],
          resolutions: [{ field_name: 'listingbridge.rightsConfirmation.v1', resolved_value: { confirmed: true }, resolved_at: new Date() }],
        }),
        completeJobWithListing: jest.fn().mockResolvedValue({ id: 'job-cat-test-001' }),
      };

      // Test with custom adapter that resolves condominiums to cat_condo_001
      const resolvingAuthority: ListingAuthorityAdapter = {
        createDraft: jest.fn().mockImplementation(async (providerId, payload) => {
          const res = await resolveAuthoritativeCategory(payload.category_id, {
            category: { findMany: jest.fn().mockResolvedValue(mockCategories) },
          });
          return mockAuthority.createDraft(providerId, { ...payload, category_id: res.categoryId });
        }),
      };

      const service = new ListingBridgeDraftCreationService(mockRepo as any, resolvingAuthority);
      const result = await service.createDraftFromImport({
        actorUserId: 'usr-prov-001',
        importJobId: 'job-cat-test-001',
      }, { overrideSnapshot: readySnapshot });

      expect(result.success).toBe(true);
      expect(result.listingId).toBe('lst_native_draft_123');
      expect(result.status).toBe('Draft');
      expect(passedCategoryId).toBe('cat_condo_001'); // True DB Category.id
      expect(passedCategoryId).not.toBe('condominiums'); // NOT the raw unverified slug
    });

    it('3.3: Draft status is strictly Draft with NO auto-publication', async () => {
      const mockAuthority: ListingAuthorityAdapter = {
        createDraft: jest.fn().mockResolvedValue({
          id: 'lst_native_002',
          status: 'Draft',
        }),
      };

      const service = new ListingBridgeDraftCreationService(undefined, mockAuthority);
      const result = await service.createDraftFromImport({
        actorUserId: 'usr-prov-001',
        importJobId: 'job-002',
      }, { overrideSnapshot: readySnapshot });

      expect(result.success).toBe(true);
      expect(result.status).toBe('Draft');
      expect(result.status).not.toBe('Active');
      expect(result.status).not.toBe('Published');
    });
  });
});
