import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import Link from 'next/link';
import { Megaphone, Share2, Sparkles, TrendingUp } from 'lucide-react';

export default async function ProviderMarketingDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Individual Provider' && role !== 'Business Provider') {
    redirect('/unauthorized');
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">Marketing & Promotions</h1>
          <p className="text-gray-500 mt-1">Generate AI marketing content and manage promotions for your listings.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-600" /> AI Promotion Generator
            </h2>
            <p className="text-indigo-700 mb-4">
              Select a published listing to instantly generate captions, hashtags, and video scripts optimized for social media.
            </p>
            <Link href="/dashboard/provider/listings" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
              Select Listing to Promote
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="border-b px-5 py-4 flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-800">Quick Links</h2>
          </div>
          <div className="p-2">
            <Link href="/dashboard/provider/social-accounts" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-md"><Share2 size={20} /></div>
              <div>
                <h3 className="font-medium">Social Accounts</h3>
                <p className="text-sm text-gray-500">Connect your business profiles</p>
              </div>
            </Link>
            <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition opacity-60 cursor-not-allowed">
              <div className="bg-green-100 text-green-600 p-2 rounded-md"><TrendingUp size={20} /></div>
              <div>
                <h3 className="font-medium">Campaign Analytics</h3>
                <p className="text-sm text-gray-500">View performance (Coming Soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AIAssistantButton context="Marketing" userRole={role} />
    </div>
  );
}
