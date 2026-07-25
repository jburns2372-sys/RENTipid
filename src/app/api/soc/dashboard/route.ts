import { NextRequest, NextResponse } from "next/server";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { getSocCommandCenterSummary, getSocLiveEventFeed, getSocApprovedResponses, SocCommandCenterFilters } from "@/lib/security/dashboard/soc-command-center-read.service";
import { SecurityEnvironment, SecurityLifecycle, SecuritySeverity, SecurityProcessingStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "summary";
    const environment = searchParams.get("environment") as SecurityEnvironment || undefined;
    const lifecycle = searchParams.get("lifecycle") as SecurityLifecycle || undefined;
    const includeSimulations = searchParams.get("includeSimulations") === "true";

    const filters: SocCommandCenterFilters = {
      environment,
      lifecycle,
      includeSimulations
    };

    if (action === "summary") {
      const summary = await getSocCommandCenterSummary(filters);
      return NextResponse.json(summary);
    } else if (action === "feed") {
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      const offset = parseInt(searchParams.get("offset") || "0", 10);
      const severity = searchParams.get("severity") as SecuritySeverity || undefined;
      const source = searchParams.get("source") || undefined;
      const processingStatus = searchParams.get("processingStatus") as SecurityProcessingStatus || undefined;

      const feed = await getSocLiveEventFeed({
        ...filters,
        limit,
        offset,
        severity,
        source,
        processingStatus
      });
      return NextResponse.json({ events: feed });
    } else if (action === "responses") {
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const offset = parseInt(searchParams.get("offset") || "0", 10);
      
      const responses = await getSocApprovedResponses({ limit, offset, includeSimulations });
      return NextResponse.json({ responses });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("SOC Dashboard API Error:", error);
    // If the error was thrown by requireSecurityPermission it might have already redirected, but in an API route we should handle it as 403/401.
    // In Next.js App Router, redirects inside API routes throw an error that is caught here, we should pass it along or return 401.
    if (error && typeof error === 'object' && 'message' in error && (error as any).message === 'NEXT_REDIRECT') {
      throw error;
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
