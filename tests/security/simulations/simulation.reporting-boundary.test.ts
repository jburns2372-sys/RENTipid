jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import { loadSocReports } from "@/lib/security/reports/reporting.service";

describe("SOC v1.1 simulation reporting boundary", () => {
  it("excludes simulation events from operational totals and returns them separately", async () => {
    const simulationEvent = {
      id: "simulation-event-1",
      occurred_at: new Date("2026-08-09T10:00:00.000Z"),
      event_code: "AUDIT_SOC_SIMULATION_COMPLETED",
      processing_status: "NORMALIZED",
      source_type: "AUDIT_LOG",
      environment: "TEST",
      lifecycle_type: "SIMULATION",
      action_result: "COMPLETED",
    };
    const database = {
      securityEvent: {
        count: jest.fn().mockResolvedValue(4),
        findMany: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([simulationEvent]),
      },
      incidentCase: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      securityResponseExecution: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      securityResponseApprovalRequest: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      detectionRule: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      behavioralRiskAssessment: { groupBy: jest.fn().mockResolvedValue([]) },
    };

    const reports = await loadSocReports({}, database as never);

    expect(reports.summary.totalEvents).toBe(4);
    expect(reports.simulation.records).toEqual([simulationEvent]);
    expect(database.securityEvent.count).toHaveBeenCalledWith({
      where: { lifecycle_type: { not: "SIMULATION" } },
    });
    expect(database.securityEvent.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { lifecycle_type: "SIMULATION" } }),
    );
  });
});
