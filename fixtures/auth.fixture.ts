import { existsSync } from 'node:fs';
import { test as base, Page } from '@playwright/test';
import { STORAGE_STATE_PATH } from './storageState';

interface AuthFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    if (!existsSync(STORAGE_STATE_PATH)) {
      throw new Error(
        `Missing ${STORAGE_STATE_PATH}. Run \`npx playwright test --project=setup\` first ` +
          'to log in and save storageState.',
      );
    }

    const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
