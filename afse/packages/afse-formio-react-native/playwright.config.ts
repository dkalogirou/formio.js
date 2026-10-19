import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests of the page that runs inside the app's WebView, on a
 * phone-sized touch viewport. The test plays the native side of the bridge.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    screenshot: 'only-on-failure',
  },
});
