import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** The /login route (redesigned — role/text locators, not the old modal IDs). */
export class LoginPage extends BasePage {
  readonly openButton = (): Locator => this.page.locator('#menu-item-19'); // header "Login" nav item
  readonly heading = (): Locator => this.page.getByRole('heading', { name: /welcome back/i });
  readonly email = (): Locator => this.page.locator('#login_form_username');
  readonly password = (): Locator => this.page.locator('#login_form_password');
  readonly submit = (): Locator => this.page.locator('#login-submit-btn');
  readonly requestOtpButton = (): Locator => this.page.getByRole('button', { name: /request otp/i });
  readonly resendOtpButton = (): Locator => this.page.getByRole('button', { name: /resend otp/i });
  readonly backButton = (): Locator => this.page.getByRole('button', { name: /back/i });
  readonly rememberMe = (): Locator => this.page.getByRole('checkbox', { name: /remember me/i });
  readonly registerLink = (): Locator => this.page.getByText('Register', { exact: true });
  readonly forgotPasswordLink = (): Locator => this.page.getByRole('link', { name: /forgot password/i });
  readonly requiredMarks = (): Locator => this.page.locator('#login_form span.required, form span.required');
  readonly explainError = (): Locator => this.page.locator('.ant-form-item-explain-error');
  readonly startTopicLink = (): Locator => this.page.getByRole('link', { name: /start a topic/i });

  readonly social = {
    facebook: (): Locator => this.page.getByRole('button', { name: 'facebook' }),
    google: (): Locator => this.page.getByRole('button', { name: /google/i }),
    linkedin: (): Locator => this.page.getByRole('button', { name: 'linkedin' }),
    github: (): Locator => this.page.getByRole('button', { name: 'github' }),
  };

  // Post-login header menu -> logout.
  readonly profileMenu = (): Locator => this.page.locator('#profile_link');
  readonly logoutMenuItem = (): Locator => this.page.locator('#menu-item-3');
  readonly loggedOutLoginLink = (): Locator => this.page.locator('#menu-item-19');

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

  /** Mark a field touched so Ant shows its inline required/format error even
   *  though the submit button stays disabled. */
  async triggerFieldValidation(field: Locator): Promise<void> {
    await field.click();
    await field.fill(' ');
    await field.fill('');
    await field.blur();
  }

  async logout(): Promise<void> {
    // Ant dropdown re-mounts during its open animation and can render partly
    // off-screen, so poll: (re)open the menu and dispatch the click directly
    // until logout actually takes effect.
    await expect(async () => {
      await this.profileMenu().click();
      await expect(this.logoutMenuItem()).toBeAttached({ timeout: 3_000 });
      await this.logoutMenuItem().dispatchEvent('click');
      await expect(this.loggedOutLoginLink()).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
  }
}
