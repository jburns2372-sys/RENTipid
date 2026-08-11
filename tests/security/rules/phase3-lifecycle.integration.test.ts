import { PrismaClient } from "@prisma/client";
import { processSecurityEvent } from "../../../src/lib/security/events/event-ingestion";
import { runDetectionEvaluationCycle } from "../../../src/lib/security/rules/evaluator-worker.service";
import { AlertGeneratorService } from "../../../src/lib/security/rules/alert-generator.service";

const prisma = new PrismaClient();

describe("Phase 3 Lifecycle Integration (Gate 3H Closeout)", () => {
  const superAdminUserId = "gate3h-super-admin-test-id";
  const testRuleId = "TEST-INTEGRATION-01";
  const testWebhookId = "test-webhook-id-123";

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { id: superAdminUserId },
      create: {
        id: superAdminUserId,
        email: "gate3h-test-admin@test.com",
        full_name: "Gate3H Test Admin",
        mobile_number: "+15550000003",
        account_type: "Individual",
        role: "Super Admin",
        status: "Verified"
      },
      update: {
        role: "Super Admin",
        status: "Verified"
      }
    });

    await prisma.detectionRule.upsert({
      where: { rule_id_version: { rule_id: testRuleId, version: 1 } },
      create: {
        rule_id: testRuleId,
        version: 1,
        name: "Gate 3H Integration Rule",
        description: "Validates advisory alert generation and deduplication.",
        status: "ACTIVE",
        security_domain: "PAYMENT_SECURITY",
        result_classification: "POLICY_VIOLATION",
        base_severity: "HIGH",
        base_confidence_score: 80,
        threshold_count: 1,
        window_seconds: 3600,
        cooldown_seconds: 3600,
        max_evidence_events: 10,
        evaluation_timeout_ms: 1000,
        correlation_subject_type: "GLOBAL",
        deduplication_strategy: "WINDOW_BUCKET",
        confidence_formula: "STATIC_BASE",
        evaluation_dsl: {
          operator: "AND",
          conditions: [
            {
              field: "event_code",
              operator: "EQUALS",
              value: "WEBHOOK_TEST_EVENT"
            }
          ]
        },
        created_by_type: "USER",
        created_by_user_id: superAdminUserId,
        activated_at: new Date(),
        activated_by_id: superAdminUserId
      },
      update: {
        status: "ACTIVE"
      }
    });
  });

  afterAll(async () => {
    await prisma.securityAlert.deleteMany({
      where: { rule_id: testRuleId }
    });

    await prisma.ruleEvaluationLog.deleteMany({
      where: { rule_id: testRuleId }
    });

    await prisma.securityEvent.deleteMany({
      where: { source_record_id: testWebhookId }
    });

    await prisma.paymentWebhookLog.deleteMany({
      where: { id: testWebhookId }
    });

    await prisma.detectionRule.deleteMany({
      where: { rule_id: testRuleId }
    });

    await prisma.user.deleteMany({
      where: { id: superAdminUserId }
    });

    await prisma.$disconnect();
  });

  it("should evaluate a valid event and generate exactly one deduplicated advisory alert", async () => {
    // 1. Insert mock source record
    const webhook = await prisma.paymentWebhookLog.create({
      data: {
        id: testWebhookId,
        provider: "TEST",
        event_type: "EVENT",
        verification_status: "Failed",
        processing_status: "PROCESSED",
        headers_summary: "{}",
        payload_summary: "{}"
      }
    });

    // 2. Ingest normalized event
    const ingestResult = await processSecurityEvent(webhook, "TEST", "PRODUCTION");
    expect(ingestResult.success).toBe(true);

    // 3. Evaluate rules (should match our test rule since WEBHOOK_TEST_EVENT matches)
    // Wait, the processSecurityEvent generates event_code WEBHOOK_TEST_EVENT because provider=TEST and event_type=EVENT
    const cycleResult = await runDetectionEvaluationCycle({
      environments: ["PRODUCTION"],
      lifecycles: ["TEST"]
    });
    expect(cycleResult.success).toBe(true);

    // 4. Generate alerts
    const now = new Date();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60000);
    const alertResult = await AlertGeneratorService.runSecurityAlertGenerationCycle(
      testRuleId,
      1,
      { startTime: tenMinsAgo, endTime: now }
    );
    expect(alertResult.alertsCreated).toBe(1);

    // 5. Confirm Privacy-Safe DTO and Advisory Status
    const alerts = await prisma.securityAlert.findMany({
      where: { rule_id: testRuleId },
      include: { primary_event: { select: { event_code: true, source_summary: true } } }
    });
    expect(alerts.length).toBe(1);

    const alert = alerts[0];
    expect(alert.review_status).toBe("UNREVIEWED"); // Advisory

    // Check privacy-safe detail mapping
    expect(alert.primary_event.event_code).toBe("WEBHOOK_TEST_EVENT");
    // Ensure raw payloads aren't dumped into the alert
    expect(JSON.stringify(alert.primary_event.source_summary)).not.toContain("payload_summary");

    // 6. Deduplication Check - Re-run alert generator
    const duplicateAlertResult = await AlertGeneratorService.runSecurityAlertGenerationCycle(
      testRuleId,
      1,
      { startTime: tenMinsAgo, endTime: now }
    );
    expect(duplicateAlertResult.alertsCreated).toBe(0);

    const duplicateAlertsCheck = await prisma.securityAlert.count({
      where: { rule_id: testRuleId }
    });
    expect(duplicateAlertsCheck).toBe(1); // Still 1

    // 7. Safety check: ensure no business mutations occurred (sanity check)
    const userCheck = await prisma.user.findUnique({ where: { id: superAdminUserId } });
    expect(userCheck?.status).toBe("Verified"); // User was not suspended
  }, 20000);
});
