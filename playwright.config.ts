import { defineConfig, devices } from '@playwright/test';

try {
  // Loads GOREST_TOKEN (and any other local secrets) from .env; see .env.example.
  process.loadEnvFile();
} catch {
  // No .env file present — fine for UI-only runs, required for the `api` project.
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://bearstore-testsite.smartbear.com',
    /* Collect trace for every test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    /* Record video for every test. See https://playwright.dev/docs/test-configuration#recording-options */
    video: 'on',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      testDir: './tests/ui',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      testDir: './tests/ui',
      use: { ...devices['Desktop Safari'] },
    },

    {
      name: 'api',
      testDir: './tests/api',
      use: {
        // Trailing slash matters: Playwright resolves relative request paths against
        // baseURL using URL semantics, so a leading slash on the path would otherwise
        // discard the /public/v2 segment.
        baseURL: 'https://gorest.co.in/public/v2/',
      },
    },
  ],
});
