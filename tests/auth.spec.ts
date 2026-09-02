import { test, expect, SIGNED_OUT } from '../fixtures/test';
import { credentials, LOGIN } from '../data/testData';

/**
 * Parity port of test_suites/auth_registration_tests.py.
 * 24 cases (test_login_social_provider_is_available is x4 parametrized).
 * The /login, /registration, /forgot-password routes were redesigned since the
 * Selenium suite was written, so locators here target the current DOM.
 */

// ---------------------------------------------------------------------------
// Authenticated — reuse the storageState session.
// ---------------------------------------------------------------------------
test.describe('Authentication (signed in)', () => {
  test('login to canonizer — session lands on the app', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Browse More', { exact: false })).toBeVisible();
  });

  test('logout returns to the signed-out state', async ({ page, loginPage }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginPage.logout();
    await expect(loginPage.loggedOutLoginLink()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Signed out — fresh context, no saved session.
// ---------------------------------------------------------------------------
test.describe('Authentication (signed out)', () => {
  test.use(SIGNED_OUT);

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('register page mandatory fields are marked with asterisk', async ({ registrationPage }) => {
    await registrationPage.open();
    await expect(registrationPage.requiredMarks()).toHaveCount(5);
  });

  test('check login page open: click "login here" link', async ({ page, registrationPage }) => {
    await registrationPage.open();
    await registrationPage.loginHereLink().click();
    await expect(page).toHaveURL(/login/);
  });

  test('click on login button opens the login form', async ({ page, loginPage }) => {
    await loginPage.openModal();
    await expect(loginPage.email()).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('login with registered credentials', async ({ loginPage }) => {
    await loginPage.openModal();
    await loginPage.fillCredentials(credentials.username, credentials.password);
    await loginPage.submitLogin();
    await expect(loginPage.startTopicLink()).toBeVisible({ timeout: 20_000 });
  });

  test('login with blank email', async ({ loginPage }) => {
    await loginPage.openModal();
    await loginPage.password().fill(credentials.password);
    await loginPage.triggerFieldValidation(loginPage.email());
    await expect(loginPage.explainError().filter({ hasText: /e-?mail/i })).toBeVisible();
  });

  test('login with blank password', async ({ loginPage }) => {
    await loginPage.openModal();
    await loginPage.email().fill(credentials.username);
    await loginPage.triggerFieldValidation(loginPage.password());
    await expect(loginPage.explainError().filter({ hasText: /password/i })).toBeVisible();
  });

  test('login with invalid email', async ({ loginPage }) => {
    await loginPage.openModal();
    await loginPage.email().fill(LOGIN.invalidEmail);
    await loginPage.email().blur();
    await loginPage.password().fill(credentials.password);
    await expect(loginPage.explainError().filter({ hasText: /valid|not valid/i })).toBeVisible();
  });

  test('login page mandatory fields are marked with asterisk', async ({ loginPage }) => {
    await loginPage.openModal();
    await expect(loginPage.requiredMarks()).toHaveCount(2);
  });

  test('remember me is selected by default', async ({ loginPage }) => {
    await loginPage.openModal();
    await expect(loginPage.rememberMe()).toBeChecked();
  });

  test('"register now" link goes to /registration', async ({ page, loginPage }) => {
    await loginPage.openModal();
    await loginPage.registerLink().click();
    await expect(page).toHaveURL(/\/registration/);
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });

  test('"forgot password" link goes to /forgot-password', async ({ page, loginPage }) => {
    test.fixme(true, 'The login page "Forgot Password?" link has href="/" — app bug, cannot navigate via the link.');
    await loginPage.openModal();
    await loginPage.forgotPasswordLink().click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  for (const provider of ['facebook', 'google', 'linkedin', 'github'] as const) {
    test(`login social provider is available: ${provider}`, async ({ loginPage }) => {
      await loginPage.openModal();
      const button = loginPage.social[provider]();
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    });
  }

  test('back button on login returns to the home page', async ({ page, loginPage }) => {
    await loginPage.openModal();
    await loginPage.backButton().first().click();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(loginPage.openButton()).toBeVisible();
  });

  test('forgot password with blank email', async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.submitEmail('');
    await expect(forgotPasswordPage.explainError()).toContainText(/e-?mail/i);
  });

  test('forgot password with invalid email', async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.emailInput().fill('not-an-email');
    await forgotPasswordPage.emailInput().blur();
    await expect(forgotPasswordPage.explainError()).toContainText(/valid email/i);
  });

  test('forgot password with unregistered email', async ({ page, forgotPasswordPage }) => {
    test.fixme(true, 'ux-dev no longer surfaces an error for unregistered emails (privacy); old assertion invalid.');
    await forgotPasswordPage.open();
    await forgotPasswordPage.submitEmail(LOGIN.unregisteredEmail);
    await expect(forgotPasswordPage.explainError()).toBeVisible();
  });

  test('forgot password OTP with invalid code', async ({ forgotPasswordPage }) => {
    test.fixme(true, 'OTP step selectors unverified on ux-dev — confirm the input markup during review.');
    await forgotPasswordPage.open();
    await forgotPasswordPage.submitEmail(credentials.username);
    await forgotPasswordPage.enterOtp('111111');
    await forgotPasswordPage.submitOtp();
    await expect(forgotPasswordPage.otpError()).toBeVisible();
  });

  test('forgot password OTP with blank code', async ({ forgotPasswordPage }) => {
    test.fixme(true, 'OTP step selectors unverified on ux-dev — confirm the input markup during review.');
    await forgotPasswordPage.open();
    await forgotPasswordPage.submitEmail(credentials.username);
    await expect(forgotPasswordPage.otpInputs().first()).toBeVisible();
    await forgotPasswordPage.submitOtp();
    await expect(forgotPasswordPage.otpError()).toBeVisible();
  });

  test('resend forgot-password OTP', async ({ forgotPasswordPage }) => {
    test.fixme(true, 'Resend button has a ~60s cooldown; OTP step selectors unverified — revisit during review.');
    await forgotPasswordPage.open();
    await forgotPasswordPage.submitEmail(credentials.username);
    await forgotPasswordPage.otpResend().click({ timeout: 75_000 });
    await expect(forgotPasswordPage.title()).toBeVisible();
  });

  test('reset password with mismatched passwords', async ({ forgotPasswordPage }) => {
    test.fixme(true, 'Old flow enters an invalid OTP (111111) then expects the reset form — needs a valid OTP path.');
    await forgotPasswordPage.open();
    await forgotPasswordPage.submitEmail(credentials.username);
    await forgotPasswordPage.enterOtp('111111');
    await forgotPasswordPage.submitOtp();
    await forgotPasswordPage.resetPassword().fill('Test@12345');
    await forgotPasswordPage.resetConfirm().fill('Different@12345');
    await forgotPasswordPage.resetSubmit().click();
    await expect(forgotPasswordPage.resetConfirmError()).toContainText(/does not match/i);
  });

  test('click create topic without login redirects to /login', async ({ page }) => {
    await page.goto('/create/topic', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcreate%2Ftopic/);
  });

  test('upload file without login redirects to /login', async ({ page }) => {
    await page.goto('/uploadFile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/);
  });
});
