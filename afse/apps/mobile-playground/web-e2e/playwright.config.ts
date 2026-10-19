import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4310',
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx vite --config web-e2e/vite.config.ts',
    url: 'http://localhost:4310',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
