export interface SocKpiValuesDto {
  eventsToday: number;
  blockedAttempts: number;
  criticalFindings: number;
  authenticationEvents: number;
  activeIncidents: number;
}

export interface SocDashboardSummaryDto {
  kpis: SocKpiValuesDto;
  lastRefreshed: string;
  emergencyFreezeActive: boolean;
}

export interface SocLocationSummaryDto {
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  isPrivate: boolean;
  ipAddress: string | null;
}

export interface SocEventFeedItemDto {
  id: string;
  timestamp: string;
  severity: string;
  eventCode: string;
  source: string;
  location: string;
  processingResult: string;
  isSimulation: boolean;
  geo?: SocLocationSummaryDto;
  details?: Record<string, unknown>;
  targetResource?: string;
  actorId?: string;
}

export interface SocSelectedEventDetailsDto extends SocEventFeedItemDto {
  incidentCaseId?: string;
}

export interface SocIncidentReferenceDto {
  id: string;
  status: string;
  severity: string;
}

export interface SocApprovedResponseSummaryDto {
  id: string;
  responseType: string;
  targetType: string;
  targetId: string;
  executionStatus: string;
  operator: string;
  startedAt: string | null;
  isRollbackAvailable: boolean;
  isSimulation: boolean;
}

export interface SocSimulationSummaryDto {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface SocPaginationMetadataDto {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SocFilterOptionsDto {
  environment?: string;
  lifecycle?: string;
  includeSimulations?: boolean;
  limit?: number;
}
