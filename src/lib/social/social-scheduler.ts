import { prisma } from '@/lib/ai/ai-logger';
import { SocialCommandLayer } from './social-command-layer';

export class SocialScheduler {
  
  static async schedulePost(postId: string, date: Date, userId: string) {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error("Post not found");

    if (post.approval_status !== 'Approved') {
      throw new Error("Cannot schedule an unapproved post.");
    }

    if (date < new Date()) {
      throw new Error("Scheduled time must be in the future.");
    }

    await prisma.marketingPost.update({
      where: { id: postId },
      data: {
        scheduled_at: date,
        post_status: 'Scheduled'
      }
    });

    await prisma.socialPostQueue.create({
      data: {
        post_id: postId,
        platform: post.platform,
        scheduled_at: date,
        status: 'Pending'
      }
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: userId,
        action: 'POST_SCHEDULED',
        module: 'Marketing / Social Promotion',
        target_id: postId,
        details: `Scheduled for ${date.toISOString()}`
      }
    });
  }

  // A cron job or background worker would call this periodically
  static async processQueue() {
    try {
      const now = new Date();
      
      // Find posts ready to publish
      const pendingItems = await prisma.socialPostQueue.findMany({
        where: {
          status: 'Pending',
          scheduled_at: { lte: now }
        },
        include: { post: true }
      });

      for (const item of pendingItems) {
        try {
          // Mark as posting
          await prisma.socialPostQueue.update({
            where: { id: item.id },
            data: { status: 'Posting' }
          });

          // Check token validity (simulated)
          const account = await prisma.socialAccount.findFirst({
            where: { owner_user_id: item.post.created_by_id, platform: item.platform }
          });

          if (!account) {
            throw new Error(`No connected account for ${item.platform}`);
          }

          // Mock posting action
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log(`[SOCIAL_SCHEDULER] Posted to ${item.platform}: ${item.post.caption}`);

          // Success
          await prisma.socialPostQueue.update({
            where: { id: item.id },
            data: { 
              status: 'Success', 
              processed_at: new Date()
            }
          });

          // Update post status
          await prisma.marketingPost.update({
            where: { id: item.post.id },
            data: { post_status: 'Published', published_at: new Date() }
          });

        } catch (error: any) {
          // Failed
          await prisma.socialPostQueue.update({
            where: { id: item.id },
            data: { 
              status: 'Failed', 
              error_message: error.message || 'Unknown error'
            }
          });
          
          await prisma.marketingPost.update({
            where: { id: item.post.id },
            data: { post_status: 'Failed' }
          });
        }
      }
    } catch (error) {
      console.error('[SOCIAL_SCHEDULER] Process failed:', error);
    }
  }
}
