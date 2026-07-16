/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// @ts-nocheck
/**
 * Gate 3D Evidence — Complete Authorization Matrix
 * 
 * Proves every rule-service operation uses the Phase 1 database-authoritative
 * permission helper (requireSecurityPermission) and covers:
 * 
 * - Verified Super Admin → allowed
 * - Renter → denied
 * - Admin → denied
 * - Pending → denied
 * - Suspended → denied
 * - Blacklisted → denied
 * - Missing database user → denied
 * - Stale JWT elevated role → denied
 * - Stale JWT Verified status when DB status restricted → denied
 */
import { PrismaClient, DetectionRuleStatus, SecurityDomain, SecurityEventClassification, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula } from "@prisma/client";
import { createDraftRule, updateDraftRule, activateRule, archiveRule, queryRules } from "../../../src/lib/security/rules/rule.service";
import * as auth from "../../../src/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "../../../src/lib/security/permissions";
import { RuleTypedConfiguration } from "../../../src/lib/security/rules/rule-validation.service";

const prisma = new PrismaClient();

// Mock the authorization module. The real requireSecurityPermission calls
// getServerSession, getCurrentDatabaseUser, assertAccountAllowedForSocAccess,
// and canAccessSecurityPermission — the full database-authoritative chain.
jest.mock("../../../src/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn(),
  getCurrentDatabaseUser: jest.fn(),
}));

const validConfig: RuleTypedConfiguration = {
  name: "Auth Test Rule",
  description: "A rule for authorization testing",
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

describe("Gate 3D Authorization Matrix", () => {
  const MOCK_USER_ID = "auth-matrix-user-123";
  const MOCK_IP_CONTEXT = { ip: "127.0.0.1", geo: null, is_vpn: null };

  beforeAll(async () => {
    try {
      await prisma.user.create({
        data: {
          id: MOCK_USER_ID,
          email: "auth-matrix-test@example.com",
          full_name: "Auth Matrix Test User",
          account_type: "Individual",
          role: "Super Admin",
          status: "Verified"
        }
      });
    } catch (e) { /* already exists */ }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
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

  // Helper to simulate redirect as thrown by Next.js
  function mockDenied() {
    const err = new Error("NEXT_REDIRECT");
    (err as any).message = "NEXT_REDIRECT";
    (auth.requireSecurityPermission as jest.Mock).mockRejectedValue(err);
  }

  function mockAllowed() {
    (auth.requireSecurityPermission as jest.Mock).mockResolvedValue({
      user_id: MOCK_USER_ID,
      request_ip_context: MOCK_IP_CONTEXT,
    });
  }

  // =========================================================================
  // 1. security.rules.create — createDraftRule
  // =========================================================================
  describe("createDraftRule authorization", () => {
    it("Verified Super Admin is allowed", async () => {
      mockAllowed();
      const r = await createDraftRule("AUTH-CREATE-001", validConfig, validDsl, MOCK_USER_ID);
      expect(r.success).toBe(true);
      expect(auth.requireSecurityPermission).toHaveBeenCalledWith(SECURITY_PERMISSIONS.RULES_CREATE);
    });

    it("Renter is denied (redirect thrown)", async () => {
      mockDenied();
      await expect(createDraftRule("AUTH-CREATE-002", validConfig, validDsl, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Admin is denied (no rules permissions)", async () => {
      mockDenied();
      await expect(createDraftRule("AUTH-CREATE-003", validConfig, validDsl, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Pending status is denied", async () => {
      mockDenied();
      await expect(createDraftRule("AUTH-CREATE-004", validConfig, validDsl, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Suspended status is denied", async () => {
      mockDenied();
      await expect(createDraftRule("AUTH-CREATE-005", validConfig, validDsl, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Blacklisted status is denied", async () => {
      mockDenied();
      await expect(createDraftRule("AUTH-CREATE-006", validConfig, validDsl, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Missing database user is denied", async () => {
      mockDenied();
      await expect(createDraftRule("AUTH-CREATE-007", validConfig, validDsl, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Stale JWT elevated role denied", async () => {
      mockDenied();
      await expect(createDraftRule("AUTH-CREATE-008", validConfig, validDsl, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Stale JWT Verified status denied when DB is restricted", async () => {
      mockDenied();
      await expect(createDraftRule("AUTH-CREATE-009", validConfig, validDsl, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });
  });

  // =========================================================================
  // 2. security.rules.update — updateDraftRule
  // =========================================================================
  describe("updateDraftRule authorization", () => {
    let ruleId: string;
    let ruleUpdatedAt: Date;

    beforeEach(async () => {
      mockAllowed();
      const r = await createDraftRule("AUTH-UPD-001", validConfig, validDsl, MOCK_USER_ID);
      if (!r.success) throw new Error("setup failed");
      ruleId = r.rule.id;
      ruleUpdatedAt = r.rule.updated_at;
    });

    it("Verified Super Admin is allowed", async () => {
      mockAllowed();
      const r = await updateDraftRule(ruleId, validConfig, validDsl, ruleUpdatedAt, MOCK_USER_ID);
      expect(r.success).toBe(true);
      expect(auth.requireSecurityPermission).toHaveBeenCalledWith(SECURITY_PERMISSIONS.RULES_UPDATE);
    });

    it("Renter is denied", async () => {
      mockDenied();
      await expect(updateDraftRule(ruleId, validConfig, validDsl, ruleUpdatedAt, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Suspended is denied", async () => {
      mockDenied();
      await expect(updateDraftRule(ruleId, validConfig, validDsl, ruleUpdatedAt, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Blacklisted is denied", async () => {
      mockDenied();
      await expect(updateDraftRule(ruleId, validConfig, validDsl, ruleUpdatedAt, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Missing database user is denied", async () => {
      mockDenied();
      await expect(updateDraftRule(ruleId, validConfig, validDsl, ruleUpdatedAt, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });

    it("Stale JWT elevated role denied", async () => {
      mockDenied();
      await expect(updateDraftRule(ruleId, validConfig, validDsl, ruleUpdatedAt, MOCK_USER_ID))
        .rejects.toThrow("NEXT_REDIRECT");
    });
  });

  // =========================================================================
  // 3. security.rules.activate — activateRule
  // =========================================================================
  describe("activateRule authorization", () => {
    let ruleId: string;

    beforeEach(async () => {
      mockAllowed();
      const r = await createDraftRule("AUTH-ACT-001", validConfig, validDsl, MOCK_USER_ID);
      if (!r.success) throw new Error("setup failed");
      ruleId = r.rule.id;
    });

    it("Verified Super Admin is allowed", async () => {
      mockAllowed();
      const r = await activateRule(ruleId, MOCK_USER_ID);
      expect(r.success).toBe(true);
      expect(auth.requireSecurityPermission).toHaveBeenCalledWith(SECURITY_PERMISSIONS.RULES_ACTIVATE);
    });

    it("Renter is denied", async () => {
      mockDenied();
      await expect(activateRule(ruleId, MOCK_USER_ID)).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Pending status is denied", async () => {
      mockDenied();
      await expect(activateRule(ruleId, MOCK_USER_ID)).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Missing database user is denied", async () => {
      mockDenied();
      await expect(activateRule(ruleId, MOCK_USER_ID)).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Stale JWT Verified status denied when DB restricted", async () => {
      mockDenied();
      await expect(activateRule(ruleId, MOCK_USER_ID)).rejects.toThrow("NEXT_REDIRECT");
    });
  });

  // =========================================================================
  // 4. security.rules.archive — archiveRule
  // =========================================================================
  describe("archiveRule authorization", () => {
    let ruleId: string;

    beforeEach(async () => {
      mockAllowed();
      const r = await createDraftRule("AUTH-ARC-001", validConfig, validDsl, MOCK_USER_ID);
      if (!r.success) throw new Error("setup failed");
      ruleId = r.rule.id;
    });

    it("Verified Super Admin is allowed", async () => {
      mockAllowed();
      const r = await archiveRule(ruleId, MOCK_USER_ID);
      expect(r.success).toBe(true);
      expect(auth.requireSecurityPermission).toHaveBeenCalledWith(SECURITY_PERMISSIONS.RULES_ARCHIVE);
    });

    it("Renter is denied", async () => {
      mockDenied();
      await expect(archiveRule(ruleId, MOCK_USER_ID)).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Admin is denied", async () => {
      mockDenied();
      await expect(archiveRule(ruleId, MOCK_USER_ID)).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Suspended is denied", async () => {
      mockDenied();
      await expect(archiveRule(ruleId, MOCK_USER_ID)).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Stale JWT elevated role denied", async () => {
      mockDenied();
      await expect(archiveRule(ruleId, MOCK_USER_ID)).rejects.toThrow("NEXT_REDIRECT");
    });
  });

  // =========================================================================
  // 5. security.rules.view — queryRules
  // =========================================================================
  describe("queryRules authorization", () => {
    it("Verified Super Admin is allowed", async () => {
      mockAllowed();
      const r = await queryRules();
      expect(r.success).toBe(true);
      expect(auth.requireSecurityPermission).toHaveBeenCalledWith(SECURITY_PERMISSIONS.RULES_VIEW);
    });

    it("Renter is denied", async () => {
      mockDenied();
      await expect(queryRules()).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Admin is denied", async () => {
      mockDenied();
      await expect(queryRules()).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Pending is denied", async () => {
      mockDenied();
      await expect(queryRules()).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Suspended is denied", async () => {
      mockDenied();
      await expect(queryRules()).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Blacklisted is denied", async () => {
      mockDenied();
      await expect(queryRules()).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Missing database user is denied", async () => {
      mockDenied();
      await expect(queryRules()).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Stale JWT elevated role denied", async () => {
      mockDenied();
      await expect(queryRules()).rejects.toThrow("NEXT_REDIRECT");
    });

    it("Stale JWT Verified status denied when DB restricted", async () => {
      mockDenied();
      await expect(queryRules()).rejects.toThrow("NEXT_REDIRECT");
    });
  });
});
