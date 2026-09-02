import { test, expect, SIGNED_OUT } from '../fixtures/test';
import { RegistrationInput } from '../pages/RegistrationPage';
import { credentials, REG, uniqueEmail } from '../data/testData';

/**
 * Parity port of the registration cases in test_suites/misc_tests.py
 * (reg_list_3..18). The redesigned /registration page keeps the Sign Up button
 * disabled until the form validates, so negative cases assert the inline error
 * after touching the offending field, not after a submit click.
 */

const OTP_SENT = /registration code has been sent/i;

function valid(overrides: Partial<RegistrationInput> = {}): RegistrationInput {
  return {
    firstName: REG.firstName,
    lastName: REG.lastName,
    email: uniqueEmail('reg'),
    phone: REG.mobile,
    password: credentials.password,
    confirmPassword: credentials.password,
    ...overrides,
  };
}

test.describe('Registration', () => {
  test.use(SIGNED_OUT);

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('click on "join now" opens the registration page', async ({ page, registrationPage }) => {
    await registrationPage.joinNowText().click();
    await expect(registrationPage.title()).toContainText(/create your account/i);
  });

  test('registration with valid credential sends an OTP', async ({ registrationPage }) => {
    test.fixme(true, 'Submit is gated by reCAPTCHA; #otp-note-text never appears in automation (also failing in the Selenium suite).');
    await registrationPage.open();
    await registrationPage.register(valid());
    await expect(registrationPage.otpSentNote()).toContainText(OTP_SENT);
  });

  test('registration first name with spaces sends an OTP', async ({ registrationPage }) => {
    test.fixme(true, 'Submit is gated by reCAPTCHA; #otp-note-text never appears in automation (also failing in the Selenium suite).');
    await registrationPage.open();
    await registrationPage.register(valid({ firstName: REG.firstNameWithSpaces, email: uniqueEmail('space') }));
    await expect(registrationPage.otpSentNote()).toContainText(OTP_SENT);
  });

  test('registration with all mandatory fields sends an OTP', async ({ registrationPage }) => {
    test.fixme(true, 'Submit is gated by reCAPTCHA; #otp-note-text never appears in automation (also failing in the Selenium suite).');
    await registrationPage.open();
    await registrationPage.register(valid({ email: uniqueEmail('mand') }));
    await expect(registrationPage.otpSentNote()).toContainText(OTP_SENT);
  });

  // --- negative cases: fill a valid form, break one field, blur, assert error ---

  test('registration with blank first name', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.firstName().click();
    await registrationPage.firstName().fill('x');
    await registrationPage.firstName().fill('');
    await registrationPage.firstName().blur();
    await expect(registrationPage.explainError().filter({ hasText: /input your first name/i })).toBeVisible();
  });

  test('registration with blank last name', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.lastName().click();
    await registrationPage.lastName().fill('x');
    await registrationPage.lastName().fill('');
    await registrationPage.lastName().blur();
    await expect(registrationPage.explainError().filter({ hasText: /input your last name/i })).toBeVisible();
  });

  test('registration with blank email', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.email().click();
    await registrationPage.email().fill('x');
    await registrationPage.email().fill('');
    await registrationPage.email().blur();
    await expect(registrationPage.explainError().filter({ hasText: /input your e-?mail/i })).toBeVisible();
  });

  test('registration with blank password', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.password().click();
    await registrationPage.password().fill('x');
    await registrationPage.password().fill('');
    await registrationPage.password().blur();
    await expect(registrationPage.explainError().filter({ hasText: /input your password/i })).toBeVisible();
  });

  test('registration with invalid password complexity', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.password().fill('ab123');
    await registrationPage.password().blur();
    await expect(registrationPage.explainError().filter({ hasText: /password must contain/i })).toBeVisible();
  });

  test('registration with invalid email', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.email().fill(REG.invalidEmail);
    await registrationPage.email().blur();
    await expect(
      registrationPage.explainError().filter({ hasText: /valid email|input is not valid/i }),
    ).toBeVisible();
  });

  test('registration with non-numeric mobile number is rejected', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.phone().fill('abcdefghij');
    await registrationPage.phone().blur();
    await expect(
      registrationPage.explainError().filter({ hasText: /valid contact number|valid phone number/i }),
    ).toBeVisible();
  });

  test('registration with too-short mobile number', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.phone().fill('12345');
    await registrationPage.phone().blur();
    await expect(
      registrationPage.explainError().filter({ hasText: /valid contact number|at least 10 digits/i }),
    ).toBeVisible();
  });

  test('registration with blank confirm password', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.password().fill(credentials.password);
    await registrationPage.confirmPassword().click();
    await registrationPage.confirmPassword().fill('x');
    await registrationPage.confirmPassword().fill('');
    await registrationPage.confirmPassword().blur();
    await expect(
      registrationPage.explainError().filter({ hasText: /confirm your password/i }),
    ).toBeVisible();
  });

  test('registration with mismatched passwords', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.password().fill(credentials.password);
    await registrationPage.confirmPassword().fill('Different@123');
    await registrationPage.confirmPassword().blur();
    await expect(
      registrationPage.explainError().filter({ hasText: /does not match/i }),
    ).toBeVisible();
  });

  test('one-time request code with valid credentials shows "Resend OTP"', async ({ loginPage }) => {
    await loginPage.openModal();
    await loginPage.email().fill(credentials.username);
    await loginPage.requestOtpButton().click();
    await expect(loginPage.resendOtpButton()).toBeVisible();
  });

  test('registration social providers are available', async ({ registrationPage }) => {
    await registrationPage.open();
    for (const key of ['facebook', 'google', 'linkedin', 'github'] as const) {
      await expect(registrationPage.social[key]()).toBeVisible();
      await expect(registrationPage.social[key]()).toBeEnabled();
    }
  });
});
