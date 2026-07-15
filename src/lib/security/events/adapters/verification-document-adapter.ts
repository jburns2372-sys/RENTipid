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
import { VerificationDocument } from "@prisma/client";
import * as crypto from 'crypto';

export class VerificationDocumentAdapter implements SecurityEventSourceAdapter<VerificationDocument> {
  sourceType = SecurityEventSource.VERIFICATION_DOCUMENT;
  private readonly version = "1.0";

  supports(record: unknown): record is VerificationDocument {
    return (
      typeof record === "object" && 
      record !== null && 
      "id" in record && 
      "document_type" in record && 
      "status" in record
    );
  }

  normalize(record: VerificationDocument, lifecycle: SecurityLifecycle, environment: SecurityEnvironment): NormalizedSecurityEvent {
    const domain = SecurityDomain.KYC_AND_COMPLIANCE;
    let classification: SecurityEventClassification = SecurityEventClassification.OBSERVATION;
    let severity: SecuritySeverity = SecuritySeverity.INFO;
    let classification_reason = "Standard KYC document transition observation.";

    const statusUpper = record.status.toUpperCase();
    if (statusUpper === "REJECTED") {
      classification = SecurityEventClassification.POLICY_VIOLATION;
      severity = SecuritySeverity.LOW;
      classification_reason = "KYC document rejected.";
    }

    const idempotencyPayload = `${this.sourceType}:${record.id}:${(record.reviewed_at || record.uploaded_at).toISOString()}:${this.version}:${lifecycle}`;
    const idempotencyKey = crypto.createHash("sha256").update(idempotencyPayload).digest("hex");

    return {
      event_code: `KYC_DOC_${statusUpper}`,
      source_type: this.sourceType,
      source_record_id: record.id,
      adapter_version: this.version,
      security_domain: domain,
      event_category: record.document_type,
      event_classification: classification,
      severity,
      confidence_score: null,
      environment,
      lifecycle_type: lifecycle,
      
      actor_user_id: record.user_id,
      target_user_id: record.user_id,
      target_module: "KYC Verification",
      action_attempted: null,
      action_result: statusUpper,
      
      // Deliberately omit file_url
      source_summary: {
        document_type: record.document_type,
        status: record.status,
        rejection_reason: record.rejection_reason,
        reviewed_by: record.reviewed_by
      },
      classification_reason,
      correlation_key: `user:${record.user_id}`,
      idempotency_key: idempotencyKey,
      processing_status: SecurityProcessingStatus.NORMALIZED,
      
      occurred_at: record.reviewed_at || record.uploaded_at,
      source_received_at: record.uploaded_at
    };
  }
}
