jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  loadMaintenanceHealth,
  MAINTENANCE_CAPABILITIES,
} from "@/lib/security/maintenance/maintenance-health.service";

function createMaintenanceDatabase() {
  return {
    user: { findFirst: jest.fn() },
    securityEvent: { findFirst: jest.fn(), count: jest.fn() },
    securityEventIngestionFailure: { findFirst: jest.fn(), count: jest.fn() },
    securityEventIngestionCheckpoint: { findFirst: jest.fn() },
    incidentCase: { findFirst: jest.fn(), count: jest.fn() },
    detectionRule: { count: jest.fn() },
    ruleEvaluationLog: { findFirst: jest.fn(), count: jest.fn() },
    detectionEvaluationCheckpoint: { findFirst: jest.fn() },
    auditLog: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  };
}

function configureHealthyDatabase(db: ReturnType<typeof createMaintenanceDatabase>) {
  const latestEventAt = new Date("2026-08-09T10:00:00.000Z");
  const latestRunAt = new Date("2026-08-09T09:55:00.000Z");
  const latestIncidentAt = new Date("2026-08-09T09:30:00.000Z");
  const latestEvaluationAt = new Date("2026-08-09T09:45:00.000Z");
  const latestAuditAt = new Date("2026-08-09T09:50:00.000Z");

  db.user.findFirst.mockResolvedValue({ id: "user-1" });
  db.securityEvent.findFirst.mockResolvedValue({ ingested_at: latestEventAt });
  db.securityEvent.count.mockResolvedValue(0);
  db.securityEventIngestionFailure.count.mockResolvedValue(0);
  db.securityEventIngestionFailure.findFirst.mockResolvedValue(null);
  db.securityEventIngestionCheckpoint.findFirst.mockResolvedValue({
    last_successful_run_at: latestRunAt,
    last_run_completed_at: latestRunAt,
    last_error_code: null,
  });
  db.incidentCase.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
  db.incidentCase.findFirst
    .mockResolvedValueOnce({ updated_at: latestIncidentAt })
    .mockResolvedValueOnce({ updated_at: latestIncidentAt });
  db.detectionRule.count
    .mockResolvedValueOnce(7)
    .mockResolvedValueOnce(2)
    .mockResolvedValueOnce(0);
  db.ruleEvaluationLog.count.mockResolvedValue(0);
  db.ruleEvaluationLog.findFirst.mockResolvedValue({
    evaluation_timestamp: latestEvaluationAt,
  });
  db.detectionEvaluationCheckpoint.findFirst.mockResolvedValue({
    last_successful_run_at: latestEvaluationAt,
    privacy_safe_error_code: null,
  });
  db.auditLog.findFirst.mockResolvedValue({ created_at: latestAuditAt });
  db.auditLog.count.mockResolvedValue(15);
  db.auditLog.findMany.mockResolvedValue([]);

  return { latestEventAt, latestRunAt, latestIncidentAt, latestEvaluationAt, latestAuditAt };
}

describe("SOC v1.1 maintenance health service", () => {
  it("derives health values from authoritative, bounded database reads", async () => {
    const db = createMaintenanceDatabase();
    const expected = configureHealthyDatabase(db);
    const checkedAt = new Date("2026-08-09T12:00:00.000Z");

    const health = await loadMaintenanceHealth(db as never, checkedAt);

    expect(health).toMatchObject({
      checkedAt,
      overallStatus: "HEALTHY",
      database: { status: "HEALTHY" },
      ingestion: {
        status: "HEALTHY",
        latestEventAt: expected.latestEventAt,
        latestSuccessfulRunAt: expected.latestRunAt,
        unresolvedFailures: 0,
        backlogCount: 0,
      },
      incidents: {
        status: "HEALTHY",
        openCount: 2,
        containmentPendingCount: 1,
      },
      detectionRules: {
        status: "HEALTHY",
        activeCount: 7,
        inactiveCount: 2,
        quarantinedCount: 0,
        configurationErrorCount: null,
      },
      audit: { status: "HEALTHY", recentWriteCount: 15 },
    });
    expect(db.auditLog.findMany).toHaveBeenCalledWith({
      where: { module: "security_maintenance" },
      orderBy: { created_at: "desc" },
      take: 10,
      select: { action: true, created_at: true },
    });
    expect(db.auditLog.findFirst).toHaveBeenCalledWith({
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    });
  });

  it("reports degraded ingestion and detection signals without changing records", async () => {
    const db = createMaintenanceDatabase();
    configureHealthyDatabase(db);
    db.securityEventIngestionFailure.count.mockResolvedValue(3);
    db.securityEvent.count.mockResolvedValue(4);
    db.securityEventIngestionCheckpoint.findFirst.mockResolvedValue({
      last_successful_run_at: null,
      last_run_completed_at: new Date("2026-08-09T11:00:00.000Z"),
      last_error_code: "SAFE_INGESTION_ERROR",
    });
    db.detectionRule.count
      .mockReset()
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    db.ruleEvaluationLog.count.mockResolvedValue(2);

    const health = await loadMaintenanceHealth(
      db as never,
      new Date("2026-08-09T12:00:00.000Z"),
    );

    expect(health.ingestion.status).toBe("DEGRADED");
    expect(health.detectionRules.status).toBe("DEGRADED");
    expect(health.overallStatus).toBe("DEGRADED");
    expect(health.ingestion.unresolvedFailures).toBe(3);
    expect(health.ingestion.backlogCount).toBe(4);
  });

  it("returns genuine unknown states when authoritative records are absent", async () => {
    const db = createMaintenanceDatabase();
    db.user.findFirst.mockResolvedValue(null);
    db.securityEvent.findFirst.mockResolvedValue(null);
    db.securityEvent.count.mockResolvedValue(0);
    db.securityEventIngestionFailure.count.mockResolvedValue(0);
    db.securityEventIngestionFailure.findFirst.mockResolvedValue(null);
    db.securityEventIngestionCheckpoint.findFirst.mockResolvedValue(null);
    db.incidentCase.count.mockResolvedValue(0);
    db.incidentCase.findFirst.mockResolvedValue(null);
    db.detectionRule.count.mockResolvedValue(0);
    db.ruleEvaluationLog.count.mockResolvedValue(0);
    db.ruleEvaluationLog.findFirst.mockResolvedValue(null);
    db.detectionEvaluationCheckpoint.findFirst.mockResolvedValue(null);
    db.auditLog.findFirst.mockResolvedValue(null);
    db.auditLog.count.mockResolvedValue(0);
    db.auditLog.findMany.mockResolvedValue([]);

    const health = await loadMaintenanceHealth(db as never);

    expect(health.database.status).toBe("HEALTHY");
    expect(health.ingestion.status).toBe("UNKNOWN");
    expect(health.incidents.status).toBe("UNKNOWN");
    expect(health.detectionRules.status).toBe("UNKNOWN");
    expect(health.audit.status).toBe("UNKNOWN");
    expect(health.overallStatus).toBe("UNKNOWN");
    expect(health.recentMaintenanceActivity).toEqual([]);
  });

  it("sanitizes database failures and never returns internal exception text", async () => {
    const db = createMaintenanceDatabase();
    const secret = "postgresql://soc_admin:password@example.internal/prod";
    const failure = new Error(`DATABASE_URL=${secret} C:\\private\\server\\path`);
    Object.values(db).forEach((delegate) => {
      Object.values(delegate).forEach((method) => method.mockRejectedValue(failure));
    });

    const health = await loadMaintenanceHealth(db as never);
    const serialized = JSON.stringify(health);

    expect(health.overallStatus).toBe("FAILED");
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("example.internal");
    expect(serialized).not.toContain("private");
  });

  it("publishes no unsafe or unaudited mutation capability", () => {
    expect(MAINTENANCE_CAPABILITIES).toEqual({
      arbitrarySql: false,
      shellExecution: false,
      arbitraryScriptExecution: false,
      securityEventDeletion: false,
      auditLogDeletion: false,
      rbacOverride: false,
      approvalBypass: false,
      stateChangingActions: [],
    });
    expect(Object.isFrozen(MAINTENANCE_CAPABILITIES)).toBe(true);
    expect(Object.isFrozen(MAINTENANCE_CAPABILITIES.stateChangingActions)).toBe(true);
  });
});
