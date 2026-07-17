import { PrismaClient, DetectionRuleStatus } from "@prisma/client";
import { RuleInitializationService } from "../../../src/lib/security/rules/rule-initialization.service";
import { initializeRulesAction } from "../../../src/app/dashboard/admin/security/rules/actions";
import { hasPermission } from "../../../src/lib/permissions";

const prisma = new PrismaClient();

describe("Gate 3G - Controlled Draft-Rule Initialization", () => {
  let superAdminUser: any;
  let nonVerifiedAdmin: any;
  let normalUser: any;
  let staleRoleUser: any;

  beforeAll(async () => {
    // Create test users
    superAdminUser = await prisma.user.create({
      data: {
        email: `superadmin-g3g-${Date.now()}@test.com`,
        password_hash: "hash",
        full_name: "G3G Super Admin",
        role: "Super Admin",
        status: "Verified",
        mobile_number: `+1555${Date.now().toString().slice(-7)}`,
        account_type: "Individual"
      }
    });

    nonVerifiedAdmin = await prisma.user.create({
      data: {
        email: `unverified-g3g-${Date.now()}@test.com`,
        password_hash: "hash",
        full_name: "G3G Unverified Admin",
        role: "Super Admin",
        status: "Pending", // Not verified
        mobile_number: `+1555${(Date.now() + 1).toString().slice(-7)}`,
        account_type: "Individual"
      }
    });

    normalUser = await prisma.user.create({
      data: {
        email: `normal-g3g-${Date.now()}@test.com`,
        password_hash: "hash",
        full_name: "G3G Normal User",
        role: "Renter",
        status: "Verified",
        mobile_number: `+1555${(Date.now() + 2).toString().slice(-7)}`,
        account_type: "Individual"
      }
    });
    
    staleRoleUser = await prisma.user.create({
      data: {
        email: `stale-g3g-${Date.now()}@test.com`,
        password_hash: "hash",
        full_name: "G3G Stale Admin",
        role: "Admin", // Not super admin
        status: "Verified",
        mobile_number: `+1555${(Date.now() + 3).toString().slice(-7)}`,
        account_type: "Individual"
      }
    });
  });

  afterAll(async () => {
    // Cleanup rules
    await prisma.detectionRule.deleteMany({
      where: { rule_id: { in: ['PAY-WEBHOOK-FAIL-01', 'SECURITY-SETTING-CHANGE-01'] } }
    });
    // Cleanup users
    await prisma.user.deleteMany({
      where: { id: { in: [superAdminUser.id, nonVerifiedAdmin.id, normalUser.id, staleRoleUser.id] } }
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up rules after each test to ensure isolation for initialization tests
    await prisma.detectionRule.deleteMany({
      where: { rule_id: { in: ['PAY-WEBHOOK-FAIL-01', 'SECURITY-SETTING-CHANGE-01'] } }
    });
    await prisma.auditLog.deleteMany({
      where: { actor_user_id: superAdminUser.id }
    });
  });

  describe("RuleInitializationService", () => {
    it("should successfully initialize draft rules", async () => {
      const results = await RuleInitializationService.initializeInitialDrafts(superAdminUser.id);
      
      expect(results.length).toBe(2);
      expect(results[0].result).toBe("CREATED");
      expect(results[1].result).toBe("CREATED");

      // Verify they are created as DRAFT
      const rules = await prisma.detectionRule.findMany({
        where: { rule_id: { in: ['PAY-WEBHOOK-FAIL-01', 'SECURITY-SETTING-CHANGE-01'] } }
      });

      expect(rules.length).toBe(2);
      rules.forEach(rule => {
        expect(rule.status).toBe(DetectionRuleStatus.DRAFT);
      });

      // Verify audit logs
      const audits = await prisma.auditLog.findMany({
        where: { actor_user_id: superAdminUser.id, action: "SOC_RULE_INITIALIZED" }
      });
      expect(audits.length).toBe(2);
    });

    it("should identically return ALREADY_INITIALIZED_EQUIVALENT on rerun", async () => {
      // First run
      await RuleInitializationService.initializeInitialDrafts(superAdminUser.id);
      
      // Second run
      const results = await RuleInitializationService.initializeInitialDrafts(superAdminUser.id);
      expect(results.length).toBe(2);
      expect(results[0].result).toBe("ALREADY_INITIALIZED_EQUIVALENT");
      expect(results[1].result).toBe("ALREADY_INITIALIZED_EQUIVALENT");
      
      // Still only 2 rules
      const rules = await prisma.detectionRule.findMany({
        where: { rule_id: { in: ['PAY-WEBHOOK-FAIL-01', 'SECURITY-SETTING-CHANGE-01'] } }
      });
      expect(rules.length).toBe(2);
    });

    it("should return INITIALIZATION_CONFLICT if a rule exists with different fields", async () => {
      // Create conflicting rule first
      await prisma.detectionRule.create({
        data: {
          rule_id: "PAY-WEBHOOK-FAIL-01",
          version: 1,
          name: "Different Name",
          description: "Desc",
          status: "DRAFT",
          security_domain: "PAYMENT_SECURITY",
          result_classification: "POLICY_VIOLATION",
          base_severity: "LOW", // Different severity
          base_confidence_score: 10,
          threshold_count: 5,
          window_seconds: 300,
          cooldown_seconds: 3600,
          max_evidence_events: 10,
          evaluation_timeout_ms: 1000,
          correlation_subject_type: "GLOBAL",
          deduplication_strategy: "WINDOW_BUCKET",
          confidence_formula: "STATIC_BASE",
          created_by_type: "SYSTEM_SEED",
          evaluation_dsl: {}
        }
      });

      const results = await RuleInitializationService.initializeInitialDrafts(superAdminUser.id);
      
      const conflictResult = results.find(r => r.rule_id === "PAY-WEBHOOK-FAIL-01");
      expect(conflictResult?.result).toBe("INITIALIZATION_CONFLICT");
      
      const audits = await prisma.auditLog.findMany({
        where: { actor_user_id: superAdminUser.id, action: "SOC_RULE_INITIALIZATION_CONFLICT" }
      });
      expect(audits.length).toBe(1);
    });

    it("should reject unverified or non-Super Admin roles", async () => {
      await expect(RuleInitializationService.initializeInitialDrafts(nonVerifiedAdmin.id)).rejects.toThrow(/Unauthorized/);
      await expect(RuleInitializationService.initializeInitialDrafts(normalUser.id)).rejects.toThrow(/Unauthorized/);
      await expect(RuleInitializationService.initializeInitialDrafts(staleRoleUser.id)).rejects.toThrow(/Unauthorized/);
      
      const rules = await prisma.detectionRule.findMany({
        where: { rule_id: { in: ['PAY-WEBHOOK-FAIL-01', 'SECURITY-SETTING-CHANGE-01'] } }
      });
      expect(rules.length).toBe(0);
    });
  });

  describe("Server Action and Session Verification", () => {
    // Note: We cannot natively mock `getServerSession` cleanly without next-auth setup in the test environment,
    // but we can test the `hasPermission` integration manually.
    it("should verify security.rules permissions properly", () => {
      expect(hasPermission('Super Admin', 'security_rules', 'initialize')).toBe(true);
      expect(hasPermission('Super Admin', 'security_rules', 'view')).toBe(true);
      expect(hasPermission('Admin', 'security_rules', 'initialize')).toBe(false);
      expect(hasPermission('Renter', 'security_rules', 'initialize')).toBe(false);
    });
  });
});
