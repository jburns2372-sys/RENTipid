import { expect, test } from '@playwright/test';

test('exposes only the production-ready providers with Apple deferred', async ({ page, request }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/login');

  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Facebook' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with WhatsApp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Email' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Phone' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue with Apple' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Continue with WhatsApp' }).click();
  await expect(page.getByLabel('WhatsApp number')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send code through WhatsApp' })).toBeVisible();
  await expect(page.getByText(/SMS/i)).toHaveCount(0);

  const providersResponse = await request.get('/api/auth/providers');
  expect(providersResponse.ok()).toBe(true);
  const providers = await providersResponse.json() as Record<string, unknown>;
  expect(providers).toHaveProperty('google');
  expect(providers).toHaveProperty('facebook');
  expect(providers).toHaveProperty('credentials');
  expect(providers).toHaveProperty('phone-otp');
  expect(providers).not.toHaveProperty('apple');

  const retiredSmsResponse = await request.post('/api/auth/otp', {
    data: { phone: '+639171234567', channel: 'sms' },
  });
  expect(retiredSmsResponse.status()).toBe(200);
  await expect(retiredSmsResponse.json()).resolves.toEqual({
    message: 'If the details are valid, you can continue.',
  });

  expect(browserErrors).toEqual([]);
});
