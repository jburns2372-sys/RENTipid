import { PaymentWebhookLogAdapter } from "../../../src/lib/security/events/adapters/payment-webhook-log-adapter";
import { AuditLogAdapter } from "../../../src/lib/security/events/adapters/audit-log-adapter";
import { VerificationDocumentAdapter } from "../../../src/lib/security/events/adapters/verification-document-adapter";
import { SecurityLifecycle, SecurityEnvironment } from "../../../src/lib/security/events/taxonomy";

describe("Gate 4B-4 Slice A: Existing Adapters Integration", () => {
  const namespace = `gate4b4-slice-a-${Date.now()}`;
  
  describe("PaymentWebhookLogAdapter", () => {
    const adapter = new PaymentWebhookLogAdapter();

    it("Failed payment webhook produces exactly one WEBHOOK_FAIL event", () => {
      const failedWebhook = {
        id: `webhook-${namespace}-1`,
        provider: "paymongo",
        event_type: "payment.failed",
        verification_status: "Failed",
        processing_status: "FAILED",
        received_at: new Date(),
        booking_id: `booking-${namespace}-123`,
        gateway_reference: "ref1",
        headers_summary: "{}",
        payload_summary: "{}"
      };
      
      const event = adapter.normalize(failedWebhook as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.event_code).toBe("WEBHOOK_FAIL");
      expect(event.event_classification).toBe("POLICY_VIOLATION");
    });

    it("Successful webhook does not produce WEBHOOK_FAIL", () => {
      const successWebhook = {
        id: `webhook-${namespace}-2`,
        provider: "paymongo",
        event_type: "payment.paid",
        verification_status: "Verified",
        processing_status: "PROCESSED",
        received_at: new Date(),
        booking_id: `booking-${namespace}-456`,
        gateway_reference: "ref2",
        headers_summary: "{}",
        payload_summary: "{}"
      };
      
      const event = adapter.normalize(successWebhook as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.event_code).toBe("WEBHOOK_PAYMONGO_PAYMENT_PAID");
    });

    it("Reprocessing the same failed webhook does not duplicate SecurityEvent (Idempotency)", () => {
      const failedWebhook = {
        id: `webhook-${namespace}-3`,
        provider: "paymongo",
        event_type: "payment.failed",
        verification_status: "Failed",
        processing_status: "FAILED",
        received_at: new Date(),
        booking_id: `booking-${namespace}-123`,
        gateway_reference: "ref3",
        headers_summary: "{}",
        payload_summary: "{}"
      };
      
      const event1 = adapter.normalize(failedWebhook as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      const event2 = adapter.normalize(failedWebhook as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event1.idempotency_key).toBe(event2.idempotency_key);
    });

    it("No raw booking, payment or provider identifier is stored", () => {
      const webhook = {
        id: `webhook-${namespace}-4`,
        provider: "paymongo",
        event_type: "payment.paid",
        verification_status: "Verified",
        processing_status: "PROCESSED",
        received_at: new Date(),
        booking_id: `booking-${namespace}-raw-id`,
        gateway_reference: "ref4",
        headers_summary: "{}",
        payload_summary: "{}"
      };
      const event = adapter.normalize(webhook as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.correlation_key).not.toContain("raw-id");
      // It should be HMAC hashed
      expect(event.correlation_key).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("AuditLogAdapter", () => {
    const adapter = new AuditLogAdapter();

    it("Explicit bulk-access AuditLog action produces BULK_ACCESS", () => {
      const auditLog = {
        id: `audit-${namespace}-1`,
        action: "BULK_ACCESS",
        module: "DataExport",
        actor_user_id: `user-${namespace}-1`,
        target_id: null,
        details: "{}",
        ip_address: "127.0.0.1",
        created_at: new Date()
      };
      const event = adapter.normalize(auditLog as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.event_code).toBe("BULK_ACCESS");
      expect(event.severity).toBe("HIGH");
    });

    it("Unrelated AuditLog action does not produce BULK_ACCESS", () => {
      const auditLog = {
        id: `audit-${namespace}-2`,
        action: "LOGIN_SUCCESS",
        module: "Auth",
        actor_user_id: `user-${namespace}-2`,
        target_id: null,
        details: "{}",
        ip_address: "127.0.0.1",
        created_at: new Date()
      };
      const event = adapter.normalize(auditLog as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.event_code).toBe("AUDIT_LOGIN_SUCCESS");
    });

    it("Explicit data-export action produces DATA_EXPORT", () => {
      const auditLog = {
        id: `audit-${namespace}-3`,
        action: "DATA_EXPORT",
        module: "DataExport",
        actor_user_id: `user-${namespace}-3`,
        target_id: null,
        details: "{}",
        ip_address: "127.0.0.1",
        created_at: new Date()
      };
      const event = adapter.normalize(auditLog as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.event_code).toBe("DATA_EXPORT");
    });

    it("Explicit cross-tenant action produces CROSS_TENANT", () => {
      const auditLog = {
        id: `audit-${namespace}-4`,
        action: "CROSS_TENANT",
        module: "DataExport",
        actor_user_id: `user-${namespace}-4`,
        target_id: null,
        details: "{}",
        ip_address: "127.0.0.1",
        created_at: new Date()
      };
      const event = adapter.normalize(auditLog as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.event_code).toBe("CROSS_TENANT");
      expect(event.severity).toBe("CRITICAL");
    });

    it("Audit actor and target references are pseudonymous", () => {
      const auditLog = {
        id: `audit-${namespace}-5`,
        action: "CROSS_TENANT",
        module: "DataExport",
        actor_user_id: `user-raw-actor-id`,
        target_id: null,
        details: "{}",
        ip_address: "127.0.0.1",
        created_at: new Date()
      };
      const event = adapter.normalize(auditLog as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.correlation_key).not.toContain("raw-actor-id");
      expect(event.correlation_key).toMatch(/^[a-f0-9]{64}$/);
    });

    it("Reprocessing the same AuditLog record is idempotent", () => {
      const auditLog = {
        id: `audit-${namespace}-6`,
        action: "CROSS_TENANT",
        module: "DataExport",
        actor_user_id: `user-${namespace}-6`,
        target_id: null,
        details: "{}",
        ip_address: "127.0.0.1",
        created_at: new Date()
      };
      const event1 = adapter.normalize(auditLog as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      const event2 = adapter.normalize(auditLog as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event1.idempotency_key).toBe(event2.idempotency_key);
    });
  });

  describe("VerificationDocumentAdapter", () => {
    const adapter = new VerificationDocumentAdapter();

    it("VerificationDocument telemetry contains no raw user/document identifier", () => {
      const doc = {
        id: `doc-${namespace}-1`,
        user_id: `user-raw-kyc-id`,
        document_type: "ID",
        status: "Submitted",
        uploaded_at: new Date(),
        reviewed_at: null,
        rejection_reason: null,
        reviewed_by: null
      };
      const event = adapter.normalize(doc as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.correlation_key).not.toContain("raw-kyc-id");
      expect(event.correlation_key).toMatch(/^[a-f0-9]{64}$/);
    });

    it("Mutable VerificationDocument updates do not falsely emit KYC_UPLOADED", () => {
      const doc = {
        id: `doc-${namespace}-2`,
        user_id: `user-${namespace}-2`,
        document_type: "ID",
        status: "Submitted",
        uploaded_at: new Date(),
        reviewed_at: null,
        rejection_reason: null,
        reviewed_by: null
      };
      const event = adapter.normalize(doc as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.event_code).toBe("KYC_DOC_SUBMITTED"); // It emits observation event, not KYC_UPLOADED.
      expect(event.event_code).not.toBe("KYC_UPLOADED");
    });

    it("Mutable VerificationDocument updates do not falsely emit KYC_REJECTED", () => {
      const doc = {
        id: `doc-${namespace}-3`,
        user_id: `user-${namespace}-3`,
        document_type: "ID",
        status: "Rejected",
        uploaded_at: new Date(),
        reviewed_at: new Date(),
        rejection_reason: "Blurry",
        reviewed_by: "admin"
      };
      const event = adapter.normalize(doc as any, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
      expect(event.event_code).toBe("KYC_DOC_REJECTED"); // It emits observation event, not KYC_REJECTED.
      expect(event.event_code).not.toBe("KYC_REJECTED");
    });
  });
});
