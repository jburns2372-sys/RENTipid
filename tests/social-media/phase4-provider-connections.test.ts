import { PrismaClient } from '@prisma/client';
import { SocialProviderRegistry, SOCIAL_PLATFORMS, SocialPlatform } from '../../src/lib/social/social-platform-registry';
import { MockSocialAdapter } from '../../src/lib/social/social-adapters/mock-social-adapter';
import { MetaSocialAdapter } from '../../src/lib/social/social-adapters/meta/meta-social-adapter';
import { SocialAccountManager } from '../../src/lib/social/social-account-manager';

const prisma = new PrismaClient();

describe('Phase 4: Social Account / Provider Connections', () => {
  beforeAll(async () => {
    // Register adapters
    SocialProviderRegistry.register(new MockSocialAdapter());
    SocialProviderRegistry.register(new MetaSocialAdapter());
    // Clear test data
    await prisma.socialAccount.deleteMany();
  });

  afterEach(async () => {
    await prisma.socialAccount.deleteMany();
    // Reset mock state
    MockSocialAdapter.simulationState = {
      healthStatus: 'HEALTHY',
      connectionStatus: 'CONFIGURED',
      capabilities: ['accountConnection', 'healthCheck', 'publishText'],
      publishSuccess: true,
      publishDelayMs: 0,
      rateLimitRemaining: 100,
      idempotencyCache: new Map<string, string>(),
      credentialsValid: true
    };
  });

  describe('Registry & Capabilities', () => {
    it('resolves registered providers correctly', () => {
      const mockAdapter = SocialProviderRegistry.get(SOCIAL_PLATFORMS.MOCK);
      expect(mockAdapter).toBeDefined();
      expect(mockAdapter.platformId).toBe(SOCIAL_PLATFORMS.MOCK);
    });

    it('unsupported provider fails safely', () => {
      expect(() => SocialProviderRegistry.get('UNKNOWN_PLATFORM' as SocialPlatform)).toThrow('SOCIAL_PROVIDER_NOT_REGISTERED: UNKNOWN_PLATFORM');
    });

    it('capability discovery works', () => {
      const capabilities = SocialProviderRegistry.get(SOCIAL_PLATFORMS.MOCK).getCapabilities();
      expect(capabilities).toContain('publishText');
    });

    it('hasCapability resolves correctly', () => {
      expect(SocialProviderRegistry.hasCapability(SOCIAL_PLATFORMS.MOCK, 'publishText')).toBe(true);
      expect(SocialProviderRegistry.hasCapability(SOCIAL_PLATFORMS.MOCK, 'publishVideo')).toBe(false);
    });
  });

  describe('RBAC & Account Management', () => {
    it('unauthorized user cannot configure provider account', async () => {
      await expect(
        SocialAccountManager.registerAccount('Guest', {
          platform: SOCIAL_PLATFORMS.MOCK,
          accountName: 'Test',
          accountHandle: '@test',
          accountType: 'TestType'
        })
      ).rejects.toThrow('ACCESS_DENIED');
    });

    it('permitted administrator can manage accounts', async () => {
      const account = await SocialAccountManager.registerAccount('Super Admin', {
        platform: SOCIAL_PLATFORMS.MOCK,
        accountName: 'Test Admin',
        accountHandle: '@admin',
        accountType: 'TestType'
      });
      expect(account.id).toBeDefined();
      expect(account.connection_status).toBe('NOT_CONFIGURED');
    });
  });

  describe('Account State & Credentials', () => {
    it('configured account resolves securely without returning secrets', async () => {
      const account = await SocialAccountManager.registerAccount('Super Admin', {
        platform: SOCIAL_PLATFORMS.MOCK,
        accountName: 'Test',
        accountHandle: '@test',
        accountType: 'TestType'
      });

      const configured = await SocialAccountManager.configureAccount('Super Admin', account.id, 'secure_ref_123', ['read', 'write']);
      expect(configured.connection_status).toBe('CONFIGURED');
      expect(configured.credential_reference).toBe('secure_ref_123');
      // Verify no raw token fields were used for this (they remain null)
      expect(configured.access_token_encrypted).toBeNull();
    });

    it('disabled account is rejected during operations', async () => {
      const account = await SocialAccountManager.registerAccount('Super Admin', {
        platform: SOCIAL_PLATFORMS.MOCK,
        accountName: 'Test',
        accountHandle: '@test',
        accountType: 'TestType'
      });
      await SocialAccountManager.setAccountEnabled('Super Admin', account.id, false);
      
      await expect(SocialAccountManager.validateAccountHealth('Super Admin', account.id)).rejects.toThrow('ACCOUNT_DISABLED');
    });
  });

  describe('Health Simulation', () => {
    it('mock healthy state', async () => {
      const account = await SocialAccountManager.registerAccount('Super Admin', {
        platform: SOCIAL_PLATFORMS.MOCK,
        accountName: 'Test',
        accountHandle: '@test',
        accountType: 'TestType'
      });

      const health = await SocialAccountManager.validateAccountHealth('Super Admin', account.id);
      expect(health.health_status).toBe('HEALTHY');
    });

    it('mock degraded state', async () => {
      const account = await SocialAccountManager.registerAccount('Super Admin', {
        platform: SOCIAL_PLATFORMS.MOCK,
        accountName: 'Test',
        accountHandle: '@test',
        accountType: 'TestType'
      });

      MockSocialAdapter.simulationState.healthStatus = 'DEGRADED';
      const health = await SocialAccountManager.validateAccountHealth('Super Admin', account.id);
      expect(health.health_status).toBe('DEGRADED');
    });
    
    it('auth-required state sets correctly when connection validation fails', async () => {
      const account = await SocialAccountManager.registerAccount('Super Admin', {
        platform: SOCIAL_PLATFORMS.MOCK,
        accountName: 'Test',
        accountHandle: '@test',
        accountType: 'TestType'
      });

      MockSocialAdapter.simulationState.credentialsValid = false;
      const health = await SocialAccountManager.validateAccountHealth('Super Admin', account.id);
      expect(health.health_status).toBe('AUTH_REQUIRED');
    });
  });

  describe('Credential Lifecycle & Rate Limits', () => {
    it('simulates refresh success restoring health', async () => {
      const account = await SocialAccountManager.registerAccount('Super Admin', {
        platform: SOCIAL_PLATFORMS.MOCK,
        accountName: 'Test',
        accountHandle: '@test',
        accountType: 'TestType'
      });
      await SocialAccountManager.configureAccount('Super Admin', account.id, 'secure_ref_123', []);
      
      MockSocialAdapter.simulationState.healthStatus = 'AUTH_REQUIRED';
      const refreshed = await SocialAccountManager.refreshAccountCredentials('Super Admin', account.id);
      expect(refreshed.health_status).toBe('HEALTHY');
      expect(refreshed.token_expires_at).toBeDefined();
    });

    it('rate limit simulation returns normalized error', async () => {
      const adapter = SocialProviderRegistry.get(SOCIAL_PLATFORMS.MOCK);
      MockSocialAdapter.simulationState.healthStatus = 'RATE_LIMITED';
      const result = await adapter.publishPost({}, 'acc_1', 'key1');
      expect(result.success).toBe(false);
      expect(result.rateLimited).toBe(true);
    });
  });
  
  describe('Provider Events', () => {
    it('duplicate event ID remains idempotent', async () => {
      const adapter = SocialProviderRegistry.get(SOCIAL_PLATFORMS.MOCK);
      const res1 = await adapter.publishPost({}, 'acc_1', 'idemp_key_1');
      const res2 = await adapter.publishPost({}, 'acc_1', 'idemp_key_1');
      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res1.providerPostId).toBe(res2.providerPostId);
    });
    
    it('secrets are stripped during normalization', async () => {
      const adapter = SocialProviderRegistry.get(SOCIAL_PLATFORMS.MOCK);
      const event = await adapter.normalizeProviderEvent({
        type: 'comment',
        text: 'hello',
        token: 'secret_123',
        secret: 'hidden_key'
      });
      
      expect(event.normalizedPayload.token).toBeUndefined();
      expect(event.normalizedPayload.secret).toBeUndefined();
      expect(event.normalizedPayload.text).toBe('hello');
    });
  });
});
