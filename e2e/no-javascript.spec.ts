import { expect, test } from '@playwright/test';

/**
 * The approved architecture puts the destinations in the markup at build time; this
 * repository renders them in the browser (docs/architecture-deviation-spa.md). This spec
 * pins the floor that deviation leaves: a stated message instead of a blank document.
 */
test.describe('with JavaScript turned off', () => {
  test.use({ javaScriptEnabled: false });

  test('states that the site needs JavaScript rather than rendering nothing', async ({ page }) => {
    await page.goto('./');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Visit Pakistan needs JavaScript' }),
    ).toBeVisible();
    await expect(page.getByText('Please turn JavaScript on and reload the page.')).toBeVisible();
  });
});
