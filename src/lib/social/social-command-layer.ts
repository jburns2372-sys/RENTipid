import { MockSocialAdapter } from './social-adapters/mock-social-adapter';
import { SocialPlatform } from './social-platform-registry';
import { checkSocialGuardrails } from './social-guardrails';
import { logSocialAction } from './social-logger';
import { prisma } from '@/lib/ai/ai-logger';

export class SocialCommandLayer {
  
  static getAdapter(platform: string) {
    // For Phase 8, always return the Mock Adapter
    return new MockSocialAdapter(platform as SocialPlatform);
  }

  static async requestApproval(postId: string, userId: string) {
    // Update post status
    await prisma.marketingPost.update({
      where: { id: postId },
      data: { 
        post_status: 'Pending Approval',
        approval_status: 'Pending Admin Approval'
      }
    });

    await logSocialAction({
      userId,
      action: 'POST_SUBMITTED_FOR_APPROVAL',
      postId,
      details: 'Post submitted for approval'
    });
  }

  static async approvePost(postId: string, adminId: string, adminRole: string) {
    const post = await prisma.marketingPost.findUnique({
      where: { id: postId },
      include: { campaign: true }
    });

    if (!post) throw new Error("Post not found");

    // Guardrail Check before approval
    const guardrails = checkSocialGuardrails(post.caption || "");
    if (!guardrails.isSafe) {
      await logSocialAction({
        userId: adminId,
        action: 'POST_APPROVAL_BLOCKED',
        postId,
        details: `Blocked by guardrail: ${guardrails.reason}`
      });
      throw new Error(guardrails.reason);
    }

    // Approve
    await prisma.marketingPost.update({
      where: { id: postId },
      data: { 
        post_status: 'Approved',
        approval_status: 'Approved',
        approved_by_id: adminId
      }
    });

    await logSocialAction({
      userId: adminId,
      action: 'POST_APPROVED',
      postId,
      details: 'Post approved by admin'
    });
  }

  static async publishNow(postId: string, userId: string) {
    const post = await prisma.marketingPost.findUnique({
      where: { id: postId }
    });

    if (!post || post.approval_status !== 'Approved') {
      throw new Error("Post must be approved before publishing");
    }

    const adapter = this.getAdapter(post.platform);
    
    // In Phase 8, this calls the mock adapter
    const result = await adapter.publishPostPlaceholder(postId);

    if (result.success) {
      await prisma.marketingPost.update({
        where: { id: postId },
        data: {
          post_status: 'Published Placeholder',
          published_at: new Date()
        }
      });

      // Generate UTM Link Placeholder
      await prisma.uTMLink.create({
        data: {
          campaign_id: post.campaign_id,
          post_id: post.id,
          listing_id: post.listing_id,
          base_url: post.destination_url || 'https://rentipid.com',
          tracking_url: `${post.destination_url || 'https://rentipid.com'}?utm_source=${post.platform}&utm_medium=social&utm_campaign=${post.campaign_id}`,
          utm_source: post.platform,
          utm_medium: 'social',
          utm_campaign: post.campaign_id
        }
      });

      // Generate Analytics Placeholder
      await prisma.campaignAnalytics.create({
        data: {
          campaign_id: post.campaign_id,
          post_id: post.id,
          platform: post.platform,
          impressions_placeholder: Math.floor(Math.random() * 5000),
          clicks_placeholder: Math.floor(Math.random() * 500),
          likes_placeholder: Math.floor(Math.random() * 200)
        }
      });

      await logSocialAction({
        userId,
        action: 'POST_PUBLISHED_PLACEHOLDER',
        postId,
        details: `Mock published to ${post.platform}`
      });
    } else {
      await prisma.marketingPost.update({
        where: { id: postId },
        data: { post_status: 'Failed' }
      });
    }

    return result;
  }
}
