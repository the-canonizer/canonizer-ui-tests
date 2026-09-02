import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { TopicPage } from '../pages/TopicPage';
import { CampPage } from '../pages/CampPage';

/** Extend the base test with a page object per area. Add new ones here as the
 *  port progresses (CampPage, StatementPage, ...). */
type Pages = {
  loginPage: LoginPage;
  homePage: HomePage;
  registrationPage: RegistrationPage;
  forgotPasswordPage: ForgotPasswordPage;
  topicPage: TopicPage;
  campPage: CampPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },
  topicPage: async ({ page }, use) => {
    await use(new TopicPage(page));
  },
  campPage: async ({ page }, use) => {
    await use(new CampPage(page));
  },
});

export { expect } from '@playwright/test';

/** Per-test unique suffix so data-creating tests never collide or depend on order. */
export function uid(prefix = ''): string {
  const s = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return prefix ? `${prefix}-${s}` : s;
}

/** Force a fresh, signed-out browser context for a describe block. */
export const SIGNED_OUT = { storageState: { cookies: [], origins: [] } };
