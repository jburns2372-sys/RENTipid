import { 
  NormalizedSecurityEvent, 
  SecurityEventSourceAdapter,
  SecurityEventSource,
  SecurityDomain,
  SecurityEventClassification,
  SecuritySeverity,
  SecurityLifecycle,
  SecurityEnvironment,
  SecurityProcessingStatus
} from "../taxonomy";
import { SystemErrorLog } from "@prisma/client";
import * as crypto from 'crypto';

export class SystemErrorLogAdapter implements SecurityEventSourceAdapter<SystemErrorLog> {
  sourceType = SecurityEventSource.SYSTEM_ERROR_LOG;
  private readonly version = "1.0";

  supports(record: unknown): record is SystemErrorLog {
    return (
      typeof record === "object" && 
      record !== null && 
      "id" in record && 
      "error_message" in record && 
      "severity" in record
    );
  }

  normalize(record: SystemErrorLog, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    const domain = SecurityDomain.APPLICATION_RELIABILITY;
    const classification = SecurityEventClassification.SYSTEM_HEALTH;
    let severity: SecuritySeverity = SecuritySeverity.LOW;
    const classification_reason = "Application reliability observation.";

    const errorSevUpper = record.severity?.toUpperCase() || "INFO";
    if (errorSevUpper === "CRITICAL") severity = SecuritySeverity.CRITICAL;
    else if (errorSevUpper === "ERROR") severity = SecuritySeverity.HIGH;
    else if (errorSevUpper === "WARNING") severity = SecuritySeverity.MEDIUM;

    const idempotencyPayload = `${this.sourceType}:${record.id}:${record.created_at.toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `SYS_ERR_${errorSevUpper}`,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: domain,
      event_category: record.module,
      event_classification: classification,
      severity,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: record.user_id,
      target_user_id: null,
      target_module: record.module,
      action_attempted: record.route || null,
      action_result: null,
      
      // Deliberately omit stack_trace_private
      source_summary: { error_message: record.error_message, route: record.route },
      classification_reason,
      correlation_key: record.user_id ? `user:${record.user_id}` : null,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.created_at,
      source_received_at: record.created_at
    };
  }
}
