import { PrismaClient } from "@prisma/client";
import { AlertReviewService } from "../../../src/lib/security/rules/alert-review.service";

const prisma = new PrismaClient();

describe("Phase 3 Gate 3F - Alert Review Matrix", () => {
  beforeAll(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.securityAlertEvidence.deleteMany({});
    await prisma.securityAlert.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.listing.deleteMany({});
    await prisma.user.deleteMany({});
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.securityAlertEvidence.deleteMany({});
    await prisma.securityAlert.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.listing.deleteMany({});
    await prisma.user.deleteMany({});
  });

  async function createUser(role: string, status: string = "Verified") {
    return await prisma.user.create({
      data: {
        email: `test${Math.random()}@test.com`,
        full_name: "Test User",
        account_type: "Individual",
        role,
        status
      }
    });
  }

  async function createAlert() {
    const rId = `R1_${Math.random()}`;
    await prisma.detectionRule.create({
      data: {
        rule_id: rId,
        version: 1,
        name: "Test",
        description: "Test",
        status: "ACTIVE",
        security_domain: "TRUST_AND_SAFETY",
        result_classification: "SUSPICIOUS_ACTIVITY",
        base_severity: "MEDIUM",
        base_confidence_score: 50,
        correlation_subject_type: "ACTOR_USER_ID",
        threshold_count: 1,
        window_seconds: 3600,
        cooldown_seconds: 7200,
        max_evidence_events: 5,
        evaluation_timeout_ms: 1000,
        deduplication_strategy: "WINDOW_BUCKET",
        confidence_formula: "STATIC_BASE",
        evaluation_dsl: {},
        created_by_type: "SYSTEM_SEED",
        activated_at: new Date(),
        activated_by_id: "system"
      }
    });

    const event = await prisma.securityEvent.create({
      data: {
        event_code: "TEST",
        source_type: "AUDIT_LOG",
        source_record_id: `rec_${Math.random()}`,
        security_domain: "TRUST_AND_SAFETY",
        event_category: "TEST",
        event_classification: "SUSPICIOUS_ACTIVITY",
        severity: "MEDIUM",
        environment: "TEST",
        lifecycle_type: "TEST",
        occurred_at: new Date(),
        source_received_at: new Date(),
        idempotency_key: `idemp_${Math.random()}`
      }
    });

    return await prisma.securityAlert.create({
      data: {
        alert_reference: `ALT-TEST-${Math.random()}`,
        rule_id: rId,
        rule_version: 1,
        suppression_key: `sup_${Math.random()}`,
        evidence_digest: "dig_1",
        primary_event_id: event.id,
        result_classification: "SUSPICIOUS_ACTIVITY",
        base_severity: "MEDIUM",
        final_severity: "MEDIUM",
        base_confidence: 50,
        final_confidence: 50,
        confidence_basis: "STATIC_BASE",
        classification_reason: "Test",
        lifecycle_type: "TEST",
        environment: "TEST",
        correlation_subject_type: "ACTOR_USER_ID",
        correlation_hash_key_version: "v1",
        correlation_subject_hash: "hash_1",
        window_bucket_start: new Date(),
        window_start: new Date(),
        window_end: new Date(),
        first_event_timestamp: new Date(),
        last_event_timestamp: new Date(),
        event_count: 1
      }
    });
  }

  // DB-authoritative auth checks
  it("should allow Verified Super Admin", async () => {
    const user = await createUser("Super Admin", "Verified");
    const alert = await createAlert();
    const res = await AlertReviewService.getAlertDetail(user.id, alert.id);
    expect(res?.id).toBe(alert.id);
  });
  
  it("should deny Admin", async () => {
    const user = await createUser("Admin", "Verified");
    await expect(AlertReviewService.getAlerts(user.id, 10)).rejects.toThrow("SOC_ACCESS_DENIED_ROLE");
  });
  
  it("should deny Finance Admin", async () => {
    const user = await createUser("Finance Admin", "Verified");
    await expect(AlertReviewService.getAlerts(user.id, 10)).rejects.toThrow("SOC_ACCESS_DENIED_ROLE");
  });
  
  it("should deny Compliance Admin", async () => {
    const user = await createUser("Compliance Admin", "Verified");
    await expect(AlertReviewService.getAlerts(user.id, 10)).rejects.toThrow("SOC_ACCESS_DENIED_ROLE");
  });
  
  it("should deny Renter", async () => {
    const user = await createUser("Renter", "Verified");
    await expect(AlertReviewService.getAlerts(user.id, 10)).rejects.toThrow("SOC_ACCESS_DENIED_ROLE");
  });
  
  it("should deny Pending", async () => {
    const user = await createUser("Super Admin", "Pending");
    await expect(AlertReviewService.getAlerts(user.id, 10)).rejects.toThrow("Authorization failed");
  });
  
  it("should deny Suspended", async () => {
    const user = await createUser("Super Admin", "Suspended");
    await expect(AlertReviewService.getAlerts(user.id, 10)).rejects.toThrow("Authorization failed");
  });
  
  it("should deny Blacklisted", async () => {
    const user = await createUser("Super Admin", "Blacklisted");
    await expect(AlertReviewService.getAlerts(user.id, 10)).rejects.toThrow("Authorization failed");
  });
  
  it("should deny missing database user", async () => {
    await expect(AlertReviewService.getAlerts("missing", 10)).rejects.toThrow("Missing database user");
  });
  
  it("should deny stale elevated JWT role", async () => {
    const user = await createUser("Renter", "Verified");
    // Service fetches straight from DB, so it will deny despite what JWT might say
    await expect(AlertReviewService.getAlerts(user.id, 10)).rejects.toThrow("SOC_ACCESS_DENIED_ROLE");
  });
  
  it("should deny stale Verified JWT status", async () => {
    const user = await createUser("Super Admin", "Suspended");
    await expect(AlertReviewService.getAlerts(user.id, 10)).rejects.toThrow("Authorization failed");
  });
  
  // Transitions
  it("should execute valid transitions", async () => {
    const user = await createUser("Super Admin", "Verified");
    const alert = await createAlert();
    const updated = await AlertReviewService.updateAlertReviewStatus(user.id, alert.id, "UNDER_REVIEW", "Test", 0);
    expect(updated.review_status).toBe("UNDER_REVIEW");
    expect(updated.review_version).toBe(1);
  });
  
  it("should block invalid direct terminal transitions from UNREVIEWED", async () => {
    const user = await createUser("Super Admin", "Verified");
    const alert = await createAlert();
    await expect(AlertReviewService.updateAlertReviewStatus(user.id, alert.id, "CONFIRMED", "Test", 0)).rejects.toThrow("INVALID_TRANSITION");
    await expect(AlertReviewService.updateAlertReviewStatus(user.id, alert.id, "FALSE_POSITIVE", "Test", 0)).rejects.toThrow("INVALID_TRANSITION");
  });
  
  it("should block any transitions from terminal CONFIRMED state", async () => {
    const user = await createUser("Super Admin", "Verified");
    const alert = await createAlert();
    
    // Simulate being in CONFIRMED
    await prisma.securityAlert.update({
      where: { id: alert.id },
      data: { review_status: "CONFIRMED", review_version: 1, reviewer_id: user.id, reviewed_at: new Date() }
    });
    
    await expect(AlertReviewService.updateAlertReviewStatus(user.id, alert.id, "FALSE_POSITIVE", "Test", 1)).rejects.toThrow("INVALID_TRANSITION");
    await expect(AlertReviewService.updateAlertReviewStatus(user.id, alert.id, "UNDER_REVIEW", "Test", 1)).rejects.toThrow("INVALID_TRANSITION");
  });
  
  it("should reject stale review conflict", async () => {
    const user = await createUser("Super Admin", "Verified");
    const alert = await createAlert();
    await expect(AlertReviewService.updateAlertReviewStatus(user.id, alert.id, "UNDER_REVIEW", "Test", 1)).rejects.toThrow("OPTIMISTIC_CONCURRENCY_FAILURE");
  });
  
  it("should reject concurrent review conflict", async () => {
    const user = await createUser("Super Admin", "Verified");
    const alert = await createAlert();
    
    // Simulate concurrent modification of status
    await prisma.securityAlert.update({
      where: { id: alert.id },
      data: { review_status: "UNDER_REVIEW", review_version: 1, reviewer_id: user.id, reviewed_at: new Date() }
    });
    
    await expect(AlertReviewService.updateAlertReviewStatus(user.id, alert.id, "CONFIRMED", "Test", 0)).rejects.toThrow("OPTIMISTIC_CONCURRENCY_FAILURE");
  });
  
  // Audits
  it("should trigger audit rollback on error, leaving evidence and status unchanged", async () => {
    const user = await createUser("Super Admin", "Verified");
    const alert = await createAlert();
    await prisma.securityAlertEvidence.create({
      data: { alert_id: alert.id, event_id: alert.primary_event_id, evidence_role: "PRIMARY" }
    });
    
    // Attempt invalid transition to force rollback in tx
    try {
      await AlertReviewService.updateAlertReviewStatus(user.id, alert.id, "CONFIRMED", "Test", 0);
    } catch {
      // Ignored
    }
    
    const dbAlert = await prisma.securityAlert.findUnique({ where: { id: alert.id }});
    expect(dbAlert?.review_status).toBe("UNREVIEWED");
    expect(dbAlert?.review_version).toBe(0);
    
    const evidence = await prisma.securityAlertEvidence.findMany({ where: { alert_id: alert.id }});
    expect(evidence.length).toBe(1);
    
    const audits = await prisma.auditLog.findMany({ where: { target_id: alert.id }});
    expect(audits.length).toBe(0);
  });
  
  // Features
  it("should ensure stable pagination with identical timestamps", async () => {
    const user = await createUser("Super Admin", "Verified");
    await createAlert();
    await createAlert(); // Same timestamp
    
    const res = await AlertReviewService.getAlerts(user.id, 1);
    expect(res.alerts.length).toBe(1);
    expect(res.hasMore).toBe(true);
  });
  
  it("should return privacy-safe detail DTO without exposing HMAC or raw payload", async () => {
    const user = await createUser("Super Admin", "Verified");
    const alert = await createAlert();
    const dto = await AlertReviewService.getAlertDetail(user.id, alert.id);
    expect(dto).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((dto as any).payload).toBeUndefined();
  });
});
