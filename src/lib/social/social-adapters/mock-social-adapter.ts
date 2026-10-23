import { SocialAdapter, SocialPlatform, SOCIAL_PLATFORMS, ProviderCapability, ProviderHealthStatus } from '../social-platform-registry';

export class MockSocialAdapter implements SocialAdapter {
  platformId: SocialPlatform = SOCIAL_PLATFORMS.MOCK;

  // Simulation state for deterministic testing
  static simulationState = {
    healthStatus: 'HEALTHY' as ProviderHealthStatus,
    connectionStatus: 'CONFIGURED' as string,
    capabilities: [
      'accountConnection', 'accountValidation', 'healthCheck', 
      'publishText', 'publishImage', 'publishVideo', 'scheduledPublishing',
      'analytics', 'comments', 'feedback', 'messaging', 'credentialRefresh', 'webhookEvents'
    ] as ProviderCapability[],
    publishSuccess: true,
    publishDelayMs: 0,
    rateLimitRemaining: 100,
    idempotencyCache: new Map<string, string>(),
    credentialsValid: true
  };

  getCapabilities(): ProviderCapability[] {
    return MockSocialAdapter.simulationState.capabilities;
  }

  async validateConnection(accountId: string): Promise<boolean> {
    return MockSocialAdapter.simulationState.connectionStatus === 'CONFIGURED' && 
           MockSocialAdapter.simulationState.credentialsValid;
  }

  async checkHealth(accountId?: string): Promise<{ status: ProviderHealthStatus; message?: string; retryAfterSeconds?: number }> {
    return { status: MockSocialAdapter.simulationState.healthStatus };
  }

  async validatePostRequirements(postData: any): Promise<{ isValid: boolean; errors?: string[] }> {
    if (!postData.caption && !postData.media_file_path) {
      return { isValid: false, errors: ['Post must contain either a caption or media'] };
    }
    return { isValid: true };
  }

  async publishPost(postData: any, accountId: string, idempotencyKey: string): Promise<{ success: boolean; providerPostId?: string; error?: string; rateLimited?: boolean }> {
    if (MockSocialAdapter.simulationState.idempotencyCache.has(idempotencyKey)) {
      return { success: true, providerPostId: MockSocialAdapter.simulationState.idempotencyCache.get(idempotencyKey) };
    }

    if (MockSocialAdapter.simulationState.healthStatus === 'RATE_LIMITED' || MockSocialAdapter.simulationState.rateLimitRemaining <= 0) {
      return { success: false, error: 'Rate limit exceeded', rateLimited: true };
    }

    if (!MockSocialAdapter.simulationState.publishSuccess || MockSocialAdapter.simulationState.healthStatus !== 'HEALTHY') {
      return { success: false, error: 'Simulated publish failure or unhealthy state' };
    }

    if (MockSocialAdapter.simulationState.publishDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, MockSocialAdapter.simulationState.publishDelayMs));
    }

    MockSocialAdapter.simulationState.rateLimitRemaining--;
    const newId = `mock_published_${Date.now()}`;
    MockSocialAdapter.simulationState.idempotencyCache.set(idempotencyKey, newId);

    return { success: true, providerPostId: newId };
  }

  async handoffScheduledPost(postData: any, scheduledDate: Date, accountId: string): Promise<{ success: boolean; providerScheduleId?: string; error?: string }> {
    if (scheduledDate < new Date()) {
      return { success: false, error: 'Cannot schedule in the past' };
    }
    return { success: true, providerScheduleId: `mock_schedule_${Date.now()}` };
  }

  async getPublicationStatus(providerPostId: string, accountId: string): Promise<{ status: string; error?: string }> {
    return { status: 'PUBLISHED' };
  }

  async fetchMetrics(providerPostId: string, accountId: string): Promise<any[]> {
    return [
      { type: 'impressions', value: 1000 },
      { type: 'clicks', value: 150 }
    ];
  }

  async fetchFeedback(providerPostId: string, accountId: string): Promise<any[]> {
    return [
      { id: 'c1', text: 'Great post!', author: 'mock_user', timestamp: new Date() }
    ];
  }

  async normalizeProviderEvent(rawEvent: any): Promise<{ eventType: string; normalizedPayload: any }> {
    // Scrub secrets
    const payload = { ...rawEvent };
    if (payload.token) delete payload.token;
    if (payload.secret) delete payload.secret;

    return {
      eventType: rawEvent.type || 'UNKNOWN',
      normalizedPayload: payload
    };
  }

  async refreshCredentials(accountId: string): Promise<{ success: boolean; newExpiry?: Date; error?: string }> {
    if (MockSocialAdapter.simulationState.healthStatus === 'UNAVAILABLE') {
      return { success: false, error: 'Mock provider unavailable for refresh' };
    }
    MockSocialAdapter.simulationState.credentialsValid = true;
    MockSocialAdapter.simulationState.healthStatus = 'HEALTHY';
    return { success: true, newExpiry: new Date(Date.now() + 86400000) }; // Valid for 1 day
  }

  // Phase 9 testing helper
  static generateMockFeedbackEvent(type: 'POSITIVE' | 'COMPLAINT' | 'CRITICAL' | 'SPAM' | 'MALFORMED', accountId: string, customText?: string) {
    const texts = {
      POSITIVE: 'Amazing service! Really loved the property.',
      COMPLAINT: 'The place was dirty and check-in was delayed. This is a formal complaint.',
      CRITICAL: 'I was threatened by the host. This is dangerous and fraud!',
      SPAM: 'Click here to win a free iphone http://spam.xyz',
      MALFORMED: ''
    };
    
    return {
      type: 'FEEDBACK',
      provider: 'MOCK',
      provider_feedback_id: `fb_mock_${Date.now()}_${Math.random()}`,
      social_account_id: accountId,
      feedback_type: 'COMMENT',
      raw_text: customText || texts[type],
    };
  }
}
