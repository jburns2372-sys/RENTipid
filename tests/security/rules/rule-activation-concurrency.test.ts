/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
/**
 * Gate 3D Evidence — Activation Concurrency
 *
 * Proves:
 * - Valid DRAFT activation succeeds
 * - Other DRAFT versions remain DRAFT (activation does NOT modify them)
 * - Sequential active-version conflict is handled
 * - Concurrent active-version conflict is handled
 * - Exactly one ACTIVE version remains
 * - Controlled privacy-safe conflict result
 * - No DetectionEvaluationCheckpoint created
 */
import { PrismaClient, DetectionRuleStatus, SecurityDomain, SecurityEventClassification, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula } from "@prisma/client";
import { createDraftRule, activateRule } from "../../../src/lib/security/rules/rule.service";
import * as auth from "../../../src/lib/security/authorization";
import { RuleTypedConfiguration } from "../../../src/lib/security/rules/rule-validation.service";

const prisma = new PrismaClient();

jest.mock("../../../src/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn(),
  getCurrentDatabaseUser: jest.fn(),
}));

const validConfig: RuleTypedConfiguration = {
  name: "Activation Concurrency Rule",
  description: "A rule for activation concurrency testing",
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

describe("Activation Concurrency", () => {
  const MOCK_USER_ID = "act-conc-user-123";
  const MOCK_IP_CONTEXT = { ip: "127.0.0.1", geo: null, is_vpn: null };

  beforeAll(async () => {
    try {
      await prisma.user.create({
        data: {
          id: MOCK_USER_ID,
          email: "act-conc-test@example.com",
          full_name: "Act Conc Test",
          account_type: "Individual",
          role: "Super Admin",
          status: "Verified"
        }
      });
    } catch (_e) { /* already exists */ }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    (auth.requireSecurityPermission as jest.Mock).mockResolvedValue({
      user_id: MOCK_USER_ID,
      request_ip_context: MOCK_IP_CONTEXT,
    });
    await prisma.ruleEvaluationLog.deleteMany({});
    await prisma.detectionEvaluationCheckpoint.deleteMany({});
    await prisma.securityAlertEvidence.deleteMany({});
    await prisma.securityAlert.deleteMany({});
    await prisma.detectionRule.deleteMany({});
  });

  afterAll(async () => {
    await prisma.ruleEvaluationLog.deleteMany({});
    await prisma.detectionEvaluationCheckpoint.deleteMany({});
    await prisma.securityAlertEvidence.deleteMany({});
    await prisma.securityAlert.deleteMany({});
    await prisma.detectionRule.deleteMany({});
    await prisma.$disconnect();
  });

  it("valid DRAFT activation succeeds", async () => {
    const create = await createDraftRule("ACT-CONC-001", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");

    const act = await activateRule(create.rule.id, MOCK_USER_ID);
    if (!act.success) throw new Error("failed");
    if (act.success) {
      expect(act.rule.status).toBe(DetectionRuleStatus.ACTIVE);
      expect(act.rule.activated_at).toBeInstanceOf(Date);
      expect(act.rule.activated_by_id).toBe(MOCK_USER_ID);
    }
  });

  it("other DRAFT versions remain DRAFT after activation", async () => {
    const v1 = await createDraftRule("ACT-CONC-002", validConfig, validDsl, MOCK_USER_ID);
    const v2 = await createDraftRule("ACT-CONC-002", validConfig, validDsl, MOCK_USER_ID);
    const v3 = await createDraftRule("ACT-CONC-002", validConfig, validDsl, MOCK_USER_ID);
    if (!v1.success || !v2.success || !v3.success) throw new Error("setup failed");

    // Activate v2 only
    const act = await activateRule(v2.rule.id, MOCK_USER_ID);
    if (!act.success) throw new Error("failed");

    // v1 and v3 must still be DRAFT
    const dbV1 = await prisma.detectionRule.findUnique({ where: { id: v1.rule.id } });
    const dbV3 = await prisma.detectionRule.findUnique({ where: { id: v3.rule.id } });
    expect(dbV1.status).toBe(DetectionRuleStatus.DRAFT);
    expect(dbV3.status).toBe(DetectionRuleStatus.DRAFT);
  });

  it("sequential active-version conflict is handled", async () => {
    const v1 = await createDraftRule("ACT-CONC-003", validConfig, validDsl, MOCK_USER_ID);
    const v2 = await createDraftRule("ACT-CONC-003", validConfig, validDsl, MOCK_USER_ID);
    if (!v1.success || !v2.success) throw new Error("setup failed");

    // Activate v1
    const act1 = await activateRule(v1.rule.id, MOCK_USER_ID);
    if (!act1.success) throw new Error("failed");

    // Attempt to activate v2 — should fail with ACTIVE_VERSION_CONFLICT
    const act2 = await activateRule(v2.rule.id, MOCK_USER_ID);
    if (act2.success) throw new Error("expected failure");
    if (!act2.success) {
      expect(act2.error).toBe("ACTIVE_VERSION_CONFLICT");
    }
  });

  it("concurrent active-version conflict is handled", async () => {
    const v1 = await createDraftRule("ACT-CONC-004", validConfig, validDsl, MOCK_USER_ID);
    const v2 = await createDraftRule("ACT-CONC-004", validConfig, validDsl, MOCK_USER_ID);
    if (!v1.success || !v2.success) throw new Error("setup failed");

    // Fire both activations concurrently
    const [act1, act2] = await Promise.all([
      activateRule(v1.rule.id, MOCK_USER_ID),
      activateRule(v2.rule.id, MOCK_USER_ID),
    ]);

    // Exactly one should succeed, one should fail
    const successes = [act1, act2].filter(a => a.success);
    const failures = [act1, act2].filter(a => !a.success);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    // The failure must be a controlled error, not a raw DB error
    if (!failures[0].success) {
      expect(failures[0].error).toBe("ACTIVE_VERSION_CONFLICT");
    }
  });

  it("exactly one ACTIVE version remains after conflict", async () => {
    const v1 = await createDraftRule("ACT-CONC-005", validConfig, validDsl, MOCK_USER_ID);
    const v2 = await createDraftRule("ACT-CONC-005", validConfig, validDsl, MOCK_USER_ID);
    if (!v1.success || !v2.success) throw new Error("setup failed");

    await Promise.all([
      activateRule(v1.rule.id, MOCK_USER_ID),
      activateRule(v2.rule.id, MOCK_USER_ID),
    ]);

    const activeRules = await prisma.detectionRule.findMany({
      where: { rule_id: "ACT-CONC-005", status: DetectionRuleStatus.ACTIVE }
    });
    expect(activeRules).toHaveLength(1);
  });

  it("no DetectionEvaluationCheckpoint created during activation", async () => {
    const checkpointsBefore = await prisma.detectionEvaluationCheckpoint.count();

    const create = await createDraftRule("ACT-CONC-006", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");
    await activateRule(create.rule.id, MOCK_USER_ID);

    const checkpointsAfter = await prisma.detectionEvaluationCheckpoint.count();
    expect(checkpointsAfter).toBe(checkpointsBefore);
  });
});
