import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function AdminDisputeReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'Admin' && user?.role !== 'Super Admin' && user?.role !== 'Compliance Officer') {
    redirect('/unauthorized');
  }

  const dispute = await prisma.disputeCase.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          listing: true,
          renter: true,
          provider: true,
          inspectionReports: { include: { photos: true } }
        }
      },
      damage_claim: { include: { photos: true } }
    }
  });

  if (!dispute) {
    notFound();
  }

  const claim = dispute.damage_claim;
  const preRental = dispute.booking.inspectionReports.find(i => i.inspection_type === 'Pre-Rental');
  const postRental = dispute.booking.inspectionReports.find(i => i.inspection_type === 'Post-Rental');

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/dashboard/admin/disputes" className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Disputes
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Dispute Review</h1>
          <p className="text-gray-500">Case ID: {dispute.id}</p>
        </div>
        <AIAssistantButton context="Admin Dispute Review Bot" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Col: Evidence */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Statements</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-bold text-gray-500 mb-1">Provider's Claim</span>
                <p className="bg-red-50 p-3 rounded text-sm border">{dispute.provider_statement || claim?.claim_description}</p>
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-500 mb-1">Renter's Response</span>
                <p className="bg-blue-50 p-3 rounded text-sm border">{dispute.renter_statement}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Claim Evidence</h2>
            {claim?.photos && claim.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
              <p className="text-sm text-gray-500 italic">No specific claim evidence uploaded.</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Pre-Rental Inspection</h2>
              {preRental ? (
                <div className="grid grid-cols-2 gap-2">
                  {preRental.photos.map(p => (
                    <div key={p.id} className="relative">
                      <img src={p.file_path} alt={p.photo_category} className="w-full h-24 object-cover rounded border" />
                      <div className="absolute bottom-0 w-full bg-black bg-opacity-60 text-white text-[8px] p-1 truncate">{p.photo_category}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">Not found</p>}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Post-Rental Inspection</h2>
              {postRental ? (
                <div className="grid grid-cols-2 gap-2">
                  {postRental.photos.map(p => (
                    <div key={p.id} className="relative">
                      <img src={p.file_path} alt={p.photo_category} className="w-full h-24 object-cover rounded border" />
                      <div className="absolute bottom-0 w-full bg-black bg-opacity-60 text-white text-[8px] p-1 truncate">{p.photo_category}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">Not found</p>}
            </div>
          </div>

        </div>

        {/* Right Col: Admin Action */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Financials</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-bold">Total Deposit Held</span>
                <span className="font-bold">₱{claim?.deposit_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-red-600 font-bold">Requested Deduction</span>
                <span className="text-red-600 font-bold text-lg">₱{claim?.requested_deduction_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {dispute.dispute_status !== 'Resolved' ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 text-indigo-600">Final Decision</h2>
              <form action={`/api/admin/disputes/${dispute.id}/resolve`} method="POST" className="space-y-4 text-sm">
                
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Admin Notes (Internal)</label>
                  <textarea name="admin_notes" required placeholder="Justify the decision..." className="w-full border p-2 rounded h-20"></textarea>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <p className="font-bold text-gray-700">Approve Deduction?</p>
                  
                  {/* Approve Full */}
                  <div className="flex space-x-2">
                    <button type="submit" name="action" value="APPROVE_FULL" className="flex-1 bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">
                      Approve Full (₱{claim?.requested_deduction_amount.toLocaleString()})
                    </button>
                  </div>

                  {/* Approve Partial */}
                  <div className="p-3 bg-gray-50 border rounded space-y-2">
                    <label className="block text-xs font-bold text-gray-700">Partial Amount (₱)</label>
                    <input type="number" step="0.01" name="partial_amount" placeholder="e.g. 500" className="w-full border p-2 rounded" />
                    <button type="submit" name="action" value="APPROVE_PARTIAL" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
                      Approve Partial
                    </button>
                  </div>

                  {/* Reject Completely */}
                  <div className="flex space-x-2">
                    <button type="submit" name="action" value="REJECT" className="flex-1 bg-red-600 text-white font-bold py-2 rounded hover:bg-red-700">
                      Reject Claim (Refund Renter)
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h2 className="text-xl font-bold text-green-800 mb-2">Dispute Resolved</h2>
              <p className="text-sm font-medium text-green-700">Decision: {dispute.final_decision}</p>
              {dispute.admin_notes && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-xs text-green-600 font-bold mb-1">Admin Notes:</p>
                  <p className="text-sm text-green-800">{dispute.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
