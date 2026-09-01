import { ListingImportRepository } from '../../../src/lib/listingbridge/repository/listing-import-repository';
import { PrismaClient } from '@prisma/client';

describe('ListingImportRepository (P2 Data Access Layer)', () => {
  let mockPrisma: {
    listingImportJob: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    listingImportSource: {
      create: jest.Mock;
    };
    listingImportField: {
      upsert: jest.Mock;
    };
  };
  let repo: ListingImportRepository;

  beforeEach(() => {
    mockPrisma = {
      listingImportJob: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      listingImportSource: {
        create: jest.fn(),
      },
      listingImportField: {
        upsert: jest.fn(),
      },
    };

    repo = new ListingImportRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('createOrGetJob', () => {
    it('returns existing job when matching idempotency key is found', async () => {
      const existingJob = {
        id: 'job_existing_123',
        idempotency_key: 'idemp_key_123',
        status: 'CREATED',
        sources: [],
        fields: [],
        assets: [],
        resolutions: [],
      };

      mockPrisma.listingImportJob.findUnique.mockResolvedValue(existingJob);

      const result = await repo.createOrGetJob({
        providerId: 'usr_provider_1',
        sourceConnector: 'URL_SCRAPER',
        sourceTier: 'TIER_4_URL',
        sourceReferenceHash: 'hash_1234567890abcdef',
        authorizationMethod: 'NONE',
        idempotencyKey: 'idemp_key_123',
      });

      expect(result.isNew).toBe(false);
      expect(result.job.id).toBe('job_existing_123');
      expect(mockPrisma.listingImportJob.create).not.toHaveBeenCalled();
    });

    it('creates a new job with initial audit event when idempotency key is new', async () => {
      mockPrisma.listingImportJob.findUnique.mockResolvedValue(null);
      mockPrisma.listingImportJob.create.mockResolvedValue({
        id: 'job_new_456',
        idempotency_key: 'idemp_key_new',
        status: 'CREATED',
        sources: [],
        fields: [],
        assets: [],
        resolutions: [],
      });

      const result = await repo.createOrGetJob({
        providerId: 'usr_provider_1',
        sourceConnector: 'URL_SCRAPER',
        sourceTier: 'TIER_4_URL',
        sourceReferenceHash: 'hash_1234567890abcdef',
        authorizationMethod: 'NONE',
        idempotencyKey: 'idemp_key_new',
      });

      expect(result.isNew).toBe(true);
      expect(result.job.id).toBe('job_new_456');
      expect(mockPrisma.listingImportJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            provider_id: 'usr_provider_1',
            status: 'CREATED',
            auditEvents: expect.objectContaining({
              create: expect.objectContaining({
                event_type: 'JOB_CREATED',
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('attachSource', () => {
    it('creates a durable ListingImportSource record without secrets', async () => {
      mockPrisma.listingImportSource.create.mockResolvedValue({
        id: 'src_123',
        job_id: 'job_123',
        source_connector: 'URL_SCRAPER',
      });

      const result = await repo.attachSource({
        jobId: 'job_123',
        sourceConnector: 'URL_SCRAPER',
        sourceTier: 'TIER_4_URL',
        sourceReferenceHash: 'src_hash_1234567890',
        sourceReferenceLabel: 'https://example.com/property/1',
        authorizationMethod: 'NONE',
        rawPayloadHash: 'payload_hash_1234567890',
        retrievalMetadata: { statusCode: 200, latencyMs: 150 },
      });

      expect(result.id).toBe('src_123');
      expect(mockPrisma.listingImportSource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          job_id: 'job_123',
          source_connector: 'URL_SCRAPER',
          source_reference_hash: 'src_hash_1234567890',
        }),
      });
    });
  });

  describe('upsertField', () => {
    it('upserts a field-level provenance record', async () => {
      mockPrisma.listingImportField.upsert.mockResolvedValue({
        id: 'fld_123',
        job_id: 'job_123',
        field_name: 'pricing.dailyRate',
        confidence_state: 'HIGH_CONFIDENCE',
      });

      const result = await repo.upsertField({
        jobId: 'job_123',
        fieldName: 'pricing.dailyRate',
        sourceFieldName: 'price',
        sourceValueHash: 'val_hash_123456',
        normalizedValue: 2500,
        confidenceState: 'HIGH_CONFIDENCE',
        confidenceScore: 0.95,
        authority: 'SOURCE',
        isRequired: true,
      });

      expect(result.id).toBe('fld_123');
      expect(mockPrisma.listingImportField.upsert).toHaveBeenCalledWith({
        where: {
          job_id_field_name: {
            job_id: 'job_123',
            field_name: 'pricing.dailyRate',
          },
        },
        create: expect.objectContaining({
          field_name: 'pricing.dailyRate',
          confidence_state: 'HIGH_CONFIDENCE',
        }),
        update: expect.objectContaining({
          confidence_state: 'HIGH_CONFIDENCE',
        }),
      });
    });
  });

  describe('transitionStatus', () => {
    it('executes valid state transition and creates audit event', async () => {
      mockPrisma.listingImportJob.findUnique.mockResolvedValue({
        id: 'job_123',
        status: 'FETCHING',
        retry_count: 0,
        max_retries: 3,
      });

      mockPrisma.listingImportJob.update.mockResolvedValue({
        id: 'job_123',
        status: 'EXTRACTING',
      });

      const result = await repo.transitionStatus({
        jobId: 'job_123',
        nextStatus: 'EXTRACTING',
        actorUserId: 'usr_provider_1',
        reason: 'Raw content retrieved successfully',
      });

      expect(result.status).toBe('EXTRACTING');
      expect(mockPrisma.listingImportJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job_123' },
          data: expect.objectContaining({
            status: 'EXTRACTING',
            auditEvents: expect.objectContaining({
              create: expect.objectContaining({
                event_type: 'STATUS_CHANGED',
                actor_user_id: 'usr_provider_1',
              }),
            }),
          }),
        }),
      );
    });

    it('rejects illegal state transition with descriptive error', async () => {
      mockPrisma.listingImportJob.findUnique.mockResolvedValue({
        id: 'job_123',
        status: 'CREATED',
        retry_count: 0,
        max_retries: 3,
      });

      await expect(
        repo.transitionStatus({
          jobId: 'job_123',
          nextStatus: 'COMPLETED',
        }),
      ).rejects.toThrow(/Invalid ListingImportJob state transition/);
    });

    it('escalates FAILED_RETRYABLE to FAILED_FINAL when max_retries is reached', async () => {
      mockPrisma.listingImportJob.findUnique.mockResolvedValue({
        id: 'job_123',
        status: 'FETCHING',
        retry_count: 2,
        max_retries: 3,
      });

      mockPrisma.listingImportJob.update.mockResolvedValue({
        id: 'job_123',
        status: 'FAILED_FINAL',
        retry_count: 3,
      });

      await repo.transitionStatus({
        jobId: 'job_123',
        nextStatus: 'FAILED_RETRYABLE',
        errorCode: 'HTTP_503',
        errorMessage: 'Source host unavailable',
      });

      expect(mockPrisma.listingImportJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED_FINAL', // Escalated because 2 + 1 >= 3
            retry_count: 3,
          }),
        }),
      );
    });
  });
});
