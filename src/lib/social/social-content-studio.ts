import { PrismaClient } from '@prisma/client';
import { SOCIAL_PERMISSIONS, hasSocialPermission } from './social-permissions';
import { SocialAccountManager } from './social-account-manager';
import { SocialProviderRegistry, SOCIAL_PLATFORMS } from './social-platform-registry';
import { createAuditLog } from '../audit';
import path from 'path';

const prisma = new PrismaClient();

export class SocialContentStudioService {
  /**
   * Create a new draft marketing post.
   */
  static async createDraft(input: {
    campaign_id: string;
    listing_id?: string;
    provider_id?: string;
    platform: string;
    post_type: string;
    post_title?: string;
    caption?: string;
    media_reference?: string;
    target_account_id?: string;
    editor_id: string;
    editor_role?: string;
  }) {
    if (!hasSocialPermission(input.editor_role, SOCIAL_PERMISSIONS.CREATE)) {
      throw new Error('Unauthorized: missing social.create permission');
    }

    if (input.listing_id && input.provider_id) {
      await this.validatePromotionConsent(input.provider_id, input.listing_id, input.platform);
    }

    if (input.campaign_id) {
      const campaign = await prisma.marketingCampaign.findUnique({ where: { id: input.campaign_id }});
      if (!campaign) throw new Error('Invalid campaign');
    }

    if (input.listing_id) {
      const listing = await prisma.listing.findUnique({ where: { id: input.listing_id }});
      if (!listing) throw new Error('Invalid listing');
    }

    if (input.target_account_id) {
      await this.validateTargetAccount(input.target_account_id, input.platform);
    }
    
    if (input.media_reference) {
       await this.validateMediaReference(input.media_reference, input.platform, input.target_account_id);
    }

    const post = await prisma.marketingPost.create({
      data: {
        campaign_id: input.campaign_id,
        listing_id: input.listing_id,
        provider_id: input.provider_id,
        platform: input.platform,
        post_type: input.post_type,
        post_title: input.post_title,
        caption: input.caption,
        media_file_path: input.media_reference,
        target_account_id: input.target_account_id,
        post_status: 'DRAFT',
        approval_status: 'PENDING',
        created_by_id: input.editor_id,
        version: 1,
      },
    });

    await this.saveVersionSnapshot(post.id, input.editor_id, 'Initial draft created');
    
    await createAuditLog({
      actor_user_id: input.editor_id,
      action: 'DRAFT_CREATED',
      module: 'SOCIAL_CONTENT_STUDIO',
      target_id: post.id,
      details: JSON.stringify({ platform: input.platform, target_account_id: input.target_account_id })
    });

    return post;
  }

  /**
   * Optimistically update a draft and conditionally save a version snapshot.
   */
  static async updateDraft(input: {
    post_id: string;
    current_version: number;
    editor_id: string;
    editor_role?: string;
    updates: {
      post_title?: string;
      caption?: string;
      hashtags?: string;
      media_reference?: string;
      target_account_id?: string;
      campaign_id?: string;
      listing_id?: string;
      provider_id?: string;
    };
    save_snapshot?: boolean;
    change_reason?: string;
  }) {
    if (!hasSocialPermission(input.editor_role, SOCIAL_PERMISSIONS.EDIT)) {
      throw new Error('Unauthorized: missing social.edit permission');
    }

    const post = await prisma.marketingPost.findUnique({ where: { id: input.post_id } });
    if (!post) throw new Error('Post not found');
    if (!['DRAFT', 'SUBMITTED_FOR_REVIEW', 'APPROVED', 'REJECTED', 'SCHEDULED'].includes(post.post_status)) {
      throw new Error('Cannot edit post that has already been published');
    }
    if (post.version !== input.current_version) {
      throw new Error('Optimistic concurrency error: The draft was modified by someone else. Please refresh and try again.');
    }

    if (input.updates.campaign_id) {
      const campaign = await prisma.marketingCampaign.findUnique({ where: { id: input.updates.campaign_id }});
      if (!campaign) throw new Error('Invalid campaign');
    }
    
    if (input.updates.listing_id) {
      const listing = await prisma.listing.findUnique({ where: { id: input.updates.listing_id }});
      if (!listing) throw new Error('Invalid listing');
    }

    if (input.updates.listing_id && input.updates.provider_id) {
      await this.validatePromotionConsent(input.updates.provider_id, input.updates.listing_id, post.platform);
    } else if (input.updates.listing_id && post.provider_id) {
      await this.validatePromotionConsent(post.provider_id, input.updates.listing_id, post.platform);
    }

    if (input.updates.target_account_id) {
      await this.validateTargetAccount(input.updates.target_account_id, post.platform);
    }
    
    if (input.updates.media_reference) {
       await this.validateMediaReference(input.updates.media_reference, post.platform, input.updates.target_account_id);
    }
    
    const dataToUpdate: any = {
      ...input.updates,
      version: { increment: 1 },
      post_status: 'DRAFT', // Any edit reverts to DRAFT
    };
    
    if (input.updates.media_reference !== undefined) {
      dataToUpdate.media_file_path = input.updates.media_reference;
      delete dataToUpdate.media_reference;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.marketingPost.update({
        where: { id: input.post_id, version: input.current_version },
        data: dataToUpdate,
      });

      if (post.post_status === 'SCHEDULED') {
        // Cancel active schedules transactionally
        await tx.socialPostQueue.updateMany({
          where: { 
            post_id: post.id,
            status: { in: ['Pending', 'Posting'] }
          },
          data: {
            status: 'Cancelled',
            cancelled_at: new Date(),
            cancellation_reason: 'Post was materially edited after scheduling.',
          }
        });
      }

      return up;
    });

    if (input.save_snapshot) {
      await this.saveVersionSnapshot(input.post_id, input.editor_id, input.change_reason || 'Manual save');
    }

    let details: any = { version: updated.version };
    if (input.updates.campaign_id && input.updates.campaign_id !== post.campaign_id) details.campaign_association_changed = true;
    if (input.updates.listing_id && input.updates.listing_id !== post.listing_id) details.listing_association_changed = true;
    if (input.updates.target_account_id) details.target_account_specified = input.updates.target_account_id;
    if (input.updates.media_reference !== undefined && input.updates.media_reference !== post.media_file_path) {
      if (input.updates.media_reference) details.media_attached = true;
      else details.media_removed = true;
    }
    
    await createAuditLog({
      actor_user_id: input.editor_id,
      action: 'DRAFT_EDITED',
      module: 'SOCIAL_CONTENT_STUDIO',
      target_id: post.id,
      details: JSON.stringify(details)
    });

    return updated;
  }

  /**
   * Submit a draft for review.
   */
  static async submitForReview(post_id: string, editor_id: string, editor_role?: string) {
    if (!hasSocialPermission(editor_role, SOCIAL_PERMISSIONS.EDIT)) {
      throw new Error('Unauthorized: missing social.edit permission');
    }

    const post = await prisma.marketingPost.findUnique({ where: { id: post_id } });
    if (!post) throw new Error('Post not found');
    if (post.post_status !== 'DRAFT') {
      throw new Error('Only DRAFT posts can be submitted for review');
    }

    // Final pre-flight checks
    if (!post.caption && !post.media_file_path) {
      await createAuditLog({ actor_user_id: editor_id, action: 'SUBMISSION_FAILED', module: 'SOCIAL_CONTENT_STUDIO', target_id: post.id, details: JSON.stringify({ reason: 'Validation Error: Post must have a caption or media.' }) });
      throw new Error('Validation Error: Post must have a caption or media.');
    }

    if (post.listing_id && post.provider_id) {
       try {
          await this.validatePromotionConsent(post.provider_id, post.listing_id, post.platform);
       } catch (error: any) {
          await createAuditLog({ actor_user_id: editor_id, action: 'SUBMISSION_FAILED', module: 'SOCIAL_CONTENT_STUDIO', target_id: post.id, details: JSON.stringify({ reason: 'Consent Error: Provider has not opted in' }) });
          throw error;
       }
    }

    const updated = await prisma.marketingPost.update({
      where: { id: post_id },
      data: {
        post_status: 'SUBMITTED_FOR_REVIEW',
        version: { increment: 1 },
      },
    });

    await this.saveVersionSnapshot(post_id, editor_id, 'Submitted for review');
    
    await createAuditLog({
      actor_user_id: editor_id,
      action: 'DRAFT_SUBMITTED',
      module: 'SOCIAL_CONTENT_STUDIO',
      target_id: post.id
    });
    
    return updated;
  }

  private static async validatePromotionConsent(provider_id: string, listing_id: string, platform: string) {
    const consent = await prisma.providerPromotionOptIn.findFirst({
      where: {
        provider_id,
        listing_id,
      },
    });

    if (!consent || !consent.allow_platform_promotion) {
      throw new Error('Provider has not opted in to platform promotion for this listing.');
    }
  }

  private static async validateTargetAccount(account_id: string, expected_platform: string) {
    // Validates that the account exists and matches the platform capability
    const account = await prisma.socialAccount.findUnique({ where: { id: account_id } });
    if (!account) throw new Error('Target account not found');
    
    if (account.health_status === 'DISABLED') {
      throw new Error('Cannot target a DISABLED social account');
    }

    const adapter = SocialProviderRegistry.get(account.platform as any);
    if (!adapter) throw new Error('Provider adapter not found for account');
    
    const capabilities = adapter.getCapabilities();
    // basic capability check example
    if (expected_platform.toLowerCase() === 'video' && !capabilities.includes('publishVideo')) {
       throw new Error('Target account does not support publishVideo');
    }
  }

  private static async saveVersionSnapshot(post_id: string, editor_id: string, reason: string) {
    const post = await prisma.marketingPost.findUnique({ where: { id: post_id } });
    if (!post) return;

    await prisma.marketingPostVersion.create({
      data: {
        post_id: post.id,
        version_number: post.version,
        content_snapshot: post.caption,
        media_snapshot: post.media_file_path,
        target_channels: post.platform,
        target_account_id: post.target_account_id,
        change_reason: reason,
        editor_id: editor_id,
      },
    });
  }

  static async validateMediaReference(mediaRef: string, platform: string, targetAccountId?: string | null) {
    if (!mediaRef) return;
    
    // Prevent path traversal and arbitrary local paths
    if (mediaRef.includes('..') || mediaRef.includes('\\0') || mediaRef.startsWith('C:\\') || mediaRef.startsWith('/etc/') || mediaRef.startsWith('\\\\')) {
      throw new Error('Invalid media reference: Path traversal or absolute paths are not permitted.');
    }
    
    // Enforce RENTipid storage namespace
    if (!mediaRef.startsWith('/uploads/') && !mediaRef.startsWith('/api/documents/view/')) {
       // Also allow standard https URLs only if they belong to our bucket
       // For now, enforce local namespace as per existing upload strategy
       if (!mediaRef.startsWith('https://storage.rentipid.com') && !mediaRef.startsWith('https://rentipid.local')) {
          throw new Error('Invalid media reference: Must belong to RENTipid storage namespace.');
       }
    }

    // Validate capability if target account is known
    if (targetAccountId) {
       const account = await prisma.socialAccount.findUnique({ where: { id: targetAccountId } });
       if (account) {
         const adapter = SocialProviderRegistry.get(account.platform as any);
         if (adapter) {
            const capabilities = adapter.getCapabilities();
            const ext = path.extname(mediaRef).toLowerCase();
            const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const videoExts = ['.mp4', '.mov', '.avi'];
            
            if (imageExts.includes(ext) && !capabilities.includes('publishImage')) {
               throw new Error('Target account does not support image publication.');
            }
            if (videoExts.includes(ext) && !capabilities.includes('publishVideo')) {
               throw new Error('Target account does not support video publication.');
            }
         }
       }
    }
  }
}
