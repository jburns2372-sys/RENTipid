export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'Facebook Page',
  INSTAGRAM: 'Instagram Business',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube Shorts',
  LINKEDIN: 'LinkedIn Page',
  X: 'X',
  PINTEREST: 'Pinterest',
  WHATSAPP: 'WhatsApp Business',
} as const;

export type SocialPlatform = typeof SOCIAL_PLATFORMS[keyof typeof SOCIAL_PLATFORMS];

export interface SocialAdapter {
  platformId: SocialPlatform;
  
  validateConnection(accountId: string): Promise<boolean>;
  validatePostRequirements(postData: any): Promise<{isValid: boolean; errors?: string[]}>;
  createDraft(postData: any): Promise<any>;
  schedulePost(postId: string, date: Date): Promise<boolean>;
  publishPostPlaceholder(postId: string): Promise<{success: boolean; providerPostId?: string; error?: string}>;
  fetchAnalyticsPlaceholder(postId: string): Promise<any>;
}
