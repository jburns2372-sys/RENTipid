import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function FinanceRefundReadinessPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'Finance Admin' && userRole !== 'Super Admin') redirect('/dashboard');

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Refund Readiness & Operations</h1>
      <p className="text-gray-600 mb-8">Phase 16 - Limited Live Pilot Manual Process</p>

      <div className="bg-yellow-50 text-yellow-800 p-4 rounded text-sm mb-6 border border-yellow-200">
        <strong>IMPORTANT:</strong> Automated Gateway API refunds are disabled during the Limited Live Pilot. All refunds strictly exist as manual adjustments.
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm mb-6">
        <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Manual Refund Standard Operating Procedure (SOP)</h2>
        <ol className="list-decimal list-inside space-y-4 text-sm text-gray-700">
          <li>
            <strong>Refund Request Triage:</strong> Monitor disputes or booking cancellations that result in a Renter refund claim. The system will mark these as <em>"Refund Requested"</em>.
          </li>
          <li>
            <strong>Finance Review:</strong> Review evidence attached to the claim or cancellation to calculate the exact refund amount (excluding utilized days or penalty fees).
          </li>
          <li>
            <strong>System Approval:</strong> Click "Approve Refund" on the dashboard. This transitions the status to <em>"Approved Placeholder"</em> but <strong>does not move real money</strong>.
          </li>
          <li>
            <strong>External Bank Transfer:</strong> A Finance Administrator logs into the RENTipid corporate bank or PayMongo dashboard to physically remit the approved funds to the Renter.
          </li>
          <li>
            <strong>Reconciliation Update:</strong> The Finance Administrator returns to this dashboard and updates the status to <em>"Processed Manual Placeholder"</em>, attaching the external transaction reference ID.
          </li>
        </ol>
      </div>
    </div>
  );
}
