import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">Basic Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Full Name / Business Name</label>
            <p className="font-medium text-gray-900">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Account Role</label>
            <p className="font-medium text-gray-900">{user?.role}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Verification Status</label>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold
              ${user?.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                user?.status === 'Verified' ? 'bg-green-100 text-green-800' : 
                'bg-gray-100 text-gray-800'}`}>
              {user?.status || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <button disabled className="bg-gray-200 text-gray-500 px-4 py-2 rounded font-medium cursor-not-allowed">
            Edit Profile (Coming Soon)
          </button>
        </div>
      </div>
      
      <AIAssistantButton context="Profile Management" />
    </div>
  );
}
