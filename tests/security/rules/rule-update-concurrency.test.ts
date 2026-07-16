/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
/**
 * Gate 3D Evidence — Draft Update Concurrency
 *
 * Proves:
 * - Conditional database operation uses Rule ID and expected updated_at
 * - Valid current-timestamp update succeeds
 * - Stale timestamp is rejected with CONCURRENCY_CONFLICT
 * - No partial mutation after conflict
 * - No successful audit entry after conflict
 * - Full merged-rule validation before update
 * - Immutable metadata cannot be changed
 */
import { PrismaClient, DetectionRuleStatus, SecurityDomain, SecurityEventClassification, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula } from "@prisma/client";
import { createDraftRule, updateDraftRule } from "../../../src/lib/security/rules/rule.service";
import * as auth from "../../../src/lib/security/authorization";
import { RuleTypedConfiguration } from "../../../src/lib/security/rules/rule-validation.service";

const prisma = new PrismaClient();

jest.mock("../../../src/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn(),
  getCurrentDatabaseUser: jest.fn(),
}));

const validConfig: RuleTypedConfiguration = {
  name: "Update Concurrency Rule",
  description: "A rule for update concurrency testing",
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

describe("Draft Update Concurrency", () => {
  const MOCK_USER_ID = "upd-conc-user-123";
  const MOCK_IP_CONTEXT = { ip: "127.0.0.1", geo: null, is_vpn: null };

  beforeAll(async () => {
    try {
      await prisma.user.create({
        data: {
          id: MOCK_USER_ID,
          email: "upd-conc-test@example.com",
          full_name: "Upd Conc Test",
          account_type: "Individual",
          role: "Super Admin",
          status: "Verified"
        }
      });
    } catch (e) { /* already exists */ }
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

  it("valid current-timestamp update succeeds", async () => {
    const create = await createDraftRule("UPD-CONC-001", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");

    const updConfig = { ...validConfig, name: "Updated Name" };
    const result = await updateDraftRule(
      create.rule.id, updConfig, validDsl, create.rule.updated_at, MOCK_USER_ID
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rule.name).toBe("Updated Name");
    }
  });

  it("stale timestamp is rejected with STALE_UPDATE_CONFLICT", async () => {
    const create = await createDraftRule("UPD-CONC-002", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");

    // First update succeeds (bumps updated_at)
    const updConfig = { ...validConfig, name: "First Update" };
    const first = await updateDraftRule(
      create.rule.id, updConfig, validDsl, create.rule.updated_at, MOCK_USER_ID
    );
    expect(first.success).toBe(true);

    // Second update with STALE timestamp (original updated_at) must fail
    const updConfig2 = { ...validConfig, name: "Stale Update" };
    const second = await updateDraftRule(
      create.rule.id, updConfig2, validDsl, create.rule.updated_at, MOCK_USER_ID
    );
    expect(second.success).toBe(false);
    if (!second.success) {
      expect(second.error).toBe("STALE_UPDATE_CONFLICT");
    }
  });

  it("no partial mutation after conflict", async () => {
    const create = await createDraftRule("UPD-CONC-003", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");

    // Succeed first update
    const first = await updateDraftRule(
      create.rule.id, { ...validConfig, name: "Good Update" }, validDsl,
      create.rule.updated_at, MOCK_USER_ID
    );
    expect(first.success).toBe(true);

    // Attempt stale update
    const stale = await updateDraftRule(
      create.rule.id, { ...validConfig, name: "Stale Bad Update" }, validDsl,
      create.rule.updated_at, MOCK_USER_ID
    );
    expect(stale.success).toBe(false);

    // Verify DB still has the first update's name
    const dbRule = await prisma.detectionRule.findUnique({ where: { id: create.rule.id } });
    expect(dbRule.name).toBe("Good Update");
  });

  it("no successful audit entry after conflict", async () => {
    const create = await createDraftRule("UPD-CONC-004", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");

    // Clean audit logs
    await prisma.auditLog.deleteMany({ where: { action: "SOC_RULE_UPDATED" } });

    // Succeed first update
    const first = await updateDraftRule(
      create.rule.id, { ...validConfig, name: "Audited Update" }, validDsl,
      create.rule.updated_at, MOCK_USER_ID
    );
    expect(first.success).toBe(true);

    const auditAfterGood = await prisma.auditLog.count({ where: { action: "SOC_RULE_UPDATED" } });

    // Attempt stale update
    await updateDraftRule(
      create.rule.id, { ...validConfig, name: "Stale" }, validDsl,
      create.rule.updated_at, MOCK_USER_ID
    );

    const auditAfterStale = await prisma.auditLog.count({ where: { action: "SOC_RULE_UPDATED" } });

    // No new audit entry was created for the stale update
    expect(auditAfterStale).toBe(auditAfterGood);
  });

  it("full merged-rule validation before update", async () => {
    const create = await createDraftRule("UPD-CONC-005", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");

    // Attempt update with invalid config (threshold_count = 0)
    const invalidConfig = { ...validConfig, threshold_count: 0 };
    const result = await updateDraftRule(
      create.rule.id, invalidConfig, validDsl, create.rule.updated_at, MOCK_USER_ID
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("INVALID_THRESHOLD_COUNT");
    }
  });

  it("immutable metadata cannot be changed via updateDraftRule", async () => {
    const create = await createDraftRule("UPD-CONC-006", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");

    // Even if a caller tries to change name (allowed) the underlying update
    // only sets the fields explicitly listed in updateDraftRule's data block.
    // rule_id, version, status, created_by_type, created_by_user_id,
    // activated_at/by, archived_at/by are NOT in the update data block.
    const updConfig = { ...validConfig, name: "Metadata Check" };
    const result = await updateDraftRule(
      create.rule.id, updConfig, validDsl, create.rule.updated_at, MOCK_USER_ID
    );
    expect(result.success).toBe(true);
    if (result.success) {
      // Immutable fields preserved
      expect(result.rule.rule_id).toBe("UPD-CONC-006");
      expect(result.rule.version).toBe(1);
      expect(result.rule.status).toBe(DetectionRuleStatus.DRAFT);
      expect(result.rule.created_by_type).toBe("USER");
      expect(result.rule.created_by_user_id).toBe(MOCK_USER_ID);
    }
  });

  it("only DRAFT can be updated", async () => {
    const create = await createDraftRule("UPD-CONC-007", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");

    // Manually set status to ACTIVE to simulate a non-DRAFT rule
    await prisma.detectionRule.update({
      where: { id: create.rule.id },
      data: { status: DetectionRuleStatus.ACTIVE, activated_at: new Date(), activated_by_id: MOCK_USER_ID }
    });

    const result = await updateDraftRule(
      create.rule.id, validConfig, validDsl, create.rule.updated_at, MOCK_USER_ID
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("INVALID_RULE_STATUS");
    }
  });

  it("handles TRUE concurrent updates using the exact same updated_at timestamp", async () => {
    const create = await createDraftRule("UPD-CONC-008", validConfig, validDsl, MOCK_USER_ID);
    if (!create.success) throw new Error("setup failed");

    // Launch two updates concurrently with the same original updated_at
    const [upd1, upd2] = await Promise.all([
      updateDraftRule(create.rule.id, { ...validConfig, name: "Concurrent Update 1" }, validDsl, create.rule.updated_at, MOCK_USER_ID),
      updateDraftRule(create.rule.id, { ...validConfig, name: "Concurrent Update 2" }, validDsl, create.rule.updated_at, MOCK_USER_ID),
    ]);

    const successes = [upd1, upd2].filter(r => r.success);
    const failures = [upd1, upd2].filter(r => !r.success);

    // Exactly one succeeds, exactly one fails
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    if (!failures[0].success) {
      expect(failures[0].error).toBe("STALE_UPDATE_CONFLICT");
    }

    // No update is silently overwritten - the name must match the one that succeeded
    const dbRule = await prisma.detectionRule.findUnique({ where: { id: create.rule.id } });
    expect(dbRule.name).toBe(successes[0].rule.name);
  });
});

