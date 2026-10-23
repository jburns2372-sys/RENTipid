jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/security/authorization", () => ({ requireSecurityPermission: jest.fn() }));
jest.mock("@/lib/audit", () => ({ createAuditLog: jest.fn() }));
jest.mock("@/lib/security/reports/reporting.service", () => {
  const actual = jest.requireActual("@/lib/security/reports/reporting.service");
  return { ...actual, loadSocReportExport: jest.fn() };
});

import { GET } from "@/app/api/soc/reports/export/route";
import { createAuditLog } from "@/lib/audit";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { loadSocReportExport } from "@/lib/security/reports/reporting.service";

describe("SOC v1.1 Reports CSV route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createAuditLog as jest.Mock).mockResolvedValue(true);
  });

  it("fails closed before querying or exporting when authorization is denied", async () => {
    (requireSecurityPermission as jest.Mock).mockRejectedValueOnce(new Error("Unauthorized"));

    await expect(GET(new Request("http://localhost/api/soc/reports/export?report=events"))).rejects.toThrow("Unauthorized");
    expect(requireSecurityPermission).toHaveBeenCalledWith(SECURITY_PERMISSIONS.REPORTS_EXPORT);
    expect(loadSocReportExport).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it("exports an authorized, audited, non-cacheable CSV", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({ userId: "soc-admin" });
    (loadSocReportExport as jest.Mock).mockResolvedValueOnce({
      columns: ["event_type", "result"],
      rows: [{ event_type: "'=WEBSERVICE(A1)", result: "DENIED" }],
    });

    const response = await GET(new Request(
      "http://localhost/api/soc/reports/export?report=events&severity=HIGH&environment=PRODUCTION",
    ));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-disposition")).toContain("soc-events-report.csv");
    expect(body).toContain("'=WEBSERVICE");
    expect(loadSocReportExport).toHaveBeenCalledWith("events", {
      severity: "HIGH",
      environment: "PRODUCTION",
    });
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      actor_user_id: "soc-admin",
      action: "SOC_REPORT_EXPORTED",
      module: "security_reports",
      target_id: "events",
    }));
  });

  it("returns a sanitized 400 response for invalid report input", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({ userId: "soc-admin" });

    const response = await GET(new Request("http://localhost/api/soc/reports/export?report=unknown"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid report request", details: ["report type is not supported"] });
    expect(loadSocReportExport).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it("fails closed when the export audit record cannot be persisted", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({ userId: "soc-admin" });
    (loadSocReportExport as jest.Mock).mockResolvedValueOnce({
      columns: ["event_type", "result"],
      rows: [{ event_type: "AUTHORIZATION_FAILURE", result: "DENIED" }],
    });
    (createAuditLog as jest.Mock).mockResolvedValueOnce(false);

    const response = await GET(new Request(
      "http://localhost/api/soc/reports/export?report=events",
    ));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Report export failed" });
  });
});
