"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { ChevronLeft } from "lucide-react";

interface SecurityNavProps {
  activePermissions: string[];
}

export function SecurityNav({ activePermissions }: SecurityNavProps) {
  const pathname = usePathname();
  const isSocMain = pathname === "/dashboard/admin/security";

  return (
    <div className="space-y-4">
      {!isSocMain && (
        <div className="flex items-center">
          <Link
            href="/dashboard/admin/security"
            className="flex items-center text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to SOC Main
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-px text-sm">
        <Link
          href="/dashboard/admin/security"
          className={`px-4 py-2 font-medium transition-colors ${
            isSocMain 
              ? "border-b-2 border-blue-500 text-blue-500 font-bold" 
              : "text-slate-400 hover:text-blue-400"
          }`}
        >
          Dashboard
        </Link>

        <Link
          href="/dashboard/admin/security/alerts"
          className={`px-4 py-2 font-medium transition-colors ${
            pathname.startsWith("/dashboard/admin/security/alerts")
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-slate-400 hover:text-blue-400"
          }`}
        >
          Events & Feed
        </Link>

        <Link
          href="/dashboard/admin/security/cases"
          className={`px-4 py-2 font-medium transition-colors ${
            pathname.startsWith("/dashboard/admin/security/cases")
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-slate-400 hover:text-blue-400"
          }`}
        >
          Incident Cases
        </Link>

        {activePermissions.includes(SECURITY_PERMISSIONS.PLAYBOOK_VIEW) && (
          <Link
            href="/dashboard/admin/security/playbooks"
            className={`px-4 py-2 font-medium transition-colors ${
              pathname.startsWith("/dashboard/admin/security/playbooks")
                ? "border-b-2 border-blue-500 text-blue-500 font-bold"
                : "text-slate-400 hover:text-blue-400"
            }`}
          >
            Playbooks
          </Link>
        )}

        {activePermissions.includes(SECURITY_PERMISSIONS.DASHBOARD_VIEW) && (
          <Link
            href="/dashboard/admin/security/intelligence/behavioral-risk"
            className={`px-4 py-2 font-medium transition-colors ${
              pathname.startsWith("/dashboard/admin/security/intelligence")
                ? "border-b-2 border-blue-500 text-blue-500 font-bold"
                : "text-slate-400 hover:text-blue-400"
            }`}
          >
            Behavioral Risk
          </Link>
        )}

        {(activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_REQUEST) || activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_APPROVE)) && (
          <Link
            href="/dashboard/admin/security/approvals"
            className={`px-4 py-2 font-medium transition-colors ${
              pathname.startsWith("/dashboard/admin/security/approvals")
                ? "border-b-2 border-blue-500 text-blue-500 font-bold"
                : "text-slate-400 hover:text-blue-400"
            }`}
          >
            Approvals
          </Link>
        )}

        {activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_VIEW) && (
          <Link
            href="/dashboard/admin/security/responses"
            className={`px-4 py-2 font-medium transition-colors ${
              pathname.startsWith("/dashboard/admin/security/responses")
                ? "border-b-2 border-blue-500 text-blue-500 font-bold"
                : "text-slate-400 hover:text-blue-400"
            }`}
          >
            Responses
          </Link>
        )}

        {activePermissions.includes(SECURITY_PERMISSIONS.DASHBOARD_VIEW) && (
          <Link
            href="/dashboard/admin/security/rules"
            className={`px-4 py-2 font-medium transition-colors ${
              pathname.startsWith("/dashboard/admin/security/rules")
                ? "border-b-2 border-blue-500 text-blue-500 font-bold"
                : "text-slate-400 hover:text-blue-400"
            }`}
          >
            Detection Rules
          </Link>
        )}

        <Link
          href="/dashboard/admin/security/simulations"
          className={`px-4 py-2 font-medium transition-colors ${
            pathname.startsWith("/dashboard/admin/security/simulations")
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-slate-400 hover:text-blue-400"
          }`}
        >
          Simulations
        </Link>
        
        <Link
          href="/dashboard/admin/security/reports"
          className={`px-4 py-2 font-medium transition-colors ${
            pathname.startsWith("/dashboard/admin/security/reports")
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-slate-400 hover:text-blue-400"
          }`}
        >
          Reports
        </Link>

        <Link
          href="/dashboard/admin/security/maintenance"
          className={`px-4 py-2 font-medium transition-colors ${
            pathname.startsWith("/dashboard/admin/security/maintenance")
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-slate-400 hover:text-blue-400"
          }`}
        >
          Maintenance
        </Link>
      </div>
    </div>
  );
}
