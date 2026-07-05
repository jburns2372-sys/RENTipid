import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreditCard, CheckSquare, Clock, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function PaymentReadinessPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const checklist = [
    { title: "Business Registration (DTI/SEC)", status: "Pending", owner: "Legal" },
    { title: "Corporate Bank Account Created", status: "Pending", owner: "Finance" },
    { title: "Payment Gateway Application (PayMongo/Xendit)", status: "Pending", owner: "Admin" },
    { title: "API Sandbox Testing", status: "Pending", owner: "Engineering" },
    { title: "Escrow Liability Clearance", status: "Pending", owner: "Legal" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={24} className="text-emerald-600" /> Payment Gateway Readiness
          </h1>
          <p className="text-gray-500 mt-1">Roadmap for transitioning from Mock Escrow to Real Financial Processing (Phase 14).</p>
        </div>
        <Link href="/dashboard/super-admin/payment-launch">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm text-sm flex items-center gap-2">
            View Current Launch Config
          </button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gray-50 border-b px-6 py-3 font-bold text-gray-800">
              Phase 14 Integration Checklist
            </div>
            <div className="divide-y">
              {checklist.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-amber-500" />
                    <span className="font-medium text-gray-800">{item.title}</span>
                  </div>
                  <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded border border-amber-200">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl mb-4">
            <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
              <FileText size={18} /> Formal Roadmap
            </h3>
            <p className="text-sm text-emerald-800 mb-3">
              Read the complete engineering and legal roadmap for the Phase 14 payment architecture.
            </p>
            <Link href="file:///C:/Users/user/.gemini/antigravity-ide/brain/4dc709bc-9d53-42ae-8aad-a940ecbb8bdb/docs/payment-gateway-readiness.md">
              <span className="text-emerald-700 font-bold text-sm underline cursor-pointer">Read the Documentation</span>
            </Link>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={18} /> Escrow Warning
            </h3>
            <p className="text-sm text-amber-800">
              Acting as a financial intermediary requires strict handling of held deposits. We strongly recommend choosing a Gateway that natively supports "Auth and Capture" delays rather than holding cash balances directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
