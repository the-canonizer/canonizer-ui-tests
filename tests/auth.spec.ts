import { test, expect } from '../fixtures/test';

test.describe('Authentication', () => {
  test('saved session lands authenticated on the home page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Browse More', { exact: false })).toBeVisible();
  });

  test('logout returns to the signed-out state', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // TODO(port): wire the real logout control from the account menu.
    test.fixme(true, 'Port from Selenium: CanonizerLoginPage.logout()');
  });
});
