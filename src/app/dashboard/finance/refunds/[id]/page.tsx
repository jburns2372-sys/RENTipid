import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export default async function FinanceRefundDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const role = user?.role;

  if (role !== 'Finance Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const refund = await prisma.refundRequest.findUnique({
    where: { id },
    include: { booking: true }
  });

  if (!refund) redirect('/dashboard/finance/refunds');

  async function updateStatus(formData: FormData) {
    'use server';
    const newStatus = formData.get('status') as string;
    const notes = formData.get('finance_notes') as string;
    
    await prisma.refundRequest.update({
      where: { id },
      data: {
        refund_status: newStatus,
        finance_notes: notes,
        reviewed_by: user.id,
        reviewed_at: new Date(),
        ...(newStatus.includes('Approved') ? { approved_by: user.id, approved_at: new Date() } : {}),
        ...(newStatus.includes('Processed') ? { marked_processed_by: user.id, processed_at: new Date() } : {})
      }
    });

    revalidatePath(`/dashboard/finance/refunds/${id}`);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href="/dashboard/finance/refunds" className="text-blue-600 hover:underline flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Refunds
      </Link>

      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Refund Request {refund.refund_number}</h1>
            <p className="text-gray-500 mt-1">Status: <span className="font-semibold text-blue-600">{refund.refund_status}</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Requested Amount</p>
            <p className="text-2xl font-bold text-red-600">₱{refund.requested_amount.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Booking ID</p>
            <Link href={`/dashboard/admin/bookings/${refund.booking_id}`} className="font-medium text-blue-600 hover:underline">{refund.booking_id}</Link>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Renter ID</p>
            <p className="font-medium">{refund.renter_id}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500 mb-1">Reason for Refund</p>
            <p className="font-medium bg-gray-50 p-3 rounded border">{refund.refund_reason}</p>
          </div>
        </div>

        <form action={updateStatus} className="border-t pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Finance Action</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Update Status</label>
            <select name="status" defaultValue={refund.refund_status} className="w-full border p-2 rounded-lg">
              <option value="Under Finance Review">Under Finance Review</option>
              <option value="Approved for Manual Refund">Approved for Manual Refund</option>
              <option value="Rejected">Rejected</option>
              <option value="Processed Manual Placeholder">Processed Manual Placeholder</option>
              <option value="Escalated to Super Admin">Escalated to Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Finance Notes (Internal)</label>
            <textarea name="finance_notes" defaultValue={refund.finance_notes || ''} rows={3} className="w-full border p-2 rounded-lg" placeholder="Notes on this decision..."></textarea>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
            Save Status & Notes
          </button>
        </form>
      </div>
    </div>
  );
}
