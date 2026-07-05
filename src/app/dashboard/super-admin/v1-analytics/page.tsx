import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { BarChart3, Users, DollarSign, Target } from 'lucide-react';

export default async function V1AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Fetch production metrics (excluding test data if required, but showing totals here)
  const users = await prisma.user.count({ where: { is_test_data: false } });
  const listings = await prisma.listing.count({ where: { is_test_data: false } });
  const bookings = await prisma.booking.count({ where: { is_test_data: false } });
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-600" /> V1 Post-Launch Analytics
          </h1>
          <p className="text-gray-500 mt-1">Production metrics excluding beta/test data.</p>
        </div>
        <select className="border rounded-lg px-4 py-2 text-sm bg-white shadow-sm outline-none">
          <option>Today</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5 shadow-sm border-blue-100">
          <div className="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
            <Users size={16} className="text-blue-600" /> Real Verified Users
          </div>
          <div className="text-3xl font-bold text-gray-900">{users}</div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm border-blue-100">
          <div className="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
            <Target size={16} className="text-blue-600" /> Published Listings
          </div>
          <div className="text-3xl font-bold text-gray-900">{listings}</div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm border-blue-100">
          <div className="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" /> Real Bookings
          </div>
          <div className="text-3xl font-bold text-gray-900">{bookings}</div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm border-emerald-100">
          <div className="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" /> Escrow Processed (Mock)
          </div>
          <div className="text-3xl font-bold text-gray-900">₱0.00</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold text-gray-800 mb-4">Traffic & Conversion</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <span className="text-gray-400">Chart rendering placeholder (Integration required for live traffic)</span>
        </div>
      </div>
    </div>
  );
}
