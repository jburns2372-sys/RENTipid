import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default async function AdminSOPIndex() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const sops = [
    { title: "KYC Review Process", path: "kyc-review", desc: "How to properly vet IDs, selfies, and business permits." },
    { title: "Listing Approval", path: "listing-approval", desc: "Verifying ownership, category rules, and safe listing practices." },
    { title: "Payment & Ledger Checks", path: "payment-review", desc: "Auditing mock and real transactions for correctness." },
    { title: "Dispute Resolution", path: "dispute-resolution", desc: "Handling damage claims, evidence review, and partial deposit deductions." },
    { title: "Beta Operations", path: "beta-operations", desc: "Managing labels, feedback conversion, and UAT flows." },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen size={24} className="text-blue-600" /> Admin Standard Operating Procedures
        </h1>
        <p className="text-gray-500 mt-1">Strict guidelines for platform administration during Beta.</p>
      </div>

      <div className="grid gap-4">
        {sops.map(sop => (
          <Link href={`/dashboard/admin/sop/${sop.path}`} key={sop.path} className="block group">
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:border-blue-300 hover:shadow transition">
              <h2 className="text-lg font-bold text-blue-900 group-hover:text-blue-700 transition">{sop.title}</h2>
              <p className="text-gray-600 mt-1">{sop.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
