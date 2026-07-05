import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from 'next/link';

export default async function RenterDashboard() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Renter Dashboard</h1>
        {user?.status === 'Pending' && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            Pending Verification
          </span>
        )}
        {user?.status === 'Verified' && (
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            Verified
          </span>
        )}
      </div>
      
      <p className="text-gray-600 mb-8 text-lg">Welcome back, {user?.name || 'Renter'}!</p>

      {user?.status === 'Pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Complete your verification</h3>
            <p className="text-blue-700 text-sm">You need to submit your ID to book rentals securely.</p>
          </div>
          <Link href="/dashboard/kyc" className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition whitespace-nowrap">
            Verify Account
          </Link>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">My Bookings</h2>
          <div className="h-32 flex items-center justify-center bg-gray-50 rounded border border-dashed">
            <span className="text-gray-400 text-sm">Booking list pending Phase 3</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">My Payments</h2>
          <div className="h-32 flex items-center justify-center bg-gray-50 rounded border border-dashed">
            <span className="text-gray-400 text-sm">Payment list pending Phase 3</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">My Reviews</h2>
          <div className="h-32 flex items-center justify-center bg-gray-50 rounded border border-dashed">
            <span className="text-gray-400 text-sm">Review list pending Phase 3</span>
          </div>
        </div>
      </div>
      
      <AIAssistantButton context="Renter Dashboard" />
    </div>
  );
}
