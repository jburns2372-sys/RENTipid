import { ADAPTER_REGISTRY, getAdapterForRecord } from "../../src/lib/security/events/adapters/registry";
import { SecurityEventSource, SecurityLifecycle, SecurityEnvironment } from "../../src/lib/security/events/taxonomy";

describe("Security Event Adapters", () => {
  it("should have exactly 10 adapters registered", () => {
    expect(ADAPTER_REGISTRY.length).toBe(10);
    const sources = ADAPTER_REGISTRY.map(a => a.sourceType);
    expect(sources).toContain(SecurityEventSource.AUDIT_LOG);
    expect(sources).toContain(SecurityEventSource.SYSTEM_ERROR_LOG);
    expect(sources).toContain(SecurityEventSource.AI_BOT_LOG);
    expect(sources).toContain(SecurityEventSource.PAYMENT_WEBHOOK_LOG);
    expect(sources).toContain(SecurityEventSource.PAYMENT_RECONCILIATION_LOG);
    expect(sources).toContain(SecurityEventSource.VERIFICATION_DOCUMENT);
    expect(sources).toContain(SecurityEventSource.DAMAGE_CLAIM);
    expect(sources).toContain(SecurityEventSource.DISPUTE_CASE);
    expect(sources).toContain(SecurityEventSource.INSPECTION_REPORT);
    expect(sources).toContain(SecurityEventSource.SYSTEM_SETTING);
  });

  describe("AIBotLogAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.AI_BOT_LOG)!;
    const baseRecord = { id: "1", bot_name: "bot1", module: "mod1", created_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
      const record = { ...baseRecord, action_status: "BLOCKED", user_id: "usr1" };
            const normalized = adapter.normalize(record, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.AI_BOT_LOG);
      expect(normalized.source_record_id).toBe("1");
      expect(normalized.event_classification).toBe("POLICY_VIOLATION");
      expect(normalized.severity).toBe("MEDIUM");
      expect(normalized.actor_user_id).toBe("usr1");
      expect(normalized.adapter_version).toBe("1.0");
      expect(normalized.source_summary).toBeDefined();
    });
  });

  describe("AuditLogAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.AUDIT_LOG)!;
    const baseRecord = { id: "1", action: "test", module: "test", created_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
      const record = { ...baseRecord, action: "LOGIN", user_id: "usr1" };
            const normalized = adapter.normalize(record, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.AUDIT_LOG);
      expect(normalized.source_record_id).toBe("1");
    });
  });

  describe("SystemErrorLogAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.SYSTEM_ERROR_LOG)!;
    const baseRecord = { id: "1", error_message: "msg", severity: "HIGH", created_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
            const normalized = adapter.normalize(baseRecord, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.SYSTEM_ERROR_LOG);
    });
  });

  describe("PaymentWebhookLogAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.PAYMENT_WEBHOOK_LOG)!;
    const baseRecord = { id: "1", provider: "pay", event_type: "test", verification_status: "test", received_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
            const normalized = adapter.normalize(baseRecord, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.PAYMENT_WEBHOOK_LOG);
    });
  });

  describe("PaymentReconciliationLogAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.PAYMENT_RECONCILIATION_LOG)!;
    const baseRecord = { id: "1", expected_amount: 100, received_amount: 90, status: "test", created_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
            const normalized = adapter.normalize(baseRecord, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.PAYMENT_RECONCILIATION_LOG);
    });
  });

  describe("VerificationDocumentAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.VERIFICATION_DOCUMENT)!;
    const baseRecord = { id: "1", document_type: "doc", status: "PENDING", uploaded_at: new Date(), updated_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
            const normalized = adapter.normalize(baseRecord, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.VERIFICATION_DOCUMENT);
    });
  });

  describe("DamageClaimAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.DAMAGE_CLAIM)!;
    const baseRecord = { id: "1", claim_number: "c1", claim_status: "s", created_at: new Date(), updated_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
            const normalized = adapter.normalize(baseRecord, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.DAMAGE_CLAIM);
    });
  });

  describe("DisputeCaseAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.DISPUTE_CASE)!;
    const baseRecord = { id: "1", dispute_type: "t", dispute_status: "s", created_at: new Date(), updated_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
            const normalized = adapter.normalize(baseRecord, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.DISPUTE_CASE);
    });
  });

  describe("InspectionReportAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.INSPECTION_REPORT)!;
    const baseRecord = { id: "1", inspection_type: "t", condition_summary: "s", status: "COMPLETED", created_at: new Date(), updated_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
            const normalized = adapter.normalize(baseRecord, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.INSPECTION_REPORT);
    });
  });

  describe("SystemSettingAdapter", () => {
    const adapter = ADAPTER_REGISTRY.find(a => a.sourceType === SecurityEventSource.SYSTEM_SETTING)!;
    const baseRecord = { id: "1", setting_key: "k", setting_value: "v", updated_at: new Date() };

    it("should support valid record", () => {
      expect(adapter.supports(baseRecord)).toBe(true);
    });

    it("should normalize correctly", () => {
            const normalized = adapter.normalize(baseRecord, SecurityLifecycle.LIVE, SecurityEnvironment.PRODUCTION);
      expect(normalized.source_type).toBe(SecurityEventSource.SYSTEM_SETTING);
    });
  });

  describe("Registry fallback", () => {
    it("should return null for malformed record", () => {
      const record = { id: "1", malformed: true };
      expect(getAdapterForRecord(record)).toBeNull();
    });
  });
});
