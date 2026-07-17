import { PrismaClient, SecuritySeverity, SecurityEventClassification, SecurityEnvironment, SecurityLifecycle, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula, SecurityAlertReviewStatus } from "@prisma/client";
import { AlertReviewService } from "@/lib/security/rules/alert-review.service";

const prisma = new PrismaClient();

describe("Phase 3 Gate 3F - Alert Review Service", () => {
  let superAdminId = "";
  let regularUserId = "";
  let alertId = "";

  beforeAll(async () => {
    const sa = await prisma.user.create({
      data: {
        email: `sa_${Date.now()}@test.com`,
        full_name: "Super Admin",
        account_type: "Individual",
        role: "Super Admin",
        status: "Verified",
      }
    });
    superAdminId = sa.id;

    const ru = await prisma.user.create({
      data: {
        email: `ru_${Date.now()}@test.com`,
        full_name: "Regular User",
        account_type: "Individual",
        role: "Guest",
        status: "Verified",
      }
    });
    regularUserId = ru.id;

    const rule = await prisma.detectionRule.create({
      data: {
        rule_id: `RULE_REV_${Date.now()}`,
        version: 1,
        name: "Test Rev Rule",
        description: "Test",
        status: "ACTIVE",
        security_domain: "TRUST_AND_SAFETY",
        result_classification: "SUSPICIOUS_ACTIVITY",
        base_severity: "MEDIUM",
        base_confidence_score: 50,
        evaluation_dsl: {},
        evaluation_timeout_ms: 100,
        threshold_count: 3,
        window_seconds: 3600,
        cooldown_seconds: 3600,
        max_evidence_events: 5,
        correlation_subject_type: "TARGET_USER_ID",
        deduplication_strategy: "WINDOW_BUCKET",
        confidence_formula: "BASE_PLUS_EVIDENCE_MULTIPLIER",
        created_by_type: "SYSTEM_SEED",
        activated_at: new Date(),
        activated_by_id: "SYSTEM",
      }
    });

    const ev = await prisma.securityEvent.create({
      data: {
        event_code: `TEST_R`,
        source_type: "SYSTEM_ERROR_LOG",
        source_record_id: `TR`,
        security_domain: "TRUST_AND_SAFETY",
        event_category: "TEST",
        event_classification: "OBSERVATION",
        severity: "INFO",
        environment: "TEST",
        lifecycle_type: "TEST",
        target_user_id: "USR_R", 
        idempotency_key: `IDEMP_R_${Date.now()}`,
        occurred_at: new Date(),
        source_received_at: new Date()
      }
    });

    const alert = await prisma.securityAlert.create({
      data: {
        alert_reference: `ALT_REV_${Date.now()}`,
        suppression_key: `SUP_REV_${Date.now()}`,
        evidence_digest: `EVD_REV_${Date.now()}`,
        rule_id: rule.rule_id,
        rule_version: 1,
        primary_event_id: ev.id,
        result_classification: "SUSPICIOUS_ACTIVITY",
        base_severity: "MEDIUM",
        final_severity: "MEDIUM",
        base_confidence: 50,
        final_confidence: 50,
        confidence_basis: "STATIC_BASE",
        classification_reason: "Test",
        lifecycle_type: "TEST",
        environment: "TEST",
        correlation_subject_type: "TARGET_USER_ID",
        correlation_hash_key_version: "v1",
        correlation_subject_hash: "hash",
        window_bucket_start: new Date(),
        window_start: new Date(),
        window_end: new Date(),
        first_event_timestamp: new Date(),
        last_event_timestamp: new Date(),
        event_count: 1,
      }
    });
    alertId = alert.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should deny non-admin users from viewing alerts", async () => {
    await expect(AlertReviewService.getAlerts(regularUserId, 10)).rejects.toThrow("Requires Super Admin role");
  });

  it("should allow super admin to view alerts", async () => {
    const alerts = await AlertReviewService.getAlerts(superAdminId, 10);
    expect(alerts.alerts.length).toBeGreaterThan(0);
  });

  it("should deny invalid transition", async () => {
    await expect(AlertReviewService.updateAlertReviewStatus(
      superAdminId,
      alertId,
      "UNREVIEWED",
      "Notes",
      0
    )).rejects.toThrow("INVALID_TRANSITION");
  });

  it("should update review status with optimistic concurrency", async () => {
    const updated = await AlertReviewService.updateAlertReviewStatus(
      superAdminId,
      alertId,
      "UNDER_REVIEW",
      "Taking a look",
      0
    );
    expect(updated.review_status).toBe("UNDER_REVIEW");
    expect(updated.review_version).toBe(1);

    await expect(AlertReviewService.updateAlertReviewStatus(
      superAdminId,
      alertId,
      "CONFIRMED",
      "Confirmed",
      0
    )).rejects.toThrow("OPTIMISTIC_CONCURRENCY_FAILURE");
  });
});
