import React from 'react';
import { Map, AlertCircle } from 'lucide-react';

export function SocThreatMap() {
  // Option 4 fallback: Geographic empty-state canvas because no verified coordinates exist
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Map className="w-5 h-5 text-slate-400" />
          Event Location Map
        </h2>
        <div className="flex gap-2">
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">VERIFIED COORDINATES ONLY</span>
            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-500/20">LIVE</span>
            <span className="text-[10px] bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20">SIMULATED</span>
        </div>
      </div>
      
      <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
        {/* Placeholder for SVG map */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="flex flex-col items-center justify-center text-slate-500 z-10 text-center p-6 bg-slate-950/80 rounded-xl backdrop-blur-sm border border-slate-800">
            <AlertCircle className="w-10 h-10 mb-3 text-slate-600" />
            <p className="text-sm">No verified geolocated security events are available.</p>
            <p className="text-xs mt-2 max-w-sm text-slate-600">Private IPs, loopback, and unknown locations are intentionally excluded from geographic visualization to prevent fabricated location mapping.</p>
        </div>
      </div>
    </div>
  );
}
