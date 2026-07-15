import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test database guard - EXPLICIT ALLOWLIST
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('rentipid_test_soc')) {
  console.error("FATAL: DATABASE_URL must explicitly contain 'rentipid_test_soc'.");
  console.error("Value:", process.env.DATABASE_URL);
  process.exit(1);
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false, // Required since tests manipulate global settings
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Safe worker count for serial DB changes
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx cross-env NODE_ENV=test dotenv -e .env.test -- npx next start -p 3001',
    port: 3001,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
