import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const adminRole = user?.role;

  if (adminRole !== 'Admin' && adminRole !== 'Compliance Admin' && adminRole !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const { status } = await searchParams;

  const whereClause: any = {};
  if (status && status !== 'All') {
    whereClause.status = status;
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      listing: { include: { category: true } },
      renter: true,
      provider: true
    },
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Booking Monitor</h1>
        <AIAssistantButton context="Admin Booking Monitor Dashboard" />
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Pending Provider Approval', 'Approved', 'Pending Payment', 'Confirmed', 'Ongoing', 'Returned', 'Completed', 'Cancelled by Renter', 'Cancelled by Provider', 'Rejected'].map(s => (
          <Link key={s} href={s === 'All' ? '/dashboard/admin/bookings' : `/dashboard/admin/bookings?status=${encodeURIComponent(s)}`}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
              ${(status === s || (!status && s === 'All')) ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            `}>
            {s}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Listing</th>
              <th className="p-4 font-semibold">Provider & Renter</th>
              <th className="p-4 font-semibold">Dates</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No bookings found for the selected filter.</td>
              </tr>
            ) : bookings.map(booking => (
              <tr key={booking.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-4 text-xs font-mono text-gray-500">{booking.id.slice(-8).toUpperCase()}</td>
                <td className="p-4">
                  <div className="font-bold text-gray-900">{booking.listing.title}</div>
                  <div className="text-[10px] bg-gray-200 inline-block px-1 rounded text-gray-700">{booking.listing.category.name}</div>
                </td>
                <td className="p-4 text-xs">
                  <div><span className="text-gray-500">P:</span> <span className="font-bold">{booking.provider.full_name}</span></div>
                  <div><span className="text-gray-500">R:</span> <span className="font-bold">{booking.renter.full_name}</span></div>
                </td>
                <td className="p-4 text-xs text-gray-600">
                  <div>{booking.start_date.toLocaleDateString()} to {booking.end_date.toLocaleDateString()}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold">₱{booking.estimated_total_amount.toLocaleString()}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                    ${booking.status === 'Pending Provider Approval' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      booking.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'Confirmed' || booking.status === 'Ongoing' || booking.status === 'Completed' || booking.status === 'Returned' ? 'bg-green-100 text-green-800' :
                      booking.status === 'Pending Payment' ? 'bg-orange-100 text-orange-800' :
                      booking.status === 'Rejected' || booking.status.includes('Cancelled') ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
