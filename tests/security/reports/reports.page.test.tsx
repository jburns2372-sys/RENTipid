/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import SecurityReportsPage from "@/app/dashboard/admin/security/reports/page";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { loadSocReports } from "@/lib/security/reports/reporting.service";

jest.mock("@/lib/security/authorization", () => ({ requireSecurityPermission: jest.fn() }));
jest.mock("@/lib/security/reports/reporting.service", () => {
  const actual = jest.requireActual("@/lib/security/reports/reporting.service");
  return { ...actual, loadSocReports: jest.fn() };
});

const emptyReport = {
  filters: {},
  generatedAt: new Date("2026-08-09T00:00:00.000Z"),
  summary: {
    totalEvents: 0,
    openIncidents: 0,
    criticalHighIncidents: 0,
    resolvedIncidents: 0,
    pendingApprovals: 0,
    responseActivity: 0,
    activeDetectionRules: 0,
  },
  events: [],
  incidents: [],
  responses: [],
  approvals: [],
  detectionRules: [],
  behavioralRisk: [],
  simulation: { available: true, records: [] },
  rowLimit: 100,
};

describe("SOC v1.1 Reports page", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fails closed when the authoritative Reports permission is denied", async () => {
    (requireSecurityPermission as jest.Mock).mockRejectedValueOnce(new Error("Unauthorized"));

    await expect(SecurityReportsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("Unauthorized");
    expect(requireSecurityPermission).toHaveBeenCalledWith(SECURITY_PERMISSIONS.REPORTS_EXPORT);
    expect(loadSocReports).not.toHaveBeenCalled();
  });

  it("allows authorized access and renders genuine empty states", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({ userId: "soc-admin" });
    (loadSocReports as jest.Mock).mockResolvedValueOnce(emptyReport);

    const page = await SecurityReportsPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByRole("heading", { name: "Security Reports" })).toBeTruthy();
    expect(screen.getByText("No security events match the selected filters.")).toBeTruthy();
    expect(screen.getByText("No incident cases match the selected filters.")).toBeTruthy();
    expect(screen.getByText("No simulation activity matches the selected filters.")).toBeTruthy();
    expect(screen.queryByText(/sample simulation/i)).toBeNull();
  });

  it("passes validated filters to the database-backed reporting service", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({ userId: "soc-admin" });
    (loadSocReports as jest.Mock).mockResolvedValueOnce({
      ...emptyReport,
      filters: { severity: "HIGH", environment: "PRODUCTION", eventType: "AUTH_FAILURE" },
    });

    await SecurityReportsPage({
      searchParams: Promise.resolve({ severity: "HIGH", environment: "PRODUCTION", eventType: "AUTH_FAILURE" }),
    });

    expect(loadSocReports).toHaveBeenCalledWith({
      severity: "HIGH",
      environment: "PRODUCTION",
      eventType: "AUTH_FAILURE",
    });
  });

  it("rejects invalid filters before any report query runs", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({ userId: "soc-admin" });

    const page = await SecurityReportsPage({ searchParams: Promise.resolve({ eventType: "x' OR 1=1" }) });
    render(page);

    expect(screen.getByRole("alert").textContent).toContain("The report filters were rejected.");
    expect(loadSocReports).not.toHaveBeenCalled();
  });
});
