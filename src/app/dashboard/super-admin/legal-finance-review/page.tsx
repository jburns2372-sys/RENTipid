import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function LegalFinanceReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'Super Admin') redirect('/dashboard');

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Legal and Finance Review</h1>
      <p className="text-gray-600 mb-8">Phase 16 - Limited Live Pilot Pre-flight Checklist</p>

      <div className="bg-white rounded-xl border p-6 shadow-sm mb-6">
        <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Policy Statuses</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <div className="font-medium">RENTipid Payment Role & Platform Fees</div>
              <div className="text-xs text-gray-500">Legal classification of marketplace transactions.</div>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Approved</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <div className="font-medium">Security Deposit Handling</div>
              <div className="text-xs text-gray-500">Legal escrow language warning review.</div>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Approved</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <div className="font-medium">Refund Policy</div>
              <div className="text-xs text-gray-500">Manual review process during live pilot.</div>
            </div>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">Under Review</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <div className="font-medium">Chargeback and Dispute Handling</div>
              <div className="text-xs text-gray-500">Finance operations manual intervention workflow.</div>
            </div>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">Under Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
