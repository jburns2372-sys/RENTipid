import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const RUN_ID = `SOC_P2_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
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
    }
  });
  return { email, user };
}

test.describe('Phase 2 SOC Foundation Event Pipeline', () => {

  test.beforeAll(async () => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('rentipid_test_soc')) {
      throw new Error("FATAL: DATABASE_URL must explicitly contain 'rentipid_test_soc'.");
    }
  });

  test.afterAll(async () => {
    await prisma.securityEvent.deleteMany({
      where: { actor_user_id: { contains: RUN_ID } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: RUN_ID } }
    });
  });

  test('Super Admin can view the Events table and Adapter statuses', async ({ page }) => {
    const { email } = await setupTestUser('Super Admin', 'Verified');
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.href.includes('/login'));
    
    await page.goto('/dashboard/admin/security');
    await expect(page.locator('text=Security event normalization active')).toBeVisible();
    await expect(page.locator('text=Adapter Configuration Status')).toBeVisible();
    await expect(page.locator('text=CONFIGURED — ACTIVE SOURCE').first()).toBeVisible();
    await expect(page.locator('text=Security Events Pipeline')).toBeVisible();
  });
});
