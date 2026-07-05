import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function FinancePayoutBatchesDashboard() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const role = user?.role;

  if (role !== 'Finance Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const batches = await prisma.payoutBatch.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      payouts: true
    }
  });

  const pendingPayouts = await prisma.providerPayout.findMany({
    where: { payout_status: 'Approved for Manual Payout', payout_batch_id: null },
    include: { booking: true }
  });

  async function createBatch(formData: FormData) {
    'use server';
    const selectedPayoutIds = formData.getAll('payout_ids') as string[];
    if (selectedPayoutIds.length === 0) return;

    const payoutsToBatch = await prisma.providerPayout.findMany({
      where: { id: { in: selectedPayoutIds } }
    });

    const totalGross = payoutsToBatch.reduce((acc, p) => acc + p.gross_rental_amount, 0);
    const totalComm = payoutsToBatch.reduce((acc, p) => acc + p.platform_commission, 0);
    const totalNet = payoutsToBatch.reduce((acc, p) => acc + p.net_payout_amount, 0);

    const batch = await prisma.payoutBatch.create({
      data: {
        batch_number: `BATCH-${Date.now()}`,
        created_by: user.id,
        total_gross_amount: totalGross,
        total_commission: totalComm,
        total_net_payout: totalNet,
        payout_count: selectedPayoutIds.length,
        batch_status: 'Draft'
      }
    });

    await prisma.providerPayout.updateMany({
      where: { id: { in: selectedPayoutIds } },
      data: { payout_batch_id: batch.id }
    });

    redirect('/dashboard/finance/payout-batches');
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">Payout Batches</h1>
      </div>

      {pendingPayouts.length > 0 && (
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold mb-4">Create New Batch</h2>
          <form action={createBatch}>
            <table className="w-full text-left border-collapse mb-4">
              <thead>
                <tr className="bg-gray-50 border-b text-sm">
                  <th className="p-2"><input type="checkbox" disabled checked className="w-4 h-4" /></th>
                  <th className="p-2 font-medium">Payout No.</th>
                  <th className="p-2 font-medium">Provider ID</th>
                  <th className="p-2 font-medium">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {pendingPayouts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-2"><input type="checkbox" name="payout_ids" value={p.id} defaultChecked className="w-4 h-4" /></td>
                    <td className="p-2">{p.payout_number}</td>
                    <td className="p-2">{p.provider_id}</td>
                    <td className="p-2 font-medium text-green-600">₱{p.net_payout_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
              Create Batch from Selected
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm">
              <th className="p-4 font-medium">Batch No.</th>
              <th className="p-4 font-medium">Date Created</th>
              <th className="p-4 font-medium">Payout Count</th>
              <th className="p-4 font-medium">Total Net</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {batches.map(batch => (
              <tr key={batch.id} className="hover:bg-gray-50">
                <td className="p-4">{batch.batch_number}</td>
                <td className="p-4">{new Date(batch.created_at).toLocaleDateString()}</td>
                <td className="p-4">{batch.payout_count}</td>
                <td className="p-4 font-medium text-green-600">₱{batch.total_net_payout.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${batch.batch_status.includes('Processed') ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                    {batch.batch_status}
                  </span>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No batch records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
