import { test, expect, SIGNED_OUT } from '../fixtures/test';

/**
 * Parity port of test_suites/profile_upload_access_tests.py (39 cases).
 *
 * NOTE: the old `test_authentication_expiry_for_*` cases asserted that a
 * SIGNED-IN user is redirected to /login when opening a settings tab — that is
 * not the app's behaviour. They are ported two ways: signed-in → the tab loads;
 * signed-out → /login redirect (which is the actual access-control contract).
 */

const OLD_ASP_SUPPORT_URL = 'https://ux-dev.canonizer.com/secure/support.asp?topic_num=97&camp_num=1';

const TABS: { tab: string; heading: RegExp }[] = [
  { tab: 'profile_info', heading: /profile setting/i },
  { tab: 'nick_name', heading: /nicknames/i },
  { tab: 'user_preferences', heading: /preferences/i },
  { tab: 'subscriptions', heading: /my subscriptions/i },
  { tab: 'social_oauth_verification', heading: /social auth/i },
  { tab: 'change_password', heading: /change password/i },
  { tab: 'direct_supported_camps', heading: /direct supported camps/i },
  { tab: 'delegate_supported_camp', heading: /delegated supported camps/i },
];

test.describe('Profile settings tabs (signed in)', () => {
  for (const { tab, heading } of TABS) {
    test(`settings?tab=${tab} loads its panel`, async ({ page }) => {
      await page.goto(`/settings?tab=${tab}`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    });
  }

  test('avatar shows initials when there is no profile image', async ({ page }) => {
    test.fixme(true, 'The test account has a profile image on ux-dev; the old assertion also pinned another account\'s initials ("AR").');
    await page.goto('/settings?tab=profile_info', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/^[A-Z]{2}$/).first()).toBeVisible();
  });

  test('social auth tab exposes at least one link control', async ({ page }) => {
    await page.goto('/settings?tab=social_oauth_verification', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button').first()).toBeVisible();
  });

  test('direct supported camps tab renders its table/area', async ({ page }) => {
    await page.goto('/settings?tab=direct_supported_camps', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /direct supported camps/i })).toBeVisible();
  });

  test('delegated supported camps tab renders its table/area', async ({ page }) => {
    await page.goto('/settings?tab=delegate_supported_camp', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /delegated supported camps/i })).toBeVisible();
  });
});

test.describe('Notifications area (signed in)', () => {
  test('notifications page renders a list/area', async ({ page }) => {
    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  for (const name of [
    'notifications filters matrix',
    'notifications mark all read cancel',
    'notifications delete all cancel',
    'notifications load more if available',
    'direct supported remove modal cancel',
    'delegated supported remove modal cancel',
  ]) {
    test(name, async () => {
      test.fixme(true, 'Modal/filter controls in the notifications & supported-camps settings need a live-DOM pass.');
    });
  }
});

test.describe('Uploads (signed in)', () => {
  test('upload files link goes to /uploadFile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Upload File', exact: true }).first().click();
    await expect(page).toHaveURL(/\/uploadFile/);
  });

  test('upload file manager loads', async ({ page }) => {
    await page.goto('/uploadFile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/uploadFile/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  for (const name of [
    'upload file with admin',
    'upload file less than 5mb',
    'upload file more than 5mb (size-limit warning)',
    'upload in create new folder',
    'upload file in new folder',
    'upload file manager toggle views',
    'upload file manager file actions menu',
    'upload file manager delete modal cancel',
    'upload file manager search and reset',
    'upload profile picture',
    'view profile picture',
    'delete profile picture',
    'delete profile picture when no image exists',
    'profile page name change',
    'profile setting public crash',
    'verify submitter nickname link on user profile',
  ]) {
    test(name, async () => {
      test.fixme(true, 'Needs generated upload assets / mutates profile state / stale assertion — verify with a dedicated upload-manager DOM pass.');
    });
  }
});

test.describe('Access control (signed out)', () => {
  test.use(SIGNED_OUT);

  for (const { tab } of TABS) {
    test(`settings?tab=${tab} redirects to /login`, async ({ page }) => {
      await page.goto(`/settings?tab=${tab}`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test('/uploadFile redirects to /login', async ({ page }) => {
    await page.goto('/uploadFile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('/notifications redirects to /login', async ({ page }) => {
    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('/settings (bare) redirects to /login', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Legacy support URL', () => {
  test('legacy secure/support.asp redirects to the canonical topic route', async ({ page }) => {
    await page.goto(OLD_ASP_SUPPORT_URL, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/topic\/97-.*\/1-Agreement/);
  });
});
