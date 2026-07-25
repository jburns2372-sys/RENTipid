import { PrismaClient, Prisma, SecurityEnvironment, SecurityLifecycle, SecuritySeverity, SecurityProcessingStatus, IncidentCaseStatus, SecurityEventClassification } from "@prisma/client";
import { serializePrivacySafeIp } from "../serializers";
import type { 
  SocFilterOptionsDto,
  SocDashboardSummaryDto,
  SocEventFeedItemDto,
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
        processing_status: SecurityProcessingStatus.REJECTED_UNAUTHORIZED
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
        status: { in: [IncidentCaseStatus.OPEN, IncidentCaseStatus.INVESTIGATING, IncidentCaseStatus.ESCALATED, IncidentCaseStatus.AWAITING_ACTION] }
      }
    }),
    prisma.securityEvent.count({
      where: {
        ...whereClause,
        event_classification: { in: [SecurityEventClassification.AUTHENTICATION, SecurityEventClassification.AUTHORIZATION] }
      }
    }),
    prisma.incidentCase.count({
      where: {
        status: { in: [IncidentCaseStatus.OPEN, IncidentCaseStatus.INVESTIGATING, IncidentCaseStatus.ESCALATED, IncidentCaseStatus.AWAITING_ACTION] }
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

export async function getSocEventFeed(filters: SocFilterOptionsDto & { limit?: number; offset?: number; severity?: string; source?: string; processingStatus?: string } = {}): Promise<{ events: SocEventFeedItemDto[], total: number }> {
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
  if (source) whereClause.source_type = source as string;
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
    events: events.map(event => {
      const sourceSummary = event.source_summary as Record<string, unknown>;
      let ipAddress = "Unknown";
      if (sourceSummary && typeof sourceSummary === 'object' && 'ip_address' in sourceSummary) {
        ipAddress = serializePrivacySafeIp(sourceSummary.ip_address as string) || "Unknown";
      }

      return {
        id: event.id,
        timestamp: event.occurred_at.toISOString(),
        severity: event.severity,
        eventCode: event.event_code,
        source: event.source_type,
        location: event.geo_location_summary ? (event.geo_location_summary as Record<string, string>).city + ", " + (event.geo_location_summary as Record<string, string>).country : "Unknown",
        processingResult: event.processing_status,
        isSimulation: event.lifecycle_type === SecurityLifecycle.SIMULATION,
        geo: event.geo_location_summary ? {
            city: (event.geo_location_summary as Record<string, string>).city,
            country: (event.geo_location_summary as Record<string, string>).country,
            latitude: (event.geo_location_summary as Record<string, number>).latitude,
            longitude: (event.geo_location_summary as Record<string, number>).longitude,
            isPrivate: false,
            ipAddress
        } : undefined,
        details: event.event_details as Record<string, unknown>,
        targetResource: event.target_resource_id || "System",
        actorId: event.actor_user_id || "Anonymous"
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
