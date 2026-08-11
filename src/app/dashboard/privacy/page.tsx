import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

import { getServerSession } from 'next-auth'; // Or whatever auth they use
import { authOptions } from '@/lib/auth';

export default async function UserPrivacyDashboard() {
  // Mock authentication - replace with actual auth logic
  const session = await getServerSession(authOptions);
  if (!session?.user) return <div>Unauthorized</div>;
  const userId = (session.user as {id: string}).id;
  if (!userId) return <div>Unauthorized</div>;

const dsrs = await prisma.dataSubjectRequest.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' }
  });

  const latestConsent = await prisma.cookieConsentReceipt.findFirst({
    where: { user_id: userId },
    orderBy: { consented_at: 'desc' }
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">My Privacy Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Data Subject Requests</h2>
          <p className="text-gray-600 mb-4 text-sm">Track your past requests to access, correct, or delete your personal data.</p>
          
          {dsrs.length === 0 ? (
            <p className="text-sm text-gray-500 italic mb-4">No privacy requests found.</p>
          ) : (
            <ul className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
              {dsrs.map(req => (
                <li key={req.id} className="border-b pb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono font-medium">{req.reference_number}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{req.status}</span>
                  </div>
                  <div className="text-gray-500 mt-1">{req.request_type} - {new Date(req.created_at).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
          
          <Link href="/privacy/request" className="text-blue-600 hover:underline text-sm font-medium">
            Submit a New Request &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Cookie & Tracking Preferences</h2>
          <p className="text-gray-600 mb-4 text-sm">Manage how we use cookies and tracking technologies when you browse RENTipid.</p>
          
          {latestConsent ? (
            <div className="text-sm bg-gray-50 p-4 rounded mb-4">
              <div className="flex justify-between border-b pb-2 mb-2">
                <span>Necessary</span>
                <span className="text-green-600 font-medium">Always Active</span>
              </div>
              <div className="flex justify-between border-b pb-2 mb-2">
                <span>Functional</span>
                <span className={latestConsent.functional_enabled ? 'text-green-600 font-medium' : 'text-gray-500'}>
                  {latestConsent.functional_enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 mb-2">
                <span>Analytics</span>
                <span className={latestConsent.analytics_enabled ? 'text-green-600 font-medium' : 'text-gray-500'}>
                  {latestConsent.analytics_enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Marketing</span>
                <span className={latestConsent.marketing_enabled ? 'text-green-600 font-medium' : 'text-gray-500'}>
                  {latestConsent.marketing_enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic mb-4">No saved cookie preferences found.</p>
          )}

          <Link href="/privacy/cookies" className="text-blue-600 hover:underline text-sm font-medium">
            Manage Preferences &rarr;
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="flex space-x-6 text-sm">
          <Link href="/privacy" className="text-blue-600 hover:underline">Read Privacy Policy</Link>
          <Link href="/privacy/summary" className="text-blue-600 hover:underline">Plain-Language Summary</Link>
          <Link href="/settings/account/delete" className="text-red-600 hover:underline font-medium">Delete My Account</Link>
        </div>
      </div>
    </div>
  );
}




