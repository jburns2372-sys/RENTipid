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
import { DamageClaim, DisputeCase, InspectionReport } from "@prisma/client";
import * as crypto from 'crypto';

export class DamageClaimAdapter implements SecurityEventSourceAdapter<DamageClaim> {
  sourceType = SecurityEventSource.DAMAGE_CLAIM;
  private readonly version = "1.0";

  supports(record: unknown): record is DamageClaim {
    return typeof record === "object" && record !== null && "claim_number" in record && "claim_status" in record;
  }

  normalize(record: DamageClaim, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    const idempotencyPayload = `${this.sourceType}:${record.id}:${record.updated_at.toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `DAMAGE_CLAIM_${record.claim_status.toUpperCase().replace(/\s+/g, "_")}`,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: SecurityDomain.TRUST_AND_SAFETY,
      event_category: "Damage Claim",
      event_classification: SecurityEventClassification.FRAUD_INDICATOR,
      severity: SecuritySeverity.MEDIUM,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: record.provider_id,
      target_user_id: record.renter_id,
      target_module: "Damage Claims",
      action_attempted: null,
      action_result: record.claim_status,
      
      source_summary: {
        claim_number: record.claim_number,
        claim_type: record.claim_type,
        claim_status: record.claim_status,
        claimed_amount: record.claimed_amount
      },
      classification_reason: "Damage claim activity acts as an indicator for trust and safety reviews.",
      correlation_key: `booking:${record.booking_id}`,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.updated_at,
      source_received_at: record.created_at
    };
  }
}

export class DisputeCaseAdapter implements SecurityEventSourceAdapter<DisputeCase> {
  sourceType = SecurityEventSource.DISPUTE_CASE;
  private readonly version = "1.0";

  supports(record: unknown): record is DisputeCase {
    return typeof record === "object" && record !== null && "dispute_type" in record && "dispute_status" in record;
  }

  normalize(record: DisputeCase, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    const idempotencyPayload = `${this.sourceType}:${record.id}:${record.updated_at.toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `DISPUTE_${record.dispute_status.toUpperCase().replace(/\s+/g, "_")}`,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: SecurityDomain.TRUST_AND_SAFETY,
      event_category: "Dispute Case",
      event_classification: SecurityEventClassification.FRAUD_INDICATOR,
      severity: SecuritySeverity.MEDIUM,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: record.opened_by,
      target_user_id: null,
      target_module: "Disputes",
      action_attempted: null,
      action_result: record.dispute_status,
      
      source_summary: {
        dispute_type: record.dispute_type,
        dispute_status: record.dispute_status,
        summary: record.summary
      },
      classification_reason: "Dispute case opened, which acts as an indicator for marketplace safety reviews.",
      correlation_key: `booking:${record.booking_id}`,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.updated_at,
      source_received_at: record.created_at
    };
  }
}

export class InspectionReportAdapter implements SecurityEventSourceAdapter<InspectionReport> {
  sourceType = SecurityEventSource.INSPECTION_REPORT;
  private readonly version = "1.0";

  supports(record: unknown): record is InspectionReport {
    return typeof record === "object" && record !== null && "inspection_type" in record && "condition_summary" in record;
  }

  normalize(record: InspectionReport, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    const idempotencyPayload = `${this.sourceType}:${record.id}:${record.updated_at.toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `INSPECTION_${record.status.toUpperCase().replace(/\s+/g, "_")}`,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: SecurityDomain.TRUST_AND_SAFETY,
      event_category: "Inspection",
      event_classification: SecurityEventClassification.OBSERVATION,
      severity: SecuritySeverity.INFO,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: record.submitted_by,
      target_user_id: null,
      target_module: "Inspections",
      action_attempted: null,
      action_result: record.status,
      
      source_summary: {
        inspection_type: record.inspection_type,
        status: record.status,
        condition_summary: record.condition_summary
      },
      classification_reason: "Inspection report lifecycle observation.",
      correlation_key: `booking:${record.booking_id}`,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.updated_at,
      source_received_at: record.created_at
    };
  }
}
