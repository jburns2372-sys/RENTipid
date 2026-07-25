/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import { PrismaClient, Prisma, SecurityEnvironment, SecurityLifecycle, SecuritySeverity, SecurityProcessingStatus, IncidentCaseStatus, SecurityApprovalStatus, SecurityExecutionStatus, SecurityApprovalGrantState, SecurityEventClassification } from "@prisma/client";
import { serializePrivacySafeIp } from "../serializers";

const prisma = new PrismaClient();

export interface SocCommandCenterFilters {
  environment?: SecurityEnvironment;
  lifecycle?: SecurityLifecycle;
  includeSimulations?: boolean;
}

export async function getSocCommandCenterSummary(filters: SocCommandCenterFilters = {}) {
  const { environment, lifecycle, includeSimulations = false } = filters;

  const whereClause: Prisma.SecurityEventWhereInput = {};
  if (environment) whereClause.environment = environment;
  if (lifecycle) {
    whereClause.lifecycle_type = lifecycle;
  } else if (!includeSimulations) {
    whereClause.lifecycle_type = { not: SecurityLifecycle.SIMULATION };
  }

  // 1. Events Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventsTodayCount = await prisma.securityEvent.count({
    where: {
      ...whereClause,
      occurred_at: { gte: today }
    }
  });

  // 2. Blocked Attempts
  // Authoritative events or audit results showing rejection/denial.
  const blockedAttemptsCount = await prisma.securityEvent.count({
    where: {
      ...whereClause,
      OR: [
        { action_result: { in: ['DENIED', 'REJECTED', 'BLOCKED', 'UNAUTHORIZED', 'UNAUTHENTICATED'] } },
        { event_classification: SecurityEventClassification.POLICY_VIOLATION }
      ]
    }
  });

  // 3. Critical Findings
  const criticalAlertsCount = await prisma.securityAlert.count({
    where: {
      final_severity: SecuritySeverity.CRITICAL,
      primary_event: { ...whereClause }
    }
  });
  
  const incidentWhere: Prisma.IncidentCaseWhereInput = {
    severity: 'CRITICAL',
    status: { in: [IncidentCaseStatus.OPEN, IncidentCaseStatus.INVESTIGATING, IncidentCaseStatus.TRIAGED] }
  };
  const activeCriticalIncidentsCount = await prisma.incidentCase.count({ where: incidentWhere });

  // 4. Authentication Events
  const authEventsCount = await prisma.securityEvent.count({
    where: {
      ...whereClause,
      event_category: 'AUTHENTICATION',
      OR: [
        { action_result: { in: ['DENIED', 'FAILED'] } },
        { event_code: { in: ['AUTH_FAILURE', 'LOGIN_FAILURE', 'TOKEN_INVALID', 'SESSION_REVOKED'] } }
      ]
    }
  });

  // 5. Active Incidents
  const activeIncidentsCount = await prisma.incidentCase.count({
    where: {
      status: { in: [IncidentCaseStatus.OPEN, IncidentCaseStatus.INVESTIGATING, IncidentCaseStatus.TRIAGED, IncidentCaseStatus.CONTAINMENT_PENDING] }
    }
  });

  const lastSuccessfulEvent = await prisma.securityEvent.findFirst({
    orderBy: { ingested_at: 'desc' },
    select: { ingested_at: true }
  });

  const emergencyFreezeSetting = await prisma.systemSetting.findUnique({
    where: { setting_key: 'SOC_RESPONSE_EMERGENCY_FREEZE' }
  });
  const isEmergencyFreezeActive = emergencyFreezeSetting?.setting_value !== 'FALSE';

  return {
    kpis: {
      eventsToday: eventsTodayCount,
      blockedAttempts: blockedAttemptsCount,
      criticalFindings: criticalAlertsCount + activeCriticalIncidentsCount,
      authenticationEvents: authEventsCount,
      activeIncidents: activeIncidentsCount,
    },
    emergencyFreezeActive: isEmergencyFreezeActive,
    lastRefreshed: new Date().toISOString(),
    lastSuccessfulNormalization: lastSuccessfulEvent?.ingested_at.toISOString() || null
  };
}

export async function getSocLiveEventFeed(
  filters: SocCommandCenterFilters & { limit?: number; offset?: number; severity?: SecuritySeverity; source?: string; processingStatus?: SecurityProcessingStatus } = {}
) {
  const { environment, lifecycle, includeSimulations = false, limit = 50, offset = 0, severity, source, processingStatus } = filters;

  const whereClause: Prisma.SecurityEventWhereInput = {};
  if (environment) whereClause.environment = environment;
  if (lifecycle) {
    whereClause.lifecycle_type = lifecycle;
  } else if (!includeSimulations) {
    whereClause.lifecycle_type = { not: SecurityLifecycle.SIMULATION };
  }
  if (severity) whereClause.severity = severity;
  if (source) whereClause.source_type = source as any;
  if (processingStatus) whereClause.processing_status = processingStatus;

  const events = await prisma.securityEvent.findMany({
    where: whereClause,
    orderBy: { occurred_at: 'desc' },
    take: limit,
    skip: offset,
    include: {
      primaryAlerts: { select: { id: true, final_severity: true } },
      primary_incident_cases: { select: { id: true, status: true, case_reference: true } }
    }
  });

  return events.map(event => ({
    id: event.id,
    timestamp: event.occurred_at.toISOString(),
    severity: event.severity,
    eventCode: event.event_code,
    classification: event.event_classification,
    source: event.source_type,
    environment: event.environment,
    lifecycle: event.lifecycle_type,
    location: "Unknown", // No geographic data stored
    target: event.target_resource_id || event.target_user_id || "System",
    processingResult: event.processing_status,
    actionResult: event.action_result,
    incidentStatus: event.primary_incident_cases?.[0]?.status || null,
    incidentRef: event.primary_incident_cases?.[0]?.case_reference || null,
    alertSeverity: event.primaryAlerts?.[0]?.final_severity || null,
    isSimulation: event.lifecycle_type === SecurityLifecycle.SIMULATION
  }));
}

export async function getSocApprovedResponses(filters: { limit?: number; offset?: number; includeSimulations?: boolean } = {}) {
  const { limit = 20, offset = 0, includeSimulations = false } = filters;

  const executions = await prisma.securityResponseExecution.findMany({
    orderBy: { id: 'desc' },
    take: limit,
    skip: offset,
    include: {
      approval_grant: {
        include: { request: true }
      },
      requested_by: { select: { full_name: true, email: true } },
      executed_by: { select: { full_name: true, email: true } }
    }
  });

  return executions.map((ex: any) => ({
    id: ex.id,
    responseType: ex.response_type,
    targetType: ex.target_type,
    targetId: ex.target_id,
    executionStatus: ex.status,
    requestState: ex.approval_grant?.request?.status || null,
    grantState: ex.approval_grant?.grant_state || null,
    operator: ex.executed_by?.full_name || ex.executed_by?.email || "Unknown",
    startedAt: ex.started_at?.toISOString() || null,
    completedAt: ex.completed_at?.toISOString() || null,
    isRollbackAvailable: ['SUCCEEDED', 'ROLLBACK_FAILED'].includes(ex.status) && (ex.approval_grant?.request?.playbook_id !== ''),
    isSimulation: ex.response_type === 'NOOP_SIMULATION'
  }));
}

export async function getSocEventDetails(eventId: string) {
  const event = await prisma.securityEvent.findUnique({
    where: { id: eventId },
    include: {
      primaryAlerts: true,
      primary_incident_cases: true,
    }
  });

  if (!event) return null;

  // Privacy safe mapping
  const sourceSummary = event.source_summary as any;
  let ipAddress = "Unknown";
  if (sourceSummary && typeof sourceSummary === 'object' && 'ip_address' in sourceSummary) {
    ipAddress = serializePrivacySafeIp(sourceSummary.ip_address as string);
  }

  return {
    id: event.id,
    eventCode: event.event_code,
    securityDomain: event.security_domain,
    eventCategory: event.event_category,
    classification: event.event_classification,
    severity: event.severity,
    confidence: event.confidence_score,
    environment: event.environment,
    lifecycle: event.lifecycle_type,
    timestamp: event.occurred_at.toISOString(),
    sourceType: event.source_type,
    ipAddress: ipAddress,
    location: "Unknown",
    targetResource: event.target_resource_id,
    actionAttempted: event.action_attempted,
    authorizationResult: event.action_result,
    processingStatus: event.processing_status,
    alertCount: event.primaryAlerts.length,
    incidentCount: event.primary_incident_cases.length,
    alerts: event.primaryAlerts.map(a => ({ id: a.id, severity: a.final_severity })),
    incidents: event.primary_incident_cases.map(ic => ({ id: ic.id, status: ic.status, ref: ic.case_reference })),
    isSimulation: event.lifecycle_type === SecurityLifecycle.SIMULATION
  };
}
