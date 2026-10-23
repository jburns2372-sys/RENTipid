import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';


export default async function AdminPrivacyPoliciesPage() {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PRIVACY_REQUEST_READ_ALL);
  const policies = await prisma.privacyPolicyVersion.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      created_by: { select: { id: true } },
      approved_by: { select: { id: true } }
    }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy Management</h1>
          <p className="text-gray-600 mt-1">Manage policy versions, reviews, and publications</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/admin/privacy" className="text-blue-600 hover:underline flex items-center">
            &larr; Back to Privacy Center
          </Link>
          <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
            Draft New Version
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {policies.map((policy) => (
              <tr key={policy.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 font-bold">{policy.version}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${policy.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                      policy.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 
                      policy.status === 'SUPERSEDED' ? 'bg-orange-100 text-orange-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {policy.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {policy.effective_at ? new Date(policy.effective_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(policy.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/dashboard/admin/privacy/policies/${policy.id}`} className="text-indigo-600 hover:text-indigo-900">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {policies.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No privacy policies found.
          </div>
        )}
      </div>
    </div>
  );
}

