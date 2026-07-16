import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

export default async function SecurityLayout({ children }: { children: React.ReactNode }) {
  // Database-authoritative lookup. Exits via throw/redirect if failed.
  await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-200">
      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
