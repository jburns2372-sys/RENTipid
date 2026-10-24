export type ListingBridgeOperationalEventType =
  | 'IMPORT_JOB_CREATED'
  | 'IMPORT_JOB_RESUMED'
  | 'IMPORT_JOB_CANCELLED'
  | 'CONNECTOR_AUTHORIZATION_FAILED'
  | 'SOURCE_RETRIEVAL_BLOCKED'
  | 'SOURCE_RETRIEVAL_FAILED'
  | 'SOURCE_RETRIEVAL_RATE_LIMITED'
  | 'NORMALIZATION_FAILED'
  | 'PROHIBITED_DATA_FILTERED'
  | 'MEDIA_REJECTED'
  | 'MEDIA_PROCESSING_FAILED'
  | 'LOCATION_CONFLICT'
  | 'DUPLICATE_DETECTED'
  | 'PROVIDER_CORRECTION_FAILED'
  | 'RIGHTS_CONFIRMATION_MISSING'
  | 'AI_ASSISTANCE_FAILED'
  | 'AI_FALLBACK_USED'
  | 'DRAFT_CREATION_BLOCKED'
  | 'DRAFT_CREATION_FAILED'
  | 'DRAFT_CREATED'
  | 'WORKER_RETRY'
  | 'JOB_FAILED_RETRYABLE'
  | 'JOB_FAILED_FINAL';

export interface ListingBridgeOperationalEvent {
  readonly eventType: ListingBridgeOperationalEventType;
  readonly timestamp: string;
  readonly importJobId?: string;
  readonly connectorId?: string;
  readonly actorUserId?: string;
  readonly correlationId?: string;
  readonly resultClass: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'WARNING' | 'RETRY';
  readonly stage?: string;
  readonly failureCategory?: string;
  readonly durationMs?: number;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}
