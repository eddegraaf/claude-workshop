import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage.page';
import { BillingAddress } from '../types/checkout.types';

export class CheckoutPage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly cityInput: Locator;
  private readonly postalCodeInput: Locator;
  private readonly countrySelect: Locator;
  // Reused across the billing address, shipping method, and payment method steps — each is
  // a separate page in the wizard with its own single "Next" button.
  private readonly nextButton: Locator;
  private readonly shipToThisAddressButton: Locator;
  private readonly agreeToTermsCheckbox: Locator;
  private readonly confirmButton: Locator;
  private readonly orderReceivedHeading: Locator;
  private readonly orderNumberLink: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByRole('textbox', { name: 'First name' });
    this.lastNameInput = page.getByRole('textbox', { name: 'Last name' });
    this.cityInput = page.getByRole('textbox', { name: 'City' });
    this.postalCodeInput = page.getByRole('textbox', { name: 'Zip / postal code' });
    // select2 (a JS dropdown-enhancement library) duplicates this field's accessible label
    // onto both the real (hidden) <select> and its visual replica widget, so a plain
    // getByLabel matches two elements — neither getByRole nor getByText disambiguates them
    // either, since the replica also exposes a combobox role. Scoped XPath filters the
    // getByLabel match down to the actual <select> itself (self::), which is what
    // selectOption needs to target.
    this.countrySelect = page.getByLabel('Country', { exact: true }).locator('xpath=self::select');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.shipToThisAddressButton = page.getByRole('button', { name: 'Ship to this address' });
    this.agreeToTermsCheckbox = page.getByRole('checkbox', {
      name: 'I agree with the terms of service',
    });
    this.confirmButton = page.getByRole('button', { name: 'Confirm' });
    this.orderReceivedHeading = page.getByRole('heading', {
      name: 'Your order has been received',
    });
    this.orderNumberLink = page.getByRole('link', { name: /^\d+$/ });
  }

  // Drives the full checkout wizard: billing address -> reuse it for shipping -> default
  // shipping method (In-Store Pickup) -> default payment method (Cash on delivery) -> confirm.
  // The shipping/payment steps are left at their pre-selected defaults since this flow isn't
  // testing method selection, only that a purchase can be completed end to end.
  async completePurchase(address: BillingAddress): Promise<void> {
    await this.firstNameInput.fill(address.firstName);
    await this.lastNameInput.fill(address.lastName);
    await this.cityInput.fill(address.city);
    await this.postalCodeInput.fill(address.postalCode);
    await this.countrySelect.selectOption(address.country);
    await this.nextButton.click();

    await this.shipToThisAddressButton.click();

    await this.nextButton.click(); // shipping method
    await this.nextButton.click(); // payment method

    await this.agreeToTermsCheckbox.check();
    await this.confirmButton.click();
  }

  async expectOrderConfirmed(): Promise<void> {
    await expect(this.orderReceivedHeading).toBeVisible();
    await expect(this.orderNumberLink).toBeVisible();
  }
}
