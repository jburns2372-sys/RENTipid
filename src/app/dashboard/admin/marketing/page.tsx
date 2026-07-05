import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import Link from 'next/link';
import { BarChart3, Calendar, FileText, Megaphone, Share2, ShieldAlert } from 'lucide-react';

export default async function AdminMarketingDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">Marketing Center</h1>
          <p className="text-gray-500 mt-1">Manage campaigns, approve promotions, and track social analytics.</p>
        </div>
        <Link href="/dashboard/admin/marketing/campaigns/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          + New Campaign
        </Link>
      </div>

      {/* Analytics Overview Placeholder */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="text-gray-500 text-sm font-medium mb-1 flex items-center justify-between">
            Active Campaigns <Megaphone size={16} />
          </div>
          <div className="text-3xl font-bold">3</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="text-gray-500 text-sm font-medium mb-1 flex items-center justify-between">
            Scheduled Posts <Calendar size={16} />
          </div>
          <div className="text-3xl font-bold">12</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="text-gray-500 text-sm font-medium mb-1 flex items-center justify-between">
            Pending Approvals <ShieldAlert size={16} className="text-amber-500"/>
          </div>
          <div className="text-3xl font-bold">5</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="text-gray-500 text-sm font-medium mb-1 flex items-center justify-between">
            Total Clicks <BarChart3 size={16} />
          </div>
          <div className="text-3xl font-bold">1,204</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="border-b px-5 py-4 flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-800">Quick Links</h2>
          </div>
          <div className="p-2">
            <Link href="/dashboard/admin/social-accounts" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-md"><Share2 size={20} /></div>
              <div>
                <h3 className="font-medium">Social Accounts</h3>
                <p className="text-sm text-gray-500">Manage connected platforms</p>
              </div>
            </Link>
            <Link href="/dashboard/admin/marketing/campaigns" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="bg-purple-100 text-purple-600 p-2 rounded-md"><FileText size={20} /></div>
              <div>
                <h3 className="font-medium">All Campaigns</h3>
                <p className="text-sm text-gray-500">View and manage marketing efforts</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="border-b px-5 py-4 flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-800">Approval Queue</h2>
          </div>
          <div className="p-5 text-center text-gray-500 py-10">
            <p>Phase 8: Approval Queue Placeholder.</p>
            <p className="text-sm mt-2">Mock posts pending review will appear here.</p>
          </div>
        </div>
      </div>

      <AIAssistantButton context="Marketing" userRole={role} />
    </div>
  );
}
