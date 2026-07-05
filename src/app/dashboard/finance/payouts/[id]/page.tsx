import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export default async function FinancePayoutDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const role = user?.role;

  if (role !== 'Finance Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const payout = await prisma.providerPayout.findUnique({
    where: { id },
    include: { booking: true }
  });

  if (!payout) redirect('/dashboard/finance/payouts');

  async function updateStatus(formData: FormData) {
    'use server';
    const newStatus = formData.get('status') as string;
    const notes = formData.get('finance_notes') as string;
    const ref = formData.get('manual_bank_reference') as string;
    
    await prisma.providerPayout.update({
      where: { id },
      data: {
        payout_status: newStatus,
        finance_notes: notes,
        manual_bank_reference: ref,
        reviewed_by: user.id,
        reviewed_at: new Date(),
        ...(newStatus.includes('Approved') ? { approved_by: user.id, approved_at: new Date() } : {}),
        ...(newStatus.includes('Processed') ? { marked_processed_by: user.id, processed_at: new Date() } : {})
      }
    });

    revalidatePath(`/dashboard/finance/payouts/${id}`);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href="/dashboard/finance/payouts" className="text-blue-600 hover:underline flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Payouts
      </Link>

      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Payout {payout.payout_number}</h1>
            <p className="text-gray-500 mt-1">Status: <span className="font-semibold text-blue-600">{payout.payout_status}</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Net Payout</p>
            <p className="text-2xl font-bold text-green-600">₱{payout.net_payout_amount.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Booking ID</p>
            <Link href={`/dashboard/admin/bookings/${payout.booking_id}`} className="font-medium text-blue-600 hover:underline">{payout.booking_id}</Link>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Provider ID</p>
            <p className="font-medium">{payout.provider_id}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Gross Rental</p>
            <p className="font-medium">₱{payout.gross_rental_amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Platform Commission</p>
            <p className="font-medium text-red-600">-₱{payout.platform_commission.toFixed(2)}</p>
          </div>
        </div>

        <form action={updateStatus} className="border-t pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Finance Action</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Update Status</label>
            <select name="status" defaultValue={payout.payout_status} className="w-full border p-2 rounded-lg">
              <option value="Ready for Finance Review">Ready for Finance Review</option>
              <option value="Under Finance Review">Under Finance Review</option>
              <option value="Approved for Manual Payout">Approved for Manual Payout</option>
              <option value="Rejected">Rejected</option>
              <option value="Processed Manual Placeholder">Processed Manual Placeholder</option>
              <option value="Escalated to Super Admin">Escalated to Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Manual Bank Reference</label>
            <input type="text" name="manual_bank_reference" defaultValue={payout.manual_bank_reference || ''} className="w-full border p-2 rounded-lg" placeholder="Enter bank reference if processed..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Finance Notes (Internal)</label>
            <textarea name="finance_notes" defaultValue={payout.finance_notes || ''} rows={3} className="w-full border p-2 rounded-lg" placeholder="Notes on this decision..."></textarea>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
            Save Status & Notes
          </button>
        </form>
      </div>
    </div>
  );
}
