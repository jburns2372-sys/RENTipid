import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function FinancePayoutsDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Finance Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const payouts = await prisma.providerPayout.findMany({
    include: { booking: true },
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">Provider Payouts</h1>
        <Link href="/dashboard/finance/payout-batches">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            Manage Batches
          </button>
        </Link>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm">
              <th className="p-4 font-medium">Payout No.</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Provider ID</th>
              <th className="p-4 font-medium">Net Amount</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {payouts.map(payout => (
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="p-4">{payout.payout_number}</td>
                <td className="p-4">{new Date(payout.created_at).toLocaleDateString()}</td>
                <td className="p-4">{payout.provider_id}</td>
                <td className="p-4 font-medium text-green-600">₱{payout.net_payout_amount.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${payout.payout_status.includes('Approved') ? 'bg-green-100 text-green-700' : 
                      payout.payout_status.includes('Review') ? 'bg-blue-100 text-blue-700' : 
                      payout.payout_status.includes('Processed') ? 'bg-gray-100 text-gray-700' : 
                      'bg-orange-100 text-orange-700'}`}>
                    {payout.payout_status}
                  </span>
                </td>
                <td className="p-4">
                  <Link href={`/dashboard/finance/payouts/${payout.id}`} className="text-blue-600 hover:underline">
                    View &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No payout records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
