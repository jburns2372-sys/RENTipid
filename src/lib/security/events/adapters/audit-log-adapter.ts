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
import { AuditLog } from "@prisma/client";
import { redactSensitiveData } from "../../serializers";
import * as crypto from 'crypto';

export class AuditLogAdapter implements SecurityEventSourceAdapter<AuditLog> {
  sourceType = SecurityEventSource.AUDIT_LOG;
  private readonly version = "1.0";

  supports(record: unknown): record is AuditLog {
    return (
      typeof record === "object" && 
      record !== null && 
      "id" in record && 
      "action" in record && 
      "module" in record
    );
  }

  normalize(record: AuditLog, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    let domain: SecurityDomain = SecurityDomain.ADMINISTRATIVE_SECURITY;
    let classification: SecurityEventClassification = SecurityEventClassification.OBSERVATION;
    let severity: SecuritySeverity = SecuritySeverity.INFO;
    let classification_reason = "Standard administrative action observation.";

    const actionUpper = record.action.toUpperCase();

    if (actionUpper.includes("DENIED")) {
      classification = SecurityEventClassification.POLICY_VIOLATION;
      severity = SecuritySeverity.LOW;
      classification_reason = "Access was explicitly denied to a protected resource.";
      
      if (actionUpper.includes("SOC_ACCESS")) {
         domain = SecurityDomain.IDENTITY_AND_ACCESS;
         severity = SecuritySeverity.MEDIUM;
      }
    } else if (actionUpper.includes("FAILED")) {
      classification = SecurityEventClassification.CONTROL_FAILURE;
      severity = SecuritySeverity.LOW;
      classification_reason = "Administrative action failed to complete.";
    }

    const safeSummary = redactSensitiveData({
      details: record.details,
      ip_address: record.ip_address,
      target_id: record.target_id
    });

    const idempotencyPayload = `${this.sourceType}:${record.id}:${record.created_at.toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `AUDIT_${actionUpper.replace(/[^A-Z0-9]/g, "_")}`,
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
      
      actor_user_id: record.actor_user_id,
      target_user_id: null,
      target_module: record.module,
      action_attempted: record.action,
      action_result: actionUpper.includes("DENIED") ? "BLOCKED" : (actionUpper.includes("FAILED") ? "FAILED" : "COMPLETED"),
      
      source_summary: safeSummary,
      classification_reason,
      correlation_key: record.actor_user_id ? `user:${record.actor_user_id}` : null,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.created_at,
      source_received_at: record.created_at
    };
  }
}
