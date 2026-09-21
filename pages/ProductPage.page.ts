import { Page, Locator } from '@playwright/test';

export class ProductPage {
  private readonly page: Page;
  private readonly addToCartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addToCartLink = page.getByRole('link', { name: 'Add to cart' });
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/${slug}`, { waitUntil: 'domcontentloaded' });
  }

  // Waits for the server to confirm the add, then lets the page settle before returning:
  // navigating away immediately (even after the addproduct response) was observed to
  // double the line's quantity, most likely from an unload-time retry/beacon the site
  // fires if it doesn't yet see the request as settled.
  async addToCart(): Promise<void> {
    const added = this.page.waitForResponse(
      (response) => /\/cart\/addproduct\//.test(response.url()) && response.ok(),
    );
    await this.addToCartLink.click();
    await added;
    await this.page.waitForLoadState('networkidle');
  }
}
