import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage.page';

export class RegisterPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly registerButton: Locator;
  private readonly loggedOutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: 'Email *' });
    this.usernameInput = page.getByRole('textbox', { name: 'Username *' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password *', exact: true });
    this.confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm password *' });
    this.registerButton = page.getByRole('button', { name: 'Register' });
    this.loggedOutLink = page.getByRole('link', { name: 'Log in' });
  }

  async goto(): Promise<void> {
    await this.navigate('/register');
  }

  async register(email: string, username: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.registerButton.click();
  }

  // Registering logs the new account in immediately, so this reuses the same "Log in"
  // link disappearing signal a login flow would use to confirm success.
  async expectRegistered(): Promise<void> {
    await expect(this.loggedOutLink).toBeHidden();
  }
}
