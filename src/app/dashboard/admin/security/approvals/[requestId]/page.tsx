import { PrismaClient } from "@prisma/client";
import { ApprovalDetailClient } from "@/components/security/approvals/ApprovalDetailClient";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS, getPhase1PermissionsForRole } from "@/lib/security/permissions";
import { getApprovalDetail } from "@/lib/security/approvals/approval-read.service";
import { notFound, redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function ApprovalDetailPage({ params }: { params: { requestId: string } }) {
  const authContext = await requireSecurityPermission(
    SECURITY_PERMISSIONS.DASHBOARD_VIEW
  );

  const permissions = getPhase1PermissionsForRole(authContext.role);
  if (!permissions.includes(SECURITY_PERMISSIONS.RESPONSE_REQUEST) && !permissions.includes(SECURITY_PERMISSIONS.RESPONSE_APPROVE)) {
    redirect("/dashboard/admin/security");
  }

  const approval = await getApprovalDetail(prisma, authContext.userId, params.requestId);
  
  if (!approval) {
    notFound();
  }

  return (
    <ApprovalDetailClient
      initialApproval={approval}
      activePermissions={permissions}
      currentUserId={authContext.userId}
    />
  );
}
