import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';

const prisma = new PrismaClient();

export default async function AppealsQueuePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PROHIBITED_ITEMS_MANAGE_APPEAL);

  const statusFilter = searchParams.status;
  
  const appeals = await prisma.listingPolicyAppeal.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: [
      { status: 'asc' },
      { submittedAt: 'desc' }
    ],
    include: {
      enforcementCase: {
        include: {
          policy: true
        }
      }
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appeals Queue</h2>
          <p className="text-sm text-gray-500 mt-1">Review and manage user appeals for enforcement actions.</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/compliance/prohibited-items/appeals" className={`px-4 py-2 text-sm font-medium rounded-md ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>All</Link>
          <Link href="/dashboard/compliance/prohibited-items/appeals?status=SUBMITTED" className={`px-4 py-2 text-sm font-medium rounded-md ${statusFilter === 'SUBMITTED' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>New</Link>
          <Link href="/dashboard/compliance/prohibited-items/appeals?status=UNDER_REVIEW" className={`px-4 py-2 text-sm font-medium rounded-md ${statusFilter === 'UNDER_REVIEW' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Under Review</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Appeal ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Case Number</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Appellant</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appeals.map(appeal => (
                <tr key={appeal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{appeal.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appeal.enforcementCase.caseNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${appeal.status === 'SUBMITTED' ? 'bg-orange-100 text-orange-800' :
                        appeal.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                        appeal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {appeal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appeal.appellantUserId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(appeal.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <Link href={`/dashboard/compliance/prohibited-items/appeals/${appeal.id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors">
                      Review Appeal
                    </Link>
                  </td>
                </tr>
              ))}
              {appeals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No appeals found matching the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
