/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import { Activity, ShieldAlert, AlertTriangle, Key, Crosshair } from 'lucide-react';

export function SocKpiStrip({ kpis, isLoading }: any) {
  const defaultKpis = kpis || { eventsToday: 0, blockedAttempts: 0, criticalFindings: 0, authenticationEvents: 0, activeIncidents: 0 };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard title="EVENTS TODAY" value={defaultKpis.eventsToday} icon={<Activity className="w-5 h-5" />} color="text-blue-400" bg="bg-blue-900/20" border="border-blue-500/20" tooltip="Count of normalized SecurityEvent records occurring today in the selected environment/lifecycle." isLoading={isLoading} />
      <KpiCard title="BLOCKED ATTEMPTS" value={defaultKpis.blockedAttempts} icon={<ShieldAlert className="w-5 h-5" />} color="text-green-400" bg="bg-green-900/20" border="border-green-500/20" tooltip="Authoritative events or audit results showing rejection, unauthorized access, or scope denials." isLoading={isLoading} />
      <KpiCard title="CRITICAL FINDINGS" value={defaultKpis.criticalFindings} icon={<AlertTriangle className="w-5 h-5" />} color="text-red-400" bg="bg-red-900/20" border="border-red-500/20" tooltip="Critical Security Alerts and active critical Incident Cases." isLoading={isLoading} />
      <KpiCard title="AUTHENTICATION EVENTS" value={defaultKpis.authenticationEvents} icon={<Key className="w-5 h-5" />} color="text-amber-400" bg="bg-amber-900/20" border="border-amber-500/20" tooltip="Events authoritatively classified as authentication or authorization actions." isLoading={isLoading} />
      <KpiCard title="ACTIVE INCIDENTS" value={defaultKpis.activeIncidents} icon={<Crosshair className="w-5 h-5" />} color="text-purple-400" bg="bg-purple-900/20" border="border-purple-500/20" tooltip="Open, investigating, escalated, or awaiting-action Incident Cases." isLoading={isLoading} />
    </div>
  );
}

function KpiCard({ title, value, icon, color, bg, border, tooltip, isLoading }: any) {
  return (
    <div className={`p-4 rounded-xl border ${border} bg-slate-900/80 shadow-lg relative group`} title={tooltip}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-400 text-xs font-bold tracking-wider">{title}</h3>
        <div className={`p-2 rounded-lg ${bg} ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white">
        {isLoading ? <span className="animate-pulse bg-slate-800 text-transparent rounded w-16 inline-block">000</span> : (value === 0 ? "0" : value)}
      </div>
    </div>
  );
}
