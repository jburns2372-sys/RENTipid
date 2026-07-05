import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import PhotoUploader from '@/components/listings/PhotoUploader';
import DocumentUploader from '@/components/listings/DocumentUploader';

const prisma = new PrismaClient();

export default async function ProviderListingManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.status !== 'Verified') {
    redirect('/dashboard/provider/listings');
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { 
      category: { include: { requirements: true } }, 
      photos: { orderBy: { display_order: 'asc' } },
      documents: { orderBy: { uploaded_at: 'desc' } }
    }
  });

  if (!listing || listing.provider_id !== user.id) {
    notFound();
  }

  const isDraftOrRejected = listing.status === 'Draft' || listing.status === 'Rejected';

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Listing: {listing.title}</h1>
          <div className="flex items-center space-x-3 text-sm">
            <span className={`px-2 py-1 rounded-full font-semibold
                ${listing.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                  listing.status === 'Published' ? 'bg-green-100 text-green-800' : 
                  listing.status === 'Under Review' || listing.status === 'Submitted for Review' ? 'bg-blue-100 text-blue-800' : 
                  listing.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'}`}>
                {listing.status}
            </span>
            {listing.status === 'Rejected' && (
              <span className="text-red-600 font-medium border border-red-200 bg-red-50 px-2 py-1 rounded">
                Reason: {listing.rejection_reason || 'See admin notes'}
              </span>
            )}
          </div>
        </div>
        
        {isDraftOrRejected && (
          <form action={`/api/listings/${listing.id}/submit`} method="POST">
             <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
               Submit for Review
             </button>
          </form>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          
          {/* Photo Management */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Listing Photos</h2>
            <p className="text-sm text-gray-500 mb-4">Upload up to 10 photos. Minimum 1 required.</p>
            <PhotoUploader listingId={listing.id} existingPhotos={listing.photos} isEditable={isDraftOrRejected} />
          </div>

          {/* Details Overview */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Listing Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-gray-900">{listing.category.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Daily Rate</span>
                <span className="font-medium text-gray-900">₱{listing.daily_rate?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Location</span>
                <span className="font-medium text-gray-900">{listing.location}, {listing.city}</span>
              </div>
            </div>
            {isDraftOrRejected && (
              <button disabled className="mt-4 text-blue-600 text-sm font-medium hover:underline">Edit Details (Disabled for Demo)</button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Document Management */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-2">Required Documents</h2>
            
            {listing.category.risk_level === 'High' || listing.category.risk_level === 'Regulated' ? (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded mb-4">
                <p className="text-xs text-orange-800 font-bold uppercase mb-1">{listing.category.risk_level} RISK CATEGORY</p>
                <p className="text-sm text-orange-700">This category strictly requires admin verification and compliance documents.</p>
              </div>
            ) : null}

            <DocumentUploader 
              listingId={listing.id} 
              existingDocuments={listing.documents} 
              isEditable={isDraftOrRejected} 
            />
          </div>
        </div>
      </div>
      
      <AIAssistantButton context="Listing Management Dashboard" />
    </div>
  );
}
