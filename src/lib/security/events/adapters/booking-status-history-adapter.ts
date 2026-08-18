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
import { BookingStatusHistory } from "@prisma/client";
import { pseudonymizeTelemetryContext } from "../../telemetry-hmac";
import * as crypto from 'crypto';

export class BookingStatusHistoryAdapter implements SecurityEventSourceAdapter<BookingStatusHistory> {
  sourceType = SecurityEventSource.AUDIT_LOG;
  private readonly version = "1.0";

  supports(record: unknown): record is BookingStatusHistory {
    return (
      typeof record === "object" && 
      record !== null && 
      "id" in record && 
      "booking_id" in record && 
      "old_status" in record &&
      "new_status" in record &&
      "changed_by" in record
    );
  }

  normalize(record: BookingStatusHistory, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    // Exact matching predicate for BOOKING_CREATED
    const isCreation = record.old_status === 'SYSTEM_CREATION' && record.new_status === 'PENDING_PAYMENT';
    
    let event_code = "BOOKING_STATUS_UPDATE";
    let classification: SecurityEventClassification = SecurityEventClassification.OBSERVATION;
    let severity: SecuritySeverity = SecuritySeverity.INFO;
    let classification_reason = "Ordinary booking status update.";
    
    if (isCreation) {
      event_code = "BOOKING_CREATED";
      classification = SecurityEventClassification.FRAUD_INDICATOR;
      severity = SecuritySeverity.HIGH;
      classification_reason = "Initial booking creation holding pending payment.";
    } else if (record.new_status === 'CANCELLED') {
      event_code = "BOOKING_CANCELLED";
    } else if (record.new_status === 'COMPLETED') {
      event_code = "BOOKING_COMPLETED";
    }

    const idempotencyPayload = `BOOKING_STATUS_HISTORY:${record.id}:${event_code}:${this.version}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    const safeSummary = {
      booking_reference: pseudonymizeTelemetryContext("booking-reference", record.booking_id),
      old_status: record.old_status,
      new_status: record.new_status,
      notes: record.notes
    };

    return {
      event_code,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: SecurityDomain.APPLICATION_RELIABILITY,
      event_category: "Booking",
      event_classification: classification,
      severity,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: null,
      target_user_id: null,
      target_module: "BookingStatusHistory",
      action_attempted: event_code,
      action_result: "COMPLETED",
      
      source_summary: safeSummary,
      classification_reason,
      correlation_key: record.changed_by ? pseudonymizeTelemetryContext("booking-creation-actor", record.changed_by) : null,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.created_at, 
      source_received_at: record.created_at
    };
  }
}
