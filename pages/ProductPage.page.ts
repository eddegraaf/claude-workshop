import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.page';

export class ProductPage extends BasePage {
  private readonly addToCartLink: Locator;

  constructor(page: Page) {
    super(page);
    this.addToCartLink = page.getByRole('link', { name: 'Add to cart' });
  }

  async goto(slug: string): Promise<void> {
    await this.navigate(`/${slug}`);
  }

  // Waits for the server to confirm the add, then lets the page settle before returning:
  // navigating away immediately (even after the addproduct response) was observed to
  // double the line's quantity, most likely from an unload-time retry/beacon the site
  // fires if it doesn't yet see the request as settled.
  //
  // The root cause was never confirmed, so this networkidle wait is a working mitigation,
  // not a verified fix — Playwright's docs discourage networkidle in general (prone to
  // false negatives on pages with polling, false positives if the real follow-up request
  // fires after the idle window). It has held up across repeated runs of this test; if the
  // doubling ever recurs, capture the actual duplicate request first rather than widening
  // this wait further.
  async addToCart(): Promise<void> {
    const added = this.page.waitForResponse(
      (response) => /\/cart\/addproduct\//.test(response.url()) && response.ok(),
    );
    await this.addToCartLink.click();
    await added;
    await this.page.waitForLoadState('networkidle');
  }
}
