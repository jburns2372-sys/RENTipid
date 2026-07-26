import { evaluateBehavioralRisk } from "../../../src/lib/security/intelligence/behavioral-risk.engine";
import { DEFAULT_BEHAVIORAL_POLICY } from "../../../src/lib/security/intelligence/behavioral-risk.policy";
import { NormalizedEventEvidence } from "../../../src/lib/security/intelligence/behavioral-risk.types";

describe("Behavioral Risk Engine", () => {
  const baseContext = {
    subjectRef: "user_123",
    evaluationTime: new Date("2026-07-26T12:00:00.000Z"),
    environment: "PRODUCTION" as const,
    lifecycle: "LIVE" as const,
  };

  const createEvent = (overrides: Partial<NormalizedEventEvidence>): NormalizedEventEvidence => ({
    eventId: "evt_" + Math.random().toString(36).substr(2, 9),
    eventType: "TEST_EVENT",
    category: "GENERAL",
    severity: "LOW",
    occurredAt: new Date("2026-07-26T10:00:00.000Z"),
    sourceId: "SYSTEM_A",
    environment: "PRODUCTION",
    lifecycle: "LIVE",
    subjectRef: "user_123",
    ...overrides,
  });

  it("returns zero risk when evidence is empty", () => {
    const result = evaluateBehavioralRisk(baseContext, []);
    expect(result.score).toBe(0);
    expect(result.riskBand).toBe("LOW");
    expect(result.advisoryOnly).toBe(true);
    expect(result.contributingSignals.length).toBe(0);
  });

  it("produces deterministic output for same input", () => {
    const event = createEvent({});
    const res1 = evaluateBehavioralRisk(baseContext, [event]);
    const res2 = evaluateBehavioralRisk(baseContext, [event]);
    expect(res1).toEqual(res2);
  });

  it("deduplicates duplicate event IDs", () => {
    const event = createEvent({ eventId: "duplicate_123", severity: "HIGH" });
    const result = evaluateBehavioralRisk(baseContext, [event, event, event]);
    // With 1 high severity event, HIGH_SEVERITY_CONCENTRATION requires threshold 2.
    // So it should have 0 signals because duplicates are ignored.
    expect(result.contributingSignals.length).toBe(0);
    expect(result.evidenceEventIds.length).toBe(1);
  });

  it("excludes events outside the time window and future events safely", () => {
    const eventOld = createEvent({ occurredAt: new Date("2020-01-01T00:00:00.000Z"), severity: "CRITICAL" });
    const eventFuture = createEvent({ occurredAt: new Date("2026-07-27T00:00:00.000Z"), severity: "CRITICAL" });
    
    const result = evaluateBehavioralRisk(baseContext, [eventOld, eventFuture]);
    expect(result.evidenceEventIds.length).toBe(0);
    expect(result.score).toBe(0);
  });

  it("isolates different environments and lifecycles", () => {
    const eventStaging = createEvent({ environment: "STAGING" as "PRODUCTION" }); // invalid env but bypass TS using as
    const eventTest = createEvent({ lifecycle: "TESTING" as "LIVE" }); // invalid lifecycle but bypass TS using as
    
    // forcefully override values at runtime
    Object.assign(eventStaging, { environment: "STAGING" });
    Object.assign(eventTest, { lifecycle: "TESTING" });
    
    const result = evaluateBehavioralRisk(baseContext, [eventStaging, eventTest]);
    expect(result.evidenceEventIds.length).toBe(0);
  });

  it("generates an explainable signal for repeated denial evidence", () => {
    const denials = Array.from({ length: 4 }).map(() => createEvent({
      category: "AUTH",
      outcome: "DENIED",
    }));

    const result = evaluateBehavioralRisk(baseContext, denials);
    const signal = result.contributingSignals.find(s => s.signalCode === "AUTH_REPEATED_DENIAL");
    expect(signal).toBeDefined();
    expect(signal?.title).toBe("Repeated Authentication Denials");
    expect(result.score).toBeGreaterThan(0);
  });

  it("generates an explainable signal for privileged events", () => {
    const privEvent = createEvent({
      category: "ADMIN",
      eventType: "ROLE_CHANGE"
    });
    
    const result = evaluateBehavioralRisk(baseContext, [privEvent]);
    const signal = result.contributingSignals.find(s => s.signalCode === "PRIVILEGED_ACTION_ANOMALY");
    expect(signal).toBeDefined();
    expect(result.score).toBeGreaterThan(0);
  });

  it("generates a high-severity concentration signal", () => {
    const events = Array.from({ length: 3 }).map(() => createEvent({
      severity: "CRITICAL"
    }));
    
    const result = evaluateBehavioralRisk(baseContext, events);
    const signal = result.contributingSignals.find(s => s.signalCode === "HIGH_SEVERITY_CONCENTRATION");
    expect(signal).toBeDefined();
  });

  it("increases source diversity when cross-source evidence exists", () => {
    const events = [
      createEvent({ sourceId: "SRC_A" }),
      createEvent({ sourceId: "SRC_B" })
    ];
    
    const result = evaluateBehavioralRisk(baseContext, events);
    expect(result.sourceDiversity).toBe(2);
    const signal = result.contributingSignals.find(s => s.signalCode === "CROSS_SOURCE_ANOMALY");
    expect(signal).toBeDefined();
    expect(result.score).toBeGreaterThan(0); // Multiplier effect + signal
  });

  it("applies time decay to older evidence", () => {
    // Both are privileged actions. One is very recent, one is exactly at half-life.
    const recentEvent = createEvent({ category: "ADMIN", occurredAt: baseContext.evaluationTime });
    const olderEvent = createEvent({ 
      category: "ADMIN", 
      occurredAt: new Date(baseContext.evaluationTime.getTime() - DEFAULT_BEHAVIORAL_POLICY.timeDecay.halfLifeMs)
    });
    
    const recentResult = evaluateBehavioralRisk(baseContext, [recentEvent]);
    const olderResult = evaluateBehavioralRisk(baseContext, [olderEvent]);
    
    expect(recentResult.score).toBeGreaterThan(olderResult.score);
  });

  it("keeps score between 0 and 100 and enforces caps", () => {
    // Generate massive amount of privileged actions to hit max weight
    const events = Array.from({ length: 20 }).map((_, i) => createEvent({
      eventId: "evt_" + i,
      category: "ADMIN",
      sourceId: "SRC_" + (i % 5) // high diversity
    }));
    
    const result = evaluateBehavioralRisk(baseContext, events);
    
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThan(0);
    
    const privSignal = result.contributingSignals.find(s => s.signalCode === "PRIVILEGED_ACTION_ANOMALY");
    expect(privSignal?.effectiveWeight).toBeLessThanOrEqual(DEFAULT_BEHAVIORAL_POLICY.signalRules.PRIVILEGED_ACTION_ANOMALY.maxWeight);
  });

  it("links every signal to evidence IDs and ensures no raw metadata leaks", () => {
    const event = createEvent({ category: "ADMIN", eventId: "secret_123" });
    const result = evaluateBehavioralRisk(baseContext, [event]);
    
    const signal = result.contributingSignals[0];
    expect(signal.evidenceEventIds).toContain("secret_123");
    expect(result.evidenceEventIds).toContain("secret_123");
    expect("rawMetadata" in result).toBe(false);
  });

  it("remains advisory only without permissions or decisions", () => {
    const result = evaluateBehavioralRisk(baseContext, [createEvent({})]);
    expect(result.advisoryOnly).toBe(true);
    expect("permissionGrants" in result).toBe(false);
    expect("responseCommands" in result).toBe(false);
    expect("accountRestrictions" in result).toBe(false);
  });
});
