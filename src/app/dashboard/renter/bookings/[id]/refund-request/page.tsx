import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export default async function RenterRefundRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== 'Renter') {
    redirect('/unauthorized');
  }

  const booking = await prisma.booking.findUnique({
    where: { id, renter_id: user.id },
    include: {
      listing: true,
      payment: true,
      refundRequests: true
    }
  });

  if (!booking) {
    redirect('/dashboard/renter/bookings');
  }

  // Determine if eligible for refund
  const isEligible = ['Cancelled by Provider', 'Rejected'].includes(booking.status) || 
                     (booking.payment_status === 'Paid' && booking.status === 'Cancelled by Renter');
  
  const existingRefund = booking.refundRequests[0];

  async function submitRefund(formData: FormData) {
    'use server';
    const reason = formData.get('reason') as string;
    const amount = formData.get('amount') as string;
    
    await prisma.refundRequest.create({
      data: {
        refund_number: `RFD-${Date.now()}`,
        booking_id: booking!.id,
        renter_id: user.id,
        provider_id: booking!.provider_id,
        listing_id: booking!.listing_id,
        requested_by: user.id,
        refund_reason: reason,
        requested_amount: parseFloat(amount),
        refund_status: 'Submitted'
      }
    });

    revalidatePath(`/dashboard/renter/bookings/${id}/refund-request`);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href={`/dashboard/renter/bookings/${id}`} className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
        <ArrowLeft size={16} /> Back to Booking
      </Link>

      <h1 className="text-2xl font-bold">Request Refund</h1>
      
      {existingRefund ? (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <h2 className="font-semibold text-blue-800 text-lg">Refund Request Submitted</h2>
          <p className="text-blue-700 mt-2">Your refund request for ₱{existingRefund.requested_amount.toFixed(2)} is currently: <strong>{existingRefund.refund_status}</strong>.</p>
          <p className="text-sm text-blue-600 mt-4">Refund Number: {existingRefund.refund_number}</p>
        </div>
      ) : isEligible ? (
        <form action={submitRefund} className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Booking Details</h3>
            <p className="text-gray-600 text-sm">Listing: {booking.listing.title}</p>
            <p className="text-gray-600 text-sm">Total Paid: ₱{booking.estimated_total_amount.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Requested Amount (₱)</label>
            <input type="number" name="amount" required max={booking.estimated_total_amount} defaultValue={booking.estimated_total_amount} step="0.01" className="w-full border p-2 rounded-lg" />
            <p className="text-xs text-gray-500 mt-1">Cannot exceed total paid amount.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason for Refund</label>
            <textarea name="reason" required rows={3} className="w-full border p-2 rounded-lg" placeholder="Please explain why you are requesting a refund..."></textarea>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
            Submit Request to Finance
          </button>
        </form>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0" />
          <div>
            <h2 className="font-semibold text-amber-800">Not Eligible for Automated Refund</h2>
            <p className="text-amber-700 text-sm mt-1">This booking is not currently eligible for an automated refund request. If you believe this is an error, please open a dispute or contact support.</p>
          </div>
        </div>
      )}
    </div>
  );
}
