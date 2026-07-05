import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function RenterInspectionReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'Renter' && user?.role !== 'Individual Provider' && user?.role !== 'Business Provider') {
    redirect('/unauthorized');
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      inspectionReports: {
        where: { inspection_type: 'Pre-Rental' },
        include: { photos: true }
      }
    }
  });

  if (!booking || booking.renter_id !== user.id) {
    notFound();
  }

  const report = booking.inspectionReports[0];

  if (!report) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">No Inspection Found</h1>
        <p className="text-gray-600 mb-6">The provider has not submitted the pre-rental inspection yet.</p>
        <Link href={`/dashboard/renter/bookings/${id}`} className="text-blue-600 hover:underline">Back to Booking</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/renter/bookings/${booking.id}`} className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Booking
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Review Pre-Rental Inspection</h1>
          <p className="text-gray-500">Please review the condition reported by the provider before accepting turnover.</p>
        </div>
        <AIAssistantButton context="Inspection Review Bot" />
      </div>

      {report.status === 'Confirmed by Renter' && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mb-8 font-bold flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span>You have already confirmed this inspection.</span>
        </div>
      )}

      {report.status === 'Requires Review' && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-8 font-bold flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>You flagged a discrepancy. Waiting for provider or admin resolution.</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Condition Details</h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-gray-500 mb-1">Condition Summary</span>
                <p className="font-medium bg-gray-50 p-2 rounded">{report.condition_summary}</p>
              </div>
              {report.accessories_checked && (
                <div>
                  <span className="block text-gray-500 mb-1">Accessories Included</span>
                  <p className="font-medium">{report.accessories_checked}</p>
                </div>
              )}
              {report.odometer_reading && (
                <div>
                  <span className="block text-gray-500 mb-1">Meter / Odometer</span>
                  <p className="font-medium">{report.odometer_reading}</p>
                </div>
              )}
              {report.provider_notes && (
                <div>
                  <span className="block text-gray-500 mb-1">Provider Notes</span>
                  <p className="font-medium italic text-gray-700">{report.provider_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Inspection Photos</h2>
            <div className="grid grid-cols-2 gap-2">
              {report.photos.map(p => (
                <div key={p.id} className="relative group">
                  <img src={p.file_path} alt={p.photo_category} className="w-full h-24 object-cover rounded border" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-[10px] p-1 text-center truncate">
                    {p.photo_category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {report.status === 'Submitted by Provider' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Your Confirmation</h2>
          
          <form action={`/api/bookings/${booking.id}/inspection/renter-confirm`} method="POST" className="space-y-4">
            <label className="block text-sm font-bold text-gray-700">Any notes before accepting? (Optional)</label>
            <textarea name="renter_notes" placeholder="Everything looks good..." className="w-full border p-3 rounded text-sm h-20"></textarea>
            
            <div className="flex space-x-4">
              <button type="submit" name="action" value="CONFIRM" className="flex-1 bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition">
                Confirm Received Condition
              </button>
              <button type="submit" name="action" value="FLAG" className="flex-1 bg-white border-2 border-red-200 text-red-600 font-bold py-3 rounded hover:bg-red-50 transition">
                Flag Discrepancy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
