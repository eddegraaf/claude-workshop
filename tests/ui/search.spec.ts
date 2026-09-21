import { test } from '@playwright/test';
import { SearchPage } from '../../pages/SearchPage.page';

test('search item', async ({ page }) => {
  /**
   * @test
   * Use https://bearstore-testsite.smartbear.com/
   * Search item called Bear
   * ensure there is no results
   */
  const searchPage = new SearchPage(page);
  await searchPage.goto();
  await searchPage.searchFor('Bear');
  await searchPage.expectNoResults();
});
