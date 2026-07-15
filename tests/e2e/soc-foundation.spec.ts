import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const RUN_ID = `SOC_P1_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
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

test.describe('Phase 1 SOC Foundation Canonical Route Tests', () => {

  test.beforeAll(async () => {
    // Assert explicit safe database
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('rentipid_test_soc')) {
      throw new Error("FATAL: DATABASE_URL must explicitly contain 'rentipid_test_soc'.");
    }
  });

  test.afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { actor_user_id: { contains: RUN_ID } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: RUN_ID } }
    });
  });

  test('Unauthenticated user denied', async ({ page }) => {
    await page.goto('/dashboard/admin/security');
    expect(page.url()).toContain('/login');
  });

  const rolesToDeny = [
    'Guest', 
    'Renter', 
    'Individual Provider', 
    'Business Provider', 
    'Admin', 
    'Finance Admin', 
    'Compliance Admin'
  ];

  for (const role of rolesToDeny) {
    test(`${role} denied access to SOC`, async ({ page }) => {
      const { email } = await setupTestUser(role);
      await page.goto('/login');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.goto('/dashboard/admin/security');
      // Should be redirected away since they lack permission
      expect(page.url()).not.toContain('/dashboard/admin/security');
    });
  }

  const restrictedStatuses = ['Pending', 'Suspended', 'Blacklisted'];

  for (const status of restrictedStatuses) {
    test(`Super Admin with ${status} status denied`, async ({ page }) => {
      const { email } = await setupTestUser('Super Admin', status);
      await page.goto('/login');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      
      // If the UI blocks login entirely for Blacklisted, that's fine. 
      // But if they get in and try to hit SOC, we verify it blocks.
      await page.goto('/dashboard/admin/security');
      expect(page.url()).not.toContain('/dashboard/admin/security');
    });
  }

  test('Verified Super Admin allowed', async ({ page }) => {
    const { email } = await setupTestUser('Super Admin', 'Verified');
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/admin/security');
    await expect(page.locator('text=Security Operations Center')).toBeVisible();
    await expect(page.locator('text=Foundation Active')).toBeVisible();
  });

  test('Stale JWT Role Override (AUTHZ-P1-025)', async ({ page }) => {
    const { email, user } = await setupTestUser('Super Admin', 'Verified');
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // First request is allowed
    await page.goto('/dashboard/admin/security');
    await expect(page.locator('text=Foundation Active')).toBeVisible();

    // Mutate database directly to simulate demotion (bypassing NextAuth session state)
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'Renter' }
    });

    // The next request must be denied by PostgreSQL-authoritative check
    await page.goto('/dashboard/admin/security');
    expect(page.url()).not.toContain('/dashboard/admin/security');
  });

  test('Stale JWT Status Override (AUTHZ-P1-024)', async ({ page }) => {
    const { email, user } = await setupTestUser('Super Admin', 'Verified');
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // First request is allowed
    await page.goto('/dashboard/admin/security');
    await expect(page.locator('text=Foundation Active')).toBeVisible();

    // Mutate database directly to simulate suspension (bypassing NextAuth session state)
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'Suspended' }
    });

    // The next request must be denied by PostgreSQL-authoritative check
    await page.goto('/dashboard/admin/security');
    expect(page.url()).not.toContain('/dashboard/admin/security');
  });
});
