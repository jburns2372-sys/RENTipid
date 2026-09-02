import { ListingBridgeDraftReadinessEngine } from '../review/draft-readiness-engine';
import { ListingBridgeReviewSnapshotEngine } from '../review/review-snapshot-engine';
import { ListingBridgeDraftPayloadMapper } from './draft-payload-mapper';
import type {
  ListingBridgeDraftCreationInput,
  ListingBridgeDraftCreationResult,
  ListingAuthorityAdapter,
  NativeListingDraftPayload,
} from './types';
import type { ListingBridgeReviewSnapshot } from '../review/types';
import type { CanonicalImportContract } from '../types/canonical-contract';
import type { ListingImportJobStatus } from '../types/job-state';

export interface ListingBridgeDraftRepository {
  getJobById(jobId: string): Promise<{
    id: string;
    provider_id: string;
    status: string;
    created_listing_id: string | null;
    canonical_payload?: unknown;
    fields?: Array<{
      fieldName: string;
      sourceFieldName?: string | null;
      normalizedValue: unknown;
      confidenceState: string;
      confidenceScore?: number | null;
      authority: string;
      isRequired: boolean;
      isBlocking: boolean;
      providerModified: boolean;
      validationState: string;
      validationMessage?: string | null;
      prohibitedReason?: string | null;
    }>;
    assets?: Array<{
      id: string;
      status: string;
      is_cover: boolean;
      storage_path?: string | null;
    }>;
    resolutions?: Array<{
      field_name: string;
      resolved_value: unknown;
      resolved_at: Date;
    }>;
  } | null>;
  markJobCreatingDraft?(jobId: string): Promise<unknown>;
  completeJobWithListing(jobId: string, listingId: string, actorUserId: string): Promise<unknown>;
}

export class DefaultListingBridgeDraftRepository implements ListingBridgeDraftRepository {
  async getJobById(jobId: string) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const job = await prisma.listingImportJob.findUnique({
        where: { id: jobId },
        include: {
          fields: true,
          assets: true,
          resolutions: true,
        },
      });
      return job as unknown as Awaited<ReturnType<ListingBridgeDraftRepository['getJobById']>>;
    } catch {
      return null;
    }
  }

  async completeJobWithListing(jobId: string, listingId: string, actorUserId: string) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      return await prisma.listingImportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          created_listing_id: listingId,
          completed_at: new Date(),
          auditEvents: {
            create: {
              actor_user_id: actorUserId,
              event_type: 'DRAFT_COMMITTED',
              event_payload: {
                created_listing_id: listingId,
              },
            },
          },
        },
      });
    } catch {
      return null;
    }
  }
}

export class DefaultListingAuthorityAdapter implements ListingAuthorityAdapter {
  async createDraft(
    providerId: string,
    data: NativeListingDraftPayload,
  ): Promise<{ id: string; status: string; [key: string]: unknown }> {
    // Dynamic import to maintain safe client/server and dependency boundaries
    const { ListingService } = await import('../../../../apps/api/src/services/listingService');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    let validCategoryId = data.category_id;
    try {
      const cat = await prisma.category.findFirst({
        where: {
          OR: [
            ...(validCategoryId ? [{ id: validCategoryId }, { slug: validCategoryId }, { name: { equals: validCategoryId, mode: 'insensitive' as const } }] : []),
            { slug: 'condominiums' },
            { is_active: true },
          ],
        },
      });
      if (cat) {
        validCategoryId = cat.id;
      }
    } catch {
      // Fallback in environments without live DB
    }

    return ListingService.createDraft(providerId, {
      ...data,
      category_id: validCategoryId,
    });
  }
}

export class ListingBridgeDraftCreationService {
  private readonly readinessEngine = new ListingBridgeDraftReadinessEngine();
  private readonly snapshotEngine = new ListingBridgeReviewSnapshotEngine();
  private readonly payloadMapper = new ListingBridgeDraftPayloadMapper();
  private readonly repository?: ListingBridgeDraftRepository;
  private readonly listingAuthority: ListingAuthorityAdapter;

  constructor(
    repository?: ListingBridgeDraftRepository,
    listingAuthority?: ListingAuthorityAdapter,
  ) {
    this.repository = repository || new DefaultListingBridgeDraftRepository();
    this.listingAuthority = listingAuthority || new DefaultListingAuthorityAdapter();
  }

  /**
   * Executes authoritative, idempotent draft creation from a reviewed ListingBridge job.
   */
  async createDraftFromImport(
    input: ListingBridgeDraftCreationInput,
    options?: {
      overrideSnapshot?: ListingBridgeReviewSnapshot;
      overrideContract?: CanonicalImportContract;
    },
  ): Promise<ListingBridgeDraftCreationResult> {
    const { actorUserId, importJobId } = input;

    // 1. Fetch durable job state if repository available
    const job = this.repository ? await this.repository.getJobById(importJobId) : null;

    // 2. Ownership verification
    if (job && job.provider_id !== actorUserId) {
      return Object.freeze({
        success: false,
        importJobId,
        errorCode: 'OWNERSHIP_MISMATCH',
        errorMessage: 'Actor does not have authority over this import job.',
      });
    }

    // 3. Exactly-once idempotency check: if draft already created, return existing result
    if (job && job.created_listing_id) {
      return Object.freeze({
        success: true,
        importJobId,
        listingId: job.created_listing_id,
        isReusedIdempotently: true,
        status: 'Draft',
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Build or recompute review snapshot from durable state
    let snapshot: ListingBridgeReviewSnapshot;
    if (options?.overrideSnapshot) {
      snapshot = options.overrideSnapshot;
    } else if (job && job.canonical_payload) {
      const contract = job.canonical_payload as CanonicalImportContract;
      const rightsConfirmed = (job.resolutions || []).some(
        (r) => r.field_name === 'listingbridge.rightsConfirmation.v1',
      );
      snapshot = this.snapshotEngine.buildSnapshot({
        importJobId,
        providerId: job.provider_id,
        jobStatus: (job.status as unknown as ListingImportJobStatus) || 'NEEDS_REVIEW',
        contract,
        rights: {
          rightsConfirmed,
          isBlocking: !rightsConfirmed,
        },
      });
    } else if (options?.overrideContract) {
      snapshot = this.snapshotEngine.buildSnapshot({
        importJobId,
        providerId: actorUserId,
        jobStatus: 'NEEDS_REVIEW',
        contract: options.overrideContract,
      });
    } else {
      return Object.freeze({
        success: false,
        importJobId,
        errorCode: 'JOB_NOT_FOUND',
        errorMessage: `Import job '${importJobId}' could not be located or has no canonical data.`,
      });
    }

    // 5. Authoritative recalculation of draft readiness
    const readiness = this.readinessEngine.evaluate(snapshot);
    if (!readiness.isReadyForDraft) {
      return Object.freeze({
        success: false,
        importJobId,
        errorCode: 'DRAFT_READINESS_FAILED',
        errorMessage: 'Import job is not eligible for draft creation due to unresolved blockers.',
        blockingReasons: readiness.blockingReasons,
      });
    }

    // 6. Map reviewed canonical snapshot to native RENTipid draft payload
    const draftPayload = this.payloadMapper.mapToNativeDraft(snapshot);

    // 7. Transition job to CREATING_DRAFT
    if (this.repository?.markJobCreatingDraft) {
      await this.repository.markJobCreatingDraft(importJobId);
    }

    // 8. Create draft through existing RENTipid listing authority
    try {
      const createdListing = await this.listingAuthority.createDraft(
        actorUserId,
        draftPayload,
      );

      // 9. Persist durable draft linkage and mark job COMPLETED
      if (this.repository) {
        await this.repository.completeJobWithListing(
          importJobId,
          createdListing.id,
          actorUserId,
        );
      }

      return Object.freeze({
        success: true,
        importJobId,
        listingId: createdListing.id,
        isReusedIdempotently: false,
        status: 'Draft',
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return Object.freeze({
        success: false,
        importJobId,
        errorCode: 'LISTING_AUTHORITY_CREATION_FAILED',
        errorMessage: `Listing creation failed in native authority: ${msg}`,
      });
    }
  }
}
