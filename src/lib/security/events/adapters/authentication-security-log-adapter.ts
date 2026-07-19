import { SecurityEventSourceAdapter, NormalizedSecurityEvent, SecurityEventSource, SecurityDomain, SecurityEventClassification, SecuritySeverity, SecurityEnvironment, SecurityLifecycle } from "../taxonomy";
import { AuthenticationSecurityLog } from "@prisma/client";

export class AuthenticationSecurityLogAdapter implements SecurityEventSourceAdapter<AuthenticationSecurityLog> {
  readonly sourceType = SecurityEventSource.AUTHENTICATION_SECURITY_LOG;
  readonly version = "1.0";

  supports(record: unknown): record is AuthenticationSecurityLog {
    return (
      typeof record === "object" &&
      record !== null &&
      "event_code" in record &&
      "hmac_key_version" in record &&
      "retention_class" in record
    );
  }

  normalize(
    sourceRecord: AuthenticationSecurityLog,
    lifecycle: SecurityLifecycle = SecurityLifecycle.LIVE,
    environment: SecurityEnvironment = SecurityEnvironment.PRODUCTION
  ): NormalizedSecurityEvent {
    const classification = SecurityEventClassification.OBSERVATION;
    let severity: SecuritySeverity = SecuritySeverity.LOW;

    if (sourceRecord.event_code === "AUTH_LOGIN_FAILED") {
      severity = SecuritySeverity.LOW;
    } else if (sourceRecord.event_code === "AUTH_ACCOUNT_STATUS_DENIED") {
      severity = SecuritySeverity.MEDIUM;
    } else if (sourceRecord.event_code === "AUTH_LOGIN_SUCCEEDED") {
      severity = SecuritySeverity.INFO;
    }

    return {
      event_code: sourceRecord.event_code,
      source_record_id: sourceRecord.id,
      source_type: this.sourceType,
      adapter_version: this.version,
      security_domain: SecurityDomain.IDENTITY_AND_ACCESS,
      event_category: "Authentication",
      event_classification: classification,
      severity,
      confidence_score: null,
      actor_user_id: sourceRecord.actor_user_id,
      classification_reason: null,
      correlation_key: sourceRecord.subject_reference_hash,
      idempotency_key: `AUTH_${sourceRecord.id}`,
      processing_status: "PENDING",
      occurred_at: sourceRecord.occurred_at,
      source_received_at: new Date(),
      environment: environment,
      lifecycle_type: lifecycle,
      source_summary: sourceRecord.sanitized_metadata ? JSON.parse(sourceRecord.sanitized_metadata) : null,
    };
  }
}
