import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

import { assertSafeLocalTestDatabaseTarget } from './src/lib/test-database-guard';

// Load test environment variables
dotenv.config({ path: ['.env.test.local', '.env.test'] });

// Test database guard - EXPLICIT ALLOWLIST
assertSafeLocalTestDatabaseTarget();

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: process.env.RUN_SOC_TESTS ? ['**/address-system/**', 'local-address-live.spec.ts'] : ['**/address-system/**', 'local-address-live.spec.ts', '**/soc-*.spec.ts'],
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
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001',
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
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL ? undefined : {
    command: 'npx cross-env NODE_ENV=test dotenv -e .env.test -- npx next dev -p 3001',
    port: 3001,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
