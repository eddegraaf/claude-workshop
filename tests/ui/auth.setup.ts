import { test as setup } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.page';
import { STORAGE_STATE_PATH } from '../../fixtures/storageState';

const { BEARSTORE_USERNAME: username, BEARSTORE_PASSWORD: password } = process.env;
if (!username || !password) {
  throw new Error(
    'BEARSTORE_USERNAME and BEARSTORE_PASSWORD environment variables are required to run ' +
      'the auth setup. Copy .env.example to .env and set them.',
  );
}

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(username, password);
  await loginPage.expectLoggedIn();

  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
