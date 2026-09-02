import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** Camp statement editor + history.
 *  Flow: camp page → "Add Statement" → /create/statement/<topic>/<camp> →
 *  type into the rich-text editor → "Publish Statement" → /statement/history/… */
export class StatementPage extends BasePage {
  readonly addStatementButton = (): Locator => this.page.getByRole('button', { name: /add statement/i });
  readonly heading = (): Locator => this.page.getByText(/adding camp statement/i);
  readonly editor = (): Locator =>
    this.page.locator('[contenteditable="true"], .ql-editor, .ProseMirror').first();
  readonly publishButton = (): Locator => this.page.locator('#publish-button');
  readonly discardButton = (): Locator => this.page.locator('#discard-button');
  readonly saveDraftButton = (): Locator => this.page.locator('#save-draft-button');
  readonly previewButton = (): Locator => this.page.getByRole('button', { name: /preview statement/i });
  readonly imageNote = (): Locator => this.page.getByText(/maximum allowed file size is 5 ?mb/i);

  // history page
  readonly historyHeading = (): Locator => this.page.getByRole('button', { name: /statement history/i });
  readonly editBasedOnThis = (): Locator => this.page.getByRole('button', { name: /edit based on this/i });

  /** From a camp page, open the statement editor. */
  async openAddStatement(): Promise<void> {
    await this.addStatementButton().first().click();
    await this.page.waitForURL(/\/create\/statement\//, { timeout: 30_000, waitUntil: 'commit' });
    await expect(this.editor()).toBeVisible();
  }

  async typeStatement(text: string): Promise<void> {
    await this.editor().click();
    await this.editor().type(text);
  }

  async publish(text: string): Promise<void> {
    await this.typeStatement(text);
    await expect(this.publishButton()).toBeEnabled();
    await this.publishButton().click();
    await this.page.waitForURL(/\/statement\/history\//, { timeout: 30_000, waitUntil: 'commit' });
  }

  async openEdit(): Promise<void> {
    await this.editBasedOnThis().click();
    await this.page.waitForURL(/\/(manage|create)\/statement\//, { timeout: 20_000, waitUntil: 'commit' });
    await expect(this.editor()).toBeVisible();
  }
}
