import { 
  SecurityEventSourceAdapter, 
  NormalizedSecurityEvent, 
  SecurityEventSource, 
  SecurityDomain, 
  SecurityEventClassification, 
  SecuritySeverity, 
  SecurityEnvironment, 
  SecurityLifecycle 
} from "../taxonomy";
import { ApiSecurityLog } from "@prisma/client";

export class ApiSecurityLogAdapter implements SecurityEventSourceAdapter<ApiSecurityLog> {
  readonly sourceType = SecurityEventSource.API_SECURITY_LOG;
  readonly version = "1.1";

  supports(record: unknown): record is ApiSecurityLog {
    return (
      typeof record === "object" &&
      record !== null &&
      "event_code" in record &&
      "safe_route_family" in record &&
      "http_method" in record
    );
  }

  normalize(
    sourceRecord: ApiSecurityLog,
    lifecycle: SecurityLifecycle = SecurityLifecycle.LIVE,
    environment: SecurityEnvironment = SecurityEnvironment.PRODUCTION
  ): NormalizedSecurityEvent {
    let classification: SecurityEventClassification = SecurityEventClassification.OBSERVATION;
    let severity: SecuritySeverity = SecuritySeverity.LOW;
    let securityDomain: SecurityDomain = SecurityDomain.APPLICATION_RELIABILITY;

    switch (sourceRecord.event_code) {
      case "API_AUTHORIZATION_DENIED":
        classification = SecurityEventClassification.POLICY_VIOLATION;
        severity = SecuritySeverity.MEDIUM;
        securityDomain = SecurityDomain.IDENTITY_AND_ACCESS;
        break;
      case "API_CROSS_TENANT_ACCESS_DENIED":
        classification = SecurityEventClassification.POLICY_VIOLATION;
        severity = SecuritySeverity.HIGH;
        securityDomain = SecurityDomain.IDENTITY_AND_ACCESS;
        break;
      case "API_RATE_LIMIT_EXCEEDED":
        classification = SecurityEventClassification.SUSPICIOUS_ACTIVITY;
        severity = SecuritySeverity.MEDIUM;
        break;
      case "API_RESOURCE_ENUMERATION_SIGNAL":
        classification = SecurityEventClassification.SUSPICIOUS_ACTIVITY;
        severity = SecuritySeverity.HIGH;
        break;
      case "BOT_SCRAPING_SIGNAL":
        classification = SecurityEventClassification.SUSPICIOUS_ACTIVITY;
        severity = SecuritySeverity.MEDIUM;
        break;
    }

    return {
      event_code: sourceRecord.event_code,
      source_record_id: sourceRecord.id,
      source_type: this.sourceType,
      adapter_version: this.version,
      security_domain: securityDomain,
      event_category: "API Security",
      event_classification: classification,
      severity,
      confidence_score: null,
      actor_user_id: sourceRecord.actor_user_id,
      classification_reason: null,
      correlation_key: this.buildCorrelationKey(sourceRecord),
      idempotency_key: `API_${sourceRecord.id}`,
      processing_status: "PENDING",
      occurred_at: sourceRecord.occurred_at,
      source_received_at: new Date(),
      environment: environment,
      lifecycle_type: lifecycle,
      source_summary: sourceRecord.sanitized_metadata ? JSON.parse(sourceRecord.sanitized_metadata) : null,
    };
  }

  private buildCorrelationKey(sourceRecord: ApiSecurityLog): string | null {
    if (sourceRecord.event_code === "API_RATE_LIMIT_EXCEEDED") {
      const source = sourceRecord.ip_reference_hash ? `SOURCE:${sourceRecord.ip_reference_hash}` : "SOURCE:UNKNOWN";
      return `${source}|POLICY:${sourceRecord.policy_family || 'UNKNOWN'}|ROUTE:${sourceRecord.safe_route_family || 'UNKNOWN'}`;
    } else if (sourceRecord.event_code === "API_AUTHORIZATION_DENIED") {
      const subject = sourceRecord.actor_user_id 
        ? `ACTOR:${sourceRecord.actor_user_id}` 
        : (sourceRecord.ip_reference_hash ? `SOURCE:${sourceRecord.ip_reference_hash}` : "SOURCE:UNKNOWN");
      return `${subject}|ROUTE:${sourceRecord.safe_route_family || 'UNKNOWN'}`;
    }
    
    if (sourceRecord.actor_user_id) return `ACTOR:${sourceRecord.actor_user_id}`;
    if (sourceRecord.ip_reference_hash) return `SOURCE:${sourceRecord.ip_reference_hash}`;
    return sourceRecord.correlation_id || null;
  }
}
