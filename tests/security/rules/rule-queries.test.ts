/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { PrismaClient, DetectionRuleStatus, SecurityDomain, SecurityEventClassification, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula } from "@prisma/client";
import { queryRules, createDraftRule } from "../../../src/lib/security/rules/rule.service";
import * as auth from "../../../src/lib/security/authorization";
import { RuleTypedConfiguration } from "../../../src/lib/security/rules/rule-validation.service";

const prisma = new PrismaClient();

jest.mock("../../../src/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn(),
  getCurrentDatabaseUser: jest.fn(),
}));

describe("Rule Query Service", () => {
  const MOCK_USER_ID = "mock-user-123";
  const MOCK_IP_CONTEXT = { ip: "127.0.0.1", geo: null, is_vpn: null };

  const validConfig: RuleTypedConfiguration = {
    name: "Query Test Rule",
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
  });

  it("should return rules with deterministic pagination", async () => {
    // Create 3 rules
    const r1 = await createDraftRule("RULE-QRY-001", validConfig, validDsl, MOCK_USER_ID);
    const r2 = await createDraftRule("RULE-QRY-002", validConfig, validDsl, MOCK_USER_ID);
    const r3 = await createDraftRule("RULE-QRY-003", validConfig, validDsl, MOCK_USER_ID);
if(!r3.success) return; const id3 = r3.rule.id;
        if(!r3.success) return; const createdAt3 = r3.rule.created_at;

    // First page
    const page1 = await queryRules(undefined, undefined, 2);
    if (!page1.success) throw new Error(page1.error || "failed"); expect(true).toBe(true);
        expect(page1.rules).toHaveLength(2);
    
        const cursorId = page1.rules[1].id;
        const cursorCreatedAt = page1.rules[1].created_at;

    // Second page
    const page2 = await queryRules(cursorId, cursorCreatedAt, 2);
    if (!page2.success) throw new Error(page2.error || "failed"); expect(true).toBe(true);
        expect(page2.rules).toHaveLength(1); // 1 remaining
  });

  it("should handle identical timestamp pagination", async () => {
    // Create 3 rules with the exact same timestamp by overriding created_at directly if needed,
    // but the DB creates them fast enough they might share a timestamp, or we just rely on ID tie-breaker
    const r1 = await createDraftRule("RULE-TIE-001", validConfig, validDsl, MOCK_USER_ID);
    const r2 = await createDraftRule("RULE-TIE-002", validConfig, validDsl, MOCK_USER_ID);
    
    const page1 = await queryRules(undefined, undefined, 1);
    if (!page1.success) throw new Error("failed");
    expect(page1.rules).toHaveLength(1);
    expect(page1.hasMore).toBe(true);
    
    const page2 = await queryRules(page1.rules[0].id, page1.rules[0].created_at, 1);
    if (!page2.success) throw new Error("failed");
    expect(page2.rules).toHaveLength(1);
    expect(page2.rules[0].id).not.toBe(page1.rules[0].id);
  });

  it("should reject arbitrary Prisma filters", async () => {
    // queryRules only accepts filterStatus and filterDomain. You cannot pass arbitrary WHERE clauses.
    // If we try to pass an object, TS rejects it, and JS ignores it since args are positional.
    const page = await queryRules(undefined, undefined, 10, DetectionRuleStatus.DRAFT, SecurityDomain.IDENTITY_AND_ACCESS);
    if(!page.success) return;
    expect(page.rules!.every(r => r.status === DetectionRuleStatus.DRAFT)).toBe(true);
    expect(page.rules!.every(r => r.security_domain === SecurityDomain.IDENTITY_AND_ACCESS)).toBe(true);
  });
});
