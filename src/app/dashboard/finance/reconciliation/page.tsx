import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function FinanceReconciliationDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Finance Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const logs = await prisma.paymentReconciliationLog.findMany({
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">Settlement Reconciliation</h1>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Gateway Tx ID</th>
              <th className="p-4 font-medium">Expected</th>
              <th className="p-4 font-medium">Received</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="p-4">{new Date(log.created_at).toLocaleDateString()}</td>
                <td className="p-4">{log.gateway_transaction_id}</td>
                <td className="p-4">₱{log.expected_amount.toFixed(2)}</td>
                <td className="p-4">₱{log.received_amount.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${log.status === 'Matched' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.status}
                  </span>
                </td>
                <td className="p-4">
                  <Link href={`/dashboard/finance/reconciliation/${log.id}`} className="text-blue-600 hover:underline">
                    View &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No reconciliation records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
