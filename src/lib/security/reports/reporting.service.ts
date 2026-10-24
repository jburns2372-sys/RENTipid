import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const REPORT_SEVERITIES = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const REPORT_EVENT_STATUSES = [
  "PENDING",
  "NORMALIZED",
  "ENRICHMENT_PENDING",
  "PROCESSED",
  "FAILED",
  "QUARANTINED",
] as const;
export const REPORT_ENVIRONMENTS = ["DEVELOPMENT", "TEST", "UAT", "STAGING", "PRODUCTION"] as const;
export const REPORT_EVENT_SOURCES = [
  "AUDIT_LOG",
  "SYSTEM_ERROR_LOG",
  "AI_BOT_LOG",
  "PAYMENT_WEBHOOK_LOG",
  "PAYMENT_RECONCILIATION_LOG",
  "PAYMENT_ACTION_LOG",
  "VERIFICATION_DOCUMENT",
  "DAMAGE_CLAIM",
  "DISPUTE_CASE",
  "INSPECTION_REPORT",
  "SYSTEM_SETTING",
  "AUTHENTICATION_SECURITY_LOG",
  "API_SECURITY_LOG",
] as const;
export const SOC_REPORT_TYPES = ["events", "incidents", "responses", "approvals", "rules", "behavioral-risk"] as const;

export type SocReportType = (typeof SOC_REPORT_TYPES)[number];
export type ReportFilterInput = Record<string, string | string[] | undefined>;

export interface SocReportFilters {
  from?: string;
  to?: string;
  severity?: (typeof REPORT_SEVERITIES)[number];
  status?: (typeof REPORT_EVENT_STATUSES)[number];
  source?: (typeof REPORT_EVENT_SOURCES)[number];
  environment?: (typeof REPORT_ENVIRONMENTS)[number];
  eventType?: string;
}

export class ReportFilterValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super("Invalid report filters.");
    this.name = "ReportFilterValidationError";
  }
}

const dateOnlySchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must use YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, "must be a real calendar date");

const reportFilterSchema = z.object({
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  severity: z.enum(REPORT_SEVERITIES).optional(),
  status: z.enum(REPORT_EVENT_STATUSES).optional(),
  source: z.enum(REPORT_EVENT_SOURCES).optional(),
  environment: z.enum(REPORT_ENVIRONMENTS).optional(),
  eventType: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_.:-]+$/, "contains unsupported characters").optional(),
}).superRefine((value, context) => {
  if (!value.from || !value.to) return;

  const from = new Date(`${value.from}T00:00:00.000Z`);
  const to = new Date(`${value.to}T00:00:00.000Z`);
  if (from > to) {
    context.addIssue({ code: "custom", path: ["to"], message: "must be on or after from" });
    return;
  }

  const maximumRangeMs = 366 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > maximumRangeMs) {
    context.addIssue({ code: "custom", path: ["to"], message: "date range cannot exceed 366 days" });
  }
});

const reportTypeSchema = z.enum(SOC_REPORT_TYPES);
const FILTER_KEYS = ["from", "to", "severity", "status", "source", "environment", "eventType"] as const;

export function parseSocReportFilters(input: ReportFilterInput): SocReportFilters {
  const candidate: Record<string, unknown> = {};
  for (const key of FILTER_KEYS) {
    const value = input[key];
    if (value !== undefined && value !== "") candidate[key] = value;
  }

  const result = reportFilterSchema.safeParse(candidate);
  if (!result.success) {
    throw new ReportFilterValidationError(
      result.error.issues.map((issue) => `${issue.path.join(".") || "filter"} ${issue.message}`),
    );
  }
  return result.data;
}

export function parseSocReportType(value: unknown): SocReportType {
  const result = reportTypeSchema.safeParse(value);
  if (!result.success) throw new ReportFilterValidationError(["report type is not supported"]);
  return result.data;
}

export function reportFilterInputFromUrl(searchParams: URLSearchParams): ReportFilterInput {
  const input: ReportFilterInput = {};
  for (const key of FILTER_KEYS) {
    const values = searchParams.getAll(key);
    if (values.length === 1) input[key] = values[0];
    if (values.length > 1) input[key] = values;
  }
  return input;
}

export function reportFiltersToSearchParams(filters: SocReportFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  return params;
}

type ReportsDatabase = Pick<
  PrismaClient,
  | "securityEvent"
  | "incidentCase"
  | "securityResponseExecution"
  | "securityResponseApprovalRequest"
  | "detectionRule"
  | "behavioralRiskAssessment"
>;

const PAGE_ROW_LIMIT = 100;
const EXPORT_ROW_LIMIT = 1_000;

function dateRange(from: string | undefined, to: string | undefined): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
  };
}

function eventWhere(
  filters: SocReportFilters,
  lifecycle: "OPERATIONAL" | "SIMULATION" = "OPERATIONAL",
): Prisma.SecurityEventWhereInput {
  return {
    ...(dateRange(filters.from, filters.to) ? { occurred_at: dateRange(filters.from, filters.to) } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.status ? { processing_status: filters.status } : {}),
    ...(filters.source ? { source_type: filters.source } : {}),
    ...(filters.environment ? { environment: filters.environment } : {}),
    ...(filters.eventType ? { event_code: filters.eventType } : {}),
    lifecycle_type:
      lifecycle === "SIMULATION" ? "SIMULATION" : { not: "SIMULATION" },
  };
}

function incidentWhere(filters: SocReportFilters): Prisma.IncidentCaseWhereInput {
  const supportedSeverity = filters.severity === "INFO" ? undefined : filters.severity;
  return {
    ...(dateRange(filters.from, filters.to) ? { opened_at: dateRange(filters.from, filters.to) } : {}),
    ...(supportedSeverity ? { severity: supportedSeverity } : {}),
    ...(filters.severity === "INFO" ? { severity: { in: [] } } : {}),
  };
}

function responseWhere(filters: SocReportFilters): Prisma.SecurityResponseExecutionWhereInput {
  return dateRange(filters.from, filters.to) ? { created_at: dateRange(filters.from, filters.to) } : {};
}

function approvalWhere(filters: SocReportFilters): Prisma.SecurityResponseApprovalRequestWhereInput {
  return dateRange(filters.from, filters.to) ? { requested_at: dateRange(filters.from, filters.to) } : {};
}

function ruleWhere(filters: SocReportFilters): Prisma.DetectionRuleWhereInput {
  return filters.severity ? { base_severity: filters.severity } : {};
}

function behavioralRiskWhere(filters: SocReportFilters): Prisma.BehavioralRiskAssessmentWhereInput {
  return {
    ...(dateRange(filters.from, filters.to) ? { generated_time: dateRange(filters.from, filters.to) } : {}),
    ...(filters.environment ? { environment: filters.environment } : {}),
  };
}

export async function loadSocReports(
  filters: SocReportFilters,
  db: ReportsDatabase = prisma,
  now: Date = new Date(),
) {
  const eventFilter = eventWhere(filters);
  const simulationEventFilter = eventWhere(filters, "SIMULATION");
  const incidentFilter = incidentWhere(filters);
  const responseFilter = responseWhere(filters);
  const approvalFilter = approvalWhere(filters);
  const ruleFilter = ruleWhere(filters);
  const behavioralFilter = behavioralRiskWhere(filters);

  const [
    totalEvents,
    openIncidents,
    criticalHighIncidents,
    resolvedIncidents,
    pendingApprovals,
    responseActivity,
    activeDetectionRules,
    events,
    incidents,
    responses,
    approvals,
    detectionRules,
    behavioralRisk,
    simulationEvents,
  ] = await Promise.all([
    db.securityEvent.count({ where: eventFilter }),
    db.incidentCase.count({ where: { AND: [incidentFilter, { status: { notIn: ["RESOLVED", "CLOSED"] } }] } }),
    db.incidentCase.count({ where: { AND: [incidentFilter, { severity: { in: ["HIGH", "CRITICAL"] } }] } }),
    db.incidentCase.count({ where: { AND: [incidentFilter, { status: { in: ["RESOLVED", "CLOSED"] } }] } }),
    db.securityResponseApprovalRequest.count({ where: { AND: [approvalFilter, { status: "PENDING" }] } }),
    db.securityResponseExecution.count({ where: responseFilter }),
    db.detectionRule.count({ where: { status: "ACTIVE" } }),
    db.securityEvent.findMany({
      where: eventFilter,
      orderBy: [{ occurred_at: "desc" }, { id: "desc" }],
      take: PAGE_ROW_LIMIT,
      select: {
        id: true,
        occurred_at: true,
        severity: true,
        processing_status: true,
        event_code: true,
        source_type: true,
        environment: true,
        action_result: true,
      },
    }),
    db.incidentCase.findMany({
      where: incidentFilter,
      orderBy: [{ opened_at: "desc" }, { id: "desc" }],
      take: PAGE_ROW_LIMIT,
      select: {
        id: true,
        case_reference: true,
        severity: true,
        status: true,
        origin: true,
        opened_at: true,
        resolved_at: true,
        closed_at: true,
        assigned_user: { select: { full_name: true } },
        security_response_executions: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: { status: true },
        },
      },
    }),
    db.securityResponseExecution.findMany({
      where: responseFilter,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: PAGE_ROW_LIMIT,
      select: {
        id: true,
        status: true,
        response_type: true,
        created_at: true,
        started_at: true,
        completed_at: true,
        failed_at: true,
        playbook: { select: { name: true, playbook_id: true, version: true } },
        incident_case: { select: { case_reference: true } },
        approval_grant: { select: { request: { select: { status: true } } } },
      },
    }),
    db.securityResponseApprovalRequest.findMany({
      where: approvalFilter,
      orderBy: [{ requested_at: "desc" }, { id: "desc" }],
      take: PAGE_ROW_LIMIT,
      select: {
        id: true,
        status: true,
        requested_at: true,
        decision_at: true,
        expires_at: true,
        response_type: true,
        approver: { select: { full_name: true } },
        incident_case: { select: { case_reference: true } },
      },
    }),
    db.detectionRule.findMany({
      where: ruleFilter,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: PAGE_ROW_LIMIT,
      select: {
        id: true,
        rule_id: true,
        version: true,
        name: true,
        status: true,
        security_domain: true,
        base_severity: true,
        threshold_count: true,
        window_seconds: true,
        cooldown_seconds: true,
      },
    }),
    db.behavioralRiskAssessment.groupBy({
      by: ["risk_band", "environment", "lifecycle"],
      where: behavioralFilter,
      orderBy: [{ risk_band: "asc" }, { environment: "asc" }, { lifecycle: "asc" }],
      take: PAGE_ROW_LIMIT,
      _count: { _all: true },
    }),
    db.securityEvent.findMany({
      where: simulationEventFilter,
      orderBy: [{ occurred_at: "desc" }, { id: "desc" }],
      take: PAGE_ROW_LIMIT,
      select: {
        id: true,
        occurred_at: true,
        event_code: true,
        processing_status: true,
        source_type: true,
        environment: true,
        lifecycle_type: true,
        action_result: true,
      },
    }),
  ]);

  return {
    filters,
    generatedAt: now,
    summary: {
      totalEvents,
      openIncidents,
      criticalHighIncidents,
      resolvedIncidents,
      pendingApprovals,
      responseActivity,
      activeDetectionRules,
    },
    events,
    incidents: incidents.map((incident) => {
      const end = incident.closed_at ?? incident.resolved_at ?? now;
      return {
        ...incident,
        ageHours: Math.max(0, Math.floor((end.getTime() - incident.opened_at.getTime()) / 3_600_000)),
        latestResponseStatus: incident.security_response_executions[0]?.status ?? null,
      };
    }),
    responses,
    approvals,
    detectionRules,
    behavioralRisk,
    simulation: { available: true as const, records: simulationEvents },
    rowLimit: PAGE_ROW_LIMIT,
  };
}

export type SocReportsData = Awaited<ReturnType<typeof loadSocReports>>;

type CsvCell = string | number | boolean | Date | null | undefined;
export interface CsvDocument {
  columns: readonly string[];
  rows: ReadonlyArray<Readonly<Record<string, CsvCell>>>;
}

export function neutralizeCsvFormula(value: string): string {
  const withoutNullBytes = value.replace(/\0/g, "");
  return /^[\t\r ]*[=+\-@]/.test(withoutNullBytes) ? `'${withoutNullBytes}` : withoutNullBytes;
}

function csvCell(value: CsvCell): string {
  const serialized = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
  return `"${neutralizeCsvFormula(serialized).replace(/"/g, '""')}"`;
}

export function renderCsv(document: CsvDocument): string {
  const header = document.columns.map(csvCell).join(",");
  const rows = document.rows.map((row) => document.columns.map((column) => csvCell(row[column])).join(","));
  return `\uFEFF${[header, ...rows].join("\r\n")}\r\n`;
}

export async function loadSocReportExport(
  reportType: SocReportType,
  filters: SocReportFilters,
  db: ReportsDatabase = prisma,
): Promise<CsvDocument> {
  switch (reportType) {
    case "events": {
      const data = await db.securityEvent.findMany({
        where: eventWhere(filters),
        orderBy: [{ occurred_at: "desc" }, { id: "desc" }],
        take: EXPORT_ROW_LIMIT,
        select: { occurred_at: true, severity: true, processing_status: true, event_code: true, source_type: true, environment: true, action_result: true },
      });
      return {
        columns: ["occurred_at", "severity", "status", "event_type", "source", "environment", "result"],
        rows: data.map((item) => ({
          occurred_at: item.occurred_at,
          severity: item.severity,
          status: item.processing_status,
          event_type: item.event_code,
          source: item.source_type,
          environment: item.environment,
          result: item.action_result,
        })),
      };
    }
    case "incidents": {
      const data = await db.incidentCase.findMany({
        where: incidentWhere(filters),
        orderBy: [{ opened_at: "desc" }, { id: "desc" }],
        take: EXPORT_ROW_LIMIT,
        select: { case_reference: true, severity: true, status: true, origin: true, opened_at: true, resolved_at: true, closed_at: true, assigned_user: { select: { full_name: true } } },
      });
      return {
        columns: ["case_reference", "severity", "status", "origin", "owner", "opened_at", "resolved_at", "closed_at"],
        rows: data.map((item) => ({ ...item, owner: item.assigned_user?.full_name ?? "", assigned_user: undefined })),
      };
    }
    case "responses": {
      const data = await db.securityResponseExecution.findMany({
        where: responseWhere(filters),
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: EXPORT_ROW_LIMIT,
        select: { status: true, response_type: true, created_at: true, started_at: true, completed_at: true, failed_at: true, playbook: { select: { name: true, playbook_id: true, version: true } }, incident_case: { select: { case_reference: true } } },
      });
      return {
        columns: ["case_reference", "playbook", "playbook_id", "playbook_version", "response_type", "status", "created_at", "started_at", "completed_at", "failed_at"],
        rows: data.map((item) => ({
          case_reference: item.incident_case.case_reference,
          playbook: item.playbook.name,
          playbook_id: item.playbook.playbook_id,
          playbook_version: item.playbook.version,
          response_type: item.response_type,
          status: item.status,
          created_at: item.created_at,
          started_at: item.started_at,
          completed_at: item.completed_at,
          failed_at: item.failed_at,
        })),
      };
    }
    case "approvals": {
      const data = await db.securityResponseApprovalRequest.findMany({
        where: approvalWhere(filters),
        orderBy: [{ requested_at: "desc" }, { id: "desc" }],
        take: EXPORT_ROW_LIMIT,
        select: { status: true, requested_at: true, decision_at: true, expires_at: true, response_type: true, approver: { select: { full_name: true } }, incident_case: { select: { case_reference: true } } },
      });
      return {
        columns: ["case_reference", "status", "response_type", "approver", "requested_at", "decision_at", "expires_at"],
        rows: data.map((item) => ({
          case_reference: item.incident_case.case_reference,
          status: item.status,
          response_type: item.response_type,
          approver: item.approver?.full_name ?? "",
          requested_at: item.requested_at,
          decision_at: item.decision_at,
          expires_at: item.expires_at,
        })),
      };
    }
    case "rules": {
      const data = await db.detectionRule.findMany({
        where: ruleWhere(filters),
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: EXPORT_ROW_LIMIT,
        select: { rule_id: true, version: true, name: true, status: true, security_domain: true, base_severity: true, threshold_count: true, window_seconds: true, cooldown_seconds: true },
      });
      return {
        columns: ["rule_id", "version", "name", "status", "category", "severity", "threshold_count", "window_seconds", "cooldown_seconds"],
        rows: data.map((item) => ({ ...item, category: item.security_domain, severity: item.base_severity, security_domain: undefined, base_severity: undefined })),
      };
    }
    case "behavioral-risk": {
      const data = await db.behavioralRiskAssessment.groupBy({
        by: ["risk_band", "environment", "lifecycle"],
        where: behavioralRiskWhere(filters),
        orderBy: [{ risk_band: "asc" }, { environment: "asc" }, { lifecycle: "asc" }],
        take: EXPORT_ROW_LIMIT,
        _count: { _all: true },
      });
      return {
        columns: ["risk_band", "environment", "lifecycle", "assessment_count"],
        rows: data.map((item) => ({ risk_band: item.risk_band, environment: item.environment, lifecycle: item.lifecycle, assessment_count: item._count._all })),
      };
    }
  }
}
