import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function DepositPolicyReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'Super Admin' && userRole !== 'Compliance Admin') redirect('/dashboard');

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Deposit Policy Review</h1>
      <p className="text-gray-600 mb-8">Phase 16 - Legal Guardrails</p>

      <div className="bg-red-50 text-red-800 p-4 rounded text-sm mb-6 border border-red-200">
        <strong>CRITICAL COMPLIANCE NOTICE:</strong> Do not publicly claim to offer an "Escrow" service unless RENTipid is licensed and registered to do so in the operating jurisdiction. Always use terminology such as "Security Deposit Hold" or "Secure Ledger".
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm mb-6">
        <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Deposit Lifecycle Policy</h2>
        <ul className="list-disc list-inside space-y-4 text-sm text-gray-700">
          <li><strong>Hold:</strong> Deposit is authorized/collected at the time of Live Pilot booking checkout.</li>
          <li><strong>Release:</strong> Automatically transitioned to a "Release Partial/Full" ledger state upon successful mutual sign-off of the Return Inspection report.</li>
          <li><strong>Dispute Hold:</strong> If either party opens a Dispute Case or files a Damage Claim, the deposit state freezes until Admin/Finance intervention.</li>
          <li><strong>Manual Finance Processing:</strong> Similar to payouts and refunds, actual bank-level release of the security deposit hold requires manual Finance intervention during the Limited Live Pilot.</li>
        </ul>
      </div>
    </div>
  );
}
