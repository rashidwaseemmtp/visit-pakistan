import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const basePath = process.env.VITE_BASE_PATH ?? '/';
const distRoot = fileURLToPath(new URL('../dist', import.meta.url));

function readBuiltFile(name: string): string {
  return readFileSync(resolve(distRoot, name), 'utf8');
}

const contentTypes: Record<string, string | undefined> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function readInsideDist(filePath: string): Promise<Buffer | undefined> {
  if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${sep}`)) {
    return undefined;
  }

  try {
    return await readFile(filePath);
  } catch {
    return undefined;
  }
}

/**
 * `vite preview` has SPA history fallback: it answers any address with index.html and a 200,
 * so a test run against it passes whether or not 404.html was emitted. GitHub Pages does the
 * opposite — it serves 404.html with a 404 status for anything it cannot match, and redirects
 * the bare sub-path to its trailing-slash form. This server reproduces that shape over the
 * real dist/ output, so the deployed mechanism is exercised rather than the dev server's.
 */
function startPagesLikeServer(): Promise<Server> {
  const server = createServer((request, response) => {
    void (async () => {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);

      if (`${pathname}/` === basePath) {
        response.writeHead(301, { location: basePath });
        response.end();
        return;
      }

      const relative = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : undefined;
      const target =
        relative === undefined
          ? undefined
          : resolve(distRoot, relative === '' || relative.endsWith('/') ? `${relative}index.html` : relative);
      const body = target === undefined ? undefined : await readInsideDist(target);

      if (body && target) {
        response.writeHead(200, {
          'content-type': contentTypes[extname(target)] ?? 'application/octet-stream',
        });
        response.end(body);
        return;
      }

      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      response.end(readBuiltFile('404.html'));
    })();
  });

  return new Promise((started) => {
    server.listen(0, '127.0.0.1', () => started(server));
  });
}

test.describe('sub-path deployment', () => {
  test('the build emits a 404.html identical to index.html', () => {
    expect(readBuiltFile('404.html')).toBe(readBuiltFile('index.html'));
  });

  test('every URL in the built HTML is root-relative', () => {
    const urls = [...readBuiltFile('index.html').matchAll(/(?:src|href)="([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith('/')).toBe(true);
    }
  });

  test('every URL in the built HTML carries the base path', () => {
    // With the default base every root-relative URL starts with '/', so this assertion only
    // has teeth when the deployed base path is set. CI sets VITE_BASE_PATH=/visit-pakistan/.
    test.skip(basePath === '/', 'Vacuous unless VITE_BASE_PATH is set to the deployed sub-path.');

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

  test('the router renders the site’s own not-found page for an unknown path', async ({ page }) => {
    // Against the preview server this proves the router, not the host: the Pages-shaped
    // suite below is what proves 404.html is what the visitor actually receives.
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

test.describe('served the way GitHub Pages serves it', () => {
  let server: Server;
  let origin: string;

  test.beforeAll(async () => {
    server = await startPagesLikeServer();
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((closed) => server.close(() => closed()));
  });

  test('serves the destination list on direct entry under the base path', async ({ page }) => {
    const response = await page.goto(`${origin}${basePath}`);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Destinations' })).toBeVisible();
  });

  test('answers an unknown path with 404.html and a 404 status', async ({ page }) => {
    const response = await page.goto(`${origin}${basePath}nowhere/`);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to the destination list' })).toBeVisible();
  });

  test('does not rewrite the address it answered with the fallback', async ({ page }) => {
    await page.goto(`${origin}${basePath}nowhere/`);

    expect(new URL(page.url()).pathname).toBe(`${basePath}nowhere/`);
  });

  test('redirects the base path without a trailing slash to the list', async ({ page }) => {
    await page.goto(`${origin}${basePath.replace(/\/$/, '')}`);

    expect(new URL(page.url()).pathname).toBe(basePath);
    await expect(page.getByRole('heading', { level: 1, name: 'Destinations' })).toBeVisible();
  });
});
