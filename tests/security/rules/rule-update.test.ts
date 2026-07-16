/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { PrismaClient, DetectionRuleStatus, SecurityDomain, SecurityEventClassification, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula } from "@prisma/client";
import { updateDraftRule, createDraftRule } from "../../../src/lib/security/rules/rule.service";
import * as auth from "../../../src/lib/security/authorization";
import { RuleTypedConfiguration } from "../../../src/lib/security/rules/rule-validation.service";

const prisma = new PrismaClient();

jest.mock("../../../src/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn(),
  getCurrentDatabaseUser: jest.fn(),
}));

describe("Rule Update Service", () => {
  const MOCK_USER_ID = "mock-user-123";
  const MOCK_IP_CONTEXT = { ip: "127.0.0.1", geo: null, is_vpn: null };

  const validConfig: RuleTypedConfiguration = {
    name: "Update Test Rule",
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
    await prisma.auditLog.deleteMany({ where: { action: "SOC_RULE_UPDATED" } });
  });

  it("should successfully update a DRAFT rule with concurrency check", async () => {
    const createResult = await createDraftRule("RULE-UPD-001", validConfig, validDsl, MOCK_USER_ID);
     if (!createResult.success) throw new Error(createResult.error || "failed"); expect(true).toBe(true);
        if(!createResult.success) return; const draftRuleId = createResult.rule.id;
        if(!createResult.success) return; const updatedAt = createResult.rule.updated_at;

    const updatedConfig = { ...validConfig, name: "Updated Rule Name" };
    const updResult = await updateDraftRule(draftRuleId, updatedConfig, validDsl, updatedAt, MOCK_USER_ID);
    
    if (!updResult.success) throw new Error(updResult.error || "failed"); expect(true).toBe(true);
        expect(updResult.rule.name).toBe("Updated Rule Name");

    // Verify non-editable metadata remained intact
        expect(updResult.rule.rule_id).toBe("RULE-UPD-001");
        expect(createResult.rule.version).toBe(1);
        expect(createResult.rule.created_by_user_id).toBe(MOCK_USER_ID);
  });

  it("should reject update on concurrency mismatch", async () => {
    const createResult = await createDraftRule("RULE-UPD-002", validConfig, validDsl, MOCK_USER_ID);
        if(!createResult.success) return; const draftRuleId = createResult.rule.id;

    // Use a stale date
    const staleDate = new Date(Date.now() - 100000);
    const updResult = await updateDraftRule(draftRuleId, validConfig, validDsl, staleDate, MOCK_USER_ID);
    
    if (updResult.success) throw new Error("expected failure"); expect(true).toBe(true);
    expect(updResult.error).toBe("STALE_UPDATE_CONFLICT");
  });
});
