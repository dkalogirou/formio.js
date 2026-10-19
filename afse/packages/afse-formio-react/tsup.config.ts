import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  // The engine stays a runtime dependency rather than being inlined, so the
  // app and the library always share one Formio instance.
  external: ['react', 'react-dom', /^@formio\//, 'afse-formio-ext'],
});
