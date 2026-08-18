import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';

const prisma = new PrismaClient();

export default async function EnforcementQueuePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PROHIBITED_ITEMS_REVIEW_LISTING);

  const statusFilter = searchParams.status;
  
  const cases = await prisma.listingEnforcementCase.findMany({
    where: statusFilter ? { caseStatus: statusFilter } : undefined,
    orderBy: [
      { caseStatus: 'asc' },
      { created_at: 'desc' }
    ],
    include: {
      policy: true
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enforcement Queue</h2>
          <p className="text-sm text-gray-500 mt-1">Review flagged listings and manage active cases.</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/compliance/prohibited-items/enforcement" className={`px-4 py-2 text-sm font-medium rounded-md ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>All</Link>
          <Link href="/dashboard/compliance/prohibited-items/enforcement?status=OPEN" className={`px-4 py-2 text-sm font-medium rounded-md ${statusFilter === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Open</Link>
          <Link href="/dashboard/compliance/prohibited-items/enforcement?status=UNDER_REVIEW" className={`px-4 py-2 text-sm font-medium rounded-md ${statusFilter === 'UNDER_REVIEW' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Under Review</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Case Number</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Listing ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Policy Violated</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.caseNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{c.listingId.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-medium text-gray-900">{c.policy.policyCode}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{c.policy.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${c.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        c.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${c.caseStatus === 'OPEN' ? 'bg-red-100 text-red-800' :
                        c.caseStatus === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {c.caseStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <Link href={`/dashboard/compliance/prohibited-items/enforcement/${c.id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">No cases found matching the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
