import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import AdminDocumentActions from '@/components/listings/AdminDocumentActions';
import AdminListingActions from '@/components/listings/AdminListingActions';

const prisma = new PrismaClient();

export default async function AdminListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const adminRole = user?.role;

  if (adminRole !== 'Admin' && adminRole !== 'Compliance Admin' && adminRole !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { 
      provider: true,
      category: true, 
      photos: { orderBy: { display_order: 'asc' } },
      documents: { orderBy: { uploaded_at: 'desc' } }
    }
  });

  if (!listing) {
    notFound();
  }

  const isHighRisk = listing.category.risk_level === 'High' || listing.category.risk_level === 'Regulated';
  
  // Validation for "Can Publish"
  const isProviderVerified = listing.provider.status === 'Verified';
  const hasPhotos = listing.photos.length > 0;
  // Let's assume if it's High Risk, it requires at least 1 document and all documents must be approved
  const hasDocuments = listing.documents.length > 0;
  const allDocsApproved = listing.documents.length > 0 && listing.documents.every(d => d.status === 'Approved');

  const canPublish = isProviderVerified && hasPhotos && (!isHighRisk || (isHighRisk && hasDocuments && allDocsApproved));

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Review Listing: {listing.title}</h1>
          <div className="flex items-center space-x-3 text-sm">
            <span className={`px-2 py-1 rounded-full font-semibold
                ${listing.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                  listing.status === 'Published' ? 'bg-green-100 text-green-800' : 
                  listing.status === 'Under Review' || listing.status === 'Submitted for Review' ? 'bg-blue-100 text-blue-800' : 
                  listing.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'}`}>
                {listing.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Main Review Column */}
        <div className="md:col-span-2 space-y-8">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Photos ({listing.photos.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {listing.photos.map(photo => (
                <div key={photo.id} className="relative aspect-video rounded border overflow-hidden bg-gray-100">
                  <img src={photo.file_path} alt="Listing Photo" className="w-full h-full object-cover" />
                  {photo.is_cover && <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">COVER</span>}
                </div>
              ))}
              {listing.photos.length === 0 && <span className="text-red-500 font-medium">Missing Photos!</span>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold">Uploaded Documents</h2>
               {isHighRisk && <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded uppercase">Requires Document Verification</span>}
            </div>
            
            {listing.documents.length > 0 ? (
              <div className="space-y-4">
                {listing.documents.map(doc => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded bg-gray-50">
                    <div className="mb-2 sm:mb-0">
                      <p className="font-bold text-gray-900">{doc.document_type}</p>
                      <p className="text-xs text-gray-500">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                      <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline mt-1 inline-block">
                        View Secure Document
                      </a>
                    </div>
                    <AdminDocumentActions docId={doc.id} currentStatus={doc.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No documents uploaded.</p>
            )}
          </div>

        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <AdminListingActions listingId={listing.id} currentStatus={listing.status} canPublish={canPublish} />

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Provider Verification</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{listing.provider.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-bold ${isProviderVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {listing.provider.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Listing Details</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-right">{listing.category.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Risk Level</span>
                <span className={`font-bold uppercase ${isHighRisk ? 'text-orange-600' : 'text-green-600'}`}>
                  {listing.category.risk_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Daily Rate</span>
                <span className="font-medium text-right">₱{listing.daily_rate?.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
      <AIAssistantButton context="Admin Listing Review Detail" />
    </div>
  );
}
