import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { BehavioralRiskInvestigationClient } from "./behavioral-risk-investigation-client";

export default async function BehavioralRiskInvestigationPage() {
  await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);

  return (
    <div className="space-y-6">
      <BehavioralRiskInvestigationClient />
    </div>
  );
}
