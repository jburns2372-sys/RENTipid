import { PrismaClient } from '@prisma/client';
import { SocialCommandLayer } from './src/lib/social/social-command-layer';

const prisma = new PrismaClient();

async function runTest() {
  console.log("Starting Phase 8 E2E Simulation...");
  try {
    // 1. Create a mock Provider & Admin
    const admin = await prisma.user.create({
      data: { email: `admin_p8_${Date.now()}@test.com`, full_name: 'Admin P8', account_type: 'Individual', role: 'Super Admin', status: 'Verified' }
    });
    
    const provider = await prisma.user.create({
      data: { email: `provider_p8_${Date.now()}@test.com`, full_name: 'Provider P8', account_type: 'Business', role: 'Business Provider', status: 'Verified' }
    });

    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Test Cat', slug: `test-cat-${Date.now()}`, risk_level: 'Low' }
      });
    }

    const listing = await prisma.listing.create({
      data: {
        provider_id: provider.id,
        category_id: category.id,
        title: 'Test Promo Listing',
        rental_type: 'Daily',
        status: 'Published'
      }
    });

    console.log("1. Provider requests promotion...");
    const campaign = await prisma.marketingCampaign.create({
      data: {
        campaign_name: `Promo for Listing: ${listing.title}`,
        campaign_type: 'Listing Promotion',
        campaign_goal: 'Listing Views',
        campaign_status: 'Pending Approval',
        approval_status: 'Pending Admin Approval',
        created_by_id: provider.id
      }
    });

    const post = await prisma.marketingPost.create({
      data: {
        campaign_id: campaign.id,
        listing_id: listing.id,
        provider_id: provider.id,
        platform: 'Facebook Page',
        caption: 'Check out this awesome listing! #rentipid',
        post_type: 'Text',
        post_status: 'Pending Approval',
        approval_status: 'Pending Admin Approval',
        created_by_id: provider.id
      }
    });

    console.log("2. Admin approves post...");
    await SocialCommandLayer.approvePost(post.id, admin.id, admin.role);

    console.log("3. Admin mock-publishes post...");
    await SocialCommandLayer.publishNow(post.id, admin.id);

    console.log("4. Verifying results...");
    const updatedPost = await prisma.marketingPost.findUnique({ where: { id: post.id }, include: { utmLinks: true, analytics: true } });
    
    if (updatedPost?.post_status !== 'Published Placeholder') throw new Error(`Post status is ${updatedPost?.post_status}, not Published Placeholder`);
    if (updatedPost.utmLinks.length === 0) throw new Error("UTM Link not generated");
    if (updatedPost.analytics.length === 0) throw new Error("Analytics placeholder not generated");

    const logs = await prisma.auditLog.findMany({ where: { target_id: post.id } });
    if (logs.length === 0) throw new Error("Audit logs not generated");

    console.log("E2E Validation Successful!");
    
  } catch (e) {
    console.error("E2E Failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
