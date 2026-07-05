import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function ProviderListingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.status !== 'Verified') {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl text-center">
        <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-xl">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">Account Verification Required</h2>
          <p className="text-yellow-700 mb-6">You must complete your provider verification before you can create and manage listings.</p>
          <Link href="/dashboard/kyc" className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition">
            Verify Account Now
          </Link>
        </div>
      </div>
    );
  }

  const listings = await prisma.listing.findMany({
    where: { provider_id: user.id },
    include: { category: true, photos: { where: { is_cover: true } } },
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <Link href="/dashboard/provider/listings/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          Create New Listing
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="p-4 font-medium">Listing</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Daily Rate</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(listing => (
                <tr key={listing.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded object-cover"></div>
                      <span className="font-medium text-gray-900">{listing.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{listing.category.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${listing.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                        listing.status === 'Published' ? 'bg-green-100 text-green-800' : 
                        listing.status === 'Under Review' || listing.status === 'Submitted for Review' ? 'bg-blue-100 text-blue-800' : 
                        listing.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {listing.daily_rate ? `₱${listing.daily_rate.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="p-4 space-x-2">
                    <button className="text-blue-600 hover:underline font-medium">Edit</button>
                    {listing.status === 'Draft' && <button className="text-green-600 hover:underline font-medium">Submit</button>}
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    You haven't created any listings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AIAssistantButton context="Provider Listings Dashboard" />
    </div>
  );
}
