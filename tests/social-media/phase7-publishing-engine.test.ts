import { PrismaClient } from '@prisma/client';
import { SocialPublishingEngine } from '../../src/lib/social/social-publishing-engine';
import { MockSocialAdapter } from '../../src/lib/social/social-adapters/mock-social-adapter';
import { SocialProviderRegistry, SOCIAL_PLATFORMS } from '../../src/lib/social/social-platform-registry';

const prisma = new PrismaClient();

describe('Phase 7 - Social Publishing Engine', () => {

  let testCampaignId: string;
  let testAccountId: string;
  let testUserId: string;

  beforeAll(async () => {
    SocialProviderRegistry.register(new MockSocialAdapter());

    // 1. Setup shared data (User, Campaign, Account)
    const user = await prisma.user.create({
      data: {
        email: 'p7_engine_test@example.com',
        password_hash: 'hash',
        role: 'Marketing',
        full_name: 'P7 Engine Test User',
        account_type: 'PROVIDER',
        status: 'ACTIVE'
      }
    });
    testUserId = user.id;

    const campaign = await prisma.marketingCampaign.create({
      data: {
        created_by_id: user.id,
        campaign_name: 'P7 Publisher Test Campaign',
        campaign_type: 'PROMOTION',
        campaign_goal: 'AWARENESS',
        campaign_status: 'ACTIVE',
        approval_status: 'APPROVED',
        is_test_data: true
      }
    });
    testCampaignId = campaign.id;

    const account = await prisma.socialAccount.create({
      data: {
        owner_user_id: user.id,
        platform: SOCIAL_PLATFORMS.MOCK,
        account_name: 'Mock Test Account',
        account_handle: '@mocktest',
        account_type: 'BUSINESS',
        connection_status: 'CONNECTED',
        health_status: 'HEALTHY'
      }
    });
    testAccountId = account.id;

    // Reset setting if any
    await prisma.systemSetting.deleteMany({ where: { setting_key: 'SOCIAL_EMERGENCY_STOP' } });
  });

  afterAll(async () => {
    await prisma.systemSetting.deleteMany({ where: { setting_key: 'SOCIAL_EMERGENCY_STOP' } });
    await prisma.auditLog.deleteMany({ where: { action: 'SEC_SOCIAL_PUBLISHED' } });
    await prisma.socialPublicationAttempt.deleteMany();
    await prisma.socialPostQueue.deleteMany();
    await prisma.marketingPostReview.deleteMany();
    await prisma.marketingPostVersion.deleteMany();
    await prisma.marketingPost.deleteMany({ where: { campaign_id: testCampaignId } });
    await prisma.socialAccount.deleteMany({ where: { id: testAccountId } });
    await prisma.marketingCampaign.deleteMany({ where: { id: testCampaignId } });
    try { await prisma.user.deleteMany({ where: { id: testUserId } }); } catch(e) {}
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset mock adapter state
    MockSocialAdapter.simulationState.publishSuccess = true;
    MockSocialAdapter.simulationState.publishDelayMs = 0;
    MockSocialAdapter.simulationState.rateLimitRemaining = 100;
    MockSocialAdapter.simulationState.healthStatus = 'HEALTHY';
    MockSocialAdapter.simulationState.credentialsValid = true;
    MockSocialAdapter.simulationState.idempotencyCache.clear();
  });

  async function createTestQueue(scheduledAt: Date, status: string = 'Pending') {
    const post = await prisma.marketingPost.create({
      data: {
        campaign_id: testCampaignId,
        platform: SOCIAL_PLATFORMS.MOCK,
        post_type: 'STANDARD',
        post_status: 'SCHEDULED',
        approval_status: 'APPROVED',
        scheduled_at: scheduledAt
      }
    });

    const version = await prisma.marketingPostVersion.create({
      data: {
        post_id: post.id,
        version_number: 1,
        content_snapshot: 'Test post',
        target_account_id: testAccountId,
        editor_id: testUserId
      }
    });

    const queue = await prisma.socialPostQueue.create({
      data: {
        post_id: post.id,
        approved_version_id: version.id,
        target_account_id: testAccountId,
        platform: SOCIAL_PLATFORMS.MOCK,
        status: status,
        scheduled_at: scheduledAt,
        idempotency_key: `test_queue_${post.id}`
      }
    });

    return { post, version, queue };
  }

  test('1. Valid due item publishes and persists success', async () => {
    const { queue, post } = await createTestQueue(new Date(Date.now() - 1000));
    
    await SocialPublishingEngine.processDuePublications();
    
    const updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: true }});
    console.log("UPDATED QUEUE:", JSON.stringify(updatedQueue, null, 2));
    expect(updatedQueue?.status).toBe('Success');
    expect(updatedQueue?.processed_at).toBeTruthy();
    expect(updatedQueue?.publication_attempts.length).toBe(1);
    expect(updatedQueue?.publication_attempts[0].status).toBe('SUCCEEDED');
    expect(updatedQueue?.publication_attempts[0].provider_post_id).toBeTruthy();

    const updatedPost = await prisma.marketingPost.findUnique({ where: { id: post.id }});
    expect(updatedPost?.post_status).toBe('PUBLISHED');
  });

  test('2. Future queue does not publish', async () => {
    const { queue } = await createTestQueue(new Date(Date.now() + 60000)); // Future
    
    await SocialPublishingEngine.processDuePublications();
    
    const updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: true }});
    expect(updatedQueue?.status).toBe('Pending');
    expect(updatedQueue?.publication_attempts.length).toBe(0);
  });

  test('3. Cancelled queue does not publish', async () => {
    const { queue } = await createTestQueue(new Date(Date.now() - 1000));
    await prisma.socialPostQueue.update({ where: { id: queue.id }, data: { cancelled_at: new Date() } });
    
    await SocialPublishingEngine.processDuePublications();
    
    const updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: true }});
    expect(updatedQueue?.status).toBe('Pending'); // Shouldn't even be processed, status untouched by engine
    expect(updatedQueue?.publication_attempts.length).toBe(0);
  });

  test('4. Rate limit respects retry timing and transitions to FAILED_RETRYABLE', async () => {
    const { queue } = await createTestQueue(new Date(Date.now() - 1000));
    MockSocialAdapter.simulationState.healthStatus = 'RATE_LIMITED';

    await SocialPublishingEngine.processDuePublications();

    let updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: true }});
    expect(updatedQueue?.status).toBe('Pending'); // Engine reverted queue to Pending for the next cycle
    expect(updatedQueue?.publication_attempts[0].status).toBe('FAILED_RETRYABLE');
    expect(updatedQueue?.publication_attempts[0].is_retryable).toBe(true);
    expect(updatedQueue?.publication_attempts[0].next_retry_at?.getTime()).toBeGreaterThan(Date.now());
  });

  test('5. Retry does not execute before next_retry_at', async () => {
    const { queue } = await createTestQueue(new Date(Date.now() - 1000));
    MockSocialAdapter.simulationState.healthStatus = 'RATE_LIMITED';

    await SocialPublishingEngine.processDuePublications();
    
    // Now make it healthy, but run engine immediately (before next_retry_at)
    MockSocialAdapter.simulationState.healthStatus = 'HEALTHY';
    await SocialPublishingEngine.processDuePublications();

    let updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: true }});
    expect(updatedQueue?.publication_attempts.length).toBe(1); // Still 1 attempt
    expect(updatedQueue?.publication_attempts[0].status).toBe('FAILED_RETRYABLE'); // Didn't retry yet
  });

  test('6. Terminal failure avoids retries (Invalid credentials)', async () => {
    const { queue } = await createTestQueue(new Date(Date.now() - 1000));
    MockSocialAdapter.simulationState.credentialsValid = false;
    MockSocialAdapter.simulationState.healthStatus = 'UNAVAILABLE';
    MockSocialAdapter.simulationState.publishSuccess = false;

    await SocialPublishingEngine.processDuePublications();

    const updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: true }});
    expect(updatedQueue?.status).toBe('Failed');
    expect(updatedQueue?.publication_attempts[0].status).toBe('FAILED_FINAL');
    expect(updatedQueue?.publication_attempts[0].is_retryable).toBe(false);
  });

  test('7. Post-acceptance timeout simulates ambiguity safely', async () => {
    const { queue } = await createTestQueue(new Date(Date.now() - 1000));
    
    // Mock the adapter to throw an error simulating a timeout AFTER creating the post
    jest.spyOn(MockSocialAdapter.prototype, 'publishPost').mockRejectedValueOnce(new Error('Connection Timeout'));

    await SocialPublishingEngine.processDuePublications();

    const updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: true }});
    expect(updatedQueue?.status).toBe('Pending'); // Engine reverted to Pending
    expect(updatedQueue?.publication_attempts.length).toBe(1);
    expect(updatedQueue?.publication_attempts[0].status).toBe('FAILED_RETRYABLE');

    // Simulate time passing by manually bypassing next_retry_at logic to force retry
    await prisma.socialPublicationAttempt.update({
      where: { id: updatedQueue!.publication_attempts[0].id },
      data: { next_retry_at: new Date(Date.now() - 1000) }
    });

    // Run again, it should use the SAME logical publication key, and Mock adapter should (if implemented) handle it idempotently
    await SocialPublishingEngine.processDuePublications();

    const finalQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: { orderBy: { attempt_number: 'asc' } } }});
    expect(finalQueue?.status).toBe('Success');
    expect(finalQueue?.publication_attempts.length).toBe(2);
    expect(finalQueue?.publication_attempts[1].status).toBe('SUCCEEDED');
    
    jest.restoreAllMocks();
  });

  test('8. Emergency stop blocks publication', async () => {
    const { queue } = await createTestQueue(new Date(Date.now() - 1000));
    
    await prisma.systemSetting.create({
      data: { setting_key: 'SOCIAL_EMERGENCY_STOP', setting_value: 'true' }
    });

    await SocialPublishingEngine.processDuePublications();

    const updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: true }});
    expect(updatedQueue?.status).toBe('Pending');
    expect(updatedQueue?.publication_attempts.length).toBe(0); // Never even attempted

    await prisma.systemSetting.deleteMany({ where: { setting_key: 'SOCIAL_EMERGENCY_STOP' } });
  });

  test('9. Manual retry succeeds safely on FAILED_FINAL', async () => {
    const { queue } = await createTestQueue(new Date(Date.now() - 1000));
    
    // Force a failure
    MockSocialAdapter.simulationState.healthStatus = 'UNAVAILABLE'; // Make it fail
    MockSocialAdapter.simulationState.publishSuccess = false;
    await SocialPublishingEngine.processDuePublications();

    let updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }});
    expect(updatedQueue?.status).toBe('Failed');

    // Restore health
    MockSocialAdapter.simulationState.healthStatus = 'HEALTHY';
    MockSocialAdapter.simulationState.publishSuccess = true;
    MockSocialAdapter.simulationState.credentialsValid = true;
    
    // Trigger Manual Retry
    await SocialPublishingEngine.triggerManualRetry(queue.id, testUserId, 'Super Admin');

    const finalQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: { orderBy: { attempt_number: 'asc' } } }});
    expect(finalQueue?.status).toBe('Success');
    expect(finalQueue?.publication_attempts.length).toBe(2);
    expect(finalQueue?.publication_attempts[1].status).toBe('SUCCEEDED');
    expect(finalQueue?.publication_attempts[1].attempt_number).toBe(2);
  });

  test('10. Bounded retries terminate after MAX_RETRIES', async () => {
    const { queue } = await createTestQueue(new Date(Date.now() - 1000));
    MockSocialAdapter.simulationState.healthStatus = 'RATE_LIMITED'; // Causes FAILED_RETRYABLE

    // We will loop through the max retries (3)
    for (let i = 0; i < 4; i++) {
      // Force next_retry_at to past so it picks it up
      const latestAttempt = await prisma.socialPublicationAttempt.findFirst({
        where: { queue_id: queue.id },
        orderBy: { attempt_number: 'desc' }
      });

      if (latestAttempt && latestAttempt.next_retry_at) {
        await prisma.socialPublicationAttempt.update({
          where: { id: latestAttempt.id },
          data: { next_retry_at: new Date(Date.now() - 1000) }
        });
      }

      await SocialPublishingEngine.processDuePublications();
    }

    const finalQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: { orderBy: { attempt_number: 'asc' } } }});
    expect(finalQueue?.status).toBe('Failed'); // 4th attempt exceeded max retries -> FAILED_FINAL
    const last = finalQueue?.publication_attempts[finalQueue!.publication_attempts.length - 1];
    expect(last?.status).toBe('FAILED_FINAL');
  });

  test('11. Disabled account rejected', async () => {
    // Disable the account
    await prisma.socialAccount.update({ where: { id: testAccountId }, data: { health_status: 'DISABLED' } });
    
    const { queue } = await createTestQueue(new Date(Date.now() - 1000));
    
    await SocialPublishingEngine.processDuePublications();
    
    const updatedQueue = await prisma.socialPostQueue.findUnique({ where: { id: queue.id }, include: { publication_attempts: true }});
    expect(updatedQueue?.status).toBe('Failed');
    expect(updatedQueue?.publication_attempts[0].status).toBe('FAILED_FINAL');

    // Re-enable
    await prisma.socialAccount.update({ where: { id: testAccountId }, data: { health_status: 'HEALTHY' } });
  });

});
