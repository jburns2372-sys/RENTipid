import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Flame, CheckCircle, XCircle } from 'lucide-react';

export default async function V1SmokeTestPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const smokeTests = [
    { module: "Core Navigation", tests: ["Home loads", "Browse loads", "Listing detail loads"] },
    { module: "User Authentication", tests: ["Register works", "Login works", "KYC upload works"] },
    { module: "Provider Operations", tests: ["Provider listing creation works", "Admin listing approval works", "Provider approval works"] },
    { module: "Transaction Lifecycle", tests: ["Booking request works", "Agreement acceptance works", "Mock payment works"] },
    { module: "Inspections & Disputes", tests: ["Pre-rental inspection works", "Return inspection works", "Damage claim works", "Dispute resolution works"] },
    { module: "System & Admin", tests: ["Support ticket works", "AI assistant works", "Social mock promotion works", "Admin reports work", "Launch controls work"] },
    { module: "Security Integrity", tests: ["Private files remain protected", "RBAC still works", "Build passes"] },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flame size={24} className="text-orange-600" /> Final V1 Smoke Test
        </h1>
        <p className="text-gray-500 mt-1">Manual execution tracking for the absolute final end-to-end check before unlocking Public Registration.</p>
      </div>

      <div className="grid gap-6">
        {smokeTests.map((group, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gray-50 border-b px-5 py-3 font-bold text-gray-800">
              {group.module}
            </div>
            <div className="divide-y">
              {group.tests.map((test, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <span className="font-medium text-gray-700">{test}</span>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold hover:bg-green-100 transition">
                      <CheckCircle size={14} /> Passed
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1 bg-white text-gray-500 border border-gray-200 rounded text-xs font-bold hover:bg-gray-50 transition">
                      Pending
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1 bg-white text-gray-500 border border-gray-200 rounded text-xs font-bold hover:bg-red-50 hover:text-red-700 transition">
                      <XCircle size={14} /> Failed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
