import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function ProviderBookingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'Individual Provider' && user?.role !== 'Business Provider') {
    redirect('/unauthorized');
  }

  const bookings = await prisma.booking.findMany({
    where: { provider_id: user.id },
    include: {
      listing: {
        include: { photos: { where: { is_cover: true } } }
      },
      renter: {
        include: { profile: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Booking Requests</h1>
        <AIAssistantButton context="Provider Bookings Dashboard" />
      </div>

      {bookings.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="p-4 font-semibold">Listing</th>
                <th className="p-4 font-semibold">Renter</th>
                <th className="p-4 font-semibold">Dates</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => {
                const isPending = booking.status === 'Pending Provider Approval';
                
                return (
                  <tr key={booking.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          {booking.listing.photos?.[0] ? (
                            <img src={booking.listing.photos[0].file_path} alt="cover" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-gray-400 flex items-center justify-center h-full">No Img</span>
                          )}
                        </div>
                        <span className="font-bold text-gray-900 line-clamp-2">{booking.listing.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{booking.renter.full_name}</div>
                      <div className="text-xs text-green-600 font-bold">{booking.renter.profile?.verification_status}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div>{booking.start_date.toLocaleDateString()}</div>
                      <div className="text-xs">to {booking.end_date.toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900">₱{booking.estimated_total_amount.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500">{booking.payment_status}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                        ${isPending ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm' :
                          booking.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'Confirmed' || booking.status === 'Ongoing' || booking.status === 'Completed' || booking.status === 'Returned' ? 'bg-green-100 text-green-800' :
                          booking.status === 'Pending Payment' ? 'bg-orange-100 text-orange-800' :
                          booking.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/dashboard/provider/bookings/${booking.id}`} className="text-blue-600 font-semibold hover:underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed text-gray-500">
          <p className="text-lg">You do not have any booking requests yet.</p>
        </div>
      )}
    </div>
  );
}
