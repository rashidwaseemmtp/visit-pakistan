import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const basePath = process.env.VITE_BASE_PATH ?? '/';
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));

function readBuiltFile(name: string): string {
  return readFileSync(`${distDir}${name}`, 'utf8');
}

test.describe('sub-path deployment', () => {
  test('the build emits a 404.html identical to index.html', () => {
    expect(readBuiltFile('404.html')).toBe(readBuiltFile('index.html'));
  });

  test('every URL in the built HTML carries the base path', () => {
    const urls = [...readBuiltFile('index.html').matchAll(/(?:src|href)="([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith(basePath)).toBe(true);
    }
  });

  test('the destination list resolves on direct entry and makes no off-origin request', async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));

    const response = await page.goto('./');
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { level: 1, name: 'Destinations' })).toBeVisible();

    const origin = new URL(page.url()).origin;
    expect(requested.filter((url) => !url.startsWith(origin))).toEqual([]);
  });

  test('an unknown path under the base path renders the site’s own not-found page', async ({
    page,
  }) => {
    await page.goto('./nowhere/');

    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to the destination list' })).toBeVisible();
  });

  test('the base path resolves without a trailing slash', async ({ page, baseURL }) => {
    const withoutTrailingSlash = (baseURL ?? '').replace(/\/$/, '');

    await page.goto(withoutTrailingSlash);

    await expect(page.getByRole('heading', { level: 1, name: 'Destinations' })).toBeVisible();
  });
});
