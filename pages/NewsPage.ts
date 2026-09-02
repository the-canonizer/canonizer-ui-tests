import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** Add / edit news feed items. /addnews/<slug>/1-Agreement */
export class NewsPage extends BasePage {
  readonly heading = (): Locator => this.page.getByRole('heading', { name: /add news/i });
  readonly linkInput = (): Locator => this.page.getByRole('textbox', { name: /link/i });
  readonly displayTextInput = (): Locator =>
    this.page.getByRole('textbox', { name: /news text|display text/i });
  readonly createButton = (): Locator => this.page.getByRole('button', { name: /create news/i });
  readonly cancelButton = (): Locator => this.page.getByRole('button', { name: /^cancel/i });
  readonly requiredMarks = (): Locator => this.page.locator('span.required');
  readonly explainError = (): Locator => this.page.locator('.ant-form-item-explain-error');

  async open(slug: string): Promise<void> {
    await this.goto(`/addnews/${slug}/1-Agreement`);
    await expect(this.createButton()).toBeVisible();
  }

  async fill(link: string, displayText: string): Promise<void> {
    await this.linkInput().fill(link);
    await this.displayTextInput().fill(displayText);
    await this.displayTextInput().blur();
  }

  async create(link: string, displayText: string): Promise<void> {
    await this.fill(link, displayText);
    await this.createButton().click();
  }
}
