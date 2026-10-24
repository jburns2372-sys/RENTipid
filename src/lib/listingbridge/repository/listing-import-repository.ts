import { PrismaClient, Prisma } from '@prisma/client';
import {
  ListingImportJobStatus,
  assertValidJobStatusTransition,
} from '../types/job-state';
import {
  CanonicalImportContract,
  ListingBridgeConfidenceState,
  ListingBridgeSourceAuthority,
} from '../types/canonical-contract';

export interface CreateImportJobInput {
  readonly providerId: string;
  readonly sourceConnector: string;
  readonly sourceTier: string;
  readonly sourceReferenceHash: string;
  readonly sourceReferenceLabel?: string;
  readonly authorizationMethod: string;
  readonly idempotencyKey: string;
  readonly correlationId?: string;
}

export interface AttachSourceInput {
  readonly jobId: string;
  readonly sourceConnector: string;
  readonly sourceTier: string;
  readonly sourceMode?: string;
  readonly connectorVersion?: string;
  readonly authorizationMethod: string;
  readonly sourceReferenceHash: string;
  readonly sourceReferenceLabel?: string;
  readonly sourceIdentifier?: string;
  readonly rawPayloadHash?: string;
  readonly retrievalMetadata?: Record<string, unknown>;
  readonly retrievedAt?: Date;
}

export interface UpsertFieldProvenanceInput {
  readonly jobId: string;
  readonly sourceId?: string;
  readonly fieldName: string;
  readonly sourceFieldName?: string;
  readonly sourceValueHash?: string;
  readonly normalizedValue?: unknown;
  readonly confidenceState?: ListingBridgeConfidenceState;
  readonly confidenceScore?: number;
  readonly authority?: ListingBridgeSourceAuthority;
  readonly isRequired?: boolean;
  readonly isBlocking?: boolean;
  readonly providerModified?: boolean;
  readonly validationState?: string;
  readonly validationMessage?: string;
  readonly prohibitedReason?: string;
}

export interface TransitionJobStatusInput {
  readonly jobId: string;
  readonly nextStatus: ListingImportJobStatus;
  readonly actorUserId?: string;
  readonly reason?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly metadata?: Record<string, unknown>;
  readonly ipAddress?: string;
}

export class ListingImportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates a new import job or returns the existing job matching the idempotency key.
   */
  async createOrGetJob(input: CreateImportJobInput) {
    const existing = await this.prisma.listingImportJob.findUnique({
      where: { idempotency_key: input.idempotencyKey },
      include: {
        sources: true,
        fields: true,
        assets: true,
        resolutions: true,
      },
    });

    if (existing) {
      return { job: existing, isNew: false };
    }

    const created = await this.prisma.listingImportJob.create({
      data: {
        provider_id: input.providerId,
        source_connector: input.sourceConnector,
        source_tier: input.sourceTier,
        source_reference_hash: input.sourceReferenceHash,
        source_reference_label: input.sourceReferenceLabel,
        authorization_method: input.authorizationMethod,
        idempotency_key: input.idempotencyKey,
        correlation_id: input.correlationId,
        status: 'CREATED',
        auditEvents: {
          create: {
            actor_user_id: input.providerId,
            event_type: 'JOB_CREATED',
            event_payload: {
              source_connector: input.sourceConnector,
              source_tier: input.sourceTier,
              idempotency_key: input.idempotencyKey,
            },
          },
        },
      },
      include: {
        sources: true,
        fields: true,
        assets: true,
        resolutions: true,
      },
    });

    return { job: created, isNew: true };
  }

  /**
   * Fetches an import job by ID with all related provenance entities.
   */
  async getJobById(jobId: string) {
    return this.prisma.listingImportJob.findUnique({
      where: { id: jobId },
      include: {
        sources: true,
        fields: true,
        assets: true,
        resolutions: true,
        auditEvents: {
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  /**
   * Attaches a durable source provenance record to an import job.
   */
  async attachSource(input: AttachSourceInput) {
    return this.prisma.listingImportSource.create({
      data: {
        job_id: input.jobId,
        source_connector: input.sourceConnector,
        source_tier: input.sourceTier,
        source_mode: input.sourceMode,
        connector_version: input.connectorVersion,
        authorization_method: input.authorizationMethod,
        source_reference_hash: input.sourceReferenceHash,
        source_reference_label: input.sourceReferenceLabel,
        source_identifier: input.sourceIdentifier,
        raw_payload_hash: input.rawPayloadHash,
        retrieval_metadata: (input.retrievalMetadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        retrieved_at: input.retrievedAt ?? new Date(),
      },
    });
  }

  /**
   * Upserts a durable field-level provenance record for provider review and normalization.
   */
  async upsertField(input: UpsertFieldProvenanceInput) {
    return this.prisma.listingImportField.upsert({
      where: {
        job_id_field_name: {
          job_id: input.jobId,
          field_name: input.fieldName,
        },
      },
      create: {
        job_id: input.jobId,
        source_id: input.sourceId,
        field_name: input.fieldName,
        source_field_name: input.sourceFieldName,
        source_value_hash: input.sourceValueHash,
        normalized_value: (input.normalizedValue as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        confidence_state: input.confidenceState ?? 'REVIEW_RECOMMENDED',
        confidence_score: input.confidenceScore,
        authority: input.authority ?? 'SOURCE',
        is_required: input.isRequired ?? false,
        is_blocking: input.isBlocking ?? false,
        provider_modified: input.providerModified ?? false,
        validation_state: input.validationState ?? 'PENDING',
        validation_message: input.validationMessage,
        prohibited_reason: input.prohibitedReason,
      },
      update: {
        source_id: input.sourceId,
        source_field_name: input.sourceFieldName,
        source_value_hash: input.sourceValueHash,
        normalized_value: (input.normalizedValue as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        confidence_state: input.confidenceState ?? 'REVIEW_RECOMMENDED',
        confidence_score: input.confidenceScore,
        authority: input.authority ?? 'SOURCE',
        is_required: input.isRequired ?? false,
        is_blocking: input.isBlocking ?? false,
        provider_modified: input.providerModified ?? false,
        validation_state: input.validationState ?? 'PENDING',
        validation_message: input.validationMessage,
        prohibited_reason: input.prohibitedReason,
      },
    });
  }

  /**
   * Performs a deterministic state transition on an import job, enforcing transition safety rules.
   */
  async transitionStatus(input: TransitionJobStatusInput) {
    const job = await this.prisma.listingImportJob.findUnique({
      where: { id: input.jobId },
      select: { id: true, status: true, retry_count: true, max_retries: true },
    });

    if (!job) {
      throw new Error(`ListingImportJob '${input.jobId}' not found`);
    }

    assertValidJobStatusTransition(job.status as ListingImportJobStatus, input.nextStatus);

    const isRetry = input.nextStatus === 'FAILED_RETRYABLE';
    const newRetryCount = isRetry ? job.retry_count + 1 : job.retry_count;
    const finalNextStatus: ListingImportJobStatus =
      isRetry && newRetryCount >= job.max_retries ? 'FAILED_FINAL' : input.nextStatus;

    return this.prisma.listingImportJob.update({
      where: { id: input.jobId },
      data: {
        status: finalNextStatus,
        retry_count: newRetryCount,
        last_error_code: input.errorCode,
        last_error_message: input.errorMessage,
        completed_at: finalNextStatus === 'COMPLETED' ? new Date() : undefined,
        auditEvents: {
          create: {
            actor_user_id: input.actorUserId,
            event_type: 'STATUS_CHANGED',
            event_payload: {
              previous_status: job.status,
              next_status: finalNextStatus,
              reason: input.reason,
              error_code: input.errorCode,
              error_message: input.errorMessage,
              metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
            } as Prisma.InputJsonObject,
            ip_address: input.ipAddress,
          },
        },
      },
    });
  }

  /**
   * Persists canonical contract payload and field confidence into the import job record.
   */
  async saveCanonicalPayload(jobId: string, contract: CanonicalImportContract) {
    return this.prisma.listingImportJob.update({
      where: { id: jobId },
      data: {
        canonical_payload: contract as unknown as Prisma.InputJsonValue,
        raw_payload_hash: contract.provenance.rawPayloadHash,
        field_confidence: contract.fieldConfidence as unknown as Prisma.InputJsonValue,
        unresolved_fields: contract.unresolvedFields as unknown as Prisma.InputJsonValue,
        ai_assisted: contract.provenance.aiAssisted,
        normalized_at: new Date(),
      },
    });
  }
}
