import { test, expect } from '../fixtures/test';

/** Parity port of the ~10 test_footer_* cases: each footer link routes to the
 *  right in-app URL. One assertion per original case, driven from a table. */
const INTERNAL_LINKS: { name: string; id: string; urlPart: string }[] = [
  { name: 'Browse', id: '#footer-explore-link-1', urlPart: '/browse' },
  { name: 'Create Topic', id: '#footer-explore-link-3', urlPart: '/create/topic' },
  { name: 'Upload File', id: '#footer-explore-link-5', urlPart: '/uploadFile' },
  { name: 'Videos', id: '#footer-explore-link-13', urlPart: '/videos' },
  { name: 'Privacy Policy', id: '#footer-learn-more-link-9', urlPart: '/privacy-policy' },
  { name: 'Terms & Services', id: '#footer-learn-more-link-10', urlPart: '/terms-and-services' },
];

/** IDs carried over from the old Identifiers.py that did not resolve on ux-dev
 *  during the port — re-confirm the selector, then move up into INTERNAL_LINKS. */
const NEEDS_SELECTOR_CHECK: { name: string; id: string; urlPart: string }[] = [
  { name: 'Site Map', id: '#footer-explore-link-10', urlPart: '/sitemap' },
];

test.describe('Footer navigation', () => {
  for (const link of INTERNAL_LINKS) {
    test(`footer "${link.name}" navigates to ${link.urlPart}`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator(link.id).scrollIntoViewIfNeeded();
      await page.locator(link.id).click();
      await expect(page).toHaveURL(new RegExp(link.urlPart.replace(/\//g, '\\/')));
    });
  }

  for (const link of NEEDS_SELECTOR_CHECK) {
    test(`footer "${link.name}" navigates to ${link.urlPart}`, async ({ page }) => {
      test.fixme(true, `Selector ${link.id} not found on ux-dev — re-confirm during port.`);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator(link.id).click();
      await expect(page).toHaveURL(new RegExp(link.urlPart.replace(/\//g, '\\/')));
    });
  }
});
