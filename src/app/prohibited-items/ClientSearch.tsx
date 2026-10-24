"use client";

import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, ShieldAlert, FileText, Ban } from 'lucide-react';

interface Policy {
  id: string;
  policyCode: string;
  name: string;
  classification: string;
  riskLevel: string;
  summary: string;
  examples: string;
  publicGuidance: string | null;
}

export default function ClientSearch({ policies }: { policies: Policy[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchesSearch = query === '' || 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.summary.toLowerCase().includes(query.toLowerCase()) ||
        p.examples.toLowerCase().includes(query.toLowerCase());
      
      const matchesFilter = filter === 'ALL' || p.classification === filter;

      return matchesSearch && matchesFilter;
    });
  }, [policies, query, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-gray-900"
            placeholder="Search prohibited items, keywords, or policies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="block w-full md:w-48 py-3 px-4 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        >
          <option value="ALL">All Policies</option>
          <option value="PROHIBITED">Prohibited</option>
          <option value="RESTRICTED">Restricted</option>
          <option value="UNSUPPORTED">Unsupported</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredPolicies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border shadow-sm">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No matching policies found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search query or filter.</p>
          </div>
        ) : (
          filteredPolicies.map(policy => (
            <div key={policy.id} className="bg-white rounded-lg border shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {policy.classification === 'PROHIBITED' && <Ban className="h-6 w-6 text-red-500" />}
                  {policy.classification === 'RESTRICTED' && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
                  {policy.classification === 'UNSUPPORTED' && <ShieldAlert className="h-6 w-6 text-orange-500" />}
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{policy.name}</h3>
                    <div className="flex space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${policy.classification === 'PROHIBITED' ? 'bg-red-100 text-red-800' : ''}
                        ${policy.classification === 'RESTRICTED' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${policy.classification === 'UNSUPPORTED' ? 'bg-orange-100 text-orange-800' : ''}
                      `}>
                        {policy.classification}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${policy.riskLevel === 'CRITICAL' ? 'border-red-500 text-red-600' : 'border-gray-300 text-gray-600'}
                      `}>
                        {policy.riskLevel} RISK
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  {policy.policyCode}
                </div>
              </div>

              <div className="mt-4 text-gray-700">
                <p>{policy.summary}</p>
              </div>

              {policy.examples && (
                <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" /> Examples of Items
                  </h4>
                  <p className="text-sm text-gray-600">{policy.examples}</p>
                </div>
              )}

              {policy.publicGuidance && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Public Guidance</h4>
                  <p className="text-sm text-blue-700/90">{policy.publicGuidance}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
