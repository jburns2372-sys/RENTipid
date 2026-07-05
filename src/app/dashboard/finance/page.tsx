import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import LivePaymentStatusBanner from '@/components/finance/LivePaymentStatusBanner';

const prisma = new PrismaClient();

export default async function AdminFinancePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const adminRole = user?.role;

  if (adminRole !== 'Admin' && adminRole !== 'Finance Admin' && adminRole !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Get aggregated stats
  const ledgerEntries = await prisma.financeLedger.findMany({
    orderBy: { created_at: 'desc' },
    include: { booking: true, user: true }
  });

  const platformFees = ledgerEntries.filter(e => e.transaction_type === 'Platform Fee').reduce((acc, curr) => acc + curr.amount, 0);
  const totalEscrow = ledgerEntries.filter(e => e.transaction_type === 'Escrow Deposit').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingPayouts = ledgerEntries.filter(e => e.transaction_type === 'Provider Payout').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Finance Overview</h1>
        <AIAssistantButton context="Admin Finance Ledger Dashboard" />
      </div>

      <LivePaymentStatusBanner />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium mb-2">Total Platform Revenue</h3>
          <p className="text-3xl font-bold text-green-600">₱{platformFees.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium mb-2">Deposits in Escrow</h3>
          <p className="text-3xl font-bold text-orange-600">₱{totalEscrow.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium mb-2">Pending Payouts to Providers</h3>
          <p className="text-3xl font-bold text-blue-600">₱{pendingPayouts.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-lg">Master Ledger Log</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Transaction ID</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold">Associated User</th>
              <th className="p-4 font-semibold">Booking Ref</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No transactions recorded yet.</td>
              </tr>
            ) : ledgerEntries.map(entry => (
              <tr key={entry.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-4 text-xs text-gray-500">{entry.created_at.toLocaleString()}</td>
                <td className="p-4 text-xs font-mono text-gray-500">{entry.id.slice(-8).toUpperCase()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                    ${entry.transaction_type === 'Platform Fee' ? 'bg-green-100 text-green-800' :
                      entry.transaction_type === 'Escrow Deposit' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                    {entry.transaction_type}
                  </span>
                </td>
                <td className="p-4 font-bold text-gray-900">₱{entry.amount.toLocaleString()}</td>
                <td className="p-4">
                  {entry.user ? (
                    <div className="text-xs">
                      <span className="font-bold">{entry.user.full_name}</span>
                      <br /><span className="text-gray-500">{entry.user.role}</span>
                    </div>
                  ) : <span className="text-xs text-gray-400">System</span>}
                </td>
                <td className="p-4 text-xs font-mono text-gray-500">
                  {entry.booking_id ? entry.booking_id.slice(-8).toUpperCase() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
