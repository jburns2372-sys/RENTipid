import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import BookingRequestForm from '@/components/bookings/BookingRequestForm';

const prisma = new PrismaClient();

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { provider: { include: { profile: true, businessProfile: true } }, category: true, photos: true }
  });

  // Only show published listings to the public
  if (!listing || listing.status !== 'Published') {
    notFound();
  }

  const providerName = listing.provider.account_type === 'Business' 
    ? listing.provider.businessProfile?.business_name 
    : listing.provider.full_name;

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-gray-200 rounded-xl h-96 overflow-hidden flex items-center justify-center relative">
             {listing.photos?.[0] ? (
               <img src={listing.photos[0].file_path} alt={listing.title} className="w-full h-full object-cover" />
             ) : (
               <span className="text-gray-400 font-medium">No Image Provided</span>
             )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded">{listing.category.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
            <p className="text-gray-500">{listing.location}, {listing.city}, {listing.province}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Rental Rules</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="bg-gray-50 p-4 rounded">
                <strong>Minimum Duration:</strong> {listing.min_duration ? `${listing.min_duration} days` : 'None'}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <strong>Security Deposit:</strong> {listing.security_deposit ? `₱${listing.security_deposit.toLocaleString()}` : 'None'}
              </div>
              <div className="bg-gray-50 p-4 rounded sm:col-span-2">
                <strong>Damage Policy:</strong> {listing.damage_policy || 'Standard marketplace policy applies.'}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <BookingRequestForm listing={listing} />

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
              {providerName?.[0] || 'P'}
            </div>
            <div>
              <p className="text-xs text-gray-500">Provider</p>
              <p className="font-bold text-gray-900">{providerName}</p>
              <div className="flex items-center mt-1">
                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Verified Provider</span>
              </div>
            </div>
          </div>
        </aside>

      </div>
      
      <AIAssistantButton context="Public Listing Page" />
    </div>
  );
}
