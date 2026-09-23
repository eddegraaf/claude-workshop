import { test } from '../../fixtures/auth.fixture';
import { ProductPage } from '../../pages/ProductPage.page';
import { CartPage } from '../../pages/CartPage.page';
import { CheckoutPage } from '../../pages/CheckoutPage.page';
import { BillingAddress } from '../../types/checkout.types';

const PRODUCT_SLUG = 'ball-chair';
const PRODUCT_NAME = 'Ball Chair';

const BILLING_ADDRESS: BillingAddress = {
  firstName: 'QA',
  lastName: 'Worker',
  city: 'Springfield',
  postalCode: '12345',
  country: 'United States',
};

test('buys two Ball Chair variants and confirms the order', async ({ authenticatedPage }) => {
  // This flow does many full page navigations (product page twice, cart, and all five
  // checkout wizard steps) against a real external site — comfortably exceeds the 30s
  // default, and 60s wasn't consistently enough under concurrent worker load either.
  test.setTimeout(90_000);

  const productPage = new ProductPage(authenticatedPage);
  const cartPage = new CartPage(authenticatedPage);
  const checkoutPage = new CheckoutPage(authenticatedPage);

  // Each worker registers its own account (see fixtures/auth.fixture.ts), but repeated runs
  // within the same worker reuse it, so its cart may already hold items from a prior run;
  // start clean so this checkout only covers the two variants added below.
  await cartPage.goto();
  await cartPage.clear();

  // Unit 1: the "Color" attribute (White/Black).
  await productPage.goto(PRODUCT_SLUG);
  await productPage.selectAttributeOption('Color', 'White');
  await productPage.addToCart();

  // Unit 2: the "Leather color" attribute (15 options, including Blue) — "Color" itself has
  // no Blue option on this product, so the second variant is expressed here instead.
  await productPage.goto(PRODUCT_SLUG);
  await productPage.selectAttributeOption('Leather color', 'Blue');
  await productPage.addToCart();

  await cartPage.goto();
  await cartPage.expectContainsProduct(PRODUCT_NAME);

  await cartPage.checkout();
  await checkoutPage.completePurchase(BILLING_ADDRESS);
  await checkoutPage.expectOrderConfirmed();
});
