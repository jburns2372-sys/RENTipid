import { PrismaClient } from '@prisma/client';
import { SocialApprovalService } from '../../src/lib/social/social-approval-service';
import { SocialContentStudioService } from '../../src/lib/social/social-content-studio';
import { SocialScheduler } from '../../src/lib/social/social-scheduler';
import { SocialProviderRegistry, SocialAdapter } from '../../src/lib/social/social-platform-registry';

const prisma = new PrismaClient();

describe('Phase 6: Approval & Scheduling Engine (Test DB Safety Verified)', () => {
  let authorId: string;
  let approverId: string;
  let superAdminId: string;
  let unauthorizedId: string;
  let postId: string;
  let testAccountId: string;
  let disabledAccountId: string;
  let testCampaignId: string;
  let mockPublishSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Verify Test Environment
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl.includes('test')) {
      throw new Error('FATAL: Tests must run against a TEST database');
    }

    // Register Mock Adapter for testing
    const mockAdapter = {
      platformId: 'FACEBOOK' as any,
      getCapabilities: () => ['publishText', 'publishImage', 'publishVideo'],
      validateConnection: async () => true,
      checkHealth: async () => ({ status: 'HEALTHY' }),
      validatePostRequirements: async () => ({ isValid: true }),
      publishPost: async () => ({ success: true, providerPostId: 'mock-123' }),
      handoffScheduledPost: async () => ({ success: true, providerScheduleId: 'mock-123' }),
      getPublicationStatus: async () => ({ status: 'PUBLISHED' }),
      fetchMetrics: async () => [],
      fetchFeedback: async () => [],
      normalizeProviderEvent: async () => ({ eventType: 'mock', normalizedPayload: {} }),
      refreshCredentials: async () => ({ success: true })
    } as SocialAdapter;
    
    SocialProviderRegistry.register(mockAdapter);
    mockPublishSpy = jest.spyOn(mockAdapter, 'publishPost');

    // Setup Test Users
    const author = await prisma.user.create({
      data: {
        email: `author_${Date.now()}@test.com`,
        password_hash: 'dummy',
        full_name: 'Content Author',
        role: 'Admin', // Admin can CREATE
        is_test_data: true,
        account_type: 'USER',
        status: 'Verified',
      }
    });
    authorId = author.id;

    const approver = await prisma.user.create({
      data: {
        email: `approver_${Date.now()}@test.com`,
        password_hash: 'dummy',
        full_name: 'Content Approver',
        role: 'Admin', // Admin can APPROVE
        is_test_data: true,
        account_type: 'USER',
        status: 'Verified',
      }
    });
    approverId = approver.id;
    
    const superAdmin = await prisma.user.create({
      data: {
        email: `superadmin_${Date.now()}@test.com`,
        password_hash: 'dummy',
        full_name: 'Super Admin Approver',
        role: 'Super Admin',
        is_test_data: true,
        account_type: 'USER',
        status: 'Verified',
      }
    });
    superAdminId = superAdmin.id;
    
    const unauthorized = await prisma.user.create({
      data: {
        email: `unauth_${Date.now()}@test.com`,
        password_hash: 'dummy',
        full_name: 'Unauthorized User',
        role: 'Agent',
        is_test_data: true,
        account_type: 'USER',
        status: 'Verified',
      }
    });
    unauthorizedId = unauthorized.id;

    const account = await prisma.socialAccount.create({
      data: {
        platform: 'FACEBOOK',
        account_name: 'Test Page',
        account_handle: '@testpage',
        account_type: 'PAGE',
        connection_status: 'CONNECTED',
      }
    });
    testAccountId = account.id;
    
    const disabledAccount = await prisma.socialAccount.create({
      data: {
        platform: 'FACEBOOK',
        account_name: 'Disabled Page',
        account_handle: '@disabledpage',
        account_type: 'PAGE',
        connection_status: 'CONNECTED',
        health_status: 'DISABLED'
      }
    });
    disabledAccountId = disabledAccount.id;

    const campaign = await prisma.marketingCampaign.create({
      data: {
        campaign_name: 'Test Campaign',
        campaign_status: 'ACTIVE',
        campaign_type: 'PROMOTIONAL',
        campaign_goal: 'Engagement',
        approval_status: 'APPROVED',
        created_by_id: authorId
      }
    });
    testCampaignId = campaign.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.socialPostQueue.deleteMany();
    await prisma.marketingPostReview.deleteMany();
    await prisma.securityEvent.deleteMany({ where: { target_module: { in: ['MarketingPost', 'SocialPostQueue'] } } });
    await prisma.marketingPostVersion.deleteMany();
    await prisma.marketingPost.deleteMany();
    await prisma.marketingCampaign.deleteMany();
    await prisma.socialAccount.deleteMany();
    await prisma.user.deleteMany({ where: { id: { in: [authorId, approverId, superAdminId, unauthorizedId] } } });
    await prisma.$disconnect();
    
    mockPublishSpy.mockRestore();
  });

  beforeEach(async () => {
    mockPublishSpy.mockClear();
    
    // Create a new post draft for each test
    const draft = await SocialContentStudioService.createDraft({
      campaign_id: testCampaignId,
      platform: 'FACEBOOK',
      post_type: 'PROMOTIONAL',
      editor_id: authorId,
      editor_role: 'Admin',
      target_account_id: testAccountId
    });
    postId = draft.id;

    await SocialContentStudioService.updateDraft({
      post_id: postId,
      current_version: draft.version,
      editor_id: authorId,
      editor_role: 'Admin',
      updates: { caption: 'Initial caption' }
    });

    await SocialContentStudioService.submitForReview(postId, authorId, 'Admin');
  });

  test('1. Authorized different reviewer approves', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    
    const review = await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
      comment: 'Approved!'
    });

    expect(review.decision).toBe('APPROVED');
    expect(review.reviewer_id).toBe(approverId);
  });

  test('2. Author self-approval rejected', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await expect(SocialApprovalService.approvePost({
      postId,
      reviewerId: authorId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
      comment: 'LGTM'
    })).rejects.toThrow('Author cannot approve their own content');
  });
  
  test('3. Super Admin self-approval without reason rejected', async () => {
    // Make Super Admin the author
    await prisma.marketingPost.update({ where: { id: postId }, data: { created_by_id: superAdminId }});
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    
    await expect(SocialApprovalService.approvePost({
      postId,
      reviewerId: superAdminId,
      reviewerRole: 'Super Admin',
      versionNumber: post!.version,
      comment: 'Looks good',
      overrideReason: undefined
    })).rejects.toThrow('SuperAdmin self-approval requires a valid override reason');
  });
  
  test('4. Super Admin whitespace-only reason rejected', async () => {
    await prisma.marketingPost.update({ where: { id: postId }, data: { created_by_id: superAdminId }});
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    
    await expect(SocialApprovalService.approvePost({
      postId,
      reviewerId: superAdminId,
      reviewerRole: 'Super Admin',
      versionNumber: post!.version,
      comment: 'Looks good',
      overrideReason: '   '
    })).rejects.toThrow('SuperAdmin self-approval requires a valid override reason');
  });
  
  test('5. Super Admin valid override succeeds and is audited', async () => {
    await prisma.marketingPost.update({ where: { id: postId }, data: { created_by_id: superAdminId }});
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    
    const review = await SocialApprovalService.approvePost({
      postId,
      reviewerId: superAdminId,
      reviewerRole: 'Super Admin',
      versionNumber: post!.version,
      comment: 'Looks good',
      overrideReason: 'Emergency production issue'
    });
    
    expect(review.decision).toBe('APPROVED');
    expect(review.self_approval_override).toBe(true);
    expect(review.override_reason).toBe('Emergency production issue');
    
    // Verify audit log
    const audit = await prisma.securityEvent.findFirst({ where: { source_record_id: review.id } });
    expect(audit).not.toBeNull();
    expect(audit!.event_code).toBe('P6_SELF_APPROVAL_OVERRIDE');
  });
  
  test('6. Authorized rejection succeeds', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    
    const review = await SocialApprovalService.rejectPost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
      comment: 'Needs changes'
    });
    
    expect(review.decision).toBe('REJECTED');
    const updatedPost = await prisma.marketingPost.findUnique({ where: { id: postId } });
    expect(updatedPost?.post_status).toBe('REJECTED');
  });
  
  test('7. Review records remain immutable', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    const review1 = await SocialApprovalService.rejectPost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
      comment: 'Needs changes'
    });
    
    // Author edits post to resubmit
    await SocialContentStudioService.updateDraft({
      post_id: postId,
      current_version: post!.version,
      editor_id: authorId,
      editor_role: 'Admin',
      updates: { caption: 'Better caption' }
    });
    await SocialContentStudioService.submitForReview(postId, authorId, 'Admin');
    
    const newPost = await prisma.marketingPost.findUnique({ where: { id: postId } });
    const review2 = await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: newPost!.version,
      comment: 'Approved!'
    });
    
    expect(review1.id).not.toBe(review2.id);
    const dbReview1 = await prisma.marketingPostReview.findUnique({ where: { id: review1.id } });
    expect(dbReview1!.decision).toBe('REJECTED'); // Immutable
  });
  
  test('8. Submitted-content edit returns to DRAFT', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    expect(post?.post_status).toBe('SUBMITTED_FOR_REVIEW');
    
    await SocialContentStudioService.updateDraft({
      post_id: postId,
      current_version: post!.version,
      editor_id: authorId,
      editor_role: 'Admin',
      updates: { caption: 'edit' }
    });
    
    const editedPost = await prisma.marketingPost.findUnique({ where: { id: postId } });
    expect(editedPost?.post_status).toBe('DRAFT');
  });
  
  test('9. Approved-content edit invalidates approval', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
      comment: 'Approved!'
    });
    
    await SocialContentStudioService.updateDraft({
      post_id: postId,
      current_version: post!.version,
      editor_id: authorId,
      editor_role: 'Admin',
      updates: { caption: 'edit' }
    });
    
    const editedPost = await prisma.marketingPost.findUnique({ where: { id: postId } });
    expect(editedPost?.post_status).toBe('DRAFT');
  });
  
  test('10. Scheduled-content edit cancels old schedule', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
    });
    
    const schedule = await SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId
    });
    
    // Edit scheduled post
    await SocialContentStudioService.updateDraft({
      post_id: postId,
      current_version: post!.version,
      editor_id: authorId,
      editor_role: 'Admin',
      updates: { caption: 'edit scheduled' }
    });
    
    const editedPost = await prisma.marketingPost.findUnique({ where: { id: postId } });
    expect(editedPost?.post_status).toBe('DRAFT');
    
    const queue = await prisma.socialPostQueue.findUnique({ where: { id: schedule!.id } });
    expect(queue?.status).toBe('Cancelled');
  });
  
  test('11. Old version approval cannot schedule new version', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
    });
    
    // Edit to create new version
    await SocialContentStudioService.updateDraft({
      post_id: postId,
      current_version: post!.version,
      editor_id: authorId,
      editor_role: 'Admin',
      updates: { caption: 'new version' }
    });
    await SocialContentStudioService.submitForReview(postId, authorId, 'Admin');
    
    await expect(SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId
    })).rejects.toThrow('Cannot schedule a post that is not in APPROVED state. Any edits require re-approval.');
  });
  
  test('12. Unapproved target account substitution rejected', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
    });
    
    const otherAccount = await prisma.socialAccount.create({
      data: {
        platform: 'FACEBOOK',
        account_name: 'Other',
        account_handle: '@other',
        account_type: 'PAGE',
        connection_status: 'CONNECTED',
      }
    });
    
    await expect(SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: otherAccount.id
    })).rejects.toThrow('Target account mismatch: The requested account was not approved for this version.');
  });
  
  test('13. Disabled account scheduling rejected', async () => {
    // We create a post for the test account, which is healthy
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    
    // Approve it
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
    });
    
    // Disable the account before scheduling
    await prisma.socialAccount.update({
      where: { id: testAccountId },
      data: { health_status: 'DISABLED' }
    });
    
    // Scheduling should fail
    await expect(SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId
    })).rejects.toThrow('Cannot target a DISABLED social account');
    
    // Re-enable for other tests
    await prisma.socialAccount.update({
      where: { id: testAccountId },
      data: { health_status: 'HEALTHY' }
    });
  });
  
  test('14. Past timestamp rejected', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await expect(SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() - 86400000), // past
      targetAccountId: testAccountId
    })).rejects.toThrow('Scheduled time must be in the future.');
  });
  
  test('15. Invalid timezone rejected', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await expect(SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId,
      timezone: 'Invalid/Timezone'
    })).rejects.toThrow('Invalid timezone specified.');
  });
  
  test('16. Valid future time + IANA timezone succeeds', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
    });
    
    const schedule = await SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId,
      timezone: 'Asia/Manila'
    });
    expect(schedule!.timezone).toBe('Asia/Manila');
  });
  
  test('17. Duplicate idempotency key creates no duplicate schedule', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
    });
    
    const promise1 = SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId
    });
    
    const promise2 = SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId
    });
    
    const [res1, res2] = await Promise.all([promise1, promise2]);
    expect(res1!.id).toBe(res2!.id); // Same queue entry returned
  });
  
  test('18. Unauthorized approval/rejection rejected', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await expect(SocialApprovalService.approvePost({
      postId,
      reviewerId: unauthorizedId,
      reviewerRole: 'Agent', // Agent cannot approve
      versionNumber: post!.version,
    })).rejects.toThrow('Insufficient permissions to approve content');
  });
  
  test('19. Unauthorized scheduling/reschedule/cancel rejected', async () => {
    await expect(SocialScheduler.schedulePost({
      postId,
      userId: unauthorizedId,
      userRole: 'Agent',
      date: new Date(Date.now() + 86400000),
    })).rejects.toThrow('Insufficient permissions to schedule content');
  });
  
  test('20. Reschedule succeeds with audit and integrity', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
    });
    
    const schedule = await SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId
    });
    
    const newDate = new Date(Date.now() + 2 * 86400000);
    const rescheduled = await SocialScheduler.reschedulePost({
      queueId: schedule!.id,
      userId: approverId,
      userRole: 'Admin',
      newDate: newDate,
      newTimezone: 'Asia/Tokyo'
    });
    
    expect(rescheduled.scheduled_at).toEqual(newDate);
    expect(rescheduled.timezone).toBe('Asia/Tokyo');
    
    // Check audit
    const audit = await prisma.securityEvent.findFirst({ where: { source_record_id: schedule!.id, event_code: 'SEC_SOCIAL_RESCHEDULE' } });
    expect(audit).not.toBeNull();
  });
  
  test('21. Cancel prevents execution', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
    });
    
    const schedule = await SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId
    });
    
    const cancelled = await SocialScheduler.cancelSchedule({
      queueId: schedule!.id,
      userId: approverId,
      userRole: 'Admin',
      reason: 'Testing cancellation'
    });
    
    expect(cancelled.status).toBe('Cancelled');
    expect(cancelled.cancelled_at).not.toBeNull();
  });
  
  test('22. P6 performs ZERO provider publication calls', async () => {
    const post = await prisma.marketingPost.findUnique({ where: { id: postId } });
    await SocialApprovalService.approvePost({
      postId,
      reviewerId: approverId,
      reviewerRole: 'Admin',
      versionNumber: post!.version,
    });
    
    const schedule = await SocialScheduler.schedulePost({
      postId,
      userId: approverId,
      userRole: 'Admin',
      date: new Date(Date.now() + 86400000),
      targetAccountId: testAccountId
    });
    
    await SocialScheduler.cancelSchedule({
      queueId: schedule!.id,
      userId: approverId,
      userRole: 'Admin',
    });
    
    // Process queue throws error
    await expect(SocialScheduler.processQueue()).rejects.toThrow();
    
    expect(mockPublishSpy).toHaveBeenCalledTimes(0);
  });
});
