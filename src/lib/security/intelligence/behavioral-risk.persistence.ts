import { PrismaClient, Prisma, SecurityEnvironment, SecurityLifecycle } from "@prisma/client";
import { createHash } from "crypto";
import {
  BehavioralRiskAssessment,
  BehavioralRiskSignal,
  RiskBand,
  RiskConfidence,
  BehavioralSignalCode,
} from "./behavioral-risk.types";
import { DEFAULT_BEHAVIORAL_POLICY } from "./behavioral-risk.policy";

const prisma = new PrismaClient();

export interface PersistenceContext {
  assessment: BehavioralRiskAssessment;
  environment: SecurityEnvironment;
  lifecycle: SecurityLifecycle;
}

export interface PersistedBehavioralRiskAssessment extends BehavioralRiskAssessment {
  id: string;
}

type FullAssessmentPayload = Prisma.BehavioralRiskAssessmentGetPayload<{
  include: { signals: { include: { evidence_links: true } } }
}>;

const VALID_RISK_BANDS = new Set<RiskBand>(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const VALID_CONFIDENCE = new Set<RiskConfidence>(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]);
const VALID_ENVIRONMENTS = new Set<SecurityEnvironment>(["DEVELOPMENT", "TEST", "UAT", "STAGING", "PRODUCTION"]);
const VALID_LIFECYCLES = new Set<SecurityLifecycle>(["LIVE", "TEST", "SIMULATION"]);

function sanitizeSubject(subject: string): string {
  return subject.trim();
}

function isValidDate(d: unknown): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}

export function computeBehavioralRiskFingerprint(context: PersistenceContext): string {
  const subject = sanitizeSubject(context.assessment.subjectRef);
  const environment = context.environment;
  const lifecycle = context.lifecycle;
  const policyVersion = context.assessment.policyVersion;
  const windowStart = context.assessment.windowStart.toISOString();
  const windowEnd = context.assessment.windowEnd.toISOString();

  const allEvidenceIds = new Set<string>();
  context.assessment.contributingSignals.forEach(sig => {
    sig.evidenceEventIds.forEach(id => allEvidenceIds.add(id));
  });
  const sortedEvidence = Array.from(allEvidenceIds).sort().join(",");

  const sortedSignals = [...context.assessment.contributingSignals]
    .sort((a, b) => a.signalCode.localeCompare(b.signalCode))
    .map(s => `${s.signalCode}:${s.effectiveWeight}`)
    .join(",");

  const payload = [
    subject,
    environment,
    lifecycle,
    policyVersion,
    windowStart,
    windowEnd,
    sortedEvidence,
    sortedSignals
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

export async function persistBehavioralRiskAssessment(context: PersistenceContext): Promise<PersistedBehavioralRiskAssessment> {
  const { assessment, environment, lifecycle } = context;

  if (assessment.advisoryOnly !== true) {
    throw new Error("Persistence rejected: non-advisory assessments are prohibited.");
  }

  const sanitizedSubject = sanitizeSubject(assessment.subjectRef);
  if (!sanitizedSubject) {
    throw new Error("Persistence rejected: subject reference cannot be empty.");
  }
  if (!VALID_ENVIRONMENTS.has(environment)) {
    throw new Error("Persistence rejected: invalid environment.");
  }
  if (!VALID_LIFECYCLES.has(lifecycle)) {
    throw new Error("Persistence rejected: invalid lifecycle.");
  }

  if (!Number.isFinite(assessment.score) || assessment.score < 0 || assessment.score > 100) {
    throw new Error("Persistence rejected: score must be finite and between 0 and 100.");
  }

  if (!VALID_RISK_BANDS.has(assessment.riskBand)) {
    throw new Error("Persistence rejected: invalid risk band.");
  }
  if (!VALID_CONFIDENCE.has(assessment.confidence)) {
    throw new Error("Persistence rejected: invalid confidence.");
  }

  if (!isValidDate(assessment.windowStart) || !isValidDate(assessment.windowEnd) || !isValidDate(assessment.generatedAt)) {
    throw new Error("Persistence rejected: malformed dates.");
  }
  if (assessment.windowStart.getTime() > assessment.windowEnd.getTime()) {
    throw new Error("Persistence rejected: windowStart must not be after windowEnd.");
  }
  if (assessment.generatedAt.getTime() < assessment.windowStart.getTime()) {
    throw new Error("Persistence rejected: generatedAt must not be before windowStart.");
  }

  if (!Number.isInteger(assessment.sourceDiversity) || assessment.sourceDiversity < 0) {
    throw new Error("Persistence rejected: source diversity must be non-negative integer.");
  }

  const seenSignalCodes = new Set<string>();
  const uniqueEvidenceIds = new Set<string>();
  const validSignals: BehavioralRiskSignal[] = [];

  for (const signal of assessment.contributingSignals) {
    if (seenSignalCodes.has(signal.signalCode)) {
      throw new Error(`Persistence rejected: duplicate signal code ${signal.signalCode}.`);
    }
    seenSignalCodes.add(signal.signalCode);

    if (!isValidDate(signal.firstObservedAt) || !isValidDate(signal.lastObservedAt)) {
      throw new Error("Persistence rejected: malformed signal dates.");
    }

    if (!Number.isFinite(signal.rawWeight) || signal.rawWeight < 0) {
      throw new Error("Persistence rejected: raw weight must be finite and non-negative.");
    }
    if (!Number.isFinite(signal.effectiveWeight) || signal.effectiveWeight < 0) {
      throw new Error("Persistence rejected: effective weight must be finite and non-negative.");
    }

    const policyRule = DEFAULT_BEHAVIORAL_POLICY.signalRules[signal.signalCode];
    if (policyRule && signal.effectiveWeight > policyRule.maxWeight) {
      throw new Error("Persistence rejected: effective weight exceeds policy cap.");
    }

    if (!Number.isInteger(signal.sourceCount) || signal.sourceCount < 0) {
      throw new Error("Persistence rejected: signal source count must be non-negative integer.");
    }

    const deduplicatedEvidence = Array.from(new Set(signal.evidenceEventIds)).sort();
    deduplicatedEvidence.forEach(id => uniqueEvidenceIds.add(id));

    validSignals.push({
      ...signal,
      evidenceEventIds: deduplicatedEvidence
    });
  }

  const fingerprint = computeBehavioralRiskFingerprint({ ...context, assessment: { ...assessment, contributingSignals: validSignals } });

  const requiredEventIds = Array.from(uniqueEvidenceIds);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.behavioralRiskAssessment.findUnique({
        where: { fingerprint },
        include: {
          signals: {
            orderBy: { sort_ordinal: "asc" },
            include: { evidence_links: { orderBy: { security_event_id: "asc" } } }
          }
        }
      });
      if (existing) {
        return toPrivacySafeReadModel(existing);
      }

      if (requiredEventIds.length > 0) {
        const foundEvents = await tx.securityEvent.findMany({
          where: { id: { in: requiredEventIds } },
          select: { id: true }
        });
        if (foundEvents.length !== requiredEventIds.length) {
          throw new Error("Persistence rejected: missing SecurityEvent evidence.");
        }
      }

      const createdAssessment = await tx.behavioralRiskAssessment.create({
        data: {
          subject_reference: sanitizedSubject,
          score: assessment.score,
          risk_band: assessment.riskBand,
          confidence: assessment.confidence,
          policy_version: assessment.policyVersion,
          environment,
          lifecycle,
          window_start: assessment.windowStart,
          window_end: assessment.windowEnd,
          generated_time: assessment.generatedAt,
          advisory_only: assessment.advisoryOnly,
          source_diversity: assessment.sourceDiversity,
          fingerprint,
        }
      });

      if (validSignals.length > 0) {
        let sortOrdinal = 0;
        for (const signal of validSignals) {
          sortOrdinal++;
          const createdSignal = await tx.behavioralRiskSignal.create({
            data: {
              assessment_id: createdAssessment.id,
              signal_code: signal.signalCode,
              title: signal.title,
              explanation: signal.explanation,
              raw_weight: signal.rawWeight,
              effective_weight: signal.effectiveWeight,
              confidence: signal.confidence,
              first_observed: signal.firstObservedAt,
              last_observed: signal.lastObservedAt,
              source_count: signal.sourceCount,
              sort_ordinal: sortOrdinal,
            }
          });

          if (signal.evidenceEventIds.length > 0) {
            await tx.behavioralRiskEvidenceLink.createMany({
              data: signal.evidenceEventIds.map(eventId => ({
                signal_id: createdSignal.id,
                security_event_id: eventId,
              })),
              skipDuplicates: true
            });
          }
        }
      }

      const fullAssessment = await tx.behavioralRiskAssessment.findUnique({
        where: { id: createdAssessment.id },
        include: {
          signals: {
            orderBy: { sort_ordinal: "asc" },
            include: { evidence_links: { orderBy: { security_event_id: "asc" } } }
          }
        }
      });

      return toPrivacySafeReadModel(fullAssessment!);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.behavioralRiskAssessment.findUnique({
        where: { fingerprint },
        include: {
          signals: {
            orderBy: { sort_ordinal: "asc" },
            include: { evidence_links: { orderBy: { security_event_id: "asc" } } }
          }
        }
      });
      if (existing) {
        return toPrivacySafeReadModel(existing);
      }
    }
    throw error;
  }
}

export function toPrivacySafeReadModel(dbModel: FullAssessmentPayload): PersistedBehavioralRiskAssessment {
  return {
    id: dbModel.id,
    subjectRef: dbModel.subject_reference,
    score: dbModel.score,
    riskBand: dbModel.risk_band as RiskBand,
    confidence: dbModel.confidence as RiskConfidence,
    policyVersion: dbModel.policy_version,
    windowStart: dbModel.window_start,
    windowEnd: dbModel.window_end,
    generatedAt: dbModel.generated_time,
    advisoryOnly: true,
    sourceDiversity: dbModel.source_diversity,
    contributingSignals: dbModel.signals.map(s => ({
      signalCode: s.signal_code as BehavioralSignalCode,
      title: s.title,
      explanation: s.explanation,
      rawWeight: s.raw_weight,
      effectiveWeight: s.effective_weight,
      confidence: s.confidence as RiskConfidence,
      firstObservedAt: s.first_observed,
      lastObservedAt: s.last_observed,
      sourceCount: s.source_count,
      evidenceEventIds: s.evidence_links.map(el => el.security_event_id),
      contributingEventTypes: [],
    })),
    evidenceEventIds: Array.from(new Set(dbModel.signals.flatMap(s => s.evidence_links.map(el => el.security_event_id)))).sort()
  };
}
