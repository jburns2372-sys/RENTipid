import { SecurityEnvironment, SecurityLifecycle } from "../events/taxonomy";
import {
  BehavioralRiskPolicy,
  DEFAULT_BEHAVIORAL_POLICY,
  determineRiskBand,
  determineConfidence
} from "./behavioral-risk.policy";
import {
  NormalizedEventEvidence,
  BehavioralRiskAssessment,
  BehavioralRiskSignal,
  BehavioralSignalCode,
  RiskConfidence
} from "./behavioral-risk.types";

export interface RiskEngineEvaluationContext {
  subjectRef: string;
  evaluationTime: Date;
  environment: SecurityEnvironment;
  lifecycle: SecurityLifecycle;
  policy?: BehavioralRiskPolicy;
}

function calculateTimeDecay(
  weight: number,
  occurredAt: Date,
  evaluationTime: Date,
  halfLifeMs: number
): number {
  const elapsedMs = evaluationTime.getTime() - occurredAt.getTime();
  if (elapsedMs < 0) return weight; // No decay for future events (if they somehow pass filter)
  const periods = elapsedMs / halfLifeMs;
  return weight * Math.pow(0.5, periods);
}

function isAuthDenial(event: NormalizedEventEvidence): boolean {
  const category = (event.category || "").toUpperCase();
  const type = (event.eventType || "").toUpperCase();
  const outcome = (event.outcome || "").toUpperCase();

  const isAuth = category.includes("AUTH") || type.includes("AUTH") || type.includes("LOGIN");
  const isDenial = outcome.includes("FAIL") || outcome.includes("DENY") || outcome.includes("DENIED") || type.includes("FAIL");

  return isAuth && isDenial;
}

function isPrivilegedAction(event: NormalizedEventEvidence): boolean {
  const category = (event.category || "").toUpperCase();
  const type = (event.eventType || "").toUpperCase();

  return category.includes("ADMIN") ||
         type.includes("ROLE") ||
         type.includes("PERMISSION") ||
         type.includes("PRIVILEGED");
}

export function evaluateBehavioralRisk(
  context: RiskEngineEvaluationContext,
  evidence: NormalizedEventEvidence[]
): BehavioralRiskAssessment {
  const policy = context.policy || DEFAULT_BEHAVIORAL_POLICY;
  const windowStart = new Date(context.evaluationTime.getTime() - policy.evaluationWindowMs);

  // 1. Filter, deduplicate, and validate evidence
  const seenIds = new Set<string>();
  const validEvidence: NormalizedEventEvidence[] = [];

  for (const event of evidence) {
    if (!event.eventId) continue;
    if (seenIds.has(event.eventId)) continue;
    seenIds.add(event.eventId);

    if (event.environment !== context.environment) continue;
    if (event.lifecycle !== context.lifecycle) continue;

    // Reject invalid timestamps
    if (!(event.occurredAt instanceof Date) || isNaN(event.occurredAt.getTime())) continue;

    // Ignore future events safely
    if (event.occurredAt.getTime() > context.evaluationTime.getTime()) continue;

    // Ignore events outside the time window
    if (event.occurredAt.getTime() < windowStart.getTime()) continue;

    // Must match subject
    if (event.subjectRef !== context.subjectRef && event.actorRef !== context.subjectRef) continue;

    validEvidence.push(event);
  }

  // If no valid evidence, return early with 0 score
  if (validEvidence.length === 0) {
    return {
      subjectRef: context.subjectRef,
      score: 0,
      riskBand: "LOW",
      confidence: "LOW",
      policyVersion: policy.version,
      windowStart,
      windowEnd: context.evaluationTime,
      generatedAt: context.evaluationTime,
      contributingSignals: [],
      evidenceEventIds: [],
      sourceDiversity: 0,
      environment: context.environment,
      lifecycle: context.lifecycle,
      advisoryOnly: true,
    };
  }

  // 2. Extract signals based on evidence
  const authDenials = validEvidence.filter(isAuthDenial);
  const privilegedActions = validEvidence.filter(isPrivilegedAction);
  const highSeverityEvents = validEvidence.filter(e => e.severity === "HIGH" || e.severity === "CRITICAL");

  const sources = new Set(validEvidence.map(e => e.sourceId));
  const sourceCount = sources.size;

  const signals: BehavioralRiskSignal[] = [];

  const createSignal = (
    code: BehavioralSignalCode,
    events: NormalizedEventEvidence[],
    title: string,
    explanation: string
  ) => {
    const rule = policy.signalRules[code];
    if (!rule || events.length < rule.threshold) return;

    let totalEffectiveWeight = 0;
    let firstObservedAt = events[0].occurredAt;
    let lastObservedAt = events[0].occurredAt;

    const eventIds: string[] = [];
    const eventTypes = new Set<string>();
    const signalSources = new Set<string>();

    for (const e of events) {
      if (e.occurredAt.getTime() < firstObservedAt.getTime()) firstObservedAt = e.occurredAt;
      if (e.occurredAt.getTime() > lastObservedAt.getTime()) lastObservedAt = e.occurredAt;

      eventIds.push(e.eventId);
      eventTypes.add(e.eventType);
      signalSources.add(e.sourceId);

      const decayedWeight = calculateTimeDecay(rule.baseWeight, e.occurredAt, context.evaluationTime, policy.timeDecay.halfLifeMs);
      totalEffectiveWeight += decayedWeight;
    }

    const rawWeight = events.length * rule.baseWeight;
    const cappedEffectiveWeight = Math.min(totalEffectiveWeight, rule.maxWeight);

    let signalConfidence: RiskConfidence = "LOW";
    if (events.length >= 5) signalConfidence = "HIGH";
    else if (events.length >= 3) signalConfidence = "MEDIUM";

    signals.push({
      signalCode: code,
      title,
      explanation,
      rawWeight,
      effectiveWeight: cappedEffectiveWeight,
      confidence: signalConfidence,
      firstObservedAt,
      lastObservedAt,
      evidenceEventIds: eventIds.sort(), // sort deterministically
      contributingEventTypes: Array.from(eventTypes).sort(),
      sourceCount: signalSources.size
    });
  };

  createSignal("AUTH_REPEATED_DENIAL", authDenials, "Repeated Authentication Denials", "Multiple authentication or access denial events observed.");
  createSignal("PRIVILEGED_ACTION_ANOMALY", privilegedActions, "Privileged Action Anomaly", "Sensitive or administrative actions were performed.");
  createSignal("HIGH_SEVERITY_CONCENTRATION", highSeverityEvents, "High Severity Concentration", "Multiple high or critical severity events observed.");

  if (sourceCount > 1) {
    createSignal("CROSS_SOURCE_ANOMALY", validEvidence, "Cross-Source Anomaly", "Risk activity observed across multiple independent sources.");
  }

  // 3. Aggregate score
  let totalScore = 0;
  for (const sig of signals) {
    totalScore += sig.effectiveWeight;
  }

  // Apply source diversity multiplier
  const multiplier = policy.sourceDiversityMultiplier[sourceCount] || (sourceCount > 4 ? 1.5 : 1.0);
  totalScore = totalScore * multiplier;

  // Bound score [0, 100]
  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  // Sort signals deterministically by weight then code
  signals.sort((a, b) => {
    if (b.effectiveWeight !== a.effectiveWeight) return b.effectiveWeight - a.effectiveWeight;
    return a.signalCode.localeCompare(b.signalCode);
  });

  const allEvidenceIds = validEvidence.map(e => e.eventId).sort();

  return {
    subjectRef: context.subjectRef,
    score: totalScore,
    riskBand: determineRiskBand(totalScore, policy),
    confidence: determineConfidence(allEvidenceIds.length, policy),
    policyVersion: policy.version,
    windowStart,
    windowEnd: context.evaluationTime,
    generatedAt: context.evaluationTime,
    contributingSignals: signals,
    evidenceEventIds: allEvidenceIds,
    sourceDiversity: sourceCount,
    environment: context.environment,
    lifecycle: context.lifecycle,
    advisoryOnly: true,
  };
}
