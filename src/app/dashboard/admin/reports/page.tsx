import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { BarChart3, Users, Building, Calendar, DollarSign, Download, TrendingUp } from 'lucide-react';

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Fetch quick metrics
  const totalUsers = await prisma.user.count();
  const verifiedUsers = await prisma.user.count({ where: { status: 'Verified' } });
  
  const totalListings = await prisma.listing.count();
  const activeListings = await prisma.listing.count({ where: { status: 'Published' } });
  
  const totalBookings = await prisma.booking.count();
  const completedBookings = await prisma.booking.count({ where: { status: 'Completed' } });

  const totalCampaigns = await prisma.marketingCampaign.count();

  // Mock revenue aggregation placeholder
  const totalPlatformFees = await prisma.financeLedger.aggregate({
    _sum: { amount: true },
    where: { transaction_type: 'Platform Fee' }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-600" /> Operational Reports
          </h1>
          <p className="text-gray-500 mt-1">Beta launch metrics and platform health overview.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm disabled:opacity-50">
          <Download size={18} /> Export CSV (Placeholder)
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Users Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <Users size={24} />
            </div>
            <span className="text-sm font-medium text-green-600 flex items-center"><TrendingUp size={14} className="mr-1"/> +12%</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers}</p>
          <p className="text-sm text-gray-500 mt-2">{verifiedUsers} Verified Profiles</p>
        </div>

        {/* Listings Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
              <Building size={24} />
            </div>
            <span className="text-sm font-medium text-green-600 flex items-center"><TrendingUp size={14} className="mr-1"/> +8%</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Listings</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalListings}</p>
          <p className="text-sm text-gray-500 mt-2">{activeListings} Active & Published</p>
        </div>

        {/* Bookings Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg text-green-600">
              <Calendar size={24} />
            </div>
            <span className="text-sm font-medium text-green-600 flex items-center"><TrendingUp size={14} className="mr-1"/> +24%</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Bookings</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalBookings}</p>
          <p className="text-sm text-gray-500 mt-2">{completedBookings} Successfully Completed</p>
        </div>

        {/* Finance Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
              <DollarSign size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Platform Fees (Mock)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">₱{totalPlatformFees._sum.amount?.toLocaleString() || '0'}</p>
          <p className="text-sm text-gray-500 mt-2">From completed rentals</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4">Marketing & AI Performance</h2>
        <div className="flex gap-12">
          <div>
            <p className="text-sm text-gray-500">Total Campaigns Generated</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCampaigns}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">AI Prompt Executions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">-- (Placeholder)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
