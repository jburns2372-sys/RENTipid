import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { IncidentCaseDetailClient } from "@/components/security/cases/IncidentCaseDetailClient";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

const prisma = new PrismaClient();

export default async function IncidentCaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const authContext = await requireSecurityPermission(
    SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW,
  );
  const { caseId } = await params;

  const existingCase = await prisma.incidentCase.findUnique({
    where: { id: caseId },
    select: { id: true },
  });
  if (!existingCase) notFound();

  const canAssign =
    authContext.activePermissions.includes(
      SECURITY_PERMISSIONS.INCIDENT_CASE_ASSIGN,
    ) ||
    authContext.activePermissions.includes(
      SECURITY_PERMISSIONS.INCIDENT_CASE_REASSIGN,
    );

  const assigneeOptions = canAssign
    ? await prisma.user.findMany({
        where: {
          status: "Verified",
          role: { in: ["SOC_ANALYST", "SOC_SUPERVISOR"] },
        },
        orderBy: [{ full_name: "asc" }, { id: "asc" }],
        select: {
          id: true,
          full_name: true,
        },
      })
    : [];

  return (
    <IncidentCaseDetailClient
      caseId={existingCase.id}
      activePermissions={authContext.activePermissions}
      assigneeOptions={assigneeOptions}
    />
  );
}
