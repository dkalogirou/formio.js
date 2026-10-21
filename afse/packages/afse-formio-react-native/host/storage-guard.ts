/**
 * Pages loaded from an HTML string can end up with an opaque origin (e.g.
 * Android WebView without a base URL), where reading `document.cookie` or
 * `localStorage` throws and would stop the form from loading. Swap in
 * in-memory versions when the real ones are unusable. Imported first.
 */
function usable(read: () => unknown): boolean {
  try {
    read();
    return true;
  } catch {
    return false;
  }
}

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(String(key)) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(String(key)),
    setItem: (key, value) => void items.set(String(key), String(value)),
  };
}

if (!usable(() => document.cookie)) {
  let cookies = '';
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => cookies,
    set: (value: string) => {
      const pair = String(value).split(';')[0];
      const name = pair.split('=')[0];
      const others = cookies.split('; ').filter((c) => c && c.split('=')[0] !== name);
      cookies = [...others, pair].join('; ');
    },
  });
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (!usable(() => window[name]?.getItem('afse'))) {
    Object.defineProperty(window, name, { configurable: true, value: memoryStorage() });
  }
}

export {};
