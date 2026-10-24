import React from 'react';
import { Target, Play } from 'lucide-react';

export function SocSimulationTray() {
  const scenarios = [
    "No-Op Response Simulation",
    "Missing Approval Scope Rejection",
    "Approval Scope Mismatch Rejection",
    "Emergency Freeze Blocking",
    "Duplicate Execution Prevention",
    "Concurrent Grant Consumption Protection",
    "Reversible Account Restriction",
    "Rollback Success",
    "Rollback Failure or Divergence Protection"
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-bold text-white">CONTROLLED SOC SIMULATIONS</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {scenarios.map((scenario, idx) => (
          <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex justify-between items-center group">
            <div className="flex-1">
              <div className="text-[10px] text-yellow-500 font-bold mb-1">SIMULATION</div>
              <div className="text-sm font-medium text-slate-300">{scenario}</div>
            </div>
            <button className="p-2 rounded bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed group-hover:bg-slate-700 transition" title="Simulation execution restricted in read-only dashboard. Use Gate 4I safe routes.">
              <Play className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
