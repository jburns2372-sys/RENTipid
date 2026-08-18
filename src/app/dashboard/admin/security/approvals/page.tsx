import { PrismaClient } from "@prisma/client";
import { ApprovalListClient } from "@/components/security/approvals/ApprovalListClient";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS, getPhase1PermissionsForRole } from "@/lib/security/permissions";
import { redirect } from "next/navigation";

export default async function ApprovalsPage() {
  const authContext = await requireSecurityPermission(
    SECURITY_PERMISSIONS.DASHBOARD_VIEW
  );

  const permissions = getPhase1PermissionsForRole(authContext.role);
  if (!permissions.includes(SECURITY_PERMISSIONS.RESPONSE_REQUEST) && !permissions.includes(SECURITY_PERMISSIONS.RESPONSE_APPROVE)) {
    redirect("/dashboard/admin/security");
  }

  return (
    <ApprovalListClient
      activePermissions={permissions}
    />
  );
}
