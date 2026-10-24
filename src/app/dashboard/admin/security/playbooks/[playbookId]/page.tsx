import { PrismaClient } from "@prisma/client";
import { PlaybookDetailClient } from "@/components/security/playbooks/PlaybookDetailClient";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { getPlaybookDetail } from "@/lib/security/playbooks/playbook-read.service";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function PlaybookDetailPage({ params }: { params: Promise<{ playbookId: string }> }) {
  const { playbookId } = await params;
  const authContext = await requireSecurityPermission(
    SECURITY_PERMISSIONS.PLAYBOOK_VIEW
  );

  const playbook = await getPlaybookDetail(prisma, authContext.userId, playbookId);
  
  if (!playbook) {
    notFound();
  }

  return (
    <PlaybookDetailClient
      initialPlaybook={playbook}
      activePermissions={authContext.activePermissions}
    />
  );
}
