import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';

/** Extend the base test with a page object per area. Add new ones here as the
 *  port progresses (TopicPage, CampPage, ...). */
type Pages = {
  loginPage: LoginPage;
  homePage: HomePage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

export { expect } from '@playwright/test';

/** Per-test unique suffix so data-creating tests never collide or depend on order. */
export function uid(prefix = ''): string {
  const s = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return prefix ? `${prefix}-${s}` : s;
}
