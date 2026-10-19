import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Test against the extension's sources so both packages can change together.
      'afse-formio-ext/validators': fileURLToPath(new URL('../afse-formio-ext/src/validators/index.ts', import.meta.url)),
      'afse-formio-ext': fileURLToPath(new URL('../afse-formio-ext/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
