import { PrismaClient } from '@prisma/client';
import { SOCIAL_PERMISSIONS, hasSocialPermission } from './social-permissions';

const prisma = new PrismaClient();

export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED'
} as const;

export class SocialCampaignService {
  /**
   * Internal helper to audit campaign actions
   */
  private static async auditAction(
    actorId: string,
    action: string,
    campaignId: string,
    details: any = {}
  ) {
    await prisma.auditLog.create({
      data: {
        actor_user_id: actorId,
        module: 'MarketingCampaign',
        action: action,
        target_id: campaignId,
        details: JSON.stringify(details),
      }
    });
  }

  static async createCampaign(
    actorId: string,
    data: {
      campaign_name: string;
      campaign_goal: string;
      start_date?: Date;
      end_date?: Date;
      target_audience?: string;
      target_country?: string;
      target_city?: string;
      target_language?: string;
    }
  ) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.CREATE)) {
      throw new Error('Unauthorized: Missing CREATE permission');
    }

    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      throw new Error('Invalid date range: end_date cannot be before start_date');
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        ...data,
        campaign_type: 'SOCIAL',
        campaign_status: CAMPAIGN_STATUS.DRAFT,
        approval_status: 'PENDING',
        created_by_id: actorId
      }
    });

    await this.auditAction(actorId, 'CREATE_CAMPAIGN', campaign.id, data);
    return campaign;
  }

  static async updateCampaign(actorId: string, campaignId: string, data: any) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.EDIT)) {
      throw new Error('Unauthorized: Missing CAMPAIGN_EDIT permission');
    }

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.campaign_status === CAMPAIGN_STATUS.ARCHIVED || campaign.campaign_status === CAMPAIGN_STATUS.COMPLETED) {
      throw new Error('Cannot edit a completed or archived campaign');
    }

    if (data.start_date && data.end_date && new Date(data.end_date) < new Date(data.start_date)) {
      throw new Error('Invalid date range');
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data
    });

    await this.auditAction(actorId, 'UPDATE_CAMPAIGN', campaign.id, data);
    return updated;
  }

  static async activateCampaign(actorId: string, campaignId: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.EDIT)) {
      throw new Error('Unauthorized: Missing CAMPAIGN_EDIT permission');
    }

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.campaign_status !== CAMPAIGN_STATUS.DRAFT && campaign.campaign_status !== CAMPAIGN_STATUS.PAUSED) {
      throw new Error('Invalid lifecycle transition: Can only activate DRAFT or PAUSED campaigns');
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { campaign_status: CAMPAIGN_STATUS.ACTIVE }
    });

    await this.auditAction(actorId, 'ACTIVATE_CAMPAIGN', campaign.id);
    return updated;
  }

  static async pauseCampaign(actorId: string, campaignId: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.EDIT)) {
      throw new Error('Unauthorized');
    }

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.campaign_status !== CAMPAIGN_STATUS.ACTIVE) {
      throw new Error('Can only pause ACTIVE campaigns');
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { campaign_status: CAMPAIGN_STATUS.PAUSED }
    });

    await this.auditAction(actorId, 'PAUSE_CAMPAIGN', campaign.id);
    return updated;
  }

  static async completeCampaign(actorId: string, campaignId: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.EDIT)) {
      throw new Error('Unauthorized');
    }

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.campaign_status === CAMPAIGN_STATUS.ARCHIVED) {
      throw new Error('Cannot complete an ARCHIVED campaign');
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { campaign_status: CAMPAIGN_STATUS.COMPLETED }
    });

    await this.auditAction(actorId, 'COMPLETE_CAMPAIGN', campaign.id);
    return updated;
  }

  static async archiveCampaign(actorId: string, campaignId: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.EDIT)) {
      throw new Error('Unauthorized');
    }

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error('Campaign not found');

    const updated = await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { campaign_status: CAMPAIGN_STATUS.ARCHIVED }
    });

    await this.auditAction(actorId, 'ARCHIVE_CAMPAIGN', campaign.id);
    return updated;
  }

  static async addPost(actorId: string, campaignId: string, postId: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.EDIT)) throw new Error('Unauthorized');

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.campaign_status === CAMPAIGN_STATUS.ARCHIVED || campaign.campaign_status === CAMPAIGN_STATUS.COMPLETED) {
      throw new Error('Cannot add post to this campaign');
    }

    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');

    await prisma.marketingPost.update({
      where: { id: postId },
      data: { campaign_id: campaignId }
    });

    await this.auditAction(actorId, 'ADD_POST_TO_CAMPAIGN', campaignId, { postId });
  }

  static async removePost(actorId: string, campaignId: string, postId: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.EDIT)) throw new Error('Unauthorized');

    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    if (!post || post.campaign_id !== campaignId) throw new Error('Post not associated with campaign');
    
    // Removing a scheduled/published post must not erase publication history.
    // It simply unlinks it from the campaign object.
    
    // Note: We need a placeholder generic campaign or allow nullable campaign_id?
    // Wait, MarketingPost.campaign_id is NOT nullable! 
    // If it's not nullable, we can't 'remove' a post without moving it to another campaign.
    throw new Error('Post removal unsupported: Posts require a campaign. Move it to a different campaign instead.');
  }

  static async addListing(actorId: string, campaignId: string, listingId: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.EDIT)) throw new Error('Unauthorized');

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.campaign_status === CAMPAIGN_STATUS.ARCHIVED || campaign.campaign_status === CAMPAIGN_STATUS.COMPLETED) {
      throw new Error('Cannot edit this campaign');
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId }});
    if (!listing) throw new Error('Listing not found');

    // ENFORCE PROVIDER CONSENT
    const optIn = await prisma.providerPromotionOptIn.findFirst({
      where: {
        provider_id: listing.provider_id,
        OR: [
          { listing_id: listingId },
          { listing_id: null }
        ]
      },
      orderBy: { listing_id: 'desc' }
    });

    if (!optIn || !optIn.allow_platform_promotion) {
      await this.auditAction(actorId, 'BLOCKED_CONSENT_LISTING_ADD', campaignId, { listingId, reason: 'Provider has not opted in' });
      throw new Error('Provider consent required: The provider has not opted in to platform promotion.');
    }

    await prisma.campaignListingLink.create({
      data: {
        campaign_id: campaignId,
        listing_id: listingId
      }
    });

    await this.auditAction(actorId, 'ADD_LISTING_TO_CAMPAIGN', campaignId, { listingId });
  }

  static async addTargetAccount(actorId: string, campaignId: string, accountId: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.EDIT)) throw new Error('Unauthorized');

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.campaign_status === CAMPAIGN_STATUS.ARCHIVED || campaign.campaign_status === CAMPAIGN_STATUS.COMPLETED) {
      throw new Error('Cannot edit this campaign');
    }

    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');
    if (account.connection_status !== 'CONNECTED') {
      throw new Error('Target account is disabled or disconnected');
    }

    await prisma.campaignTargetAccount.create({
      data: {
        campaign_id: campaignId,
        target_account_id: accountId
      }
    });

    await this.auditAction(actorId, 'ADD_ACCOUNT_TO_CAMPAIGN', campaignId, { accountId });
  }

  static async getCampaignSummary(actorId: string, campaignId: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!hasSocialPermission(actor?.role, SOCIAL_PERMISSIONS.VIEW)) throw new Error('Unauthorized');

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
      include: {
        posts: {
          select: {
            id: true,
            post_status: true,
            approval_status: true
          }
        },
        listings: { include: { listing: true } },
        target_accounts: { include: { target_account: true } }
      }
    });

    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }
}
