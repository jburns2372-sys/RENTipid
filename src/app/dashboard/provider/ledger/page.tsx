import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function ProviderLedgerPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'Individual Provider' && user?.role !== 'Business Provider') {
    redirect('/unauthorized');
  }

  // Get provider ledger entries
  const ledgerEntries = await prisma.financeLedger.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    include: { booking: { include: { listing: true } } }
  });

  const totalEarnings = ledgerEntries.reduce((acc, curr) => curr.balance_type === 'Credit' ? acc + curr.amount : acc - curr.amount, 0);

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Earnings Ledger</h1>
        <AIAssistantButton context="Provider Ledger Dashboard" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-1">
          <h3 className="text-gray-500 font-medium mb-2">Total Expected Earnings</h3>
          <p className="text-4xl font-bold text-gray-900">₱{totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">After platform fees are deducted</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 md:col-span-2 flex items-center">
          <div>
            <h3 className="text-blue-800 font-bold mb-1">Phase 5 Payout Notice</h3>
            <p className="text-blue-600 text-sm">
              Currently, payouts are marked as "Pending" in the ledger when a booking is confirmed. 
              Actual fund transfers to your bank account will be processed manually by the finance team until automated payouts are activated.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Transaction</th>
              <th className="p-4 font-semibold">Booking / Listing</th>
              <th className="p-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No earnings recorded yet.</td>
              </tr>
            ) : ledgerEntries.map(entry => (
              <tr key={entry.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-4 text-xs text-gray-500">{entry.created_at.toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="font-bold text-gray-900">{entry.transaction_type}</div>
                  <div className="text-[10px] text-gray-500">{entry.description}</div>
                </td>
                <td className="p-4">
                  {entry.booking ? (
                    <div>
                      <Link href={`/dashboard/provider/bookings/${entry.booking.id}`} className="text-blue-600 font-bold hover:underline">
                        {entry.booking.listing.title}
                      </Link>
                      <div className="text-[10px] font-mono text-gray-400">{entry.booking.id.slice(-8).toUpperCase()}</div>
                    </div>
                  ) : '-'}
                </td>
                <td className="p-4 text-right">
                  <span className={`font-bold ${entry.balance_type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.balance_type === 'Credit' ? '+' : '-'}₱{entry.amount.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
