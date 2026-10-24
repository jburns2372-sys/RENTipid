import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';


export default async function AdminPrivacyRequestsPage() {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PRIVACY_REQUEST_READ_ALL);
  const requests = await prisma.dataSubjectRequest.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      user: { select: { id: true } },
      assigned_to: { select: { id: true } }
    }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Subject Requests</h1>
          <p className="text-gray-600 mt-1">Manage and resolve user privacy requests</p>
        </div>
        <Link href="/dashboard/admin/privacy" className="text-blue-600 hover:underline">
          &larr; Back to Privacy Center
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{req.reference_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.request_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${req.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' : 
                      req.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      req.status === 'DENIED' ? 'bg-red-100 text-red-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(req.submitted_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {req.due_at ? new Date(req.due_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/dashboard/admin/privacy/requests/${req.id}`} className="text-indigo-600 hover:text-indigo-900">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {requests.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No Data Subject Requests found.
          </div>
        )}
      </div>
    </div>
  );
}

