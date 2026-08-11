import { createAuditLog } from "@/lib/audit";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import {
  loadSocReportExport,
  parseSocReportFilters,
  parseSocReportType,
  renderCsv,
  ReportFilterValidationError,
  reportFilterInputFromUrl,
} from "@/lib/security/reports/reporting.service";

export async function GET(request: Request) {
  const authorization = await requireSecurityPermission(SECURITY_PERMISSIONS.REPORTS_EXPORT);

  try {
    const searchParams = new URL(request.url).searchParams;
    const reportType = parseSocReportType(searchParams.get("report"));
    const filters = parseSocReportFilters(reportFilterInputFromUrl(searchParams));
    const document = await loadSocReportExport(reportType, filters);
    const csv = renderCsv(document);

    const auditRecorded = await createAuditLog({
      actor_user_id: authorization.userId,
      action: "SOC_REPORT_EXPORTED",
      module: "security_reports",
      target_id: reportType,
      details: JSON.stringify({
        reportType,
        filters,
        rowCount: document.rows.length,
      }),
    });
    if (!auditRecorded) {
      throw new Error("Required report export audit was not recorded");
    }

    return new Response(csv, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="soc-${reportType}-report.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ReportFilterValidationError) {
      return Response.json({ error: "Invalid report request", details: error.issues }, { status: 400 });
    }

    console.error("SOC report export failed");
    return Response.json({ error: "Report export failed" }, { status: 500 });
  }
}
