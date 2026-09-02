import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** Create / update camps. A camp is created from its host topic page via the
 *  "Create Camp" button, which routes to /camp/create/<slug>/1-Agreement. */
export class CampPage extends BasePage {
  readonly nameInput = (): Locator => this.page.locator('#create_new_camp_camp_name');
  readonly nameError = (): Locator => this.page.locator('#create_new_camp_camp_name_help');
  readonly createButton = (): Locator => this.page.locator('#create-camp-btn');
  readonly discardButton = (): Locator => this.page.locator('#cancel-btn');
  readonly requiredMarks = (): Locator => this.page.locator('span.required');
  readonly createCampTrigger = (): Locator => this.page.getByRole('button', { name: /create camp/i });

  async openCreateFromTopic(topicSlug: string): Promise<void> {
    await this.goto(`/topic/${topicSlug}/1-Agreement`);
    await this.createCampTrigger().first().click();
    await this.page.waitForURL(/\/camp\/create\//, { timeout: 45_000, waitUntil: 'commit' });
    await expect(this.nameInput()).toBeVisible();
  }

  /** Fill just the required camp name and submit; resolves once the app
   *  navigates back to the topic. */
  async createCamp(name: string): Promise<void> {
    await this.nameInput().fill(name);
    await expect(this.createButton()).toBeEnabled();
    await this.createButton().click();
    await this.page.waitForURL(/\/topic\//, { timeout: 45_000, waitUntil: 'commit' });
  }
}
