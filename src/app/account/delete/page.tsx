import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { submitAccountDeletion } from './actions';

const prisma = new PrismaClient();

export default async function AccountDeletePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Check existing active bookings/disputes
  const activeBookings = await prisma.booking.count({
    where: {
      OR: [ { renter_id: userId }, { provider_id: userId } ],
      status: { notIn: ['Completed', 'Cancelled by Renter', 'Cancelled by Provider', 'Rejected', 'Expired'] }
    }
  });

  const existingRequest = await prisma.accountDeletionRequest.findFirst({
    where: { user_id: userId },
    orderBy: { requested_at: 'desc' }
  });

  if (existingRequest && existingRequest.status !== 'Rejected') {
    return (
      <div className="container mx-auto py-20 px-4 max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-4">Request Received</h1>
        <p className="text-gray-600 mb-8">
          Your account deletion request is currently: <strong>{existingRequest.status}</strong>. 
          Our team is reviewing your account to ensure all transactions, deposits, and active rentals are safely concluded before permanent deletion.
        </p>
        <Link href="/dashboard/profile" className="text-blue-600 font-medium hover:underline">
          Return to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/profile" className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Profile
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-red-600">Delete Account</h1>

      <div className="bg-red-50 border border-red-200 p-6 rounded-xl mb-8">
        <h2 className="text-red-800 font-bold mb-2">Warning: This action is permanent.</h2>
        <p className="text-red-700 text-sm mb-4">
          Requesting account deletion will permanently remove your personal data, profile, and listings. 
          To prevent fraud and protect platform users, deletion requests are manually reviewed if you have a transaction history.
        </p>

        {activeBookings > 0 && (
          <div className="bg-white p-3 rounded border border-red-300 text-red-800 font-semibold text-sm mb-4">
            You currently have {activeBookings} active booking(s). Your account cannot be deleted until all rentals, payments, and disputes are finalized. You can submit the request now, but it will be placed on hold.
          </div>
        )}

        <form action={submitAccountDeletion} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Deletion</label>
            <textarea 
              name="reason" 
              required
              rows={3} 
              className="w-full border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" 
              placeholder="Please let us know why you're leaving..."
            ></textarea>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="confirm" required className="w-4 h-4 text-red-600" />
            <label htmlFor="confirm" className="text-sm text-gray-700">I understand that this action cannot be undone.</label>
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition">
            Submit Deletion Request
          </button>
        </form>
      </div>
    </div>
  );
}
