import { RiskBand, RiskConfidence } from "./behavioral-risk.types";

export interface BehavioralRiskPolicy {
  version: string;
  evaluationWindowMs: number; // e.g. 7 days
  maxTotalScore: number; // Always 100
  minimumEvidenceCount: number;

  riskBandThresholds: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };

  confidenceThresholds: {
    LOW: number; // Score/evidence combination
    MEDIUM: number;
    HIGH: number;
    VERY_HIGH: number;
  };

  // Maps signal code to its max weight and base parameters
  signalRules: {
    [code: string]: {
      baseWeight: number;
      maxWeight: number;
      threshold: number; // Minimum occurrences to trigger
    };
  };

  timeDecay: {
    halfLifeMs: number; // For exponential decay
  };
  
  sourceDiversityMultiplier: {
    [sourceCount: number]: number; // e.g., 1: 1.0, 2: 1.2, 3: 1.5
  };
}

export const DEFAULT_BEHAVIORAL_POLICY: BehavioralRiskPolicy = {
  version: "1.0.0",
  evaluationWindowMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxTotalScore: 100,
  minimumEvidenceCount: 1,

  riskBandThresholds: {
    LOW: 0,
    MEDIUM: 30,
    HIGH: 60,
    CRITICAL: 85,
  },

  confidenceThresholds: {
    LOW: 1, // at least 1 evidence event
    MEDIUM: 3,
    HIGH: 5,
    VERY_HIGH: 10,
  },

  signalRules: {
    AUTH_REPEATED_DENIAL: {
      baseWeight: 10,
      maxWeight: 40,
      threshold: 3, // Requires 3 denials
    },
    PRIVILEGED_ACTION_ANOMALY: {
      baseWeight: 30,
      maxWeight: 60,
      threshold: 1, // Single occurrence matters
    },
    HIGH_SEVERITY_CONCENTRATION: {
      baseWeight: 20,
      maxWeight: 50,
      threshold: 2,
    },
    CROSS_SOURCE_ANOMALY: {
      baseWeight: 15,
      maxWeight: 30,
      threshold: 1,
    }
  },

  timeDecay: {
    halfLifeMs: 3 * 24 * 60 * 60 * 1000, // 3 days half-life
  },

  sourceDiversityMultiplier: {
    1: 1.0,
    2: 1.2,
    3: 1.4,
    4: 1.5,
  }
};

export function determineRiskBand(score: number, policy: BehavioralRiskPolicy): RiskBand {
  if (score >= policy.riskBandThresholds.CRITICAL) return "CRITICAL";
  if (score >= policy.riskBandThresholds.HIGH) return "HIGH";
  if (score >= policy.riskBandThresholds.MEDIUM) return "MEDIUM";
  return "LOW";
}

export function determineConfidence(evidenceCount: number, policy: BehavioralRiskPolicy): RiskConfidence {
  if (evidenceCount >= policy.confidenceThresholds.VERY_HIGH) return "VERY_HIGH";
  if (evidenceCount >= policy.confidenceThresholds.HIGH) return "HIGH";
  if (evidenceCount >= policy.confidenceThresholds.MEDIUM) return "MEDIUM";
  return "LOW";
}
