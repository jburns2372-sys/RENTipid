import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function RenterBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'Renter' && user?.role !== 'Individual Provider' && user?.role !== 'Business Provider' && user?.role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { include: { photos: { where: { is_cover: true } } } },
      provider: { include: { businessProfile: true } },
      statusHistory: { orderBy: { created_at: 'desc' } },
      rentalAgreement: true,
      inspectionReports: true,
      damageClaims: true
    }
  });

  if (!booking || booking.renter_id !== user.id) {
    notFound();
  }

  const providerName = booking.provider.account_type === 'Business' 
    ? booking.provider.businessProfile?.business_name 
    : booking.provider.full_name;

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard/renter/bookings" className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to My Bookings
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Booking #{booking.id.slice(-8).toUpperCase()}</h1>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold
              ${booking.status === 'Pending Provider Approval' ? 'bg-yellow-100 text-yellow-800' :
                booking.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                booking.status === 'Confirmed' || booking.status === 'Ongoing' || booking.status === 'Completed' || booking.status === 'Returned' ? 'bg-green-100 text-green-800' :
                booking.status === 'Pending Payment' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
              {booking.status}
            </span>
            <span className="text-gray-500 text-sm font-medium">Payment: {booking.payment_status}</span>
          </div>
        </div>

        {/* Phase 4 Cancel Action (only if pending or approved) */}
        {(booking.status === 'Pending Provider Approval' || booking.status === 'Approved' || booking.status === 'Pending Payment') && (
           <form action={`/api/bookings/${booking.id}/status`} method="POST">
             <input type="hidden" name="action" value="CANCEL_BY_RENTER" />
             <button type="submit" className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded font-bold hover:bg-red-100 transition text-sm">
               Cancel Booking Request
             </button>
           </form>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Col: Listing & Costs */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Listing Details</h2>
            <div className="flex items-start space-x-4">
              <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {booking.listing.photos?.[0] && <img src={booking.listing.photos[0].file_path} alt="cover" className="w-full h-full object-cover" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{booking.listing.title}</h3>
                <p className="text-sm text-gray-500 mb-2">Provider: {providerName}</p>
                <Link href={`/listing/${booking.listing_id}`} className="text-blue-600 text-sm font-medium hover:underline">View Public Listing</Link>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Booking Information</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Start Date</p>
                <p className="font-bold">{booking.start_date.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">End Date</p>
                <p className="font-bold">{booking.end_date.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Duration</p>
                <p className="font-bold">{booking.rental_duration} {booking.rental_duration_unit}(s)</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Receive Option</p>
                <p className="font-bold">{booking.pickup_option}</p>
                {booking.delivery_requested && <p className="text-xs text-gray-500 mt-1 truncate">{booking.delivery_address}</p>}
              </div>
            </div>

            {booking.renter_notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-500 mb-1 text-sm">Your Notes</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{booking.renter_notes}</p>
              </div>
            )}
            {booking.provider_notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-500 mb-1 text-sm">Provider Notes</p>
                <p className="text-sm bg-blue-50 p-3 rounded">{booking.provider_notes}</p>
              </div>
            )}
            {booking.status === 'Rejected' && booking.rejection_reason && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-red-600 font-bold mb-1 text-sm">Rejection Reason</p>
                <p className="text-sm bg-red-50 p-3 rounded text-red-800">{booking.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Payment & Status History */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Payment Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Rental</span>
                <span className="font-medium">₱{booking.base_rental_amount.toLocaleString()}</span>
              </div>
              {booking.deposit_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-medium">₱{booking.deposit_amount.toLocaleString()}</span>
                </div>
              )}
              {booking.delivery_fee && booking.delivery_fee > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">₱{booking.delivery_fee.toLocaleString()}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t pt-3 font-bold text-lg">
                <span>Estimated Total</span>
                <span>₱{booking.estimated_total_amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons for Renter */}
            {booking.status === 'Approved' && booking.payment_status === 'Pending Payment' ? (
              booking.rentalAgreement && !booking.rentalAgreement.accepted_by_renter ? (
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-bold text-red-600 mb-2">Action Required: Sign Agreement</h3>
                  <div className="bg-gray-50 border p-4 rounded text-xs whitespace-pre-wrap h-40 overflow-y-auto mb-4">
                    {booking.rentalAgreement.agreement_text}
                  </div>
                  <form action={`/api/bookings/${booking.id}/agreement`} method="POST">
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">
                      I Agree & Accept Terms
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-6 border-t pt-4">
                  <Link href={`/checkout/${booking.id}`} className="block w-full text-center bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700">
                    Proceed to Checkout
                  </Link>
                </div>
              )
            ) : booking.status === 'Confirmed' || booking.status === 'Ongoing' || booking.status === 'Returned' || booking.status === 'Completed' || booking.status === 'Disputed' ? (
              <div className="mt-6 pt-4 border-t space-y-3">
                <div className="bg-green-50 p-3 rounded text-xs text-green-800 font-medium mb-4">
                  Payment Completed. Platform holds deposit in escrow until return.
                </div>
                
                {booking.inspectionReports.some(i => i.inspection_type === 'Pre-Rental') && (
                  <Link href={`/dashboard/renter/bookings/${booking.id}/inspection`} className={`block text-center w-full font-bold py-2 rounded transition ${booking.inspectionReports.find(i => i.inspection_type === 'Pre-Rental')?.status === 'Submitted by Provider' ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    {booking.inspectionReports.find(i => i.inspection_type === 'Pre-Rental')?.status === 'Submitted by Provider' 
                      ? 'Action Required: Review Inspection' 
                      : 'View Pre-Rental Inspection'}
                  </Link>
                )}

                {booking.inspectionReports.some(i => i.inspection_type === 'Post-Rental') && (
                  <Link href={`/dashboard/renter/bookings/${booking.id}/return-inspection`} className="block text-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded transition">
                    View Post-Rental Inspection
                  </Link>
                )}

                {booking.damageClaims.length > 0 && (
                  <Link href={`/dashboard/renter/bookings/${booking.id}/claims`} className="block text-center w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition">
                    Action Required: Respond to Damage Claim
                  </Link>
                )}
              </div>
            ) : null}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Timeline</h2>
            <div className="space-y-4">
              {booking.statusHistory.map((history, idx) => (
                <div key={history.id} className="relative pl-4 border-l-2 border-gray-200">
                  <span className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <p className="font-bold text-sm text-gray-900">{history.new_status}</p>
                  <p className="text-xs text-gray-500">{new Date(history.created_at).toLocaleString()}</p>
                  {history.notes && <p className="text-xs text-gray-600 mt-1">{history.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      <AIAssistantButton context="Renter Booking Detail" />
    </div>
  );
}
