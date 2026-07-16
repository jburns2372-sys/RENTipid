/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { PrismaClient, DetectionRuleStatus, SecurityDomain, SecurityEventClassification, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula } from "@prisma/client";
import { createDraftRule } from "../../../src/lib/security/rules/rule.service";
import * as auth from "../../../src/lib/security/authorization";
import { RuleTypedConfiguration } from "../../../src/lib/security/rules/rule-validation.service";

const prisma = new PrismaClient();

jest.mock("../../../src/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn(),
  getCurrentDatabaseUser: jest.fn(),
}));

describe("Rule Creation Service", () => {
  const MOCK_USER_ID = "mock-user-123";
  const MOCK_IP_CONTEXT = { ip: "127.0.0.1", geo: null, is_vpn: null };

  const validConfig: RuleTypedConfiguration = {
    name: "Test Rule",
    description: "A test rule",
    base_severity: SecuritySeverity.MEDIUM,
    threshold_count: 3,
    window_seconds: 3600,
    cooldown_seconds: 300,
    max_evidence_events: 5,
    correlation_subject_type: DetectionCorrelationSubject.ACTOR_USER_ID,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    security_domain: SecurityDomain.IDENTITY_AND_ACCESS,
    result_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
    base_confidence_score: 50,
    evaluation_timeout_ms: 500,
  };

  const validDsl = { field: "event_code", operator: "EQUALS", value: "LOGIN_FAILED" };

  beforeEach(async () => {
    jest.clearAllMocks();
    try { await prisma.user.create({ data: { id: MOCK_USER_ID, email: "test" + Math.random() + "@example.com", full_name: "Mock User", account_type: "Individual", role: "Renter", status: "Verified" } }); } catch(e) {}
    (auth.requireSecurityPermission as jest.Mock).mockResolvedValue({ user_id: MOCK_USER_ID, request_ip_context: MOCK_IP_CONTEXT });
    await prisma.ruleEvaluationLog.deleteMany({});
    await prisma.detectionEvaluationCheckpoint.deleteMany({});
    await prisma.securityAlertEvidence.deleteMany({});
    await prisma.securityAlert.deleteMany({});
    await prisma.detectionRule.deleteMany({});
    await prisma.auditLog.deleteMany({ where: { action: "SOC_RULE_CREATED" } });
  });

  it("should create a valid DRAFT rule and assign version 1", async () => {
    const result = await createDraftRule("RULE-001", validConfig, validDsl, MOCK_USER_ID);
    
    if (!result.success) throw new Error(result.error || "failed"); expect(true).toBe(true);
    if (!result.success) return; // For TS typing
    expect(result.rule.version).toBe(1);
    expect(result.rule.status).toBe(DetectionRuleStatus.DRAFT);
    expect(result.rule.created_by_user_id).toBe(MOCK_USER_ID);

    // Verify audit log
    const auditLogs = await prisma.auditLog.findMany({ where: { action: "SOC_RULE_CREATED" } });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].actor_user_id).toBe(MOCK_USER_ID);
    expect(JSON.parse(auditLogs[0].details as string).version).toBe(1);
  });

  it("should increment version for existing rule_id", async () => {
    await createDraftRule("RULE-002", validConfig, validDsl, MOCK_USER_ID);
    const result2 = await createDraftRule("RULE-002", validConfig, validDsl, MOCK_USER_ID);
    
    if (!result2.success) throw new Error(result2.error || "failed"); expect(true).toBe(true);
        expect(result2.rule.version).toBe(2);
  });

  it("should reject creation with invalid config", async () => {
    const invalidConfig = { ...validConfig, threshold_count: 0 }; // Invalid
    const result = await createDraftRule("RULE-003", invalidConfig, validDsl, MOCK_USER_ID);
    
    if (result.success) throw new Error("expected failure"); expect(true).toBe(true);
    expect(result.error).toBe("INVALID_THRESHOLD_COUNT");
  });

  it("should reject creation with invalid DSL", async () => {
    const invalidDsl = { field: "event_code", operator: "CONTAINS", value: 123 }; // Value should be string
    const result = await createDraftRule("RULE-004", validConfig, invalidDsl, MOCK_USER_ID);
    
    if (result.success) throw new Error("expected failure"); expect(true).toBe(true);
    expect(result.error).toBe("DSL_SCHEMA_VALIDATION_FAILED");
  });

  it("should reject creation if permission is denied", async () => {
    (auth.requireSecurityPermission as jest.Mock).mockRejectedValue(new Error("NEXT_REDIRECT"));
    
    await expect(createDraftRule("RULE-005", validConfig, validDsl, MOCK_USER_ID))
      .rejects.toThrow("NEXT_REDIRECT");
  });
});
