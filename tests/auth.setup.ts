import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import { STORAGE_STATE } from '../playwright.config';
import { LoginPage } from '../pages/LoginPage';

/** Runs once before everything else (the "setup" project). Logs in through the
 *  UI a single time and saves the session to .auth/user.json, which every other
 *  project loads via storageState — so no spec pays the login cost.
 *
 *  Reuses an existing session only if it still authenticates a protected route;
 *  otherwise logs in fresh. */
setup('authenticate', async ({ browser, page }) => {
  const user = process.env.CANONIZER_USERNAME;
  const pass = process.env.CANONIZER_PASSWORD;
  if (!user || !pass) {
    throw new Error('Set CANONIZER_USERNAME and CANONIZER_PASSWORD in .env (see .env.example).');
  }

  if (fs.existsSync(STORAGE_STATE)) {
    const probe = await browser.newContext({ storageState: STORAGE_STATE });
    const probePage = await probe.newPage();
    await probePage.goto('/create/topic', { waitUntil: 'domcontentloaded' });
    const stillValid = !/\/login/.test(probePage.url());
    await probe.close();
    if (stillValid) {
      setup.skip(true, 'Existing .auth/user.json still authenticates a protected route.');
    }
  }

  const login = new LoginPage(page);
  await login.goto('/');
  await login.login(user, pass);
  await expect(login.browseMore()).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});
