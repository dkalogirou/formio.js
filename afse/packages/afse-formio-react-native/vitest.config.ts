import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'react-native-webview': path('./test/mocks/react-native-webview.tsx'),
      'react-native': path('./test/mocks/react-native.tsx'),
      'afse-formio-react/schema': path('../afse-formio-react/src/schema.ts'),
      'afse-formio-ext/validators': path('../afse-formio-ext/src/validators/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
