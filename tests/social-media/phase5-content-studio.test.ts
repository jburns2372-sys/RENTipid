import { PrismaClient } from '@prisma/client';
import { SocialContentStudioService } from '../../src/lib/social/social-content-studio';
import { SocialAIAssistant } from '../../src/lib/social/social-ai-assistant';
import { SocialProviderRegistry, SOCIAL_PLATFORMS } from '../../src/lib/social/social-platform-registry';
import { MockSocialAdapter } from '../../src/lib/social/social-adapters/mock-social-adapter';

const prisma = new PrismaClient();

describe('Phase 5 - Content Studio & Media Foundation', () => {
  let adminId: string;
  let providerId: string;
  let listingId: string;
  let campaignId: string;
  let accountId: string;
  let categoryId: string;

  beforeAll(async () => {
    // Setup Admin
    const admin = await prisma.user.create({
      data: {
        email: `admin-p5-${Date.now()}@rentipid.local`,
        password_hash: 'hash',
        full_name: 'Admin P5',
        role: 'Admin',
        account_type: 'Individual',
        status: 'Verified',
      },
    });
    adminId = admin.id;

    // Setup Provider
    const provider = await prisma.user.create({
      data: {
        email: `provider-p5-${Date.now()}@rentipid.local`,
        password_hash: 'hash',
        full_name: 'Provider P5',
        role: 'Business Provider',
        account_type: 'Business',
        status: 'Verified',
      },
    });
    providerId = provider.id;
    // Setup Category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: `test-cat-${Date.now()}`,
        description: 'Cat desc',
        is_active: true,
        risk_level: 'LOW',
      }
    });
    categoryId = category.id;

    // Setup Listing
    const listing = await prisma.listing.create({
      data: {
        provider: { connect: { id: providerId } },
        category: { connect: { id: categoryId } },
        title: 'Test Listing P5',
        description: 'Desc',
        rental_type: 'DAILY',
        daily_rate: 100,
        status: 'PUBLISHED',
      },
    });
    listingId = listing.id;

    // Setup Campaign
    const campaign = await prisma.marketingCampaign.create({
      data: {
        created_by_id: adminId,
        campaign_name: 'P5 Test Campaign',
        campaign_type: 'SOCIAL',
        campaign_goal: 'AWARENESS',
        campaign_status: 'DRAFT',
        approval_status: 'PENDING',
      },
    });
    campaignId = campaign.id;

    // Setup Mock Social Account via Registry
    SocialProviderRegistry.register(new MockSocialAdapter());

    const account = await prisma.socialAccount.create({
      data: {
        platform: SOCIAL_PLATFORMS.MOCK,
        account_name: 'Test Mock Account',
        account_handle: 'mock_test',
        account_type: 'BUSINESS',
        connection_status: 'LIVE_READY',
        health_status: 'HEALTHY',
      },
    });
    accountId = account.id;

    // Setup Promotion Opt-In
    await prisma.providerPromotionOptIn.create({
      data: {
        provider_id: providerId,
        listing_id: listingId,
        allow_platform_promotion: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.marketingPostVersion.deleteMany();
    await prisma.marketingPost.deleteMany();
    await prisma.providerPromotionOptIn.deleteMany();
    await prisma.marketingCampaign.deleteMany();
    await prisma.socialAccount.deleteMany();
    await prisma.listing.deleteMany({ where: { title: { in: ['Test Listing P5', 'Unopted Listing'] } } });
    if (adminId || providerId) await prisma.user.deleteMany({
      where: { id: { in: [adminId, providerId] } },
    });
    if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
    await prisma.$disconnect();
  });

  it('allows authorized user to create draft and records initial version snapshot', async () => {
    const draft = await SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      listing_id: listingId,
      provider_id: providerId,
      platform: 'MOCK',
      post_type: 'PROMO',
      caption: 'Initial Draft Caption',
      target_account_id: accountId,
      editor_id: adminId,
      editor_role: 'Admin',
    });

    expect(draft.post_status).toBe('DRAFT');
    expect(draft.version).toBe(1);
    expect(draft.caption).toBe('Initial Draft Caption');

    // Check version row created
    const versions = await prisma.marketingPostVersion.findMany({ where: { post_id: draft.id } });
    expect(versions).toHaveLength(1);
    expect(versions[0].version_number).toBe(1);
    expect(versions[0].change_reason).toBe('Initial draft created');
  });

  it('rejects draft creation if provider has NOT opted in', async () => {
    const unoptedListing = await prisma.listing.create({
      data: {
        provider: { connect: { id: providerId } },
        category: { connect: { id: categoryId } },
        title: 'Unopted Listing',
        description: 'Desc',
        rental_type: 'DAILY',
        daily_rate: 100,
        status: 'PUBLISHED',
      },
    });

    await expect(SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      listing_id: unoptedListing.id,
      provider_id: providerId,
      platform: 'MOCK',
      post_type: 'PROMO',
      caption: 'Initial Draft Caption',
      editor_id: adminId,
      editor_role: 'Admin',
    })).rejects.toThrow('Provider has not opted in to platform promotion for this listing.');
  });

  it('rejects unauthorized creation', async () => {
    await expect(SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      platform: 'MOCK',
      post_type: 'PROMO',
      caption: 'Hacked caption',
      editor_id: providerId,
      editor_role: 'Renter',
    })).rejects.toThrow('Unauthorized: missing social.create permission');
  });

  it('safely handles optimistic concurrency update', async () => {
    const draft = await SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      platform: 'MOCK',
      post_type: 'PROMO',
      caption: 'Before Edit',
      editor_id: adminId,
      editor_role: 'Admin',
    });

    // Valid update
    const updated = await SocialContentStudioService.updateDraft({
      post_id: draft.id,
      current_version: draft.version,
      editor_id: adminId,
      editor_role: 'Admin',
      updates: { caption: 'After Edit' },
      save_snapshot: true,
      change_reason: 'Edited caption',
    });

    expect(updated.version).toBe(2);
    expect(updated.caption).toBe('After Edit');

    // Stale update (using old version 1)
    await expect(SocialContentStudioService.updateDraft({
      post_id: draft.id,
      current_version: draft.version, // stale
      editor_id: adminId,
      editor_role: 'Admin',
      updates: { caption: 'Stale Edit' },
    })).rejects.toThrow('Optimistic concurrency error: The draft was modified by someone else. Please refresh and try again.');

    // Check version table
    const versions = await prisma.marketingPostVersion.findMany({ where: { post_id: draft.id }, orderBy: { version_number: 'asc' } });
    expect(versions).toHaveLength(2); // v1 and v2
    expect(versions[1].content_snapshot).toBe('After Edit');
    expect(versions[1].change_reason).toBe('Edited caption');
  });

  it('submits for review and blocks further draft edits', async () => {
    const draft = await SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      platform: 'MOCK',
      post_type: 'PROMO',
      caption: 'Ready for review',
      editor_id: adminId,
      editor_role: 'Admin',
    });

    const submitted = await SocialContentStudioService.submitForReview(draft.id, adminId, 'Admin');
    expect(submitted.post_status).toBe('SUBMITTED_FOR_REVIEW');

    // Try to edit now
    await expect(SocialContentStudioService.updateDraft({
      post_id: draft.id,
      current_version: submitted.version,
      editor_id: adminId,
      editor_role: 'Admin',
      updates: { caption: 'Edit after submit' },
    })).rejects.toThrow('Cannot edit post that is not in DRAFT state');
  });

  it('unified AI assistant boundary enforces SUGGESTED CONTENT', async () => {
    const suggestion = await SocialAIAssistant.draftSocialContent(listingId, 'Make it catchy');
    expect(suggestion).toContain('[SUGGESTED CONTENT]');
    expect(suggestion).toContain('Additional Instructions: Make it catchy');
    expect(suggestion).toContain('[Mock] Listing ' + listingId + ' is active');
  });

  it('blocks targeting disabled accounts', async () => {
    const disabledAccount = await prisma.socialAccount.create({
      data: {
        platform: SOCIAL_PLATFORMS.MOCK,
        account_name: 'Test Disabled Account',
        account_handle: 'mock_disabled',
        account_type: 'BUSINESS',
        connection_status: 'DISABLED',
        health_status: 'DISABLED',
      },
    });

    await expect(SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      platform: 'MOCK',
      post_type: 'PROMO',
      target_account_id: disabledAccount.id,
      editor_id: adminId,
      editor_role: 'Admin',
    })).rejects.toThrow('Cannot target a DISABLED social account');
  });

  it('rejects invalid campaign and listing IDs', async () => {
    await expect(SocialContentStudioService.createDraft({
      campaign_id: 'invalid-camp',
      platform: SOCIAL_PLATFORMS.MOCK,
      post_type: 'PROMO',
      editor_id: adminId,
      editor_role: 'Admin',
    })).rejects.toThrow('Invalid campaign');

    await expect(SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      listing_id: 'invalid-list',
      platform: SOCIAL_PLATFORMS.MOCK,
      post_type: 'PROMO',
      editor_id: adminId,
      editor_role: 'Admin',
    })).rejects.toThrow('Invalid listing');
  });

  it('rejects path traversal and absolute paths in media_reference', async () => {
    await expect(SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      platform: SOCIAL_PLATFORMS.MOCK,
      post_type: 'PROMO',
      media_reference: '../uploads/secret.txt',
      editor_id: adminId,
      editor_role: 'Admin',
    })).rejects.toThrow('Invalid media reference: Path traversal or absolute paths are not permitted.');
    
    await expect(SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      platform: SOCIAL_PLATFORMS.MOCK,
      post_type: 'PROMO',
      media_reference: 'C:\\Windows\\System32\\cmd.exe',
      editor_id: adminId,
      editor_role: 'Admin',
    })).rejects.toThrow('Invalid media reference: Path traversal or absolute paths are not permitted.');
  });

  it('rejects arbitrary external URLs outside RENTipid namespace', async () => {
    await expect(SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      platform: SOCIAL_PLATFORMS.MOCK,
      post_type: 'PROMO',
      media_reference: 'https://evil.example.com/malware.exe',
      editor_id: adminId,
      editor_role: 'Admin',
    })).rejects.toThrow('Invalid media reference: Must belong to RENTipid storage namespace.');
  });

  it('generates AuditLog events for DRAFT_CREATED and DRAFT_SUBMITTED', async () => {
    const draft = await SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      platform: SOCIAL_PLATFORMS.MOCK,
      post_type: 'PROMO',
      caption: 'Audit Test Draft',
      editor_id: adminId,
      editor_role: 'Admin',
    });

    const createLog = await prisma.auditLog.findFirst({
      where: { target_id: draft.id, action: 'DRAFT_CREATED' }
    });
    expect(createLog).toBeDefined();
    expect(createLog?.actor_user_id).toBe(adminId);
    expect(createLog?.module).toBe('SOCIAL_CONTENT_STUDIO');

    await SocialContentStudioService.submitForReview(draft.id, adminId, 'Admin');
    const submitLog = await prisma.auditLog.findFirst({
      where: { target_id: draft.id, action: 'DRAFT_SUBMITTED' }
    });
    expect(submitLog).toBeDefined();
    expect(submitLog?.actor_user_id).toBe(adminId);
  });
});
