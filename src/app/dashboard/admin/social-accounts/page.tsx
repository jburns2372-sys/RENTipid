import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SocialAccountManager from '@/components/social/SocialAccountManager';
import AIAssistantButton from '@/components/ai/AIAssistantButton';

export default async function AdminSocialAccountsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Social Accounts</h1>
        <p className="text-gray-500">Manage the official RENTipid social media connections used for platform-wide campaigns.</p>
      </div>

      <SocialAccountManager isAdmin={true} />
      
      <AIAssistantButton context="Marketing" userRole={role} />
    </div>
  );
}
