import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** The login modal, opened from the header. IDs carried over from the existing
 *  Selenium suite's Identifiers.py (LoginPageIdentifiers). */
export class LoginPage extends BasePage {
  readonly openButton = (): Locator => this.page.locator('#menu-item-19');
  readonly email = (): Locator => this.page.locator('#login_form_username');
  readonly password = (): Locator => this.page.locator('#login_form_password');
  readonly submit = (): Locator => this.page.locator('#login-submit-btn');
  readonly closeButton = (): Locator => this.page.locator('#modal-close-btn');
  readonly registerNowLink = (): Locator => this.page.locator('#dont-account-link-tag');
  readonly forgotPasswordLink = (): Locator => this.page.locator('#forgot-password-link');
  readonly rememberMe = (): Locator => this.page.locator('#login_form_remember');

  async openModal(): Promise<void> {
    await this.openButton().click();
    await expect(this.email()).toBeVisible();
  }

  async fillCredentials(user: string, pass: string): Promise<void> {
    await this.email().fill(user);
    await this.password().fill(pass);
  }

  async submitLogin(): Promise<void> {
    await this.submit().click();
  }

  /** Full happy-path login, leaving the browser on the authenticated landing page. */
  async login(user: string, pass: string): Promise<void> {
    await this.openModal();
    await this.fillCredentials(user, pass);
    await this.submitLogin();
    await expect(this.email()).toBeHidden();
    await expect(this.browseMore()).toBeVisible({ timeout: 20_000 });
  }
}
