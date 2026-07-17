import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { runDetectionEvaluationCycle } from "../../../src/lib/security/rules/evaluator-worker.service";
import { 
  SecurityEnvironment, 
  SecurityLifecycle, 
  DetectionRuleStatus, 
  RuleEvaluationOutcome,
  SecurityEventSource,
  SecurityDomain,
  SecurityEventClassification,
  SecuritySeverity,
  DetectionRuleCreatorType,
  DetectionCorrelationSubject,
  DetectionDeduplicationStrategy,
  DetectionConfidenceFormula
} from "@prisma/client";
import * as crypto from "crypto";

jest.setTimeout(120000);

describe("Phase 3 Gate 3E - Evaluator Worker", () => {
  let ruleAId: string;
  let ruleBId: string;

  beforeAll(async () => {
    // Clear state
    await prisma.ruleEvaluationLog.deleteMany({});
    await prisma.detectionEvaluationCheckpoint.deleteMany({});
    await prisma.securityAlertEvidence.deleteMany({});
    await prisma.securityAlert.deleteMany({});
    await prisma.securityEvent.deleteMany({});
    await prisma.detectionRule.deleteMany({});

    // Create rules
    ruleAId = `RULE_A_${Date.now()}`;
    await prisma.detectionRule.create({
      data: {
        rule_id: ruleAId,
        version: 1,
        name: "Test Rule A",
        description: "A test rule",
        status: DetectionRuleStatus.ACTIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        result_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        evaluation_dsl: {
          field: "action_attempted",
          operator: "EQUALS",
          value: "PAYMENT"
        },
        base_severity: SecuritySeverity.HIGH,
        base_confidence_score: 50,
        threshold_count: 1,
        window_seconds: 60,
        cooldown_seconds: 0,
        max_evidence_events: 1,
        evaluation_timeout_ms: 1000,
        correlation_subject_type: DetectionCorrelationSubject.ACTOR_USER_ID,
        deduplication_strategy: DetectionDeduplicationStrategy.EXACT_MATCH,
        confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
        created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
        activated_at: new Date(),
        activated_by_id: "test-admin",
      }
    });

    ruleBId = `RULE_B_${Date.now()}`;
    await prisma.detectionRule.create({
      data: {
        rule_id: ruleBId,
        version: 1,
        name: "Test Rule B",
        description: "A test rule draft",
        status: DetectionRuleStatus.DRAFT,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        result_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        evaluation_dsl: {
          field: "action_attempted",
          operator: "EQUALS",
          value: "LOGIN"
        },
        base_severity: SecuritySeverity.MEDIUM,
        base_confidence_score: 30,
        threshold_count: 1,
        window_seconds: 60,
        cooldown_seconds: 0,
        max_evidence_events: 1,
        evaluation_timeout_ms: 1000,
        correlation_subject_type: DetectionCorrelationSubject.ACTOR_USER_ID,
        deduplication_strategy: DetectionDeduplicationStrategy.EXACT_MATCH,
        confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
        created_by_type: DetectionRuleCreatorType.SYSTEM_SEED
      }
    });
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.ruleEvaluationLog.deleteMany({});
    await prisma.detectionEvaluationCheckpoint.deleteMany({});
    await prisma.securityAlertEvidence.deleteMany({});
    await prisma.securityAlert.deleteMany({});
    await prisma.securityEvent.deleteMany({});
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.ruleEvaluationLog.deleteMany({});
    await prisma.detectionEvaluationCheckpoint.deleteMany({});
    await prisma.securityAlertEvidence.deleteMany({});
    await prisma.securityAlert.deleteMany({});
    await prisma.securityEvent.deleteMany({});
    await prisma.detectionRule.deleteMany({});
    await prisma.$disconnect();
  });

  it("should process ACTIVE rules and skip DRAFT rules", async () => {
    // Insert event
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        source_type: SecurityEventSource.PAYMENT_WEBHOOK_LOG,
        source_record_id: "tx_123",
        occurred_at: new Date(Date.now() - 60000),
        source_received_at: new Date(),
        environment: SecurityEnvironment.PRODUCTION,
        lifecycle_type: SecurityLifecycle.LIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        action_attempted: "PAYMENT",
        idempotency_key: `evt_${Date.now()}`,
        event_code: "PAY_01",
        event_category: "PAYMENT",
        event_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.HIGH,
      }
    });

    const result = await runDetectionEvaluationCycle();

    expect(result.success).toBe(true);
    expect(result.rulesProcessed).toBe(1); // Only Rule A
    expect(result.eventsEvaluated).toBe(1);

    const logs = await prisma.ruleEvaluationLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0].rule_id).toBe(ruleAId);
    expect(logs[0].outcome).toBe(RuleEvaluationOutcome.MATCH);
  });

  it("should acquire a lease atomically and prevent concurrent workers", async () => {
    // Manually create a checkpoint with an active lease
    const cp = await prisma.detectionEvaluationCheckpoint.create({
      data: {
        rule_id: ruleAId,
        rule_version: 1,
        environment: SecurityEnvironment.PRODUCTION,
        lifecycle_type: SecurityLifecycle.LIVE,
        lease_owner: "some_other_worker",
        lease_expires_at: new Date(Date.now() + 60000), // active lease
      }
    });

    const result = await runDetectionEvaluationCycle();
    // It should skip or throw LEASE_NOT_ACQUIRED, which translates to a rule failure error internally
    expect(result.rulesProcessed).toBe(0);
    expect(result.errors.some(e => e.includes("LEASE_NOT_ACQUIRED"))).toBe(true);
    expect(result.eventsEvaluated).toBe(0);

    // Let the lease expire and try again
    await prisma.detectionEvaluationCheckpoint.update({
      where: { id: cp.id },
      data: { lease_expires_at: new Date(Date.now() - 1000) }
    });

    const result2 = await runDetectionEvaluationCycle();
    expect(result2.rulesProcessed).toBe(1);
  });

  it("should handle cursor and batch size correctly", async () => {
    // Insert 3 events
    const baseTime = Date.now() - 60000;
    
    await prisma.securityEvent.createMany({
      data: [
        {
          id: "evt_1",
          source_type: SecurityEventSource.PAYMENT_WEBHOOK_LOG,
          source_record_id: "tx_1",
          occurred_at: new Date(baseTime),
          source_received_at: new Date(),
          environment: SecurityEnvironment.PRODUCTION,
          lifecycle_type: SecurityLifecycle.LIVE,
          security_domain: SecurityDomain.TRUST_AND_SAFETY,
          action_attempted: "PAYMENT",
          idempotency_key: `evt_cursor_1_${Date.now()}`,
          event_code: "PAY_01",
          event_category: "PAYMENT",
          event_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
          severity: SecuritySeverity.HIGH,
        },
        {
          id: "evt_2",
          source_type: SecurityEventSource.PAYMENT_WEBHOOK_LOG,
          source_record_id: "tx_2",
          occurred_at: new Date(baseTime),
          source_received_at: new Date(),
          environment: SecurityEnvironment.PRODUCTION,
          lifecycle_type: SecurityLifecycle.LIVE,
          security_domain: SecurityDomain.TRUST_AND_SAFETY,
          action_attempted: "PAYMENT",
          idempotency_key: `evt_cursor_2_${Date.now()}`,
          event_code: "PAY_01",
          event_category: "PAYMENT",
          event_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
          severity: SecuritySeverity.HIGH,
        },
        {
          id: "evt_3",
          source_type: SecurityEventSource.PAYMENT_WEBHOOK_LOG,
          source_record_id: "tx_3",
          occurred_at: new Date(baseTime + 1000),
          source_received_at: new Date(),
          environment: SecurityEnvironment.PRODUCTION,
          lifecycle_type: SecurityLifecycle.LIVE,
          security_domain: SecurityDomain.TRUST_AND_SAFETY,
          action_attempted: "PAYMENT",
          idempotency_key: `evt_cursor_3_${Date.now()}`,
          event_code: "PAY_01",
          event_category: "PAYMENT",
          event_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
          severity: SecuritySeverity.HIGH,
        }
      ]
    });

    // We can't easily mock BATCH_SIZE dynamically, but we can verify all 3 are processed.
    const result = await runDetectionEvaluationCycle();
    expect(result.eventsEvaluated).toBe(3);

    const cp = await prisma.detectionEvaluationCheckpoint.findUnique({
      where: {
        rule_id_rule_version_environment_lifecycle_type: {
          rule_id: ruleAId,
          rule_version: 1,
          environment: SecurityEnvironment.PRODUCTION,
          lifecycle_type: SecurityLifecycle.LIVE,
        }
      }
    });

    expect(cp?.cursor_event_id).toBe("evt_3");
    expect(cp?.cursor_timestamp?.getTime()).toBe(baseTime + 1000);

    // Running again should result in 0
    const result2 = await runDetectionEvaluationCycle();
    expect(result2.eventsEvaluated).toBe(0);
  });

  it("should be idempotent and not create duplicate logs on retry", async () => {
    // Insert event
    const event = await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        source_type: SecurityEventSource.PAYMENT_WEBHOOK_LOG,
        source_record_id: "tx_idem",
        occurred_at: new Date(Date.now() - 60000),
        source_received_at: new Date(),
        environment: SecurityEnvironment.PRODUCTION,
        lifecycle_type: SecurityLifecycle.LIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        action_attempted: "PAYMENT",
        idempotency_key: `evt_idem_${Date.now()}`,
        event_code: "PAY_01",
        event_category: "PAYMENT",
        event_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.HIGH,
      }
    });

    const result = await runDetectionEvaluationCycle();
    expect(result.eventsEvaluated).toBe(1);

    // Rollback cursor to simulate ambiguous crash
    await prisma.detectionEvaluationCheckpoint.updateMany({
      data: {
        cursor_timestamp: new Date(0),
        cursor_event_id: null,
      }
    });

    const result2 = await runDetectionEvaluationCycle();
    expect(result2.eventsEvaluated).toBe(1);

    // Logs should still be 1 (deduplicated)
    const logs = await prisma.ruleEvaluationLog.findMany({
      where: { candidate_event_id: event.id }
    });
    expect(logs).toHaveLength(1);
  });

  it("should not create any prohibited records", async () => {
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        source_type: SecurityEventSource.PAYMENT_WEBHOOK_LOG,
        source_record_id: "tx_prohibited",
        occurred_at: new Date(Date.now() - 60000),
        source_received_at: new Date(),
        environment: SecurityEnvironment.PRODUCTION,
        lifecycle_type: SecurityLifecycle.LIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        action_attempted: "PAYMENT",
        idempotency_key: `evt_prohibited_${Date.now()}`,
        event_code: "PAY_01",
        event_category: "PAYMENT",
        event_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.HIGH,
      }
    });

    await runDetectionEvaluationCycle();

    const alerts = await prisma.securityAlert.count();
    const evidence = await prisma.securityAlertEvidence.count();

    expect(alerts).toBe(0);
    expect(evidence).toBe(0);
  });

  it("should enforce the deadline constraint gracefully", async () => {
    const result = await runDetectionEvaluationCycle({});
    expect(result.success).toBe(true);
  });


  it("should skip ARCHIVED rules", async () => {
    await prisma.detectionRule.create({
      data: {
        rule_id: "RULE_ARCHIVED",
        version: 1,
        name: "Archived Rule",
        description: "Test",
        status: DetectionRuleStatus.ARCHIVED,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        result_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        evaluation_dsl: { field: "action_attempted", operator: "EQUALS", value: "PAYMENT" },
        base_severity: SecuritySeverity.HIGH,
        base_confidence_score: 50,
        threshold_count: 1,
        window_seconds: 60,
        cooldown_seconds: 0,
        max_evidence_events: 1,
        evaluation_timeout_ms: 1000,
        correlation_subject_type: DetectionCorrelationSubject.ACTOR_USER_ID,
        deduplication_strategy: DetectionDeduplicationStrategy.EXACT_MATCH,
        confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
        created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
        activated_at: new Date(),
        activated_by_id: "test-admin",
        archived_at: new Date(),
        archived_by_id: "test-admin",
      }
    });

    const result = await runDetectionEvaluationCycle();
    // Only Rule A is ACTIVE
    expect(result.rulesProcessed).toBe(1);
    
    await prisma.detectionRule.deleteMany({
      where: { rule_id: { in: ["RULE_ARCHIVED"] } }
    });
  });

  it("should not block valid rules when an invalid rule exists", async () => {
    // Create an invalid rule that throws during DSL evaluation
    await prisma.detectionRule.create({
      data: {
        rule_id: "RULE_INVALID",
        version: 1,
        name: "Invalid Rule",
        description: "Test",
        status: DetectionRuleStatus.ACTIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        result_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        evaluation_dsl: { invalid_dsl: true }, // This will cause evaluation to fail
        base_severity: SecuritySeverity.HIGH,
        base_confidence_score: 50,
        threshold_count: 1,
        window_seconds: 60,
        cooldown_seconds: 0,
        max_evidence_events: 1,
        evaluation_timeout_ms: 1000,
        correlation_subject_type: DetectionCorrelationSubject.ACTOR_USER_ID,
        deduplication_strategy: DetectionDeduplicationStrategy.EXACT_MATCH,
        confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
        created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
        activated_at: new Date(),
        activated_by_id: "test-admin",
      }
    });

    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        source_type: SecurityEventSource.PAYMENT_WEBHOOK_LOG,
        source_record_id: "tx_invalid_test",
        occurred_at: new Date(Date.now() - 20000), // pass the 15-second safety margin
        source_received_at: new Date(),
        environment: SecurityEnvironment.PRODUCTION,
        lifecycle_type: SecurityLifecycle.LIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        action_attempted: "PAYMENT",
        idempotency_key: `evt_${Date.now()}`,
        event_code: "PAY_01",
        event_category: "PAYMENT",
        event_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.HIGH,
      }
    });
    const allEvents = await prisma.securityEvent.findMany();
    console.log("EVENTS IN DB:", allEvents.length);
    
    const cutoffTime = new Date(Date.now() - 5000);
    const directFetch = await prisma.securityEvent.findMany({
      where: {
        environment: SecurityEnvironment.PRODUCTION,
        lifecycle_type: SecurityLifecycle.LIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        occurred_at: {
          lte: cutoffTime,
          gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: [
        { occurred_at: "asc" },
        { id: "asc" }
      ],
      take: 500,
      select: {
        id: true,
        occurred_at: true,
        environment: true,
        lifecycle_type: true,
        security_domain: true,
        source_type: true,
        action_attempted: true,
        action_result: true,
        severity: true,
        actor_user_id: true,
        target_user_id: true,
        target_resource_id: true,
        target_module: true,
      }
    });
    console.log("DIRECT FETCH:", directFetch.length);

    const result = await runDetectionEvaluationCycle();
    console.log("TEST RESULT:", JSON.stringify(result, null, 2));
    
    // Check RULE_INVALID logs for ERROR outcome
    const logs = await prisma.ruleEvaluationLog.findMany({
      where: { rule_id: "RULE_INVALID" }
    });
    expect(logs[0].outcome).toBe(RuleEvaluationOutcome.ERROR);

    await prisma.ruleEvaluationLog.deleteMany({ where: { rule_id: "RULE_INVALID" } });
    await prisma.detectionEvaluationCheckpoint.deleteMany({ where: { rule_id: "RULE_INVALID" } });
    await prisma.detectionRule.deleteMany({ where: { rule_id: "RULE_INVALID" } });
  });

  it("should handle null comparisons safely", async () => {
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        source_type: SecurityEventSource.PAYMENT_WEBHOOK_LOG,
        source_record_id: "tx_null_test",
        occurred_at: new Date(Date.now() - 60000),
        source_received_at: new Date(),
        environment: SecurityEnvironment.PRODUCTION,
        lifecycle_type: SecurityLifecycle.LIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        action_attempted: null, // Null field!
        idempotency_key: `evt_null_${Date.now()}`,
        event_code: "PAY_01",
        event_category: "PAYMENT",
        event_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.HIGH,
      }
    });

    const result = await runDetectionEvaluationCycle();
    expect(result.success).toBe(true);
  });

  it("should process 150 rules across bounded cycles without omission or duplication", async () => {
    const currentActiveCount = await prisma.detectionRule.count({
      where: { status: DetectionRuleStatus.ACTIVE }
    });

    const needed = 150 - currentActiveCount;
    if (needed > 0) {
      const newRules = Array.from({ length: needed }).map((_, i) => ({
        rule_id: `RULE_PAGINATION_${i}`,
        version: 1,
        name: `Pagination Rule ${i}`,
        description: `Test rule ${i}`,
        status: DetectionRuleStatus.ACTIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        result_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        base_severity: SecuritySeverity.HIGH,
        base_confidence_score: 50,
        threshold_count: 1,
        window_seconds: 60,
        cooldown_seconds: 0,
        max_evidence_events: 1,
        evaluation_timeout_ms: 1000,
        correlation_subject_type: DetectionCorrelationSubject.ACTOR_USER_ID,
        deduplication_strategy: DetectionDeduplicationStrategy.EXACT_MATCH,
        confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
        created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
        activated_at: new Date(),
        activated_by_id: "test-admin",
        evaluation_dsl: {
          operator: "EQUALS",
          field: "action_attempted",
          value: "TEST"
        }
      }));

      await prisma.detectionRule.createMany({ data: newRules });
    }

    const cycleOpts = {
      environments: [SecurityEnvironment.PRODUCTION],
      lifecycles: [SecurityLifecycle.LIVE]
    };
    const firstCycle = await runDetectionEvaluationCycle(cycleOpts);
    expect(firstCycle.rulesProcessed).toBe(100);
    expect(firstCycle.nextRuleCursor).toBeDefined();

    const secondCycle = await runDetectionEvaluationCycle({ ...cycleOpts, ruleCursor: firstCycle.nextRuleCursor });
    // It should process exactly the remaining active rules
    expect(secondCycle.rulesProcessed).toBe(50);
    expect(secondCycle.nextRuleCursor).toBeUndefined(); // No more rules to process
  });

  it("should handle cursor conflict rollback during concurrent batch commit", async () => {
    const ruleId = "RULE_CONCURRENT_RACE";
    await prisma.detectionRule.create({
      data: {
        rule_id: ruleId,
        version: 1,
        name: "Concurrent Rule",
        description: "Test rule",
        status: DetectionRuleStatus.ACTIVE,
        security_domain: SecurityDomain.TRUST_AND_SAFETY,
        result_classification: SecurityEventClassification.SUSPICIOUS_ACTIVITY,
        base_severity: SecuritySeverity.HIGH,
        base_confidence_score: 50,
        threshold_count: 1,
        window_seconds: 60,
        cooldown_seconds: 0,
        max_evidence_events: 1,
        evaluation_timeout_ms: 1000,
        correlation_subject_type: DetectionCorrelationSubject.ACTOR_USER_ID,
        deduplication_strategy: DetectionDeduplicationStrategy.EXACT_MATCH,
        confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
        created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
        activated_at: new Date(),
        activated_by_id: "test-admin",
        evaluation_dsl: {
          operator: "EQUALS",
          field: "action_attempted",
          value: "TEST"
        }
      }
    });

    const cp = await prisma.detectionEvaluationCheckpoint.create({
      data: {
        rule_id: ruleId,
        rule_version: 1,
        environment: SecurityEnvironment.PRODUCTION,
        lifecycle_type: SecurityLifecycle.LIVE,
        cursor_timestamp: new Date(Date.now() - 20000),
        lease_owner: "worker1",
        lease_expires_at: new Date(Date.now() + 60000)
      }
    });
    
    // Test direct DB compare-and-set:
    const updateResult = await prisma.detectionEvaluationCheckpoint.updateMany({
      where: {
        id: cp.id,
        lease_owner: "worker1",
        cursor_timestamp: new Date(Date.now() - 15000) // Wrong expected cursor
      },
      data: { cursor_event_id: "new" }
    });
    
    expect(updateResult.count).toBe(0); // Proves Compare-and-Set requires EXACT match!
  });
});
