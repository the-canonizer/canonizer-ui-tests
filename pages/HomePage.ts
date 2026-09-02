import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Landing page + global footer. Footer link IDs from the existing suite's
 *  HomePageIdentifiers. */
export class HomePage extends BasePage {
  readonly footer = {
    browse: (): Locator => this.page.locator('#footer-explore-link-1'),
    createTopic: (): Locator => this.page.locator('#footer-explore-link-3'),
    uploadFile: (): Locator => this.page.locator('#footer-explore-link-5'),
    siteMap: (): Locator => this.page.locator('#footer-explore-link-10'),
    videos: (): Locator => this.page.locator('#footer-explore-link-13'),
    help: (): Locator => this.page.locator('#footer-learn-more-link-4'),
    whitePaper: (): Locator => this.page.locator('#footer-learn-more-link-6'),
    jobs: (): Locator => this.page.locator('#footer-learn-more-link-8'),
    privacy: (): Locator => this.page.locator('#footer-learn-more-link-9'),
    terms: (): Locator => this.page.locator('#footer-learn-more-link-10'),
  };

  readonly header = {
    browse: (): Locator => this.page.locator('#menu-item-2'),
  };
}
