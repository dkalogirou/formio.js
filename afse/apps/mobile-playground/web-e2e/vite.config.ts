import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** Runs the mobile app with react-native-web so Playwright can drive it end to end. */
export default defineConfig({
  root: here('.'),
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: /^react-native-webview$/, replacement: here('./WebViewShim.tsx') },
      { find: /^expo-status-bar$/, replacement: here('./StatusBarShim.tsx') },
    ],
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.mjs', '.js', '.jsx', '.json'],
  },
  define: { __DEV__: 'false', global: 'globalThis' },
  optimizeDeps: { esbuildOptions: { resolveExtensions: ['.web.js', '.js', '.mjs'] } },
  server: { port: 4310, strictPort: true },
});
