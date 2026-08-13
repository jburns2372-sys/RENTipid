import { PrismaClient } from '@prisma/client';
import { SocialCampaignService, CAMPAIGN_STATUS } from '../../src/lib/social/social-campaign-service';
import { SOCIAL_PERMISSIONS } from '../../src/lib/social/social-permissions';

const prisma = new PrismaClient();

describe('Phase 8 - Campaign Management', () => {
  let authorizedUserId: string;
  let unauthorizedUserId: string;
  let testCampaignId: string;
  let testListingId: string;
  let testProviderId: string;
  let testAccountId: string;
  let testPostId: string;

  beforeAll(async () => {
    // Clean up campaign-specific records
    await prisma.campaignListingLink.deleteMany();
    await prisma.campaignTargetAccount.deleteMany();
    await prisma.marketingPost.deleteMany();
    await prisma.marketingCampaign.deleteMany();

    const suffix = Date.now().toString();
    // Create Authorized User
    const authUser = await prisma.user.create({
      data: {
        email: `campaign_admin_${suffix}@test.com`,
        full_name: 'Admin User',
        account_type: 'PROVIDER',
        role: 'Admin',
        status: 'ACTIVE'
      }
    });
    authorizedUserId = authUser.id;

    // Create Unauthorized User
    const unauthUser = await prisma.user.create({
      data: {
        email: `guest_${suffix}@test.com`,
        full_name: 'Guest User',
        account_type: 'PROVIDER',
        role: 'USER',
        status: 'ACTIVE'
      }
    });
    unauthorizedUserId = unauthUser.id;

    // Create Provider & Listing
    const provider = await prisma.user.create({
      data: { email: `provider_${suffix}@test.com`, full_name: 'Pro Vider', account_type: 'PROVIDER', role: 'USER', status: 'ACTIVE' }
    });
    testProviderId = provider.id;

    const category = await prisma.category.create({ data: { name: `Test Category ${suffix}`, slug: `test-cat-${suffix}`, risk_level: 'LOW' } });
    
    const listing = await prisma.listing.create({
      data: {
        provider_id: provider.id,
        category_id: category.id,
        title: 'Test Listing',
        description: 'Test',
        status: 'ACTIVE',
        rental_type: 'SHORT_TERM'
      }
    });
    testListingId = listing.id;

    // Target Account
    const account = await prisma.socialAccount.create({
      data: {
        owner: { connect: { id: provider.id } },
        platform: 'Mock Social Network',
        account_name: 'Mock Test Account',
        account_handle: '@mocktest',
        account_type: 'BUSINESS',
        connection_status: 'CONNECTED'
      }
    });
    testAccountId = account.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('1. Authorized campaign creation', async () => {
    const campaign = await SocialCampaignService.createCampaign(authorizedUserId, {
      campaign_name: 'Test Campaign',
      campaign_goal: 'Test Goal'
    });
    expect(campaign.id).toBeTruthy();
    expect(campaign.campaign_status).toBe(CAMPAIGN_STATUS.DRAFT);
    testCampaignId = campaign.id;

    const audit = await prisma.auditLog.findFirst({ where: { action: 'CREATE_CAMPAIGN', target_id: campaign.id }});
    expect(audit).toBeTruthy();
  });

  test('2. Unauthorized creation rejected', async () => {
    await expect(SocialCampaignService.createCampaign(unauthorizedUserId, {
      campaign_name: 'Test Campaign',
      campaign_goal: 'Test Goal'
    })).rejects.toThrow('Unauthorized');
  });

  test('3. Invalid date range rejected', async () => {
    await expect(SocialCampaignService.createCampaign(authorizedUserId, {
      campaign_name: 'Bad Dates',
      campaign_goal: 'Test Goal',
      start_date: new Date('2026-08-15'),
      end_date: new Date('2026-08-10')
    })).rejects.toThrow('Invalid date range');
  });

  test('4. Campaign update works in editable state', async () => {
    const updated = await SocialCampaignService.updateCampaign(authorizedUserId, testCampaignId, {
      campaign_name: 'Updated Name'
    });
    expect(updated.campaign_name).toBe('Updated Name');
  });

  test('5. Invalid lifecycle transition rejected', async () => {
    await expect(SocialCampaignService.pauseCampaign(authorizedUserId, testCampaignId)).rejects.toThrow('Can only pause ACTIVE campaigns');
  });

  test('6. Activate valid campaign', async () => {
    const activated = await SocialCampaignService.activateCampaign(authorizedUserId, testCampaignId);
    expect(activated.campaign_status).toBe(CAMPAIGN_STATUS.ACTIVE);
  });

  test('7. Pause active campaign', async () => {
    const paused = await SocialCampaignService.pauseCampaign(authorizedUserId, testCampaignId);
    expect(paused.campaign_status).toBe(CAMPAIGN_STATUS.PAUSED);
  });

  test('8. Complete campaign', async () => {
    const completed = await SocialCampaignService.completeCampaign(authorizedUserId, testCampaignId);
    expect(completed.campaign_status).toBe(CAMPAIGN_STATUS.COMPLETED);
  });

  test('9. Archive completed campaign', async () => {
    const archived = await SocialCampaignService.archiveCampaign(authorizedUserId, testCampaignId);
    expect(archived.campaign_status).toBe(CAMPAIGN_STATUS.ARCHIVED);
  });

  test('10. Archived campaign protected from normal edits', async () => {
    await expect(SocialCampaignService.updateCampaign(authorizedUserId, testCampaignId, {
      campaign_name: 'Hacked'
    })).rejects.toThrow('Cannot edit a completed or archived campaign');
  });

  test('13. Listing association validated & 14. Provider consent enforced', async () => {
    const newCamp = await SocialCampaignService.createCampaign(authorizedUserId, { campaign_name: 'C2', campaign_goal: 'G2' });
    
    // No consent
    await expect(SocialCampaignService.addListing(authorizedUserId, newCamp.id, testListingId)).rejects.toThrow('Provider consent required');

    // Give consent
    await prisma.providerPromotionOptIn.create({
      data: {
        provider_id: testProviderId,
        listing_id: testListingId,
        allow_platform_promotion: true,
        allow_ai_generated_content: true,
        allow_paid_ads_placeholder: false,
        allow_global_promotion: true,
        allowed_platforms: 'Mock Social Network'
      }
    });

    // Now it should work
    await SocialCampaignService.addListing(authorizedUserId, newCamp.id, testListingId);
    const summary = await SocialCampaignService.getCampaignSummary(authorizedUserId, newCamp.id);
    expect(summary.listings.length).toBe(1);
    expect(summary.listings[0].listing_id).toBe(testListingId);
  });

  test('15. Disabled account rejected', async () => {
    const newCamp = await SocialCampaignService.createCampaign(authorizedUserId, { campaign_name: 'C3', campaign_goal: 'G3' });
    
    // Disable account
    await prisma.socialAccount.update({ where: { id: testAccountId }, data: { connection_status: 'DISCONNECTED' } });

    await expect(SocialCampaignService.addTargetAccount(authorizedUserId, newCamp.id, testAccountId)).rejects.toThrow('Target account is disabled or disconnected');
  });

});
