import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createCampaign } from '@/app/dashboard/admin/marketing/actions';

export default async function NewCampaignPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>
      
      <form action={createCampaign} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
          <input type="text" name="campaign_name" required className="w-full border rounded-lg px-4 py-2" placeholder="e.g. Summer Rentals Promo" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
            <select name="campaign_type" className="w-full border rounded-lg px-4 py-2">
              <option>Platform Awareness</option>
              <option>Listing Promotion</option>
              <option>Category Promotion</option>
              <option>Seasonal Campaign</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Goal</label>
            <select name="campaign_goal" className="w-full border rounded-lg px-4 py-2">
              <option>Brand Awareness</option>
              <option>Listing Views</option>
              <option>Booking Requests</option>
              <option>Provider Signups</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            Create Campaign Outline
          </button>
        </div>
      </form>
    </div>
  );
}
