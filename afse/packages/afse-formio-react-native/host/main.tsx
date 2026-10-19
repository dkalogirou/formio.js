/**
 * The page that runs inside the WebView. It is a regular consumer of
 * afse-formio-react and talks to the native side only through `protocol.ts`.
 */
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AfseForm, AfseProvider, useAfseForm } from 'afse-formio-react';
import 'afse-formio-react/styles.css';
import './mobile.css';
import { decode, encode, type FromHost, type HostCommand, type HostConfig, type ToHost } from '../src/protocol';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(message: string): void };
    /** Called by the native side through `injectJavaScript`. */
    __afseReceive?: (raw: string) => void;
  }
}

const post = (message: FromHost) => window.ReactNativeWebView?.postMessage(encode(message));

window.addEventListener('error', (event) => post({ type: 'error', message: String(event.message) }));
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as { message?: string } | undefined;
  if (!Array.isArray(reason)) {
    post({ type: 'error', message: String(reason?.message ?? reason) });
  }
});

type Listener = (message: ToHost) => void;
let listener: Listener | null = null;
const early: ToHost[] = [];
window.__afseReceive = (raw) => {
  const message = decode<ToHost>(raw);
  if (!message) return;
  if (listener) listener(message);
  else early.push(message);
};

function applyTheme(config: HostConfig) {
  const { theme = {} } = config;
  const vars: Record<string, string | undefined> = {
    '--afse-primary': theme.primaryColor,
    '--afse-danger': theme.dangerColor,
    '--afse-radius': theme.radius === undefined ? undefined : `${theme.radius}px`,
    '--afse-font': theme.fontFamily,
    '--afse-mobile-bg': theme.backgroundColor,
    '--afse-mobile-text': theme.textColor,
    '--afse-mobile-font-size': theme.fontSize === undefined ? undefined : `${theme.fontSize}px`,
    '--afse-mobile-padding': theme.padding === undefined ? undefined : `${theme.padding}px`,
  };
  for (const [name, value] of Object.entries(vars)) {
    if (value === undefined) document.documentElement.style.removeProperty(name);
    else document.documentElement.style.setProperty(name, value);
  }
  document.documentElement.classList.toggle('afse-auto-height', config.autoHeight);
}

function reportHeight() {
  let last = 0;
  let frame = 0;
  const measure = () => {
    frame = 0;
    const height = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (height !== last) {
      last = height;
      post({ type: 'height', height });
    }
  };
  const observer = new ResizeObserver(() => {
    if (!frame) frame = requestAnimationFrame(measure);
  });
  observer.observe(document.body);
  return () => observer.disconnect();
}

function Host() {
  const [config, setConfig] = useState<HostConfig | null>(null);
  const form = useAfseForm();

  useEffect(() => {
    const run = async (id: number, command: HostCommand, args: unknown[]) => {
      try {
        let value: unknown;
        switch (command) {
          case 'submit':
            value = await form.submit();
            break;
          case 'validate':
            value = form.validate();
            break;
          case 'getData':
            value = form.getData();
            break;
          case 'setData':
            value = await form.setData(args[0] as Record<string, unknown>);
            break;
          case 'reset':
            value = form.reset();
            break;
          case 'goToPage':
            value = await form.goToPage(Number(args[0]));
            break;
        }
        post({ type: 'result', id, ok: true, value });
      } catch (error) {
        if (Array.isArray(error)) {
          post({ type: 'result', id, ok: false, message: 'The form has validation errors.', errors: error });
        } else {
          post({ type: 'result', id, ok: false, message: String((error as Error)?.message ?? error) });
        }
      }
    };
    listener = (message) => {
      if (message.type === 'configure') setConfig(message.config);
      else run(message.id, message.command, message.args);
    };
    early.splice(0).forEach(listener);
    post({ type: 'boot' });
    const stopHeight = reportHeight();
    return () => {
      listener = null;
      stopHeight();
    };
    // `form` only wraps a ref, so the first one stays valid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config) applyTheme(config);
  }, [config]);

  if (!config) {
    return null;
  }
  return (
    <AfseProvider baseUrl={config.baseUrl} projectUrl={config.projectUrl} language={config.language} translations={config.translations}>
      <AfseForm
        ref={form.ref}
        form={config.form}
        data={config.data}
        readOnly={config.readOnly}
        summary={config.summary}
        hideSubmitButton={config.hideSubmitButton}
        onReady={() => post({ type: 'ready' })}
        onSubmit={(submission) => post({ type: 'submit', submission })}
        onChange={(change) => post({ type: 'change', change })}
        onValidationError={(errors) => post({ type: 'validationError', errors })}
        onPageChange={(page) => post({ type: 'pageChange', page })}
        onCustomEvent={(name, data) => post({ type: 'customEvent', name, data })}
      />
    </AfseProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Host />
  </StrictMode>,
);
