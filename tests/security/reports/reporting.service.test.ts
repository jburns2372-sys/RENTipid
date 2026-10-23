jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  loadSocReportExport,
  loadSocReports,
  neutralizeCsvFormula,
  parseSocReportFilters,
  renderCsv,
  ReportFilterValidationError,
} from "@/lib/security/reports/reporting.service";

function createReportDatabase() {
  return {
    securityEvent: { count: jest.fn(), findMany: jest.fn() },
    incidentCase: { count: jest.fn(), findMany: jest.fn() },
    securityResponseExecution: { count: jest.fn(), findMany: jest.fn() },
    securityResponseApprovalRequest: { count: jest.fn(), findMany: jest.fn() },
    detectionRule: { count: jest.fn(), findMany: jest.fn() },
    behavioralRiskAssessment: { groupBy: jest.fn() },
  };
}

describe("SOC v1.1 reporting service", () => {
  it("validates supported filters and rejects duplicates or unsafe ranges", () => {
    expect(parseSocReportFilters({
      from: "2026-08-01",
      to: "2026-08-09",
      severity: "HIGH",
      status: "PROCESSED",
      source: "AUDIT_LOG",
      environment: "PRODUCTION",
      eventType: "AUTH.FAILURE-1",
    })).toEqual({
      from: "2026-08-01",
      to: "2026-08-09",
      severity: "HIGH",
      status: "PROCESSED",
      source: "AUDIT_LOG",
      environment: "PRODUCTION",
      eventType: "AUTH.FAILURE-1",
    });

    expect(() => parseSocReportFilters({ severity: ["HIGH", "LOW"] })).toThrow(ReportFilterValidationError);
    expect(() => parseSocReportFilters({ from: "2026-08-09", to: "2026-08-01" })).toThrow(ReportFilterValidationError);
    expect(() => parseSocReportFilters({ eventType: "x' OR 1=1" })).toThrow(ReportFilterValidationError);
  });

  it("derives summary and detail values from authoritative database results", async () => {
    const db = createReportDatabase();
    const openedAt = new Date("2026-08-09T00:00:00.000Z");
    const generatedAt = new Date("2026-08-09T12:00:00.000Z");

    db.securityEvent.count.mockResolvedValue(9);
    db.incidentCase.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2).mockResolvedValueOnce(4);
    db.securityResponseApprovalRequest.count.mockResolvedValue(1);
    db.securityResponseExecution.count.mockResolvedValue(5);
    db.detectionRule.count.mockResolvedValue(6);
    db.securityEvent.findMany.mockResolvedValueOnce([{
      id: "event-1",
      occurred_at: openedAt,
      severity: "HIGH",
      processing_status: "PROCESSED",
      event_code: "AUTH_FAILURE",
      source_type: "AUDIT_LOG",
      environment: "PRODUCTION",
      action_result: "DENIED",
    }]).mockResolvedValueOnce([]);
    db.incidentCase.findMany.mockResolvedValue([{
      id: "case-1",
      case_reference: "SOC-CASE-1",
      severity: "HIGH",
      status: "OPEN",
      origin: "SECURITY_EVENT",
      opened_at: openedAt,
      resolved_at: null,
      closed_at: null,
      assigned_user: { full_name: "SOC Analyst" },
      security_response_executions: [{ status: "EXECUTING" }],
    }]);
    db.securityResponseExecution.findMany.mockResolvedValue([]);
    db.securityResponseApprovalRequest.findMany.mockResolvedValue([]);
    db.detectionRule.findMany.mockResolvedValue([]);
    db.behavioralRiskAssessment.groupBy.mockResolvedValue([{
      risk_band: "HIGH",
      environment: "PRODUCTION",
      lifecycle: "LIVE",
      _count: { _all: 2 },
    }]);

    const result = await loadSocReports(
      { severity: "HIGH", environment: "PRODUCTION" },
      db as never,
      generatedAt,
    );

    expect(result.summary).toEqual({
      totalEvents: 9,
      openIncidents: 3,
      criticalHighIncidents: 2,
      resolvedIncidents: 4,
      pendingApprovals: 1,
      responseActivity: 5,
      activeDetectionRules: 6,
    });
    expect(result.events).toHaveLength(1);
    expect(result.events[0].event_code).toBe("AUTH_FAILURE");
    expect(result.incidents[0]).toMatchObject({ ageHours: 12, latestResponseStatus: "EXECUTING" });
    expect(result.behavioralRisk[0]._count._all).toBe(2);
    expect(result.simulation).toEqual({ available: true, records: [] });
    expect(db.securityEvent.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ lifecycle_type: { not: "SIMULATION" } }),
    });
    expect(db.securityEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ severity: "HIGH", environment: "PRODUCTION" }),
      take: 100,
    }));
  });

  it("returns genuine empty collections and zero summaries without manufacturing records", async () => {
    const db = createReportDatabase();
    db.securityEvent.count.mockResolvedValue(0);
    db.incidentCase.count.mockResolvedValue(0);
    db.securityResponseApprovalRequest.count.mockResolvedValue(0);
    db.securityResponseExecution.count.mockResolvedValue(0);
    db.detectionRule.count.mockResolvedValue(0);
    db.securityEvent.findMany.mockResolvedValue([]);
    db.incidentCase.findMany.mockResolvedValue([]);
    db.securityResponseExecution.findMany.mockResolvedValue([]);
    db.securityResponseApprovalRequest.findMany.mockResolvedValue([]);
    db.detectionRule.findMany.mockResolvedValue([]);
    db.behavioralRiskAssessment.groupBy.mockResolvedValue([]);

    const result = await loadSocReports({}, db as never, new Date("2026-08-09T00:00:00.000Z"));
    expect(Object.values(result.summary).every((value) => value === 0)).toBe(true);
    expect(result.events).toEqual([]);
    expect(result.incidents).toEqual([]);
    expect(result.responses).toEqual([]);
    expect(result.approvals).toEqual([]);
    expect(result.detectionRules).toEqual([]);
    expect(result.behavioralRisk).toEqual([]);
  });

  it("neutralizes spreadsheet formulas and excludes unselected sensitive event fields", async () => {
    expect(neutralizeCsvFormula("=1+1")).toBe("'=1+1");
    expect(neutralizeCsvFormula(" +SUM(A1:A2)")).toBe("' +SUM(A1:A2)");
    expect(neutralizeCsvFormula("-2+3")).toBe("'-2+3");
    expect(neutralizeCsvFormula("@IMPORTXML(A1)")).toBe("'@IMPORTXML(A1)");

    const db = createReportDatabase();
    db.securityEvent.findMany.mockResolvedValue([{
      occurred_at: new Date("2026-08-09T00:00:00.000Z"),
      severity: "HIGH",
      processing_status: "PROCESSED",
      event_code: "=WEBSERVICE(\"https://invalid.example\")",
      source_type: "AUDIT_LOG",
      environment: "PRODUCTION",
      action_result: "+CMD",
      source_summary: "SECRET_SHOULD_NOT_EXPORT",
      actor_user_id: "PRIVATE_USER_ID",
    }]);

    const document = await loadSocReportExport("events", {}, db as never);
    const csv = renderCsv(document);
    expect(csv).toContain("'=WEBSERVICE");
    expect(csv).toContain("'+CMD");
    expect(csv).not.toContain("SECRET_SHOULD_NOT_EXPORT");
    expect(csv).not.toContain("PRIVATE_USER_ID");
    expect(db.securityEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 1_000 }));
  });
});
