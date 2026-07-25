import { PrismaClient, Prisma, SecurityEnvironment, SecurityLifecycle, SecuritySeverity, SecurityProcessingStatus, IncidentCaseStatus, SecurityEventClassification, SecurityEventSource } from "@prisma/client";
import { serializePrivacySafeIp } from "../serializers";
import type { 
  SocFilterOptionsDto,
  SocDashboardSummaryDto,
  SocCommandCenterEvent,
  SocApprovedResponseSummaryDto
} from "./dto";

const prisma = new PrismaClient();

// Use existing requireSecurityPermission from your authorization module if running in a real route
export async function getSocDashboardSummary(filters: SocFilterOptionsDto = {}): Promise<SocDashboardSummaryDto> {
  const { environment, lifecycle, includeSimulations = false } = filters;
  
  const whereClause: Prisma.SecurityEventWhereInput = {};
  
  if (environment) whereClause.environment = environment as SecurityEnvironment;
  
  if (lifecycle) {
    whereClause.lifecycle_type = lifecycle as SecurityLifecycle;
  } else if (!includeSimulations) {
    whereClause.lifecycle_type = { not: SecurityLifecycle.SIMULATION };
  }

  // Ensure deterministic day boundary (UTC for simplicity)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [eventsToday, blockedAttempts, criticalAlerts, activeCriticalIncidents, authEvents, activeIncidentsCount] = await Promise.all([
    prisma.securityEvent.count({
      where: {
        ...whereClause,
        occurred_at: { gte: today }
      }
    }),
    prisma.securityEvent.count({
      where: {
        ...whereClause,
        processing_status: SecurityProcessingStatus.QUARANTINED
      }
    }),
    prisma.securityEvent.count({
      where: {
        ...whereClause,
        severity: SecuritySeverity.CRITICAL
      }
    }),
    prisma.incidentCase.count({
      where: {
        severity: 'CRITICAL',
        status: { in: [IncidentCaseStatus.OPEN, IncidentCaseStatus.TRIAGED, IncidentCaseStatus.INVESTIGATING, IncidentCaseStatus.CONTAINMENT_PENDING, IncidentCaseStatus.REOPENED] }
      }
    }),
    prisma.securityEvent.count({
      where: {
        ...whereClause,
        event_classification: { in: [SecurityEventClassification.ATTACK_ATTEMPT, SecurityEventClassification.SUSPICIOUS_ACTIVITY] } // Using valid enums related to auth
      }
    }),
    prisma.incidentCase.count({
      where: {
        status: { in: [IncidentCaseStatus.OPEN, IncidentCaseStatus.TRIAGED, IncidentCaseStatus.INVESTIGATING, IncidentCaseStatus.CONTAINMENT_PENDING, IncidentCaseStatus.REOPENED] }
      }
    })
  ]);

  return {
    kpis: {
      eventsToday,
      blockedAttempts,
      criticalFindings: criticalAlerts + activeCriticalIncidents,
      authenticationEvents: authEvents,
      activeIncidents: activeIncidentsCount
    },
    lastRefreshed: new Date().toISOString(),
    emergencyFreezeActive: false
  };
}

export async function getSocEventFeed(filters: SocFilterOptionsDto & { limit?: number; offset?: number; severity?: string; source?: string; processingStatus?: string } = {}): Promise<{ events: SocCommandCenterEvent[], total: number }> {
  const { environment, lifecycle, includeSimulations = false, limit = 50, offset = 0, severity, source, processingStatus } = filters;
  
  const safeLimit = Math.min(Math.max(1, limit), 200);

  const whereClause: Prisma.SecurityEventWhereInput = {};
  
  if (environment) whereClause.environment = environment as SecurityEnvironment;
  
  if (lifecycle) {
    whereClause.lifecycle_type = lifecycle as SecurityLifecycle;
  } else if (!includeSimulations) {
    whereClause.lifecycle_type = { not: SecurityLifecycle.SIMULATION };
  }
  
  if (severity) whereClause.severity = severity as SecuritySeverity;
  if (source) whereClause.source_type = source as SecurityEventSource;
  if (processingStatus) whereClause.processing_status = processingStatus as SecurityProcessingStatus;
  
  const [total, events] = await Promise.all([
    prisma.securityEvent.count({ where: whereClause }),
    prisma.securityEvent.findMany({
      where: whereClause,
      orderBy: { occurred_at: 'desc' },
      take: safeLimit,
      skip: offset
    })
  ]);

  return {
    total,
    events: events.map((event): SocCommandCenterEvent => {
      const sourceSummary = event.source_summary as Record<string, unknown> | null;
      let ipAddress = "Unknown";
      if (sourceSummary && typeof sourceSummary === 'object' && 'ip_address' in sourceSummary) {
        ipAddress = serializePrivacySafeIp(sourceSummary.ip_address as string) || "Unknown";
      }

      return {
        id: event.id,
        occurredAt: event.occurred_at.toISOString(),
        eventCode: event.event_code,
        category: event.event_category,
        classification: event.event_classification,
        severity: event.severity,
        environment: event.environment,
        lifecycle: event.lifecycle_type,
        isSimulation: event.lifecycle_type === SecurityLifecycle.SIMULATION,
        sourceType: event.source_type,
        sourceSummary: sourceSummary ? JSON.stringify(sourceSummary) : undefined,
        maskedIp: ipAddress !== "Unknown" ? ipAddress : undefined,
        locationClassification: "UNKNOWN",
        targetReference: event.target_resource_id || undefined,
        targetType: event.target_module || undefined,
        actionAttempted: event.action_attempted || undefined,
        actionResult: event.action_result || undefined,
        processingStatus: event.processing_status
      };
    })
  };
}

export async function getSocApprovedResponses(filters: SocFilterOptionsDto & { limit?: number; offset?: number } = {}): Promise<SocApprovedResponseSummaryDto[]> {
  const { limit = 20, offset = 0 } = filters;
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const executions = await prisma.securityResponseExecution.findMany({
    orderBy: { id: 'desc' },
    take: safeLimit,
    skip: offset,
    include: {
      approval_grant: {
        include: { request: true }
      },
      requested_by: { select: { full_name: true, email: true } },
      executed_by: { select: { full_name: true, email: true } }
    }
  });

  return executions.map(ex => ({
    id: ex.id,
    responseType: ex.response_type,
    targetType: ex.target_type,
    targetId: ex.target_id,
    executionStatus: ex.status,
    operator: ex.executed_by.full_name || "Unknown Operator",
    startedAt: ex.started_at ? ex.started_at.toISOString() : null,
    isRollbackAvailable: false, 
    isSimulation: false 
  }));
}
