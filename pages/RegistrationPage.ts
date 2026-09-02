import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

/** The /registration route (redesigned "Join Canonizer" page). The Sign Up
 *  button stays disabled until the whole form validates, so negative cases
 *  assert the inline error after blur rather than clicking submit. */
export class RegistrationPage extends BasePage {
  readonly joinNowText = (): Locator => this.page.locator('#join-canonizer-text');
  readonly title = (): Locator => this.page.getByRole('heading', { name: /create your account/i });
  readonly firstName = (): Locator => this.page.getByRole('textbox', { name: /first name/i });
  readonly lastName = (): Locator => this.page.getByRole('textbox', { name: /last name/i });
  readonly email = (): Locator => this.page.getByRole('textbox', { name: /^email/i });
  readonly phone = (): Locator => this.page.getByRole('textbox', { name: /contact number/i });
  readonly password = (): Locator => this.page.getByRole('textbox', { name: /^password/i });
  readonly confirmPassword = (): Locator => this.page.getByRole('textbox', { name: /re-enter password/i });
  readonly submit = (): Locator => this.page.getByRole('button', { name: /sign up/i });
  readonly loginHereLink = (): Locator => this.page.getByRole('link', { name: /^login$/i });
  readonly otpSentNote = (): Locator => this.page.locator('#otp-note-text');
  readonly requiredMarks = (): Locator => this.page.locator('form span.required');
  readonly explainError = (): Locator => this.page.locator('.ant-form-item-explain-error');

  readonly social = {
    facebook: (): Locator => this.page.getByRole('button', { name: 'facebook' }),
    google: (): Locator => this.page.getByRole('button', { name: /google/i }),
    linkedin: (): Locator => this.page.getByRole('button', { name: 'linkedin' }),
    github: (): Locator => this.page.getByRole('button', { name: 'github' }),
  };

  async open(): Promise<void> {
    await this.goto('/registration');
    await expect(this.submit()).toBeVisible();
  }

  async fill(input: RegistrationInput): Promise<void> {
    await this.firstName().fill(input.firstName);
    await this.lastName().fill(input.lastName);
    await this.email().fill(input.email);
    if (input.phone !== undefined) await this.phone().fill(input.phone);
    await this.password().fill(input.password);
    await this.confirmPassword().fill(input.confirmPassword);
    await this.confirmPassword().blur();
  }

  async submitForm(): Promise<void> {
    await expect(this.submit()).toBeEnabled();
    await this.submit().click();
  }

  /** Valid fill + submit — for the OTP-sending happy paths. */
  async register(input: RegistrationInput): Promise<void> {
    await this.fill(input);
    await this.submitForm();
  }
}
