import { test } from '../../fixtures/auth.fixture';
import { ProductPage } from '../../pages/ProductPage.page';
import { CartPage } from '../../pages/CartPage.page';

// Prices as displayed on the product pages at the time this test was written; update
// alongside the demo catalog if they drift.
const PRODUCTS = [
  { slug: 'gbb-epic-sub-zero-driver', name: 'GBB Epic Sub Zero Driver', price: 489.0 },
  { slug: 'transocean-chronograph', name: 'TRANSOCEAN CHRONOGRAPH', price: 24110.0 },
];

const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

test('adds two products to the cart and totals them correctly', async ({ authenticatedPage }) => {
  // This flow does several full page navigations (clear cart, two product pages, cart
  // again) against a real external site, which comfortably exceeds the 30s default.
  test.setTimeout(60_000);

  const productPage = new ProductPage(authenticatedPage);
  const cartPage = new CartPage(authenticatedPage);

  // Each worker registers its own account (see fixtures/auth.fixture.ts), but repeated runs
  // within the same worker reuse it, so its cart may already hold items from a prior run;
  // start clean so the total assertion below isn't polluted by leftovers.
  await cartPage.goto();
  await cartPage.clear();

  for (const product of PRODUCTS) {
    await productPage.goto(product.slug);
    await productPage.addToCart();
  }

  await cartPage.goto();
  for (const product of PRODUCTS) {
    await cartPage.expectContainsProduct(product.name);
  }

  const expectedTotal = PRODUCTS.reduce((sum, product) => sum + product.price, 0);
  await cartPage.expectTotal(CURRENCY_FORMAT.format(expectedTotal));
});
