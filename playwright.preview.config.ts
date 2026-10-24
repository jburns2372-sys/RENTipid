import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PREVIEW_BASE_URL?.trim();
if (!baseURL) throw new Error('PREVIEW_BASE_URL is required for the Preview acceptance runner.');

const parsedBaseURL = new URL(baseURL);
if (parsedBaseURL.protocol !== 'https:') {
  throw new Error('PREVIEW_BASE_URL must use HTTPS.');
}

export default defineConfig({
  testDir: './tests/preview',
  outputDir: 'test-results/preview-artifacts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ['line'],
    ['json', { outputFile: 'test-results/preview-acceptance.json' }],
    ['html', { outputFolder: 'playwright-report-preview', open: 'never' }],
  ],
  use: {
    baseURL: parsedBaseURL.origin,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
