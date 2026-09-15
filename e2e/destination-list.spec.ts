import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

interface ContentRecord {
  readonly name: string;
}

/** The client's content file is the only source; the expectations follow it, never the page. */
const destinations = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/destinations.json', import.meta.url)), 'utf8'),
) as ContentRecord[];

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
const namesInOrder = destinations.map((destination) => destination.name).sort(collator.compare);

test.describe('the destination list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('shows every destination in the content file, in name order', async ({ page }) => {
    const items = page.getByRole('list', { name: 'Destinations' }).getByRole('listitem');

    await expect(items).toHaveCount(destinations.length);
    await expect(items.getByRole('heading', { level: 2 })).toHaveText(namesInOrder);
  });

  test('has one level-one heading naming the page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Destinations');
    await expect(page).toHaveTitle('Visit Pakistan — destinations');
  });

  test('offers the skip link as the first tab stop', async ({ page }) => {
    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  });

  test('has no serious or critical accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(
      results.violations
        .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
        .map((violation) => violation.id),
    ).toEqual([]);
  });
});
