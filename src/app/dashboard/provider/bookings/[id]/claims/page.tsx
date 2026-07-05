import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function ProviderClaimStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'Individual Provider' && user?.role !== 'Business Provider') {
    redirect('/unauthorized');
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      damageClaims: { include: { photos: true, disputes: true } }
    }
  });

  if (!booking || booking.provider_id !== user.id) {
    notFound();
  }

  const claim = booking.damageClaims[0];

  if (!claim) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">No Claims Found</h1>
        <p className="text-gray-600 mb-6">You have not filed any damage claims for this booking.</p>
        <Link href={`/dashboard/provider/bookings/${id}`} className="text-blue-600 hover:underline">Back to Booking</Link>
      </div>
    );
  }

  const dispute = claim.disputes[0];

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/provider/bookings/${booking.id}`} className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Booking
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-red-600">Damage Claim Status</h1>
          <p className="text-gray-500">Track the resolution of your claim against the renter's deposit.</p>
        </div>
        <AIAssistantButton context="Claim Status Tracker" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">Status Tracking</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="px-4 py-2 rounded-full font-bold text-sm bg-gray-100">Claim Created</div>
          <div className="text-gray-300">&rarr;</div>
          
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${claim.renter_response ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse'}`}>
            {claim.renter_response ? 'Renter Responded' : 'Waiting for Renter'}
          </div>
          <div className="text-gray-300">&rarr;</div>

          <div className={`px-4 py-2 rounded-full font-bold text-sm ${claim.claim_status === 'Approved' ? 'bg-green-100 text-green-800 border border-green-200' : claim.claim_status === 'Under Admin Review' ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' : 'bg-gray-100'}`}>
            {claim.claim_status === 'Approved' ? 'Approved' : claim.claim_status === 'Under Admin Review' ? 'Under Admin Review' : 'Final Decision'}
          </div>
        </div>

        {dispute && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
            <p className="font-bold">Dispute Opened</p>
            <p className="text-sm mt-1">The renter rejected your claim. A platform admin is currently reviewing the evidence from both parties to make a final decision.</p>
          </div>
        )}
        
        {claim.claim_status === 'Approved' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded">
            <p className="font-bold">Claim Approved</p>
            <p className="text-sm mt-1">Deduction amount: ₱{claim.approved_deduction_amount?.toLocaleString()}</p>
            <p className="text-sm mt-1">This amount will be added to your ledger payout.</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Your Claim ({claim.claim_number})</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-bold">Type</span>
                <span className="font-bold">{claim.claim_type}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-red-600 font-bold">Requested Deduction</span>
                <span className="text-red-600 font-bold text-lg">₱{claim.requested_deduction_amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-gray-500 mb-1 font-bold">Your Description</span>
                <p className="font-medium bg-gray-50 p-3 rounded border">{claim.claim_description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Renter's Response</h2>
            {claim.renter_response ? (
              <p className="text-sm p-3 bg-gray-50 rounded border">{claim.renter_response}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">The renter has not responded yet. They have 48 hours to reply before automatic admin escalation.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
