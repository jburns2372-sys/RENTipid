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

export type SocCommandCenterEvent = {
  id: string;
  occurredAt: string;
  eventCode: string;
  category: string;
  classification: string;
  severity: string;
  environment: string;
  lifecycle: string;
  isSimulation: boolean;
  sourceType: string;
  sourceSummary?: string;
  maskedIp?: string;
  locationClassification:
    | "VERIFIED"
    | "PRIVATE_IP"
    | "LOOPBACK"
    | "RESERVED_IP"
    | "TEST_IP"
    | "UNKNOWN";
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  targetType?: string;
  targetReference?: string;
  actionAttempted?: string;
  actionResult?: string;
  processingStatus: string;
  incident?: {
    reference: string;
    status: string;
  };
  response?: {
    reference: string;
    responseType: string;
    status: string;
    rollbackAvailable: boolean;
  };
};

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
