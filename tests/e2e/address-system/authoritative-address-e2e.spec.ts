import { test, expect, Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const E2E_DB_URL = process.env.DATABASE_URL!;

// Helper to login through real NextAuth UI
async function login(page: Page, email: string) {
  // Assuming a generic next-auth credentials sign-in is exposed or we simulate the POST to /api/auth/callback/credentials
  // Since we don't have the exact UI for login mapped, we will do a direct POST to NextAuth to obtain a real session cookie.
  
  // Real NextAuth credentials flow simulation:
  // Instead of guessing the UI, we'll hit the CSRF endpoint, then POST to callback/credentials
  const csrfRes = await page.request.get('/api/auth/csrf');
  const csrfJson = await csrfRes.json();
  
  const loginRes = await page.request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken: csrfJson.csrfToken,
      email: email,
      password: 'TestPassword123!',
      json: 'true'
    }
  });
  
  expect(loginRes.ok()).toBeTruthy();
  const loginData = await loginRes.json();
  expect(loginData.url).toBeDefined(); // Success implies redirect URL is provided

  // Transfer cookies to the page context
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name.includes('next-auth.session-token'));
  expect(sessionCookie).toBeDefined();
}

async function fillAddressForm(page: Page, blockLocator: import('@playwright/test').Locator, expectedAddressStr: string) {
  // 1. Select Country
  const countrySelect = blockLocator.locator('select');
  await expect(countrySelect).toBeVisible();
  await countrySelect.selectOption('US');

  // 2. Search Input
  const searchInput = blockLocator.getByPlaceholder('Start typing your address...');
  await expect(searchInput).toBeVisible();
  
  // Type and trigger autocomplete
  await searchInput.fill('E2E ADDRESS 7391');

  // 3. Verify Suggestion appears and click it
  const suggestionList = blockLocator.locator('ul[id^="address-suggestions-list"]').first();
  await expect(suggestionList).toBeAttached();
  
  const suggestion = suggestionList.locator('li', { hasText: 'E2E ADDRESS 7391 ALPHA STREET' });
  await expect(suggestion).toBeVisible();
  await suggestion.click();

  // 4. Verify canonical data populated in Address Line 1
  const addressLine1 = blockLocator.locator('label:has-text("Address Line 1 *") + input');
  await expect(addressLine1).toHaveValue(expectedAddressStr);
}

test.describe('Global Address System E2E', () => {

  test.beforeEach(() => {
    if (!E2E_DB_URL || !E2E_DB_URL.includes('rentipid_address_e2e_')) {
      throw new Error(`Unsafe DATABASE_URL: ${E2E_DB_URL}`);
    }
  });

  test('SCENARIO A & B: Personal Provider Address + Server Authority Tamper', async ({ page }) => {
    await login(page, 'e2e_address_test@example.com');

    await page.goto('/dashboard/profile');
    
    // Enable editing mode
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    
    // Find the Personal Address block (it's the first AddressForm)
    const personalAddressBlock = page.locator('.border.border-gray-200.rounded-lg.bg-gray-50').first();
    await expect(personalAddressBlock).toBeVisible();

    await fillAddressForm(page, personalAddressBlock, 'E2E ADDRESS 7391 ALPHA STREET');

    // SCENARIO B: Server Authority Tamper
    // We intercept the PATCH to /api/profile and alter the canonical Country
    await page.route('/api/profile', async route => {
      const request = route.request();
      if (request.method() === 'PATCH') {
        const data = request.postDataJSON();
        if (data.global_address) {
          // Malicious tamper
          data.global_address.countryCode = 'CA'; 
        }
        await route.continue({ postData: JSON.stringify(data) });
      } else {
        await route.continue();
      }
    });

    // Save profile
    const saveButton = page.locator('button[type="submit"]:has-text("Save Changes")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Verification 1: Database Check
    const prisma = new PrismaClient({ datasources: { db: { url: E2E_DB_URL } } });
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: 'e2e_address_1' },
      include: { global_address: true }
    });

    expect(profile).not.toBeNull();
    const address = profile!.global_address!;
    
    // Validate Encryption
    expect(address.addressLine1_encrypted).not.toContain('E2E ADDRESS 7391 ALPHA STREET');
    expect(address.addressLine1_encrypted).toContain(':');
    
    // Validate Server Authority override
    // The server should have enforced 'US' from the mock token instead of the tampered 'CA'
    expect(address.countryCode).toBe('US');
    expect(address.provider).toBe('google');
    expect(address.validationStatus).toBe('VALIDATED');

    await prisma.$disconnect();

    // Verification 2: Reload and Decrypt
    await page.reload();
    const addressLine1 = personalAddressBlock.locator('label:has-text("Address Line 1 *") + input');
    await expect(addressLine1).toHaveValue('E2E ADDRESS 7391 ALPHA STREET');
  });

  test('SCENARIO C: Manual Fallback', async ({ page }) => {
    await login(page, 'e2e_address_c@example.com');
    await page.goto('/dashboard/profile');
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    
    const personalAddressBlock = page.locator('.border.border-gray-200.rounded-lg.bg-gray-50').first();
    await expect(personalAddressBlock).toBeVisible();

    const countrySelect = personalAddressBlock.locator('select');
    await countrySelect.selectOption('US');

    const searchInput = personalAddressBlock.getByPlaceholder('Start typing your address...');
    
    // "FAIL" triggers MockAddressProvider to throw an error simulating unavailable provider
    await searchInput.fill('FAIL');

    // UI should display error message
    const errorMessage = personalAddressBlock.locator('text=Address search is temporarily unavailable').first();
    await expect(errorMessage).toBeVisible();

    // Fallback to manual entry: form should still be usable
    const addressLine1 = personalAddressBlock.locator('label:has-text("Address Line 1 *") + input');
    await addressLine1.fill('Manual Street 123');
    
    await page.locator('button[type="submit"]:has-text("Save Changes")').click();
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Check DB
    const prisma = new PrismaClient({ datasources: { db: { url: E2E_DB_URL } } });
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: 'e2e_address_c' },
      include: { global_address: true }
    });
    expect(profile).not.toBeNull();
    expect(profile!.global_address!.provider).toBe('MANUAL');
    await prisma.$disconnect();
  });

  test('SCENARIO D & E: Country Change Cancel & Confirm', async ({ page }) => {
    await login(page, 'e2e_address_d@example.com');
    await page.goto('/dashboard/profile');
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    
    const personalAddressBlock = page.locator('.border.border-gray-200.rounded-lg.bg-gray-50').first();
    await fillAddressForm(page, personalAddressBlock, 'E2E ADDRESS 7391 ALPHA STREET');

    const countrySelect = personalAddressBlock.locator('select');
    
    // SCENARIO D: Cancel
    page.once('dialog', dialog => dialog.dismiss()); // Dismiss confirmation
    await countrySelect.selectOption('CA');
    
    // Verify address is preserved
    const addressLine1 = personalAddressBlock.locator('label:has-text("Address Line 1 *") + input');
    await expect(addressLine1).toHaveValue('E2E ADDRESS 7391 ALPHA STREET');

    // SCENARIO E: Confirm
    page.once('dialog', dialog => dialog.accept()); // Accept confirmation
    await countrySelect.selectOption('CA');
    
    // Verify address is cleared
    await expect(addressLine1).toHaveValue('');
  });

  test('SCENARIO F: Keyboard Navigation', async ({ page }) => {
    await login(page, 'e2e_address_f@example.com');
    await page.goto('/dashboard/profile');
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    
    const personalAddressBlock = page.locator('.border.border-gray-200.rounded-lg.bg-gray-50').first();
    const countrySelect = personalAddressBlock.locator('select');
    await expect(countrySelect).toBeVisible();
    await countrySelect.selectOption('US');

    const searchInput = personalAddressBlock.getByPlaceholder('Start typing your address...');
    await expect(searchInput).toBeVisible();
    await searchInput.focus();
    await searchInput.fill('E2E ADDRESS 7391');

    const suggestionList = personalAddressBlock.locator('ul[id^="address-suggestions-list"]').first();
    await expect(suggestionList).toBeAttached();

    // Keyboard sequence
    await searchInput.press('ArrowDown');
    await searchInput.press('Enter');

    const addressLine1 = personalAddressBlock.locator('label:has-text("Address Line 1 *") + input');
    await expect(addressLine1).toHaveValue('E2E ADDRESS 7391 ALPHA STREET');
  });

  test('SCENARIO G: Business Address', async ({ page }) => {
    await login(page, 'e2e_business_test@example.com');
    await page.goto('/dashboard/profile');
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    
    const addressBlocks = page.locator('.border.border-gray-200.rounded-lg.bg-gray-50');
    await expect(addressBlocks).toHaveCount(2);

    const businessAddressBlock = addressBlocks.nth(1);
    
    // Fill and save Business Address
    await fillAddressForm(page, businessAddressBlock, 'E2E ADDRESS 7391 ALPHA STREET');
    await page.locator('button[type="submit"]:has-text("Save Changes")').click();
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Verify DB
    const prisma = new PrismaClient({ datasources: { db: { url: E2E_DB_URL } } });
    const profile = await prisma.businessProfile.findUnique({
      where: { user_id: 'e2e_business_1' },
      include: { global_business_address: true }
    });
    expect(profile!.global_business_address).not.toBeNull();
    
    // Clear the Business Address (by changing country and accepting to clear)
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    page.once('dialog', dialog => dialog.accept());
    const countrySelect = businessAddressBlock.locator('select');
    await expect(countrySelect).toBeVisible();
    await countrySelect.selectOption('CA');
    await page.locator('button[type="submit"]:has-text("Save Changes")').click();
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Reload empty
    await page.reload();
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    const addressLine1 = businessAddressBlock.locator('label:has-text("Address Line 1 *") + input');
    await expect(addressLine1).toHaveValue('');
    
    await prisma.$disconnect();
  });
});
