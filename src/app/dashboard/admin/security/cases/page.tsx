import { PrismaClient } from "@prisma/client";
import { IncidentCaseListClient } from "@/components/security/cases/IncidentCaseListClient";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

const prisma = new PrismaClient();

export default async function IncidentCasesPage() {
  const authContext = await requireSecurityPermission(
    SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW,
  );

  const assigneeOptions = await prisma.user.findMany({
    where: {
      status: "Verified",
      role: { in: ["SOC_ANALYST", "SOC_SUPERVISOR"] },
    },
    orderBy: [{ full_name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      full_name: true,
    },
  });

  return (
    <IncidentCaseListClient
      activePermissions={authContext.activePermissions}
      assigneeOptions={assigneeOptions}
    />
  );
}
