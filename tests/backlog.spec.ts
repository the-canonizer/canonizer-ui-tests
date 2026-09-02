import { test } from '../fixtures/test';

/**
 * Parity port of test_suites/backlog_tests.py — 7 placeholders that assert
 * nothing yet (xfail in the Selenium suite). Kept as test.fixme so the case
 * count and names carry over 1:1.
 */
const BACKLOG: Record<string, string> = {
  'advanced support management: reorder and petitions':
    'Pending page objects/locators for advanced support management (reorder persistence, petitions, confirm-remove).',
  'notifications: single-item read and confirm actions':
    'Pending deterministic fixtures for notification state transitions.',
  'AI agents: register, edit, password, deactivate':
    'Pending locators and flows for AI-agent account operations.',
  'advanced search: filter-combination result counts':
    'Pending stable assertions for combined-filter result counts.',
  'file manager: download, rename, delete, sort persistence':
    'Pending file-manager action locators and deterministic fixture data.',
  'preferred topics: save/discard and wizard flows':
    'Pending preference controls and wizard-flow locators.',
  'social account: link / unlink':
    'Pending callback-safe automation strategy and unlink locators.',
};

test.describe('Backlog', () => {
  for (const [name, reason] of Object.entries(BACKLOG)) {
    test(name, async () => {
      test.fixme(true, reason);
    });
  }
});
