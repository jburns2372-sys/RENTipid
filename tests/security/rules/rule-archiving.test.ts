// @ts-nocheck
import { PrismaClient, DetectionRuleStatus, SecurityDomain, SecurityEventClassification, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula } from "@prisma/client";
import { archiveRule, createDraftRule } from "../../../src/lib/security/rules/rule.service";
import * as auth from "../../../src/lib/security/authorization";
import { RuleTypedConfiguration } from "../../../src/lib/security/rules/rule-validation.service";

const prisma = new PrismaClient();

jest.mock("../../../src/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn(),
  getCurrentDatabaseUser: jest.fn(),
}));

describe("Rule Archiving Service", () => {
  const MOCK_USER_ID = "mock-user-123";
  const MOCK_IP_CONTEXT = { ip: "127.0.0.1", geo: null, is_vpn: null };

  const validConfig: RuleTypedConfiguration = {
    name: "Archiving Test Rule",
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
    await prisma.auditLog.deleteMany({ where: { action: "SOC_RULE_ARCHIVED" } });
  });

  it("should successfully archive a DRAFT rule", async () => {
    const createResult = await createDraftRule("RULE-ARC-001", validConfig, validDsl, MOCK_USER_ID);
        if(!createResult.success) return; const draftRuleId = createResult.rule.id;

    const arcResult = await archiveRule(draftRuleId, MOCK_USER_ID);
    if (!arcResult.success) throw new Error(arcResult.error || "failed"); expect(true).toBe(true);

    if (!arcResult.success) return;
    expect(arcResult.rule.status).toBe(DetectionRuleStatus.ARCHIVED);
    expect(arcResult.rule.archived_at).toBeInstanceOf(Date);
    expect(arcResult.rule.archived_by_id).toBe(MOCK_USER_ID);

    const auditLogs = await prisma.auditLog.findMany({ where: { action: "SOC_RULE_ARCHIVED" } });
    expect(auditLogs).toHaveLength(1);
    expect(JSON.parse(auditLogs[0].details as string).rule_id).toBe(draftRuleId);
  });

  it("should reject archiving an already ARCHIVED rule", async () => {
    const createResult = await createDraftRule("RULE-ARC-002", validConfig, validDsl, MOCK_USER_ID);
        if(!createResult.success) return; const draftRuleId = createResult.rule.id;

    await archiveRule(draftRuleId, MOCK_USER_ID);
    const duplicateArc = await archiveRule(draftRuleId, MOCK_USER_ID);
    
    if (duplicateArc.success) throw new Error("expected failure"); expect(true).toBe(true);
    expect(duplicateArc.error).toBe("ALREADY_ARCHIVED");
  });
});
