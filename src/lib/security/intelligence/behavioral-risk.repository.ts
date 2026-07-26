import { PrismaClient, Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { BehavioralRiskAssessment } from "./behavioral-risk.types";
import { DBBehavioralRiskAssessment } from "./behavioral-risk-db.types";
import { SecurityEnvironment, SecurityLifecycle } from "../events/taxonomy";

const prisma = new PrismaClient();

export class BehavioralRiskRepository {
  /**
   * Computes a deterministic idempotency fingerprint for the assessment.
   * Based on subject_reference, environment, lifecycle, policy_version, window_start.
   */
  public static computeFingerprint(assessment: BehavioralRiskAssessment): string {
    const data = [
      assessment.subjectRef,
      assessment.environment,
      assessment.lifecycle,
      assessment.policyVersion,
      assessment.windowStart.toISOString(),
      assessment.evidenceEventIds.slice().sort().join(","),
    ].join("|");
    return createHash("sha256").update(data).digest("hex");
  }

  /**
   * Saves the assessment and its signals atomically.
   * Silently ignores duplicate fingerprints (idempotency).
   */
  public static async saveAssessment(assessment: BehavioralRiskAssessment): Promise<void> {
    const fingerprint = this.computeFingerprint(assessment);

    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.behavioralRiskAssessment.findUnique({
          where: { fingerprint },
        });

        if (existing) {
          return; // Idempotent success
        }

        const createdAssessment = await tx.behavioralRiskAssessment.create({
          data: {
            subject_reference: assessment.subjectRef,
            score: assessment.score,
            risk_band: assessment.riskBand,
            confidence: assessment.confidence,
            policy_version: assessment.policyVersion,
            environment: assessment.environment,
            lifecycle: assessment.lifecycle,
            window_start: assessment.windowStart,
            window_end: assessment.windowEnd,
            generated_time: assessment.generatedAt,
            advisory_only: assessment.advisoryOnly,
            source_diversity: assessment.sourceDiversity,
            fingerprint,
          },
        });

        // Add signals if any
        if (assessment.contributingSignals.length > 0) {
          let sortOrdinal = 0;
          for (const signal of assessment.contributingSignals) {
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
              },
            });

            // Add evidence links
            if (signal.evidenceEventIds.length > 0) {
              const evidenceLinks = signal.evidenceEventIds.map((eventId) => ({
                signal_id: createdSignal.id,
                security_event_id: eventId,
              }));

              await tx.behavioralRiskEvidenceLink.createMany({
                data: evidenceLinks,
                skipDuplicates: true,
              });
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // Unique constraint failed on the fingerprint - safe to ignore
        return;
      }
      throw error;
    }
  }

  /**
   * Retrieves the latest assessment for a subject.
   */
  public static async getLatestAssessment(
    subject_reference: string,
    environment: SecurityEnvironment,
    lifecycle: SecurityLifecycle
  ): Promise<DBBehavioralRiskAssessment | null> {
    return prisma.behavioralRiskAssessment.findFirst({
      where: {
        subject_reference,
        environment,
        lifecycle,
      },
      orderBy: {
        generated_time: "desc",
      },
      include: {
        signals: {
          orderBy: {
            sort_ordinal: "asc",
          },
          include: {
            evidence_links: true,
          },
        },
      },
    }) as unknown as Promise<DBBehavioralRiskAssessment | null>;
  }

  /**
   * Retrieves the assessment history for a subject.
   */
  public static async getAssessmentHistory(
    subject_reference: string,
    environment: SecurityEnvironment,
    lifecycle: SecurityLifecycle,
    limit: number = 10
  ): Promise<DBBehavioralRiskAssessment[]> {
    return prisma.behavioralRiskAssessment.findMany({
      where: {
        subject_reference,
        environment,
        lifecycle,
      },
      orderBy: {
        generated_time: "desc",
      },
      take: limit,
      include: {
        signals: {
          orderBy: {
            sort_ordinal: "asc",
          },
          include: {
            evidence_links: true,
          },
        },
      },
    }) as unknown as Promise<DBBehavioralRiskAssessment[]>;
  }
}
