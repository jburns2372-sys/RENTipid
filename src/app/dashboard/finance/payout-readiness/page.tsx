import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function FinancePayoutReadinessPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'Finance Admin' && userRole !== 'Super Admin') redirect('/dashboard');

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Provider Payout Readiness & Operations</h1>
      <p className="text-gray-600 mb-8">Phase 16 - Limited Live Pilot Manual Process</p>

      <div className="bg-yellow-50 text-yellow-800 p-4 rounded text-sm mb-6 border border-yellow-200">
        <strong>IMPORTANT:</strong> Automated Gateway API payouts (disbursements) are disabled during the Limited Live Pilot. All provider payouts strictly exist as manual adjustments based on the internal ledger.
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm mb-6">
        <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Manual Payout Standard Operating Procedure (SOP)</h2>
        <ol className="list-decimal list-inside space-y-4 text-sm text-gray-700">
          <li>
            <strong>Ledger Generation:</strong> When a booking safely concludes (Returned without dispute), the system generates a Finance Ledger entry for the Provider Payout (Amount - Platform Commission).
          </li>
          <li>
            <strong>Settlement Delay Hold:</strong> The ledger will remain on a mandatory hold period (e.g., 3 days) to account for late disputes.
          </li>
          <li>
            <strong>Finance Review:</strong> Verify the Provider has a verified bank account on file.
          </li>
          <li>
            <strong>External Bank Transfer:</strong> A Finance Administrator logs into the RENTipid corporate bank or payment portal to physically disburse the funds to the Provider.
          </li>
          <li>
            <strong>Reconciliation Update:</strong> The Finance Administrator updates the ledger status in the system to <em>"Settled"</em> and attaches the external batch/reference ID.
          </li>
        </ol>
      </div>
    </div>
  );
}
