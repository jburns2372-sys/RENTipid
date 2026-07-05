'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/ai/ai-logger';
import { SocialCommandLayer } from '@/lib/social/social-command-layer';
import { logSocialAction } from '@/lib/social/social-logger';
import { revalidatePath } from 'next/cache';

async function checkProviderAuth() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'Individual Provider' && user.role !== 'Business Provider')) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function createProviderPromotionRequest(listingId: string, platform: string, caption: string) {
  const user = await checkProviderAuth();
  
  // Verify listing belongs to provider
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.provider_id !== user.id) {
    throw new Error("Unauthorized to promote this listing");
  }

  // Create a provider-specific campaign automatically if one doesn't exist, or just create the post under a "Provider Request" campaign
  // For Phase 8 simplicity, we'll create a campaign per request.
  const campaign = await prisma.marketingCampaign.create({
    data: {
      campaign_name: `Promo for Listing: ${listing.title}`,
      campaign_type: 'Listing Promotion',
      campaign_goal: 'Listing Views',
      campaign_status: 'Pending Approval',
      approval_status: 'Pending Admin Approval',
      created_by_id: user.id
    }
  });

  const post = await prisma.marketingPost.create({
    data: {
      campaign_id: campaign.id,
      listing_id: listing.id,
      provider_id: user.id,
      platform,
      caption,
      post_type: 'Text',
      post_status: 'Pending Approval',
      approval_status: 'Pending Admin Approval',
      created_by_id: user.id
    }
  });

  await logSocialAction({
    userId: user.id,
    action: 'PROVIDER_PROMOTION_REQUESTED',
    postId: post.id,
    campaignId: campaign.id,
    listingId,
    details: `Provider requested promotion on ${platform}`
  });

  revalidatePath(`/dashboard/provider/marketing`);
  return { success: true, campaignId: campaign.id };
}
