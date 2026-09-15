import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

interface ContentRecord {
  readonly name: string;
  readonly province?: string;
  readonly category?: string;
}

/**
 * Read from the file the page is built from, so these assertions follow the client's content
 * rather than repeating it. Province and category are absent from it today, so the filter
 * specs below skip themselves with a stated reason; when the values arrive they start
 * enforcing with no change here.
 */
const destinations = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/destinations.json', import.meta.url)), 'utf8'),
) as ContentRecord[];

/** The ordering the option lists use — see the collator in src/content/destinations.ts. */
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function valuesOf(field: 'province' | 'category'): string[] {
  const values = destinations
    .map((destination) => destination[field])
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  return [...new Set(values)].sort(collator.compare);
}

function cards(page: Page) {
  return page.getByRole('list', { name: 'Destinations' }).getByRole('listitem');
}

function activeCriteria(page: Page) {
  return page.getByRole('list', { name: 'Active search and filter criteria' }).getByRole('listitem');
}

function searchField(page: Page) {
  return page.getByLabel('Search destinations');
}

test.describe('searching and filtering the destination list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('shows every destination and states the total before anything is entered', async ({ page }) => {
    await expect(cards(page)).toHaveCount(destinations.length);
    await expect(page.getByRole('status')).toHaveText(
      `Showing all ${destinations.length} destinations.`,
    );
  });

  test('shows only Hunza, and the number of matches, for the term “hun”', async ({ page }) => {
    await searchField(page).fill('hun');

    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText('Hunza');
    await expect(page.getByRole('status')).toHaveText(
      `Showing 1 destination of ${destinations.length}.`,
    );
  });

  test('matches Hunza whatever the casing and surrounding whitespace', async ({ page }) => {
    await searchField(page).fill(' HUNZA ');

    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText('Hunza');
  });

  test('states that nothing matches, names the term, and clears it on request', async ({ page }) => {
    await searchField(page).fill('atlantis');

    await expect(page.getByRole('heading', { name: 'No destinations match' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Destinations' })).toHaveCount(0);
    await expect(activeCriteria(page)).toHaveText([/atlantis/]);

    await page.getByRole('button', { name: 'Clear search and filters' }).click();

    await expect(cards(page)).toHaveCount(destinations.length);
    await expect(searchField(page)).toHaveValue('');
    await expect(searchField(page)).toBeFocused();
  });

  test('treats a term containing regex characters as literal text', async ({ page }) => {
    await searchField(page).fill('.*');

    await expect(page.getByRole('heading', { name: 'No destinations match' })).toBeVisible();
    await expect(activeCriteria(page)).toHaveText([/\.\*/]);
  });

  test('renders an HTML-like term as text and never as markup', async ({ page }) => {
    await searchField(page).fill('<b>Hunza</b>');

    await expect(page.getByRole('heading', { name: 'No destinations match' })).toBeVisible();
    await expect(activeCriteria(page)).toHaveText([/<b>Hunza<\/b>/]);
    await expect(page.locator('main b')).toHaveCount(0);
  });

  test('offers only the province values present in the content file, and narrows to the selected one', async ({
    page,
  }) => {
    const provinces = valuesOf('province');
    test.skip(
      provinces.length === 0,
      'data/destinations.json carries no province values yet; blocked on client content (see README).',
    );

    const filter = page.getByLabel('Province');
    await expect(filter.locator('option')).toHaveText(['All provinces', ...provinces]);

    const [province] = provinces;
    await filter.selectOption(province);
    const expected = destinations.filter((destination) => destination.province === province);

    await expect(cards(page)).toHaveCount(expected.length);
    for (const destination of expected) {
      await expect(cards(page).filter({ hasText: destination.name })).toHaveCount(1);
    }

    await page.getByRole('button', { name: 'Clear search and filters' }).click();
    await expect(filter).toHaveValue('');
    await expect(cards(page)).toHaveCount(destinations.length);
  });

  test('offers only the category values present in the content file, and narrows to the selected one', async ({
    page,
  }) => {
    const categories = valuesOf('category');
    test.skip(
      categories.length === 0,
      'data/destinations.json carries no category values yet; blocked on client content (see README).',
    );

    const filter = page.getByLabel('Category');
    await expect(filter.locator('option')).toHaveText(['All categories', ...categories]);

    const [category] = categories;
    await filter.selectOption(category);
    const expected = destinations.filter((destination) => destination.category === category);

    await expect(cards(page)).toHaveCount(expected.length);

    await page.getByRole('button', { name: 'Clear search and filters' }).click();
    await expect(filter).toHaveValue('');
    await expect(cards(page)).toHaveCount(destinations.length);
  });

  test('shows only what satisfies the search term and both filters at once', async ({ page }) => {
    const combinable = destinations.find(
      (destination): destination is ContentRecord & { province: string; category: string } =>
        typeof destination.province === 'string' && typeof destination.category === 'string',
    );
    test.skip(
      combinable === undefined,
      'data/destinations.json carries no province or category values yet; blocked on client content.',
    );
    if (combinable === undefined) {
      return; // Unreachable: test.skip above ends the test.
    }

    const term = combinable.name.slice(0, 3);
    await searchField(page).fill(term);
    await page.getByLabel('Province').selectOption(combinable.province);
    await page.getByLabel('Category').selectOption(combinable.category);

    const expected = destinations.filter(
      (destination) =>
        destination.name.toLowerCase().includes(term.toLowerCase()) &&
        destination.province === combinable.province &&
        destination.category === combinable.category,
    );

    await expect(cards(page)).toHaveCount(expected.length);
    await expect(cards(page).filter({ hasText: combinable.name })).toHaveCount(1);
  });

  test('announces the result count through a live region', async ({ page }) => {
    const liveRegion = page.getByRole('status');

    await expect(liveRegion).toHaveText(`Showing all ${destinations.length} destinations.`);

    await searchField(page).fill('hun');

    await expect(liveRegion).toHaveText(`Showing 1 destination of ${destinations.length}.`);
  });

  test('a several-hundred-character term does not break the layout at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });

    await searchField(page).fill('z'.repeat(500));

    await expect(page.getByRole('heading', { name: 'No destinations match' })).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test('the empty state has no serious or critical accessibility violations', async ({ page }) => {
    await searchField(page).fill('atlantis');
    await expect(page.getByRole('heading', { name: 'No destinations match' })).toBeVisible();

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
