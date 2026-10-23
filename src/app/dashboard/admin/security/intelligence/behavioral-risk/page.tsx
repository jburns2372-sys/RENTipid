import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { BehavioralRiskInvestigationClient, InvestigationContext } from "./behavioral-risk-investigation-client";

const VALID_ENVIRONMENTS = ["DEVELOPMENT", "TEST", "UAT", "STAGING", "PRODUCTION"];
const VALID_LIFECYCLES = ["LIVE", "TEST", "SIMULATION"];

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BehavioralRiskInvestigationPage(props: PageProps) {
  await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);

  const searchParams = await props.searchParams;
  const context: InvestigationContext = {};

  if (typeof searchParams.subjectRef === "string") {
    const trimmed = searchParams.subjectRef.trim();
    if (trimmed) context.subjectRef = trimmed;
  }

  if (typeof searchParams.environment === "string" && VALID_ENVIRONMENTS.includes(searchParams.environment)) {
    context.environment = searchParams.environment;
  }

  if (typeof searchParams.lifecycle === "string" && VALID_LIFECYCLES.includes(searchParams.lifecycle)) {
    context.lifecycle = searchParams.lifecycle;
  }

  if (typeof searchParams.limit === "string") {
    const parsed = parseInt(searchParams.limit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      context.limit = Math.min(parsed, 50);
    }
  }

  if (typeof searchParams.assessmentId === "string") {
    const trimmed = searchParams.assessmentId.trim();
    if (trimmed && trimmed.length <= 100) {
      context.assessmentId = trimmed;
    }
  }

  return (
    <div className="space-y-6">
      <BehavioralRiskInvestigationClient initialContext={context} />
    </div>
  );
}
