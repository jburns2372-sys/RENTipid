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
import { PaymentWebhookLog } from "@prisma/client";
import { sanitizeWebhookSummary } from "../../serializers";
import * as crypto from 'crypto';

export class PaymentWebhookLogAdapter implements SecurityEventSourceAdapter<PaymentWebhookLog> {
  sourceType = SecurityEventSource.PAYMENT_WEBHOOK_LOG;
  private readonly version = "1.0";

  supports(record: unknown): record is PaymentWebhookLog {
    return (
      typeof record === "object" && 
      record !== null && 
      "id" in record && 
      "provider" in record && 
      "event_type" in record &&
      "verification_status" in record
    );
  }

  normalize(record: PaymentWebhookLog, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    const domain = SecurityDomain.PAYMENT_SECURITY;
    let classification: SecurityEventClassification = SecurityEventClassification.OBSERVATION;
    let severity: SecuritySeverity = SecuritySeverity.INFO;
    let classification_reason = "Payment webhook observation.";

    if (record.processing_status === "IGNORED") {
      classification = SecurityEventClassification.OBSERVATION;
      severity = SecuritySeverity.INFO;
      classification_reason = "Webhook ignored as unsupported or unneeded.";
    }

    if (record.verification_status === "Failed") {
      classification = SecurityEventClassification.POLICY_VIOLATION;
      severity = SecuritySeverity.HIGH;
      classification_reason = "Webhook signature verification failed. Potential tampering or replay.";
    }

    const { headers_summary, payload_summary } = sanitizeWebhookSummary(
      record.headers_summary || "", 
      record.payload_summary || ""
    );

    const idempotencyPayload = `${this.sourceType}:${record.id}:${record.received_at.toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `WEBHOOK_${record.provider.toUpperCase()}_${record.event_type.replace(/[^A-Z0-9]/gi, "_").toUpperCase()}`,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: domain,
      event_category: record.provider,
      event_classification: classification,
      severity,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: null,
      target_user_id: null,
      target_module: "Payment Webhook",
      action_attempted: record.event_type,
      action_result: record.processing_status,
      
      source_summary: { headers_summary, payload_summary, gateway_reference: record.gateway_reference, verification_status: record.verification_status },
      classification_reason,
      correlation_key: record.booking_id ? `booking:${record.booking_id}` : null,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.received_at, 
      source_received_at: record.received_at
    };
  }
}
