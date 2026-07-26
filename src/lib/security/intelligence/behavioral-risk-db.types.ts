import { SecurityEnvironment, SecurityLifecycle } from "@prisma/client";

export interface DBBehavioralRiskAssessment {
  id: string;
  subject_reference: string;
  score: number;
  risk_band: string;
  confidence: string;
  policy_version: string;
  environment: SecurityEnvironment;
  lifecycle: SecurityLifecycle;
  window_start: Date;
  window_end: Date;
  generated_time: Date;
  advisory_only: boolean;
  source_diversity: number;
  fingerprint: string;
  created_at: Date;
  signals?: DBBehavioralRiskSignal[];
}

export interface DBBehavioralRiskSignal {
  id: string;
  assessment_id: string;
  signal_code: string;
  title: string;
  explanation: string;
  raw_weight: number;
  effective_weight: number;
  confidence: string;
  first_observed: Date;
  last_observed: Date;
  source_count: number;
  sort_ordinal: number;
  evidence_links?: DBBehavioralRiskEvidenceLink[];
}

export interface DBBehavioralRiskEvidenceLink {
  signal_id: string;
  security_event_id: string;
  created_at: Date;
}
