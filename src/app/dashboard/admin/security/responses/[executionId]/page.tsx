import { PrismaClient } from "@prisma/client";
import { ResponseDetailClient } from "@/components/security/responses/ResponseDetailClient";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS, getPhase1PermissionsForRole } from "@/lib/security/permissions";
import { notFound, redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function ResponseDetailPage({ params }: { params: { executionId: string } }) {
  const authContext = await requireSecurityPermission(
    SECURITY_PERMISSIONS.DASHBOARD_VIEW
  );

  const permissions = getPhase1PermissionsForRole(authContext.role);
  if (!permissions.includes(SECURITY_PERMISSIONS.RESPONSE_VIEW)) {
    redirect("/dashboard/admin/security");
  }

  const execution = await prisma.securityResponseExecution.findUnique({
    where: { id: params.executionId },
    include: {
      actions: {
        orderBy: { sequence: 'asc' },
      }
    }
  });
  
  if (!execution) {
    notFound();
  }

  return (
    <ResponseDetailClient
      initialExecution={execution}
      activePermissions={permissions}
    />
  );
}
