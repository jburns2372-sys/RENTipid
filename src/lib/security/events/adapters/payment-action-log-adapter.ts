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
import { PaymentActionLog } from "@prisma/client";
import { pseudonymizeTelemetryContext } from "../../telemetry-hmac";
import * as crypto from 'crypto';

export class PaymentActionLogAdapter implements SecurityEventSourceAdapter<PaymentActionLog> {
  // Using AUDIT_LOG as the fallback source type for internally generated action logs 
  // that do not have a dedicated enum in the SecurityEventSource Prisma schema.
  sourceType = SecurityEventSource.PAYMENT_ACTION_LOG; 
  private readonly version = "1.0";

  supports(record: unknown): record is PaymentActionLog {
    return (
      typeof record === "object" && 
      record !== null && 
      "id" in record && 
      "action_code" in record && 
      "actor_type" in record &&
      "outcome" in record &&
      "booking_id" in record &&
      "source_operation_id" in record &&
      "idempotency_key" in record &&
      "occurred_at" in record
    );
  }

  normalize(record: PaymentActionLog, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    // Exact match predicate for PAYMENT_FREEZE_BLOCKED
    if (
      record.action_code === 'PAYMENT_FREEZE_BLOCKED' &&
      record.actor_type === 'RENTER' &&
      record.outcome === 'DENIED'
    ) {
      const domain = SecurityDomain.PAYMENT_SECURITY;
      const classification = SecurityEventClassification.COUNTERMEASURE;
      const severity = SecuritySeverity.HIGH;
      const classification_reason = "Payment checkout was explicitly blocked by an emergency freeze control.";

      const idempotencyPayload = `PAYMENT_ACTION_LOG|${record.id}|${record.action_code}|${this.version}`;
      const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

      return {
        event_code: record.action_code,
        source_type: this.sourceType,
        source_record_id: record.id,
        adapter_version: this.version,
        security_domain: domain,
        event_category: "Checkout",
        event_classification: classification,
        severity,
        confidence_score: null,
        environment,
        lifecycle_type: lifecycle,
        
        actor_user_id: null, // Pseudonymized via account_reference_hash in source_summary
        target_user_id: null,
        target_module: "Payment Action",
        action_attempted: record.action_code,
        action_result: record.outcome,
        
        source_summary: {
          action_code: record.action_code,
          actor_type: record.actor_type,
          outcome: record.outcome,
          source_workflow: record.source_workflow,
          account_reference_hash: record.actor_user_id ? pseudonymizeTelemetryContext("payment-actor", record.actor_user_id) : null,
          has_gateway_transaction: !!record.gateway_transaction_id,
          currency: record.currency || undefined
        },
        classification_reason,
        correlation_key: record.booking_id ? pseudonymizeTelemetryContext("booking-reference", record.booking_id) : null,
        idempotency_key: idempotencyKey,
        processing_status: SecurityProcessingStatus.NORMALIZED,
        
        occurred_at: record.occurred_at, 
        source_received_at: record.occurred_at
      };
    }

    // Exact match predicate for PAYMENT_AMOUNT_MISMATCH
    if (
      record.action_code === 'PAYMENT_AMOUNT_MISMATCH' &&
      record.source_workflow === 'PAYMENT_RECONCILIATION' &&
      record.actor_type === 'SYSTEM' &&
      record.outcome === 'MISMATCH_DETECTED'
    ) {
      if (!record.expected_amount || !record.received_amount || !record.currency || !record.booking_id || !record.source_operation_id || !record.occurred_at) {
        throw new Error(`Unsupported PaymentActionLog for SecurityEvent adapter: Missing amount evidence`);
      }

      const domain = SecurityDomain.PAYMENT_SECURITY;
      const classification = SecurityEventClassification.FRAUD_INDICATOR;
      const severity = SecuritySeverity.HIGH;
      const classification_reason = "Detected a payment amount mismatch between expected booking total and received gateway transaction amount.";

      const idempotencyPayload = `PAYMENT_ACTION_LOG|${record.id}|${record.action_code}|${this.version}`;
      const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

      return {
        event_code: record.action_code,
        source_type: this.sourceType,
        source_record_id: record.id,
        adapter_version: this.version,
        security_domain: domain,
        event_category: "Payment Reconciliation",
        event_classification: classification,
        severity,
        confidence_score: null,
        environment,
        lifecycle_type: lifecycle,
        
        actor_user_id: null, // SYSTEM actor, no human identity
        target_user_id: null,
        target_module: "Payments",
        action_attempted: "RECONCILE_PAYMENT_AMOUNT",
        action_result: "AMOUNT_MISMATCH_DETECTED",
        
        source_summary: {
          action_code: record.action_code,
          actor_type: record.actor_type,
          outcome: record.outcome,
          source_workflow: record.source_workflow,
          has_gateway_transaction: !!record.gateway_transaction_id,
          currency: record.currency || undefined
        },
        classification_reason,
        correlation_key: pseudonymizeTelemetryContext("booking-reference", record.booking_id),
        idempotency_key: idempotencyKey,
        processing_status: SecurityProcessingStatus.NORMALIZED,
        
        occurred_at: record.occurred_at, 
        source_received_at: record.occurred_at
      };
    }

    // Exact match predicate for PAYMENT_CURRENCY_MISMATCH
    if (
      record.action_code === 'PAYMENT_CURRENCY_MISMATCH' &&
      record.source_workflow === 'PAYMENT_RECONCILIATION' &&
      record.actor_type === 'SYSTEM' &&
      record.outcome === 'MISMATCH_DETECTED'
    ) {
      if (!record.expected_currency || !record.received_currency || record.expected_currency === record.received_currency || !record.booking_id || !record.source_operation_id || !record.occurred_at) {
        throw new Error(`Unsupported PaymentActionLog for SecurityEvent adapter: Missing currency evidence`);
      }

      const domain = SecurityDomain.PAYMENT_SECURITY;
      const classification = SecurityEventClassification.FRAUD_INDICATOR;
      const severity = SecuritySeverity.HIGH;
      const classification_reason = "Detected a payment currency mismatch between expected booking contract currency and received gateway transaction currency.";

      const idempotencyPayload = `PAYMENT_ACTION_LOG|${record.id}|${record.action_code}|${this.version}`;
      const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

      return {
        event_code: record.action_code,
        source_type: this.sourceType,
        source_record_id: record.id,
        adapter_version: this.version,
        security_domain: domain,
        event_category: "Payment Reconciliation",
        event_classification: classification,
        severity,
        confidence_score: null,
        environment,
        lifecycle_type: lifecycle,
        
        actor_user_id: null, // SYSTEM actor, no human identity
        target_user_id: null,
        target_module: "Payments",
        action_attempted: "RECONCILE_PAYMENT_CURRENCY",
        action_result: "CURRENCY_MISMATCH_DETECTED",
        
        source_summary: {
          action_code: record.action_code,
          actor_type: record.actor_type,
          outcome: record.outcome,
          source_workflow: record.source_workflow,
          has_gateway_transaction: !!record.gateway_transaction_id,
          expected_currency: record.expected_currency,
          received_currency: record.received_currency
        },
        classification_reason,
        correlation_key: pseudonymizeTelemetryContext("booking-reference", record.booking_id),
        idempotency_key: idempotencyKey,
        processing_status: SecurityProcessingStatus.NORMALIZED,
        
        occurred_at: record.occurred_at, 
        source_received_at: record.occurred_at
      };
    }

    throw new Error(`Unsupported PaymentActionLog for SecurityEvent adapter: ${record.action_code}`);


  }
}
