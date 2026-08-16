"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, BarChart2, ShieldAlert, Zap, BookOpen, Activity, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

interface SpecialistControl {
  specialistId: string;
  enabled: boolean;
  maturityLevel: string;
  fallback: string;
}

export default function AIControlCenter() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState('24h');
  const [traceId, setTraceId] = useState('');
  const [traceData, setTraceData] = useState<any>(null);
  const [traceError, setTraceError] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);
  const [specialistControls, setSpecialistControls] = useState<SpecialistControl[] | null>(null);
  const [controlError, setControlError] = useState('');
  const [updatingSpecialist, setUpdatingSpecialist] = useState('');

  useEffect(() => {
    fetch(`/api/admin/ai-customer-service/analytics?range=${range}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load analytics');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message));
  }, [range]);

  useEffect(() => {
    fetch('/api/admin/ai-customer-service/analytics?control=specialists')
      .then(async response => {
        if (response.status === 403) return null;
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Failed to load specialist controls');
        return body.specialists as SpecialistControl[];
      })
      .then(setSpecialistControls)
      .catch(controlLoadError => setControlError(
        controlLoadError instanceof Error ? controlLoadError.message : 'Failed to load specialist controls',
      ));
  }, []);

  const loadTrace = async () => {
    const requestedTraceId = traceId.trim();
    if (!requestedTraceId || traceLoading) return;
    setTraceLoading(true);
    setTraceError('');
    setTraceData(null);
    try {
      const response = await fetch(`/api/admin/ai-customer-service/analytics?traceId=${encodeURIComponent(requestedTraceId)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Failed to load specialist trace');
      setTraceData(body.trace);
    } catch (traceLookupError) {
      setTraceError(traceLookupError instanceof Error ? traceLookupError.message : 'Failed to load specialist trace');
    } finally {
      setTraceLoading(false);
    }
  };

  const updateSpecialist = async (specialist: SpecialistControl) => {
    if (updatingSpecialist) return;
    setUpdatingSpecialist(specialist.specialistId);
    setControlError('');
    try {
      const response = await fetch('/api/admin/ai-customer-service/analytics', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ specialistId: specialist.specialistId, enabled: !specialist.enabled }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Failed to update specialist control');
      setSpecialistControls(current => current?.map(item =>
        item.specialistId === body.specialist.specialistId ? body.specialist : item,
      ) ?? null);
    } catch (controlUpdateError) {
      setControlError(controlUpdateError instanceof Error ? controlUpdateError.message : 'Failed to update specialist control');
    } finally {
      setUpdatingSpecialist('');
    }
  };

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-8 text-gray-500 animate-pulse">Loading AI metrics...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="text-blue-600" /> AI Control Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">Read-Only Observability & Telemetry</p>
        </div>
        <select 
          value={range} 
          onChange={(e) => setRange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8" aria-labelledby="routing-trace-heading">
        <h2 id="routing-trace-heading" className="text-lg font-semibold mb-1">Request Routing Trace</h2>
        <p className="text-sm text-gray-500 mb-4">Look up bounded specialist-routing telemetry using an opaque request trace ID.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="specialist-trace-id" className="sr-only">Trace identifier</label>
          <input
            id="specialist-trace-id"
            value={traceId}
            onChange={(event) => setTraceId(event.target.value)}
            placeholder="Trace identifier"
            autoComplete="off"
            className="flex-1 border border-gray-300 rounded px-3 py-2 font-mono text-sm"
          />
          <button
            type="button"
            onClick={loadTrace}
            disabled={!traceId.trim() || traceLoading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {traceLoading ? 'Loading…' : 'View trace'}
          </button>
        </div>
        {traceError && <p role="alert" className="mt-3 text-sm text-red-600">{traceError}</p>}
      </section>

      {traceData && (
        <section className="bg-slate-950 text-slate-100 p-6 rounded-xl shadow-sm mb-8" aria-label="Specialist trace detail">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div><span className="text-slate-400">Trace</span><div className="font-mono break-all">{traceData.traceId}</div></div>
            <div><span className="text-slate-400">Intent</span><div>{traceData.intent}</div></div>
            <div><span className="text-slate-400">Selected specialist</span><div>{traceData.selectedSpecialist}</div></div>
            <div><span className="text-slate-400">Runtime status</span><div>{traceData.selectedSpecialistStatus || 'ENABLED'}</div></div>
            <div><span className="text-slate-400">Specialist version</span><div>{traceData.specialistVersion}</div></div>
            <div><span className="text-slate-400">Routing status</span><div>{traceData.fallbackStatus}</div></div>
            <div><span className="text-slate-400">Fallback target</span><div>{traceData.fallbackTarget || 'NONE'}</div></div>
            <div><span className="text-slate-400">Supervisor</span><div>{traceData.supervisorStatus}</div></div>
            <div><span className="text-slate-400">Result</span><div>{traceData.resultStatus}</div></div>
            <div><span className="text-slate-400">Consultations</span><div>{traceData.consultedSpecialists.length ? traceData.consultedSpecialists.join(', ') : 'None'}</div></div>
            <div><span className="text-slate-400">Release</span><div className="font-mono break-all">{traceData.commitIdentity || 'Unavailable'}</div></div>
          </div>
        </section>
      )}

      {specialistControls && (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8" aria-labelledby="specialist-controls-heading">
          <h2 id="specialist-controls-heading" className="text-lg font-semibold mb-1">Specialist Activation</h2>
          <p className="text-sm text-gray-500 mb-4">Reversible specialist controls. Disabled specialists use the Unified AI baseline-safe fallback.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {specialistControls.map(specialist => (
              <div key={specialist.specialistId} className="flex items-center justify-between gap-4 rounded border border-gray-200 p-3">
                <div>
                  <div className="font-medium text-sm">{specialist.specialistId}</div>
                  <div className="text-xs text-gray-500">{specialist.maturityLevel} · fallback: {specialist.fallback}</div>
                </div>
                <button
                  type="button"
                  aria-pressed={specialist.enabled}
                  disabled={Boolean(updatingSpecialist)}
                  onClick={() => updateSpecialist(specialist)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${specialist.enabled ? 'bg-green-600' : 'bg-slate-600'}`}
                >
                  {updatingSpecialist === specialist.specialistId ? 'Saving…' : specialist.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
          {controlError && <p role="alert" className="mt-3 text-sm text-red-600">{controlError}</p>}
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Executive Summary Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-2">Total Conversations</div>
          <div className="text-3xl font-bold">{data.executive.conversationsToday.value}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-2">Autonomous Resolution</div>
          <div className="text-3xl font-bold text-green-600">{data.executive.autonomousResolutionRate.value}%</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-2">Feedback Satisfaction</div>
          <div className="text-3xl font-bold text-blue-600">
            {data.executive.positiveFeedbackPercent.value !== null ? `${data.executive.positiveFeedbackPercent.value}%` : 'N/A'}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-2">Median Latency</div>
          <div className="text-3xl font-bold">{data.discovery.medianResponseLatencyMs.value}ms</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security & Operations */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b pb-2">
              <ShieldAlert size={18} className="text-red-500" /> Security & Policy
            </h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Blocked Prompts</span>
                <span className="font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{data.security.blockedPrompts.value}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Cross-User Denials</span>
                <span className="font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{data.security.crossUserDenials.value}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Prohibited Tool Attempts</span>
                <span className="font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{data.security.prohibitedToolAttempts.value}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Tool RBAC Denials</span>
                <span className="font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{data.security.toolRbacDenials.value}</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b pb-2">
              <BookOpen size={18} className="text-indigo-500" /> Knowledge & Routing
            </h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Knowledge Missing/No Match</span>
                <span className="font-medium">{data.knowledge.noMatchRate.value !== null ? `${data.knowledge.noMatchRate.value}%` : 'N/A'}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Stale Knowledge Uses</span>
                <span className="font-medium">{data.knowledge.staleCount.value}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Follow-up Backlog</span>
                <span className="font-medium">{data.operations.followUpBacklog.value}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Specialist Distribution & Discovery */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b pb-2">
              <Zap size={18} className="text-yellow-500" /> Specialist Workload
            </h3>
            {data.feedbackBreakdowns?.specialist?.value && Object.keys(data.feedbackBreakdowns.specialist.value).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(data.feedbackBreakdowns.specialist.value).map(([id, count]) => (
                  <li key={id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{id}</span>
                    <span className="font-medium bg-gray-100 px-2 rounded-full">{count as number}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400 italic">No specialist telemetry data yet</div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b pb-2">
              <BarChart2 size={18} className="text-green-500" /> Input Methods
            </h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Suggestion Clicks</span>
                <span className="font-medium">{data.discovery.suggestionClicks.value}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Free Text</span>
                <span className="font-medium">{data.discovery.freeTextUsage.value}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Contextual / Proactive</span>
                <span className="font-medium">{data.discovery.contextualEntryUsage.value} / {data.discovery.proactiveFollowUpUsage.value}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
