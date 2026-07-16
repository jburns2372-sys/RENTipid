import {
  SecurityEventSource,
  SecurityDomain,
  SecurityEventClassification,
  SecuritySeverity,
  SecurityLifecycle,
  SecurityProcessingStatus,
  SecurityEnvironment
} from "@prisma/client";

export {
  SecurityEventSource,
  SecurityDomain,
  SecurityEventClassification,
  SecuritySeverity,
  SecurityLifecycle,
  SecurityProcessingStatus,
  SecurityEnvironment
};

export interface NormalizedSecurityEvent {
  event_code: string;
  source_type: SecurityEventSource;
  source_record_id: string;
  adapter_version: string;
  security_domain: SecurityDomain;
  event_category: string;
  event_classification: SecurityEventClassification;
  severity: SecuritySeverity;
  confidence_score: number | null;
  environment: SecurityEnvironment;
  lifecycle_type: SecurityLifecycle;

  actor_user_id?: string | null;
  target_user_id?: string | null;
  target_resource_id?: string | null;
  target_module?: string | null;
  action_attempted?: string | null;
  action_result?: string | null;

  source_summary: unknown;
  classification_reason: string | null;
  correlation_key: string | null;
  action_discriminator?: string | null;
  idempotency_key: string; // Deprecated input, now ignored during ingestion
  processing_status: SecurityProcessingStatus;

  occurred_at: Date;
  source_received_at: Date;
  ingested_at?: Date;
  updated_at?: Date;
}

export interface SecurityEventSourceAdapter<TSource> {
  sourceType: SecurityEventSource;
  supports(record: unknown): record is TSource;
  normalize(record: TSource, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent;
}

export interface SecurityEventIngestionResult {
  success: boolean;
  eventId?: string;
  isDuplicate?: boolean;
  duplicate?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface SecurityEventQueryFilter {
  source_type?: SecurityEventSource;
  security_domain?: SecurityDomain;
  severity?: SecuritySeverity;
  processing_status?: SecurityProcessingStatus;
  lifecycle_type?: SecurityLifecycle;
  occurred_at_start?: Date;
  occurred_at_end?: Date;
  limit?: number;
  cursor?: string;
}
