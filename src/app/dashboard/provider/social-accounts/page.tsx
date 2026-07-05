import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SocialAccountManager from '@/components/social/SocialAccountManager';
import AIAssistantButton from '@/components/ai/AIAssistantButton';

export default async function ProviderSocialAccountsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Individual Provider' && role !== 'Business Provider') {
    redirect('/unauthorized');
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Social Accounts</h1>
        <p className="text-gray-500">Connect your business social profiles to easily share generated promotions for your listings.</p>
      </div>

      <SocialAccountManager isAdmin={false} />
      
      <AIAssistantButton context="Marketing" userRole={role} />
    </div>
  );
}
