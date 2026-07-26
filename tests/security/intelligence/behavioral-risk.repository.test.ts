import { PrismaClient } from "@prisma/client";
import { BehavioralRiskRepository } from "../../../src/lib/security/intelligence/behavioral-risk.repository";
import { BehavioralRiskAssessment, BehavioralRiskSignal } from "../../../src/lib/security/intelligence/behavioral-risk.types";
import { SecurityEnvironment, SecurityLifecycle } from "../../../src/lib/events/taxonomy";

const prisma = new PrismaClient();

describe("BehavioralRiskRepository Integration", () => {
  const testSubjectRef = "repo-test-subject-123";
  const testEnv: SecurityEnvironment = "TEST";
  const testLifecycle: SecurityLifecycle = "LIVE";

  beforeAll(async () => {
    // Clean up any test data before starting
    await prisma.behavioralRiskAssessment.deleteMany({
      where: {
        subject_reference: testSubjectRef,
      }
    });

    // Create required SecurityEvent fixtures to satisfy foreign keys
    await prisma.securityEvent.createMany({
      data: [
        {
          id: "event-a",
          event_code: "AUTH_FAIL",
          source_type: "AUTHENTICATION_SECURITY_LOG",
          source_record_id: "rec-a",
          security_domain: "IDENTITY_AND_ACCESS",
          event_category: "Authentication",
          event_classification: "SUSPICIOUS_ACTIVITY",
          severity: "MEDIUM",
          environment: testEnv,
          lifecycle_type: testLifecycle,
          idempotency_key: "idem-a",
          occurred_at: new Date("2026-01-01T00:00:00Z"),
          source_received_at: new Date("2026-01-01T00:00:00Z"),
        },
        {
          id: "event-b",
          event_code: "AUTH_FAIL",
          source_type: "AUTHENTICATION_SECURITY_LOG",
          source_record_id: "rec-b",
          security_domain: "IDENTITY_AND_ACCESS",
          event_category: "Authentication",
          event_classification: "SUSPICIOUS_ACTIVITY",
          severity: "MEDIUM",
          environment: testEnv,
          lifecycle_type: testLifecycle,
          idempotency_key: "idem-b",
          occurred_at: new Date("2026-01-01T00:00:00Z"),
          source_received_at: new Date("2026-01-01T00:00:00Z"),
        },
        {
          id: "event-c",
          event_code: "ADMIN_ROLE_CHANGE",
          source_type: "AUDIT_LOG",
          source_record_id: "rec-c",
          security_domain: "ADMINISTRATIVE_SECURITY",
          event_category: "Access",
          event_classification: "OBSERVATION",
          severity: "HIGH",
          environment: testEnv,
          lifecycle_type: testLifecycle,
          idempotency_key: "idem-c",
          occurred_at: new Date("2026-01-01T00:00:00Z"),
          source_received_at: new Date("2026-01-01T00:00:00Z"),
        }
      ],
      skipDuplicates: true
    });
  });

  afterAll(async () => {
    await prisma.behavioralRiskAssessment.deleteMany({
      where: {
        subject_reference: testSubjectRef,
      }
    });

    await prisma.securityEvent.deleteMany({
      where: {
        id: { in: ["event-a", "event-b", "event-c"] }
      }
    });
    await prisma.$disconnect();
  });

  const createDummyAssessment = (
    windowStart: Date,
    score: number = 75
  ): BehavioralRiskAssessment => {
    const windowEnd = new Date(windowStart.getTime() + 86400000); // +1 day
    const generatedAt = new Date(windowEnd.getTime() + 1000);

    const signals: BehavioralRiskSignal[] = [
      {
        signalCode: "AUTH_REPEATED_DENIAL",
        title: "Repeated Auth Denials",
        explanation: "Test explanation",
        rawWeight: 50,
        effectiveWeight: 45,
        confidence: "HIGH",
        firstObservedAt: windowStart,
        lastObservedAt: windowEnd,
        sourceCount: 1,
        evidenceEventIds: ["event-a", "event-b"],
        contributingEventTypes: ["AUTH_FAIL"],
      },
      {
        signalCode: "PRIVILEGED_ACTION_ANOMALY",
        title: "Privileged Action",
        explanation: "Test explanation 2",
        rawWeight: 30,
        effectiveWeight: 30,
        confidence: "MEDIUM",
        firstObservedAt: windowStart,
        lastObservedAt: windowEnd,
        sourceCount: 2,
        evidenceEventIds: ["event-c"],
        contributingEventTypes: ["ADMIN_ROLE_CHANGE"],
      }
    ];

    return {
      subjectRef: testSubjectRef,
      score,
      riskBand: score >= 75 ? "HIGH" : "MEDIUM",
      confidence: "HIGH",
      policyVersion: "1.0.0",
      windowStart,
      windowEnd,
      generatedAt,
      contributingSignals: signals,
      evidenceEventIds: ["event-a", "event-b", "event-c"],
      sourceDiversity: 2,
      environment: testEnv,
      lifecycle: testLifecycle,
      advisoryOnly: true,
    };
  };

  test("Fingerprint generation is deterministic", () => {
    const assessmentA = createDummyAssessment(new Date("2026-01-01T00:00:00Z"));
    // Create a clone
    const assessmentB = { ...assessmentA };

    // Reverse the evidence array to prove sort-insensitivity for fingerprinting
    assessmentB.evidenceEventIds = [...assessmentA.evidenceEventIds].reverse();

    const fingerprintA = BehavioralRiskRepository.computeFingerprint(assessmentA);
    const fingerprintB = BehavioralRiskRepository.computeFingerprint(assessmentB);

    expect(fingerprintA).toBeDefined();
    expect(fingerprintA.length).toBe(64); // SHA-256 hex length
    expect(fingerprintA).toBe(fingerprintB);
  });

  test("Saving an assessment writes the assessment, signals, and evidence links atomically", async () => {
    const windowStart = new Date("2026-02-01T00:00:00Z");
    const assessment = createDummyAssessment(windowStart, 85);

    await BehavioralRiskRepository.saveAssessment(assessment);

    // Verify it was written
    const latest = await BehavioralRiskRepository.getLatestAssessment(
      testSubjectRef,
      testEnv,
      testLifecycle
    );

    expect(latest).not.toBeNull();
    expect(latest!.subject_reference).toBe(testSubjectRef);
    expect(latest!.score).toBe(85);
    expect(latest!.signals).toBeDefined();
    expect(latest!.signals!.length).toBe(2);

    const authSignal = latest!.signals!.find(s => s.signal_code === "AUTH_REPEATED_DENIAL");
    expect(authSignal).toBeDefined();
    expect(authSignal!.evidence_links).toBeDefined();
    expect(authSignal!.evidence_links!.length).toBe(2);

    const eventIds = authSignal!.evidence_links!.map(link => link.security_event_id).sort();
    expect(eventIds).toEqual(["event-a", "event-b"]);
  });

  test("Saving an identical assessment gracefully resolves (idempotency)", async () => {
    const windowStart = new Date("2026-02-01T00:00:00Z");
    const assessment = createDummyAssessment(windowStart, 85);

    // First save already happened in previous test, but we can call it again safely
    await expect(BehavioralRiskRepository.saveAssessment(assessment)).resolves.not.toThrow();

    // Verify no duplicates were created
    const history = await BehavioralRiskRepository.getAssessmentHistory(
      testSubjectRef,
      testEnv,
      testLifecycle
    );

    // Should only have 1 entry for this specific windowStart date
    const sameWindow = history.filter(h => h.window_start.getTime() === windowStart.getTime());
    expect(sameWindow.length).toBe(1);
  });

  test("getLatestAssessment and getAssessmentHistory respect bounded limits and sort order", async () => {
    // Generate a few more assessments spaced by 1 hour
    for (let i = 1; i <= 3; i++) {
      const windowStart = new Date(`2026-03-01T0${i}:00:00Z`);
      const assessment = createDummyAssessment(windowStart, 50 + i); // 51, 52, 53
      await BehavioralRiskRepository.saveAssessment(assessment);
    }

    const latest = await BehavioralRiskRepository.getLatestAssessment(
      testSubjectRef,
      testEnv,
      testLifecycle
    );

    expect(latest).not.toBeNull();
    expect(latest!.score).toBe(53); // The latest generatedTime

    const history = await BehavioralRiskRepository.getAssessmentHistory(
      testSubjectRef,
      testEnv,
      testLifecycle,
      2 // limit
    );

    expect(history.length).toBe(2);
    expect(history[0].score).toBe(53);
    expect(history[1].score).toBe(52);
  });
});
