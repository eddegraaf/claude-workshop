import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage.page';

export class CartPage extends BasePage {
  private readonly removeLineLinks: Locator;
  private readonly totalCell: Locator;
  private readonly checkoutButton: Locator;

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
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
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

  // .first() rather than a bare strict-mode locator: the same product can appear as multiple
  // cart lines (e.g. two different variants of one product), so more than one matching link
  // can legitimately exist — this only asserts at least one is visible.
  async expectContainsProduct(productName: string): Promise<void> {
    await expect(
      this.page.getByRole('link', { name: productName, exact: true }).first(),
    ).toBeVisible();
  }

  async expectTotal(expected: string): Promise<void> {
    await expect(this.totalCell).toHaveText(expected);
  }

  // The visible "Checkout" button's onclick runs `$('#startcheckout').trigger('click')`,
  // delegating to a hidden jQuery-triggered form submit rather than navigating directly.
  // BasePage.navigate() only waits for `domcontentloaded`, so if jQuery hasn't finished
  // loading yet, that call silently does nothing — the click "succeeds" but nothing happens,
  // which otherwise surfaced as a hang on whatever the caller waits for next.
  async checkout(): Promise<void> {
    // Passed as a string, not a closure: this file's tsconfig has no DOM lib, so a typed
    // arrow function referencing `window` (valid in the browser context this runs in) would
    // fail to compile here.
    await this.page.waitForFunction("'jQuery' in window");
    await this.checkoutButton.click();
    await this.page.waitForURL(/\/checkout\/billingaddress/);
  }
}
