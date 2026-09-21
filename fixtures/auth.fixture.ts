import { randomUUID } from 'node:crypto';
import { test as base, Page, BrowserContext } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage.page';

interface AuthFixtures {
  authenticatedPage: Page;
}

interface AuthWorkerFixtures {
  authenticatedContext: BrowserContext;
}

// Fixed password for freshly generated worker accounts — not a real credential (public
// demo site, throwaway account, no production access or PII behind it), so per CLAUDE.md
// this is committed as plaintext rather than routed through .env/CI secrets like GOREST_TOKEN.
const WORKER_ACCOUNT_PASSWORD = 'TestWorker123!';

export const test = base.extend<AuthFixtures, AuthWorkerFixtures>({
  // Worker-scoped: registers a fresh, unique BearStore account once per worker process and
  // reuses that session for every test in the worker. A dedicated account per worker avoids
  // the shared demo account's cart being mutated concurrently by other workers (or other
  // people using the same public site) — that contention was a real source of flaky
  // cart-total assertions (items vanishing, quantities doubling) when a single shared
  // account was used across parallel test runs.
  authenticatedContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const id = randomUUID();
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register(`qa.${id}@example.com`, `qa-${id}`, WORKER_ACCOUNT_PASSWORD);
      await registerPage.expectRegistered();
      await page.close();

      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
