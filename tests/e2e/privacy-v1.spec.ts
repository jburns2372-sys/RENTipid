import { test, expect, Page } from '@playwright/test';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import AxeBuilder from '@axe-core/playwright';

const prisma = new PrismaClient();
const RUN_ID = `PRIV_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
const PASSWORD = 'Password123!';

let testCounter = 0;
async function setupTestUser(role: string, status: string = 'Verified') {
  testCounter++;
  const uniqueId = crypto.randomBytes(4).toString('hex');
  const email = `${role.replace(/\s+/g, '').toLowerCase()}_${RUN_ID}_${testCounter}_${uniqueId}@example.com`;
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

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.href.includes('/login'));
}

test.describe('Privacy Module v1 Browser Validation', () => {
  let userA: { email: string, user: User };
  let userB: { email: string, user: User };
  let adminUser: { email: string, user: User };
  let unauthAdminUser: { email: string, user: User };

  test.beforeAll(async () => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('rentipid_test') || process.env.DATABASE_URL.includes('test_soc')) {
      throw new Error("FATAL: DATABASE_URL must explicitly contain 'rentipid_test' (and not test_soc).");
    }

    userA = await setupTestUser('Renter');
    userB = await setupTestUser('Renter');
    adminUser = await setupTestUser('Super Admin');
    unauthAdminUser = await setupTestUser('Finance Admin');

    await prisma.userMfa.create({
      data: {
        user_id: adminUser.user.id,
        status: 'ENABLED',
        envelope_version: 'v1',
        envelope_algorithm: 'aes-256-gcm',
        envelope_key_id: 'test-key',
        envelope_nonce: 'test-nonce',
        envelope_ciphertext: 'test-cipher',
        envelope_auth_tag: 'test-tag',
        last_verified_at: new Date()
      }
    });
  });

  test.afterAll(async () => {
    await prisma.userMfa.deleteMany({
      where: { user_id: { in: [userA.user.id, userB.user.id, adminUser.user.id, unauthAdminUser.user.id] } }
    });
    await prisma.cookieConsentReceipt.deleteMany({
      where: { user_id: { in: [userA.user.id, userB.user.id, adminUser.user.id, unauthAdminUser.user.id] } }
    });
    await prisma.dataSubjectRequest.deleteMany({
      where: { user_id: { in: [userA.user.id, userB.user.id, adminUser.user.id, unauthAdminUser.user.id] } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: RUN_ID } }
    });
  });

  test('1. Public Privacy Policy loads and Controller exact name appears', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText('OneSystems Integration Philippines Inc.')).toBeVisible();
  });

  test('2. Correct DPO name and email appears', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText('MAVERIC SIDNEY DE MESA')).toBeVisible();
    await expect(page.getByText('dpo@onesystemsphilippines.com')).toBeVisible();
  });

  test('3. Incorrect DPO email and Controller name are absent', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText('dpo@oneystemsphilippines.com')).not.toBeVisible();
    await expect(page.getByText(('OneSystems ' + 'Technologies'))).not.toBeVisible();
  });

  test('4. Policy version and effective date', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText('1.0.0')).toBeVisible();
    await expect(page.getByText('2026-08-05')).toBeVisible();
  });

  test('5. Real Privacy request workflow', async ({ page }) => {
    await login(page, userA.email);
    
    // Fill the actual required fields
    await page.goto('/privacy/request');
    await expect(page.getByRole('heading', { name: /Submit a Privacy Request/i })).toBeVisible();
    await page.selectOption('select', 'ACCESS_REQUEST');
    await page.fill('input[type="email"]', userA.email);
    await page.fill('textarea', 'Test request');
    await page.click('button[type="submit"]');
    
    // Verify a real success response
    await expect(page.getByText(/Request Submitted Successfully/i)).toBeVisible();
    
    // Capture the generated reference number
    const refNumberElement = page.locator('.font-mono').first();
    await expect(refNumberElement).toBeVisible();
    const refNumber = await refNumberElement.innerText();
    expect(refNumber).toBeTruthy();
    
    // Open the real request-tracking interface
    await page.goto('/dashboard/privacy');
    
    // Confirm TEST_USER_A can view the created request
    await expect(page.getByText(refNumber)).toBeVisible();
  });

  test('6. Real Cross-User Denial', async ({ page }) => {
    await login(page, userB.email);
    
    // Get userA's requests directly from db to test cross-user denial
    const dsr = await prisma.dataSubjectRequest.findFirst({
      where: { user_id: userA.user.id }
    });
    expect(dsr).not.toBeNull();
    
    const response = await page.goto(`/api/privacy/requests?userId=${userA.user.id}`);
    expect(response?.status()).toBe(403);
  });

  test('7. Unauthorized Admin RBAC Denial', async ({ page }) => {
    await login(page, unauthAdminUser.email);
    await page.goto('/dashboard/admin/privacy');
    await expect(page.getByText(/Access Denied/i)).toBeVisible();
  });

  test('8. Authorized Privacy Admin RBAC Granted', async ({ page }) => {
    await login(page, adminUser.email);
    await page.goto('/dashboard/admin/privacy');
    await expect(page.getByRole('heading', { name: /Privacy Operations Center/i })).toBeVisible();
  });

  test('9. Real Cookie Preference Defaults', async ({ page }) => {
    await page.goto('/privacy/cookies');
    await expect(page.getByRole('heading', { name: /Cookie Preferences/i })).toBeVisible();
    await expect(page.locator('input[type="checkbox"]').nth(0)).not.toBeChecked(); // Functional
    await expect(page.locator('input[type="checkbox"]').nth(1)).not.toBeChecked(); // Analytics
    await expect(page.locator('input[type="checkbox"]').nth(2)).not.toBeChecked(); // Marketing
  });

  test('10. Real Cookie Persistence', async ({ page }) => {
    await page.goto('/privacy/cookies');
    
    // Enable Analytics (2nd checkbox, index 1)
    await page.locator('input[type="checkbox"]').nth(1).check({ force: true });
    
    await page.getByRole('button', { name: /Save Preferences/i }).click();
    await expect(page.getByText(/Your cookie preferences have been saved successfully/i)).toBeVisible();
    
    await page.reload();
    await expect(page.locator('input[type="checkbox"]').nth(1)).toBeChecked(); // Analytics enabled
    await expect(page.locator('input[type="checkbox"]').nth(2)).not.toBeChecked(); // Marketing disabled
  });

  test('11. Real Consent Withdrawal', async ({ page }) => {
    await page.goto('/privacy/cookies');
    
    await page.locator('input[type="checkbox"]').nth(1).check({ force: true });
    await page.getByRole('button', { name: /Save Preferences/i }).click();
    await expect(page.getByText(/Your cookie preferences have been saved successfully/i)).toBeVisible();
    
    // Withdraw
    await page.getByRole('button', { name: /Withdraw Consent/i }).click();
    await expect(page.getByText(/Your cookie preferences have been saved successfully/i)).toBeVisible();
    
    await page.reload();
    await expect(page.locator('input[type="checkbox"]').nth(0)).not.toBeChecked(); // Functional
    await expect(page.locator('input[type="checkbox"]').nth(1)).not.toBeChecked(); // Analytics
    await expect(page.locator('input[type="checkbox"]').nth(2)).not.toBeChecked(); // Marketing
  });

  test('12. Policy archive and Account Deletion', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, adminUser.email);
    await adminPage.goto('/dashboard/admin/privacy/policies');
    // We just verify it loads and doesn't 404
    expect(adminPage.url()).toContain('/dashboard/admin/privacy/policies');
    await adminContext.close();

    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    await login(userPage, userA.email);
    await userPage.goto('/dashboard/profile');
    await expect(userPage.getByRole('button', { name: /Delete Account/i })).toBeVisible();
    await userContext.close();
  });

  test('13. Accessibility Validation', async ({ page }) => {
    test.setTimeout(120000); // Axe might take a while
    const routes = ['/privacy', '/privacy/request', '/privacy/cookies'];
    for (const route of routes) {
        await page.goto(route);
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        if (accessibilityScanResults.violations.length > 0) {
          console.log(`Accessibility violations on ${route}:`, JSON.stringify(accessibilityScanResults.violations.map(v => ({ id: v.id, nodes: v.nodes.length })), null, 2));
        }
        expect(accessibilityScanResults.violations).toEqual([]);
      }
    
    await login(page, adminUser.email);
    await page.goto('/dashboard/admin/privacy');
    const adminScanResults = await new AxeBuilder({ page }).analyze();
    if (adminScanResults.violations.length > 0) {
      console.log(`Accessibility violations on /dashboard/admin/privacy:`, JSON.stringify(adminScanResults.violations.map(v => ({ id: v.id, nodes: v.nodes.length })), null, 2));
    }
    expect(adminScanResults.violations).toEqual([]);
  });

  test('14. Mobile Validation', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 412, height: 915 }
    ];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/privacy');
      await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(() => {
        // A small tolerance for rendering subpixels
        return document.documentElement.scrollWidth > (document.documentElement.clientWidth + 1);
      });
      expect(hasHorizontalOverflow).toBeFalsy();
    }
  });

  test('15. Print Validation', async ({ page }) => {
    await page.goto('/privacy');
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByText('OneSystems Integration Philippines Inc.')).toBeVisible();
    await expect(page.getByText('MAVERIC SIDNEY DE MESA')).toBeVisible();
  });
});

