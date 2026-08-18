import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function login(page: Page, email: string) {
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
  
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name.includes('next-auth.session-token'));
  expect(sessionCookie).toBeDefined();
}

test.describe('Address System Accessibility', () => {
  test('Address form should pass axe-core accessibility checks', async ({ page }) => {
    // 1. Authenticate to reach the profile page
    await login(page, 'e2e_address_test@example.com');

    // 2. Navigate to Profile
    await page.goto('/dashboard/profile');
    
    // Enable editing mode
    await page.getByRole('button', { name: 'Edit Profile' }).click();

    // 3. Wait for the address section to be visible
    await page.waitForSelector('select', { state: 'attached', timeout: 10000 });
    
    // Assert the actual Address UI is visible
    const countrySelect = page.locator('select').first();
    await expect(countrySelect).toBeAttached();
    
    // 4. Run Axe checks, do NOT swallow errors
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();
      
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
