import { test, expect, SIGNED_OUT, uid } from '../fixtures/test';
import type { TopicPage } from '../pages/TopicPage';
import type { CampPage } from '../pages/CampPage';

/**
 * Parity port of test_suites/statement_tests.py (21 cases).
 * Every case chains topic → camp → statement, so each test seeds its own
 * topic + camp first. ux-dev slows under parallel creation — retries:1.
 */

async function seedCamp(topicPage: TopicPage, campPage: CampPage): Promise<void> {
  const slug = await topicPage.createTopic(`PW StHost ${uid()}`);
  await campPage.openCreateFromTopic(slug);
  await campPage.createCamp(`PW Camp ${uid()}`);
}

test.describe('Camp statements', () => {
  test.describe.configure({ retries: 1 });

  test('camp page shows the "Add Statement" button', async ({ topicPage, campPage, statementPage }) => {
    await seedCamp(topicPage, campPage);
    await expect(statementPage.addStatementButton().first()).toHaveText(/add statement/i);
  });

  test('load camp statement editor', async ({ topicPage, campPage, statementPage }) => {
    await seedCamp(topicPage, campPage);
    await statementPage.openAddStatement();
    await expect(statementPage.heading()).toBeVisible();
  });

  test('add camp statement with valid data publishes it', async ({ topicPage, campPage, statementPage, page }) => {
    await seedCamp(topicPage, campPage);
    await statementPage.openAddStatement();
    await statementPage.publish('Automated Playwright statement with valid data.');
    await expect(page).toHaveURL(/\/statement\/history\//);
    await expect(statementPage.historyHeading()).toBeVisible();
  });

  test('statement editor exposes the mandatory-marked publish control', async ({ topicPage, campPage, statementPage }) => {
    await seedCamp(topicPage, campPage);
    await statementPage.openAddStatement();
    await expect(statementPage.publishButton()).toHaveText(/publish statement/i);
  });

  test('publish stays disabled with no statement text', async ({ topicPage, campPage, statementPage }) => {
    await seedCamp(topicPage, campPage);
    await statementPage.openAddStatement();
    await expect(statementPage.publishButton()).toBeDisabled();
  });

  test('add camp statement with trailing spaces publishes it', async ({ topicPage, campPage, statementPage, page }) => {
    await seedCamp(topicPage, campPage);
    await statementPage.openAddStatement();
    await statementPage.publish('Trailing spaces statement.   ');
    await expect(page).toHaveURL(/\/statement\/history\//);
  });

  test('cancel (discard) camp statement returns to the camp', async ({ topicPage, campPage, statementPage, page }) => {
    await seedCamp(topicPage, campPage);
    await statementPage.openAddStatement();
    await statementPage.discardButton().click();
    const confirm = page.getByRole('button', { name: /^(yes|discard|ok|confirm)$/i });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await expect(page).toHaveURL(/\/topic\//);
  });

  test('preview camp statement', async ({ topicPage, campPage, statementPage, page }) => {
    await seedCamp(topicPage, campPage);
    await statementPage.openAddStatement();
    await statementPage.typeStatement('Preview me.');
    await statementPage.previewButton().click();
    await expect(page.getByText(/camp statement/i).first()).toBeVisible();
  });

  test('statement editor shows the 5 MB image note', async ({ topicPage, campPage, statementPage }) => {
    await seedCamp(topicPage, campPage);
    await statementPage.openAddStatement();
    await expect(statementPage.imageNote()).toBeVisible();
  });

  test('load edit camp statement', async () => {
    test.fixme(true, 'A freshly published statement is "Pending" (1h grace period); the history page offers "Commit Changes", not "Edit Based on This". Needs the pending-statement edit path.');
  });

  test('edit camp statement', async () => {
    test.fixme(true, 'Same as "load edit camp statement" — edit control differs while the statement is in its grace period.');
  });

  // --- deeper flows: seeded / multi-version / stale fixtures ---
  const fixmes: Record<string, string> = {
    'add statement for archived camp':
      'Needs a camp toggled to archived via the camp manage/edit page (unverified DOM).',
    'camp statement template':
      'Asserts the pre-filled camp-name template text — confirm the redesigned editor still injects it.',
    'update camp statement with mandatory field':
      'Same edit flow as "edit camp statement"; kept as a distinct case for parity — verify the mandatory-field variant.',
    'edit camp statement with trailing spaces':
      'Edit variant — verify once the base edit flow is stable across retries.',
    'edit camp statement with blank data':
      'Publish should stay disabled when the edited statement is cleared — verify.',
    'compare camp statement':
      'Compare needs a statement with 2+ versions past the grace period.',
    'statement image more than 5 MB (size warning)':
      'Old test hits a hard-coded /manage/statement/8215-update and uploads a generated >5 MB image — needs asset generation + a stable statement id.',
  };
  for (const [name, reason] of Object.entries(fixmes)) {
    test(name, async () => {
      test.fixme(true, reason);
    });
  }
});

test.describe('Camp statements — access control (signed out)', () => {
  test.use(SIGNED_OUT);

  test('create statement route redirects to /login', async ({ page }) => {
    await page.goto('/create/statement/88-Theories-of-Consciousness/1-Agreement', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });
});
