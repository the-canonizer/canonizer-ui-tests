import { test, expect, SIGNED_OUT, uid } from '../fixtures/test';

/**
 * Parity port of test_suites/camp_tests.py (34 cases).
 * A camp is created from its host topic: topic page → "Create Camp" →
 * /camp/create/<slug>/1-Agreement. Form ids (#create_new_camp_camp_name,
 * #create-camp-btn, #cancel-btn) are still live; Parent Camp defaults to
 * "Agreement (root)" so only the name is required.
 */

const OLD_ASP_CAMP_URL = 'https://ux-dev.canonizer.com/topic.asp/6669-Test-dlkskndlksndl/1-Agreement';

test.describe('Camps — create', { tag: '@create' }, () => {
  // Each case creates a topic + a camp; ux-dev slows under parallel create
  // load, so allow one retry on a transient navigation timeout.
  test.describe.configure({ retries: 1 });

  test('load create camp page', async ({ topicPage, campPage }) => {
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    await campPage.openCreateFromTopic(slug);
    await expect(campPage.page).toHaveURL(/\/camp\/create\//);
  });

  test('create camp with valid data', async ({ topicPage, campPage }) => {
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    await campPage.openCreateFromTopic(slug);
    await campPage.createCamp(`PW Camp ${uid()}`);
    await expect(campPage.page).toHaveURL(/\/topic\//);
  });

  test('create camp with only mandatory fields', async ({ topicPage, campPage }) => {
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    await campPage.openCreateFromTopic(slug);
    await campPage.createCamp(`PW CampReq ${uid()}`);
    await expect(campPage.page).toHaveURL(/\/topic\//);
  });

  test('create camp with blank camp name shows an error', async ({ topicPage, campPage }) => {
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    await campPage.openCreateFromTopic(slug);
    await campPage.nameInput().click();
    await campPage.nameInput().fill('x');
    await campPage.nameInput().fill('');
    await campPage.nameInput().blur();
    await expect(campPage.nameError()).toBeVisible();
  });

  test('create camp without mandatory fields keeps you on the form', async ({ topicPage, campPage }) => {
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    await campPage.openCreateFromTopic(slug);
    await expect(campPage.createButton()).toBeDisabled();
    await expect(campPage.page).toHaveURL(/\/camp\/create\//);
  });

  test('create camp with duplicate camp name keeps you on the form', async ({ topicPage, campPage, page }) => {
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    const campName = `PW DupCamp ${uid()}`;
    await campPage.openCreateFromTopic(slug);
    await campPage.createCamp(campName);
    await campPage.openCreateFromTopic(slug);
    await campPage.nameInput().fill(campName);
    await campPage.createButton().click();
    await expect(page).toHaveURL(/\/camp\/create\//);
  });

  test('create camp with invalid camp about url', async ({ topicPage, campPage, page }) => {
    test.fixme(true, 'Camp About URL lives under "Advanced Settings" on the redesigned form — expand + locate field.');
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    await campPage.openCreateFromTopic(slug);
    await campPage.nameInput().fill(`PW Camp ${uid()}`);
    await page.getByRole('button', { name: /advanced settings/i }).click();
    await page.getByLabel(/camp about url/i).fill('google@com');
    await campPage.createButton().click();
    await expect(page).toHaveURL(/\/camp\/create\//);
  });

  test('create camp mandatory fields are marked with asterisk', async ({ topicPage, campPage }) => {
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    await campPage.openCreateFromTopic(slug);
    // Camp Name, Nickname, Parent Camp.
    await expect(campPage.requiredMarks()).toHaveCount(3);
  });

  test('cancel (discard) create camp returns to the topic', async ({ topicPage, campPage, page }) => {
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    await campPage.openCreateFromTopic(slug);
    await campPage.nameInput().fill(`PW Camp ${uid()}`);
    await campPage.discardButton().click();
    const confirm = page.getByRole('button', { name: /^(yes|discard|ok|confirm)$/i });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await expect(page).toHaveURL(/\/topic\//);
  });
});

test.describe('Camps — update / preview / compare', () => {
  const reasons: Record<string, string> = {
    'topic comparison create camp button': 'Depends on the topic-compare flow (needs a seeded multi-version topic).',
    'load camp manage edit page': 'Camp edit is reached via the topic 3-dot "Manage Camp" menu — needs a live-DOM pass.',
    'update camp with valid data': 'Depends on the camp manage/edit page (unverified).',
    'verify submit camp update button': 'Depends on the camp manage/edit page (unverified).',
    'camp preview fields': 'Preview modal removed from the redesigned camp form.',
    'camp preview cancel': 'Preview modal removed from the redesigned camp form.',
    'camp preview submitter nickname': 'Preview modal removed from the redesigned camp form.',
    'compare camp versions': 'Needs a camp with 2+ live versions.',
    'camp comparison displays both versions': 'Needs a camp with 2+ live versions.',
    'submit camp update with invalid url': 'Depends on the camp manage/edit page + Advanced Settings URL field.',
    'update camp with duplicate camp name': 'Depends on the camp manage/edit page (unverified).',
    'verify cancel button functionality on camp update page': 'Depends on the camp manage/edit page (unverified).',
    'verify preview button functionality on camp update page': 'Preview modal removed from the redesigned camp form.',
    'create news available for child camps': 'Belongs to the news area — port there.',
  };
  for (const [name, reason] of Object.entries(reasons)) {
    test(name, async () => {
      test.fixme(true, reason);
    });
  }
});

test.describe('Camps — support, profile & search', () => {
  test('support a camp shows the thank-you confirmation', async ({ topicPage, campPage, page }) => {
    test.fixme(true, 'Support flow: Manage Support → Direct → Submit; confirm the redesigned controls during review.');
    const slug = await topicPage.createTopic(`PW CampHost ${uid()}`);
    await campPage.openCreateFromTopic(slug);
    await campPage.createCamp(`PW Camp ${uid()}`);
    await page.getByRole('button', { name: /manage support/i }).click();
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/thank you for adding your support/i)).toBeVisible();
  });

  test('profile: direct supported camps tab', async ({ page }) => {
    await page.goto('/settings?tab=direct_supported_camps', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/tab=direct_supported_camps/);
    await expect(page.getByText(/direct supported camps/i).first()).toBeAttached();
  });

  test('profile: delegated supported camps tab', async ({ page }) => {
    await page.goto('/settings?tab=delegate_supported_camp', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/tab=delegate_supported_camp/);
    await expect(page.getByText(/delegated supported camps/i).first()).toBeAttached();
  });

  test('browse profile setting → supported camps', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(async () => {
      await page.locator('#profile_link').click();
      await page.locator('#link-supported-camps').dispatchEvent('click');
      await expect(page).toHaveURL(/supported_camps|supported-camps/, { timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
  });

  test('advanced search camp tab navigation', async () => {
    test.fixme(true, 'Advanced-search page not yet ported (browse-search area).');
  });
  test('advanced search camp bydate filter route', async () => {
    test.fixme(true, 'Advanced-search page not yet ported (browse-search area).');
  });
});

test.describe('Camps — auth & legacy', () => {
  test('legacy .asp camp URL redirects to the canonical route', async ({ page }) => {
    await page.goto(OLD_ASP_CAMP_URL, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/topic\/6669-.*\/1-Agreement/);
  });

  test.describe('signed out', () => {
    test.use(SIGNED_OUT);

    test('create camp redirects to /login', async ({ page }) => {
      await page.goto('/camp/create/88-Theories-of-Consciousness/1-Agreement', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/login/);
    });

    test('direct supported camps setting redirects to /login', async ({ page }) => {
      await page.goto('/settings?tab=direct_supported_camps', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/login/);
    });

    test('delegate supported camp setting redirects to /login', async ({ page }) => {
      await page.goto('/settings?tab=delegate_supported_camp', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
