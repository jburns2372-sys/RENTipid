'use client';

import React, { useState } from 'react';
import { initializeRulesAction } from '@/app/dashboard/admin/security/rules/actions';
import { ShieldAlert, Play, Plus, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface RuleDTO {
  rule_id: string;
  version: number;
  name: string;
  status: string;
  severity: string;
  security_domain: string;
  threshold: number;
  window_seconds: number;
  cooldown_seconds: number;
  correlation_strategy: string;
  deduplication_strategy: string;
  validation_result: string;
  compatibility_result: string;
  activation_eligibility: string;
}

export default function RuleListClient({ initialRules }: { initialRules: RuleDTO[] }) {
  const [rules, setRules] = useState<RuleDTO[]>(initialRules);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handleInitialize = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await initializeRulesAction();
      if (!res.success) {
        setMessage({ type: 'error', text: res.error || "Initialization failed" });
      } else {
        setMessage({ type: 'success', text: `Initialization processed ${res.results?.length} rules.` });
        // In a real app we'd refresh the list from the server (e.g. router.refresh())
        // but for Gate 3G demonstration, we expect the page to be refreshed manually or the state to be updated if needed.
        window.location.reload();
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Rule Initialization</h2>
          <p className="text-sm text-gray-500 mt-1">Initialize the mandatory DRAFT detection rules. Requires verified Super Admin.</p>
        </div>
        <button 
          onClick={handleInitialize}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
        >
          {loading ? <span className="animate-spin text-xl leading-none">⟳</span> : <Plus className="w-5 h-5" />}
          Initialize Draft Rules
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border flex gap-3 ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No detection rules found</h3>
          <p className="text-gray-500 mt-1">Click the button above to initialize the baseline DRAFT rules.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {rules.map(rule => (
            <div key={`${rule.rule_id}-${rule.version}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 bg-gray-50 border-b border-gray-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{rule.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                      v{rule.version}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      rule.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {rule.status}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-gray-500">{rule.rule_id}</p>
                </div>
                <div className="flex gap-2">
                   <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <Info className="w-4 h-4" /> Preview
                   </button>
                   <button disabled className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition opacity-50 cursor-not-allowed" title="Not available in this milestone">
                      <Play className="w-4 h-4" /> Activate
                   </button>
                </div>
              </div>
              
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Severity</p>
                  <p className={`font-semibold ${
                    rule.severity === 'CRITICAL' ? 'text-red-700' : 
                    rule.severity === 'HIGH' ? 'text-orange-600' : 'text-blue-600'
                  }`}>{rule.severity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Domain</p>
                  <p className="font-medium text-gray-900">{rule.security_domain}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Threshold / Window</p>
                  <p className="font-medium text-gray-900">{rule.threshold} hits / {rule.window_seconds}s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Cooldown</p>
                  <p className="font-medium text-gray-900">{rule.cooldown_seconds}s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Correlation</p>
                  <p className="font-medium text-gray-900 text-sm truncate" title={rule.correlation_strategy}>{rule.correlation_strategy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Deduplication</p>
                  <p className="font-medium text-gray-900 text-sm truncate" title={rule.deduplication_strategy}>{rule.deduplication_strategy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Validation</p>
                  <p className="font-medium text-green-600 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {rule.validation_result}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Compatibility</p>
                  <p className="font-medium text-green-600 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {rule.compatibility_result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
