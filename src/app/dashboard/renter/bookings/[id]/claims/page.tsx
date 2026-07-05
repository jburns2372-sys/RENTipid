import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function RenterClaimResponsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'Renter' && user?.role !== 'Individual Provider' && user?.role !== 'Business Provider') {
    redirect('/unauthorized');
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      damageClaims: { include: { photos: true } }
    }
  });

  if (!booking || booking.renter_id !== user.id) {
    notFound();
  }

  const claim = booking.damageClaims[0];

  if (!claim) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">No Claims Found</h1>
        <p className="text-gray-600 mb-6">There are no damage claims for this booking.</p>
        <Link href={`/dashboard/renter/bookings/${id}`} className="text-blue-600 hover:underline">Back to Booking</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/renter/bookings/${booking.id}`} className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Booking
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-red-600">Damage Claim against Deposit</h1>
          <p className="text-gray-500">The provider has requested a deduction from your security deposit.</p>
        </div>
        <AIAssistantButton context="Renter Response Bot" />
      </div>

      {claim.claim_status === 'Under Admin Review' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-8 font-bold flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>You have submitted your response. The claim is now being reviewed by a platform admin.</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Claim Details ({claim.claim_number})</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-bold">Type</span>
                <span className="font-bold">{claim.claim_type}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-bold">Total Deposit Held</span>
                <span className="font-bold">₱{claim.deposit_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-red-600 font-bold">Requested Deduction</span>
                <span className="text-red-600 font-bold text-lg">₱{claim.requested_deduction_amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-gray-500 mb-1 font-bold">Provider's Description</span>
                <p className="font-medium bg-red-50 p-3 rounded border border-red-100">{claim.claim_description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Provider's Evidence</h2>
            {claim.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {claim.photos.map(p => (
                  <div key={p.id} className="relative group">
                    <img src={p.file_path} alt="Evidence" className="w-full h-32 object-cover rounded border" />
                    {p.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-[10px] p-1 text-center truncate">
                        {p.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No additional photos uploaded. Admin will review the inspection photos.</p>
            )}
          </div>
        </div>
      </div>

      {claim.claim_status === 'Submitted' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Your Response</h2>
          <p className="text-sm text-gray-600 mb-6">If you reject this claim, a Dispute Case will automatically be opened and reviewed by an admin.</p>
          
          <form action={`/api/bookings/${booking.id}/claims/respond`} method="POST" className="space-y-4 text-sm">
            <label className="block font-bold text-gray-700">Provide your statement / counter-evidence summary *</label>
            <textarea name="renter_response" required placeholder="Explain your side. E.g. 'The scratch was already there during the pre-rental inspection...'" className="w-full border p-3 rounded h-24 mb-4"></textarea>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button type="submit" name="action" value="ACCEPT" className="flex-1 bg-white border-2 border-green-600 text-green-600 font-bold py-3 rounded hover:bg-green-50 transition">
                Accept Claim & Deduction
              </button>
              <button type="submit" name="action" value="REJECT" className="flex-1 bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition">
                Reject & Open Dispute
              </button>
            </div>
          </form>
        </div>
      )}

      {claim.renter_response && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Your Statement</h2>
          <p className="text-sm p-3 bg-gray-50 rounded border">{claim.renter_response}</p>
        </div>
      )}
    </div>
  );
}
