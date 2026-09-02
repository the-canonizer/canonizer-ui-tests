import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** /forgot-password → OTP → reset-password routes (redesigned). */
export class ForgotPasswordPage extends BasePage {
  readonly title = (): Locator => this.page.getByRole('heading', { name: /forgot your password/i });
  readonly emailInput = (): Locator => this.page.getByRole('textbox', { name: /email id/i });
  readonly submitBtn = (): Locator => this.page.getByRole('button', { name: /^submit/i });
  readonly explainError = (): Locator => this.page.locator('.ant-form-item-explain-error');

  readonly otpInputs = (): Locator =>
    this.page.locator('input[name^="otp"]:not([type="hidden"]), .ant-otp input');
  readonly otpError = (): Locator => this.page.locator('#otpverify_otp_help, .ant-form-item-explain-error');
  readonly otpResend = (): Locator => this.page.getByRole('button', { name: /resend otp/i });
  readonly otpSubmit = (): Locator => this.page.getByRole('button', { name: /submit|verify/i });

  readonly resetPassword = (): Locator => this.page.locator('#setPassword_password');
  readonly resetConfirm = (): Locator => this.page.locator('#setPassword_confirm');
  readonly resetConfirmError = (): Locator => this.page.locator('#setPassword_confirm_help');
  readonly resetSubmit = (): Locator => this.page.getByRole('button', { name: /save|submit/i });

  async open(): Promise<void> {
    await this.goto('/forgot-password');
    await expect(this.emailInput()).toBeVisible();
  }

  async submitEmail(email: string): Promise<void> {
    await this.emailInput().click();
    if (email) {
      await this.emailInput().fill(email);
      await this.emailInput().blur();
      await this.submitBtn().click();
    } else {
      await this.emailInput().fill(' ');
      await this.emailInput().fill('');
      await this.emailInput().blur();
    }
  }

  async enterOtp(code: string): Promise<void> {
    const fields = this.otpInputs();
    await expect(fields.first()).toBeVisible();
    const count = await fields.count();
    for (let i = 0; i < Math.min(count, code.length); i++) {
      await fields.nth(i).fill(code[i]);
    }
  }

  async submitOtp(): Promise<void> {
    await this.otpSubmit().first().click();
  }
}
