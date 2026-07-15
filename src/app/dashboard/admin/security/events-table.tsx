"use client";
import React, { useState, useEffect } from 'react';
import { SecurityEventSource, SecurityDomain, SecuritySeverity, SecurityProcessingStatus } from '@/lib/security/events/taxonomy';

export function EventsTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setCursor] = useState<string | undefined>();
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [filters, setFilters] = useState({
    source_type: '',
    security_domain: '',
    severity: '',
    processing_status: ''
  });

  const fetchEvents = async (currentCursor?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentCursor) params.append('cursor', currentCursor);
      if (filters.source_type) params.append('source_type', filters.source_type);
      if (filters.security_domain) params.append('security_domain', filters.security_domain);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.processing_status) params.append('processing_status', filters.processing_status);

      const res = await fetch(`/api/admin/security/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      
      const data = await res.json();
      setEvents(data.data || []);
      setNextCursor(data.pagination?.nextCursor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleNextPage = () => {
    if (nextCursor) {
      setCursor(nextCursor);
      fetchEvents(nextCursor);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCursor(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap bg-gray-900 p-4 rounded-xl border border-gray-800">
        <select name="source_type" onChange={handleFilterChange} className="bg-gray-800 text-white border border-gray-700 rounded p-2 text-sm outline-none">
          <option value="">All Sources</option>
          {Object.values(SecurityEventSource).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="security_domain" onChange={handleFilterChange} className="bg-gray-800 text-white border border-gray-700 rounded p-2 text-sm outline-none">
          <option value="">All Domains</option>
          {Object.values(SecurityDomain).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="severity" onChange={handleFilterChange} className="bg-gray-800 text-white border border-gray-700 rounded p-2 text-sm outline-none">
          <option value="">All Severities</option>
          {Object.values(SecuritySeverity).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="processing_status" onChange={handleFilterChange} className="bg-gray-800 text-white border border-gray-700 rounded p-2 text-sm outline-none">
          <option value="">All Statuses</option>
          {Object.values(SecurityProcessingStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-800 rounded-xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-900 text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-4 py-3">Occurred At</th>
              <th className="px-4 py-3">Event Code</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No events found.</td></tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">{new Date(ev.occurred_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs">{ev.event_code}</td>
                  <td className="px-4 py-3">{ev.source_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      ev.severity === 'CRITICAL' || ev.severity === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                      ev.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {ev.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">{ev.processing_status}</td>
                  <td className="px-4 py-3 truncate max-w-[200px]" title={ev.classification_reason}>{ev.classification_reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-400 mt-2">
        <span>Showing up to 50 events per page</span>
        <button 
          onClick={handleNextPage} 
          disabled={!nextCursor || loading}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded border border-gray-700 transition"
        >
          Next Page
        </button>
      </div>
    </div>
  );
}
