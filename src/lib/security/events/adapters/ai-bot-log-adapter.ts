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
import { AIBotLog } from "@prisma/client";
import { redactSensitiveData } from "../../serializers";
import * as crypto from 'crypto';

export class AIBotLogAdapter implements SecurityEventSourceAdapter<AIBotLog> {
  sourceType = SecurityEventSource.AI_BOT_LOG;
  private readonly version = "1.0";

  supports(record: unknown): record is AIBotLog {
    return (
      typeof record === "object" && 
      record !== null && 
      "id" in record && 
      "bot_name" in record && 
      "module" in record
    );
  }

  normalize(record: AIBotLog, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    const domain = SecurityDomain.AI_GUARDRAILS;
    let classification: SecurityEventClassification = SecurityEventClassification.OBSERVATION;
    let severity: SecuritySeverity = SecuritySeverity.INFO;
    let classification_reason = "Standard AI Bot action observation.";

    const statusUpper = record.action_status?.toUpperCase() || "";

    if (statusUpper.includes("BLOCKED") || statusUpper.includes("DENIED")) {
      classification = SecurityEventClassification.POLICY_VIOLATION;
      severity = SecuritySeverity.MEDIUM;
      classification_reason = "AI action blocked by guardrails.";
    } else if (statusUpper.includes("FAILED")) {
      classification = SecurityEventClassification.CONTROL_FAILURE;
      severity = SecuritySeverity.LOW;
      classification_reason = "AI action failed to complete.";
    }

    const safeSummary = redactSensitiveData({
      prompt: record.prompt,
      response_summary: record.response_summary
    });

    const idempotencyPayload = `${this.sourceType}:${record.id}:${record.created_at.toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `AI_ACTION_${statusUpper.replace(/[^A-Z0-9]/g, "_") || "UNKNOWN"}`,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: domain,
      event_category: record.bot_name,
      event_classification: classification,
      severity,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: record.user_id,
      target_user_id: null,
      target_module: record.module,
      action_attempted: record.action_requested || null,
      action_result: statusUpper || "COMPLETED",
      
      source_summary: safeSummary,
      classification_reason,
      correlation_key: record.user_id ? `user:${record.user_id}` : null,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.created_at,
      source_received_at: record.created_at
    };
  }
}
