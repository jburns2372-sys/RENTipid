import { expect, test, type Locator, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { AddressService } from '../../src/lib/address/AddressService';

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADDRESS_LOCAL_TEST_EMAIL;
const password = process.env.ADDRESS_LOCAL_TEST_PASSWORD;

async function login(page: Page): Promise<void> {
  expect(email).toBeTruthy();
  expect(password).toBeTruthy();
  const csrfResponse = await page.request.get('/api/auth/csrf');
  expect(csrfResponse.ok()).toBeTruthy();
  const csrf = await csrfResponse.json() as { csrfToken?: string };
  expect(csrf.csrfToken).toBeTruthy();
  const loginResponse = await page.request.post('/api/auth/callback/credentials', {
    form: { csrfToken: csrf.csrfToken!, email: email!, password: password!, json: 'true' },
  });
  expect(loginResponse.ok()).toBeTruthy();
  await expect.poll(async () => (await page.context().cookies())
    .some((cookie) => cookie.name.includes('next-auth.session-token'))).toBe(true);
}

async function openProfileForEditing(page: Page): Promise<Locator> {
  await page.goto('/dashboard/profile');
  await expect(page).toHaveURL(/\/dashboard\/profile/);
  await expect(page.getByRole('heading', { name: 'Profile Details' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Profile' }).click();
  const personal = page.getByRole('heading', { name: 'Address Information' }).first().locator('..');
  await expect(personal).toBeVisible();
  return personal;
}

async function selectCountry(page: Page, block: Locator, country: string): Promise<void> {
  const select = block.locator('select').first();
  const current = await select.inputValue();
  if (current && current !== country) page.once('dialog', (dialog) => dialog.accept());
  await select.selectOption(country);
  await expect(select).toHaveValue(country);
}

test.describe.serial('Local Address application parity', () => {
  test.beforeAll(() => {
    if (!databaseUrl || !/\/rentipid_address_local(?:\?|$)/.test(databaseUrl)) {
      throw new Error('SAFETY: live local Address E2E requires rentipid_address_local.');
    }
  });

  test('non-PH manual save and decrypted reload remain functional', async ({ page }) => {
    await login(page);
    const personal = await openProfileForEditing(page);
    await selectCountry(page, personal, 'SG');
    await personal.getByRole('button', { name: 'Enter address manually' }).click();
    await personal.getByLabel('Address Line 1 *').fill('1 Local Acceptance Way');
    await personal.getByLabel('City / Municipality').fill('Singapore');
    await personal.getByLabel('ZIP / Postal Code').fill('018956');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Profile updated successfully!')).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    const reloaded = page.getByRole('heading', { name: 'Address Information' }).first().locator('..');
    await expect(reloaded.getByLabel('Address Line 1 *')).toHaveValue('1 Local Acceptance Way');
    await expect(reloaded.locator('select').first()).toHaveValue('SG');
  });

  test('live Google PH selection loads PSGC, persists encrypted codes, and decrypts on reload', async ({ page }) => {
    await login(page);
    const personal = await openProfileForEditing(page);
    await selectCountry(page, personal, 'PH');

    const search = personal.getByPlaceholder('Start typing your address...');
    const autocompleteResponse = page.waitForResponse((response) =>
      response.url().includes('/api/address/autocomplete') && response.request().method() === 'POST',
    );
    await search.fill('Batasan Hills Quezon City Philippines');
    const autocomplete = await autocompleteResponse;
    expect(autocomplete.ok()).toBeTruthy();
    const autocompleteBody = await autocomplete.json() as { status?: string; suggestions?: unknown[] };
    expect(autocompleteBody.status).toBe('OK');
    expect(autocompleteBody.suggestions?.length).toBeGreaterThan(0);

    const option = personal
      .locator('ul[id^=address-suggestions-list]')
      .getByRole('option')
      .filter({ hasNotText: /Searching|No matching|unavailable/i })
      .first();
    await expect(option).toBeVisible();
    const detailsResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/address/details') && response.request().method() === 'POST',
    );
    const barangaysResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/address/ph/barangays') && response.request().method() === 'GET',
    );
    await option.click();
    const detailsResponse = await detailsResponsePromise;
    expect(detailsResponse.ok()).toBeTruthy();
    const details = await detailsResponse.json() as { selectionToken?: string; countryCode?: string };
    expect(details.selectionToken?.length).toBeGreaterThan(40);
    expect(details.countryCode).toBe('PH');

    const barangaysResponse = await barangaysResponsePromise;
    expect(barangaysResponse.ok()).toBeTruthy();
    const barangays = await barangaysResponse.json() as { barangays?: Array<{ psgcCode: string; name: string }> };
    expect(barangays.barangays).toHaveLength(142);
    expect(barangays.barangays).toContainEqual({ psgcCode: '1381300139', name: 'Batasan Hills' });

    await expect(personal.getByLabel('City / Municipality')).toHaveValue('Quezon City');
    await expect(personal.getByRole('button', { name: 'Change barangay' })).toBeVisible();
    await expect(personal.getByText('Batasan Hills', { exact: true }).last()).toBeVisible();
    const selectedLine = await personal.getByLabel('Address Line 1 *').inputValue();
    expect(selectedLine.length).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Profile updated successfully!')).toBeVisible();

    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    try {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: email! } });
      const profile = await prisma.userProfile.findUniqueOrThrow({
        where: { user_id: user.id }, include: { global_address: true },
      });
      const raw = profile.global_address;
      expect(raw).not.toBeNull();
      expect(raw!.addressLine1_encrypted).toBeTruthy();
      expect(raw!.addressLine1_encrypted).not.toContain(selectedLine);
      expect(raw!.localityPsgcCode).toBe('1381300000');
      expect(raw!.sublocalityPsgcCode).toBe('1381300139');
      const normalized = AddressService.readNormalizedAddress(raw as unknown as Record<string, unknown>);
      expect(normalized?.addressLine1).toBe(selectedLine);
      expect(normalized?.locality).toBe('Quezon City');
      expect(normalized?.sublocality).toBe('Batasan Hills');
      expect(normalized?.provider).toBe('google');
    } finally {
      await prisma.$disconnect();
    }

    await page.reload();
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    const reloaded = page.getByRole('heading', { name: 'Address Information' }).first().locator('..');
    await expect(reloaded.getByLabel('Address Line 1 *')).toHaveValue(selectedLine);
    await expect(reloaded.locator('select').first()).toHaveValue('PH');
    await expect(reloaded.getByRole('button', { name: 'Change barangay' })).toBeVisible();
    await expect(reloaded.getByText('Batasan Hills', { exact: true }).last()).toBeVisible();
  });
});
