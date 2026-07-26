import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SocCommandCenterClient } from "@/components/security/dashboard/SocCommandCenterClient";
import Link from "next/link";
import { Lock } from "lucide-react";

export default async function SecurityDashboardPage() {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);

  return (
    <div className="space-y-6">
      {/* Existing Private Beta & Mock Payment notices can remain in the layout, we are inside the page */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 text-yellow-500 p-3 rounded-lg text-sm flex items-center justify-between">
        <span><strong>Private Beta:</strong> The RENTipid Security Operations Center is currently in a restricted Phase 4 release.</span>
        <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded">MOCK PAYMENTS ACTIVE</span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-px text-sm">
        <div className="px-4 py-2 border-b-2 border-blue-500 text-blue-500 font-bold">
          Dashboard
        </div>
        <div className="px-4 py-2 text-slate-500 font-medium cursor-not-allowed flex items-center gap-2" title="Use the Dashboard feed">
          Events & Feed <Lock className="w-3 h-3" />
        </div>
        <Link
          href="/dashboard/admin/security/cases"
          className="px-4 py-2 text-slate-400 font-medium hover:text-blue-400"
        >
          Incident Cases
        </Link>
        {authContext.activePermissions.includes(SECURITY_PERMISSIONS.PLAYBOOK_VIEW) && (
          <Link
            href="/dashboard/admin/security/playbooks"
            className="px-4 py-2 text-slate-400 font-medium hover:text-blue-400"
          >
            Playbooks
          </Link>
        )}
        {authContext.activePermissions.includes(SECURITY_PERMISSIONS.DASHBOARD_VIEW) && (
          <Link
            href="/dashboard/admin/security/intelligence/behavioral-risk"
            className="px-4 py-2 text-slate-400 font-medium hover:text-blue-400"
          >
            Behavioral Risk
          </Link>
        )}
        {(authContext.activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_REQUEST) || authContext.activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_APPROVE)) && (
          <Link
            href="/dashboard/admin/security/approvals"
            className="px-4 py-2 text-slate-400 font-medium hover:text-blue-400"
          >
            Approvals
          </Link>
        )}
        {authContext.activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_VIEW) && (
          <Link
            href="/dashboard/admin/security/responses"
            className="px-4 py-2 text-slate-400 font-medium hover:text-blue-400"
          >
            Responses
          </Link>
        )}
        {["Detection Rules", "Simulations", "Reports", "Maintenance"].map(tab => (
          <div key={tab} className="px-4 py-2 text-slate-500 font-medium cursor-not-allowed flex items-center gap-2" title="Not Yet Enabled">
            {tab} <Lock className="w-3 h-3" />
          </div>
        ))}
      </div>

      <SocCommandCenterClient />
    </div>
  );
}
