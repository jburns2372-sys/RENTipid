"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, BarChart2, ShieldAlert, Zap, BookOpen, Activity, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

export default function AIControlCenter() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState('24h');

  useEffect(() => {
    fetch(`/api/admin/ai-customer-service/analytics?range=${range}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load analytics');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message));
  }, [range]);

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
