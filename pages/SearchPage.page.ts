import { Page, Locator, expect } from '@playwright/test';

export class SearchPage {
  private readonly page: Page;
  private readonly searchInput: Locator;
  private readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('textbox', { name: 'What are you looking for?' });
    this.noResultsMessage = page.getByText('Your search did not match any products.');
  }

  async goto(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async searchFor(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
  }

  async expectNoResults(): Promise<void> {
    await expect(this.noResultsMessage).toBeVisible();
  }
}
