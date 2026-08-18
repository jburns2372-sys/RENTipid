import React from 'react';
import { Shield, Lock } from 'lucide-react';
import type { SocApprovedResponseSummaryDto } from "@/lib/security/dashboard/dto";

export function SocApprovedResponsesPanel({ responses, isLoading }: { responses: SocApprovedResponseSummaryDto[]; isLoading: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col h-[500px] overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" />
          APPROVED SECURITY RESPONSES
        </h2>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-slate-500 p-4 animate-pulse">Loading responses...</div>
        ) : responses.length === 0 ? (
          <div className="text-center text-slate-500 p-8">No approved responses executed recently.</div>
        ) : (
          responses.map((resp: SocApprovedResponseSummaryDto) => (
            <div key={resp.id as string} className="bg-slate-950 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">{(resp.responseType as string)?.replace(/_/g, ' ')}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">Target: {resp.targetType as string} ({resp.targetId as string})</div>
                </div>
                <div className={`text-[10px] px-2 py-1 rounded font-bold ${getStatusColor(resp.executionStatus as string)}`}>
                  {resp.executionStatus as string}
                </div>
              </div>
              
              <div className="flex justify-between items-end mt-3">
                <div className="text-xs text-slate-500">
                  <div>Operator: {resp.operator as string}</div>
                  <div>Started: {resp.startedAt ? new Date(resp.startedAt as string).toLocaleString() : 'Pending'}</div>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-slate-800 text-slate-400 rounded text-xs border border-slate-700 hover:text-slate-300 flex items-center gap-1 opacity-50 cursor-not-allowed" title="Execution restricted in read-only dashboard. Use existing Responses route.">
                    <Lock className="w-3 h-3" /> Execute
                  </button>
                  {resp.isRollbackAvailable && (
                    <button className="px-3 py-1 bg-orange-900/20 text-orange-500 rounded text-xs border border-orange-500/30 hover:bg-orange-900/40 flex items-center gap-1 opacity-50 cursor-not-allowed" title="Rollback restricted in read-only dashboard. Use existing Responses route.">
                      <Lock className="w-3 h-3" /> Rollback
                    </button>
                  )}
                </div>
              </div>
              
              {resp.isSimulation && (
                <div className="text-[10px] text-yellow-500 font-bold mt-2 pt-2 border-t border-slate-800/50">
                  SIMULATED RESPONSE
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'SUCCEEDED': return 'bg-green-900/30 text-green-400 border border-green-500/20';
    case 'FAILED': return 'bg-red-900/30 text-red-400 border border-red-500/20';
    case 'EXECUTING': return 'bg-blue-900/30 text-blue-400 border border-blue-500/20';
    case 'ROLLED_BACK': return 'bg-orange-900/30 text-orange-400 border border-orange-500/20';
    default: return 'bg-slate-800 text-slate-400';
  }
}
