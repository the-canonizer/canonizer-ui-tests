import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** Camp forum: thread list + create-thread form + posts.
 *  Topic page "Start A Thread" → /forum/<slug>/1-Agreement/threads. */
export class ForumPage extends BasePage {
  readonly startThreadButton = (): Locator => this.page.getByRole('button', { name: /start a thread/i });
  readonly createThreadButton = (): Locator => this.page.locator('#create-thread-button');
  readonly threadTitle = (): Locator => this.page.locator('#create_new_thread_thread_title');
  readonly submitButton = (): Locator => this.page.locator('#submit-btn');
  readonly cancelButton = (): Locator => this.page.locator('#back-btn');
  readonly allThreadsBtn = (): Locator => this.page.locator('#all-thread-btn');
  readonly myThreadsBtn = (): Locator => this.page.locator('#my-thread-btn');
  readonly top10Btn = (): Locator => this.page.locator('#most-replies-btn');
  readonly editor = (): Locator =>
    this.page.locator('[contenteditable="true"], .ql-editor, .ProseMirror').first();

  async openThreadsFromTopic(): Promise<void> {
    await this.startThreadButton().first().click();
    await this.page.waitForURL(/\/forum\/.+\/threads/, { timeout: 45_000, waitUntil: 'commit' });
  }

  async openCreateThreadForm(): Promise<void> {
    await this.createThreadButton().click();
    await expect(this.threadTitle()).toBeVisible();
  }

  /** Full create-thread happy path from the topic page. */
  async createThread(title: string): Promise<void> {
    await this.openThreadsFromTopic();
    await this.openCreateThreadForm();
    await this.threadTitle().fill(title);
    await expect(this.submitButton()).toBeEnabled();
    await this.submitButton().click();
    await this.page.waitForURL(/\/forum\//, { timeout: 45_000, waitUntil: 'commit' });
  }
}
