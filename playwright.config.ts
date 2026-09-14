import { defineConfig, devices } from '@playwright/test';

const basePath = process.env.VITE_BASE_PATH ?? '/';
const previewUrl = `http://localhost:4173${basePath}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: previewUrl, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Builds before serving, so `npm run e2e` exits 0 on a clean checkout whatever order
    // the five scripts are run in, and so dist/ always matches VITE_BASE_PATH.
    command: 'npm run build && npm run preview',
    url: previewUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
