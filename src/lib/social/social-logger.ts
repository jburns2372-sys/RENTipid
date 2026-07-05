import { prisma } from '@/lib/ai/ai-logger';

export async function logSocialAction(data: {
  userId?: string;
  action: string;
  targetId?: string;
  campaignId?: string;
  postId?: string;
  listingId?: string;
  details: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actor_user_id: data.userId,
        action: data.action,
        module: 'Marketing / Social Promotion',
        target_id: data.targetId || data.postId || data.campaignId,
        details: data.details,
      }
    });
  } catch (error) {
    console.error("Failed to log social action:", error);
  }
}
