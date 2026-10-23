import { PrismaClient, DetectionRuleStatus } from "@prisma/client";
import { RuleInitializationService } from "../../../src/lib/security/rules/rule-initialization.service";

const prisma = new PrismaClient();

describe("Gate 4D-A: Native API, Web, and Bot Detection", () => {
  let superAdminUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.upsert({
      where: { email: "gate4da-super-admin@test.com" },
      update: { role: "Super Admin", status: "Verified" },
      create: {
        email: "gate4da-super-admin@test.com",
        password_hash: "hash",
        full_name: "G4DA Super Admin Test",
        role: "Super Admin",
        status: "Verified",
        account_type: "Individual"
      }
    });
    superAdminUserId = user.id;
  });

  afterAll(async () => {
    const ruleIds = [
      'API-RATE-ABUSE-01',
      'API-AUTHORIZATION-PROBE-01',
      'API-RESOURCE-ENUMERATION-01',
      'WEB-CSRF-FAILURE-01',
      'BOT-SCRAPING-01',
      'BOT-BOOKING-ABUSE-01'
    ];

    await prisma.auditLog.deleteMany({
      where: {
        actor_user_id: superAdminUserId,
        action: "SOC_RULE_INITIALIZED",
        OR: [
          { target_id: { in: ruleIds } },
          { target_id: null }
        ]
      }
    });

    await prisma.detectionRule.deleteMany({
      where: { rule_id: { in: ruleIds } }
    });

    await prisma.user.delete({
      where: { id: superAdminUserId }
    });

    await prisma.$disconnect();
  });

  describe("A. CORRELATION SEMANTICS & SOURCE COMPATIBILITY", () => {
    it("should initialize all Phase 4 rules successfully as DRAFT", async () => {
      const results = await RuleInitializationService.initializeInitialDrafts(superAdminUserId);
      const apiRules = results.filter(r => r.rule_id.startsWith("API-") || r.rule_id.startsWith("WEB-") || r.rule_id.startsWith("BOT-"));
      
      expect(apiRules.length).toBe(6);
      expect(apiRules.every(r => r.result === "CREATED" || r.result === "ALREADY_INITIALIZED_EQUIVALENT")).toBe(true);

      const rulesInDb = await prisma.detectionRule.findMany({
        where: { rule_id: { in: apiRules.map(r => r.rule_id) } }
      });

      expect(rulesInDb.length).toBe(6);
      expect(rulesInDb.every(r => r.status === DetectionRuleStatus.DRAFT)).toBe(true);
    });
  });

  describe("H. CLEANUP & PRIVACY", () => {
    it("should ensure target_resource_id is not overloaded inside the rules (we use CORRELATION_KEY)", async () => {
      const rules = await prisma.detectionRule.findMany({
        where: { rule_id: { in: ["API-RATE-ABUSE-01", "API-AUTHORIZATION-PROBE-01"] } }
      });
      for (const rule of rules) {
        expect(rule.correlation_subject_type).toBe("CORRELATION_KEY");
      }
    });
  });
});
