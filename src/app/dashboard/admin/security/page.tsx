import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SocCommandCenterClient } from "@/components/security/dashboard/SocCommandCenterClient";
import Link from "next/link";
import { Lock } from "lucide-react";

export default async function SecurityDashboardPage() {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);

  return (
    <div className="space-y-6">

      <SocCommandCenterClient />
    </div>
  );
}
