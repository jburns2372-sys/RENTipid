import { PrismaClient, SecuritySeverity, SecurityEventClassification, SecurityEnvironment, SecurityLifecycle, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula } from "@prisma/client";
import { AlertGeneratorService } from "@/lib/security/rules/alert-generator.service";

const prisma = new PrismaClient();

describe("Phase 3 Gate 3F - Alert Generator", () => {
  let testRuleId = "";
  let testRuleVersion = 1;

  beforeAll(async () => {
    // Cleanup
    await prisma.ruleEvaluationLog.deleteMany({});
    await prisma.securityAlertEvidence.deleteMany({});
    await prisma.securityAlert.deleteMany({});
    await prisma.securityEvent.deleteMany({});
    await prisma.detectionRule.deleteMany({});

    // Create Rule
    const rule = await prisma.detectionRule.create({
      data: {
        rule_id: `RULE_GEN_${Date.now()}`,
        version: 1,
        name: "Test Generation Rule",
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
        severity_promotion_threshold: 4,
        promoted_severity: "HIGH",
        confidence_increment_per_evidence: 10,
        created_by_type: "SYSTEM_SEED",
        activated_at: new Date(),
        activated_by_id: "SYSTEM",
      }
    });
    testRuleId = rule.rule_id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create no alert if threshold is not met", async () => {
    // Create 2 events (threshold is 3)
    const ev1 = await prisma.securityEvent.create({
      data: {
        event_code: "TEST_1",
        source_type: "SYSTEM_ERROR_LOG",
        source_record_id: "T1",
        security_domain: "TRUST_AND_SAFETY",
        event_category: "TEST",
        event_classification: "OBSERVATION",
        severity: "INFO",
        environment: "TEST",
        lifecycle_type: "TEST",
        target_user_id: "USR_1",
        idempotency_key: "IDEMP_1",
        occurred_at: new Date("2026-07-01T10:00:00Z"),
        source_received_at: new Date()
      }
    });

    const ev2 = await prisma.securityEvent.create({
      data: {
        event_code: "TEST_2",
        source_type: "SYSTEM_ERROR_LOG",
        source_record_id: "T2",
        security_domain: "TRUST_AND_SAFETY",
        event_category: "TEST",
        event_classification: "OBSERVATION",
        severity: "INFO",
        environment: "TEST",
        lifecycle_type: "TEST",
        target_user_id: "USR_1", // Same subject
        idempotency_key: "IDEMP_2",
        occurred_at: new Date("2026-07-01T10:05:00Z"),
        source_received_at: new Date()
      }
    });

    await prisma.ruleEvaluationLog.createMany({
      data: [
        { evaluation_identity_key: "L1", rule_id: testRuleId, rule_version: 1, candidate_event_id: ev1.id, outcome: "MATCH", matched_event_count: 1, execution_duration_ms: 10, lifecycle_type: "TEST", environment: "TEST", evaluation_timestamp: new Date("2026-07-01T10:06:00Z") },
        { evaluation_identity_key: "L2", rule_id: testRuleId, rule_version: 1, candidate_event_id: ev2.id, outcome: "MATCH", matched_event_count: 1, execution_duration_ms: 10, lifecycle_type: "TEST", environment: "TEST", evaluation_timestamp: new Date("2026-07-01T10:06:00Z") }
      ]
    });

    const result = await AlertGeneratorService.runSecurityAlertGenerationCycle(
      testRuleId, 1, 
      { startTime: new Date("2026-07-01T00:00:00Z"), endTime: new Date("2026-07-02T00:00:00Z") }
    );
    expect(result.alertsCreated).toBe(0);
  });

  it("should create alert when threshold is met, enforce max evidence, and promote severity", async () => {
    for(let i=3; i<=5; i++) {
      const ev = await prisma.securityEvent.create({
        data: {
          event_code: `TEST_${i}`,
          source_type: "SYSTEM_ERROR_LOG",
          source_record_id: `T${i}`,
          security_domain: "TRUST_AND_SAFETY",
          event_category: "TEST",
          event_classification: "OBSERVATION",
          severity: "INFO",
          environment: "TEST",
          lifecycle_type: "TEST",
          target_user_id: "USR_1", 
          idempotency_key: `IDEMP_${i}`,
          occurred_at: new Date(`2026-07-01T10:1${i}:00Z`), // Inside the window
          source_received_at: new Date()
        }
      });
      await prisma.ruleEvaluationLog.create({
        data: { evaluation_identity_key: `L${i}`, rule_id: testRuleId, rule_version: 1, candidate_event_id: ev.id, outcome: "MATCH", matched_event_count: 1, execution_duration_ms: 10, lifecycle_type: "TEST", environment: "TEST", evaluation_timestamp: new Date("2026-07-01T10:20:00Z") }
      });
    }

    const result = await AlertGeneratorService.runSecurityAlertGenerationCycle(
      testRuleId, 1, 
      { startTime: new Date("2026-07-01T00:00:00Z"), endTime: new Date("2026-07-02T00:00:00Z") }
    );
    
    expect(result.alertsCreated).toBe(1);

    const alerts = await prisma.securityAlert.findMany({ include: { evidence: true } });
    expect(alerts.length).toBe(1);
    
    const alert = alerts[0];
    expect(alert.final_confidence).toBe(70);
    expect(alert.final_severity).toBe("HIGH");
    
    expect(alert.evidence.length).toBe(5);
    const primary = alert.evidence.filter(e => e.evidence_role === "PRIMARY");
    expect(primary.length).toBe(1);
    expect(alert.event_count).toBe(5);
  });

  it("should enforce cooldown and not create second alert", async () => {
    const ev = await prisma.securityEvent.create({
      data: {
        event_code: `TEST_6`,
        source_type: "SYSTEM_ERROR_LOG",
        source_record_id: `T6`,
        security_domain: "TRUST_AND_SAFETY",
        event_category: "TEST",
        event_classification: "OBSERVATION",
        severity: "INFO",
        environment: "TEST",
        lifecycle_type: "TEST",
        target_user_id: "USR_1", 
        idempotency_key: `IDEMP_6`,
        occurred_at: new Date(`2026-07-01T10:20:00Z`), // Still in the same 1h bucket
        source_received_at: new Date()
      }
    });
    await prisma.ruleEvaluationLog.create({
      data: { evaluation_identity_key: `L6`, rule_id: testRuleId, rule_version: 1, candidate_event_id: ev.id, outcome: "MATCH", matched_event_count: 1, execution_duration_ms: 10, lifecycle_type: "TEST", environment: "TEST", evaluation_timestamp: new Date("2026-07-01T10:25:00Z") }
    });

    const result = await AlertGeneratorService.runSecurityAlertGenerationCycle(
      testRuleId, 1, 
      { startTime: new Date("2026-07-01T00:00:00Z"), endTime: new Date("2026-07-02T00:00:00Z") }
    );
    
    expect(result.alertsCreated).toBe(0);
  });

  it("should behave safely under concurrent execution", async () => {
    const rule = await prisma.detectionRule.create({
      data: {
        rule_id: `RULE_CONC_${Date.now()}`,
        version: 1,
        name: "Test Conc",
        description: "Test",
        status: "ACTIVE",
        security_domain: "TRUST_AND_SAFETY",
        result_classification: "SUSPICIOUS_ACTIVITY",
        base_severity: "MEDIUM",
        base_confidence_score: 50,
        evaluation_dsl: {},
        evaluation_timeout_ms: 100,
        threshold_count: 1,
        window_seconds: 3600,
        cooldown_seconds: 3600,
        max_evidence_events: 5,
        correlation_subject_type: "TARGET_USER_ID",
        deduplication_strategy: "WINDOW_BUCKET",
        confidence_formula: "STATIC_BASE",
        created_by_type: "SYSTEM_SEED",
        activated_at: new Date(),
        activated_by_id: "SYSTEM",
      }
    });

    const ev = await prisma.securityEvent.create({
      data: {
        event_code: `TEST_C`,
        source_type: "SYSTEM_ERROR_LOG",
        source_record_id: `TC`,
        security_domain: "TRUST_AND_SAFETY",
        event_category: "TEST",
        event_classification: "OBSERVATION",
        severity: "INFO",
        environment: "TEST",
        lifecycle_type: "TEST",
        target_user_id: "USR_C", 
        idempotency_key: `IDEMP_C`,
        occurred_at: new Date(),
        source_received_at: new Date()
      }
    });
    await prisma.ruleEvaluationLog.create({
      data: { evaluation_identity_key: `LC`, rule_id: rule.rule_id, rule_version: 1, candidate_event_id: ev.id, outcome: "MATCH", matched_event_count: 1, execution_duration_ms: 10, lifecycle_type: "TEST", environment: "TEST", evaluation_timestamp: new Date() }
    });

    const p1 = AlertGeneratorService.runSecurityAlertGenerationCycle(
      rule.rule_id, 1, 
      { startTime: new Date(Date.now() - 3600000), endTime: new Date(Date.now() + 3600000) }
    );
    const p2 = AlertGeneratorService.runSecurityAlertGenerationCycle(
      rule.rule_id, 1, 
      { startTime: new Date(Date.now() - 3600000), endTime: new Date(Date.now() + 3600000) }
    );

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.alertsCreated + r2.alertsCreated).toBe(1);

    const alerts = await prisma.securityAlert.findMany({ where: { rule_id: rule.rule_id } });
    expect(alerts.length).toBe(1);
  });
});
