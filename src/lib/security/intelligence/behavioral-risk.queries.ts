import { PrismaClient, SecurityEnvironment, SecurityLifecycle } from "@prisma/client";
import { toPrivacySafeReadModel, PersistedBehavioralRiskAssessment } from "./behavioral-risk.persistence";

const prisma = new PrismaClient();

export const MAX_ASSESSMENT_HISTORY_LIMIT = 50;
const DEFAULT_ASSESSMENT_HISTORY_LIMIT = 10;

export interface QueryContext {
  environment: SecurityEnvironment;
  lifecycle: SecurityLifecycle;
}

export interface SubjectQueryContext extends QueryContext {
  subjectReference: string;
}

export async function getBehavioralRiskAssessmentById(
  id: string,
  context: QueryContext
): Promise<PersistedBehavioralRiskAssessment | null> {
  const dbModel = await prisma.behavioralRiskAssessment.findFirst({
    where: {
      id,
      environment: context.environment,
      lifecycle: context.lifecycle,
    },
    include: {
      signals: {
        orderBy: { sort_ordinal: "asc" },
        include: { evidence_links: { orderBy: { security_event_id: "asc" } } }
      }
    }
  });

  if (!dbModel) return null;
  return toPrivacySafeReadModel(dbModel);
}

export async function getLatestBehavioralRiskAssessmentForSubject(
  context: SubjectQueryContext
): Promise<PersistedBehavioralRiskAssessment | null> {
  const sanitizedSubject = context.subjectReference.trim();
  if (!sanitizedSubject) return null;

  const dbModel = await prisma.behavioralRiskAssessment.findFirst({
    where: {
      subject_reference: sanitizedSubject,
      environment: context.environment,
      lifecycle: context.lifecycle,
    },
    orderBy: {
      generated_time: "desc",
    },
    include: {
      signals: {
        orderBy: { sort_ordinal: "asc" },
        include: { evidence_links: { orderBy: { security_event_id: "asc" } } }
      }
    }
  });

  if (!dbModel) return null;
  return toPrivacySafeReadModel(dbModel);
}

export async function listBehavioralRiskHistoryForSubject(
  context: SubjectQueryContext,
  limit: number = DEFAULT_ASSESSMENT_HISTORY_LIMIT
): Promise<PersistedBehavioralRiskAssessment[]> {
  const sanitizedSubject = context.subjectReference.trim();
  if (!sanitizedSubject) return [];

  if (limit <= 0) {
    throw new Error("Query rejected: limit must be positive.");
  }
  const safeLimit = Math.min(limit, MAX_ASSESSMENT_HISTORY_LIMIT);

  const dbModels = await prisma.behavioralRiskAssessment.findMany({
    where: {
      subject_reference: sanitizedSubject,
      environment: context.environment,
      lifecycle: context.lifecycle,
    },
    orderBy: [
      { generated_time: "desc" },
      { id: "desc" }
    ],
    take: safeLimit,
    include: {
      signals: {
        orderBy: { sort_ordinal: "asc" },
        include: { evidence_links: { orderBy: { security_event_id: "asc" } } }
      }
    }
  });

  return dbModels.map(toPrivacySafeReadModel);
}
