import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export default async function LivePaymentRunbookPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const runbookSteps = [
    "Confirm PayMongo KYC approved.",
    "Confirm at least one live payment method active.",
    "Confirm production HTTPS APP_BASE_URL.",
    "Confirm PayMongo webhook URL registered.",
    "Confirm webhook health passes.",
    "Confirm one pilot renter selected.",
    "Confirm one pilot provider selected.",
    "Confirm one low-risk listing selected.",
    "Confirm transaction limit is 1.",
    "Confirm amount is low-value only.",
    "Confirm finance review required.",
    "Confirm refund automation OFF.",
    "Confirm payout automation OFF.",
    "Confirm emergency freeze OFF only during test.",
    "Execute actual booking.",
    "Execute actual PayMongo Live checkout.",
    "Monitor webhook.",
    "Confirm reconciliation matched.",
    "Finance approves with note.",
    "Booking confirms.",
    "Deposit becomes held in ledger.",
    "Provider payout remains manual.",
    "Refund remains manual.",
    "Turn emergency freeze ON.",
    "Attempt second live checkout.",
    "Confirm second live checkout is blocked.",
    "Update Phase 19B-B final report."
  ];

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Final Live Payment Runbook</h1>
        <p className="text-gray-600">
          The exact final execution sequence to perform the absolute first live real-money transaction once PayMongo approval is granted.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 bg-blue-50 border-b border-blue-100">
          <h2 className="font-bold flex items-center text-blue-900">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            Standard Operating Procedure (SOP)
          </h2>
          <p className="text-sm text-blue-700 mt-1">Follow these steps strictly in order during the Live Pilot test.</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {runbookSteps.map((step, index) => (
            <div key={index} className="p-4 flex items-start hover:bg-gray-50 transition">
              <div className="flex-shrink-0 mt-1 mr-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                  {index + 1}
                </div>
              </div>
              <div>
                <p className="text-gray-900 font-medium">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
