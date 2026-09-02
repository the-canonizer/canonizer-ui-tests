import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import { STORAGE_STATE } from '../playwright.config';
import { LoginPage } from '../pages/LoginPage';

/** How long a saved session is trusted before we log in again. */
const MAX_SESSION_AGE_MS = 60 * 60 * 1000; // 1 hour

/** Runs once before everything else (the "setup" project). Logs in through the
 *  UI a single time and saves the session to .auth/user.json, which every other
 *  project loads via storageState — so no spec pays the login cost. */
setup('authenticate', async ({ page }) => {
  if (fs.existsSync(STORAGE_STATE)) {
    const ageMs = Date.now() - fs.statSync(STORAGE_STATE).mtimeMs;
    if (ageMs < MAX_SESSION_AGE_MS) {
      setup.skip(true, `Reusing session from ${Math.round(ageMs / 1000)}s ago.`);
    }
  }

  const user = process.env.CANONIZER_USERNAME;
  const pass = process.env.CANONIZER_PASSWORD;
  if (!user || !pass) {
    throw new Error('Set CANONIZER_USERNAME and CANONIZER_PASSWORD in .env (see .env.example).');
  }

  const login = new LoginPage(page);
  await login.goto('/');
  await login.login(user, pass);

  await expect(login.browseMore()).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});
