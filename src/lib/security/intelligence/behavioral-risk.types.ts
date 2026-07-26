import { SecurityEnvironment, SecurityLifecycle, SecuritySeverity } from "../events/taxonomy";

export type RiskBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskConfidence = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type BehavioralSignalCode =
  | "AUTH_REPEATED_DENIAL"
  | "PRIVILEGED_ACTION_ANOMALY"
  | "HIGH_SEVERITY_CONCENTRATION"
  | "CROSS_SOURCE_ANOMALY";

/**
 * Minimal privacy-safe input type representing normalized event evidence.
 * Contains only fields supported by inherited SecurityEvent evidence.
 */
export interface NormalizedEventEvidence {
  eventId: string;
  eventType: string;
  category: string;
  severity: SecuritySeverity;
  occurredAt: Date;
  outcome?: string | null;
  subjectRef?: string | null;
  actorRef?: string | null;
  sourceId: string;
  environment: SecurityEnvironment;
  lifecycle: SecurityLifecycle;
}

export interface BehavioralRiskSignal {
  signalCode: BehavioralSignalCode;
  title: string;
  explanation: string;
  rawWeight: number;
  effectiveWeight: number;
  confidence: RiskConfidence;
  firstObservedAt: Date;
  lastObservedAt: Date;
  evidenceEventIds: string[];
  contributingEventTypes: string[];
  sourceCount: number;
}

export interface BehavioralRiskAssessment {
  subjectRef: string;
  score: number;
  riskBand: RiskBand;
  confidence: RiskConfidence;
  policyVersion: string;
  windowStart: Date;
  windowEnd: Date;
  generatedAt: Date;
  contributingSignals: BehavioralRiskSignal[];
  evidenceEventIds: string[];
  sourceDiversity: number;
  environment: SecurityEnvironment;
  lifecycle: SecurityLifecycle;
  advisoryOnly: true;
}
