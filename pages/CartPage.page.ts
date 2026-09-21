import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  private readonly page: Page;
  private readonly removeLineLinks: Locator;
  private readonly totalCell: Locator;

  constructor(page: Page) {
    this.page = page;
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
    await this.page.goto('/cart', { waitUntil: 'domcontentloaded' });
  }

  // Removing a line's own UI refresh is unreliable on this site — it can show an "error"
  // toast and leave a stale row in the DOM even though the removal succeeded server-side —
  // so this re-navigates after every click to read the authoritative state instead of
  // trusting the in-place re-render.
  async clear(): Promise<void> {
    for (let attempt = 0; attempt < 20 && (await this.removeLineLinks.count()) > 0; attempt++) {
      await this.removeLineLinks.first().click();
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
