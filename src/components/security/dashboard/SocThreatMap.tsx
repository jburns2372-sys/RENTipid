"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Map, AlertCircle, RefreshCw, ZoomIn, ZoomOut, Maximize, AlertTriangle, ShieldAlert, Info as InfoIcon } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Graticule } from "react-simple-maps";
import type { ThreatMapResponseDto, ThreatMapMarkerDto } from '@/lib/security/geolocation/threat-map.dto';

const GEO_URL = "/maps/world-110m.json";

export function SocThreatMap() {
    const [data, setData] = useState<ThreatMapResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<ThreatMapMarkerDto | null>(null);
    const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/soc/threat-map?limit=500');
            if (res.status === 403) {
                setError("UNAUTHORIZED");
                return;
            }
            if (!res.ok) throw new Error("API_FAILED");
            const result: ThreatMapResponseDto = await res.json();
            setData(result);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError("UNAVAILABLE");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (data && data.refreshAfterSeconds && data.refreshAfterSeconds > 0) {
            timerRef.current = setTimeout(() => {
                fetchData();
            }, Math.max(data.refreshAfterSeconds, 15) * 1000);
        }
    }, [data]);

    const handleZoomIn = () => {
        if (position.zoom >= 4) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom * 2 }));
    };

    const handleZoomOut = () => {
        if (position.zoom <= 1) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom / 2 }));
    };

    const handleReset = () => {
        setPosition({ coordinates: [0, 20], zoom: 1 });
        setSelectedMarker(null);
    };

    const getMarkerColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return '#ef4444'; // red-500
            case 'HIGH': return '#f97316'; // orange-500
            case 'MEDIUM': return '#eab308'; // yellow-500
            case 'LOW': return '#3b82f6'; // blue-500
            case 'INFO': return '#64748b'; // slate-500
            default: return '#64748b';
        }
    };

    const getMarkerSize = (severity: string, count: number) => {
        let base = 4;
        if (severity === 'CRITICAL') base = 8;
        if (severity === 'HIGH') base = 6;
        if (severity === 'MEDIUM') base = 5;
        // slightly increase size for multiple overlapping events
        if (count > 5) base += 2;
        if (count > 20) base += 4;
        return Math.min(base, 14);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col h-[600px] overflow-hidden relative">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Map className="w-5 h-5 text-slate-400" />
                    Live Geospatial Threat Map
                </h2>
                <div className="flex items-center gap-4">
                    {data && (
                        <div className="hidden md:flex gap-4 text-xs">
                            <div className="flex flex-col">
                                <span className="text-slate-500">Geolocated Events</span>
                                <span className="text-white font-bold">{data.summary.geolocatedEvents}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500">Countries</span>
                                <span className="text-white font-bold">{data.summary.countries}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500">Critical / High</span>
                                <span className="text-red-400 font-bold">{data.summary.criticalHighEvents}</span>
                            </div>
                        </div>
                    )}
                    <button onClick={fetchData} className="text-slate-400 hover:text-white p-2 rounded hover:bg-slate-800 transition" title="Refresh Map">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-slate-950 overflow-hidden">
                
                {/* Error/Empty States Overlay */}
                {error === 'UNAUTHORIZED' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
                        <div className="text-center p-6 border border-red-500/20 bg-red-950/30 rounded-xl">
                            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <p className="text-red-200 font-medium">Unauthorized Access</p>
                            <p className="text-xs text-red-400 mt-1">You do not have permission to view the threat map.</p>
                        </div>
                    </div>
                )}
                
                {error === 'UNAVAILABLE' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
                        <div className="text-center p-6 border border-yellow-500/20 bg-yellow-950/30 rounded-xl">
                            <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                            <p className="text-yellow-200 font-medium">Map Unavailable</p>
                            <p className="text-xs text-yellow-400 mt-1">Unable to load threat data. Please try again later.</p>
                        </div>
                    </div>
                )}

                {data && data.summary.geolocatedEvents === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="text-center p-6 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-sm max-w-sm">
                            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                            <p className="text-sm text-slate-300">No geolocated security events are available for the selected period.</p>
                            {data.unresolvedLocationCount > 0 && (
                                <p className="text-xs text-slate-500 mt-2">{data.unresolvedLocationCount} security events were detected, but their locations could not be safely resolved.</p>
                            )}
                            {data.providerStatus === 'DISABLED' && (
                                <p className="text-xs text-yellow-500 mt-2 border border-yellow-500/20 bg-yellow-900/20 p-2 rounded">Geolocation enrichment is disabled in this environment.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Map Implementation */}
                <ComposableMap projection="geoMercator" width={800} height={500} style={{ width: "100%", height: "100%" }}>
                    <ZoomableGroup 
                        zoom={position.zoom} 
                        center={position.coordinates} 
                        onMoveEnd={(pos) => setPosition(pos as any)}
                        maxZoom={10}
                    >
                        <Graticule stroke="#1e293b" strokeWidth={0.5} />
                        <Geographies geography={GEO_URL}>
                            {({ geographies }) =>
                                geographies.map((geo) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#0f172a"
                                        stroke="#334155"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#1e293b", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                ))
                            }
                        </Geographies>

                        {data && data.markers.map((marker) => {
                            const size = getMarkerSize(marker.highest_severity, marker.event_count);
                            const color = getMarkerColor(marker.highest_severity);
                            const isPulsing = marker.highest_severity === 'CRITICAL';
                            const isSelected = selectedMarker?.marker_id === marker.marker_id;
                            
                            return (
                                <Marker 
                                    key={marker.marker_id} 
                                    coordinates={[marker.longitude, marker.latitude]}
                                    onClick={() => setSelectedMarker(marker)}
                                    className="cursor-pointer"
                                >
                                    <circle 
                                        r={size + (isSelected ? 2 : 0)} 
                                        fill={color} 
                                        stroke={isSelected ? "#ffffff" : "#020617"} 
                                        strokeWidth={1.5}
                                        opacity={0.9}
                                    />
                                    {isPulsing && (
                                        <circle 
                                            r={size * 1.5} 
                                            fill={color} 
                                            opacity={0.3} 
                                            className="animate-ping"
                                        />
                                    )}
                                </Marker>
                            );
                        })}
                    </ZoomableGroup>
                </ComposableMap>
                
                {/* Controls Overlay */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-20">
                    <button onClick={handleZoomIn} className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700 shadow border border-slate-700" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={handleZoomOut} className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700 shadow border border-slate-700" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={handleReset} className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700 shadow border border-slate-700" title="Reset View"><Maximize className="w-4 h-4" /></button>
                </div>

                {/* Details Panel Overlay */}
                {selectedMarker && (
                    <div className="absolute top-4 right-4 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 z-30">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <InfoIcon className="w-4 h-4 text-blue-400" />
                                Threat Cluster
                            </h3>
                            <button onClick={() => setSelectedMarker(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                <p className="text-xs text-slate-500">Approximate IP-derived location</p>
                                <p className="text-slate-200 font-medium break-words">
                                    {selectedMarker.city_name_when_allowed ? `${selectedMarker.city_name_when_allowed}, ` : ''}
                                    {selectedMarker.region_name_when_allowed ? `${selectedMarker.region_name_when_allowed}, ` : ''}
                                    {selectedMarker.country_name || selectedMarker.country_code || 'Unknown Country'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase">Precision: {selectedMarker.location_precision.replace('_', ' ')}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                    <span className="block text-xs text-slate-500 mb-1">Severity</span>
                                    <span className="font-bold text-white text-xs px-2 py-1 rounded" style={{ backgroundColor: getMarkerColor(selectedMarker.highest_severity) }}>
                                        {selectedMarker.highest_severity}
                                    </span>
                                </div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                    <span className="block text-xs text-slate-500 mb-1">Events</span>
                                    <span className="font-bold text-slate-200">{selectedMarker.event_count}</span>
                                </div>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                <span className="block text-xs text-slate-500 mb-1">Domains Involved</span>
                                <div className="flex flex-wrap gap-1">
                                    {selectedMarker.security_domains.map(d => (
                                        <span key={d} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{d}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                <span className="block text-xs text-slate-500">Latest Activity</span>
                                <span className="text-xs text-slate-300">{new Date(selectedMarker.latest_event_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer context */}
            <div className="bg-slate-950 p-2 text-[10px] text-slate-600 border-t border-slate-800 flex justify-between">
                <span>Coordinates approximate. Private IPs and loopbacks omitted.</span>
                <span>{data?.lastUpdatedAt ? `Last Updated: ${new Date(data.lastUpdatedAt).toLocaleTimeString()}` : 'Syncing...'}</span>
            </div>
        </div>
    );
}

