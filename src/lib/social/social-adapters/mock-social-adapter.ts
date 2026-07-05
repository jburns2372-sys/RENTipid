import { SocialAdapter, SocialPlatform } from '../social-platform-registry';
import { prisma } from '@/lib/ai/ai-logger'; // Reusing prisma from ai lib or global

export class MockSocialAdapter implements SocialAdapter {
  platformId: SocialPlatform;

  constructor(platform: SocialPlatform) {
    this.platformId = platform;
  }

  async validateConnection(accountId: string): Promise<boolean> {
    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    return account?.connection_status === 'Connected Placeholder' || account?.connection_status === 'Connected Sandbox';
  }

  async validatePostRequirements(postData: any): Promise<{ isValid: boolean; errors?: string[] }> {
    if (!postData.caption && !postData.media_file_path) {
      return { isValid: false, errors: ['Post must contain either a caption or media'] };
    }
    return { isValid: true };
  }

  async createDraft(postData: any): Promise<any> {
    // Return mock provider ID
    return { providerDraftId: `mock_draft_${Date.now()}` };
  }

  async schedulePost(postId: string, date: Date): Promise<boolean> {
    // Mock scheduling always succeeds if it's in the future
    if (date < new Date()) return false;
    return true;
  }

  async publishPostPlaceholder(postId: string): Promise<{ success: boolean; providerPostId?: string; error?: string }> {
    // Mock publishing
    return { success: true, providerPostId: `mock_published_${Date.now()}` };
  }

  async fetchAnalyticsPlaceholder(postId: string): Promise<any> {
    return {
      impressions: Math.floor(Math.random() * 1000),
      clicks: Math.floor(Math.random() * 100),
      likes: Math.floor(Math.random() * 50),
    };
  }
}
