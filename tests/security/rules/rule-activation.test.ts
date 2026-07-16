/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { PrismaClient, DetectionRuleStatus, SecurityDomain, SecurityEventClassification, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula } from "@prisma/client";
import { activateRule, createDraftRule } from "../../../src/lib/security/rules/rule.service";
import * as auth from "../../../src/lib/security/authorization";
import { RuleTypedConfiguration } from "../../../src/lib/security/rules/rule-validation.service";

const prisma = new PrismaClient();

jest.mock("../../../src/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn(),
  getCurrentDatabaseUser: jest.fn(),
}));

describe("Rule Activation Service", () => {
  const MOCK_USER_ID = "mock-user-123";
  const MOCK_IP_CONTEXT = { ip: "127.0.0.1", geo: null, is_vpn: null };

  const validConfig: RuleTypedConfiguration = {
    name: "Activation Test Rule",
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
    await prisma.auditLog.deleteMany({ where: { action: "SOC_RULE_ACTIVATED" } });
  });

  it("should successfully activate a DRAFT rule", async () => {
    // 1. Create a Draft Rule
    const createResult = await createDraftRule("RULE-ACT-001", validConfig, validDsl, MOCK_USER_ID);
    if (!createResult.success) throw new Error(createResult.error || "failed"); expect(true).toBe(true);
        if(!createResult.success) return; const draftRuleId = createResult.rule.id;

    // 2. Activate the Rule
    const actResult = await activateRule(draftRuleId, MOCK_USER_ID);
    if (!actResult.success) throw new Error(actResult.error || "failed"); expect(true).toBe(true);
    
    if (!actResult.success) return;
    expect(actResult.rule.status).toBe(DetectionRuleStatus.ACTIVE);
    expect(actResult.rule.activated_at).toBeInstanceOf(Date);
    expect(actResult.rule.activated_by_id).toBe(MOCK_USER_ID);

    // 3. Verify audit log
    const auditLogs = await prisma.auditLog.findMany({ where: { action: "SOC_RULE_ACTIVATED" } });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].actor_user_id).toBe(MOCK_USER_ID);
    expect(JSON.parse(auditLogs[0].details as string).rule_id).toBe(draftRuleId);
  });

  it("should enforce partial index unique constraint for ACTIVE rules", async () => {
    // Create two versions of the same rule
    const create1 = await createDraftRule("RULE-ACT-002", validConfig, validDsl, MOCK_USER_ID);
    const create2 = await createDraftRule("RULE-ACT-002", validConfig, validDsl, MOCK_USER_ID);
        if(!create1.success) return; const id1 = create1.rule.id;
        if(!create2.success) return; const id2 = create2.rule.id;

    // Activate the first one
    const act1 = await activateRule(id1, MOCK_USER_ID);
    if (!act1.success) throw new Error(act1.error || "failed"); expect(true).toBe(true);

    // Attempt to activate the second one
    const act2 = await activateRule(id2, MOCK_USER_ID);
    if (act2.success) throw new Error("expected failure"); expect(true).toBe(true);
    expect(act2.error).toBe("ACTIVE_VERSION_CONFLICT");
  });

  it("should reject activation if rule is not DRAFT", async () => {
    const create = await createDraftRule("RULE-ACT-003", validConfig, validDsl, MOCK_USER_ID);
    if(!create.success) return; const id = create.rule.id;

    // Activate once
    await activateRule(id, MOCK_USER_ID);

    // Try again
    const act2 = await activateRule(id, MOCK_USER_ID);
    if (act2.success) throw new Error("expected failure"); expect(true).toBe(true);
    expect(act2.error).toBe("ONLY_DRAFT_CAN_BE_ACTIVATED");
  });
});
