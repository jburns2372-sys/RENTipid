import "server-only";

import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MaintenanceHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "FAILED"
  | "UNKNOWN";

export const MAINTENANCE_CAPABILITIES = Object.freeze({
  arbitrarySql: false,
  shellExecution: false,
  arbitraryScriptExecution: false,
  securityEventDeletion: false,
  auditLogDeletion: false,
  rbacOverride: false,
  approvalBypass: false,
  stateChangingActions: Object.freeze([]) as readonly string[],
});

type MaintenanceDatabase = Pick<
  PrismaClient,
  | "user"
  | "securityEvent"
  | "securityEventIngestionFailure"
  | "securityEventIngestionCheckpoint"
  | "incidentCase"
  | "detectionRule"
  | "ruleEvaluationLog"
  | "detectionEvaluationCheckpoint"
  | "auditLog"
>;

export interface MaintenanceHealthSnapshot {
  checkedAt: Date;
  overallStatus: MaintenanceHealthStatus;
  database: {
    status: MaintenanceHealthStatus;
  };
  ingestion: {
    status: MaintenanceHealthStatus;
    latestEventAt: Date | null;
    latestSuccessfulRunAt: Date | null;
    latestRunCompletedAt: Date | null;
    unresolvedFailures: number | null;
    backlogCount: number | null;
    latestFailureAt: Date | null;
    retryableFailedItems: null;
  };
  incidents: {
    status: MaintenanceHealthStatus;
    openCount: number | null;
    containmentPendingCount: number | null;
    latestActivityAt: Date | null;
    latestSuccessfulProcessingAt: Date | null;
    failedProcessingCount: null;
    queuedProcessingCount: null;
  };
  detectionRules: {
    status: MaintenanceHealthStatus;
    activeCount: number | null;
    inactiveCount: number | null;
    quarantinedCount: number | null;
    configurationErrorCount: null;
    recentEvaluationErrorCount: number | null;
    latestEvaluationAt: Date | null;
    latestSuccessfulRunAt: Date | null;
  };
  audit: {
    status: MaintenanceHealthStatus;
    latestAuditAt: Date | null;
    recentWriteCount: number | null;
  };
  recentMaintenanceActivity: Array<{
    action: string;
    createdAt: Date;
  }>;
}

function deriveOverallStatus(
  statuses: readonly MaintenanceHealthStatus[],
): MaintenanceHealthStatus {
  if (statuses.includes("FAILED")) return "FAILED";
  if (statuses.includes("DEGRADED")) return "DEGRADED";
  if (statuses.includes("UNKNOWN")) return "UNKNOWN";
  return "HEALTHY";
}

async function readDatabaseHealth(
  database: MaintenanceDatabase,
): Promise<MaintenanceHealthSnapshot["database"]> {
  try {
    await database.user.findFirst({ select: { id: true } });
    return { status: "HEALTHY" };
  } catch {
    return { status: "FAILED" };
  }
}

async function readIngestionHealth(
  database: MaintenanceDatabase,
): Promise<MaintenanceHealthSnapshot["ingestion"]> {
  try {
    const [latestEvent, latestCheckpoint, unresolvedFailures, backlogCount, latestFailure] =
      await Promise.all([
        database.securityEvent.findFirst({
          orderBy: { ingested_at: "desc" },
          select: { ingested_at: true },
        }),
        database.securityEventIngestionCheckpoint.findFirst({
          orderBy: { updated_at: "desc" },
          select: {
            last_successful_run_at: true,
            last_run_completed_at: true,
            last_error_code: true,
          },
        }),
        database.securityEventIngestionFailure.count({
          where: { resolved_event_id: null },
        }),
        database.securityEvent.count({
          where: {
            processing_status: { in: ["PENDING", "ENRICHMENT_PENDING"] },
          },
        }),
        database.securityEventIngestionFailure.findFirst({
          where: { resolved_event_id: null },
          orderBy: { last_failed_at: "desc" },
          select: { last_failed_at: true },
        }),
      ]);

    const hasData = Boolean(latestEvent || latestCheckpoint);
    const status: MaintenanceHealthStatus =
      unresolvedFailures > 0 || backlogCount > 0 || latestCheckpoint?.last_error_code
        ? "DEGRADED"
        : hasData
          ? "HEALTHY"
          : "UNKNOWN";

    return {
      status,
      latestEventAt: latestEvent?.ingested_at ?? null,
      latestSuccessfulRunAt: latestCheckpoint?.last_successful_run_at ?? null,
      latestRunCompletedAt: latestCheckpoint?.last_run_completed_at ?? null,
      unresolvedFailures,
      backlogCount,
      latestFailureAt: latestFailure?.last_failed_at ?? null,
      retryableFailedItems: null,
    };
  } catch {
    return {
      status: "FAILED",
      latestEventAt: null,
      latestSuccessfulRunAt: null,
      latestRunCompletedAt: null,
      unresolvedFailures: null,
      backlogCount: null,
      latestFailureAt: null,
      retryableFailedItems: null,
    };
  }
}

async function readIncidentHealth(
  database: MaintenanceDatabase,
): Promise<MaintenanceHealthSnapshot["incidents"]> {
  try {
    const [openCount, containmentPendingCount, latestActivity, latestSuccess] =
      await Promise.all([
        database.incidentCase.count({
          where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
        }),
        database.incidentCase.count({
          where: { status: "CONTAINMENT_PENDING" },
        }),
        database.incidentCase.findFirst({
          orderBy: { updated_at: "desc" },
          select: { updated_at: true },
        }),
        database.incidentCase.findFirst({
          where: { status: { in: ["RESOLVED", "CLOSED"] } },
          orderBy: { updated_at: "desc" },
          select: { updated_at: true },
        }),
      ]);

    return {
      status: latestActivity || openCount > 0 ? "HEALTHY" : "UNKNOWN",
      openCount,
      containmentPendingCount,
      latestActivityAt: latestActivity?.updated_at ?? null,
      latestSuccessfulProcessingAt: latestSuccess?.updated_at ?? null,
      failedProcessingCount: null,
      queuedProcessingCount: null,
    };
  } catch {
    return {
      status: "FAILED",
      openCount: null,
      containmentPendingCount: null,
      latestActivityAt: null,
      latestSuccessfulProcessingAt: null,
      failedProcessingCount: null,
      queuedProcessingCount: null,
    };
  }
}

async function readDetectionHealth(
  database: MaintenanceDatabase,
  recentSince: Date,
): Promise<MaintenanceHealthSnapshot["detectionRules"]> {
  try {
    const [activeCount, inactiveCount, quarantinedCount, recentErrors, latestEvaluation, latestCheckpoint] =
      await Promise.all([
        database.detectionRule.count({ where: { status: "ACTIVE" } }),
        database.detectionRule.count({ where: { status: { not: "ACTIVE" } } }),
        database.detectionRule.count({ where: { status: "QUARANTINED" } }),
        database.ruleEvaluationLog.count({
          where: {
            evaluation_timestamp: { gte: recentSince },
            outcome: { in: ["ERROR", "TIMEOUT", "QUARANTINED"] },
          },
        }),
        database.ruleEvaluationLog.findFirst({
          orderBy: { evaluation_timestamp: "desc" },
          select: { evaluation_timestamp: true },
        }),
        database.detectionEvaluationCheckpoint.findFirst({
          orderBy: { updated_at: "desc" },
          select: {
            last_successful_run_at: true,
            privacy_safe_error_code: true,
          },
        }),
      ]);

    const hasData = activeCount + inactiveCount > 0 || latestEvaluation || latestCheckpoint;
    const status: MaintenanceHealthStatus =
      quarantinedCount > 0 ||
      recentErrors > 0 ||
      latestCheckpoint?.privacy_safe_error_code
        ? "DEGRADED"
        : hasData
          ? "HEALTHY"
          : "UNKNOWN";

    return {
      status,
      activeCount,
      inactiveCount,
      quarantinedCount,
      configurationErrorCount: null,
      recentEvaluationErrorCount: recentErrors,
      latestEvaluationAt: latestEvaluation?.evaluation_timestamp ?? null,
      latestSuccessfulRunAt: latestCheckpoint?.last_successful_run_at ?? null,
    };
  } catch {
    return {
      status: "FAILED",
      activeCount: null,
      inactiveCount: null,
      quarantinedCount: null,
      configurationErrorCount: null,
      recentEvaluationErrorCount: null,
      latestEvaluationAt: null,
      latestSuccessfulRunAt: null,
    };
  }
}

async function readAuditHealth(
  database: MaintenanceDatabase,
  recentSince: Date,
): Promise<{
  audit: MaintenanceHealthSnapshot["audit"];
  recentMaintenanceActivity: MaintenanceHealthSnapshot["recentMaintenanceActivity"];
}> {
  try {
    const [latestAudit, recentWriteCount, recentMaintenanceActivity] =
      await Promise.all([
        database.auditLog.findFirst({
          orderBy: { created_at: "desc" },
          select: { created_at: true },
        }),
        database.auditLog.count({
          where: { created_at: { gte: recentSince } },
        }),
        database.auditLog.findMany({
          where: { module: "security_maintenance" },
          orderBy: { created_at: "desc" },
          take: 10,
          select: { action: true, created_at: true },
        }),
      ]);

    return {
      audit: {
        status: latestAudit ? "HEALTHY" : "UNKNOWN",
        latestAuditAt: latestAudit?.created_at ?? null,
        recentWriteCount,
      },
      recentMaintenanceActivity: recentMaintenanceActivity.map((activity) => ({
        action: activity.action,
        createdAt: activity.created_at,
      })),
    };
  } catch {
    return {
      audit: {
        status: "FAILED",
        latestAuditAt: null,
        recentWriteCount: null,
      },
      recentMaintenanceActivity: [],
    };
  }
}

export async function loadMaintenanceHealth(
  database: MaintenanceDatabase = prisma,
  now = new Date(),
): Promise<MaintenanceHealthSnapshot> {
  const recentSince = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [databaseHealth, ingestion, incidents, detectionRules, auditResult] =
    await Promise.all([
      readDatabaseHealth(database),
      readIngestionHealth(database),
      readIncidentHealth(database),
      readDetectionHealth(database, recentSince),
      readAuditHealth(database, recentSince),
    ]);

  return {
    checkedAt: now,
    overallStatus: deriveOverallStatus([
      databaseHealth.status,
      ingestion.status,
      incidents.status,
      detectionRules.status,
      auditResult.audit.status,
    ]),
    database: databaseHealth,
    ingestion,
    incidents,
    detectionRules,
    audit: auditResult.audit,
    recentMaintenanceActivity: auditResult.recentMaintenanceActivity,
  };
}
