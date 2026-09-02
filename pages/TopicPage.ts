import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** Create / update / history for topics.
 *  Create + Update share the same form (#create_new_topic_* ids still live). */
export class TopicPage extends BasePage {
  // create/update form
  readonly nameInput = (): Locator => this.page.locator('#create_new_topic_topic_name');
  readonly nameError = (): Locator => this.page.locator('#create_new_topic_topic_name_help');
  readonly editSummary = (): Locator => this.page.locator('#create_new_topic_edit_summary');
  readonly saveButton = (): Locator => this.page.locator('#create-topic-btn'); // "Save Topic" / "Update Topic"
  readonly discardButton = (): Locator => this.page.locator('#cancel-btn');
  readonly requiredMarks = (): Locator => this.page.locator('span.required');
  readonly duplicateError = (): Locator =>
    this.page.getByText(/topic with this exact name already exists/i);

  // history page
  readonly historyHeading = (): Locator => this.page.getByRole('button', { name: /topic history/i });
  readonly editBasedOnThis = (): Locator => this.page.getByRole('button', { name: /edit based on this/i });
  readonly viewThisVersion = (): Locator => this.page.getByRole('link', { name: /view this version/i });
  readonly compareCheckboxes = (): Locator => this.page.getByRole('checkbox', { name: /select to compare/i });
  readonly compareButton = (): Locator => this.page.getByRole('button', { name: /compare topics/i });

  async openCreate(): Promise<void> {
    await this.goto('/create/topic');
    await expect(this.nameInput()).toBeVisible();
  }

  /** Create a topic with just the required name; returns the topic slug
   *  (e.g. "7432-PW-Topic-ABCDEFG") parsed from the resulting URL. */
  async createTopic(name: string): Promise<string> {
    await this.openCreate();
    await this.nameInput().fill(name);
    await expect(this.saveButton()).toBeEnabled();
    await this.saveButton().click();
    await this.page.waitForURL(/\/topic\/[^/]+\/1-Agreement/, { timeout: 60_000, waitUntil: 'commit' });
    const m = this.page.url().match(/\/topic\/([^/]+)\/1-Agreement/);
    if (!m) throw new Error(`Unexpected post-create URL: ${this.page.url()}`);
    return m[1];
  }

  async openHistory(slug: string): Promise<void> {
    await this.goto(`/topic/history/${slug}`);
    await expect(this.historyHeading()).toBeVisible();
  }

  async openEdit(slug: string): Promise<void> {
    await this.openHistory(slug);
    await this.editBasedOnThis().click();
    await this.page.waitForURL(/\/manage\/topic\//, { timeout: 20_000, waitUntil: 'commit' });
    await expect(this.nameInput()).toBeVisible();
  }
}
