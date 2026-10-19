#!/usr/bin/env node
/**
 * Enforces the library boundaries:
 *
 *   app ──> afse-formio-react ──(src/internal only)──> afse-formio-ext ──> @formio/js
 *                             └─(src/internal only)──> @formio/js, @formio/react
 *
 * 1. Only afse-formio-react/src/internal may import the engine or the extension.
 * 2. afse-formio-react's published types must not mention them either.
 * 3. afse-formio-ext uses the engine's public entry points only and knows nothing about React.
 * 4. Web apps import afse-formio-react only (plus its stylesheet).
 * 5. afse-formio-react's `schema` entry stays free of the engine, so it can run on React Native.
 * 6. afse-formio-react-native's native code uses only that `schema` entry; its WebView page
 *    (host/) consumes the public afse-formio-react API like any web app.
 * 7. Mobile apps import afse-formio-react-native only.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const ENGINE = /^@formio\//;
const EXTENSION = /^afse-formio-ext(\/|$)/;
const REACT_LIB = /^afse-formio-react(\/|$)/;
const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|@import\s+['"]([^'"]+)['"]/g;

function files(dir, extensions) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'node_modules' || name === 'dist') return [];
    if (statSync(path).isDirectory()) return files(path, extensions);
    return extensions.some((ext) => name.endsWith(ext)) ? [path] : [];
  });
}

function imports(path) {
  return [...readFileSync(path, 'utf8').matchAll(IMPORT_RE)].map((m) => m.slice(1).find(Boolean));
}

const violations = [];
const report = (path, message) => violations.push(`${relative(root, path)}: ${message}`);
const code = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

// 1. React library sources
const reactSrc = join(root, 'packages/afse-formio-react/src');
for (const path of files(reactSrc, code)) {
  const internal = relative(reactSrc, path).split(sep)[0] === 'internal';
  for (const spec of imports(path)) {
    if (!internal && (ENGINE.test(spec) || EXTENSION.test(spec))) {
      report(path, `imports '${spec}'; only src/internal may talk to the engine or the extension`);
    }
  }
}

// 2. React library published types
const reactDist = join(root, 'packages/afse-formio-react/dist');
const declarations = files(reactDist, ['.d.ts', '.d.cts']);
if (!declarations.length) {
  console.warn('check-boundaries: afse-formio-react is not built; skipping published type checks.');
}
for (const path of declarations) {
  const text = readFileSync(path, 'utf8');
  if (/@formio\/|afse-formio-ext/.test(text)) {
    report(path, 'published types reference the engine or the extension');
  }
}

// 3. Extension sources
for (const path of files(join(root, 'packages/afse-formio-ext/src'), code)) {
  for (const spec of imports(path)) {
    if (/^@formio\/[^/]+\/.+/.test(spec)) report(path, `deep import '${spec}'; use the engine's public entry point`);
    if (/^react(-dom)?(\/|$)/.test(spec) || REACT_LIB.test(spec)) report(path, `imports '${spec}'; the extension must stay framework-agnostic`);
  }
}

// 4. Web apps
for (const path of files(join(root, 'apps'), [...code, '.css']).filter((p) => !p.includes(`${sep}mobile-playground${sep}`))) {
  for (const spec of imports(path)) {
    if (ENGINE.test(spec) || EXTENSION.test(spec)) report(path, `imports '${spec}'; apps must go through afse-formio-react`);
    if (REACT_LIB.test(spec) && !/^afse-formio-react(\/styles\.css)?$/.test(spec)) report(path, `deep import '${spec}'`);
  }
}

// 5. Platform-free schema entry (built output, so transitive imports count too)
const schemaBundle = join(root, 'packages/afse-formio-react/dist/schema.js');
if (existsSync(schemaBundle)) {
  for (const spec of imports(schemaBundle)) {
    if (ENGINE.test(spec) || (EXTENSION.test(spec) && spec !== 'afse-formio-ext/validators') || /^react/.test(spec)) {
      report(schemaBundle, `imports '${spec}'; the schema entry must not depend on the engine, the components or React`);
    }
  }
}

// 6. React Native library
const NATIVE_ALLOWED = /^(react|react\/jsx-runtime|react-native|react-native-webview|afse-formio-react\/schema)$/;
const nativeRoot = join(root, 'packages/afse-formio-react-native');
for (const path of files(join(nativeRoot, 'src'), code)) {
  for (const spec of imports(path)) {
    if (!spec.startsWith('.') && !NATIVE_ALLOWED.test(spec)) {
      report(path, `imports '${spec}'; native code may only use React Native, the WebView and afse-formio-react/schema`);
    }
  }
}
for (const path of files(join(nativeRoot, 'host'), [...code, '.css'])) {
  for (const spec of imports(path)) {
    if (ENGINE.test(spec) || EXTENSION.test(spec)) report(path, `imports '${spec}'; the WebView page must go through afse-formio-react`);
    if (spec.startsWith('.') && !/^\.\/|^\.\.\/src\/protocol$/.test(spec)) report(path, `imports '${spec}'; the page may only share protocol.ts with native code`);
  }
}
for (const path of files(join(nativeRoot, 'dist'), ['.d.ts', '.d.mts'])) {
  if (/@formio\/|afse-formio-ext/.test(readFileSync(path, 'utf8'))) report(path, 'published types reference the engine or the extension');
}

// 7. Mobile apps
for (const path of files(join(root, 'apps/mobile-playground'), code)) {
  for (const spec of imports(path)) {
    if (ENGINE.test(spec) || EXTENSION.test(spec) || REACT_LIB.test(spec)) {
      report(path, `imports '${spec}'; mobile apps must go through afse-formio-react-native`);
    }
  }
}

if (violations.length) {
  console.error(`Boundary violations (${violations.length}):\n  ${violations.join('\n  ')}`);
  process.exit(1);
}
console.log('check-boundaries: OK');
