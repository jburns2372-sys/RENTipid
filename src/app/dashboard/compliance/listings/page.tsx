import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function AdminListingsReviewPage() {
  const pendingListings = await prisma.listing.findMany({
    where: { status: 'Submitted for Review' },
    include: { provider: true, category: true },
    orderBy: { updated_at: 'desc' }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Listing Review Queue</h1>
        <div className="flex space-x-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase">Compliance Team</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Pending Approvals ({pendingListings.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="p-4 font-medium">Listing Title</th>
                <th className="p-4 font-medium">Provider</th>
                <th className="p-4 font-medium">Category / Risk</th>
                <th className="p-4 font-medium">Submitted</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingListings.map(listing => (
                <tr key={listing.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{listing.title}</td>
                  <td className="p-4 text-gray-600">{listing.provider.full_name}</td>
                  <td className="p-4">
                    <div className="flex flex-col space-y-1 items-start">
                      <span className="text-gray-600">{listing.category.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                        ${listing.category.risk_level === 'Low' ? 'bg-green-100 text-green-800' : 
                          listing.category.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                          listing.category.risk_level === 'High' ? 'bg-orange-100 text-orange-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {listing.category.risk_level} RISK
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(listing.updated_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded font-medium transition">
                      Review Listing
                    </button>
                  </td>
                </tr>
              ))}
              {pendingListings.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <p className="text-lg mb-2">🎉 Queue is empty!</p>
                    <p className="text-sm">No listings currently require your review.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AIAssistantButton context="Admin Listing Review" />
    </div>
  );
}
