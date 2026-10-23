import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { Shield, Globe, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ALL_REGISTERS, getAllJurisdictions } from '@/lib/compliance/registry';

export default async function AdminComplianceDashboard() {
  const session = await getServerSession(authOptions);
  
  // Basic RBAC check - assume user object has role or simply require auth for now
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/admin/compliance');
  }

  // Assuming roles are checked in middleware, but adding a safety check if user object has it
  const user = session.user as any;
  if (user?.role && !['Admin', 'Super Admin', 'Compliance Admin'].includes(user.role)) {
    redirect('/dashboard');
  }

  const jurisdictions = getAllJurisdictions();
  
  const stats = {
    total: ALL_REGISTERS.length,
    active: ALL_REGISTERS.filter(r => r.status === 'ACTIVE').length,
    validation: ALL_REGISTERS.filter(r => r.status === 'VALIDATION_REQUIRED').length,
    ready: ALL_REGISTERS.filter(r => r.status === 'COMPLIANCE_READY').length,
    restricted: ALL_REGISTERS.filter(r => r.status === 'RESTRICTED' || r.status === 'BLOCKED').length
  };

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} /> Active</span>;
      case 'COMPLIANCE_READY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CheckCircle size={12} /> Ready</span>;
      case 'VALIDATION_REQUIRED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} /> Validation Req.</span>;
      case 'RESTRICTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><AlertCircle size={12} /> Restricted</span>;
      case 'BLOCKED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle size={12} /> Blocked</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="text-blue-600" size={32} />
            Compliance Control Center
          </h1>
          <p className="text-gray-500 mt-2">Manage and view the Global Legal Compliance Register.</p>
        </div>
        <div className="text-sm bg-gray-100 px-4 py-2 rounded-lg font-mono text-gray-600">
          Source: In-Memory TS Registry (v1.0)
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Controls</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm text-center">
          <div className="text-green-700 text-sm font-medium mb-1">Active</div>
          <div className="text-3xl font-bold text-green-700">{stats.active}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm text-center">
          <div className="text-yellow-700 text-sm font-medium mb-1">Validation Req.</div>
          <div className="text-3xl font-bold text-yellow-700">{stats.validation}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm text-center">
          <div className="text-blue-700 text-sm font-medium mb-1">Ready</div>
          <div className="text-3xl font-bold text-blue-700">{stats.ready}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm text-center">
          <div className="text-red-700 text-sm font-medium mb-1">Restricted/Blocked</div>
          <div className="text-3xl font-bold text-red-700">{stats.restricted}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Globe className="text-gray-500" size={20} />
            Jurisdiction Register Overview
          </h2>
          <span className="text-sm text-gray-500">{jurisdictions.length} Covered Jurisdictions</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Official Law / Regulation</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ALL_REGISTERS.map((record, index) => (
                <tr key={`${record.lawId}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.lawId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.countryOrRegion}
                    {record.isCore && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Core</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={record.officialName}>
                    {record.officialName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(record.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.effectiveDate || 'Immediate'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
