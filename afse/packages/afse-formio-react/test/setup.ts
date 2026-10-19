import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia, which the renderer's input masks need at import time.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Not implemented by jsdom; the renderer scrolls to the first error on submit.
window.scrollTo = () => undefined;
