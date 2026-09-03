import { test as base, Page } from '@playwright/test';
import * as fs from 'fs';
import { STORAGE_STATE } from '../playwright.config';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { TopicPage } from '../pages/TopicPage';
import { CampPage } from '../pages/CampPage';
import { StatementPage } from '../pages/StatementPage';
import { ForumPage } from '../pages/ForumPage';
import { NewsPage } from '../pages/NewsPage';

/** Extend the base test with a page object per area. */
type Pages = {
  loginPage: LoginPage;
  homePage: HomePage;
  registrationPage: RegistrationPage;
  forgotPasswordPage: ForgotPasswordPage;
  topicPage: TopicPage;
  campPage: CampPage;
  statementPage: StatementPage;
  forumPage: ForumPage;
  newsPage: NewsPage;
};

/** Log in through the UI on the given page and refresh the saved session file.
 *  ux-dev's auth cookie is short-lived (a few minutes), so a long run outlives
 *  the session created by auth.setup.ts — this recovers it in place. */
type Goto = Page['goto'];

async function reauthenticate(page: Page, rawGoto: Goto): Promise<void> {
  const user = process.env.CANONIZER_USERNAME;
  const pass = process.env.CANONIZER_PASSWORD;
  if (!user || !pass) throw new Error('CANONIZER_USERNAME / CANONIZER_PASSWORD not set');

  await rawGoto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('#login_form_username').fill(user);
  await page.locator('#login_form_password').fill(pass);
  await page.locator('#login-submit-btn').click();
  await page.getByText('Browse More', { exact: false }).waitFor({ state: 'visible', timeout: 20_000 });
  await page.context().storageState({ path: STORAGE_STATE });
}

export const test = base.extend<Pages>({
  /**
   * Wrap `page.goto` so an authed test that gets bounced to /login (expired
   * session) logs back in and retries, transparently. Only active when the
   * spec is using the saved session — SIGNED_OUT describes set `storageState`
   * to an object, so their /login redirects are left alone.
   */
  page: async ({ page, storageState }, use) => {
    const usesSavedSession = storageState === STORAGE_STATE;
    if (usesSavedSession) {
      const origGoto = page.goto.bind(page);
      page.goto = async (url, opts) => {
        const res = await origGoto(url, opts);
        const bouncedToLogin =
          /\/login(\?|$)/.test(page.url()) && !/\/login/.test(String(url));
        if (bouncedToLogin) {
          await reauthenticate(page, origGoto);
          await origGoto(url, opts);
        }
        return res;
      };
    }
    await use(page);
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  registrationPage: async ({ page }, use) => use(new RegistrationPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  topicPage: async ({ page }, use) => use(new TopicPage(page)),
  campPage: async ({ page }, use) => use(new CampPage(page)),
  statementPage: async ({ page }, use) => use(new StatementPage(page)),
  forumPage: async ({ page }, use) => use(new ForumPage(page)),
  newsPage: async ({ page }, use) => use(new NewsPage(page)),
});

export { expect } from '@playwright/test';

/** Per-test unique suffix so data-creating tests never collide or depend on order. */
export function uid(prefix = ''): string {
  const s = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return prefix ? `${prefix}-${s}` : s;
}

/** Force a fresh, signed-out browser context for a describe block. */
export const SIGNED_OUT = { storageState: { cookies: [], origins: [] } };
