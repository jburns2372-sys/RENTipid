export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'Facebook Page',
  INSTAGRAM: 'Instagram Business',
  TIKTOK: 'TikTok',
  GOOGLE: 'Google Business',
  YOUTUBE: 'YouTube Shorts',
  LINKEDIN: 'LinkedIn Page',
  X: 'X',
  PINTEREST: 'Pinterest',
  WHATSAPP: 'WhatsApp Business',
  VIBER: 'Viber Business',
  MOCK: 'Mock Social Network',
} as const;

export type SocialPlatform = typeof SOCIAL_PLATFORMS[keyof typeof SOCIAL_PLATFORMS];

export type ProviderConnectionStatus = 'NOT_CONFIGURED' | 'CONFIGURED' | 'SANDBOX_READY' | 'PARTNER_READY' | 'LIVE_READY' | 'LIVE' | 'DEGRADED' | 'DISABLED';
export type ProviderHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'AUTH_REQUIRED' | 'RATE_LIMITED' | 'DISABLED' | 'UNKNOWN';

export type ProviderCapability = 
  | 'accountConnection'
  | 'accountValidation'
  | 'healthCheck'
  | 'publishText'
  | 'publishImage'
  | 'publishVideo'
  | 'scheduledPublishing'
  | 'analytics'
  | 'comments'
  | 'feedback'
  | 'messaging'
  | 'credentialRefresh'
  | 'webhookEvents';

export interface SocialAdapter {
  platformId: SocialPlatform;
  getCapabilities(): ProviderCapability[];
  
  validateConnection(accountId: string): Promise<boolean>;
  checkHealth(accountId?: string): Promise<{ status: ProviderHealthStatus; message?: string; retryAfterSeconds?: number }>;
  validatePostRequirements(postData: any): Promise<{isValid: boolean; errors?: string[]}>;
  publishPost(postData: any, accountId: string, idempotencyKey: string): Promise<{success: boolean; providerPostId?: string; error?: string; rateLimited?: boolean}>;
  handoffScheduledPost(postData: any, scheduledDate: Date, accountId: string): Promise<{success: boolean; providerScheduleId?: string; error?: string}>;
  getPublicationStatus(providerPostId: string, accountId: string): Promise<{status: string; error?: string}>;
  fetchMetrics(providerPostId: string, accountId: string): Promise<any[]>;
  fetchFeedback(providerPostId: string, accountId: string): Promise<any[]>;
  normalizeProviderEvent(rawEvent: any): Promise<{ eventType: string; normalizedPayload: any }>;
  refreshCredentials(accountId: string): Promise<{ success: boolean; newExpiry?: Date; error?: string }>;
}

export class SocialProviderRegistry {
  private static adapters: Map<SocialPlatform, SocialAdapter> = new Map();

  static register(adapter: SocialAdapter) {
    this.adapters.set(adapter.platformId, adapter);
  }

  static get(platformId: SocialPlatform): SocialAdapter {
    const adapter = this.adapters.get(platformId);
    if (!adapter) {
      throw new Error(`SOCIAL_PROVIDER_NOT_REGISTERED: ${platformId}`);
    }
    return adapter;
  }

  static getAll(): SocialAdapter[] {
    return Array.from(this.adapters.values());
  }

  static hasCapability(platformId: SocialPlatform, capability: ProviderCapability): boolean {
    const adapter = this.adapters.get(platformId);
    if (!adapter) return false;
    return adapter.getCapabilities().includes(capability);
  }
}
