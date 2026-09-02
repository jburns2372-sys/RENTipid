import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import ProfileFormClient, { ExtendedUserProfile, ExtendedBusinessProfile } from '@/components/profile/ProfileFormClient';
import { AddressService } from '@/lib/address/AddressService';
import { isSyntheticIdentityEmail, resolveProfileDisplayEmail } from '@/lib/auth/unified/display-email';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string | null; email?: string | null; image?: string | null; role?: string; status?: string } | undefined;

  let userProfile: ExtendedUserProfile | null = null;
  let businessProfile: ExtendedBusinessProfile | null = null;
  let providerIdentities: { id: string; provider: string; email: string | null; email_verified: boolean }[] = [];

  if (user?.id) {
    if (isSyntheticIdentityEmail(user.email)) {
      providerIdentities = await prisma.authProviderIdentity.findMany({
        where: { user_id: user.id },
        select: { id: true, provider: true, email: true, email_verified: true },
        orderBy: [{ email_verified: 'desc' }, { provider: 'asc' }, { id: 'asc' }],
      });
    }

    userProfile = await prisma.userProfile.findUnique({ 
      where: { user_id: user.id },
      include: { global_address: true }
    });
    if (userProfile && userProfile.global_address) {
      userProfile.global_address = AddressService.readNormalizedAddress(userProfile.global_address as unknown as Record<string, unknown>) as unknown as typeof userProfile.global_address;
    }

    businessProfile = await prisma.businessProfile.findUnique({ 
      where: { user_id: user.id },
      include: { global_business_address: true }
    });
    if (businessProfile && businessProfile.global_business_address) {
      businessProfile.global_business_address = AddressService.readNormalizedAddress(businessProfile.global_business_address as unknown as Record<string, unknown>) as unknown as typeof businessProfile.global_business_address;
    }
  }

  const displayEmail = resolveProfileDisplayEmail(user?.email, providerIdentities);

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
            <p className="font-medium text-gray-900">{displayEmail}</p>
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
          <a href="/account/delete" role="button" className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-4 py-2 rounded font-medium transition-colors inline-block">
            Delete Account
          </a>
        </div>
      </div>

      <ProfileFormClient 
        user={user as unknown as Partial<import('@prisma/client').User>} 
        initialUserProfile={userProfile} 
        initialBusinessProfile={businessProfile} 
      />
      
      <AIAssistantButton context="Profile Management" />
    </div>
  );
}
