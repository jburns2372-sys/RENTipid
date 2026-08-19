import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const RUN_ID = `SOC_P6_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
const PASSWORD = 'Password123!';

async function setupTestUser(role: string, status: string = 'Verified') {
  const email = `${role.replace(/\s+/g, '').toLowerCase()}_${RUN_ID}@example.com`;
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      full_name: `${role} Test User`,
      role,
      status,
      account_type: 'Renter',
      is_test_data: true,
    }
  });
  return { email, user };
}

test.describe('Phase 6 SOC Approval & Scheduling Engine Pipeline', () => {

  test.beforeAll(async () => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('test')) {
      throw new Error("FATAL: DATABASE_URL must explicitly contain 'test'.");
    }
  });

  test.afterAll(async () => {
    // Deterministic cleanup for this run's fixture
    await prisma.marketingPost.deleteMany({
      where: { caption: { contains: RUN_ID } }
    });
    await prisma.marketingCampaign.deleteMany({
      where: { campaign_name: { contains: RUN_ID } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: RUN_ID } }
    });
  });

  test('UI Workflow: View Approval Queue and Scheduling Engine', async ({ page }) => {
    const { email, user } = await setupTestUser('Super Admin', 'Verified');
    
    // Seed some queue data to ensure the page doesn't crash on empty
    const campaign = await prisma.marketingCampaign.create({
      data: {
        campaign_name: `Test Campaign ${RUN_ID}`,
        campaign_status: 'ACTIVE',
        campaign_type: 'PROMOTIONAL',
        campaign_goal: 'Engagement',
        approval_status: 'APPROVED',
        created_by_id: user.id,
      }
    });

    const post = await prisma.marketingPost.create({
      data: {
        campaign_id: campaign.id,
        platform: 'FACEBOOK',
        post_type: 'PROMOTIONAL',
        post_status: 'SUBMITTED_FOR_REVIEW',
        approval_status: 'PENDING',
        version: 1,
        caption: `E2E Test Post for Review ${RUN_ID}`,
        created_by_id: user.id,
      }
    });

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.href.includes('/login'));
    
    // Check Approval Queue Load
    await page.goto('/dashboard/social/approvals');
    await expect(page.getByRole('heading', { name: 'Content Approval Queue', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Pending Approvals/, level: 2 })).toBeVisible();
    
    // Strict semantic assertion for the unique business record
    const row = page.getByRole('row', { name: new RegExp(`E2E Test Post for Review ${RUN_ID}`) });
    await expect(row).toHaveCount(1);
    await expect(row).toBeVisible();
    
    // Check Scheduling Engine Load
    await page.getByRole('link', { name: 'Go to Scheduling Engine' }).click();
    await expect(page.getByRole('heading', { name: 'Scheduling Engine', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Schedule Approved Content', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Upcoming Scheduled Posts', level: 2 })).toBeVisible();
  });
});
