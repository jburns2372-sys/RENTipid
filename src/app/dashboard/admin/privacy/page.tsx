import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

export default async function AdminPrivacyDashboard() {
  // Authorization check
  await requireSecurityPermission(SECURITY_PERMISSIONS.PRIVACY_REQUEST_READ_ALL);


  const pendingRequestsCount = await prisma.dataSubjectRequest.count({
    where: { status: { in: ['SUBMITTED', 'IDENTITY_VERIFICATION_REQUIRED', 'UNDER_REVIEW'] } }
  });

  const activePolicy = await prisma.privacyPolicyVersion.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { published_at: 'desc' }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Operations Center</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/admin/privacy/requests" className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Subject Requests</h2>
          <div className="text-3xl font-bold text-blue-600 mb-2">{pendingRequestsCount}</div>
          <p className="text-sm text-gray-500">Pending Requests requiring action</p>
        </Link>

        <Link href="/dashboard/admin/privacy/policies" className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Policy Management</h2>
          <div className="text-sm font-medium text-gray-800 mb-1">
            Active: <span className="font-mono">{activePolicy ? activePolicy.version : 'None'}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Manage policy drafts, reviews, and versioning.</p>
        </Link>

        <Link href="/dashboard/admin/privacy/consents" className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Consent Receipts</h2>
          <p className="text-sm text-gray-500 mt-2">View and audit user and anonymous cookie consent preferences.</p>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Privacy Registries & Matrices</h2>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">Personal Data Inventory</div>
              <div className="text-sm text-gray-500">Comprehensive mapping of all collected personal data</div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Verified</span>
          </div>
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">Data Processing Activity Registry (RoPA)</div>
              <div className="text-sm text-gray-500">Log of processing activities per legal requirements</div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Verified</span>
          </div>
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">Retention & Disposal Matrix</div>
              <div className="text-sm text-gray-500">Rules governing data retention and deletion triggers</div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}


