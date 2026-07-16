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
import { PaymentReconciliationLog } from "@prisma/client";
import * as crypto from 'crypto';

export class PaymentReconciliationLogAdapter implements SecurityEventSourceAdapter<PaymentReconciliationLog> {
  sourceType = SecurityEventSource.PAYMENT_RECONCILIATION_LOG;
  private readonly version = "1.0";

  supports(record: unknown): record is PaymentReconciliationLog {
    return (
      typeof record === "object" && 
      record !== null && 
      "id" in record && 
      "expected_amount" in record && 
      "received_amount" in record &&
      "status" in record
    );
  }

  // Safe float comparison by scaling to minor units (e.g. cents)
  private convertToMinorUnits(amount: number, scale: number = 2): number {
    // We use Math.round to handle standard JS floating point drift (e.g. 1.005 * 100)
    return Math.round(amount * Math.pow(10, scale));
  }

  normalize(record: PaymentReconciliationLog, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    const domain = SecurityDomain.FINANCIAL_INTEGRITY;
    let classification: SecurityEventClassification = SecurityEventClassification.OBSERVATION;
    let severity: SecuritySeverity = SecuritySeverity.INFO;
    let classification_reason = "Payment reconciliation matched expected values.";

    const expectedMinor = this.convertToMinorUnits(record.expected_amount);
    const receivedMinor = this.convertToMinorUnits(record.received_amount);

    if (expectedMinor !== receivedMinor || record.status === "Mismatch") {
      classification = SecurityEventClassification.FRAUD_INDICATOR;
      severity = SecuritySeverity.MEDIUM;
      classification_reason = "Financial mismatch detected during reconciliation. This is an indicator and requires manual review.";
    }

    const idempotencyPayload = `${this.sourceType}:${record.id}:${record.created_at.toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `RECONCILIATION_${expectedMinor === receivedMinor ? "MATCHED" : "MISMATCH"}`,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: domain,
      event_category: "Financial Reconciliation",
      event_classification: classification,
      severity,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: null,
      target_user_id: null,
      target_module: "Payment Reconciliation",
      action_attempted: null,
      action_result: record.status,
      
      source_summary: {
        expected_amount: record.expected_amount,
        received_amount: record.received_amount,
        expected_currency: record.expected_currency,
        received_currency: record.received_currency,
        status: record.status,
        notes: record.notes
      },
      classification_reason,
      correlation_key: record.booking_id ? `booking:${record.booking_id}` : null,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.created_at,
      source_received_at: record.created_at
    };
  }
}
