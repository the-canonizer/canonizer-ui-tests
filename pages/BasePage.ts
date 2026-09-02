import { Page, Locator, expect } from '@playwright/test';

/** Shared helpers for every page object. Page objects hold locators + actions
 *  only — assertions live in the specs. */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = '/'): Promise<void> {
    // The Canonizer app's `load` event is slow/unreliable (analytics, chunks).
    // Wait for the DOM, then let explicit element waits do the syncing.
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /** A stable landmark that only renders for an authenticated session. */
  browseMore(): Locator {
    return this.page.getByText('Browse More', { exact: false });
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.browseMore()).toBeVisible();
  }
}
