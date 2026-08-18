import { PrismaClient } from "@prisma/client";
import { PlaybookListClient } from "@/components/security/playbooks/PlaybookListClient";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

export default async function PlaybooksPage() {
  const authContext = await requireSecurityPermission(
    SECURITY_PERMISSIONS.PLAYBOOK_VIEW
  );

  return (
    <PlaybookListClient
      activePermissions={authContext.activePermissions}
    />
  );
}
