import React from 'react';
import { Activity } from 'lucide-react';

import type { SocCommandCenterEvent } from "@/lib/security/dashboard/dto";

export function SocLiveEventFeed({ events, isLoading, selectedEventId, onSelectEvent }: { events: SocCommandCenterEvent[], isLoading: boolean, selectedEventId: string | null, onSelectEvent: (id: string) => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col h-[500px] overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          LIVE SECURITY EVENT FEED
        </h2>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/50 text-xs uppercase text-slate-500 sticky top-0 z-10 shadow-sm border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Severity</th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  <div className="animate-pulse">Loading events...</div>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No security events found for the current filters.
                </td>
              </tr>
            ) : (
              events.map((event: SocCommandCenterEvent) => (
                <tr 
                  key={event.id} 
                  onClick={() => onSelectEvent(event.id)}
                  className={`hover:bg-slate-800/50 cursor-pointer transition ${selectedEventId === event.id ? 'bg-slate-800 border-l-2 border-blue-500' : ''}`}
                >
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{new Date(event.occurredAt).toLocaleTimeString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{event.eventCode}</div>
                    {event.isSimulation && <div className="text-[9px] text-yellow-500 font-bold mt-0.5">SIMULATED</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{event.sourceType}</td>
                  <td className="px-4 py-3 text-xs">
                     {event.locationClassification === "UNKNOWN" ? <span className="text-slate-500 italic">LOCATION UNKNOWN</span> : `${event.city || ''}, ${event.country || ''}`.replace(/^, /, '')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">{event.processingStatus}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-900/30 text-red-400 border border-red-500/20';
    case 'HIGH': return 'bg-orange-900/30 text-orange-400 border border-orange-500/20';
    case 'MEDIUM': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/20';
    case 'LOW': return 'bg-blue-900/30 text-blue-400 border border-blue-500/20';
    default: return 'bg-slate-800 text-slate-400';
  }
}
