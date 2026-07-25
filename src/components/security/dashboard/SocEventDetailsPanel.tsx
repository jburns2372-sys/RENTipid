import React from 'react';
import { X, Info, Shield, Activity, Database, Server, Fingerprint } from 'lucide-react';

import type { SocSelectedEventDetailsDto } from "@/lib/security/dashboard/dto";

export function SocEventDetailsPanel({ event, onClose }: { event: SocSelectedEventDetailsDto | null, onClose: () => void }) {
  if (!event) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg h-[400px] flex items-center justify-center text-slate-500">
        <p>Select an event from the feed to view details</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col shadow-lg h-[400px] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          Event Details
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Event Code" value={event.eventCode || event.event_code} icon={<Activity className="w-3 h-3" />} />
            <DetailItem label="Classification" value={event.classification || event.event_classification} icon={<Shield className="w-3 h-3" />} />
            <DetailItem label="Severity" value={event.severity} />
            <DetailItem label="Environment" value={event.environment} />
            <DetailItem label="Lifecycle" value={event.lifecycle || event.lifecycle_type} />
            <DetailItem label="Timestamp" value={new Date(event.timestamp || event.occurred_at).toLocaleString()} />
            <DetailItem label="Source" value={event.source || event.source_type} icon={<Database className="w-3 h-3" />} />
            <DetailItem label="Verified Location" value={event.location || "Location Unknown"} />
            <DetailItem label="Target Resource" value={event.target || event.target_resource_id || "System"} icon={<Server className="w-3 h-3" />} />
            <DetailItem label="Processing Status" value={event.processingResult || event.processing_status} />
        </div>
        
        {event.isSimulation && (
            <div className="bg-yellow-900/20 border border-yellow-500/20 text-yellow-400 p-2 rounded text-xs font-semibold text-center mt-4">
                CONTROLLED SIMULATION RECORD
            </div>
        )}
        
        {event.incidentRef && (
            <div className="bg-purple-900/20 border border-purple-500/20 p-3 rounded-lg mt-4">
                <div className="text-xs text-purple-400 font-semibold mb-1 flex items-center gap-1">
                    <Fingerprint className="w-3 h-3" />
                    Linked Incident Case
                </div>
                <div className="text-slate-300 font-mono text-sm">{event.incidentRef}</div>
                <div className="text-xs text-slate-400 mt-1">Status: {event.incidentStatus}</div>
            </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string, value: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500 flex items-center gap-1">{icon}{label}</span>
      <span className="text-slate-200 font-medium break-all">{value || "-"}</span>
    </div>
  );
}
