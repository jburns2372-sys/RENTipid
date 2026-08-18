import React from 'react';
import { ShieldCheck, RefreshCw, Pause, Play, AlertOctagon } from 'lucide-react';

interface SocCommandCenterHeaderProps {
  includeSimulations: boolean;
  onSimulationsChange: (v: boolean) => void;
  environment: string;
  onEnvironmentChange: (v: string) => void;
  lifecycle: string;
  onLifecycleChange: (v: string) => void;
  isPaused: boolean;
  onPauseChange: (v: boolean) => void;
  onManualRefresh: () => void;
  lastRefreshed: string;
  emergencyFreezeActive: boolean;
}

export function SocCommandCenterHeader({
  includeSimulations, onSimulationsChange, environment, onEnvironmentChange, lifecycle, onLifecycleChange, isPaused, onPauseChange, onManualRefresh, lastRefreshed, emergencyFreezeActive
}: SocCommandCenterHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600/20 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/30">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Security Operations Center</h1>
          <p className="text-slate-400 text-sm">Real-time and historical RENTipid security monitoring, incident coordination, approved response tracking and controlled simulations.</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        {emergencyFreezeActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold animate-pulse">
            <AlertOctagon className="w-4 h-4" />
            EMERGENCY FREEZE ACTIVE
          </div>
        )}
        
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={includeSimulations} onChange={(e) => onSimulationsChange(e.target.checked)} className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500" />
          Include Simulations
        </label>

        <select value={environment} onChange={(e) => onEnvironmentChange(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Environments</option>
          <option value="PRODUCTION">PRODUCTION</option>
          <option value="STAGING">STAGING</option>
          <option value="UAT">UAT</option>
          <option value="TEST">TEST</option>
          <option value="DEVELOPMENT">DEVELOPMENT</option>
        </select>
        
        <select value={lifecycle} onChange={(e) => onLifecycleChange(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Lifecycles</option>
          <option value="LIVE">LIVE</option>
          <option value="TEST">TEST</option>
          <option value="SIMULATION">SIMULATION</option>
        </select>

        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <button onClick={() => onPauseChange(!isPaused)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition" title={isPaused ? "Resume Display Refresh" : "Pause Display Refresh"}>
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <div className="w-px h-6 bg-slate-700"></div>
          <button onClick={onManualRefresh} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Manual Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {lastRefreshed && (
          <div className="text-xs text-slate-500">
            Last Refreshed: {new Date(lastRefreshed).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
