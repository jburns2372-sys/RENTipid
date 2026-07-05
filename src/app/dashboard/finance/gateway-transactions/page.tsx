import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function GatewayTransactionsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const adminRole = user?.role;

  if (adminRole !== 'Admin' && adminRole !== 'Finance Admin' && adminRole !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const transactions = await prisma.gatewayTransaction.findMany({
    orderBy: { created_at: 'desc' },
    include: { booking: true }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gateway Transactions (Finance Recon)</h1>
        <p className="text-gray-500 mt-2">Monitor all gateway checkout sessions and webhook reconciliations across Sandbox and Live Pilot modes.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Provider / Mode</th>
              <th className="p-4 font-semibold">Gateway Ref</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold">Gateway Status</th>
              <th className="p-4 font-semibold">Reconciliation</th>
              <th className="p-4 font-semibold">Booking ID</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">No gateway transactions yet.</td>
              </tr>
            ) : transactions.map(tx => (
              <tr key={tx.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-4 text-xs text-gray-500">{tx.created_at.toLocaleString()}</td>
                <td className="p-4 text-xs font-semibold">
                  {tx.provider} <br />
                  <span className={`px-2 py-0.5 mt-1 rounded-full text-[10px] ${tx.provider_mode === 'Sandbox' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                    {tx.provider_mode}
                  </span>
                </td>
                <td className="p-4 text-xs font-mono text-gray-500">{tx.gateway_reference || 'Pending...'}</td>
                <td className="p-4 font-bold text-gray-900">{tx.currency} {tx.amount.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                    ${tx.gateway_status.includes('Paid Sandbox') ? 'bg-green-100 text-green-800' :
                      tx.gateway_status.includes('Paid Live Pilot') ? 'bg-purple-100 text-purple-800 animate-pulse' :
                      tx.gateway_status === 'Checkout Pending' ? 'bg-yellow-100 text-yellow-800' :
                      tx.gateway_status.includes('Failed') ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {tx.gateway_status}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                    ${tx.reconciliation_status === 'Matched' ? 'bg-green-100 text-green-800' :
                      tx.reconciliation_status === 'Matched Pending Finance Review' ? 'bg-purple-100 text-purple-800 font-bold border border-purple-300' :
                      tx.reconciliation_status === 'Mismatch' || tx.reconciliation_status === 'Manual Review Required' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {tx.reconciliation_status}
                  </span>
                </td>
                <td className="p-4 text-xs font-mono text-blue-600 hover:underline">
                  <a href={`/dashboard/admin/bookings/${tx.booking_id}`}>{tx.booking_id.slice(-8).toUpperCase()}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
