import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';

export default async function AdminPrivacyConsentsPage() {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PRIVACY_REQUEST_READ_ALL);
  const consents = await prisma.cookieConsentReceipt.findMany({
    orderBy: { consented_at: 'desc' },
    take: 50,
    include: {
      user: { select: { id: true } }
    }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consent Receipts</h1>
          <p className="text-gray-600 mt-1">Audit log of user and anonymous cookie consent choices</p>
        </div>
        <Link href="/dashboard/admin/privacy" className="text-blue-600 hover:underline">
          &larr; Back to Privacy Operations
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferences</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {consents.map((consent) => (
              <tr key={consent.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {consent.consented_at.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {consent.user_id || 'Anonymous'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {consent.ip_address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {consent.consent_action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  F:{consent.functional_enabled ? 'Y' : 'N'} A:{consent.analytics_enabled ? 'Y' : 'N'} M:{consent.marketing_enabled ? 'Y' : 'N'}
                </td>
              </tr>
            ))}
            {consents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No consent records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
