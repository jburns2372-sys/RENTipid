import { PrismaClient, SecurityLifecycle, SecurityEnvironment } from "@prisma/client";
import { logApiSecurityEvent } from "../../../src/lib/security/events/writers/api-security-writer";
import { runDetectionEvaluationCycle } from "../../../src/lib/security/rules/evaluator-worker.service";
import { AlertGeneratorService } from "../../../src/lib/security/rules/alert-generator.service";
import { RuleInitializationService } from "../../../src/lib/security/rules/rule-initialization.service";
import { randomUUID } from "crypto";
import { assertSafeLocalTestDatabaseTarget } from "../../../src/lib/test-database-guard";
import { pseudonymizeTelemetryContext } from "../../../src/lib/security/telemetry-hmac";

const prisma = new PrismaClient();
const FIXTURE_NS = `gate4da-r1-${randomUUID()}`;

describe("Gate 4D-A-R1: Native API Detection Evaluator", () => {
  let testUserId: string;

  beforeAll(async () => {
    assertSafeLocalTestDatabaseTarget();
    process.env.SOC_CORRELATION_HMAC_KEY = "test-hmac-key-gate4da-r1-00000000";
    process.env.SECURITY_TELEMETRY_HMAC_KEY = "test-hmac-key-gate4da-r1-00000000";

    const testUser = await prisma.user.create({
      data: {
        email: `sys-${Date.now()}@test.com`,
        full_name: "Sys Test",
        account_type: "Individual",
        status: "Verified",
        role: "ADMIN"
      }
    });
    testUserId = testUser.id;

    // Ensure rules are initialized
    const initRes = await RuleInitializationService.initializeInitialDrafts(testUserId);
    const errors = initRes.filter(r => r.result === "ERROR" && ["API-RATE-ABUSE-01", "API-AUTHORIZATION-PROBE-01"].includes(r.rule_id));
    if (errors.length > 0) {
      console.error("Initialization errors:", errors);
      throw new Error("Failed to initialize required rules");
    }
    
    // Activate the required rules
    await prisma.detectionRule.updateMany({
      where: { rule_id: { in: ["API-RATE-ABUSE-01", "API-AUTHORIZATION-PROBE-01"] } },
      data: { status: "ACTIVE" }
    });
  });

  afterAll(async () => {
    // Cleanup only this namespace
    const apiLogs = await prisma.apiSecurityLog.findMany({
      where: { correlation_id: FIXTURE_NS }
    });
    const logIds = apiLogs.map(l => l.id);

    if (logIds.length > 0) {
      const securityEvents = await prisma.securityEvent.findMany({
        where: { source_record_id: { in: logIds }, source_type: "API_SECURITY_LOG" }
      });
      const eventIds = securityEvents.map(e => e.id);

      if (eventIds.length > 0) {
        await prisma.ruleEvaluationLog.deleteMany({
          where: { candidate_event_id: { in: eventIds } }
        });

        const alerts = await prisma.securityAlert.findMany({
          where: { primary_event_id: { in: eventIds } }
        });
        const alertIds = alerts.map(a => a.id);

        if (alertIds.length > 0) {
          await prisma.securityAlertEvidence.deleteMany({
            where: { alert_id: { in: alertIds } }
          });
          await prisma.auditLog.deleteMany({
            where: { target_id: { in: alertIds } }
          });
          await prisma.securityAlert.deleteMany({
            where: { id: { in: alertIds } }
          });
        }
        await prisma.securityEvent.deleteMany({
          where: { id: { in: eventIds } }
        });
      }
      await prisma.apiSecurityLog.deleteMany({
        where: { id: { in: logIds } }
      });
    }
    
    // Clean checkpoints to prevent lease issues on reruns
    await prisma.detectionEvaluationCheckpoint.deleteMany({});
    
    if (testUserId) {
      await prisma.auditLog.deleteMany({ where: { actor_user_id: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }

    await prisma.$disconnect();
  });

  async function generateEvents(count: number, eventCode: string, ipSuffix: string) {
    for (let i = 0; i < count; i++) {
      await logApiSecurityEvent({
        event_code: eventCode,
        outcome: "DENIED",
        safe_route_family: "/api/test",
        http_method: "GET",
        raw_ip: `10.0.0.${ipSuffix}`,
        policy_family: "TEST_POLICY",
        correlation_id: FIXTURE_NS,
      });
    }
    await new Promise(r => setTimeout(r, 1000)); // wait for async ingestion
    await shiftEventsToPast(eventCode, 16); // bypass SAFETY_MARGIN_MS
  }

  async function evaluateRules() {

    const cycleRes = await runDetectionEvaluationCycle({
      environments: [SecurityEnvironment.PRODUCTION],
      lifecycles: [SecurityLifecycle.LIVE]
    });
    
    const boundary = {
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() + 86400000)
    };
    
    const rateRes = await AlertGeneratorService.runSecurityAlertGenerationCycle("API-RATE-ABUSE-01", 1, boundary);
    const authRes = await AlertGeneratorService.runSecurityAlertGenerationCycle("API-AUTHORIZATION-PROBE-01", 1, boundary);
    
    return { cycleRes, rateRes, authRes };
  }

  async function countAlerts(ruleId: string, ipSuffix: string) {
    const ipHash = pseudonymizeTelemetryContext("ip", `10.0.0.${ipSuffix}`);
    const apiLogs = await prisma.apiSecurityLog.findMany({
      where: { 
        correlation_id: FIXTURE_NS, 
        event_code: ruleId === "API-RATE-ABUSE-01" ? "API_RATE_LIMIT_EXCEEDED" : "API_AUTHORIZATION_DENIED",
        ip_reference_hash: ipHash
      }
    });
    const logIds = apiLogs.map(l => l.id);
    if (logIds.length === 0) return 0;
    
    const events = await prisma.securityEvent.findMany({
      where: { source_record_id: { in: logIds } }
    });
    const eventIds = events.map(e => e.id);
    if (eventIds.length === 0) return 0;

    return await prisma.securityAlert.count({
      where: { 
        rule_id: ruleId,
        primary_event_id: { in: eventIds }
      }
    });
  }

  async function shiftEventsToPast(eventCode: string, seconds: number) {
    const apiLogs = await prisma.apiSecurityLog.findMany({
      where: { correlation_id: FIXTURE_NS, event_code: eventCode }
    });
    const logIds = apiLogs.map(l => l.id);
    if (logIds.length > 0) {
      const idsList = logIds.map(id => `'${id}'`).join(',');
      await prisma.$executeRawUnsafe(`
        UPDATE "SecurityEvent" 
        SET occurred_at = occurred_at - interval '${seconds} seconds'
        WHERE source_record_id IN (${idsList})
      `);
    }
  }

  describe("API-RATE-ABUSE-01", () => {
    const RULE_ID = "API-RATE-ABUSE-01";
    
    it("A. BELOW THRESHOLD: No detection for 4 qualifying events", async () => {
      await generateEvents(4, "API_RATE_LIMIT_EXCEEDED", "101");
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "101");
      expect(count).toBe(0);
    });

    it("B. EXACT THRESHOLD: Detection created on 5th event", async () => {
      await generateEvents(1, "API_RATE_LIMIT_EXCEEDED", "101"); // total 5
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "101");
      expect(count).toBe(1);
    });

    it("C. IDEMPOTENT RE-EVALUATION: Reprocessing doesn't duplicate", async () => {
      await evaluateRules(); // Run again on same events
      const count = await countAlerts(RULE_ID, "101");
      expect(count).toBe(1);
    });

    it("D. COOLDOWN SUPPRESSION: Events within cooldown are suppressed", async () => {
      await generateEvents(2, "API_RATE_LIMIT_EXCEEDED", "101"); // total 7
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "101");
      expect(count).toBe(1);
    });
    
    it("E. WINDOW EXCLUSION: Events outside 900s window are excluded", async () => {
      await generateEvents(4, "API_RATE_LIMIT_EXCEEDED", "103");
      await shiftEventsToPast("API_RATE_LIMIT_EXCEEDED", 1000); // older than 900s
      await generateEvents(1, "API_RATE_LIMIT_EXCEEDED", "103"); // only 1 in current window
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "103");
      expect(count).toBe(0);
    });

    it("F. CORRELATION ISOLATION: Different IP creates separate detection", async () => {
      await generateEvents(5, "API_RATE_LIMIT_EXCEEDED", "102"); // new IP
      await evaluateRules();
      const count2 = await countAlerts(RULE_ID, "102");
      expect(count2).toBe(1);
    });
  });

  describe("API-AUTHORIZATION-PROBE-01", () => {
    const RULE_ID = "API-AUTHORIZATION-PROBE-01";
    
    it("A. BELOW THRESHOLD: No detection for 9 events", async () => {
      await generateEvents(9, "API_AUTHORIZATION_DENIED", "201");
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "201");
      expect(count).toBe(0);
    });

    it("B. EXACT THRESHOLD: Detection created on 10th event", async () => {
      await generateEvents(1, "API_AUTHORIZATION_DENIED", "201"); // total 10
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "201");
      expect(count).toBe(1);
    });

    it("C. IDEMPOTENT RE-EVALUATION: Reprocessing doesn't duplicate", async () => {
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "201");
      expect(count).toBe(1);
    });

    it("D. COOLDOWN SUPPRESSION: Events within cooldown are suppressed", async () => {
      await generateEvents(2, "API_AUTHORIZATION_DENIED", "201");
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "201");
      expect(count).toBe(1);
    });

    it("E. WINDOW EXCLUSION: Events outside 300s window are excluded", async () => {
      await generateEvents(9, "API_AUTHORIZATION_DENIED", "203");
      await shiftEventsToPast("API_AUTHORIZATION_DENIED", 400); // older than 300s
      await generateEvents(1, "API_AUTHORIZATION_DENIED", "203");
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "203");
      expect(count).toBe(0);
    });

    it("F. CORRELATION ISOLATION: Different IP acts separately", async () => {
      await generateEvents(10, "API_AUTHORIZATION_DENIED", "202");
      await evaluateRules();
      const count = await countAlerts(RULE_ID, "202");
      expect(count).toBe(1);
    });
  });
});
