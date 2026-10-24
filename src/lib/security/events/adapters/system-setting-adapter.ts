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
import { SystemSetting } from "@prisma/client";
import * as crypto from 'crypto';

export class SystemSettingAdapter implements SecurityEventSourceAdapter<SystemSetting> {
  sourceType = SecurityEventSource.SYSTEM_SETTING;
  private readonly version = "1.0";

  supports(record: unknown): record is SystemSetting {
    return typeof record === "object" && record !== null && "setting_key" in record && "setting_value" in record;
  }

  normalize(record: SystemSetting, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    let domain: SecurityDomain = SecurityDomain.APPLICATION_RELIABILITY;
    let classification: SecurityEventClassification = SecurityEventClassification.OBSERVATION;
    let severity: SecuritySeverity = SecuritySeverity.INFO;
    let classification_reason = "System setting modified.";

    const keyUpper = record.setting_key.toUpperCase();

    if (keyUpper.includes("SECURITY") || keyUpper.includes("PAYMENT") || keyUpper.includes("FREEZE")) {
      domain = SecurityDomain.ADMINISTRATIVE_SECURITY;
      classification = SecurityEventClassification.OBSERVATION;
      severity = SecuritySeverity.HIGH;
      classification_reason = "Critical security or payment system setting was modified.";
    }

    const idempotencyPayload = `${this.sourceType}:${record.id}:${record.updated_at.toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `SETTING_${keyUpper.replace(/[^A-Z0-9]/g, "_")}`,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: domain,
      event_category: "System Setting",
      event_classification: classification,
      severity,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: record.updated_by,
      target_user_id: null,
      target_module: "Settings",
      action_attempted: null,
      action_result: "SUCCESS",
      
      // Deliberately omit the exact setting_value if it looks like a secret
      source_summary: {
        setting_key: record.setting_key,
        setting_value: (keyUpper.includes("SECRET") || keyUpper.includes("KEY") || keyUpper.includes("TOKEN")) ? "[REDACTED]" : record.setting_value
      },
      classification_reason,
      correlation_key: record.updated_by ? `user:${record.updated_by}` : null,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.updated_at,
      source_received_at: record.updated_at
    };
  }
}
