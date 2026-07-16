import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { Shield, ShieldAlert, CheckCircle2, Lock, Activity, Database, AlertCircle } from "lucide-react";
import { PrismaClient } from "@prisma/client";
import { EventsTable } from "./events-table";

const prisma = new PrismaClient();

export default async function SecurityDashboardPage() {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);

  const [totalEvents, failedEvents, lastEvent] = await Promise.all([
    prisma.securityEvent.count(),
    prisma.securityEventIngestionFailure.count(),
    prisma.securityEvent.findFirst({ orderBy: { ingested_at: 'desc' } })
  ]);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Security Operations Center
          </h1>
          <p className="text-gray-400 mt-2">
            Security event normalization active. Threat detection and incident correlation will be introduced in later approved phases.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium border border-green-500/20">
            <CheckCircle2 className="w-4 h-4" />
            SOC Foundation & Events Active
          </div>
          <span className="text-xs text-gray-500 mt-2">
            Role: {authContext.role} | Status: {authContext.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-px">
        <div className="px-4 py-2 text-gray-600 font-medium cursor-not-allowed opacity-50 flex items-center gap-2" title="Not Yet Enabled">
          Dashboard <Lock className="w-3 h-3" />
        </div>
        <div className="px-4 py-2 border-b-2 border-blue-500 text-blue-500 font-medium">
          Events & Feed
        </div>
        {["Incidents", "Countermeasures", "Detection Rules", "Simulations", "Reports", "Maintenance"].map(tab => (
          <div key={tab} className="px-4 py-2 text-gray-600 font-medium cursor-not-allowed opacity-50 flex items-center gap-2" title="Not Yet Enabled">
            {tab} <Lock className="w-3 h-3" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col justify-center items-center gap-2">
          <Database className="w-8 h-8 text-blue-400" />
          <h3 className="text-white font-medium text-lg">Normalized Events</h3>
          <p className="text-3xl font-bold text-white">{totalEvents}</p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col justify-center items-center gap-2">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <h3 className="text-white font-medium text-lg">Ingestion Failures</h3>
          <p className="text-3xl font-bold text-white">{failedEvents}</p>
        </div>

        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Adapter Configuration Status
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center bg-gray-800 p-2 rounded">
              <span className="text-gray-400">AuditLog</span>
              <span className="text-xs font-medium text-green-400">CONFIGURED — ACTIVE SOURCE</span>
            </div>
            <div className="flex justify-between items-center bg-gray-800 p-2 rounded">
              <span className="text-gray-400">SystemErrorLog</span>
              <span className="text-xs font-medium text-green-400">CONFIGURED — ACTIVE SOURCE</span>
            </div>
            <div className="flex justify-between items-center bg-gray-800 p-2 rounded">
              <span className="text-gray-400">PaymentWebhookLog</span>
              <span className="text-xs font-medium text-green-400">CONFIGURED — ACTIVE SOURCE</span>
            </div>
            <div className="flex justify-between items-center bg-gray-800 p-2 rounded">
              <span className="text-gray-400">AIBotLog</span>
              <span className="text-xs font-medium text-yellow-400">CONFIGURED — NO ACTIVE WRITER</span>
            </div>
            <div className="flex justify-between items-center bg-gray-800 p-2 rounded">
              <span className="text-gray-400">VerificationDoc</span>
              <span className="text-xs font-medium text-yellow-400">CONFIGURED — NO SOURCE RECORDS</span>
            </div>
            <div className="flex justify-between items-center bg-gray-800 p-2 rounded">
              <span className="text-gray-400">Trust & Safety</span>
              <span className="text-xs font-medium text-yellow-400">CONFIGURED — NO ACTIVE WRITER</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Last successful normalization: {lastEvent ? lastEvent.ingested_at.toLocaleString() : "None"}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-bold text-white mb-4">Security Events Pipeline</h2>
        <EventsTable />
      </div>

      <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-lg flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-white font-medium text-lg">Phase 2 Restricted Interface</h3>
          <p className="text-gray-400 text-sm mt-1">
            This dashboard displays the exact implemented status of the SOC architecture. Simulated or fabricated metrics are strictly prohibited by policy. Live threat detection will commence strictly following Phase 3 deployment gates.
          </p>
        </div>
      </div>
      
    </div>
  );
}
