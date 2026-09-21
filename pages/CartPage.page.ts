import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage.page';

export class CartPage extends BasePage {
  private readonly removeLineLinks: Locator;
  private readonly totalCell: Locator;

  constructor(page: Page) {
    super(page);
    this.removeLineLinks = page.getByRole('link', { name: '×' });
    // hasText: 'Total:' would also match the "Subtotal:" row (substring match), so this
    // filters by an exact-match descendant cell instead to target only the Total row.
    this.totalCell = page
      .getByRole('row')
      .filter({ has: page.getByRole('cell', { name: 'Total:', exact: true }) })
      .getByRole('cell')
      .nth(1);
  }

  async goto(): Promise<void> {
    await this.navigate('/cart');
  }

  // Removing a line's own UI refresh is unreliable on this site — it can show an "error"
  // toast and leave a stale row in the DOM even though the removal succeeded server-side —
  // so this re-navigates after every click to read the authoritative state instead of
  // trusting the in-place re-render. Waiting for the deletecartitem response first (mirroring
  // ProductPage.addToCart()) avoids the reload racing/aborting that request before it lands.
  async clear(): Promise<void> {
    const MAX_ATTEMPTS = 20; // comfortably above any cart this suite should ever accumulate
    for (
      let attempt = 0;
      attempt < MAX_ATTEMPTS && (await this.removeLineLinks.count()) > 0;
      attempt++
    ) {
      const removed = this.page.waitForResponse(
        (response) => /\/shoppingcart\/deletecartitem/.test(response.url()) && response.ok(),
      );
      await this.removeLineLinks.first().click();
      await removed;
      await this.goto();
    }
    await expect(this.removeLineLinks).toHaveCount(0);
  }

  async expectContainsProduct(productName: string): Promise<void> {
    await expect(this.page.getByRole('link', { name: productName, exact: true })).toBeVisible();
  }

  async expectTotal(expected: string): Promise<void> {
    await expect(this.totalCell).toHaveText(expected);
  }
}
