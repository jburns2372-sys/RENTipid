"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Globe, Search, Info, MapPin, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { 
  PHILIPPINE_REGISTER, 
  INTERNATIONAL_REGISTER, 
  getLawsByJurisdiction,
  getAllJurisdictions,
  LegalControlRecord
} from '@/lib/compliance/registry';

export default function GlobalLegalCompliancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('Philippines');
  const [expandedLaws, setExpandedLaws] = useState<Set<string>>(new Set());

  const toggleLaw = (lawId: string) => {
    const newExpanded = new Set(expandedLaws);
    if (newExpanded.has(lawId)) {
      newExpanded.delete(lawId);
    } else {
      newExpanded.add(lawId);
    }
    setExpandedLaws(newExpanded);
  };

  const jurisdictions = ['Philippines', ...getAllJurisdictions().filter(j => j !== 'Philippines')];
  
  // Filter current displayed laws
  let displayedLaws = getLawsByJurisdiction(selectedJurisdiction);
  
  if (searchTerm) {
    const lowerTerm = searchTerm.toLowerCase();
    displayedLaws = [...PHILIPPINE_REGISTER, ...INTERNATIONAL_REGISTER].filter(law => 
      law.officialName.toLowerCase().includes(lowerTerm) || 
      law.lawId.toLowerCase().includes(lowerTerm) ||
      law.primaryApplication.toLowerCase().includes(lowerTerm) ||
      law.countryOrRegion.toLowerCase().includes(lowerTerm)
    );
  }

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} /> Active</span>;
      case 'COMPLIANCE_READY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CheckCircle size={12} /> Compliance Ready</span>;
      case 'VALIDATION_REQUIRED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} /> Validation Required</span>;
      case 'RESTRICTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><AlertCircle size={12} /> Restricted</span>;
      case 'BLOCKED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle size={12} /> Blocked</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Link href="/help" className="hover:text-blue-600">Help</Link>
          <ChevronRight size={16} className="mx-1" />
          <Link href="/help/trust-safety-legal" className="hover:text-blue-600">Trust, Safety & Legal</Link>
          <ChevronRight size={16} className="mx-1" />
          <span className="text-gray-900 font-medium">Global Legal Compliance</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Globe className="text-blue-600" size={32} />
          Global Legal Compliance Register
        </h1>
        
        <p className="text-lg text-gray-600 mb-6 border-l-4 border-blue-600 pl-4 bg-gray-50 py-3 pr-4 rounded-r-lg">
          RENTipid applies jurisdiction-specific requirements according to applicable law and the circumstances of the relevant service, provider, user, rental category and transaction. Inclusion of a law in this Compliance Center does not mean that every provision applies to every RENTipid transaction.
        </p>

        {/* Search */}
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
            placeholder="Search laws, jurisdictions, topics (e.g. RA 11967, GDPR, privacy, refund)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar / Jurisdiction Selector */}
        {!searchTerm && (
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-blue-500" /> 
                Select Jurisdiction
              </h3>
              <div className="space-y-1">
                {jurisdictions.map(jurisdiction => (
                  <button
                    key={jurisdiction}
                    onClick={() => setSelectedJurisdiction(jurisdiction)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedJurisdiction === jurisdiction 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {jurisdiction}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {searchTerm ? (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Search Results for "{searchTerm}"</h2>
              <p className="text-gray-500 mb-6">Found {displayedLaws.length} matching legal records.</p>
            </div>
          ) : (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedJurisdiction === 'Philippines' ? 'Philippine Baseline Compliance' : `${selectedJurisdiction} Profile`}
              </h2>
              {selectedJurisdiction === 'Philippines' && (
                <p className="text-gray-600 mb-4 bg-blue-50 p-4 rounded-lg text-sm border border-blue-100">
                  <Shield size={16} className="inline mr-2 text-blue-600" />
                  <strong>RA 11967</strong> is the central Philippine marketplace law for RENTipid because its statutory scope expressly includes the sale or lease of digital or non-digital goods and services over the internet.
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {displayedLaws.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <Globe className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                <p className="text-gray-500">Try adjusting your search terms.</p>
              </div>
            ) : (
              displayedLaws.map((law, index) => (
                <div key={`${law.lawId}-${index}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <button 
                    onClick={() => toggleLaw(law.lawId)}
                    className="w-full text-left px-6 py-4 flex items-start justify-between bg-white focus:outline-none"
                  >
                    <div className="pr-4">
                      {searchTerm && (
                        <div className="text-xs font-semibold text-blue-600 mb-1 tracking-wider uppercase">
                          {law.countryOrRegion}
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 pr-8">{law.officialName}</h3>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {renderStatusBadge(law.status)}
                        {law.isCore && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Core Baseline
                          </span>
                        )}
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 font-mono">
                          ID: {law.lawId}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex-shrink-0 text-gray-400">
                      {expandedLaws.has(law.lawId) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </button>
                  
                  {expandedLaws.has(law.lawId) && (
                    <div className="px-6 pb-5 pt-2 border-t border-gray-100 bg-gray-50">
                      <div className="mt-2">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          <Info size={16} className="text-blue-500" />
                          RENTipid Application
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed pl-6">
                          {law.primaryApplication}
                        </p>
                      </div>
                      
                      {law.effectiveDate && (
                        <div className="mt-4 pl-6">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</span>
                          <p className="text-sm text-gray-900 mt-1">{law.effectiveDate}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8 text-xs text-gray-500 text-center border-t border-gray-200 pt-6">
            <p>Information provided in this Compliance Center is intended to explain RENTipid's platform compliance framework and is not individual legal advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
