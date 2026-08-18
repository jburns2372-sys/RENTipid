import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/address-system',
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0, // Fail fast in targeted E2E
  workers: 1, // Safe serial DB execution
  reporter: [['html', { outputFolder: 'playwright-address-report' }]],
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    }
  ],
  webServer: {
    command: 'npx cross-env ADDRESS_PROVIDER=MOCK_E2E npx next dev -p 3005', // Use a separate port to avoid conflicts
    port: 3005,
    timeout: 120 * 1000,
    reuseExistingServer: false,
    // Note: process.env is inherited from the orchestrator script
  },
});
