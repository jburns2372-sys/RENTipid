/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import SecurityMaintenancePage from "@/app/dashboard/admin/security/maintenance/page";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { loadMaintenanceHealth } from "@/lib/security/maintenance/maintenance-health.service";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

jest.mock("@/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn(),
}));
jest.mock("@/lib/security/maintenance/maintenance-health.service", () => ({
  loadMaintenanceHealth: jest.fn(),
  MAINTENANCE_CAPABILITIES: {
    arbitrarySql: false,
    shellExecution: false,
    arbitraryScriptExecution: false,
    securityEventDeletion: false,
    auditLogDeletion: false,
    rbacOverride: false,
    approvalBypass: false,
    stateChangingActions: [],
  },
}));

const emptyHealth = {
  checkedAt: new Date("2026-08-09T12:00:00.000Z"),
  overallStatus: "UNKNOWN",
  database: { status: "HEALTHY" },
  ingestion: {
    status: "UNKNOWN",
    latestEventAt: null,
    latestSuccessfulRunAt: null,
    latestRunCompletedAt: null,
    unresolvedFailures: 0,
    backlogCount: 0,
    latestFailureAt: null,
    retryableFailedItems: null,
  },
  incidents: {
    status: "UNKNOWN",
    openCount: 0,
    containmentPendingCount: 0,
    latestActivityAt: null,
    latestSuccessfulProcessingAt: null,
    failedProcessingCount: null,
    queuedProcessingCount: null,
  },
  detectionRules: {
    status: "UNKNOWN",
    activeCount: 0,
    inactiveCount: 0,
    quarantinedCount: 0,
    configurationErrorCount: null,
    recentEvaluationErrorCount: 0,
    latestEvaluationAt: null,
    latestSuccessfulRunAt: null,
  },
  audit: {
    status: "UNKNOWN",
    latestAuditAt: null,
    recentWriteCount: 0,
  },
  recentMaintenanceActivity: [],
};

describe("SOC v1.1 Maintenance page", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fails closed before health data is read when authorization is denied", async () => {
    (requireSecurityPermission as jest.Mock).mockRejectedValueOnce(
      new Error("Unauthorized"),
    );

    await expect(SecurityMaintenancePage()).rejects.toThrow("Unauthorized");
    expect(requireSecurityPermission).toHaveBeenCalledWith(
      SECURITY_PERMISSIONS.DASHBOARD_VIEW,
    );
    expect(loadMaintenanceHealth).not.toHaveBeenCalled();
  });

  it("allows authorized access and renders safe authoritative health values", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({
      userId: "soc-admin",
    });
    (loadMaintenanceHealth as jest.Mock).mockResolvedValueOnce({
      ...emptyHealth,
      overallStatus: "HEALTHY",
      ingestion: {
        ...emptyHealth.ingestion,
        status: "HEALTHY",
        latestEventAt: new Date("2026-08-09T10:00:00.000Z"),
        unresolvedFailures: 2,
        backlogCount: 3,
      },
    });

    render(await SecurityMaintenancePage());

    expect(screen.getByRole("heading", { name: "SOC Maintenance" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Event Ingestion" })).toBeTruthy();
    expect(screen.getByText("Aug 9, 2026, 10:00 AM UTC")).toBeTruthy();
    expect(screen.getByText("State-changing maintenance actions are unavailable.", { exact: false })).toBeTruthy();
    expect(loadMaintenanceHealth).toHaveBeenCalledTimes(1);
  });

  it("renders genuine empty and unsupported states without fake values", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({
      userId: "soc-admin",
    });
    (loadMaintenanceHealth as jest.Mock).mockResolvedValueOnce(emptyHealth);

    render(await SecurityMaintenancePage());

    expect(screen.getByText("No maintenance activity is recorded.")).toBeTruthy();
    expect(screen.getAllByText("Not available").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not tracked by current model")).toHaveLength(4);
    expect(screen.queryByText(/demo|sample|synthetic/i)).toBeNull();
  });

  it("does not expose credentials, internal errors, or destructive controls", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({
      userId: "soc-admin",
    });
    (loadMaintenanceHealth as jest.Mock).mockResolvedValueOnce({
      ...emptyHealth,
      database: { status: "FAILED" },
      overallStatus: "FAILED",
    });

    const { container } = render(await SecurityMaintenancePage());
    const output = container.textContent ?? "";

    expect(output).not.toContain("DATABASE_URL");
    expect(output).not.toContain("postgresql://");
    expect(output).not.toMatch(/delete security|delete audit|run sql|execute shell/i);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Refresh health" })).toBeTruthy();
  });
});
