import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SecurityNav } from "@/components/security/navigation/SecurityNav";

export default async function SecurityLayout({ children }: { children: React.ReactNode }) {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-200">
      <div className="flex-1 w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="bg-yellow-900/20 border border-yellow-500/30 text-yellow-500 p-3 rounded-lg text-sm flex items-center justify-between mb-4">
          <span><strong>Controlled SOC Environment:</strong> Reports, maintenance health, and simulations are available to authorized security personnel.</span>
          <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded">MOCK PAYMENTS ACTIVE</span>
        </div>
        
        <SecurityNav activePermissions={authContext.activePermissions} />
        
        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
