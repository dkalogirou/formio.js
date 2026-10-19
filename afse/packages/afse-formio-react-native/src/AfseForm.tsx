import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { ActivityIndicator, Linking, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type {
  AfseChange,
  AfseFormData,
  AfseFormSource,
  AfseLanguage,
  AfseSubmission,
  AfseTranslations,
  AfseValidationError,
} from 'afse-formio-react/schema';
import { HOST_HTML } from './generated/host-html';
import { decode, encode, type AfseMobileTheme, type FromHost, type HostCommand, type HostConfig, type ToHost } from './protocol';
import { useAfseConfig } from './AfseProvider';

export interface AfseFormProps<TData extends AfseFormData = AfseFormData> {
  /** The form definition (from `defineForm`, the web builder or your API), or a form URL. */
  form: AfseFormSource;
  /** Values to show in the form. Updating it replaces the form's data. */
  data?: Partial<TData>;
  language?: AfseLanguage;
  translations?: AfseTranslations;
  readOnly?: boolean;
  /** Shows values as text instead of inputs (review screens). */
  summary?: boolean;
  /** Hides the form's own submit buttons, e.g. when you submit from a native button. */
  hideSubmitButton?: boolean;
  /** Colours, font and spacing of the form. */
  theme?: AfseMobileTheme;
  /**
   * `false` (default): the form fills its container and scrolls by itself.
   * `true`: the form grows to fit its content; use it inside a ScrollView.
   */
  autoHeight?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Shown until the form is ready. Defaults to a spinner. */
  loading?: ReactNode;
  onSubmit?: (submission: AfseSubmission<TData>) => void;
  onChange?: (change: AfseChange<TData>) => void;
  onValidationError?: (errors: AfseValidationError[]) => void;
  onPageChange?: (page: number) => void;
  onCustomEvent?: (name: string, data: TData) => void;
  onReady?: () => void;
  /** Unexpected failures inside the form page. Defaults to `console.warn`. */
  onError?: (message: string) => void;
}

/**
 * Imperative handle of the mobile `AfseForm`. Same methods as the web handle;
 * all of them are async because the form lives in a WebView.
 */
export interface AfseMobileFormHandle<TData extends AfseFormData = AfseFormData> {
  /** Validates and submits. Rejects with `AfseValidationError[]` when the form is invalid. */
  submit(): Promise<AfseSubmission<TData>>;
  /** Shows and returns the validation errors (empty when valid). */
  validate(): Promise<AfseValidationError[]>;
  getData(): Promise<TData>;
  setData(data: Partial<TData>): Promise<void>;
  reset(): Promise<void>;
  goToPage(page: number): Promise<void>;
}

type Pending = { resolve: (value: unknown) => void; reject: (reason: unknown) => void };

function AfseFormInner<TData extends AfseFormData = AfseFormData>(
  props: AfseFormProps<TData>,
  ref: ForwardedRef<AfseMobileFormHandle<TData>>,
) {
  const defaults = useAfseConfig();
  const {
    form,
    data,
    language = defaults.language,
    translations,
    readOnly = false,
    summary = false,
    hideSubmitButton = false,
    theme,
    autoHeight = false,
    style,
    testID,
    loading,
  } = props;

  const webView = useRef<WebView>(null);
  const booted = useRef(false);
  const lastConfig = useRef<string | null>(null);
  const pending = useRef(new Map<number, Pending>());
  const nextId = useRef(1);
  const latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const config = useMemo<HostConfig>(
    () => ({
      form,
      data: data as Record<string, unknown> | undefined,
      language,
      translations: mergeTranslations(defaults.translations, translations),
      readOnly,
      summary,
      hideSubmitButton,
      autoHeight,
      theme: { ...defaults.theme, ...theme },
      baseUrl: defaults.baseUrl,
      projectUrl: defaults.projectUrl,
    }),
    [form, data, language, translations, readOnly, summary, hideSubmitButton, autoHeight, theme, defaults],
  );

  const send = useCallback((message: ToHost) => {
    // A JSON string literal is valid JavaScript, so this cannot inject code.
    webView.current?.injectJavaScript(`window.__afseReceive(${JSON.stringify(encode(message))});true;`);
  }, []);

  const sendConfig = useCallback(
    (next: HostConfig) => {
      const serialized = JSON.stringify(next);
      if (serialized !== lastConfig.current) {
        lastConfig.current = serialized;
        send({ type: 'configure', config: next });
      }
    },
    [send],
  );

  useEffect(() => {
    if (booted.current) {
      sendConfig(config);
    }
  }, [config, sendConfig]);

  useEffect(() => {
    const calls = pending.current;
    return () => {
      calls.forEach(({ reject }) => reject(new Error('AfseForm was unmounted.')));
      calls.clear();
    };
  }, []);

  const call = useCallback(
    (command: HostCommand, ...args: unknown[]) =>
      new Promise<unknown>((resolve, reject) => {
        if (!booted.current) {
          reject(new Error('AfseForm is not ready yet. Wait for onReady before using the form handle.'));
          return;
        }
        const id = nextId.current++;
        pending.current.set(id, { resolve, reject });
        send({ type: 'command', id, command, args });
      }),
    [send],
  );

  useImperativeHandle(
    ref,
    (): AfseMobileFormHandle<TData> => ({
      submit: () => call('submit') as Promise<AfseSubmission<TData>>,
      validate: () => call('validate') as Promise<AfseValidationError[]>,
      getData: () => call('getData') as Promise<TData>,
      setData: (next) => call('setData', next).then(() => undefined),
      reset: () => call('reset').then(() => undefined),
      goToPage: (page) => call('goToPage', page).then(() => undefined),
    }),
    [call],
  );

  const onMessage = (event: WebViewMessageEvent) => {
    const message = decode<FromHost>(event.nativeEvent.data);
    if (!message) {
      return;
    }
    const handlers = latest.current;
    switch (message.type) {
      case 'boot':
        // Also covers the page reloading (e.g. after the OS reclaimed the WebView).
        booted.current = true;
        lastConfig.current = null;
        setReady(false);
        sendConfig(config);
        break;
      case 'ready':
        setReady(true);
        handlers.onReady?.();
        break;
      case 'submit':
        handlers.onSubmit?.(message.submission as AfseSubmission<TData>);
        break;
      case 'change':
        handlers.onChange?.(message.change as AfseChange<TData>);
        break;
      case 'validationError':
        handlers.onValidationError?.(message.errors);
        break;
      case 'pageChange':
        handlers.onPageChange?.(message.page);
        break;
      case 'customEvent':
        handlers.onCustomEvent?.(message.name, message.data as TData);
        break;
      case 'height':
        setHeight(message.height);
        break;
      case 'result': {
        const call = pending.current.get(message.id);
        pending.current.delete(message.id);
        if (!call) break;
        if (message.ok) call.resolve(message.value);
        else call.reject(message.errors ?? new Error(message.message));
        break;
      }
      case 'error':
        (handlers.onError ?? ((m: string) => console.warn(`[AfseForm] ${m}`)))(message.message);
        break;
    }
  };

  return (
    <View style={[autoHeight ? { height: height ?? 1 } : styles.fill, style]} testID={testID}>
      <WebView
        ref={webView}
        source={{ html: HOST_HTML, baseUrl: defaults.baseUrl }}
        originWhitelist={['*']}
        onMessage={onMessage}
        scrollEnabled={!autoHeight}
        nestedScrollEnabled={!autoHeight}
        keyboardDisplayRequiresUserAction={false}
        hideKeyboardAccessoryView
        setSupportMultipleWindows={false}
        allowsLinkPreview={false}
        onShouldStartLoadWithRequest={(request) => {
          // Keep the form page in place (embedded frames such as reCAPTCHA may load);
          // open links the user follows in the system browser instead.
          if (request.isTopFrame === false || isFormPage(request.url, defaults.baseUrl)) {
            return true;
          }
          if (/^(https?|mailto|tel):/i.test(request.url)) {
            Linking.openURL(request.url).catch(() => undefined);
          }
          return false;
        }}
        style={styles.webView}
        testID={testID ? `${testID}-webview` : undefined}
      />
      {!ready && <View style={styles.loading}>{loading ?? <ActivityIndicator />}</View>}
    </View>
  );
}

function isFormPage(url: string, baseUrl?: string): boolean {
  if (/^(about:|data:)/.test(url)) {
    return true;
  }
  const strip = (u: string) => u.replace(/[#?].*$/, '').replace(/\/+$/, '');
  return Boolean(baseUrl) && strip(url) === strip(baseUrl!);
}

function mergeTranslations(...sources: (AfseTranslations | undefined)[]): AfseTranslations | undefined {
  const present = sources.filter((s): s is AfseTranslations => Boolean(s));
  if (!present.length) return undefined;
  const merged: AfseTranslations = {};
  for (const source of present) {
    for (const [lang, messages] of Object.entries(source)) {
      merged[lang] = { ...merged[lang], ...messages };
    }
  }
  return merged;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  webView: { flex: 1, backgroundColor: 'transparent' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});

/**
 * Shows an AFSE form in a React Native app. Same props as the web `AfseForm`,
 * plus `theme` and `autoHeight`.
 */
export const AfseForm = forwardRef(AfseFormInner) as <TData extends AfseFormData = AfseFormData>(
  props: AfseFormProps<TData> & { ref?: Ref<AfseMobileFormHandle<TData>> },
) => ReactElement;
